import { ElectorRecord } from '../data/types';

/**
 * Format elector records into exact CSV format:
 * Dataset,Serial Number,Voter ID,Name,Relation,address,Age,Gender
 * 100% browser and server safe (no Node.js dependencies).
 */
export function formatRecordsToCsv(records: ElectorRecord[], defaultDataset: string = "208"): string {
  const headers = ["Dataset", "Serial Number", "Voter ID", "Name", "Relation", "address", "Age", "Gender"];
  const lines: string[] = [headers.join(",")];

  const escapeCsv = (val: any): string => {
    const str = String(val ?? "").trim();
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  for (const r of records) {
    lines.push([
      escapeCsv(r.dataset || defaultDataset),
      r.serialNumber,
      escapeCsv(r.voterId),
      escapeCsv(r.name),
      escapeCsv(r.relation),
      escapeCsv(r.address),
      r.age,
      escapeCsv(r.gender)
    ].join(","));
  }

  return lines.join("\n");
}
