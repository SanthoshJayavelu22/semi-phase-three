import React, { useState } from 'react';
import { Download, FileText, Search, Filter } from 'lucide-react';

const InstituteERPResults = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for results
  const [results] = useState([
    { id: 1, enrollmentId: 'SEMI-2023-001', name: 'Dr. Rahul Sharma', course: 'MD Emergency Medicine', marks: 85, status: 'Pass', date: '2023-12-15' },
    { id: 2, enrollmentId: 'SEMI-2023-002', name: 'Dr. Priya Patel', course: 'DNB Emergency Medicine', marks: 78, status: 'Pass', date: '2023-12-15' },
    { id: 3, enrollmentId: 'SEMI-2023-003', name: 'Dr. Amit Kumar', course: 'MEM (Emergency Medicine)', marks: 45, status: 'Fail', date: '2023-12-15' },
  ]);

  const filteredResults = results.filter(result => 
    result.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    result.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800">Examination Results</h2>
          <p className="text-sm text-slate-500 mt-1">View and download student results and provisional certificates.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
          <Download className="w-4 h-4" />
          Download All Results
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student name or enrollment ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white">
              <Filter className="w-4 h-4" />
              Filter Options
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Student Details</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{result.name}</span>
                        <span className="text-xs text-slate-500">{result.enrollmentId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{result.course}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{result.marks}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        result.status === 'Pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors tooltip-trigger" title="Download Marksheet">
                          <FileText className="w-4 h-4" />
                        </button>
                        {result.status === 'Pass' && (
                          <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors tooltip-trigger" title="Download Provisional Certificate">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm">No results found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InstituteERPResults;
