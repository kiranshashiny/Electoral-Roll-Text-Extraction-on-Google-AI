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

  const currentDs = availableDatasets.find(d => d.id === selectedDataset);
  const expectedOutputFile = activeTab === 'presets' 
    ? (currentDs?.defaultOutput || `${selectedDataset}.csv`)
    : `${(customName.trim() || 'input_file').replace(/\.csv$/, '')}.csv`;

  // Fallback preset datasets if availableDatasets not loaded yet
  const defaultPresets: DatasetOption[] = [
    { id: '1', name: 'Hebbal Part 1 (1.pdf)', electorCount: 415, defaultOutput: '1.csv', description: 'Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 1' },
    { id: '2', name: 'Hebbal Part 2 (2.pdf)', electorCount: 484, defaultOutput: '2.csv', description: 'Gandhi Vidyalaya Kannada & Tamil Primary School, Room No. 2' },
    { id: '3', name: 'Hebbal Part 3 (3.pdf)', electorCount: 608, defaultOutput: '3.csv', description: 'BBMP Ward Office, Opp. Sterling Apartment, Room No. 1' },
    { id: '4', name: 'Hebbal Part 4 (4.pdf)', electorCount: 588, defaultOutput: '4.csv', description: 'BBMP Ward Office, Opp. Sterling Apartment, Room No. 2' },
    { id: '5', name: 'Hebbal Part 5 (5.pdf)', electorCount: 643, defaultOutput: '5.csv', description: 'Central Library BBMP Building, Lottegollahalli, Room No. 1' },
    { id: '6', name: 'Hebbal Part 6 (6.pdf)', electorCount: 433, defaultOutput: '6.csv', description: 'Central Library BBMP Building, Lottegollahalli, Room No. 2' },
    { id: '7', name: 'Hebbal Part 7 (7.pdf)', electorCount: 553, defaultOutput: '7.csv', description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 1' },
    { id: '8', name: 'Hebbal Part 8 (8.pdf)', electorCount: 497, defaultOutput: '8.csv', description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 2' },
    { id: '9', name: 'Hebbal Part 9 (9.pdf)', electorCount: 592, defaultOutput: '9.csv', description: 'Radhakrishna Public School, Basaveshwara Layout, Room No. 3' },
    { id: '10', name: 'Hebbal Part 10 (10.pdf)', electorCount: 682, defaultOutput: '10.csv', description: 'Sunrise English School, Bhoopsandra, Room No. 1' },
    { id: '208', name: 'Hebbal Part 208', electorCount: 697, defaultOutput: '208.csv', description: 'Presidency High School, HMT Layout, Ganganagar, Room No.3' },
    { id: '207', name: 'Hebbal Part 207', electorCount: 654, defaultOutput: '207.csv', description: 'Presidency High School, HMT Layout, Ganganagar, Room No.2' },
  ];

  const displayList = availableDatasets.length > 0 ? availableDatasets : defaultPresets;
  const uploaded1to10 = displayList.filter(d => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(d.id));
  const default208And207 = displayList.filter(d => ['208', '207'].includes(d.id));

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
            Choose uploaded files (1.pdf – 10.pdf), parts 208 & 207, or custom dataset. Target output: <code className="text-indigo-600 font-mono font-medium">{expectedOutputFile}</code>
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
            Datasets (1–10, 208, 207)
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
          <div className="space-y-4">
            {/* 10 Uploaded PDF Datasets Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Uploaded PDF Datasets (1.pdf – 10.pdf → 1.csv – 10.csv)
                </span>
                <span className="text-[11px] text-slate-500">10 files extracted</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {uploaded1to10.map((ds) => {
                  const isSel = selectedDataset === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => onSelectDataset(ds.id)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>Part {ds.id}</span>
                            <span className="text-[10px] text-slate-400">({ds.id}.pdf)</span>
                          </div>
                          <span className="inline-block mt-1 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                            {ds.defaultOutput || `${ds.id}.csv`}
                          </span>
                        </div>
                        {isSel && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 flex justify-between">
                        <span>Electors:</span>
                        <strong className="text-slate-800">{ds.electorCount}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Constituencies 208 & 207 Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Original Datasets (208 & 207)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {default208And207.map((ds) => {
                  const isSel = selectedDataset === ds.id;
                  return (
                    <div
                      key={ds.id}
                      onClick={() => onSelectDataset(ds.id)}
                      className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer relative ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-900">Hebbal Part {ds.id}</span>
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {ds.defaultOutput || `${ds.id}.csv`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            {ds.description}
                          </p>
                        </div>
                        {isSel && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="mt-2.5 flex items-center space-x-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Electors: <strong className="text-slate-800">{ds.electorCount}</strong></span>
                        <span>·</span>
                        <span>Output: <strong className="text-indigo-700 font-mono">{ds.defaultOutput}</strong></span>
                      </div>
                    </div>
                  );
                })}
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
