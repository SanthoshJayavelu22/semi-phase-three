import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  RefreshCw, 
  Award, 
  ShieldAlert, 
  ChevronRight, 
  FileText, 
  UserCheck, 
  Clock, 
  DollarSign, 
  Sparkles,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcademyDashboard = ({ dynamicMetrics = {}, setActiveTab, allApplications = [] }) => {
  const navigate = useNavigate();

  // Quick navigation helper (supports both prop tab setter and router navigation)
  const handleNavigate = (path, tabName) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
    navigate(path);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans text-left pb-8">
      
      {/* ── 1. Welcome & Governance Header Banner ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[11px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Society for Emergency Medicine India (SEMI) Board
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Academic Board Governance Console
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Real-time control panel for hospital accreditation, fellow student verification, examination publishing, revaluation management, and treasury remittances.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => handleNavigate('/academy/applications', 'applications')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Applications ({dynamicMetrics?.pending || 0})
          </button>
          <button
            onClick={() => handleNavigate('/academy/remittance', 'remittance')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Treasury Ledger
          </button>
        </div>
      </div>

      {/* ── 2. Key Operational Metrics (KPIs) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Approved Institutes */}
        <div 
          onClick={() => handleNavigate('/academy/applications', 'applications')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-emerald-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Accredited
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{dynamicMetrics?.approved || 0}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Approved Hospital Institutes</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Certified for Fellowship Training</span>
          </div>
        </div>

        {/* Pending Applications */}
        <div 
          onClick={() => handleNavigate('/academy/applications', 'applications')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              Needs Review
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{dynamicMetrics?.pending || 0}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Pending Accreditation Reviews</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Awaiting inspection & board audit</span>
          </div>
        </div>

        {/* Total Registered Institutes */}
        <div 
          onClick={() => handleNavigate('/academy/applications', 'applications')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Registry
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{dynamicMetrics?.total || 0}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Total Hospital Applicants</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Integrated SEMI Database</span>
          </div>
        </div>

        {/* Rejected Applications */}
        <div 
          onClick={() => handleNavigate('/academy/applications', 'applications')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-rose-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full border border-rose-200">
              Non-Compliant
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{dynamicMetrics?.rejected || 0}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Rejected Applications</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Did not meet minimum criteria</span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace: Recent Applications Ledger & Quick Modules ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Recent Onboarding Applications */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Recent Hospital Accreditation Requests
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Evaluate and audit hospital applications</p>
            </div>
            <button
              onClick={() => handleNavigate('/academy/applications', 'applications')}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              View All Applications
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {(!allApplications || allApplications.length === 0) ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No applications registered yet</p>
              </div>
            ) : (
              (allApplications || []).slice(0, 5).map((app) => {
                const status = app.status || 'pending_review';
                const isApproved = status === 'approved' || status === 'active_erp';
                const isRejected = status === 'rejected';

                let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                let statusText = 'Pending Review';

                if (isApproved) {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  statusText = 'Approved';
                } else if (isRejected) {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                  statusText = 'Rejected';
                }

                return (
                  <div
                    key={app.id || app._id}
                    onClick={() => handleNavigate('/academy/applications', 'applications')}
                    className="p-4 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs group-hover:border-blue-400 group-hover:text-blue-600 transition-all">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {app.orgName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium truncate">{app.email}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400 font-medium">Beds: {app.bedCount || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                        {statusText}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 4 Cols: Quick Access Portals */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Core Academic Portals
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Direct shortcuts to board operations</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleNavigate('/academy/applications', 'applications')}
              className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Institute Accreditation</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Review hospital files</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleNavigate('/academy/students', 'students')}
              className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Fellow Student Registry</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Manage enrolled candidates</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleNavigate('/academy/remittance', 'remittance')}
              className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/70 hover:border-emerald-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Treasury & Remittances</span>
                  <span className="text-[10px] text-slate-400 block font-medium">View all payments</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleNavigate('/academy/publish-details', 'publish-details')}
              className="w-full p-3.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/70 hover:border-purple-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Publish Examination Results</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Manage result releases</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AcademyDashboard;
