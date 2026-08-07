import { useState } from 'react';
import { Search, Lock, ShieldCheck, PhoneCall, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import semiLogo from '../../../../assets/semi logo.png';

const ResultsLogin = ({ onSearch, isLoading, error }) => {
  const [enrollmentId, setEnrollmentId] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!enrollmentId || !dob) return;
    onSearch(enrollmentId, dob);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* ── Official SEMI Header ────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#0b3c8f] via-[#093278] to-[#062459] text-white py-4 px-6 sm:px-10 shadow-md border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 bg-white rounded-2xl p-1.5 shadow-lg flex items-center justify-center shrink-0 border border-white/20">
              <img src={semiLogo} alt="SEMI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-wide leading-tight uppercase">
                Society for Emergency Medicine India
              </h1>
              <p className="text-xs text-blue-200 font-semibold mt-0.5">
                Full Member of International Federation for Emergency Medicine (IFEM)
              </p>
              <p className="text-[10px] text-blue-300/80 font-medium">
                Leading Emergency Care Excellence Since 1999 • Regd. No. 3602/2000
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-xs font-bold text-blue-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Official Examination & Evaluation Portal
          </div>
        </div>
      </header>

      {/* ── Main Content Form ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Top Emblem & Portal Info */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-white rounded-3xl p-3 shadow-xl border border-blue-100 flex items-center justify-center group hover:scale-105 transition-transform">
              <img src={semiLogo} alt="SEMI Seal" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 tracking-widest">
                National Academic Registry
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
                EXAMINATION RESULTS
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Enter your Student ID and Registered Date of Birth to view your official semester scorecard
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-150 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"></div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-bold flex items-start gap-3 animate-in fade-in duration-200">
                <div className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1"></div>
                <div>
                  <span className="block font-black uppercase text-[9px] text-rose-500 tracking-wide">Verification Failed</span>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="studentId" className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Student Enrollment ID
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="studentId"
                    type="text"
                    placeholder="e.g. SEMI-2026-9815"
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="dob" className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Date of Birth (D.O.B)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#0b3c8f] to-[#082a63] hover:from-[#093278] hover:to-[#06204d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching Scorecard...
                  </>
                ) : (
                  <>
                    Get Examination Result
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Having trouble accessing your result? Contact your institutional academic director.
          </p>

        </div>
      </main>

      {/* ── Official SEMI Footer ────────────────────────────────────────────── */}
      <footer className="bg-slate-200/70 border-t border-slate-300/80 text-slate-600 text-xs py-4 px-6 sm:px-10 mt-auto font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Lock className="w-3.5 h-3.5 text-blue-700" />
              SSL 256-Bit Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              Official Board Evaluation Portal
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <PhoneCall className="w-3.5 h-3.5 text-blue-700" />
              Helpline: +91 44 2836 1000
            </span>
          </div>
          <div className="text-[11px] text-slate-500 text-center md:text-right font-semibold">
            © 2026 Society for Emergency Medicine India (SEMI). All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default ResultsLogin;
