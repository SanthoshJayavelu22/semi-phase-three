import React from 'react';
import { ArrowLeft, Printer, ShieldCheck, Lock, PhoneCall, Award, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
import semiLogo from '../../../../assets/semi logo.png';

const getOrdinal = (n) => {
  const num = parseInt(n, 10);
  if (isNaN(num)) return `${n || 1}st`;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ResultsDisplay = ({ data, onBack }) => {
  const { student, results } = data || {};
  const result = Array.isArray(results) && results.length > 0 ? results[0] : null;

  if (!student || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <header className="bg-gradient-to-r from-[#0b3c8f] to-[#062459] text-white py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <img src={semiLogo} alt="SEMI Logo" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
            <div>
              <h1 className="text-base font-black uppercase">Society for Emergency Medicine India</h1>
              <p className="text-xs text-blue-200">Official Examination Portal</p>
            </div>
          </div>
        </header>
        <main className="p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800">Invalid Result Data</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">No examination results found for the requested candidate.</p>
          <button onClick={onBack} className="px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl">
            Return to Search
          </button>
        </main>
        <footer className="bg-slate-200 py-3 text-center text-xs text-slate-500">
          © 2026 Society for Emergency Medicine India (SEMI). All Rights Reserved.
        </footer>
      </div>
    );
  }

  const dobFormatted = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const resultStatus = (result?.resultStatus || '').toUpperCase();
  const isPass = resultStatus === 'PASS';

  const getStatusLabel = () => {
    if (resultStatus === 'PASS') return 'Pass';
    if (resultStatus === 'SUPPLEMENTARY') return 'Supplementary';
    if (resultStatus === 'REVALUATION_PENDING') return 'Revaluation Pending';
    return 'Fail';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans text-slate-800">
      
      {/* ── Official SEMI Header ────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#0b3c8f] via-[#093278] to-[#062459] text-white py-4 px-6 sm:px-10 shadow-md border-b border-blue-900/40 print:hidden">
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

      {/* ── Main Scorecard Container ────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Action Toolbar */}
        <div className="flex justify-between items-center print:hidden">
          <button 
            onClick={onBack}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-blue-700 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Official Scorecard
          </button>
        </div>

        {/* Official Scorecard Paper Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-10 space-y-8 text-left relative overflow-hidden">
          
          {/* Header Banner */}
          <div className="text-center border-b border-slate-150 pb-8 space-y-2">
            <div className="w-16 h-16 mx-auto bg-slate-50 rounded-2xl p-2.5 border border-slate-200 shadow-sm mb-3">
              <img src={semiLogo} alt="SEMI Seal" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {student.institute?.orgName || 'Dr MGR Institute'}
            </h2>
            <p className="text-sm font-bold text-blue-700 uppercase tracking-wide">
              {getOrdinal(result.examination)} Examination Exam Results {result.academicYear || 2026}
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200/60 mt-1">
              <Award className="w-3.5 h-3.5" />
              Official Examination Transcript
            </span>
          </div>

          {/* Student Dossier Information Grid */}
          <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-150 space-y-4">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200/60 pb-2">
              Candidate Dossier & Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-xs font-bold">
              <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500 font-medium">Candidate Name</span>
                <span className="text-slate-900 font-black text-sm">
                  Dr. {student.firstName} {student.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500 font-medium">Student Enrollment ID</span>
                <span className="font-mono text-slate-800 font-black text-sm">{student.enrollmentId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500 font-medium">Branch / Course</span>
                <span className="text-slate-800">
                  {student.batch?.name || 'Emergency Medicine'} {student.batch?.year ? `(${student.batch.year})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                <span className="text-slate-500 font-medium">Date of Birth (D.O.B)</span>
                <span className="text-slate-800">{dobFormatted}</span>
              </div>
            </div>
          </div>

          {/* Results Status Section */}
          {!result.isPublished ? (
            <div className="p-8 border border-amber-200 bg-amber-50/70 rounded-2xl text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto stroke-1.5" />
              <h3 className="text-lg font-black text-amber-900">Results Not Yet Published</h3>
              <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                Your examination result for this examination is currently under evaluation by the governing board and will be published {result.publishedDate ? `on ${new Date(result.publishedDate).toLocaleDateString()}` : 'shortly'}.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Overall Result Status */}
              <div className={`rounded-3xl border-2 p-8 text-center shadow-sm ${
                isPass ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'
              }`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 mb-4 ${
                  isPass ? 'border-emerald-300 bg-emerald-100' : 'border-rose-300 bg-rose-100'
                }`}>
                  {isPass ? (
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <XCircle className="w-10 h-10 text-rose-600" />
                  )}
                </div>
                <h4 className={`text-2xl sm:text-3xl font-black uppercase tracking-widest ${
                  isPass ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {getStatusLabel()}
                </h4>
                <p className={`text-xs font-bold mt-2 ${
                  isPass ? 'text-emerald-600/80' : 'text-rose-600/80'
                }`}>
                  {isPass
                    ? `Congratulations! You have successfully cleared the ${getOrdinal(result.examination)} examination.`
                    : `The candidate did not clear the ${getOrdinal(result.examination)} examination and is required to reappear.`}
                </p>
              </div>

              {/* Subject-wise Pass/Fail */}
              {(result.subjects || []).length > 0 && (
                <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                          <th className="py-3.5 px-4 text-center w-16 border-r border-slate-200">Exam</th>
                          <th className="py-3.5 px-4 text-center w-28 border-r border-slate-200">Sub-Code</th>
                          <th className="py-3.5 px-6 border-r border-slate-200">Subject Name</th>
                          <th className="py-3.5 px-4 text-center w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 bg-white font-bold text-slate-800">
                        {result.subjects.map((subject, index) => {
                          const subGrade = (subject.grade || '').toUpperCase();
                          const subPass = subGrade !== 'F' && subGrade !== 'RA' && subGrade !== 'ABSENT' && subGrade !== 'WH';
                          const subjectNameCapitalized = subject.subjectName
                            ? subject.subjectName.charAt(0).toUpperCase() + subject.subjectName.slice(1)
                            : 'N/A';

                          return (
                            <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-4 text-center border-r border-slate-200 text-slate-500 font-mono">
                                {result.examination}
                              </td>
                              <td className="py-3.5 px-4 text-center border-r border-slate-200">
                                <span className="font-mono text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                  {subject.subjectCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 border-r border-slate-200 font-extrabold text-slate-900">
                                {subjectNameCapitalized}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  subPass
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {subPass ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                                  {subPass ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </main>

      {/* ── Official SEMI Footer ────────────────────────────────────────────── */}
      <footer className="bg-slate-200/70 border-t border-slate-300/80 text-slate-600 text-xs py-4 px-6 sm:px-10 mt-auto font-medium print:hidden">
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

export default ResultsDisplay;
