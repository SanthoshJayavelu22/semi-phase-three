import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Ticket, X, CheckCircle2, XCircle, AlertTriangle, Printer, HelpCircle, RefreshCw } from 'lucide-react';
import examService from '../../../api/exams';
import { getUploadUrl } from '../../../api/apiClient';

const InstituteERPHallTicket = ({
  courses = [],
  batches = [],
  examApplications = [],
  fetchERPData
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [viewingTickets, setViewingTickets] = useState(null);
  const [viewingBatchInfo, setViewingBatchInfo] = useState(null);

  // Initialize selected values
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setTimeout(() => setSelectedCourseId(courses[0]?.id || courses[0]?._id || ''), 0);
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setTimeout(() => setSelectedBatchId(batches[0]?.id || batches[0]?._id || ''), 0);
    }
  }, [batches, selectedBatchId]);

  // Filter applications that have schedule published
  const filteredApps = useMemo(() => {
    return examApplications.filter(app => {
      if (app.status !== 'SchedulePublished' && app.status !== 'Approved') return false;

      const batchName = app.batch?.year ? `Batch ${app.batch.year}` : app.batch?.name || '';
      const courseName = app.course?.name || '';
      const query = searchQuery.toLowerCase();

      return batchName.toLowerCase().includes(query) ||
             courseName.toLowerCase().includes(query);
    });
  }, [examApplications, searchQuery]);

  // Handle generating hall tickets
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedBatchId) {
      setErrorMsg("Please select both a Course and a Batch.");
      return;
    }

    const approvedApp = examApplications.find(app => 
      String(app.course?._id || app.course) === String(selectedCourseId) &&
      String(app.batch?._id || app.batch) === String(selectedBatchId) &&
      (app.status === 'SchedulePublished' || app.status === 'Approved')
    );

    if (!approvedApp) {
      setErrorMsg("No approved and scheduled exam application found for the selected course and batch.");
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await examService.generateHallTickets(approvedApp._id || approvedApp.id);
      const resData = response.data?.data || response.data || {};
      const tickets = resData.tickets || (Array.isArray(resData) ? resData : []);

      if (fetchERPData) {
        await fetchERPData();
      }

      setSuccessMsg(`Hall tickets generated successfully for ${tickets.length} candidates!`);

      setViewingTickets(tickets);
      setViewingBatchInfo({
        batchName: approvedApp.batch?.year ? `Batch ${approvedApp.batch.year}` : approvedApp.batch?.name || 'Batch',
        courseName: approvedApp.course?.name || 'Course'
      });
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to generate hall tickets.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle viewing tickets from the table
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

  // Generate printable HTML
  const generatePrintHTML = (tickets, batchInfo) => {
    const resolvePhoto = (photoUrl) => photoUrl ? getUploadUrl(photoUrl) : '';
    let html = `
      <html>
        <head>
          <title>SEMI Hall Tickets - ${batchInfo?.batchName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: white; }
            .ticket-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .ticket-card { 
              border: 2px solid #1a365d; 
              border-radius: 12px; 
              overflow: hidden; 
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            .ticket-header { 
              background: linear-gradient(135deg, #1a365d, #2b6cb0); 
              color: white; 
              padding: 12px 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .ticket-header h4 { margin: 0; font-size: 14px; }
            .ticket-header .badge { 
              background: rgba(255,255,255,0.2); 
              padding: 2px 10px; 
              border-radius: 4px; 
              font-size: 10px;
              border: 1px solid rgba(255,255,255,0.3);
            }
            .ticket-body { padding: 16px; display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
            .ticket-info { font-size: 12px; }
            .ticket-info .label { color: #718096; font-weight: bold; font-size: 10px; text-transform: uppercase; }
            .ticket-info .value { font-weight: bold; color: #1a202c; margin-bottom: 6px; }
            .photo-placeholder { 
              width: 80px; 
              height: 96px; 
              background: #f7fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              color: #a0aec0;
            }
            .ticket-footer { 
              background: #f7fafc; 
              padding: 10px 16px; 
              border-top: 1px solid #e2e8f0;
              display: grid;
              grid-template-columns: 2fr 1fr;
              font-size: 10px;
              color: #4a5568;
            }
            .ticket-footer .label { font-weight: bold; color: #a0aec0; text-transform: uppercase; font-size: 8px; }
            @media print {
              .no-print { display: none; }
              .ticket-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
              .ticket-card { page-break-inside: avoid; break-inside: avoid; }
            }
            @media (max-width: 600px) {
              .ticket-grid { grid-template-columns: 1fr; }
              .ticket-body { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #1a365d; margin: 0;">SEMI Examination Hall Tickets</h2>
            <p style="color: #4a5568; margin: 4px 0;">${batchInfo?.batchName} - ${batchInfo?.courseName}</p>
            <p style="color: #718096; font-size: 12px; margin: 0;">Generated on ${new Date().toLocaleDateString()}</p>
            <hr style="border: 1px solid #e2e8f0; margin: 16px 0;" />
          </div>
          <div class="ticket-grid">
    `;

    tickets.forEach((ticket) => {
      const examDate = ticket.examDate ? new Date(ticket.examDate).toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'TBD';

      html += `
        <div class="ticket-card">
          <div class="ticket-header">
            <h4>HALL TICKET</h4>
            <span class="badge">OFFICIAL</span>
          </div>
          <div class="ticket-body">
            <div class="ticket-info">
              <div><span class="label">Candidate Name</span></div>
              <div class="value">${ticket.studentName || 'N/A'}</div>
              <div style="margin-top: 6px;"><span class="label">Enrollment ID</span></div>
              <div class="value" style="color: #2b6cb0;">${ticket.enrollmentId || 'N/A'}</div>
              <div style="margin-top: 6px;"><span class="label">Course Program</span></div>
              <div class="value">${ticket.courseName || 'N/A'}</div>
              <div style="margin-top: 6px;"><span class="label">Exam Date</span></div>
              <div class="value">${examDate}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div class="photo-placeholder">${ticket.photoUrl ? `<img src="${resolvePhoto(ticket.photoUrl)}" style="width:100%;height:100%;object-fit:cover;" />` : '👤'}</div>
              <span style="font-size: 8px; color: #a0aec0; margin-top: 4px;">Photo verified</span>
            </div>
          </div>
          <div class="ticket-footer">
            <div>
              <div><span class="label">Exam Center</span></div>
              <div style="font-weight: bold;">${ticket.instituteName || 'N/A'}</div>
              <div style="font-size: 9px; color: #718096;">${ticket.instituteAddress || ''}</div>
            </div>
            <div style="text-align: right;">
              <div><span class="label">Ticket ID</span></div>
              <div style="font-weight: bold; font-size: 10px;">${ticket.ticketId || 'N/A'}</div>
              <div style="font-size: 9px; color: #718096;">${ticket.reportingTime || ''}</div>
            </div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 10px;">
            © ${new Date().getFullYear()} Society for Emergency Medicine India (SEMI) • This is a system-generated document
          </div>
        </body>
      </html>
    `;

    return html;
  };

  // Handle print
  const handlePrint = () => {
    if (!viewingTickets || viewingTickets.length === 0) {
      setErrorMsg('No tickets to print.');
      return;
    }

    const html = generatePrintHTML(viewingTickets, viewingBatchInfo);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setErrorMsg('Please allow popups to print hall tickets.');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* Success/Error Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm">
          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generate Hall Ticket Panel */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hall Ticket Generator</h2>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Generate hall tickets for scheduled examinations</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Selector */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Batch *</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                required
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name || `Batch ${b.year}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Selector */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Course *</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                required
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.courseName || c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={generating || batches.length === 0 || courses.length === 0}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Ticket className="w-4 h-4" /> Generate Hall Ticket</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Hall Ticket List */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Generated Hall Tickets</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
              {filteredApps.length} scheduled exam(s) ready
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by batch or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
          <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 font-black w-16 text-center">#</th>
                <th className="px-6 py-4 font-black">Batch</th>
                <th className="px-6 py-4 font-black">Course</th>
                <th className="px-6 py-4 font-black text-center">Students</th>
                <th className="px-6 py-4 font-black text-center">Status</th>
                <th className="px-6 py-4 font-black text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
              {filteredApps.map((app, idx) => {
                const serialNo = String(idx + 1).padStart(2, '0');
                const batchText = app.batch?.year ? `Batch ${app.batch.year}` : app.batch?.name || 'Batch';
                const hasTickets = app.hallTicketsGenerated;

                return (
                  <tr key={app._id || app.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{batchText}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{app.course?.name || 'General Medicine'}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{app.students?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      {hasTickets ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Generated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Not Generated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {hasTickets ? (
                          <button
                            type="button"
                            onClick={() => handleViewTickets(app)}
                            disabled={loading}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 cursor-pointer disabled:opacity-50"
                            title="View Hall Tickets"
                          >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium">Generate first</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400 font-semibold space-y-2">
                    <Ticket className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs">No scheduled exam applications found.</p>
                    <p className="text-[10px] text-slate-400 font-medium">Wait for the Academic Board to approve and schedule exams.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tickets Preview Modal */}
      {viewingTickets && viewingTickets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col scale-in-center">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Hall Tickets</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewingBatchInfo?.batchName} | {viewingBatchInfo?.courseName} • {viewingTickets.length} tickets
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
                  Print All
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTickets(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 mb-6">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>You can distribute these tickets to students. Click "Print All" to generate printouts or save them as PDFs.</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {viewingTickets.map((ticket, index) => {
                  const examDate = ticket.examDate ? new Date(ticket.examDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'TBD';

                  return (
                    <div
                      key={ticket.ticketId || index}
                      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-slate-700 flex flex-col"
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

                      {/* Ticket Body */}
                      <div className="p-5 flex-grow grid grid-cols-3 gap-4 text-[10px] font-semibold text-left">
                        <div className="col-span-2 space-y-3.5">
                          <div>
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Candidate Name</span>
                            <span className="text-slate-800 font-extrabold text-xs block truncate">{ticket.studentName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Enrollment ID</span>
                            <span className="text-indigo-600 font-mono font-black block text-xs">{ticket.enrollmentId || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Course Program</span>
                            <span className="text-slate-800 font-bold block truncate">{ticket.courseName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">Exam Date</span>
                            <span className="text-slate-800 font-extrabold block text-xs">{examDate}</span>
                          </div>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center space-y-2 border-l border-slate-100 pl-4">
                          <div className="w-20 h-24 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                            {ticket.photoUrl ? (
                              <img src={getUploadUrl(ticket.photoUrl)} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl text-slate-300">👤</span>
                            )}
                          </div>
                          <span className="text-[7px] text-slate-400 font-bold text-center block leading-normal uppercase">Photo verified</span>
                        </div>
                      </div>

                      {/* Ticket Footer */}
                      <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-left grid grid-cols-2 gap-2 text-[8px] font-semibold text-slate-500">
                        <div>
                          <span className="text-[7px] uppercase font-black text-slate-400 block tracking-wider">Exam Center</span>
                          <span className="text-slate-700 font-bold block truncate">{ticket.instituteName || 'N/A'}</span>
                          <span className="text-slate-400 block truncate leading-tight mt-0.5">{ticket.instituteAddress || ''}</span>
                        </div>
                        <div className="text-right flex flex-col justify-end items-end">
                          <span className="text-[7px] uppercase font-black text-slate-400 block tracking-wider">Ticket ID</span>
                          <span className="font-mono font-bold text-slate-600 block mt-0.5 truncate max-w-[120px]">{ticket.ticketId || 'N/A'}</span>
                          <span className="text-slate-400 text-[8px]">Reporting: {ticket.reportingTime || ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white rounded-b-3xl">
              <span className="text-[10px] text-slate-400 font-medium">
                {viewingTickets.length} ticket{viewingTickets.length > 1 ? 's' : ''} generated
              </span>
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
