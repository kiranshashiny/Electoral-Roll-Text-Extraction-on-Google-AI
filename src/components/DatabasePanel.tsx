import React, { useState, useEffect } from 'react';
import { Database, CloudUpload, RefreshCw, CheckCircle2, AlertCircle, ArrowDownCircle, Layers, Server } from 'lucide-react';
import {
  syncDatasetToDatabase,
  fetchDatasetsFromDatabase,
  DatabaseDatasetSummary
} from '../services/databaseService';
import { ElectorRecord } from '../data/types';

interface DatabasePanelProps {
  currentDatasetId: string;
  currentRecords: ElectorRecord[];
  onLoadFromDatabase: (datasetId: string) => void;
  onLogMessage?: (level: 'info' | 'success' | 'warn' | 'compile', msg: string) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({
  currentDatasetId,
  currentRecords,
  onLoadFromDatabase,
  onLogMessage
}) => {
  const [dbDatasets, setDbDatasets] = useState<DatabaseDatasetSummary[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const loadDbSummaries = async () => {
    try {
      const summaries = await fetchDatasetsFromDatabase();
      setDbDatasets(summaries);
    } catch (err: any) {
      console.warn('Could not list datasets from Firestore:', err);
    }
  };

  useEffect(() => {
    loadDbSummaries();
  }, []);

  const handleSyncCurrent = async () => {
    if (!currentRecords.length) return;
    setIsSyncing(true);
    setSyncStatus(`Syncing ${currentRecords.length} electors to Firestore...`);
    onLogMessage?.('compile', `Starting database batch write for Dataset ${currentDatasetId}...`);

    try {
      const res = await syncDatasetToDatabase(
        currentDatasetId,
        currentRecords,
        (synced, total, message) => {
          setSyncProgress({ current: synced, total });
          setSyncStatus(message);
          onLogMessage?.('info', `[Firestore] ${message}`);
        }
      );

      if (res.success) {
        setSyncStatus(`Successfully stored ${res.totalSynced} records in database.`);
        setLastSyncedTime(new Date().toLocaleTimeString());
        onLogMessage?.('success', `[Firestore] Dataset ${currentDatasetId} committed: ${res.totalSynced} electors in collection /datasets/${currentDatasetId}/electors`);
        await loadDbSummaries();
      }
    } catch (err: any) {
      setSyncStatus(`Sync failed: ${err.message}`);
      onLogMessage?.('warn', `[Firestore Error] ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Firestore Database Storage
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Persist electoral records into collections: <code className="text-indigo-600 font-mono">/datasets/{'{partNo}'}/electors</code>
            </p>
          </div>
        </div>

        {/* Sync Current Dataset Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncCurrent}
            disabled={isSyncing || currentRecords.length === 0}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
              isSyncing || currentRecords.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudUpload className="w-3.5 h-3.5" />
            )}
            <span>
              {isSyncing
                ? `Syncing (${syncProgress.current}/${syncProgress.total})...`
                : `Store Dataset ${currentDatasetId} in Database`}
            </span>
          </button>

          <button
            onClick={loadDbSummaries}
            title="Refresh database records"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className={`mt-3 p-3 rounded-lg text-xs flex items-center justify-between border ${
          syncStatus.includes('failed')
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-indigo-50/60 text-indigo-900 border-indigo-200/60'
        }`}>
          <div className="flex items-center space-x-2">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{syncStatus}</span>
          </div>
          {lastSyncedTime && (
            <span className="text-[11px] text-slate-500">Synced at {lastSyncedTime}</span>
          )}
        </div>
      )}

      {/* Stored Datasets in Database List */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
          <span>Datasets Stored in Cloud Database:</span>
          <span className="text-slate-400 text-[11px] font-normal">
            Target Collection: <code className="font-mono text-slate-600">/datasets</code>
          </span>
        </div>

        {dbDatasets.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
            Click <strong>"Store Dataset {currentDatasetId} in Database"</strong> above to write the extracted records into Firestore.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dbDatasets.map((ds) => (
              <div
                key={ds.id}
                className="p-3 border border-slate-200 rounded-lg bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-mono font-bold text-xs text-slate-900">Part {ds.partNo}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Total: <strong className="text-slate-700">{ds.totalElectors}</strong> electors in DB
                  </div>
                </div>

                <button
                  onClick={() => onLoadFromDatabase(ds.partNo || ds.id)}
                  className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:text-indigo-900 bg-white border border-slate-200 hover:border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
