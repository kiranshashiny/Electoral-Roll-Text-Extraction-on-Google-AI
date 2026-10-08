import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ElectorRecord } from '../data/types';

export interface DatabaseDatasetSummary {
  id: string;
  name: string;
  partNo: string;
  totalElectors: number;
  createdAt: string;
  syncedCount?: number;
}

/**
 * Sync an extracted dataset (e.g. 208, 207) and its voter records into Firestore
 */
export async function syncDatasetToDatabase(
  datasetId: string,
  records: ElectorRecord[],
  onProgress?: (syncedCount: number, total: number, message: string) => void
): Promise<{ success: boolean; totalSynced: number }> {
  const sanitizedId = datasetId.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  onProgress?.(0, records.length, `Initializing Firestore sync for Dataset ${sanitizedId}...`);

  // 1. Create or update parent dataset document
  const datasetRef = doc(db, 'datasets', sanitizedId);
  const datasetDocData = {
    id: sanitizedId,
    name: `Hebbal Assembly Constituency - Part No: ${sanitizedId}`,
    partNo: sanitizedId,
    constituency: '158 - HEBBAL (GEN)',
    totalElectors: records.length,
    createdAt: new Date().toISOString()
  };

  await setDoc(datasetRef, datasetDocData, { merge: true });
  onProgress?.(1, records.length, `Saved dataset parent doc /datasets/${sanitizedId}`);

  // 2. Batch write individual electors into subcollection /datasets/{datasetId}/electors/{serialNumber}
  // Firestore allows up to 500 operations per batch; we use chunks of 250 for optimal reliability
  const CHUNK_SIZE = 250;
  let syncedSoFar = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const electorDocId = `s_${record.serialNumber}`;
      const electorRef = doc(db, 'datasets', sanitizedId, 'electors', electorDocId);
      
      batch.set(electorRef, {
        dataset: sanitizedId,
        serialNumber: record.serialNumber,
        voterId: record.voterId,
        name: record.name,
        relation: record.relation,
        address: record.address,
        age: Number(record.age) || 30,
        gender: record.gender
      });
    }

    await batch.commit();
    syncedSoFar += chunk.length;
    onProgress?.(
      syncedSoFar,
      records.length,
      `Committed batch of ${chunk.length} electors (${syncedSoFar}/${records.length} synced to Firestore)`
    );
  }

  return { success: true, totalSynced: syncedSoFar };
}

/**
 * Fetch electors for a dataset from Firestore
 */
export async function fetchElectorsFromDatabase(datasetId: string, maxRecords: number = 1000): Promise<ElectorRecord[]> {
  const sanitizedId = datasetId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const electorsCol = collection(db, 'datasets', sanitizedId, 'electors');
  const q = query(electorsCol, orderBy('serialNumber', 'asc'), limit(maxRecords));
  
  const snap = await getDocs(q);
  const results: ElectorRecord[] = [];

  snap.forEach((d) => {
    const data = d.data();
    results.push({
      dataset: data.dataset || sanitizedId,
      serialNumber: data.serialNumber,
      voterId: data.voterId,
      name: data.name,
      relation: data.relation,
      address: data.address,
      age: data.age,
      gender: data.gender
    });
  });

  return results;
}

/**
 * Fetch summary of all datasets currently in Firestore
 */
export async function fetchDatasetsFromDatabase(): Promise<DatabaseDatasetSummary[]> {
  const datasetsCol = collection(db, 'datasets');
  const snap = await getDocs(datasetsCol);
  const results: DatabaseDatasetSummary[] = [];

  snap.forEach((d) => {
    const data = d.data();
    results.push({
      id: d.id,
      name: data.name || `Dataset ${d.id}`,
      partNo: data.partNo || d.id,
      totalElectors: data.totalElectors || 0,
      createdAt: data.createdAt || ''
    });
  });

  return results;
}
