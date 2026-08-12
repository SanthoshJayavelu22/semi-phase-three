// client/src/pages/institute/components/InstituteERPHallTicket.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  RefreshCw,
  UserCheck,
  Sparkles,
  X,
  FileText,
  Sliders,
  Check
} from 'lucide-react';
import examService from '../../../api/exams';
import { getUploadUrl } from '../../../api/apiClient';
import semiLogo from '../../../assets/semi logo.png';

const InstituteERPHallTicket = ({
  courses = [],
  batches = [],
  students = [],
  examApplications = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedExamAppId, setSelectedExamAppId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modal states for live preview & print
  const [viewingTickets, setViewingTickets] = useState(null);
  const [viewingBatchInfo, setViewingBatchInfo] = useState(null);

  // Exam Details state - populated from selected exam application
  const [examDetails, setExamDetails] = useState({
    examType: '',
    semesterLabel: '',
    headerTitle: '',
    organizationTitle: "Society for Emergency Medicine India (SEMI)",
    theoryCentre: '',
    theoryAddress: '',
    theoryTime: '',
    practicalExam: {
      name: '',
      venue: '',
      date: '',
      time: '',
      subjects: []
    },
    showPracticalSection: false,
    controllerName: 'Dr Sowjanya Patibandla',
    controllerTitle: 'Controller - Examinations, SEMI',
    controllerSignatureUrl: null,
    instructions: [
      'Theory exam reporting time 9am',
      'Theory examination hall closes by 9:30am, any candidate appearing after 9:30am shall not be allowed to write exam',
      'For Practical exam candidates should report in centre by 8am',
      'Hall ticket becomes valid only after attaching latest passport size photo on the top right corner and attested by program director with seal',
      'Failing to carry hall ticket to exam centre, disqualifies the candidate to give exam'
    ],
    subjects: []
  });

  // ─── NEW: Fetch exam application details when selected ──────────────────
  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!selectedExamAppId) {
        setSelectedStudents([]);
        return;
      }

      setLoading(true);
      try {
        const res = await examService.getExamApplicationById(selectedExamAppId);
        const app = res.data?.data || res.data;
        if (!app) {
          setErrorMsg('Failed to load exam application details.');
          return;
        }

        const courseName = app.course?.name || 'CCT-EM Fellowship';
        const semesterNum = app.semesterNumber || 1;
        const semesterLabel = `Semester ${semesterNum}`;

        // Build subjects with dates from subjectSchedules
        const subjectSchedulesMap = {};
        (app.subjectSchedules || []).forEach(s => {
          if (s.subject) {
            subjectSchedulesMap[s.subject] = s;
          }
        });

        const subjects = (app.subjects || []).map((subject, index) => ({
          paperNumber: index + 1,
          paperName: subject,
          date: subjectSchedulesMap[subject]?.date
            || new Date(Date.now() + 86400000 * (12 + index)).toISOString().split('T')[0],
          time: subjectSchedulesMap[subject]?.time || '10:00 AM'
        }));

        // Get practical exam details
        const practicalExam = app.practicalExam || {
          name: '',
          venue: '',
          date: null,
          time: '',
          subjects: []
        };

        // Pre-populate the form with admin-published details
        setExamDetails(prev => ({
          ...prev,
          examType: courseName,
          semesterLabel: semesterLabel,
          headerTitle: `${courseName} Examination Hall Ticket - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          theoryCentre: app.examVenue || '',
          theoryAddress: app.examCenter || '',
          theoryTime: app.reportingTime || '',
          subjects: subjects,
          practicalExam: {
            name: practicalExam.name || '',
            venue: practicalExam.venue || '',
            date: practicalExam.date ? new Date(practicalExam.date).toISOString().split('T')[0] : '',
            time: practicalExam.time || '',
            subjects: practicalExam.subjects || []
          },
          showPracticalSection: !!(practicalExam.venue || practicalExam.name),
        }));

        // Auto-select students from the application
        if (app.students && app.students.length > 0) {
          const studentIds = app.students.map(s => s._id || s.id);
          setSelectedStudents(studentIds);
        }

        // Set course and batch filters
        if (app.course?._id) {
          setSelectedCourseId(app.course._id);
        }
        if (app.batch?._id) {
          setSelectedBatchId(app.batch._id);
        }

        // Show success message
        setSuccessMsg(`✅ Loaded exam application: ${courseName} - ${semesterLabel}`);
      } catch (err) {
        console.error('Failed to fetch exam application details:', err);
        setErrorMsg(err.parsedMessage || err.message || 'Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [selectedExamAppId]);

  // ─── Filter students based on search criteria ──────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = `${s.firstName || ''} ${s.lastName || ''} ${s.fullName || ''}`.toLowerCase();
      const enroll = (s.enrollmentNo || s.enrollmentId || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || enroll.includes(searchQuery.toLowerCase());

      const bId = String(s.batchId || s.batch?._id || s.batch || '');
      const cId = String(s.courseId || s.course?._id || s.course || '');
      const matchesBatch = !selectedBatchId || bId === String(selectedBatchId);
      const matchesCourse = !selectedCourseId || cId === String(selectedCourseId);

      return matchesSearch && (matchesBatch || !selectedBatchId) && (matchesCourse || !selectedCourseId);
    });
  }, [students, searchQuery, selectedBatchId, selectedCourseId]);

  // ─── Select / Deselect handlers ─────────────────────────────────────────
  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id || s.id));
    }
  };

  // ─── Generate Hall Tickets Handler ──────────────────────────────────────
  const handleGenerateHallTickets = async () => {
    if (selectedStudents.length === 0) {
      setErrorMsg('Please select at least one eligible candidate.');
      return;
    }

    if (!selectedExamAppId) {
      setErrorMsg('Please select an exam application first.');
      return;
    }

    // Check if exam details are populated
    if (!examDetails.theoryCentre || !examDetails.theoryTime) {
      setErrorMsg('Exam schedule details are missing. Please ensure the academic board has published the schedule.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Call the backend to generate hall tickets
      const res = await examService.generateHallTickets(selectedExamAppId);
      const result = res.data?.data || res.data;

      if (result && result.tickets && result.tickets.length > 0) {
        setSuccessMsg(`🎉 Successfully generated ${result.tickets.length} hall ticket(s)!`);

        // Store tickets for preview
        setViewingTickets(result.tickets);
        setViewingBatchInfo({
          batchName: `Exam: ${result.tickets[0]?.courseName || 'CCT-EM'}`,
          courseName: result.tickets[0]?.courseName || 'CCT-EM Fellowship'
        });

        // Update exam details from the response
        if (result.examDetails) {
          const details = result.examDetails;
          const scheduleMap = {};
          (details.subjectSchedules || []).forEach(s => {
            if (s.subject) scheduleMap[s.subject] = s;
          });
          const subjects = (details.subjects || []).map((subject, index) => ({
            paperNumber: index + 1,
            paperName: subject,
            date: scheduleMap[subject]?.date
              || new Date(Date.now() + 86400000 * (12 + index)).toISOString().split('T')[0],
            time: scheduleMap[subject]?.time || '10:00 AM'
          })) || [];

          const practicalExam = details.practicalExam || {
            name: '',
            venue: '',
            date: null,
            time: '',
            subjects: []
          };

          setExamDetails(prev => ({
            ...prev,
            theoryCentre: details.examVenue || prev.theoryCentre,
            theoryAddress: details.examCenter || prev.theoryAddress,
            theoryTime: details.reportingTime || prev.theoryTime,
            subjects: subjects,
            practicalExam: {
              name: practicalExam.name || '',
              venue: practicalExam.venue || '',
              date: practicalExam.date ? new Date(practicalExam.date).toISOString().split('T')[0] : '',
              time: practicalExam.time || '',
              subjects: practicalExam.subjects || []
            },
            showPracticalSection: !!(practicalExam.venue || practicalExam.name),
            headerTitle: `${details.courseName || 'CCT-EM'} Examination Hall Ticket - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          }));
        }
      } else {
        setErrorMsg('No hall tickets were generated. Please try again.');
      }
    } catch (err) {
      console.error('Error generating hall tickets:', err);
      setErrorMsg(err.parsedMessage || err.message || 'Failed to generate hall tickets.');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Print Window Trigger ──────────────────────────────────────────────
  const handlePrint = () => {
    if (!viewingTickets || viewingTickets.length === 0) return;
    const html = generatePrintHTML(viewingTickets, viewingBatchInfo);
    const printWin = window.open('', '_blank', 'width=1000,height=800');
    if (!printWin) {
      alert('Please allow popups to open the print preview.');
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  // ─── Generate Print HTML ────────────────────────────────────────────────
  const generatePrintHTML = (tickets, batchInfo) => {
    const resolvePhoto = (photoUrl) => photoUrl ? getUploadUrl(photoUrl) : '';

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SEMI Hall Tickets - ${batchInfo?.batchName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
            body { font-family: Arial, sans-serif; padding: 20px; background: #ffffff; color: #000000; line-height: 1.3; }
            .page-container { page-break-after: always; max-width: 800px; margin: 0 auto 40px auto; padding: 10px; }

            /* Top Header */
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .header-title { font-size: 18px; font-weight: bold; text-decoration: underline; margin: 0 0 4px 0; }
            .header-subtitle { font-size: 17px; font-weight: bold; text-decoration: underline; margin: 0; }

            .photo-box {
              width: 130px;
              height: 150px;
              border: 1px solid #000;
              background: #dbeafe;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              color: #475569;
              font-weight: normal;
              float: right;
            }

            .section-header { font-size: 14px; font-weight: bold; font-style: italic; margin-top: 18px; margin-bottom: 6px; text-decoration: underline; }
            .section-header .time-span { font-style: normal; font-weight: bold; float: right; text-decoration: none; }

            .candidate-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 15px; }
            .candidate-table td { border: 1px solid #000; padding: 8px 12px; font-size: 13px; vertical-align: middle; }
            .candidate-table .label-col { width: 30%; font-weight: normal; }
            .candidate-table .val-col { font-weight: bold; font-size: 14px; }
            .signature-hint { color: #cbd5e1; font-weight: normal; font-size: 13px; float: right; font-style: normal; }

            .exam-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 15px; }
            .exam-table th, .exam-table td { border: 1px solid #000; padding: 8px 12px; font-size: 13px; text-align: left; vertical-align: middle; }
            .exam-table th { font-weight: normal; }
            .yellow-highlight { background-color: #ffff00; font-weight: bold; }

            .instructions-list { margin: 6px 0 25px 0; padding-left: 20px; font-size: 13px; }
            .instructions-list li { margin-bottom: 4px; }

            .signatory-block { margin-top: 20px; float: left; }
            .sig-img { height: 45px; width: auto; margin-bottom: 2px; }
            .sig-name { font-weight: bold; font-size: 13.5px; }
            .sig-title { font-weight: bold; font-size: 13.5px; }

            @media print {
              body { padding: 0; }
              .page-container { page-break-after: always; margin-bottom: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
    `;

    tickets.forEach((ticket) => {
      // Get theory subjects with schedules (from ticket if available, else form state)
      const ticketSubjects = ticket.subjectSchedules || ticket.subjects || examDetails.subjects || [];

      // Get practical exam details from ticket or examDetails
      const practical = ticket.practicalExam || examDetails.practicalExam || {};
      const hasPractical = !!(practical.venue || practical.name);

      html += `
        <div class="page-container">
          <!-- Logo & Header Title -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div style="text-align: center; width: 80%;">
                  <img src="${semiLogo}" alt="SEMI Logo" style="height: 60px; width: auto; margin: 0 auto 6px auto; display: block;" />
                  <h3 class="header-title">${examDetails.headerTitle || 'CCT-EM Examination Hall Ticket'}</h3>
                  <h3 class="header-subtitle">${examDetails.organizationTitle}</h3>
                </div>
              </td>
              <td style="width: 140px; vertical-align: top;">
                <div class="photo-box">
                  ${ticket.photoUrl ? `<img src="${resolvePhoto(ticket.photoUrl)}" style="width:100%;height:100%;object-fit:cover;" />` : 'PHOTO'}
                </div>
              </td>
            </tr>
          </table>

          <!-- Section I. Candidate Details -->
          <div class="section-header">Section I. Candidate Details:</div>
          <table class="candidate-table">
            <tr>
              <td class="label-col">Name of the Candidate</td>
              <td class="val-col">
                ${(ticket.studentName || '').toUpperCase()}
                <span class="signature-hint">Candidate's Signature</span>
              </td>
            </tr>
            <tr>
              <td class="label-col">Hall ticket Number</td>
              <td class="val-col">${ticket.enrollmentId || ticket.ticketId || ''}</td>
            </tr>
            <tr>
              <td class="label-col">Name of the Enrolled<br/>Institute for CCT-EM</td>
              <td class="val-col">${(ticket.instituteName || '').toUpperCase()}</td>
            </tr>
            <tr>
              <td class="label-col">Program Director</td>
              <td>
                <span class="signature-hint">Signature & Institute's Seal</span>
              </td>
            </tr>
          </table>

          <!-- Section II. Theory Examinations -->
          <div class="section-header">
            Section II. Theory Examinations:
            <span class="time-span">Time: ${examDetails.theoryTime || '10am to 1pm'}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: bold; margin-bottom: 6px;">
            Theory Centre - <span class="yellow-highlight">${(examDetails.theoryCentre || '').toUpperCase()}</span>
          </div>

          <table class="exam-table">
            <thead>
              <tr>
                <th style="width: 20%;">Date</th>
                <th style="width: 30%;">Subject</th>
                <th style="width: 25%;">Time</th>
                <th>Appearing</th>
              </tr>
            </thead>
            <tbody>
              ${(ticketSubjects || []).map((s, i) => `
                <tr>
                  <td>${s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}</td>
                  <td>
                    <strong>Paper ${s.paperNumber || i + 1}</strong><br/>
                    ${s.paperName || s.subject || 'Subject'}
                  </td>
                  <td>${s.time || examDetails.theoryTime || '10:00 AM'}</td>
                  <td>
                    Yes
                    <span class="signature-hint">Invigilator's Signature</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Section III. Practical Examination -->
          ${hasPractical ? `
            <div class="section-header">
              Section III. Practical Examination:
              <span class="time-span">Time: ${practical.time || '8am to 5pm'}</span>
            </div>
            <table class="exam-table">
              <tr>
                <td style="width: 25%;">Date</td>
                <td style="width: 75%;">${practical.date ? new Date(practical.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}</td>
              </tr>
              <tr>
                <td>Practical Centre</td>
                <td><span class="yellow-highlight">${(practical.venue || '').toUpperCase()}</span></td>
              </tr>
              ${practical.name ? `
                <tr>
                  <td>Exam Name</td>
                  <td>${practical.name}</td>
                </tr>
              ` : ''}
              ${(practical.subjects || []).length > 0 ? `
                <tr>
                  <td>Subjects</td>
                  <td>${(practical.subjects || []).map(sub => `<strong>${sub}</strong>`).join('<br/>')}</td>
                </tr>
              ` : ''}
              <tr>
                <td>Appearing</td>
                <td>
                  Yes
                  <span class="signature-hint">Centre Coordinator's Signature</span>
                </td>
              </tr>
            </table>
          ` : ''}

          <!-- Section IV. Instructions -->
          <div class="section-header">Section ${hasPractical ? 'IV' : 'III'}. Instructions:</div>
          <ol class="instructions-list">
            ${(examDetails.instructions || []).map(inst => `<li>${inst}</li>`).join('')}
          </ol>

          <!-- Signatory Block -->
          <div class="signatory-block">
            ${examDetails.controllerSignatureUrl ? `
              <img src="${examDetails.controllerSignatureUrl}" style="height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 4px; display: block;" />
            ` : `
              <svg class="sig-img" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 40 C30 10, 50 50, 70 20 C90 10, 110 45, 140 25 C160 15, 180 35, 195 20" stroke="#000" stroke-width="2.5" fill="none"/>
                <circle cx="145" cy="45" r="2" fill="#000"/>
                <circle cx="155" cy="45" r="2" fill="#000"/>
              </svg>
            `}
            <div class="sig-name">${examDetails.controllerName || 'Dr Sowjanya Patibandla'}</div>
            <div class="sig-title">${examDetails.controllerTitle || 'Controller - Examinations, SEMI'}</div>
          </div>
        </div>
      `;
    });

    html += `
        </body>
      </html>
    `;

    return html;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-left font-sans pb-12">
      {/* ── Top Header Banner ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            SEMI Central Academic Controller
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
            Hall Ticket Management & Issuance Portal
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Select an approved exam application, configure examination schedules, and generate official hall tickets.
          </p>
        </div>
      </div>

      {/* ─── Notifications ────────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-2xl text-xs font-bold text-rose-800 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Exam Application Selector ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
              Select Exam Application <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedExamAppId}
              onChange={(e) => setSelectedExamAppId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Select an approved exam application...</option>
              {examApplications
                .filter(app => app.status === 'Approved' || app.status === 'SchedulePublished')
                .map(app => (
                  <option key={app._id} value={app._id}>
                    {app.course?.name || app.courseName || 'Course'} - Semester {app.semesterNumber} ({app.students?.length || 0} students)
                    {app.examVenue ? ' ✅ Scheduled' : ''}
                  </option>
                ))}
              {examApplications.filter(app => app.status === 'Approved' || app.status === 'SchedulePublished').length === 0 && (
                <option value="">No approved exam applications available</option>
              )}
            </select>
          </div>
          <div className="md:w-48 flex items-end">
            <button
              type="button"
              onClick={handleGenerateHallTickets}
              disabled={generating || selectedStudents.length === 0 || !selectedExamAppId || loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Ticket className="w-4 h-4" /> Issue {selectedStudents.length} Ticket(s)</>
              )}
            </button>
          </div>
        </div>
        {selectedExamAppId && examDetails.theoryCentre && (
          <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Schedule loaded: {examDetails.theoryCentre} • {examDetails.theoryTime}</span>
          </div>
        )}
        {selectedExamAppId && !examDetails.theoryCentre && !loading && (
          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Schedule not yet published by the Academic Board. Please wait for schedule publication.</span>
          </div>
        )}
      </div>

      {/* ─── Main Layout ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Panel: Candidate Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Candidate Fellows
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">Select students for hall tickets</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all"
              >
                {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect' : 'Select All'}
              </button>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Batches</option>
                {batches.map(b => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name || `Batch ${b.year}`}
                  </option>
                ))}
              </select>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.courseName || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Cards */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentId = student._id || student.id;
                  const isSelected = selectedStudents.includes(studentId);
                  const name = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Dr. Candidate';
                  const enrollNo = student.enrollmentNo || student.enrollmentId || `SEMI-${studentId.substring(0, 6)}`;
                  const course = student.courseName || student.course?.name || 'General Medicine';
                  const batch = student.batchName || (student.batch?.year ? `Batch ${student.batch.year}` : 'Batch 2026');

                  return (
                    <div
                      key={studentId}
                      onClick={() => handleStudentSelect(studentId)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-white border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-inner">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 truncate">{name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono font-bold text-blue-600">{enrollNo}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] text-slate-400 font-medium truncate">{course}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {batch}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                  <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No matching candidates found</p>
                  <p className="text-[10px] text-slate-400">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Exam Details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                Examination Details
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {selectedExamAppId ? 'Schedule loaded from exam application' : 'Select an exam application to load details'}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : selectedExamAppId ? (
              <div className="space-y-4 text-xs">
                {/* Theory Venue */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Theory Centre Name</label>
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs">
                      {examDetails.theoryCentre || 'Not published yet'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Time Slot</label>
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs">
                      {examDetails.theoryTime || 'Not published yet'}
                    </div>
                  </div>
                </div>

                {/* Theory Papers */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Theory Papers & Schedule</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(examDetails.subjects || []).length > 0 ? (
                      examDetails.subjects.map((sub, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-blue-600">Paper {sub.paperNumber}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                              {sub.paperName}
                            </div>
                            <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold">
                              {sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}
                            </div>
                            <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold">
                              {sub.time || examDetails.theoryTime || '10:00 AM'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 font-medium">
                        No subjects published yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Practical Exam Section */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Practical Exam Section</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${examDetails.showPracticalSection ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {examDetails.showPracticalSection ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {examDetails.showPracticalSection && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Exam Name</label>
                          <div className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs">
                            {examDetails.practicalExam?.name || 'Practical Examination'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Venue</label>
                          <div className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs">
                            {examDetails.practicalExam?.venue || 'Not published yet'}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Date</label>
                          <div className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[10px]">
                            {examDetails.practicalExam?.date ? new Date(examDetails.practicalExam.date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Time</label>
                          <div className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs">
                            {examDetails.practicalExam?.time || 'Not published yet'}
                          </div>
                        </div>
                      </div>
                      {(examDetails.practicalExam?.subjects || []).length > 0 && (
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Subjects</label>
                          <div className="flex flex-wrap gap-1.5">
                            {examDetails.practicalExam.subjects.map((sub, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Controller Signatory */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">Controller Signatory</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Controller Name</label>
                      <div className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs">
                        {examDetails.controllerName || 'Dr Sowjanya Patibandla'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Controller Title</label>
                      <div className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs">
                        {examDetails.controllerTitle || 'Controller - Examinations, SEMI'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium">
                <FileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p>Select an exam application to load the schedule</p>
                <p className="text-xs mt-1">Only approved applications with published schedules are shown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── PRINT PREVIEW MODAL ────────────────────────────────────────────── */}
      {viewingTickets && viewingTickets.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col scale-in-center overflow-hidden">

            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-inner">
                  <Ticket className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Generated Admit Tickets ({viewingTickets.length})</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEMI Board Examination Passports</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Tickets
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

            {/* Preview Body */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-slate-100 text-black">
              {viewingTickets.map((ticket, idx) => (
                <div key={idx} className="bg-white border border-slate-300 p-8 shadow-md max-w-3xl mx-auto text-left font-serif space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4 pb-2 border-b-0">
                    <div className="flex-1 text-center pr-4">
                      <img src={semiLogo} alt="SEMI Logo" className="h-16 w-auto mx-auto mb-2 object-contain" />
                      <h2 className="text-lg font-bold underline leading-snug">
                        {examDetails.headerTitle || 'CCT-EM Examination Hall Ticket'}
                      </h2>
                      <h3 className="text-base font-bold underline mt-1">{examDetails.organizationTitle}</h3>
                    </div>
                    <div className="w-32 h-40 border border-black bg-blue-100 flex flex-col items-center justify-center flex-shrink-0 text-slate-500 font-sans text-xs font-normal">
                      {ticket.photoUrl ? (
                        <img src={getUploadUrl(ticket.photoUrl)} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <span>PHOTO</span>
                      )}
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold italic underline font-sans">Section I. Candidate Details:</h4>
                    <table className="w-full border border-black text-xs font-sans border-collapse">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black w-1/3 font-normal">Name of the Candidate</td>
                          <td className="p-2 font-bold uppercase flex justify-between items-center">
                            <span>{ticket.studentName || 'Candidate'}</span>
                            <span className="text-slate-300 font-normal italic text-[11px]">Candidate's Signature</span>
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black font-normal">Hall ticket Number</td>
                          <td className="p-2 font-bold font-mono text-sm">{ticket.enrollmentId || ticket.ticketId || 'N/A'}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black font-normal">Name of the Enrolled<br/>Institute for CCT-EM</td>
                          <td className="p-2 font-bold uppercase">{ticket.instituteName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-black font-normal">Program Director</td>
                          <td className="p-2 text-right">
                            <span className="text-slate-300 font-normal italic text-[11px]">Signature & Institute's Seal</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Theory Papers */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-sm font-bold font-sans">
                      <span className="italic underline">Section II. Theory Examinations:</span>
                      <span>Time: {examDetails.theoryTime || '10am to 1pm'}</span>
                    </div>
                    <div className="text-xs font-bold font-sans">
                      Theory Centre - <span className="bg-yellow-300 px-1 py-0.5">{(examDetails.theoryCentre || '').toUpperCase()}</span>
                    </div>

                    <table className="w-full border border-black text-xs font-sans border-collapse mt-2">
                      <thead>
                        <tr className="border-b border-black text-left font-normal">
                          <th className="p-2 border-r border-black w-1/5 font-normal">Date</th>
                          <th className="p-2 border-r border-black w-2/5 font-normal">Subject</th>
                          <th className="p-2 border-r border-black w-1/5 font-normal">Time</th>
                          <th className="p-2 font-normal">Appearing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ticket.subjectSchedules || ticket.subjects || examDetails.subjects || []).map((sub, i) => (
                          <tr key={i} className="border-b border-black last:border-b-0">
                            <td className="p-2 border-r border-black font-medium">
                              {sub.date ? new Date(sub.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}
                            </td>
                            <td className="p-2 border-r border-black">
                              <strong>Paper {sub.paperNumber || i + 1}</strong><br/>
                              {sub.paperName || sub.subject || 'Subject'}
                            </td>
                            <td className="p-2 border-r border-black">
                              {sub.time || examDetails.theoryTime || '10:00 AM'}
                            </td>
                            <td className="p-2 flex justify-between items-center">
                              <span>Yes</span>
                              <span className="text-slate-300 font-normal italic text-[11px]">Invigilator's Signature</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Practical Section */}
                  {examDetails.showPracticalSection && (examDetails.practicalExam?.venue || examDetails.practicalExam?.name) && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-sm font-bold font-sans">
                        <span className="italic underline">Section III. Practical Examination:</span>
                        <span>Time: {examDetails.practicalExam?.time || '8am to 5pm'}</span>
                      </div>
                      <table className="w-full border border-black text-xs font-sans border-collapse">
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black w-1/4">Date</td>
                            <td className="p-2">
                              {examDetails.practicalExam?.date ? new Date(examDetails.practicalExam.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}
                            </td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black">Practical Centre</td>
                            <td className="p-2">
                              <span className="bg-yellow-300 px-1 py-0.5 font-bold">{(examDetails.practicalExam?.venue || '').toUpperCase()}</span>
                            </td>
                          </tr>
                          {examDetails.practicalExam?.name && (
                            <tr className="border-b border-black">
                              <td className="p-2 border-r border-black">Exam Name</td>
                              <td className="p-2">{examDetails.practicalExam.name}</td>
                            </tr>
                          )}
                          {(examDetails.practicalExam?.subjects || []).length > 0 && (
                            <tr className="border-b border-black">
                              <td className="p-2 border-r border-black">Subjects</td>
                              <td className="p-2 font-semibold">
                                {examDetails.practicalExam.subjects.map((s, i) => (
                                  <div key={i}>{s}</div>
                                ))}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="p-2 border-r border-black">Appearing</td>
                            <td className="p-2 flex justify-between items-center">
                              <span>Yes</span>
                              <span className="text-slate-300 font-normal italic text-[11px]">Centre Coordinator's Signature</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="space-y-1 pt-1 font-sans text-xs">
                    <h4 className="text-sm font-bold italic underline">Section {examDetails.showPracticalSection && (examDetails.practicalExam?.venue || examDetails.practicalExam?.name) ? 'IV' : 'III'}. Instructions:</h4>
                    <ol className="list-decimal pl-5 space-y-1 font-normal text-slate-800">
                      {(examDetails.instructions || []).map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Controller Signature */}
                  <div className="pt-4 font-sans text-xs">
                    {examDetails.controllerSignatureUrl ? (
                      <img src={examDetails.controllerSignatureUrl} alt="Controller Signature" className="h-10 max-w-[160px] object-contain mb-1" />
                    ) : (
                      <svg className="h-10 w-36 mb-1" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 40 C30 10, 50 50, 70 20 C90 10, 110 45, 140 25 C160 15, 180 35, 195 20" stroke="#000" strokeWidth="2.5" fill="none"/>
                        <circle cx="145" cy="45" r="2" fill="#000"/>
                        <circle cx="155" cy="45" r="2" fill="#000"/>
                      </svg>
                    )}
                    <div className="font-bold text-sm">{examDetails.controllerName || 'Dr Sowjanya Patibandla'}</div>
                    <div className="font-bold text-xs">{examDetails.controllerTitle || 'Controller - Examinations, SEMI'}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEMI Board Official Examination Tickets</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <Printer className="w-4 h-4" />
                  Print Tickets
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTickets(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteERPHallTicket;
