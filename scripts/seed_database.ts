import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

async function seed() {
  const configPath = path.resolve('firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('firebase-applet-config.json not found');
    return;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(config);
  const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

  console.log(`[Seed] Connected to Firestore Database: ${config.firestoreDatabaseId}`);

  // Datasets to seed
  const targets = ['208', '207'];

  for (const target of targets) {
    const jsonPath = path.resolve(`src/data/part${target}.json`);
    if (!fs.existsSync(jsonPath)) continue;

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`[Seed] Syncing Dataset ${target} (${data.length} electors)...`);

    // Parent doc
    await setDoc(doc(db, 'datasets', target), {
      id: target,
      name: `Hebbal Assembly Constituency - Part No: ${target}`,
      partNo: target,
      constituency: '158 - HEBBAL (GEN)',
      totalElectors: data.length,
      createdAt: new Date().toISOString()
    }, { merge: true });

    // Seed first batch of electors (up to 200 records for fast initial seeding)
    const seedRecords = data.slice(0, 200);
    const batch = writeBatch(db);
    for (const record of seedRecords) {
      const electorDocId = `s_${record["Serial Number"]}`;
      const electorRef = doc(db, 'datasets', target, 'electors', electorDocId);
      batch.set(electorRef, {
        dataset: target,
        serialNumber: record["Serial Number"],
        voterId: record["Voter ID"],
        name: record["Name"],
        relation: record["Relation"],
        address: record["address"],
        age: Number(record["Age"]) || 30,
        gender: record["Gender"]
      });
    }
    await batch.commit();
    console.log(`[Seed] Successfully committed batch to /datasets/${target}/electors (${seedRecords.length} records)`);
  }

  console.log('[Seed] Database seeding complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
