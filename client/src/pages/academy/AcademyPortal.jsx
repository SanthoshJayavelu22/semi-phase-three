import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstitutionalLayout from '../institute/InstitutionalLayout';

import authService from '../../api/auth';
import instituteService from '../../api/institutes';
import academicService from '../../api/academic';
import Toast from '../../Components/Toast';
import ConfirmModal from '../../Components/ConfirmModal';

// Sub-components modular split
import AcademyLogin from './components/AcademyLogin';
import AcademySidebar from './components/AcademySidebar';
import AcademyHeader from './components/AcademyHeader';
import AcademyDashboard from './components/AcademyDashboard';
import AcademyApplications from './components/AcademyApplications';
import AcademyStudents from './components/AcademyStudents';
import AcademyInspectorModal from './components/AcademyInspectorModal';
import AcademyRejectionModal from './components/AcademyRejectionModal';
import AcademyEligibility from './components/AcademyEligibility';
import AcademyVerification from './components/AcademyVerification';
import AcademyStudentModal from './components/AcademyStudentModal';

const STEP_ROUTES = {
  login: '/academy/login',
  dashboard: '/academy/dashboard'
};

// All paths that belong to the authenticated dashboard shell
const DASHBOARD_PATHS = [
  '/academy/dashboard',
  '/academy/applications',
  '/academy/students',
  '/academy/eligibility',
  '/academy/verification'
];

// Derive which tab to show from the current path
const getTabFromPath = (pathname) => {
  if (pathname === '/academy/applications') return 'applications';
  if (pathname === '/academy/students') return 'students';
  if (pathname === '/academy/eligibility') return 'eligibility';
  if (pathname === '/academy/verification') return 'verification';
  return 'dashboard';
};

// Helper to safely extract data from API responses
const extractData = (response) => {
  if (!response) return null;
  const data = response.data || response;
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

const AcademyPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPath = location.pathname === '/academy' || location.pathname === '/academy/' || location.pathname === '/academy/login';
  const isDashboardPath = DASHBOARD_PATHS.includes(location.pathname);

  const [currentStep, setCurrentStepState] = useState(() => {
    const path = window.location.pathname;
    if (path === '/academy' || path === '/academy/' || path === '/academy/login') return 'login';
    if (DASHBOARD_PATHS.includes(path)) return 'dashboard';
    return 'login';
  });

  const setCurrentStep = useCallback((step) => {
    const route = STEP_ROUTES[step] || '/academy/login';
    navigate(route);
  }, [navigate]);

  const [boardUser, setBoardUser] = useState(null);

  const activeTab = getTabFromPath(location.pathname);
  const setActiveTab = useCallback((tab) => {
    const tabRoutes = {
      dashboard: '/academy/dashboard',
      applications: '/academy/applications',
      students: '/academy/students',
      eligibility: '/academy/eligibility',
      verification: '/academy/verification'
    };
    navigate(tabRoutes[tab] || '/academy/dashboard');
  }, [navigate]);
  
  const [students, setStudents] = useState([]);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [apiApplications, setApiApplications] = useState([]);

  const fetchBoardData = useCallback(async () => {
    try {
      const appsRes = await instituteService.listApplications();
      const appsData = extractData(appsRes) || [];
      if (Array.isArray(appsData)) {
        const formatted = appsData.map(app => {
          const statusMapped = app.status ? app.status.toLowerCase().replace(' ', '_') : 'pending_review';
          return {
            id: app._id,
            _id: app._id,
            orgName: app.orgName,
            email: app.emailAddress || (app.user?.email || 'admin@saraswathi.edu.in'),
            submittedAt: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A',
            status: statusMapped,
            bedCount: app.bedCount,
            experience: app.physicianExperience,
            emFacultyCount: app.emFacultyCount,
            teachingSpace: app.teachingSpace,
            paymentComplete: app.paymentStatus === 'Completed',
            paymentDetails: app.paymentStatus === 'Completed' ? { transactionId: app.razorpayPaymentId || app.paymentTxnNo } : null,
            form: app,
            uploadedDocs: {
              equipmentList: app.documents?.equipmentListUrl ? { name: 'equipmentList.pdf', url: app.documents.equipmentListUrl } : null,
              facultyList: app.documents?.facultyListUrl ? { name: 'facultyList.pdf', url: app.documents.facultyListUrl } : null,
              opdStats: app.documents?.emergencyOPDStatisticsUrl ? { name: 'opdStats.pdf', url: app.documents.emergencyOPDStatisticsUrl } : null,
              libraryList: app.documents?.libraryBookListUrl ? { name: 'libraryList.pdf', url: app.documents.libraryBookListUrl } : null,
              mannequinList: app.documents?.trainingMannequinListUrl ? { name: 'mannequinList.pdf', url: app.documents.trainingMannequinListUrl } : null,
              diagnosticList: app.documents?.diagnosticEquipmentListUrl ? { name: 'diagnosticList.pdf', url: app.documents.diagnosticEquipmentListUrl } : null,
              declarationLetter: app.documents?.declarationLetterUrl ? { name: 'declarationLetter.pdf', url: app.documents.declarationLetterUrl } : null,
              paymentReceiptDoc: (app.documents?.inspectionPaymentReceiptUrl || app.inspectionPaymentReceiptUrl) ? { name: 'paymentReceipt.pdf', url: app.documents?.inspectionPaymentReceiptUrl || app.inspectionPaymentReceiptUrl } : null,
              signatureDoc: (app.documents?.facultyCommitmentLetterUrl || app.facultyCommitmentLetterUrl) ? { name: 'signatureDoc.pdf', url: app.documents?.facultyCommitmentLetterUrl || app.facultyCommitmentLetterUrl } : null,
            }
          };
        });
        setApiApplications(prev => JSON.stringify(prev) === JSON.stringify(formatted) ? prev : formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch board applications from API:', err);
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
          eligibilityStatus: s.remittedToAcademy && s.attendancePercentage >= 75 && s.thesisApproved ? 'Approved' : (s.remittedToAcademy ? 'Pending' : 'Rejected'),
          rejectionReason: !s.remittedToAcademy ? 'Academy fee remittance is pending.' : (s.attendancePercentage < 75 ? 'Attendance is below 75% threshold.' : 'Thesis approval is pending.'),
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
          semesters: s.semesters || []
        }));
        setStudents(prev => JSON.stringify(prev) === JSON.stringify(formatted) ? prev : formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch board students from API:', err);
    }
  }, []);

  useEffect(() => {
    const storedBoardUser = localStorage.getItem('semi_board_user');
    if (storedBoardUser) {
      setBoardUser(JSON.parse(storedBoardUser));
      fetchBoardData();
    }
  }, [fetchBoardData]);

  // Background Auto-Polling every 5 seconds
  useEffect(() => {
    let intervalId;
    if (boardUser && currentStep === 'dashboard') {
      intervalId = setInterval(() => {
        fetchBoardData();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [boardUser, currentStep, fetchBoardData]);

  // URL and Auth Guard Synchronizer
  useEffect(() => {
    const currentPath = location.pathname;
    const storedBoardUser = localStorage.getItem('semi_board_user');
    const activeBoardUser = boardUser || (storedBoardUser ? JSON.parse(storedBoardUser) : null);

    const isLogin = currentPath === '/academy' || currentPath === '/academy/' || currentPath === '/academy/login';
    const isDashboard = DASHBOARD_PATHS.includes(currentPath);

    if (isDashboard && !activeBoardUser) {
      navigate('/academy/login', { replace: true });
      return;
    }

    if (isLogin && activeBoardUser) {
      navigate('/academy/dashboard', { replace: true });
      return;
    }

    if (isLogin) setCurrentStepState('login');
    else if (isDashboard) setCurrentStepState('dashboard');
    else setCurrentStepState('login');
  }, [location.pathname, boardUser, navigate]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginForm.email || !loginForm.password) {
      setErrorMsg('Please enter credentials.');
      return;
    }

    try {
      const response = await authService.login({
        email: loginForm.email,
        password: loginForm.password
      });

      const data = response.data || response;
      const userToken = data.accessToken || data.token || data.data?.accessToken;
      const userRefreshToken = data.refreshToken || data.data?.refreshToken;
      
      const userSession = {
        email: data.user?.email || loginForm.email,
        role: data.user?.role || 'Academic Board Member',
        ...data.user
      };

      if (userToken) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('semi_token', userToken);
      }
      if (userRefreshToken) {
        localStorage.setItem('refreshToken', userRefreshToken);
        localStorage.setItem('semi_refreshToken', userRefreshToken);
      }

      setBoardUser(userSession);
      localStorage.setItem('semi_board_user', JSON.stringify(userSession));
      setCurrentStep('dashboard');
      fetchBoardData();
    } catch (err) {
      console.warn('Board login API failed:', err);
      setErrorMsg('Invalid credentials. Email or password is not match.');
    }
  }, [loginForm.email, loginForm.password, setCurrentStep, fetchBoardData]);

  const allApplications = apiApplications;

  const dynamicMetrics = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0;
    allApplications.forEach(app => {
      const status = app.status;
      if (status === 'pending_review' || status === 'pending_evaluation' || status === 'submitted') pending++;
      else if (status === 'approved' || status === 'active_erp') approved++;
      else if (status === 'rejected') rejected++;
    });
    return { pending, approved, rejected, total: pending + approved + rejected };
  }, [allApplications]);

  const filteredApplications = useMemo(() => {
    return allApplications.filter(app => {
      const matchSearch = (app.orgName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (app.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (app.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = statusFilter === 'All' || app.status === statusFilter;
      return matchSearch && matchFilter;
    });
  }, [allApplications, searchQuery, statusFilter]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      return s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
             s.enrollmentNo.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
             (s.institute && s.institute.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
             (s.batch && s.batch.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
             (s.course && s.course.toLowerCase().includes(studentSearchQuery.toLowerCase())) ||
             (s.email && s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()));
    });
  }, [students, studentSearchQuery]);

  const handleViewStudent = useCallback((student) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  }, []);

  const handleVerifyStudentEligibility = useCallback(async (enrollmentNo, semesterNumber, eligibilityStatus, reason = '') => {
    try {
      const student = students.find(s => s.enrollmentNo === enrollmentNo);
      if (student && (student._id || student.id)) {
        const targetId = student._id || student.id;
        
        await academicService.updateAcademicMetrics(targetId, {
          semesterNumber: semesterNumber,
          eligibilityStatus: eligibilityStatus
        });
        await fetchBoardData();
        setSuccessMsg(`Eligibility status for student ${enrollmentNo} (Sem ${semesterNumber}) updated successfully.`);
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
      setSelectedApp(prev => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, status: newStatus, rejectionReason: reason };
      });
    } catch (err) {
      console.error('Backend application review failed:', err);
      setErrorMsg(err.parsedMessage || err.message || 'Failed to submit application review.');
      throw err;
    }
  }, [fetchBoardData]);

  const handleApprove = useCallback(() => {
    if (!selectedApp) return;
    setConfirmConfig({
      title: 'Approve Application',
      message: `Are you sure you want to APPROVE ${selectedApp.orgName}?`,
      type: 'success',
      confirmText: 'Yes, Approve',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await handleReviewApplication(selectedApp.id, 'approved');
          setSuccessMsg(`🎉 Application Approved! ${selectedApp.orgName} has been activated.`);
        } catch (err) {}
      }
    });
  }, [selectedApp, handleReviewApplication]);

  const handleRejectSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMsg('Please enter a rejection reason.');
      return;
    }
    try {
      await handleReviewApplication(selectedApp.id, 'rejected', rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSuccessMsg(`❌ Application Rejected. Reason logged: "${rejectionReason}"`);
    } catch (err) {}
  }, [rejectionReason, selectedApp, handleReviewApplication]);

  const handleTriggerInspection = useCallback(async () => {
    if (!selectedApp) return;
    try {
      const currentInspectionStatus = selectedApp.form?.inspectionTriggered || false;
      const targetStatus = !currentInspectionStatus;
      await instituteService.toggleInspection(selectedApp.id, targetStatus);
      await fetchBoardData();
      setSelectedApp(prev => {
        if (!prev || prev.id !== selectedApp.id) return prev;
        return {
          ...prev,
          form: prev.form ? { ...prev.form, inspectionTriggered: targetStatus } : { inspectionTriggered: targetStatus }
        };
      });
      setSuccessMsg(targetStatus 
        ? `📅 Site Inspection Triggered! A field inspector has been assigned.`
        : `📅 Site Inspection Cancelled.`
      );
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to update inspection status.');
    }
  }, [selectedApp, fetchBoardData]);

  const handleLogout = useCallback(() => {
    setBoardUser(null);
    localStorage.clear();
    setCurrentStep('login');
  }, []);

  const auditDocs = useMemo(() => {
    if (!selectedApp) return [];
    if (selectedApp.uploadedDocs) {
      return Object.keys(selectedApp.uploadedDocs).filter(k => k !== 'inspectionPaymentReceipt');
    }
    return ['equipmentList', 'facultyList', 'emergencyOPDStatistics', 'libraryBookList', 'trainingMannequinList', 'diagnosticEquipmentList', 'declarationLetter', 'inspectionPaymentReceipt', 'facultyCommitmentLetter'];
  }, [selectedApp]);

  const renderDocPreviewContent = (docKey) => {
    const docTitles = {
      equipmentList: 'Emergency Department Equipment List',
      facultyList: 'Emergency Department Faculty List',
      opdStats: 'OPD/Emergency Admissions Statistics',
      libraryList: 'Library Book List (EM Subscriptions)',
      mannequinList: 'Emergency Skill Mannequin Catalog',
      diagnosticList: 'Emergency Diagnostic Specs & Imaging Audits',
      declarationLetter: 'Declaration Statement & Representative Digital Card'
    };

    const title = docTitles[docKey] || 'Document Review';

    return (
      <div className="space-y-5">
        <div className="border-b border-gray-150 pb-3 flex justify-between items-center">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">{title}</h4>
          <button
            onClick={() => setPreviewDoc(null)}
            className="text-gray-400 hover:text-slate-900 transition-colors font-extrabold text-xs uppercase"
          >
            ✕
          </button>
        </div>

        <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 text-center select-none space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <span className="text-2xl">📄</span>
          </div>
          <div className="text-xs font-bold text-gray-800 space-y-2">
            <p className="font-extrabold text-sm text-slate-800">Mock File Preview for Digital Audit Inspection</p>
            <p className="text-[10px] text-gray-400 font-mono tracking-tight break-all">SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setPreviewDoc(null)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-sm"
          >
            Dismiss Review
          </button>
        </div>
      </div>
    );
  };

  return (
    <InstitutionalLayout portalType="academy" hideHeaderFooter={currentStep === 'dashboard'}>
      <div className={currentStep === 'dashboard' ? "w-full min-h-screen flex flex-col bg-[#f8fafc]" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow flex flex-col justify-center w-full"}>
        
        {currentStep === 'login' && (
          <AcademyLogin 
            loginForm={loginForm} 
            setLoginForm={setLoginForm} 
            errorMsg={errorMsg} 
            handleLogin={handleLogin} 
          />
        )}

        {currentStep === 'dashboard' && (
          <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-gray-800 font-sans">
            <AcademySidebar boardUser={boardUser} handleLogout={handleLogout} />

            <main className="flex-1 flex flex-col overflow-hidden">
              <AcademyHeader />
              <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
                
                {activeTab === 'dashboard' && (
                  <AcademyDashboard dynamicMetrics={dynamicMetrics} setActiveTab={setActiveTab} allApplications={allApplications} />
                )}

                {activeTab === 'applications' && (
                  <AcademyApplications 
                    filteredApplications={filteredApplications} 
                    allApplications={allApplications} 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    statusFilter={statusFilter} 
                    setStatusFilter={setStatusFilter} 
                    fetchBoardData={fetchBoardData} 
                    setSelectedApp={setSelectedApp} 
                  />
                )}

                {activeTab === 'students' && (
                  <AcademyStudents 
                    filteredStudents={filteredStudents} 
                    studentSearchQuery={studentSearchQuery} 
                    setStudentSearchQuery={setStudentSearchQuery} 
                    handleView={handleViewStudent}
                  />
                )}

                {activeTab === 'eligibility' && (
                  <AcademyEligibility 
                    students={students}
                    onInspectEligibility={(student) => {
                      setSelectedStudentId(student.enrollmentNo);
                      navigate('/academy/verification');
                    }}
                  />
                )}

                {activeTab === 'verification' && (
                  <AcademyVerification 
                    students={students}
                    selectedStudentId={selectedStudentId}
                    setSelectedStudentId={setSelectedStudentId}
                    onVerifyStudent={handleVerifyStudentEligibility}
                    fetchBoardData={fetchBoardData}
                  />
                )}

              </div>
            </main>
          </div>
        )}
      </div>

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

      {previewDoc && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-left">
            {renderDocPreviewContent(previewDoc)}
          </div>
        </div>
      )}

      {showRejectModal && (
        <AcademyRejectionModal 
          rejectionReason={rejectionReason} 
          setRejectionReason={setRejectionReason} 
          handleRejectSubmit={handleRejectSubmit} 
          setShowRejectModal={setShowRejectModal} 
        />
      )}

      {isStudentModalOpen && selectedStudent && (
        <AcademyStudentModal
          student={selectedStudent}
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
      {errorMsg && (
        <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />
      )}
      {successMsg && (
        <Toast message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />
      )}
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
    </InstitutionalLayout>
  );
};

export default AcademyPortal;