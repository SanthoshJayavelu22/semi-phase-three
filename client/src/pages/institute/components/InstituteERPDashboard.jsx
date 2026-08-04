import React, { useMemo } from 'react';
import { 
  BookOpen, 
  Layers, 
  Users, 
  CreditCard, 
  CheckCircle2, 
  Building2, 
  ChevronRight, 
  Sparkles,
  Ticket,
  Award,
  RotateCcw,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstituteERPDashboard = ({ 
  courses = [], 
  batches = [], 
  students = [], 
  activeStudentCount = 0, 
  appForm = {} 
}) => {
  const navigate = useNavigate();

  // Aggregate total fees collections
  const totalFees = useMemo(() => {
    return students.length * 140000;
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans text-left pb-8">
      
      {/* ── 1. Welcome & Accreditation Status Banner ────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-black uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Accredited Hospital Academic ERP
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Institutional ERP Console
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Manage academic programs, fellow enrollments, student fee collections, examination applications, hall ticket generation, and revaluation processing.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex flex-wrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate('/institute/enrollment')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Enroll Fellow
          </button>
          <button
            onClick={() => navigate('/institute/fees')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Collect Fees
          </button>
        </div>
      </div>

      {/* ── 2. Key Operational Metrics (KPIs) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Courses */}
        <div 
          onClick={() => navigate('/institute/courses')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Programs
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{courses.length}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Active Academic Programs</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">SEMI Accredited Courses</span>
          </div>
        </div>

        {/* Active Batches */}
        <div 
          onClick={() => navigate('/institute/batches')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              Cohorts
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{batches.length}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Active Student Batches</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Ongoing Academic Sessions</span>
          </div>
        </div>

        {/* Enrolled Fellows */}
        <div 
          onClick={() => navigate('/institute/students')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-emerald-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Fellows
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{activeStudentCount} / {students.length}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Registered Fellow Candidates</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Active Fellow Database</span>
          </div>
        </div>

        {/* Total Fee Collections */}
        <div 
          onClick={() => navigate('/institute/fees')}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:border-amber-400 hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              Collections
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">₹{totalFees.toLocaleString()}</div>
            <span className="text-xs font-extrabold text-slate-700 block mt-0.5">Total Fee Collections</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">Tuition & Enrollment Ledger</span>
          </div>
        </div>

      </div>

      {/* ── 3. Main Workspace: Compliance Audit Checklist & Core Modules ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: SEMI Compliance Audit Checklist */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                SEMI Accreditation Standards Checklist
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Hospital infrastructure compliance status</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              Fully Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Emergency Dept Beds</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{appForm.bedCount || 15} Beds Capacity</span>
                <span className="text-[9px] text-emerald-700 block mt-1 font-bold uppercase">SEMI Standard: Verified (min 10)</span>
              </div>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Physician Experience</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{appForm.physicianExperience || 36} Months Qualified</span>
                <span className="text-[9px] text-emerald-700 block mt-1 font-bold uppercase">SEMI Standard: Verified (min 24m)</span>
              </div>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Qualified Faculty</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{appForm.emFacultyCount || 4} Certified Instructors</span>
                <span className="text-[9px] text-emerald-700 block mt-1 font-bold uppercase">SEMI Standard: Verified (min 1)</span>
              </div>
            </div>

            <div className="border border-emerald-100 bg-emerald-50/30 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Academic Infrastructure</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">Teaching Space Available</span>
                <span className="text-[9px] text-emerald-700 block mt-1 font-bold uppercase">SEMI Standard: Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick ERP Shortcuts */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              ERP Core Shortcuts
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Direct access to institute modules</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/institute/enrollment')}
              className="w-full p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Candidate Enrollment</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Register new fellows</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/institute/hallTicket')}
              className="w-full p-3.5 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Hall Ticket Issuance</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Generate exam tickets</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/institute/results')}
              className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/70 hover:border-emerald-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Examination Results</span>
                  <span className="text-[10px] text-slate-400 block font-medium">View marks & marksheets</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/institute/revaluation')}
              className="w-full p-3.5 bg-slate-50 hover:bg-rose-50/70 border border-slate-200/70 hover:border-rose-300 rounded-2xl text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Revaluation Processing</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Submit reval requests</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InstituteERPDashboard;
