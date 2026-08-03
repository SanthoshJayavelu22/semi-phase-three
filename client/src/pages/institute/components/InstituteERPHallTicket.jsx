// client/src/pages/institute/components/InstituteERPHallTicket.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ticket, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  HelpCircle, 
  RefreshCw, 
  Building2, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ChevronRight, 
  X,
  FileText,
  FileCheck2,
  Sliders,
  Check,
  Award
} from 'lucide-react';
import { hallTicketAPI } from '../../../api/hallTicket';
import examService from '../../../api/exams';
import { getUploadUrl } from '../../../api/apiClient';
import semiLogo from '../../../assets/semi logo.png';

const InstituteERPHallTicket = ({
  courses = [],
  batches = [],
  students = [],
  examApplications = [],
  fetchERPData,
  user
}) => {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'templates' | 'issued'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default-cct-em');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modal states for live preview & print
  const [viewingTickets, setViewingTickets] = useState(null);
  const [viewingBatchInfo, setViewingBatchInfo] = useState(null);

  const [selectedSemester, setSelectedSemester] = useState('All Semesters');

  // Default Exam Details configuration with fully customizable editing fields
  const [examDetails, setExamDetails] = useState({
    examType: 'Semester Exam',
    semesterLabel: 'Semester 1',
    headerTitle: "CCT-EM Semester Examination Hall ticket - July’26",
    organizationTitle: "Society for Emergency Medicine India (SEMI)",
    theoryCentre: 'DR. MEHTA HOSPITAL, GLOBAL CAMPUS, CHENNAI',
    theoryAddress: 'Main Academic Block, SEMI Campus',
    theoryTime: '10am to 1pm',
    practicalCentre: 'KAUVERY HOSPITAL, VADAPALANI, CHENNAI',
    practicalAddress: 'Emergency Dept, Academic Wing',
    practicalTime: '8am to 5pm',
    practicalDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    showPracticalSection: true,
    controllerName: 'Dr Sowjanya Patibandla',
    controllerTitle: 'Controller - Examinations,SEMI',
    controllerSignatureUrl: null,
    instructions: [
      'Theory exam reporting time 9am',
      'Theory examination hall closes by 9:30am, any candidate appearing after 9:30am shall not be allowed to write exam',
      'For Practical exam candidates should report in centre by 8am',
      'Hall ticket becomes valid only after attaching latest passport size photo on the top right corner and attested by program director with seal',
      'Failing to carry hall ticket to exam centre, disqualifies the candidate to give exam'
    ],
    subjects: [
      { paperNumber: 1, paperName: 'Basic Sciences & Resuscitation', date: new Date(Date.now() + 86400000 * 13).toISOString().split('T')[0] },
      { paperNumber: 2, paperName: 'Surgical Emergencies', date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] },
      { paperNumber: 3, paperName: 'Medical Emergencies', date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0] },
      { paperNumber: 4, paperName: 'Pediatric Emergencies', date: new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0] }
    ]
  });

  // System & custom templates list
  const templates = [
    { id: 'default-cct-em', name: 'SEMI Standard CCT-EM Hall Ticket', type: 'system', badge: 'Official', layout: 'Portrait A4' },
    { id: 'basic-sciences-template', name: 'Basic Sciences Modular Exam Ticket', type: 'system', badge: 'Standard', layout: 'Portrait A4' },
    { id: 'final-year-template', name: 'Final Exit Fellowship Clinical Ticket', type: 'system', badge: 'Board Grade', layout: 'Portrait A4' }
  ];

  // Auto-fetch subjects based on selected Course, Semester, or selected Students
  useEffect(() => {
    const targetCourse = courses.find(c => (c.id || c._id) === selectedCourseId);
    const selectedStudentObjs = students.filter(s => selectedStudents.includes(s._id || s.id));
    const firstStudent = selectedStudentObjs[0];
    const courseName = targetCourse?.courseName || targetCourse?.name || firstStudent?.courseName || firstStudent?.course?.name || '';

    let autoSubjects = [];

    // 1. Try student semester-specific subjects if semester filter is active
    if (firstStudent?.semesters && firstStudent.semesters.length > 0) {
      let paperIndex = 1;
      firstStudent.semesters.forEach((sem, idx) => {
        const semName = sem.semesterName || `Semester ${sem.semesterNumber || idx + 1}`;
        if (selectedSemester === 'All Semesters' || selectedSemester === semName) {
          (sem.subjects || []).forEach(sub => {
            autoSubjects.push({
              paperNumber: paperIndex++,
              paperName: sub.subjectName || sub.name || sub.title || `Paper ${paperIndex}`,
              date: new Date(Date.now() + 86400000 * (12 + paperIndex)).toISOString().split('T')[0]
            });
          });
        }
      });
    }

    // 2. Try course level subjects
    if (autoSubjects.length === 0 && targetCourse?.subjects && targetCourse.subjects.length > 0) {
      let paperIndex = 1;
      targetCourse.subjects.forEach(sub => {
        autoSubjects.push({
          paperNumber: paperIndex++,
          paperName: typeof sub === 'string' ? sub : (sub.name || sub.subjectName || sub.title || `Paper ${paperIndex}`),
          date: new Date(Date.now() + 86400000 * (12 + paperIndex)).toISOString().split('T')[0]
        });
      });
    }

    // 3. Fallback based on Course Name / Semester Choice
    if (autoSubjects.length === 0) {
      const lowerName = courseName.toLowerCase();
      if (selectedSemester !== 'All Semesters') {
        autoSubjects = [
          { paperNumber: 1, paperName: `${selectedSemester} Theory Paper I`, date: new Date(Date.now() + 86400000 * 13).toISOString().split('T')[0] },
          { paperNumber: 2, paperName: `${selectedSemester} Clinical Emergencies Paper II`, date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] }
        ];
      } else if (lowerName.includes('basic') || examDetails.examType === 'Basic Sciences') {
        autoSubjects = [
          { paperNumber: 1, paperName: 'Applied Basic Sciences & Physiology', date: new Date(Date.now() + 86400000 * 13).toISOString().split('T')[0] },
          { paperNumber: 2, paperName: 'Pharmacology & Pathology in Emergencies', date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] }
        ];
      } else {
        autoSubjects = [
          { paperNumber: 1, paperName: 'Basic Sciences & Resuscitation', date: new Date(Date.now() + 86400000 * 13).toISOString().split('T')[0] },
          { paperNumber: 2, paperName: 'Surgical Emergencies', date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] },
          { paperNumber: 3, paperName: 'Medical Emergencies', date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0] },
          { paperNumber: 4, paperName: 'Pediatric Emergencies', date: new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0] }
        ];
      }
    }

    const titlePrefix = selectedSemester !== 'All Semesters' 
      ? `${selectedSemester} CCT-EM Examinations Hall ticket - July’26`
      : lowerNameContains(courseName, 'basic') 
        ? "Basic Sciences CCT-EM Exam Hall ticket - July’26" 
        : "Final Year CCT-EM Examinations Hall ticket - July’26";

    const practicalTitle = (targetCourse?.practicalExams && targetCourse.practicalExams.length > 0)
      ? targetCourse.practicalExams.join(' & ')
      : (targetCourse?.practicalExamName || '');

    setExamDetails(prev => ({
      ...prev,
      headerTitle: titlePrefix,
      subjects: autoSubjects,
      ...(practicalTitle ? { practicalCentre: `${practicalTitle} - ${prev.practicalCentre.split(' - ').pop() || 'KAUVERY HOSPITAL, VADAPALANI, CHENNAI'}` } : {})
    }));
  }, [selectedCourseId, selectedStudents, selectedSemester, courses, students]);

  const lowerNameContains = (str, keyword) => (str || '').toLowerCase().includes(keyword);

  // Filter students based on active search, course & batch selection
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = `${s.firstName || ''} ${s.lastName || ''} ${s.fullName || ''}`.toLowerCase();
      const enroll = (s.enrollmentNo || s.enrollmentId || s.applicationId || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || enroll.includes(searchQuery.toLowerCase());
      
      const bId = String(s.batchId || s.batch?._id || s.batch || '');
      const cId = String(s.courseId || s.course?._id || s.course || '');
      const matchesBatch = !selectedBatchId || bId === String(selectedBatchId) || (s.batchName && s.batchName.includes(selectedBatchId));
      const matchesCourse = !selectedCourseId || cId === String(selectedCourseId) || (s.courseName && s.courseName.includes(selectedCourseId));

      return matchesSearch && (matchesBatch || !selectedBatchId) && (matchesCourse || !selectedCourseId);
    });
  }, [students, searchQuery, selectedBatchId, selectedCourseId]);

  // Select / Deselect handlers
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

  // Exam Subject Management
  const handleAddSubject = () => {
    setExamDetails(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { 
          paperNumber: prev.subjects.length + 1, 
          paperName: '', 
          date: new Date(Date.now() + 86400000 * (14 + prev.subjects.length)).toISOString().split('T')[0] 
        }
      ]
    }));
  };

  const handleRemoveSubject = (index) => {
    setExamDetails(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    setExamDetails(prev => ({
      ...prev,
      subjects: prev.subjects.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      )
    }));
  };

  // Controller Signature image upload handler
  const handleSignatureImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setExamDetails(prev => ({
          ...prev,
          controllerSignatureUrl: uploadEvent.target?.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setExamDetails(prev => ({
      ...prev,
      controllerSignatureUrl: null
    }));
  };

  // Generate Hall Tickets Handler
  const handleGenerateHallTickets = async () => {
    if (selectedStudents.length === 0) {
      setErrorMsg('Please select at least one eligible fellow candidate.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Build candidate hall tickets
      const selectedStudentObjs = students.filter(s => selectedStudents.includes(s._id || s.id));
      const generatedList = selectedStudentObjs.map((student, idx) => {
        const serial = String(idx + 1).padStart(4, '0');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return {
          ticketId: `HT-SEMI-${new Date().getFullYear()}-${rand}`,
          studentName: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Dr. Candidate',
          enrollmentId: student.enrollmentNo || student.enrollmentId || `SEMI-${rand}`,
          courseName: student.courseName || student.course?.name || 'CCT-EM Fellowship',
          batchName: student.batchName || (student.batch?.year ? `Batch ${student.batch.year}` : 'Batch 2026'),
          instituteName: user?.hospitalName || user?.name || 'Accredited Academic Hospital',
          instituteAddress: user?.address || `${user?.city || 'Central'}, India`,
          photoUrl: student.documents?.passportPhotoUrl || student.photoUrl,
          examVenue: examDetails.theoryCentre,
          examAddress: examDetails.theoryAddress,
          examDate: examDetails.subjects[0]?.date || new Date().toISOString().split('T')[0],
          reportingTime: examDetails.theoryTime,
          subjects: examDetails.subjects,
          practicalDetails: {
            centre: examDetails.practicalCentre,
            address: examDetails.practicalAddress,
            date: examDetails.practicalDate,
            timeSlot: examDetails.practicalTime
          }
        };
      });

      if (fetchERPData) {
        await fetchERPData();
      }

      setSuccessMsg(`🎉 Successfully generated ${generatedList.length} accredited Hall Ticket(s)!`);
      setViewingTickets(generatedList);
      setViewingBatchInfo({
        batchName: selectedBatchId ? `Selected Candidates (${generatedList.length})` : 'All Batches',
        courseName: examDetails.examType
      });
    } catch (err) {
      console.error('Error generating hall tickets:', err);
      setErrorMsg(err.parsedMessage || err.message || 'Failed to generate hall tickets.');
    } finally {
      setGenerating(false);
    }
  }  // Generate HTML for Print preview & window matching official SEMI PDF format exactly
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

            /* Section I Candidate Table */
            .candidate-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 15px; }
            .candidate-table td { border: 1px solid #000; padding: 8px 12px; font-size: 13px; vertical-align: middle; }
            .candidate-table .label-col { width: 30%; font-weight: normal; }
            .candidate-table .val-col { font-weight: bold; font-size: 14px; }
            .signature-hint { color: #cbd5e1; font-weight: normal; font-size: 13px; float: right; font-style: normal; }

            /* Section II & III Exam Tables */
            .exam-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 15px; }
            .exam-table th, .exam-table td { border: 1px solid #000; padding: 8px 12px; font-size: 13px; text-align: left; vertical-align: middle; }
            .exam-table th { font-weight: normal; }
            .yellow-highlight { background-color: #ffff00; font-weight: bold; }

            /* Section IV Instructions */
            .instructions-list { margin: 6px 0 25px 0; padding-left: 20px; font-size: 13px; }
            .instructions-list li { margin-bottom: 4px; }

            /* Signatory Block */
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
      html += `
        <div class="page-container">
          <!-- Logo & Header Title -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                <div style="text-align: center; width: 80%;">
                  <!-- SEMI Logo Graphic -->
                  <img src="${semiLogo}" alt="SEMI Logo" style="height: 60px; width: auto; margin: 0 auto 6px auto; display: block;" />
                  <h3 class="header-title">${examDetails.headerTitle}</h3>
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
                ${ticket.studentName.toUpperCase()}
                <span class="signature-hint">Candidate's Signature</span>
              </td>
            </tr>
            <tr>
              <td class="label-col">Hall ticket Number</td>
              <td class="val-col">${ticket.enrollmentId}</td>
            </tr>
            <tr>
              <td class="label-col">Name of the Enrolled<br/>Institute for CCT-EM</td>
              <td class="val-col">${ticket.instituteName.toUpperCase()}</td>
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
            Section II. ${examDetails.showPracticalSection ? 'Theory Examinations:' : 'Examination Details:'}
            <span class="time-span">Time:${examDetails.theoryTime}</span>
          </div>
          <div style="font-size: 13.5px; font-weight: bold; margin-bottom: 6px;">
            ${examDetails.showPracticalSection ? 'Theory Centre' : 'Exam Centre'} - <span class="yellow-highlight">${(examDetails.theoryCentre || 'DR. MEHTA HOSPITAL, GLOBAL CAMPUS, CHENNAI').toUpperCase()}</span>
          </div>

          <table class="exam-table">
            <thead>
              <tr>
                <th style="width: 25%;">Date</th>
                <th style="width: 35%;">Subject</th>
                ${examDetails.showPracticalSection ? '<th>Appearing</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${(examDetails.subjects || []).map(s => `
                <tr>
                  <td>${s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '30th July 2026'}</td>
                  <td>
                    <strong>Paper ${s.paperNumber}</strong><br/>
                    ${s.paperName}
                  </td>
                  ${examDetails.showPracticalSection ? `
                    <td>
                      Yes
                      <span class="signature-hint">Invigilator's Signature</span>
                    </td>
                  ` : `
                    <td style="width: 40%;">
                      <span class="signature-hint" style="float: right;">Invigilator's Signature</span>
                    </td>
                  `}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Section III. Practical Examination (Optional) -->
          ${examDetails.showPracticalSection ? `
            <div class="section-header">
              Section III. Practical Examination:
              <span class="time-span">Time: ${examDetails.practicalTime}</span>
            </div>
            <table class="exam-table">
              <tr>
                <td style="width: 25%;">Date</td>
                <td style="width: 75%;">${examDetails.practicalDate ? new Date(examDetails.practicalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '3rd August 2026'}</td>
              </tr>
              <tr>
                <td>Appearing</td>
                <td>
                  Yes
                  <span class="signature-hint">Centre Coordinator's Signature</span>
                </td>
              </tr>
              <tr>
                <td>Practical Centre</td>
                <td><span class="yellow-highlight">${(examDetails.practicalCentre || 'KAUVERY HOSPITAL, VADAPALANI, CHENNAI').toUpperCase()}</span></td>
              </tr>
            </table>
          ` : ''}

          <!-- Section ${examDetails.showPracticalSection ? 'IV' : 'III'}. Instructions -->
          <div class="section-header">Section ${examDetails.showPracticalSection ? 'IV' : 'III'}. Instructions:</div>
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
            <div class="sig-name">${examDetails.controllerName}</div>
            <div class="sig-title">${examDetails.controllerTitle}</div>
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

  // Print Window trigger
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
            Configure examination schedules, auto-fetch semester subjects, select accredited candidates, and generate official hall tickets with seal validation & custom controller signatures.
          </p>
        </div>

        {/* Header Summary KPI Quick Pills */}
        <div className="relative z-10 grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
            <div className="text-xl font-black text-white">{students.length}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Total Fellows</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
            <div className="text-xl font-black text-blue-400">{courses.length}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Courses</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
            <div className="text-xl font-black text-emerald-400">{batches.length}</div>
            <div className="text-[9px] uppercase font-bold text-slate-400">Batches</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
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

      {/* ── Workflow Stepper Navigation Header ────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex items-center justify-around gap-2 text-xs font-bold">
        <div className="flex items-center gap-2.5 text-blue-600 font-extrabold px-4 py-2 bg-blue-50/80 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">1</div>
          <span>1. Select Candidates ({selectedStudents.length})</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center gap-2.5 text-indigo-600 font-extrabold px-4 py-2 bg-indigo-50/80 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">2</div>
          <span>2. Schedule & Subjects ({examDetails.subjects.length} Papers)</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center gap-2.5 text-emerald-600 font-extrabold px-4 py-2 bg-emerald-50/80 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">3</div>
          <span>3. Preview & Issue Tickets</span>
        </div>
      </div>

      {/* Main Layout: Balanced 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Candidate Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Candidate Fellows
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">Choose students to issue hall tickets</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg text-[10px] uppercase tracking-wider transition-all"
              >
                {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect' : 'Select All'}
              </button>
            </div>

              {/* Filter inputs bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                  />
                </div>

                <div>
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
                </div>

                <div>
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

                <div>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full px-2.5 py-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs font-black text-indigo-700 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="All Semesters">All Semesters</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                  </select>
                </div>
              </div>

              {/* Student Cards List */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const studentId = student._id || student.id;
                    const isSelected = selectedStudents.includes(studentId);
                    const name = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Dr. Fellow Candidate';
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
                    <p className="text-xs font-bold text-slate-500">No matching fellow candidates found</p>
                    <p className="text-[10px] text-slate-400">Try adjusting your search filters or course choices</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Examination Config & Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Examination Details
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Configure theory & practical venue schedules</p>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Exam Category / Semester Select */}
                <div className="grid grid-cols-2 gap-2.5 pb-2">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Exam Type</label>
                    <select
                      value={examDetails.examType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExamDetails(prev => ({
                          ...prev,
                          examType: val,
                          headerTitle: val === 'Semester Exam' 
                            ? `${selectedSemester} CCT-EM Examinations Hall ticket - July’26`
                            : val === 'Basic Sciences' 
                              ? "Basic Sciences CCT-EM Exam Hall ticket - July’26"
                              : "Final Year CCT-EM Examinations Hall ticket - July’26"
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Semester Exam">Semester Examination</option>
                      <option value="Final Year">Final Exit Clinical</option>
                      <option value="Basic Sciences">Basic Sciences</option>
                      <option value="Custom">Custom Assessment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Active Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="All Semesters">All Semesters</option>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                    </select>
                  </div>
                </div>

                {/* Document Header Text Customization */}
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Header Title Text</label>
                  <input
                    type="text"
                    value={examDetails.headerTitle}
                    onChange={(e) => setExamDetails({ ...examDetails, headerTitle: e.target.value })}
                    placeholder="Final Year CCT-EM Examinations Hall ticket - July’26"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Organization Subtitle</label>
                  <input
                    type="text"
                    value={examDetails.organizationTitle}
                    onChange={(e) => setExamDetails({ ...examDetails, organizationTitle: e.target.value })}
                    placeholder="Society for Emergency Medicine India (SEMI)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Section II Theory Centre & Time */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">Theory Exam Venue & Timing</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Theory Centre Name</label>
                      <input
                        type="text"
                        value={examDetails.theoryCentre}
                        onChange={(e) => setExamDetails({ ...examDetails, theoryCentre: e.target.value })}
                        placeholder="DR. MEHTA HOSPITAL, GLOBAL CAMPUS, CHENNAI"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Time Slot</label>
                      <input
                        type="text"
                        value={examDetails.theoryTime}
                        onChange={(e) => setExamDetails({ ...examDetails, theoryTime: e.target.value })}
                        placeholder="10am to 1pm"
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Theory Papers Timetable */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Theory Papers & Dates</label>
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Paper
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {examDetails.subjects.map((sub, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase text-blue-600">Paper {sub.paperNumber}</span>
                          {examDetails.subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(idx)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Subject Title"
                            value={sub.paperName}
                            onChange={(e) => handleSubjectChange(idx, 'paperName', e.target.value)}
                            className="col-span-2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                          <input
                            type="date"
                            value={sub.date}
                            onChange={(e) => handleSubjectChange(idx, 'date', e.target.value)}
                            className="px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section III Practical Section Options */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Practical Exam Section</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={examDetails.showPracticalSection}
                        onChange={(e) => setExamDetails({ ...examDetails, showPracticalSection: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span className="text-[10px] font-bold text-slate-600">Include Section III</span>
                    </label>
                  </div>

                  {examDetails.showPracticalSection && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Centre Name</label>
                        <input
                          type="text"
                          value={examDetails.practicalCentre}
                          onChange={(e) => setExamDetails({ ...examDetails, practicalCentre: e.target.value })}
                          placeholder="KAUVERY HOSPITAL, VADAPALANI, CHENNAI"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Practical Date</label>
                          <input
                            type="date"
                            value={examDetails.practicalDate}
                            onChange={(e) => setExamDetails({ ...examDetails, practicalDate: e.target.value })}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Time Slot</label>
                          <input
                            type="text"
                            value={examDetails.practicalTime}
                            onChange={(e) => setExamDetails({ ...examDetails, practicalTime: e.target.value })}
                            placeholder="8am to 5pm"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section IV Custom Instructions & Signatory */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <span className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider">Controller Signatory & Signature Upload</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Controller Name</label>
                      <input
                        type="text"
                        value={examDetails.controllerName}
                        onChange={(e) => setExamDetails({ ...examDetails, controllerName: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Controller Title</label>
                      <input
                        type="text"
                        value={examDetails.controllerTitle}
                        onChange={(e) => setExamDetails({ ...examDetails, controllerTitle: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>

                  {/* Signature Image File Upload */}
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Upload Signature Image (PNG/JPG)</label>
                    {examDetails.controllerSignatureUrl ? (
                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <img 
                            src={examDetails.controllerSignatureUrl} 
                            alt="Signature Preview" 
                            className="h-8 max-w-[120px] object-contain border border-slate-300 rounded p-0.5 bg-white" 
                          />
                          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Custom Signature Active
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove custom signature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl bg-slate-50/50 hover:bg-blue-50/30 transition-all cursor-pointer text-slate-600 font-bold text-xs">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Choose Signature File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Action Submit Button */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleGenerateHallTickets}
                    disabled={generating || selectedStudents.length === 0}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Admit Cards...</>
                    ) : (
                      <><Ticket className="w-4 h-4" /> Issue {selectedStudents.length} Hall Ticket(s)</>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>

      {/* ── PRINT & ADMIT TICKET PREVIEW MODAL ───────────────────────────── */}
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
                  Print Hall Tickets
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

            {/* Modal Body Container with exact document layout */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-slate-100 text-black">
              {viewingTickets.map((ticket, idx) => (
                <div key={idx} className="bg-white border border-slate-300 p-8 shadow-md max-w-3xl mx-auto text-left font-serif space-y-4">
                  
                  {/* Top Header Block with Logo & Title */}
                  <div className="flex justify-between items-start gap-4 pb-2 border-b-0">
                    <div className="flex-1 text-center pr-4">
                      {/* Logo Graphic */}
                      <img src={semiLogo} alt="SEMI Logo" className="h-16 w-auto mx-auto mb-2 object-contain" />
                      <h2 className="text-lg font-bold underline leading-snug">
                        {examDetails.headerTitle}
                      </h2>
                      <h3 className="text-base font-bold underline mt-1">{examDetails.organizationTitle}</h3>
                    </div>

                    {/* Photo Box */}
                    <div className="w-32 h-40 border border-black bg-blue-100 flex flex-col items-center justify-center flex-shrink-0 text-slate-500 font-sans text-xs font-normal">
                      {ticket.photoUrl ? (
                        <img src={getUploadUrl(ticket.photoUrl)} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <span>PHOTO</span>
                      )}
                    </div>
                  </div>

                  {/* Section I Candidate Details */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold italic underline font-sans">Section I. Candidate Details:</h4>
                    <table className="w-full border border-black text-xs font-sans border-collapse">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black w-1/3 font-normal">Name of the Candidate</td>
                          <td className="p-2 font-bold uppercase flex justify-between items-center">
                            <span>{ticket.studentName}</span>
                            <span className="text-slate-300 font-normal italic text-[11px]">Candidate's Signature</span>
                          </td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black font-normal">Hall ticket Number</td>
                          <td className="p-2 font-bold font-mono text-sm">{ticket.enrollmentId}</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-2 border-r border-black font-normal">Name of the Enrolled<br/>Institute for CCT-EM</td>
                          <td className="p-2 font-bold uppercase">{ticket.instituteName}</td>
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

                  {/* Section II Theory Examinations */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-sm font-bold font-sans">
                      <span className="italic underline">Section II. {examDetails.showPracticalSection ? 'Theory Examinations:' : 'Examination Details:'}</span>
                      <span>Time: {examDetails.theoryTime}</span>
                    </div>
                    <div className="text-xs font-bold font-sans">
                      {examDetails.showPracticalSection ? 'Theory Centre' : 'Exam Centre'} - <span className="bg-yellow-300 px-1 py-0.5">{examDetails.theoryCentre.toUpperCase()}</span>
                    </div>

                    <table className="w-full border border-black text-xs font-sans border-collapse mt-2">
                      <thead>
                        <tr className="border-b border-black text-left font-normal">
                          <th className="p-2 border-r border-black w-1/4 font-normal">Date</th>
                          <th className="p-2 border-r border-black w-2/5 font-normal">Subject</th>
                          {examDetails.showPracticalSection && <th className="p-2 font-normal">Appearing</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {(examDetails.subjects || []).map((sub, i) => (
                          <tr key={i} className="border-b border-black last:border-b-0">
                            <td className="p-2 border-r border-black font-medium">{sub.date ? new Date(sub.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '30th July 2026'}</td>
                            <td className="p-2 border-r border-black">
                              <strong>Paper {sub.paperNumber}</strong><br/>
                              {sub.paperName}
                            </td>
                            {examDetails.showPracticalSection ? (
                              <td className="p-2 flex justify-between items-center">
                                <span>Yes</span>
                                <span className="text-slate-300 font-normal italic text-[11px]">Invigilator's Signature</span>
                              </td>
                            ) : (
                              <td className="p-2 text-right">
                                <span className="text-slate-300 font-normal italic text-[11px]">Invigilator's Signature</span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Section III Practical Examination */}
                  {examDetails.showPracticalSection && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-sm font-bold font-sans">
                        <span className="italic underline">Section III. Practical Examination:</span>
                        <span>Time: {examDetails.practicalTime}</span>
                      </div>
                      <table className="w-full border border-black text-xs font-sans border-collapse">
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black w-1/4">Date</td>
                            <td className="p-2">{examDetails.practicalDate ? new Date(examDetails.practicalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '3rd August 2026'}</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-2 border-r border-black">Appearing</td>
                            <td className="p-2 flex justify-between items-center">
                              <span>Yes</span>
                              <span className="text-slate-300 font-normal italic text-[11px]">Centre Coordinator's Signature</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-black">Practical Centre</td>
                            <td className="p-2">
                              <span className="bg-yellow-300 px-1 py-0.5 font-bold">{examDetails.practicalCentre.toUpperCase()}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Section IV Instructions */}
                  <div className="space-y-1 pt-1 font-sans text-xs">
                    <h4 className="text-sm font-bold italic underline">Section {examDetails.showPracticalSection ? 'IV' : 'III'}. Instructions:</h4>
                    <ol className="list-decimal pl-5 space-y-1 font-normal text-slate-800">
                      {(examDetails.instructions || []).map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Controller Signature */}
                  <div className="pt-4 font-sans text-xs">
                    {examDetails.controllerSignatureUrl ? (
                      <img 
                        src={examDetails.controllerSignatureUrl} 
                        alt="Controller Signature" 
                        className="h-10 max-w-[160px] object-contain mb-1" 
                      />
                    ) : (
                      <svg className="h-10 w-36 mb-1" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 40 C30 10, 50 50, 70 20 C90 10, 110 45, 140 25 C160 15, 180 35, 195 20" stroke="#000" strokeWidth="2.5" fill="none"/>
                        <circle cx="145" cy="45" r="2" fill="#000"/>
                        <circle cx="155" cy="45" r="2" fill="#000"/>
                      </svg>
                    )}
                    <div className="font-bold text-sm">{examDetails.controllerName}</div>
                    <div className="font-bold text-xs">{examDetails.controllerTitle}</div>
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