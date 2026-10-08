import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { ElectorRecord } from '../data/types';

interface DataTableViewerProps {
  records: ElectorRecord[];
  filename: string;
  onDownloadCsv: () => void;
}

export const DataTableViewer: React.FC<DataTableViewerProps> = ({
  records,
  filename,
  onDownloadCsv
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<keyof ElectorRecord>('serialNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter & Search logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Gender filter
      if (genderFilter !== 'All') {
        const matchesGender = r.gender?.toLowerCase() === genderFilter.toLowerCase() || 
                              r.sex?.toLowerCase() === genderFilter.toLowerCase();
        if (!matchesGender) return false;
      }

      // Search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (r.dataset || '').toLowerCase().includes(term) ||
        r.serialNumber.toString().includes(term) ||
        r.voterId.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        r.relation.toLowerCase().includes(term) ||
        r.address.toLowerCase().includes(term) ||
        (r.age && r.age.toString().includes(term))
      );
    });
  }, [records, searchTerm, genderFilter]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRecords.slice(start, start + rowsPerPage);
  }, [sortedRecords, currentPage, rowsPerPage]);

  const handleSort = (field: keyof ElectorRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const maleCount = useMemo(() => records.filter(r => r.gender === 'Male' || r.sex === 'Male').length, [records]);
  const femaleCount = useMemo(() => records.filter(r => r.gender === 'Female' || r.sex === 'Female').length, [records]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Extracted Elector Records Table
            </h3>
            <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
              {filename}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Columns: <strong className="text-slate-700">Dataset</strong> (1st column) · Serial Number · Voter ID · Name · Relation · address · <strong className="text-slate-700">Age</strong> (replaced Sex) · Gender
          </p>
        </div>

        {/* Stats & Download */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="text-xs text-slate-500 hidden md:flex items-center space-x-2">
            <span>Total: <strong className="text-slate-800">{records.length}</strong></span>
            <span>·</span>
            <span>Male: <strong className="text-slate-800">{maleCount}</strong></span>
            <span>·</span>
            <span>Female: <strong className="text-slate-800">{femaleCount}</strong></span>
          </div>

          <button
            onClick={onDownloadCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by dataset, name, Voter ID, age, house..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Gender:</span>
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
            {(['All', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => {
                  setGenderFilter(g);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  genderFilter === g
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Rows per page selector */}
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* The Elector Records Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold select-none">
            <tr>
              <th
                onClick={() => handleSort('dataset')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 bg-indigo-50/50"
              >
                <div className="flex items-center space-x-1">
                  <span className="text-indigo-950 font-bold">Dataset</span>
                  <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('serialNumber')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Serial Number</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('voterId')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Voter ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('relation')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Relation</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('address')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>address</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('age')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 bg-amber-50/50"
              >
                <div className="flex items-center space-x-1">
                  <span className="text-amber-900 font-bold">Age</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gender')}
                className="px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Gender</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 italic">
                  No electors found matching current search/filter criteria.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr key={`${record.voterId}-${record.serialNumber}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-2 font-mono font-bold text-indigo-700 bg-indigo-50/20">
                    {record.dataset || filename.replace(/\.csv$/, '')}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-500 font-medium">
                    {record.serialNumber}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-slate-900">
                    {record.voterId}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {record.name}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {record.relation}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700">
                    {record.address}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-amber-900 bg-amber-50/20">
                    {record.age}
                  </td>
                  <td className="px-3 py-2">
                    <span className={record.gender === 'Male' ? 'text-blue-700 font-medium' : 'text-pink-700 font-medium'}>
                      {record.gender}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div>
          Showing {sortedRecords.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
          {Math.min(currentPage * rowsPerPage, sortedRecords.length)} of {sortedRecords.length} electors
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
