import React, { useState } from 'react';

const ResultsLogin = ({ onSearch, isLoading, error }) => {
  const [enrollmentId, setEnrollmentId] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!enrollmentId || !dob) return;
    onSearch(enrollmentId, dob);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0b3c8f] text-white p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center p-1 overflow-hidden">
          {/* Logo placeholder - using a generic shape resembling the SEMI logo */}
          <div className="w-10 h-10 border-4 border-[#0b3c8f] rounded-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#0b3c8f]"></div>
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold m-0 tracking-wide">SOCIETY FOR EMERGENCY MEDICINE INDIA</h1>
          <p className="text-sm opacity-90 m-0">Full Member of International Federation for Emergency Medicine</p>
          <p className="text-xs opacity-80 m-0">Leading Emergency Care Excellence Since 1999 (Regd.No. 3602/2000)</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-[#e6effc] text-[#0b3c8f] rounded-2xl flex items-center justify-center mb-4">
             <div className="w-10 h-10 border-4 border-[#0b3c8f] rounded-full relative">
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#0b3c8f]"></div>
               </div>
             </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-wider mb-2">RESULTS</h2>
          <p className="text-[#3b71ca] font-medium max-w-md mx-auto text-sm leading-relaxed">
            April - 2023 UG to 4 SEMESTER Examination Results.
            <br />
            Published on 15-09-2023
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentId" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Student ID
              </label>
              <input
                id="studentId"
                type="text"
                placeholder="SEMI...."
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            
            <div>
              <label htmlFor="dob" className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                D.O.B
              </label>
              <input
                id="dob"
                type="date"
                placeholder="(DD/MM/YYYY)"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#0b3c8f] hover:bg-[#082a63] text-white font-bold py-3 px-4 rounded-lg transition-colors ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'LOADING...' : 'GET RESULT'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#e0e0e0] text-gray-500 text-xs py-4 px-8 flex flex-wrap justify-between items-center border-t border-gray-300 mt-auto">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            SSL Secured
          </span>
          <span className="flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
            Official Government Portal
          </span>
          <span className="flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            Support: 1800-XXX-XXXX
          </span>
        </div>
        <div className="mt-2 sm:mt-0">
          © 2026 State Medical Board
        </div>
      </footer>
    </div>
  );
};

export default ResultsLogin;
