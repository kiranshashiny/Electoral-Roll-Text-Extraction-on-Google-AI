import React, { useState } from 'react';
import { Terminal, Folder, Check, Copy, Cpu, Database, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  outputsDir: string;
  onOpenOutputs: () => void;
  onOpenConsole: () => void;
}

export const Header: React.FC<HeaderProps> = ({ outputsDir, onOpenOutputs, onOpenConsole }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(outputsDir);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  Electoral Roll PDF Parser & CSV Extractor
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Firestore Connected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                158 - HEBBAL (GEN) · High-precision card matrix tokenizer · RFC 4180 CSV export
              </p>
            </div>
          </div>

          {/* Location of Output Folder & Fast Navigation */}
          <div className="flex items-center space-x-3">
            {/* Output Folder Location Badge with Copy */}
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 space-x-2">
              <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-slate-400 font-medium">Output:</span>
              <code className="font-mono text-slate-800 text-[11px] truncate max-w-xs">{outputsDir}</code>
              <button
                onClick={handleCopyPath}
                title="Copy output folder path"
                className="p-1 hover:text-indigo-600 hover:bg-slate-200 rounded transition-colors text-slate-500 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Quick action buttons */}
            <button
              onClick={onOpenOutputs}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Output Files</span>
            </button>

            <button
              onClick={onOpenConsole}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>Console</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
