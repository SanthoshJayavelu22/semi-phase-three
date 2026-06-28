import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';

import instituteService from '../../api/institutes';
import academicService from '../../api/academic';
import examService from '../../api/exams';
import Toast from '../../Components/Toast';
import ConfirmModal from '../../Components/ConfirmModal';

import AcademySidebar from './components/AcademySidebar';
import AcademyHeader from './components/AcademyHeader';
import AcademyInspectorModal from './components/AcademyInspectorModal';
import AcademyRejectionModal from './components/AcademyRejectionModal';
import AcademyStudentModal from './components/AcademyStudentModal';

// Helper to safely extract data from API responses
const extractData = (response) => {
  if (!response) return null;
  // Check if response has data property (axios returns data in response.data)
  const data = response.data || response;
  // If data has a data property (our API wrapper), use that
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

/**
 * AcademyLayout
 * ─────────────
 * Auth-guarded shell for all /academy/dashboard* pages.
 * Holds all shared state and exposes it to child pages via <Outlet context>.
 * Renders: Sidebar | Header | <Outlet /> | Modals | Toasts
 */
export default function AcademyLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Auth State ──────────────────────────────────────────────────────────────
  const [boardUser, setBoardUser] = useState(() => {
    const stored = localStorage.getItem('semi_board_user');
    return stored ? JSON.parse(stored) : null;
  });

  // ─── Data State ──────────────────────────────────────────────────────────────
  const [apiApplications, setApiApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [examApplications, setExamApplications] = useState([]);

  // ─── Search / Filter ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // ─── Inspector / Review Modals ────────────────────────────────────────────────
  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  // ─── Student Dossier Modal ────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // ─── Toasts ───────────────────────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // ─── Auth Guard ───────────────────────────────────────────────────────────────
  if (!boardUser) {
    return <Navigate to="/academy/login" replace />;
  }

  // ─── Data Fetching ────────────────────────────────────────────────────────────
  const fetchBoardData = useCallback(async () => {
    try {
      const appsRes = await instituteService.listApplications();
      const appsData = extractData(appsRes) || [];
      
      if (Array.isArray(appsData)) {
        const formatted = appsData.map(app => {
          const statusMapped = app.status
            ? app.status.toLowerCase().replace(' ', '_')
            : 'pending_review';
          return {
            id: app._id,
            _id: app._id,
            orgName: app.orgName,
            email: app.emailAddress || app.user?.email || 'admin@saraswathi.edu.in',
            submittedAt: app.createdAt
              ? new Date(app.createdAt).toLocaleDateString()
              : 'N/A',
            status: statusMapped,
            bedCount: app.bedCount,
            experience: app.physicianExperience,
            emFacultyCount: app.emFacultyCount,
            teachingSpace: app.teachingSpace,
            paymentComplete: app.paymentStatus === 'Completed',
            paymentDetails:
              app.paymentStatus === 'Completed'
                ? { transactionId: app.razorpayPaymentId || app.paymentTxnNo }
                : null,
            form: app,
            uploadedDocs: {
              equipmentList: app.documents?.equipmentListUrl
                ? { name: 'equipmentList.pdf', url: app.documents.equipmentListUrl }
                : null,
              facultyList: app.documents?.facultyListUrl
                ? { name: 'facultyList.pdf', url: app.documents.facultyListUrl }
                : null,
              opdStats: app.documents?.emergencyOPDStatisticsUrl
                ? { name: 'opdStats.pdf', url: app.documents.emergencyOPDStatisticsUrl }
                : null,
              libraryList: app.documents?.libraryBookListUrl
                ? { name: 'libraryList.pdf', url: app.documents.libraryBookListUrl }
                : null,
              mannequinList: app.documents?.trainingMannequinListUrl
                ? { name: 'mannequinList.pdf', url: app.documents.trainingMannequinListUrl }
                : null,
              diagnosticList: app.documents?.diagnosticEquipmentListUrl
                ? { name: 'diagnosticList.pdf', url: app.documents.diagnosticEquipmentListUrl }
                : null,
              declarationLetter: app.documents?.declarationLetterUrl
                ? { name: 'declarationLetter.pdf', url: app.documents.declarationLetterUrl }
                : null,
              signatureDoc: app.facultyCommitmentLetterUrl
                ? { name: 'signatureDoc.pdf', url: app.facultyCommitmentLetterUrl }
                : null,
            },
          };
        });
        setApiApplications(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch board applications from API:', err);
      setErrorMsg(err.parsedMessage || err.message || 'Failed to load applications');
    }

    try {
      const studentsRes = await academicService.listStudents();
      const studentsData = extractData(studentsRes) || [];
      
      if (Array.isArray(studentsData)) {
        const formatted = studentsData.map(s => ({
          id: s._id,
          _id: s._id,
          enrollmentNo: s.enrollmentId,
          fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          email: s.email,
          mobile: s.contactNumber,
          course: s.course?.name || 'General Medicine',
          batch: s.batch?.year ? `Batch ${s.batch.year}` : 'Batch 2026',
          status: s.remittedToAcademy ? 'Completed' : 'Active',
          institute: s.institute?.orgName || 'N/A',
          // Eligibility calculation matching backend logic
          eligibilityStatus: s.remittedToAcademy && s.attendancePercentage >= 75 && s.thesisApproved
            ? 'Approved'
            : s.remittedToAcademy
            ? 'Pending'
            : 'Rejected',
          rejectionReason: !s.remittedToAcademy
            ? 'Academy fee remittance is pending.'
            : s.attendancePercentage < 75
            ? 'Attendance is below 75% threshold.'
            : 'Thesis approval is pending.',
          attendancePercentage: s.attendancePercentage || 0,
          thesisApproved: s.thesisApproved || false,
          remittedToAcademy: s.remittedToAcademy || false,
          documents: s.documents || {},
          qualification: s.qualification,
          mbbsQualification: s.mbbsQualification,
          yearOfPassing: s.yearOfPassing,
          universityName: s.universityName,
          medicalCouncilRegistrationNumber: s.medicalCouncilRegistrationNumber,
          isForeignGraduate: s.isForeignGraduate || false,
          fmgeClearanceStatus: s.fmgeClearanceStatus || 'Not Applicable',
          courseDirector: s.courseDirector,
          utrNumber: s.utrNumber,
          homeAddress: s.homeAddress,
          contactNumber: s.contactNumber,
        }));
        setStudents(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch board students from API:', err);
      setErrorMsg(err.parsedMessage || err.message || 'Failed to load students');
    }

    try {
      const examsRes = await examService.listExamApplications();
      const examsData = extractData(examsRes) || [];
      if (Array.isArray(examsData)) {
        setExamApplications(examsData);
      }
    } catch (err) {
      console.warn('Failed to fetch board exam applications:', err);
    }
  }, []);

  useEffect(() => {
    if (boardUser) {
      fetchBoardData();
    }
  }, [boardUser, fetchBoardData]);

  // ─── Computed / Memoised Values ───────────────────────────────────────────────
  const allApplications = apiApplications;

  const dynamicMetrics = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0;
    allApplications.forEach(app => {
      const s = app.status;
      if (s === 'pending_review' || s === 'pending_evaluation' || s === 'submitted') pending++;
      else if (s === 'approved' || s === 'active_erp') approved++;
      else if (s === 'rejected') rejected++;
    });
    return { pending, approved, rejected, total: pending + approved + rejected };
  }, [allApplications]);

  const filteredApplications = useMemo(() =>
    allApplications.filter(app => {
      const matchSearch =
        app.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = statusFilter === 'All' || app.status === statusFilter;
      return matchSearch && matchFilter;
    }),
    [allApplications, searchQuery, statusFilter]
  );

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      (s.institute && s.institute.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
      (s.batch && s.batch.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
      (s.course && s.course.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()))
    ),
    [students, studentSearchQuery]
  );

  const auditDocs = useMemo(() => {
    if (!selectedApp) return [];
    if (selectedApp.uploadedDocs) {
      return Object.keys(selectedApp.uploadedDocs).filter(k => k !== 'paymentReceiptDoc');
    }
    return ['equipmentList', 'facultyList', 'emergencyOPDStatistics', 'libraryBookList', 'trainingMannequinList', 'diagnosticEquipmentList', 'declarationLetter', 'inspectionPaymentReceipt', 'facultyCommitmentLetter'];
  }, [selectedApp]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────
  const handleViewStudent = useCallback(student => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  }, []);

  const handleVerifyStudentEligibility = useCallback(async (enrollmentNo, eligibilityStatus, reason = '') => {
    try {
      const student = students.find(s => s.enrollmentNo === enrollmentNo);
      if (student && (student._id || student.id)) {
        const targetId = student._id || student.id;

        // Only update thesisApproved - do not override attendance with hardcoded values
        await academicService.updateAcademicMetrics(targetId, {
          thesisApproved: eligibilityStatus === 'Approved'
        });
        await fetchBoardData();
        setSuccessMsg(`Eligibility status for student ${enrollmentNo} updated to ${eligibilityStatus}.`);
      }
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to update student eligibility.');
    }
  }, [students, fetchBoardData]);

  const handleReviewApplication = useCallback(async (id, newStatus, reason = null) => {
    try {
      const backendStatus = newStatus === 'approved' ? 'Approved' : 'Rejected';
      await instituteService.reviewInstitute(id, { status: backendStatus, remarks: reason });
      await fetchBoardData();
      setSelectedApp(prev =>
        prev?.id === id ? { ...prev, status: newStatus, rejectionReason: reason } : prev
      );
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to submit application review.');
      throw err;
    }
  }, [fetchBoardData]);

  const handleApprove = useCallback(() => {
    if (!selectedApp) return;
    setConfirmConfig({
      title: 'Approve Application',
      message: `Approve ${selectedApp.orgName}? This will activate their ERP dashboard.`,
      type: 'success',
      confirmText: 'Yes, Approve',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await handleReviewApplication(selectedApp.id, 'approved');
          setSuccessMsg(`🎉 ${selectedApp.orgName} approved and activated.`);
        } catch (_) {}
      }
    });
  }, [selectedApp, handleReviewApplication]);

  const handleRejectSubmit = useCallback(async e => {
    e.preventDefault();
    if (!rejectionReason.trim()) { 
      setErrorMsg('Please enter a rejection reason.'); 
      return; 
    }
    try {
      await handleReviewApplication(selectedApp.id, 'rejected', rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSuccessMsg(`❌ Application Rejected. Reason: "${rejectionReason}"`);
    } catch (_) {}
  }, [rejectionReason, selectedApp, handleReviewApplication]);

  const handleTriggerInspection = useCallback(async () => {
    if (!selectedApp) return;
    try {
      const targetStatus = !(selectedApp.form?.inspectionTriggered || false);
      await instituteService.toggleInspection(selectedApp.id, targetStatus);
      await fetchBoardData();
      setSelectedApp(prev =>
        prev?.id === selectedApp.id
          ? { ...prev, form: { ...(prev.form || {}), inspectionTriggered: targetStatus } }
          : prev
      );
      setSuccessMsg(
        targetStatus
          ? '📅 Site Inspection Triggered! Inspector assigned and institution notified.'
          : '📅 Site Inspection Cancelled.'
      );
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to update inspection status.');
    }
  }, [selectedApp, fetchBoardData]);

  const handleLogout = useCallback(() => {
    setBoardUser(null);
    localStorage.removeItem('semi_board_user');
    localStorage.removeItem('token');
    localStorage.removeItem('semi_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('semi_refreshToken');
    navigate('/academy/login', { replace: true });
  }, [navigate]);

  // ─── Document preview renderer ─────────────────────────────────────────────
  const renderDocPreviewContent = docKey => {
    const titles = {
      equipmentList: 'Emergency Department Equipment List',
      facultyList: 'Emergency Department Faculty List',
      opdStats: 'OPD/Emergency Admissions Statistics',
      libraryList: 'Library Book List (EM Subscriptions)',
      mannequinList: 'Emergency Skill Mannequin Catalog',
      diagnosticList: 'Emergency Diagnostic Specs & Imaging Audits',
      declarationLetter: 'Declaration Statement & Representative Digital Card',
    };
    return (
      <div className="space-y-5">
        <div className="border-b border-gray-150 pb-3 flex justify-between items-center">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            {titles[docKey] || 'Document Review'}
          </h4>
          <button
            onClick={() => setPreviewDoc(null)}
            className="text-gray-400 hover:text-slate-900 transition-colors font-extrabold text-xs uppercase"
          >✕</button>
        </div>
        <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 text-center select-none space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <span className="text-2xl">📄</span>
          </div>
          <div className="text-xs font-bold text-gray-800 space-y-2">
            <p className="font-extrabold text-sm text-slate-800">Mock File Preview – Digital Audit Inspection</p>
            <p className="text-gray-500 font-medium">This is a live system. In production, the real document will be displayed here.</p>
          </div>
          <button
            onClick={() => setPreviewDoc(null)}
            className="mt-2 text-xs font-black text-blue-700 hover:underline uppercase tracking-widest"
          >Dismiss Review</button>
        </div>
      </div>
    );
  };

  // ─── Outlet Context ────────────────────────────────────────────────────────────
  const outletContext = {
    boardUser,
    students,
    allApplications,
    dynamicMetrics,
    filteredApplications,
    filteredStudents,
    searchQuery, setSearchQuery,
    studentSearchQuery, setStudentSearchQuery,
    statusFilter, setStatusFilter,
    selectedStudentId, setSelectedStudentId,
    selectedApp, setSelectedApp,
    setShowRejectModal,
    fetchBoardData,
    handleViewStudent,
    handleVerifyStudentEligibility,
    handleApprove,
    handleTriggerInspection,
    setErrorMsg,
    setSuccessMsg,
    examApplications,
    setExamApplications,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-gray-800 font-sans">
      {/* ── Left Sidebar ── */}
      <AcademySidebar boardUser={boardUser} handleLogout={handleLogout} />

      {/* ── Right Main Panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AcademyHeader boardUser={boardUser} handleLogout={handleLogout} />
        <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <Outlet context={outletContext} />
        </div>
      </main>

      {/* ── Inspector Modal ── */}
      {selectedApp && (
        <AcademyInspectorModal
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          auditDocs={auditDocs}
          setPreviewDoc={setPreviewDoc}
          setShowRejectModal={setShowRejectModal}
          handleApprove={handleApprove}
          handleTriggerInspection={handleTriggerInspection}
        />
      )}

      {/* ── Document Preview Modal ── */}
      {previewDoc && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-left">
            {renderDocPreviewContent(previewDoc)}
          </div>
        </div>
      )}

      {/* ── Rejection Modal ── */}
      {showRejectModal && (
        <AcademyRejectionModal
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          handleRejectSubmit={handleRejectSubmit}
          setShowRejectModal={setShowRejectModal}
        />
      )}

      {/* ── Student Dossier Modal ── */}
      {isStudentModalOpen && selectedStudent && (
        <AcademyStudentModal
          student={selectedStudent}
          isOpen={isStudentModalOpen}
          onClose={() => { setIsStudentModalOpen(false); setSelectedStudent(null); }}
        />
      )}

      {/* ── Toasts ── */}
      {errorMsg && <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />}
      {successMsg && <Toast message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />}
      {confirmConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}