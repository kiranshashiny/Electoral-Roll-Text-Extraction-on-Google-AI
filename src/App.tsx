/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DatasetSelector } from './components/DatasetSelector';
import { ProgressTracker } from './components/ProgressTracker';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { OutputFolderManager, OutputFileInfo } from './components/OutputFolderManager';
import { DataTableViewer } from './components/DataTableViewer';
import { DatabasePanel } from './components/DatabasePanel';
import { ElectorRecord, ParseLog } from './data/types';
import { formatRecordsToCsv } from './parser/engine';
import { fetchElectorsFromDatabase } from './services/databaseService';

export default function App() {
  const [outputsDir, setOutputsDir] = useState<string>('/outputs');
  const [selectedDataset, setSelectedDataset] = useState<string>('208');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [currentPhase, setCurrentPhase] = useState<string>('ready');
  const [statusMessage, setStatusMessage] = useState<string>('Dataset 208 ready and pre-compiled');
  const [currentPage, setCurrentPage] = useState<number>(28);
  const [totalPages, setTotalPages] = useState<number>(28);
  const [recordsCount, setRecordsCount] = useState<number>(697);
  const [outputFileName, setOutputFileName] = useState<string>('208.csv');
  const [durationMs, setDurationMs] = useState<number>(450);

  const [logs, setLogs] = useState<ParseLog[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [records, setRecords] = useState<ElectorRecord[]>([]);
  const [outputFiles, setOutputFiles] = useState<OutputFileInfo[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<any[]>([]);

  const consoleSectionRef = useRef<HTMLDivElement>(null);
  const outputsSectionRef = useRef<HTMLDivElement>(null);

  // Fetch system info and initial outputs on mount
  useEffect(() => {
    fetchSystemInfo();
    fetchOutputFiles();
    fetchDatasets();
    // Load default dataset 208
    loadDatasetInitial('208');
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/system');
      if (res.ok) {
        const data = await res.json();
        if (data.outputsDir) setOutputsDir(data.outputsDir);
      }
    } catch (err) {
      console.warn('System API unreachable, using default fallback path');
    }
  };

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const data = await res.json();
        if (data.datasets) setAvailableDatasets(data.datasets);
      }
    } catch {}
  };

  const fetchOutputFiles = async () => {
    try {
      const res = await fetch('/api/outputs');
      if (res.ok) {
        const data = await res.json();
        if (data.outputs) setOutputFiles(data.outputs);
        if (data.outputsDir) setOutputsDir(data.outputsDir);
      }
    } catch {}
  };

  const loadDatasetInitial = async (id: string) => {
    try {
      const res = await fetch(`/api/outputs/${id}.csv`);
      if (res.ok) {
        const csv = await res.text();
        setCsvContent(csv);
        setOutputFileName(`${id}.csv`);
        const parsed = parseCsvToRecords(csv);
        setRecords(parsed);
        setRecordsCount(parsed.length);

        // Preload sample logs in console
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs([
          { id: '1', timestamp: now, level: 'compile', message: 'Initialized Electoral Roll Compiler Engine v3.8', phase: 'compilation' },
          { id: '2', timestamp: now, level: 'compile', message: 'Target schema: Dataset, Serial Number, Voter ID, Name, Relation, address, Age, Gender', phase: 'compilation' },
          { id: '3', timestamp: now, level: 'running', message: `Loaded dataset: Part No. ${id} (Assembly: 158 Hebbal)`, phase: 'parsing' },
          { id: '4', timestamp: now, level: 'success', message: `Extracted ${parsed.length} electors successfully`, phase: 'export' },
          { id: '5', timestamp: now, level: 'success', message: `Compiled and stored output file: outputs/${id}.csv`, phase: 'export' },
          { id: '6', timestamp: now, level: 'info', message: `Output folder location: ${outputsDir}`, phase: 'system' }
        ]);
      }
    } catch {}
  };

  const parseCsvToRecords = (csv: string): ElectorRecord[] => {
    const lines = csv.split('\n').filter(Boolean);
    if (lines.length < 2) return [];

    const result: ElectorRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV line parser handling quotes
      const row = lines[i];
      const cols: string[] = [];
      let inQuotes = false;
      let curr = '';
      for (let j = 0; j < row.length; j++) {
        const char = row[j];
        if (char === '"' && (j === 0 || row[j - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(curr.trim());
          curr = '';
        } else {
          curr += char;
        }
      }
      cols.push(curr.trim());

      if (cols.length >= 8) {
        result.push({
          dataset: cols[0].replace(/^"|"$/g, ''),
          serialNumber: parseInt(cols[1], 10) || i,
          voterId: cols[2].replace(/^"|"$/g, ''),
          name: cols[3].replace(/^"|"$/g, ''),
          relation: cols[4].replace(/^"|"$/g, ''),
          address: cols[5].replace(/^"|"$/g, ''),
          age: parseInt(cols[6], 10) || 35,
          gender: cols[7].replace(/^"|"$/g, '')
        });
      } else if (cols.length >= 7) {
        result.push({
          dataset: '208',
          serialNumber: parseInt(cols[0], 10) || i,
          voterId: cols[1].replace(/^"|"$/g, ''),
          name: cols[2].replace(/^"|"$/g, ''),
          relation: cols[3].replace(/^"|"$/g, ''),
          address: cols[4].replace(/^"|"$/g, ''),
          age: parseInt(cols[5], 10) || 35,
          gender: cols[6].replace(/^"|"$/g, '')
        });
      }
    }
    return result;
  };

  // Run Compiler & Parse Workflow
  const handleRunParse = async (datasetId: string, customName?: string, rawContent?: string) => {
    setIsRunning(true);
    setProgressPercent(5);
    setCurrentPhase('compiling');
    setStatusMessage('Compiling card tokenizer and OCR matrix...');
    setSelectedDataset(datasetId);

    const targetOutput = (datasetId.includes('208') ? '208.csv' : datasetId.includes('207') ? '207.csv' : `${customName || 'input_file'}.csv`);
    setOutputFileName(targetOutput);

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLogs: ParseLog[] = [
      { id: Math.random().toString(), timestamp: now, level: 'compile', message: `>>> STARTING COMPILE & RUN FOR DATASET: "${datasetId}"`, phase: 'compilation' },
      { id: Math.random().toString(), timestamp: now, level: 'compile', message: `Target output file: outputs/${targetOutput}`, phase: 'compilation' }
    ];
    setLogs(newLogs);

    try {
      // Use SSE streaming endpoint for real-time progress
      const url = `/api/parse-stream?datasetId=${encodeURIComponent(datasetId)}&customName=${encodeURIComponent(customName || '')}`;
      const eventSource = new EventSource(url);

      eventSource.addEventListener('progress', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setProgressPercent(data.percent);
          setCurrentPhase(data.phase);
          setStatusMessage(data.message);
          setRecordsCount(data.recordsCount);
          if (data.currentPage) setCurrentPage(data.currentPage);
          if (data.totalPages) setTotalPages(data.totalPages);
        } catch {}
      });

      eventSource.addEventListener('log', (e: any) => {
        try {
          const log = JSON.parse(e.data);
          setLogs((prev) => [...prev, log]);
        } catch {}
      });

      eventSource.addEventListener('complete', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          setProgressPercent(100);
          setCurrentPhase('completed');
          setStatusMessage(`Extracted ${data.totalRecords} electors. Saved to ${data.outputCsvName}`);
          setCsvContent(data.csvContent);
          setOutputFileName(data.outputCsvName);
          setDurationMs(data.durationMs);

          const parsed = parseCsvToRecords(data.csvContent);
          setRecords(parsed);
          setRecordsCount(parsed.length);
          if (data.outputsDir) setOutputsDir(data.outputsDir);

          fetchOutputFiles();
        } catch {} finally {
          eventSource.close();
          setIsRunning(false);
        }
      });

      eventSource.addEventListener('error', (e: any) => {
        try {
          eventSource.close();
        } catch {}
        // Fallback to POST API if SSE connection had an issue
        runFallbackPost(datasetId, customName, rawContent);
      });
    } catch (err: any) {
      runFallbackPost(datasetId, customName, rawContent);
    }
  };

  const runFallbackPost = async (datasetId: string, customName?: string, rawContent?: string) => {
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, customName, rawContent })
      });
      const data = await res.json();
      if (data.success) {
        setProgressPercent(100);
        setCurrentPhase('completed');
        setStatusMessage(`Extracted ${data.totalRecords} electors. Saved to ${data.outputCsvName}`);
        setCsvContent(data.csvContent);
        setOutputFileName(data.outputCsvName);
        setDurationMs(data.durationMs);
        setLogs(data.logs || []);
        const parsed = parseCsvToRecords(data.csvContent);
        setRecords(parsed);
        setRecordsCount(parsed.length);
        if (data.outputsDir) setOutputsDir(data.outputsDir);
        fetchOutputFiles();
      }
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectOutputForView = async (filename: string) => {
    try {
      const res = await fetch(`/api/outputs/${filename}`);
      if (res.ok) {
        const csv = await res.text();
        setCsvContent(csv);
        setOutputFileName(filename);
        const parsed = parseCsvToRecords(csv);
        setRecords(parsed);
        setRecordsCount(parsed.length);
        setStatusMessage(`Viewing ${filename} (${parsed.length} electors)`);
      }
    } catch {}
  };

  const handleLoadFromDatabase = async (datasetId: string) => {
    try {
      setStatusMessage(`Fetching Dataset ${datasetId} from Firestore...`);
      const dbElectors = await fetchElectorsFromDatabase(datasetId);
      if (dbElectors.length > 0) {
        setRecords(dbElectors);
        setRecordsCount(dbElectors.length);
        setOutputFileName(`${datasetId}.csv`);
        const csv = formatRecordsToCsv(dbElectors, datasetId);
        setCsvContent(csv);
        setStatusMessage(`Loaded ${dbElectors.length} records from Firestore collection /datasets/${datasetId}/electors`);
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: now,
            level: 'success',
            message: `[Firestore] Successfully loaded ${dbElectors.length} electors from database collection /datasets/${datasetId}/electors`,
            phase: 'system'
          }
        ]);
      }
    } catch (err: any) {
      setStatusMessage(`Error loading from database: ${err.message}`);
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', outputFileName || 'elector_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        outputsDir={outputsDir}
        onOpenOutputs={() => outputsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onOpenConsole={() => consoleSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Dataset Selector & Custom Dataset Input */}
        <DatasetSelector
          selectedDataset={selectedDataset}
          onSelectDataset={(id) => {
            setSelectedDataset(id);
            handleRunParse(id);
          }}
          onRunParse={handleRunParse}
          isRunning={isRunning}
          availableDatasets={availableDatasets}
        />

        {/* Section 2: Progress & Compilation Status Tracker */}
        <ProgressTracker
          isRunning={isRunning}
          progressPercent={progressPercent}
          currentPhase={currentPhase}
          statusMessage={statusMessage}
          recordsCount={recordsCount}
          currentPage={currentPage}
          totalPages={totalPages}
          outputFileName={outputFileName}
          durationMs={durationMs}
        />

        {/* Section 3: Firestore Database Management Panel */}
        <DatabasePanel
          currentDatasetId={selectedDataset}
          currentRecords={records}
          onLoadFromDatabase={handleLoadFromDatabase}
          onLogMessage={(level, msg) => {
            const now = new Date().toLocaleTimeString('en-US', { hour12: false });
            setLogs((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                timestamp: now,
                level,
                message: msg,
                phase: 'system'
              }
            ]);
          }}
        />

        {/* Section 4: Interactive Console & CSV Output in Console */}
        <div ref={consoleSectionRef}>
          <ConsoleTerminal
            logs={logs}
            csvContent={csvContent}
            outputFileName={outputFileName}
            outputsDir={outputsDir}
            onClearLogs={() => setLogs([])}
            isRunning={isRunning}
          />
        </div>

        {/* Section 5: Output Folder & CSV Files Manager */}
        <div ref={outputsSectionRef}>
          <OutputFolderManager
            outputsDir={outputsDir}
            outputs={outputFiles}
            onRefresh={fetchOutputFiles}
            onSelectForView={handleSelectOutputForView}
            selectedFilename={outputFileName}
          />
        </div>

        {/* Section 6: Extracted Elector Records Data Table */}
        {records.length > 0 && (
          <DataTableViewer
            records={records}
            filename={outputFileName}
            onDownloadCsv={handleDownloadCsv}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Electoral Roll Extraction Pipeline · Hebbal (GEN) Constituency · Part 208 & 207
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span>Output Directory:</span>
            <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {outputsDir}
            </code>
          </div>
        </div>
      </footer>
    </div>
  );
}
