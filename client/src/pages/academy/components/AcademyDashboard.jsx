import React from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, Layers, RefreshCw, Award, 
  FileSpreadsheet, ChevronRight, AlertCircle, Building2, Users
} from 'lucide-react';
import Toast from '../../../Components/Toast';

const AcademyDashboard = ({ dynamicMetrics, setActiveTab, allApplications = [] }) => {
  const [toast, setToast] = React.useState(null);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 text-left">
          <h2 className="text-2xl font-black text-white tracking-tight">Good morning, Board Member</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Academics Board Real-time Management Console</p>
        </div>

 
      </div>

      {/* Dynamic Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Rejected */}
        <div className="bg-rose-950/10 border border-rose-500/10 hover:border-rose-500/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/5 group relative overflow-hidden bg-white">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-rose-500">
            <ShieldAlert className="w-32 h-32" />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shadow-inner group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-5 tracking-tight">{dynamicMetrics.rejected}</div>
          <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest mt-1 block">Rejected Applications</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">Audit non-compliant</span>
        </div>

        {/* Approved */}
        <div className="bg-emerald-950/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group relative overflow-hidden bg-white">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-emerald-500">
            <Building2 className="w-32 h-32" />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-5 tracking-tight">{dynamicMetrics.approved}</div>
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1 block">Approved Institutes</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">Authorized for courses</span>
        </div>

        {/* Pending */}
        <div className="bg-amber-950/10 border border-amber-500/10 hover:border-amber-500/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 group relative overflow-hidden bg-white">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-amber-500">
            <Layers className="w-32 h-32" />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-110 transition-transform">
            <RefreshCw className="w-5.5 h-5.5 animate-spin-slow" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-5 tracking-tight">{dynamicMetrics.pending}</div>
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest mt-1 block">Pending Evaluations</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">Awaiting field review</span>
        </div>

        {/* Total */}
        <div className="bg-blue-950/10 border border-blue-500/10 hover:border-blue-500/30 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group relative overflow-hidden bg-white">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-[0.03] text-blue-500">
            <Award className="w-32 h-32" />
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-5 tracking-tight">{dynamicMetrics.total}</div>
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1 block">Total Registry</span>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1">Integrated board records</span>
        </div>
      </div>

      {/* SVG Analytical Area Chart */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
        <div className="mb-6">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Accreditation Metrics & Activity History</h3>
          <p className="text-xs text-gray-400 mt-0.5">Annual onboarding and enrollment volumes (Monthly aggregates)</p>
        </div>
        <div className="w-full h-48 select-none">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid Lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="140" x2="800" y2="140" stroke="#f1f5f9" strokeWidth="1" />
            
            {/* Chart Area Fill */}
            <path
              d="M 0 170 Q 100 130 200 110 T 400 90 T 600 50 T 800 30 L 800 200 L 0 200 Z"
              fill="url(#gradient-blue)"
            />
            {/* Chart Line */}
            <path
              d="M 0 170 Q 100 130 200 110 T 400 90 T 600 50 T 800 30"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Chart Points */}
            <circle cx="200" cy="110" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
            <circle cx="400" cy="90" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
            <circle cx="600" cy="50" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
            <circle cx="800" cy="30" r="5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pt-3 border-t border-gray-100">
          <span>Jan - Mar</span>
          <span>Apr - Jun</span>
          <span>Jul - Sep</span>
          <span>Oct - Dec</span>
        </div>
      </div>

      {/* Timeline Activity and Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Compliance Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">Real-time governance audit activity trail</p>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {allApplications.length === 0 ? (
              <div className="text-[10px] text-gray-400 font-semibold py-2">No applications found in the ledger.</div>
            ) : (
              allApplications.slice(0, 5).map((app, index) => {
                const isApproved = app.status === 'approved' || app.status === 'active_erp';
                const isRejected = app.status === 'rejected';
                
                let dotColorClass = 'bg-amber-500 ring-amber-100';
                if (isApproved) dotColorClass = 'bg-emerald-500 ring-emerald-100';
                if (isRejected) dotColorClass = 'bg-rose-500 ring-rose-100';

                return (
                  <div key={app.id || index} className="relative pl-8 flex items-start gap-4">
                    <div className={`absolute left-[5px] top-[6px] w-3 h-3 rounded-full ring-4 ${dotColorClass}`}></div>
                    <div className="flex-grow">
                      <h4 className="text-xs font-black text-slate-800">{app.orgName || 'Unknown Institute'}</h4>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {app.submittedAt || 'N/A'} • Compliance Status: {app.status === 'pending_review' ? 'Pending Review' : (app.status || 'Pending Review').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-base font-black text-gray-900 tracking-tight">Audit Quick-links</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Auditing shortcuts</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('applications')}
                className="w-full p-4 border border-gray-150 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm text-left transition-all group flex justify-between items-center"
              >
                <div>
                  <span className="text-xs font-black text-slate-800 block">Evaluate Applications</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Audit onboarding files</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className="w-full p-4 border border-gray-150 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm text-left transition-all group flex justify-between items-center"
              >
                <div>
                  <span className="text-xs font-black text-slate-800 block">Audits & Students Log</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Verify enrolled students</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setActiveTab('eligibility')}
                className="w-full p-4 border border-gray-150 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm text-left transition-all group flex justify-between items-center"
              >
                <div>
                  <span className="text-xs font-black text-slate-800 block">Exam Eligibility</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Review eligibility list</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-6">
            <div className="flex items-start gap-3 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-indigo-900 block">Auditing Guidelines</span>
                <span className="text-indigo-800 mt-1 block font-semibold text-[11px] leading-relaxed">
                  EM Bed count (min 10) and Board Physician Experience (min 24 months) are strict regulatory thresholds.
                </span>
              </div>
            </div>
          </div>
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

export default AcademyDashboard;
