import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Download, Ticket, X, CheckCircle2, XCircle, AlertTriangle, Printer, HelpCircle } from 'lucide-react';
import examService from '../../../api/exams';

const InstituteERPHallTicket = ({
  courses = [],
  batches = [],
  students = [],
  examApplications = [],
  fetchERPData,
  user
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // State for previewing ticket cards
  const [viewingTickets, setViewingTickets] = useState(null); // Array of ticket objects
  const [viewingBatchInfo, setViewingBatchInfo] = useState(null);
  
  const [showDevPopup, setShowDevPopup] = useState(true);

  // Initialize selected values
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id || courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id || batches[0]._id);
    }
  }, [batches, selectedBatchId]);

  // Prefix/institute info
  const instituteName = user?.instituteName || 'Saraswathi Inst.';

  // Handle generating hall tickets
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedBatchId) {
      setErrorMsg("Please select both a Course and a Batch.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Find the application that has schedule published for this course and batch
    const approvedApp = examApplications.find(app => 
      String(app.course?._id || app.course) === String(selectedCourseId) &&
      String(app.batch?._id || app.batch) === String(selectedBatchId) &&
      (app.status === 'SchedulePublished' || app.status === 'Approved')
    );

    if (!approvedApp) {
      setErrorMsg("🚫 No approved and scheduled exam application found for the selected course and batch. Ensure the board has approved, scheduled, and published the exam schedule.");
      setLoading(false);
      return;
    }

    try {
      const response = await examService.generateHallTickets(approvedApp._id || approvedApp.id);
      const resData = response.data?.data || response.data || {};
      const tickets = resData.tickets || (Array.isArray(resData) ? resData : []);
      
      if (fetchERPData) {
        await fetchERPData();
      }

      setSuccessMsg(`🎉 Hall tickets generated successfully for ${tickets.length} candidates!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Open preview automatically
      setViewingTickets(tickets);
      setViewingBatchInfo({
        batchName: approvedApp.batch?.year ? `Batch ${approvedApp.batch.year}` : approvedApp.batch?.name || 'Batch',
        courseName: approvedApp.course?.name || 'Course'
      });

    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to generate hall tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing tickets from the table — uses listHallTickets (persisted)
  const handleViewTickets = async (app) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await examService.listHallTickets(app._id || app.id);
      const tickets = response.data?.data || response.data || [];
      setViewingTickets(Array.isArray(tickets) ? tickets : []);
      setViewingBatchInfo({
        batchName: app.batch?.year ? `Batch ${app.batch.year}` : app.batch?.name || 'Batch',
        courseName: app.course?.name || 'Course'
      });
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications that have had schedule published (or approved)
  const filteredApps = useMemo(() => {
    return examApplications.filter(app => {
      if (app.status !== 'SchedulePublished' && app.status !== 'Approved') return false;

      const batchName = app.batch?.year ? `Batch ${app.batch.year}` : app.batch?.name || '';
      const courseName = app.course?.name || '';
      const instName = app.institute?.orgName || '';
      const query = searchQuery.toLowerCase();

      return batchName.toLowerCase().includes(query) ||
             courseName.toLowerCase().includes(query) ||
             instName.toLowerCase().includes(query);
    });
  }, [examApplications, searchQuery]);

  // Trigger browser print for hall tickets
  const handlePrint = () => {
    const printContent = document.getElementById('hall-tickets-print-area').innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Create temporary styling for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SEMI Hall Tickets - ${viewingBatchInfo?.batchName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              .page-break { page-break-after: always; }
              body { background: white; color: black; }
            }
          </style>
        </head>
        <body class="p-8">
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      
      {showDevPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Under Development</h3>
            <p className="text-sm text-slate-500 mb-6">This page is currently under development. Some features may not work as expected.</p>
            <button
              onClick={() => setShowDevPopup(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider w-full cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
      
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. GENERATE HALL TICKET CARD PANEL */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hall Ticket</h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Student Information</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Batch Selector */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                {batches.length === 0 && <option value="">No batches available</option>}
              </select>
            </div>

            {/* Course Selector */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
                {courses.length === 0 && <option value="">No courses available</option>}
              </select>
            </div>

            {/* Institute (Read Only) */}
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Institute</label>
              <input
                type="text"
                readOnly
                value={instituteName}
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading || batches.length === 0 || courses.length === 0}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Ticket className="w-4 h-4" />
              )}
              Generate Hall Ticket
            </button>
          </div>
        </form>
      </div>

      {/* 2. HALL TICKET DOWNLOAD SECTION */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Hall Ticket Download</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Approved batch examination schedules ready for download</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Batches...."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        {/* Download Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
          <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 font-black w-16 text-center">#</th>
                <th className="px-6 py-4 font-black">Batch Name</th>
                <th className="px-6 py-4 font-black">Course</th>
                <th className="px-6 py-4 font-black">Institute</th>
                <th className="px-6 py-4 font-black text-center">Students</th>
                <th className="px-6 py-4 font-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
              {filteredApps.map((app, idx) => {
                const serialNo = String(idx + 1).padStart(2, '0');
                const batchText = app.batch?.year ? `Batch ${app.batch.year}` : app.batch?.name || 'Batch';
                
                return (
                  <tr key={app._id || app.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{batchText}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{app.course?.name || 'General Medicine'}</td>
                    <td className="px-6 py-4 text-slate-500">{app.institute?.orgName || 'N/A'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{app.students?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewTickets(app)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-100"
                          title="View Hall Tickets"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewTickets(app)} // Opens list preview to print/save
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                          title="Download/Print Hall Tickets"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-semibold space-y-2">
                    <Ticket className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs">No approved exam schedules found.</p>
                    <p className="text-[10px] text-slate-400 font-medium">Verify your exam applications have been approved and scheduled by the Board.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKETS PREVIEW & PRINT MODAL */}
      {viewingTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col scale-in-center">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Generated Hall Tickets</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewingBatchInfo?.batchName} | {viewingBatchInfo?.courseName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Tickets
                </button>
                <button 
                  type="button"
                  onClick={() => setViewingTickets(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Scroll area */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                <span>You can distribute these tickets to students. Click "Print All Tickets" to generate printouts or save them as PDFs.</span>
              </div>

              {/* Printable Tickets Area */}
              <div id="hall-tickets-print-area" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {viewingTickets.map((ticket, index) => (
                  <div 
                    key={ticket.ticketId || index} 
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-700 page-break flex flex-col justify-between"
                    style={{ minHeight: '340px' }}
                  >
                    
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-4 text-white flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-[7px] uppercase font-black tracking-widest text-blue-200">Academic Examination Board</span>
                        <h4 className="text-xs font-black tracking-tight leading-tight mt-0.5">SEMI HALL TICKET</h4>
                      </div>
                      <div className="bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
                        <span className="font-mono text-[8px] font-black uppercase tracking-wider">OFFICIAL</span>
                      </div>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-5 flex-grow grid grid-cols-3 gap-4 text-[10px] font-semibold text-left">
                      {/* Left: Info */}
                      <div className="col-span-2 space-y-3.5">
                        <div>
                          <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Candidate Name</span>
                          <span className="text-slate-800 font-extrabold text-xs block truncate">{ticket.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Enrollment ID / Reg ID</span>
                          <span className="text-indigo-600 font-mono font-black block text-xs">{ticket.enrollmentId}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Course Program</span>
                          <span className="text-slate-800 font-bold block truncate">{ticket.courseName}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Scheduled Exam Date</span>
                          <span className="text-slate-800 font-extrabold block">
                            {new Date(ticket.examDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Photo */}
                      <div className="col-span-1 flex flex-col items-center justify-start space-y-2 border-l border-slate-100 pl-4">
                        <div className="w-20 h-24 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                          {ticket.photoUrl ? (
                            <img src={ticket.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl text-slate-300">👤</span>
                          )}
                        </div>
                        <span className="text-[7px] text-slate-400 font-bold text-center block leading-normal uppercase">Photo verified</span>
                      </div>
                    </div>

                    {/* Ticket Footer / Center Info */}
                    <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-left grid grid-cols-2 gap-2 text-[8px] font-semibold text-slate-500">
                      <div>
                        <span className="text-[7px] uppercase font-black text-slate-400 block tracking-wider">Center of Examination</span>
                        <span className="text-slate-700 font-bold block truncate">{ticket.instituteName}</span>
                        <span className="text-slate-400 block truncate leading-tight mt-0.5">{ticket.instituteAddress}</span>
                      </div>
                      <div className="text-right flex flex-col justify-end items-end">
                        <span className="text-[7px] uppercase font-black text-slate-400 block tracking-wider">Ticket ID</span>
                        <span className="font-mono font-bold text-slate-600 block mt-0.5 truncate max-w-[120px]">{ticket.ticketId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end bg-white rounded-b-3xl">
              <button
                type="button"
                onClick={() => setViewingTickets(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteERPHallTicket;
