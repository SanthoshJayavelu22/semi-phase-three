import { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Eye, Compass } from 'lucide-react';
import Toast from '../../../Components/Toast';
import Pagination from '../../../Components/Pagination';

const AcademyApplications = ({ 
  filteredApplications = [], 
  allApplications = [], 
  searchQuery = '', 
  setSearchQuery, 
  statusFilter = '', 
  setStatusFilter, 
  fetchBoardData,
  setSelectedApp
}) => {
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const safeFiltered = Array.isArray(filteredApplications) ? filteredApplications : [];
  const safeAll = Array.isArray(allApplications) ? allApplications : [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(safeFiltered.length / itemsPerPage);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return safeFiltered.slice(start, start + itemsPerPage);
  }, [safeFiltered, currentPage, itemsPerPage]);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header section inside card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Institutional Onboarding Applications</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Auditing {safeFiltered.length} of {safeAll.length} institutions in registry
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
              <option value="pending_review">Submitted (Under Review)</option>
              <option value="inspection_triggered">Inspection Scheduled</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchBoardData}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-gray-600 transition-all active:scale-95 cursor-pointer"
            title="Refresh registry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-inner bg-slate-50/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">College / Institute</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Designated Dean</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Submission Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/60 text-xs font-bold text-slate-700 bg-white">
              {paginatedApps.length > 0 ? (
                paginatedApps.map((app, idx) => {
                  const collegeName = app.orgName || app.collegeName || app.form?.orgName || 'N/A';
                  const deanName = app.deanName || app.headName || app.form?.headName || app.form?.hodName || 'Dr. Unspecified';
                  const submissionDate = app.submittedAt || app.submittedDate || (app.createdAt ? new Date(app.createdAt).toLocaleDateString() : (app.form?.createdAt ? new Date(app.form.createdAt).toLocaleDateString() : 'N/A'));
                  
                  const isApproved = app.status === 'Approved' || app.status === 'approved' || app.status === 'active_erp';
                  const isRejected = app.status === 'Rejected' || app.status === 'rejected';
                  const isInspection = app.status === 'InspectionTriggered' || app.status === 'inspection_triggered' || app.form?.inspectionTriggered;
                  
                  let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                  let dotClass = 'bg-blue-500';
                  let statusLabel = 'Submitted';
                  
                  if (isApproved) {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    dotClass = 'bg-emerald-500';
                    statusLabel = 'Approved';
                  } else if (isRejected) {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    dotClass = 'bg-rose-500';
                    statusLabel = 'Rejected';
                  } else if (isInspection) {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    dotClass = 'bg-amber-500';
                    statusLabel = 'Inspection Scheduled';
                  }

                  return (
                    <tr key={app.id || app._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-center text-[10px] text-gray-400 font-extrabold">
                        {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors block">{collegeName}</span>
                        <span className="text-[10px] font-bold text-gray-400 font-mono">{app.email || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-extrabold">{deanName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold">
                        {submissionDate}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
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
                  );
                })
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={safeFiltered.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
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
