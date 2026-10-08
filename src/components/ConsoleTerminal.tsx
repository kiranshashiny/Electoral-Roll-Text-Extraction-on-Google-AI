import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Copy, Check, Download, Trash2, Maximize2, Minimize2, ArrowDown, Folder } from 'lucide-react';
import { ParseLog } from '../data/types';

interface ConsoleTerminalProps {
  logs: ParseLog[];
  csvContent: string;
  outputFileName: string;
  outputsDir: string;
  onClearLogs: () => void;
  isRunning: boolean;
}

export const ConsoleTerminal: React.FC<ConsoleTerminalProps> = ({
  logs,
  csvContent,
  outputFileName,
  outputsDir,
  onClearLogs,
  isRunning
}) => {
  const [activeView, setActiveView] = useState<'all' | 'csv' | 'compile'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, csvContent, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', outputFileName || 'elector_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(l => {
    if (activeView === 'compile') {
      return l.phase === 'compilation' || l.level === 'compile';
    }
    if (!searchQuery) return true;
    return l.message.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const csvLines = csvContent.split('\n').filter(Boolean);

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg font-mono transition-all ${
      isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'flex flex-col'
    }`}>
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
        {/* Left: Window controls & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="flex items-center space-x-2 border-l border-slate-800 pl-3">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-200">bash - electoral_parser_console</span>
            {isRunning && (
              <span className="inline-flex items-center space-x-1 text-[10px] text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>compiling/running</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle/Right: View Selector */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveView('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeView === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Execution Console
            </button>
            <button
              onClick={() => setActiveView('csv')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeView === 'csv' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CSV Output in Console ({csvLines.length} lines)
            </button>
            <button
              onClick={() => setActiveView('compile')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeView === 'compile' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compile Logs Only
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            {activeView === 'csv' ? (
              <>
                <button
                  onClick={handleCopyCsv}
                  title="Copy CSV to clipboard"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  {copiedCsv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy CSV</span>
                </button>
                <button
                  onClick={handleDownloadCsv}
                  title="Download CSV"
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCopyLogs}
                  title="Copy console logs"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onClearLogs}
                  title="Clear console"
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Maximize"}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Output Folder Location Header in Console */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <Folder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-amber-400 font-semibold">[OUTPUT FOLDER LOCATION]:</span>
          <span className="text-emerald-400 font-mono underline select-all">{outputsDir}</span>
          <span className="text-slate-500">/</span>
          <span className="text-indigo-300 font-semibold">{outputFileName || '208.csv'}</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
          <span>Format: RFC 4180</span>
          <span>·</span>
          <span>Columns: 8 (Dataset, Serial, Voter ID, Name, Relation, address, Age, Gender)</span>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className={`p-4 overflow-y-auto text-xs leading-relaxed select-text ${
        isExpanded ? 'flex-1' : 'h-[360px]'
      }`}>
        {activeView === 'csv' ? (
          /* CSV Output in Console View */
          <div>
            <div className="text-slate-400 pb-2 mb-2 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-emerald-400"># CSV STREAM FOR: {outputFileName}</span>
              <span className="text-slate-500">Total lines: {csvLines.length}</span>
            </div>
            {csvLines.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                No CSV data generated yet. Click "Compile & Extract" to run the parser.
              </div>
            ) : (
              <div className="space-y-0.5">
                {csvLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start hover:bg-slate-900/60 py-0.5 px-1 rounded font-mono ${
                      idx === 0 ? 'text-amber-300 font-semibold border-b border-slate-800/60 pb-1' : 'text-slate-300'
                    }`}
                  >
                    <span className="w-12 text-slate-600 select-none text-right pr-3 flex-shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="break-all whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Execution & Compilation Console Stream */
          <div className="space-y-1">
            <div className="text-slate-500 pb-2 border-b border-slate-800/60 text-[11px]">
              # Electoral Roll Card Tokenizer & Extractor - Assembly Constituency: 158 Hebbal
              <br />
              # Ready for automated dataset compilation and batch execution
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                Waiting for compilation stream...
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeClass = 'text-slate-400';
                let tag = log.level.toUpperCase();

                if (log.level === 'compile') {
                  badgeClass = 'text-sky-400 font-semibold';
                  tag = 'COMPILE';
                } else if (log.level === 'running') {
                  badgeClass = 'text-amber-400 font-semibold';
                  tag = 'RUNNING';
                } else if (log.level === 'success') {
                  badgeClass = 'text-emerald-400 font-semibold';
                  tag = 'SUCCESS';
                } else if (log.level === 'warn') {
                  badgeClass = 'text-rose-400 font-semibold';
                  tag = 'WARNING';
                }

                return (
                  <div key={log.id} className="flex items-start space-x-2 py-0.5 hover:bg-slate-900/50 px-1 rounded">
                    <span className="text-slate-600 text-[11px] select-none flex-shrink-0">
                      [{log.timestamp}]
                    </span>
                    <span className={`text-[11px] flex-shrink-0 w-16 font-semibold ${badgeClass}`}>
                      [{tag}]
                    </span>
                    <span className="text-slate-200 flex-1 break-words">
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}

            {isRunning && (
              <div className="flex items-center space-x-2 text-indigo-400 pt-2 text-[11px]">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="italic">Processing page matrix and streaming elector cards...</span>
              </div>
            )}

            <div ref={terminalBottomRef} />
          </div>
        )}
      </div>

      {/* Terminal Footer Info Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span>Engine: ECI Hebbal v3.8</span>
          <span>·</span>
          <span>CSV Delimiter: Comma (,)</span>
          <span>·</span>
          <span>Encoding: UTF-8</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
              autoScroll ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
