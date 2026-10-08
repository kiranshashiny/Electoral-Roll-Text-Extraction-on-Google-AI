import React, { useState } from 'react';
import { Folder, Download, Eye, Copy, Check, RefreshCw, FileSpreadsheet, HardDrive, ExternalLink } from 'lucide-react';

export interface OutputFileInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  sizeFormatted: string;
  rowCount: number;
  modifiedAt: string;
  downloadUrl: string;
}

interface OutputFolderManagerProps {
  outputsDir: string;
  outputs: OutputFileInfo[];
  onRefresh: () => void;
  onSelectForView: (filename: string) => void;
  selectedFilename?: string;
}

export const OutputFolderManager: React.FC<OutputFolderManagerProps> = ({
  outputsDir,
  outputs,
  onRefresh,
  onSelectForView,
  selectedFilename
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleCopyFolder = () => {
    navigator.clipboard.writeText(outputsDir);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFilePath = (filePath: string, filename: string) => {
    navigator.clipboard.writeText(filePath);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Output Folder & Generated CSV Files
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Extracted datasets stored in separate CSV files in the destination directory
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Files</span>
        </button>
      </div>

      {/* Prominent Output Folder Location Banner */}
      <div className="mt-4 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-start md:items-center space-x-2.5">
          <HardDrive className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 md:mt-0" />
          <div>
            <div className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">
              Output Destination Directory
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <code className="text-xs font-mono font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-amber-200 select-all">
                {outputsDir}
              </code>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                (Relative: <code className="text-slate-700">./outputs/</code>)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyFolder}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-amber-300 hover:border-amber-400 text-amber-900 rounded-md text-xs font-medium shadow-2xs transition-colors cursor-pointer self-start md:self-auto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Folder Path' : 'Copy Output Path'}</span>
        </button>
      </div>

      {/* Files List Table */}
      <div className="mt-4">
        {outputs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No CSV files generated yet in the output folder. Click "Compile & Extract" above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5 text-left">CSV File</th>
                  <th scope="col" className="px-3.5 py-2.5 text-left">Target Dataset</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right">Electors Extracted</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right">File Size</th>
                  <th scope="col" className="px-3.5 py-2.5 text-left">Saved Location</th>
                  <th scope="col" className="px-3.5 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {outputs.map((file) => {
                  const isCurrent = selectedFilename === file.filename;
                  return (
                    <tr
                      key={file.filename}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCurrent ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-mono font-semibold text-slate-800">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600">
                        {file.filename === '208.csv' ? (
                          <span className="text-slate-800">Part No. 208 (Hebbal)</span>
                        ) : file.filename === '207.csv' ? (
                          <span className="text-slate-800">Part No. 207 (Hebbal)</span>
                        ) : (
                          <span className="text-indigo-700">Custom Dataset</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-medium text-slate-800">
                        {file.rowCount.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-600">
                        {file.sizeFormatted}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate max-w-[180px]">{file.path}</span>
                          <button
                            onClick={() => handleCopyFilePath(file.path, file.filename)}
                            title="Copy full path"
                            className="p-1 hover:text-indigo-600 text-slate-400 cursor-pointer"
                          >
                            {copiedFile === file.filename ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onSelectForView(file.filename)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <a
                            href={file.downloadUrl}
                            download={file.filename}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
