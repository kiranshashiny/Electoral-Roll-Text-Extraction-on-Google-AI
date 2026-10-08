import React, { useState, useRef } from 'react';
import { Play, Upload, FileText, CheckCircle2, RefreshCw, FolderDown, Layers, Sparkles } from 'lucide-react';

interface DatasetOption {
  id: string;
  name: string;
  electorCount: number;
  defaultOutput: string;
  description: string;
  isPreloaded?: boolean;
}

interface DatasetSelectorProps {
  selectedDataset: string;
  onSelectDataset: (id: string) => void;
  onRunParse: (datasetId: string, customName?: string, rawContent?: string) => void;
  isRunning: boolean;
  availableDatasets: DatasetOption[];
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  selectedDataset,
  onSelectDataset,
  onRunParse,
  isRunning,
  availableDatasets
}) => {
  const [customName, setCustomName] = useState('input_file');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus(`Uploading ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('datasetFile', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setUploadedFile(file);
      setCustomName(data.baseName || 'input_file');
      setUploadStatus(`Uploaded ${file.name} successfully. Target output: ${data.outputCsvName}`);
    } catch (err: any) {
      setUploadStatus(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleExecute = () => {
    if (activeTab === 'presets') {
      onRunParse(selectedDataset);
    } else {
      const targetId = customName.trim() || 'input_file';
      onRunParse(targetId, targetId, rawText.trim() || undefined);
    }
  };

  const expectedOutputFile = activeTab === 'presets' 
    ? (selectedDataset.includes('208') ? '208.csv' : '207.csv')
    : `${(customName.trim() || 'input_file').replace(/\.csv$/, '')}.csv`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Select Dataset & Target Output</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose electoral roll part 208, 207, or upload a custom dataset to produce <code className="text-indigo-600 font-mono font-medium">{expectedOutputFile}</code>
          </p>
        </div>

        {/* Tab switcher: Presets vs Custom */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Built-in Datasets (208 & 207)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Dataset / Upload
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-4">
        {activeTab === 'presets' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Dataset 208 Card */}
            <div
              onClick={() => onSelectDataset('208')}
              className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                selectedDataset === '208'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-900">Hebbal Part 208</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      208.csv
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Room No. 3, Presidency High School, HMT Layout, Ganganagar
                  </p>
                </div>
                {selectedDataset === '208' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                )}
              </div>

              <div className="mt-3 flex items-center space-x-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Electors: <strong className="text-slate-800">697</strong></span>
                <span>·</span>
                <span>Male: <strong className="text-slate-800">328</strong></span>
                <span>·</span>
                <span>Female: <strong className="text-slate-800">369</strong></span>
                <span>·</span>
                <span>Pages: <strong className="text-slate-800">28</strong></span>
              </div>
            </div>

            {/* Dataset 207 Card */}
            <div
              onClick={() => onSelectDataset('207')}
              className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                selectedDataset === '207'
                  ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-900">Hebbal Part 207</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      207.csv
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Room No. 2, Presidency High School, HMT Layout, Ganganagar
                  </p>
                </div>
                {selectedDataset === '207' && (
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                )}
              </div>

              <div className="mt-3 flex items-center space-x-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Electors: <strong className="text-slate-800">654</strong></span>
                <span>·</span>
                <span>Male: <strong className="text-slate-800">327</strong></span>
                <span>·</span>
                <span>Female: <strong className="text-slate-800">327</strong></span>
                <span>·</span>
                <span>Pages: <strong className="text-slate-800">26</strong></span>
              </div>
            </div>
          </div>
        ) : (
          /* Custom Dataset Panel */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Output Name Configuration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Dataset Name (Output will be called <span className="text-indigo-600 font-mono">{expectedOutputFile}</span>)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="input_file"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <span className="text-xs font-mono font-medium text-slate-500">.csv</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Defaults to <code className="text-slate-700">input_file.csv</code> as requested.
                </p>
              </div>

              {/* Upload Drop Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload PDF or Text Dataset
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-lg p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                    accept=".pdf,.txt,.csv"
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-700 font-medium">
                    {uploadedFile ? uploadedFile.name : "Click or drag PDF / dataset file here"}
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, TXT, or CSV (up to 50MB)</p>
                </div>
                {uploadStatus && (
                  <p className="text-[11px] text-indigo-600 mt-1">{uploadStatus}</p>
                )}
              </div>
            </div>

            {/* Optional raw text card content */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Or Paste Electoral Card OCR / Text Directly:</span>
                <button
                  type="button"
                  onClick={() => {
                    setRawText(
`1 SOH5577911
Name : Meenakshi G
Husbands Name : Nagaraja A Reddy
House Number : 03
Age : 32 Gender : Female

2 SOH5042528
Name : Sanghamitra lyengar
Mothers Name : Rajalakshmi Bhupal
House Number : 05
Age : 74 Gender : Female

3 SOH5201082
Name : Ujwala
Husbands Name : Jawaherlal Doddanavar
House Number : 6
Age : 62 Gender : Female`
                    );
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Load Sample Card Text
                </button>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste OCR text with Serial Number, Voter ID, Name, Relation, House Number, Gender..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Action Button Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center space-x-2">
            <span className="font-medium text-slate-700">Target Output File:</span>
            <span className="font-mono bg-slate-100 text-slate-900 px-2 py-0.5 rounded font-semibold text-xs border border-slate-200">
              outputs/{expectedOutputFile}
            </span>
          </div>

          <button
            onClick={handleExecute}
            disabled={isRunning || isUploading}
            className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isRunning
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:shadow-indigo-200'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                <span>Compiling & Extracting...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Compile & Extract {expectedOutputFile}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
