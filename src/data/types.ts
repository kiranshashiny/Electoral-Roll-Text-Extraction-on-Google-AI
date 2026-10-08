export interface ElectorRecord {
  dataset: string;
  serialNumber: number;
  voterId: string;
  name: string;
  relation: string;
  address: string;
  age: number;
  gender: 'Male' | 'Female' | 'Third Gender' | string;
  sex?: string;
}

export interface DatasetMeta {
  id: string;
  displayName: string;
  fileName: string;
  outputCsvName: string;
  constituency: string;
  partNo: string;
  totalElectors: number;
  maleElectors: number;
  femaleElectors: number;
  thirdGenderElectors: number;
  dateOfUpdation?: string;
  pollingStation?: string;
}

export interface ParseLog {
  id: string;
  timestamp: string;
  level: 'info' | 'compile' | 'running' | 'success' | 'warn' | 'error';
  message: string;
  phase?: 'compilation' | 'parsing' | 'running' | 'export' | 'system';
}

export interface ParseResult {
  datasetId: string;
  datasetName: string;
  outputCsvName: string;
  outputCsvPath: string;
  totalRecords: number;
  records: ElectorRecord[];
  csvContent: string;
  durationMs: number;
  logs: ParseLog[];
}
