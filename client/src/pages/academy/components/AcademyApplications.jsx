import React, { useState } from 'react';
import { Search, RefreshCw, Eye, Edit, Trash2, Compass, AlertCircle } from 'lucide-react';
import Toast from '../../../Components/Toast';

const AcademyApplications = ({ 
  filteredApplications, 
  allApplications, 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter, 
  fetchBoardData,
  setSelectedApp
}) => {
  const [toast, setToast] = useState(null);
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header section inside card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Institutional Onboarding Applications</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Auditing {filteredApplications.length} of {allApplications.length} institutions in registry
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by college name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-gray-200 hover:border-gray-300 hover:bg-white rounded-xl text-xs font-extrabold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="pending_review">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh */}
          <button 
            onClick={async () => {
              await fetchBoardData();
              setToast({ message: "🔄 Governing registry successfully synchronised with database.", type: 'success' });
            }}
            className="p-2.5 bg-slate-50 border border-gray-200 hover:bg-white hover:border-gray-300 rounded-xl text-gray-500 hover:text-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-inner bg-slate-50/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Institute Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Contact</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Compliance Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Submitted Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/60 text-xs font-bold text-slate-700 bg-white">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app, idx) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 text-center text-[10px] text-gray-400 font-extrabold">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900 block group-hover:text-blue-600 transition-colors leading-relaxed">
                        {app.orgName}
                      </span>
                      {app.id === 'app-101' && (
                        <span className="inline-flex mt-1 text-[8px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-md">
                          Live Session
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">{app.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[9px] uppercase tracking-wider font-black border ${
                        app.status === 'pending_review' 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-100/30' 
                          : app.status === 'approved' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100/30' 
                            : 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm shadow-rose-100/30'
                      }`}>
                        {app.status === 'pending_review' ? 'Pending Review' : app.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-extrabold">{app.submittedAt}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Inspect / Eye */}
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl text-blue-600 transition-all active:scale-90"
                          title="Inspect Documents & Compliance"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400 font-medium">
                    <Compass className="w-10 h-10 mx-auto text-gray-300 mb-4 stroke-1 animate-pulse" />
                    <p className="text-sm font-bold text-slate-500">No matching applications found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Refine your search parameters and try again</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default AcademyApplications;
