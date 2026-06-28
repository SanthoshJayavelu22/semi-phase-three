import React, { useMemo } from 'react';
import { BookOpen, Layers, Users, CreditCard, ChevronRight, Activity, HelpCircle } from 'lucide-react';

const InstituteERPDashboard = ({ 
  courses, 
  batches, 
  students, 
  activeStudentCount, 
  appForm 
}) => {
  // Aggregate total fees collections (each student has a seed value of ₹1,40,000)
  const totalFees = useMemo(() => {
    return students.length * 140000;
  }, [students]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Institutional Dashboard</h2>
        <p className="text-xs text-gray-400 mt-0.5">Welcome to your emergency medicine academic control console</p>
      </div>

      {/* Grid count stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Courses count card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Active Courses</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{courses.length} Programs</span>
          </div>
        </div>

        {/* Batches count card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Active Cohorts</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{batches.length} Batches</span>
          </div>
        </div>

        {/* Students count card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Active Fellows</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">{activeStudentCount} / {students.length} Registered</span>
          </div>
        </div>

        {/* Fees Collections card */}
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-inner group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Fees Collected</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block tracking-tight">₹{totalFees.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Compliance Health */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">Compliance Monitor</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Society for Emergency Medicine India (SEMI) standards checklist</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-emerald-600 font-extrabold text-sm">✓</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Emergency Dept Beds</span>
                  <span className="text-sm font-black text-gray-800 block mt-0.5">{appForm.bedCount} beds capacity</span>
                  <span className="text-[9px] text-emerald-600 block mt-1.5 font-bold uppercase">SEMI Standard: Verified (min 10)</span>
                </div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-emerald-600 font-extrabold text-sm">✓</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Emergency Physician Exp</span>
                  <span className="text-sm font-black text-gray-800 block mt-0.5">{appForm.physicianExperience} months qualified</span>
                  <span className="text-[9px] text-emerald-600 block mt-1.5 font-bold uppercase">SEMI Standard: Verified (min 24m)</span>
                </div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-emerald-600 font-extrabold text-sm">✓</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Qualified Faculty</span>
                  <span className="text-sm font-black text-gray-800 block mt-0.5">{appForm.emFacultyCount} Instructors</span>
                  <span className="text-[9px] text-emerald-600 block mt-1.5 font-bold uppercase">SEMI Standard: Verified (min 1)</span>
                </div>
              </div>

              <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-emerald-600 font-extrabold text-sm">✓</span>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Teaching space</span>
                  <span className="text-sm font-black text-gray-800 block mt-0.5">Available & Classroom certified</span>
                  <span className="text-[9px] text-emerald-600 block mt-1.5 font-bold uppercase">SEMI Standard: Verified</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-100 pt-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider select-none text-center">
            🔐 SSL Secured & Encrypted Institutional Registry • Verified Board status
          </div>
        </div>

        {/* Right Card: Clinical guidelines */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">Help & Guidelines</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Rules & guidelines for student management</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5 shadow-sm">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-800 block leading-tight">Eligible Candidate Audits</span>
                  <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed font-semibold">
                    Fellows enrolled under Emergency Medicine programs must possess certified PG clinical degrees (e.g. MEM, MD, DNB Emergency Medicine).
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5 shadow-sm">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-gray-800 block leading-tight">Payment Verification</span>
                  <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed font-semibold">
                    Ensure all candidate enrollment payments are processed correctly. Use the provided NEFT details or Razorpay integrations for fee collection.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mt-6">
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 block">SEMI Official Affiliation</span>
            <span className="text-[10px] text-blue-800 font-semibold block mt-1 leading-relaxed">
              For administrative or academic support, reach out to academics@semi.org.in or call 1800-XXX-XXXX.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteERPDashboard;
