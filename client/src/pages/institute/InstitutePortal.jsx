import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InstitutionalLayout from './InstitutionalLayout';
import { 
  Building2, Mail, Lock, CheckCircle2, XCircle, Check, ShieldCheck, X
} from 'lucide-react';

import authService from '../../api/auth';
import instituteService from '../../api/institutes';
import academicService from '../../api/academic';
import examService from '../../api/exams';

import WelcomeLanding from './components/WelcomeLanding';
import InstituteLogin from './components/InstituteLogin';
import InstituteSignup from './components/InstituteSignup';
import EmailVerificationSimulator from './components/EmailVerificationSimulator';
import ApplicationStatusPending from './components/ApplicationStatusPending';
import OnboardingWizard from './components/OnboardingWizard';
import InstituteERPSidebar from './components/InstituteERPSidebar';
import InstituteERPHeader from './components/InstituteERPHeader';
import InstituteERPDashboard from './components/InstituteERPDashboard';
import InstituteERPCourses from './components/InstituteERPCourses';
import InstituteERPBatches from './components/InstituteERPBatches';
import InstituteERPEnrollment from './components/InstituteERPEnrollment';
import InstituteERPStudents from './components/InstituteERPStudents';
import InstituteERPFees from './components/InstituteERPFees';
import InstituteERPExams from './components/InstituteERPExams';
import InstituteERPHallTicket from './components/InstituteERPHallTicket';
import InstituteERPStudentDetails from './components/InstituteERPStudentDetails';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Toast from '../../Components/Toast';
import ConfirmModal from '../../Components/ConfirmModal';

// Helper to safely extract data from API responses
const extractData = (response) => {
  if (!response) return null;
  const data = response.data || response;
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  return data;
};

const APPROVED_QUALIFICATIONS = ['MD Emergency Medicine', 'DNB Emergency Medicine', 'MEM (Emergency Medicine)'];

const MANDATORY_DOCUMENTS = [
  { key: 'equipmentList', label: 'Equipment List *' },
  { key: 'facultyList', label: 'Faculty List *' },
  { key: 'opdStats', label: 'Emergency OPD Statistics *' },
  { key: 'libraryList', label: 'Library Book List *' },
  { key: 'mannequinList', label: 'Training Mannequin List *' },
  { key: 'diagnosticList', label: 'Diagnostic Equipment List *' },
  { key: 'declarationLetter', label: 'Declaration Letter *' },
  { key: 'paymentReceiptDoc', label: 'Inspection Payment Receipt *' }
];

const STEP_ROUTES = {
  welcome: '/institute',
  login: '/institute/login',
  register: '/institute/register',
  verify_pending: '/institute/verify-email',
  onboarding_form: '/institute/apply',
  pending_review: '/institute/status',
  active_erp: '/institute/dashboard',
  forgot_password: '/institute/forgot-password',
  reset_password: '/institute/reset-password'
};

const ROUTE_STEPS = {
  '/institute': 'welcome',
  '/institute/': 'welcome',
  '/institute/login': 'login',
  '/institute/register': 'register',
  '/institute/verify-email': 'verify_pending',
  '/institute/apply': 'onboarding_form',
  '/institute/status': 'pending_review',
  '/institute/dashboard': 'active_erp',
  '/institute/courses': 'active_erp',
  '/institute/batches': 'active_erp',
  '/institute/enrollment': 'active_erp',
  '/institute/students': 'active_erp',
  '/institute/fees': 'active_erp',
  '/institute/exams': 'active_erp',
  '/institute/studentDetails': 'active_erp',
  '/institute/hallTicket': 'active_erp',
  '/institute/forgot-password': 'forgot_password',
  '/institute/reset-password': 'reset_password'
};

const InstitutePortal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATE MANAGEMENT ---
  const [currentStep, setCurrentStepState] = useState(() => {
    return ROUTE_STEPS[window.location.pathname] || 'welcome';
  });
  
  const setCurrentStep = useCallback((step) => {
    const route = STEP_ROUTES[step] || '/institute';
    const targetIsErp = ROUTE_STEPS[window.location.pathname] === 'active_erp';
    if (step === 'active_erp' && targetIsErp) {
      setCurrentStepState('active_erp');
      return;
    }
    navigate(route);
  }, [navigate]);

  const [user, setUser] = useState(null);
  
  // Onboarding Form Wizard Step (1: General Info, 2: Department, 3: Document Uploads, 4: Payment & Declaration)
  const [activeWizardStep, setActiveWizardStep] = useState(1);

  // Form error notification banner
  const [errorBanner, setErrorBanner] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Form inputs for registration
  const [regForm, setRegForm] = useState({
    instituteName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  // Form inputs for login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  // Onboarding Application form inputs
  const [appForm, setAppForm] = useState(() => {
    const regEmail = localStorage.getItem('semi_registered_email') || '';
    return {
      orgName: '',
      constitutionType: '',
      instituteAddress: '',
      registeredOfficeAddress: '',
      phoneNumber: '',
      emailAddress: regEmail,
      commencementDate: '',
      seatsRequested: '',
      officePhone: '',
      website: '',
      headName: '',
      headDesignation: '',
      hodName: '',
      bedCount: '',
      physicianAvailability: '',
      physicianExperience: '',
      courseDirectorEMQualified: '',
      emFacultyCount: '',
      teachingSpace: '',
      nabhStatus: '',
      paymentBankName: '',
      paymentTxnNo: '',
      paymentTxnDate: '',
      authorizedRepName: '',
      authorizedRepDesignation: ''
    };
  });

  // Document upload state (mock file names/presence)
  const [uploadedDocs, setUploadedDocs] = useState({
    equipmentList: null,
    facultyList: null,
    opdStats: null,
    libraryList: null,
    mannequinList: null,
    diagnosticList: null,
    declarationLetter: null,
    paymentReceiptDoc: null,
    signatureDoc: null
  });

  // Upload progress indicators
  const [uploadProgress, setUploadProgress] = useState({});

  // Payment simulated state
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Overall application record (status: draft, pending_review, approved, rejected)
  const [applicationRecord, setApplicationRecord] = useState({
    status: 'draft',
    submittedAt: null,
    inspectedAt: null,
    rejectionReason: null
  });

  // --- ERP STATE ---
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('All');

  // --- ERP PREMIUM STATE ---
  // Derive which ERP tab is active based on pathname
  const activeTab = useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/institute/courses') return 'courses';
    if (pathname === '/institute/batches') return 'batches';
    if (pathname === '/institute/enrollment') return 'enrollment';
    if (pathname === '/institute/students') return 'students';
    if (pathname === '/institute/fees') return 'fees';
    if (pathname === '/institute/exams') return 'exams';
    if (pathname === '/institute/studentDetails') return 'studentDetails';
    if (pathname === '/institute/hallTicket') return 'hallTicket';
    return 'dashboard';
  }, [location.pathname]);

  const setActiveTab = useCallback((tab) => {
    const tabRoutes = {
      dashboard: '/institute/dashboard',
      courses: '/institute/courses',
      batches: '/institute/batches',
      enrollment: '/institute/enrollment',
      students: '/institute/students',
      fees: '/institute/fees',
      exams: '/institute/exams',
      studentDetails: '/institute/studentDetails',
      hallTicket: '/institute/hallTicket'
    };
    navigate(tabRoutes[tab] || '/institute/dashboard');
  }, [navigate]);
  
  // Courses registry state
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({
    courseName: '',
    courseCode: '',
    courseType: '',
    programCategory: '',
    courseDuration: '',
    durationType: '',
    subjects: [],
    examinationFee: '',
  });

  const [batches, setBatches] = useState([]);
  const [newBatch, setNewBatch] = useState({
    name: '',
    startDate: '',
    seats: '',
    courseId: ''
  });

  const [examApplications, setExamApplications] = useState([]);
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [studentAcademicDetails, setStudentAcademicDetails] = useState([]);

  const [enrollForm, setEnrollForm] = useState(() => {
    const saved = localStorage.getItem('semi_enrollment_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved enrollment form', e);
      }
    }
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      homeAddress: '',
      contactNumber: '',
      emailAddress: '',
      qualification: '',
      passingYear: '',
      universityName: '',
      medCouncilRegNo: '',
      stateMedCouncil: '',
      studentCategory: '',
      serialBatch: '',
      course: '',
      batch: '',
      courseDirector: '',
      paymentMode: '',
      utrNumber: '',
      txnDate: new Date().toISOString().split('T')[0],
      currentDesignation: '',
      lifeMembershipNo: '',
      mcQualifications: '',
      declarationCheck: false
    };
  });

  React.useEffect(() => {
    localStorage.setItem('semi_enrollment_form', JSON.stringify(enrollForm));
  }, [enrollForm]);

  const [enrollDocs, setEnrollDocs] = useState({
    photoDoc: null,
    marksCertificateDoc: null,
    medCouncilCertDoc: null,
    fmgeCertDoc: null,
    paymentReceiptDoc: null,
    mcCertDoc: null,
    lifeMembershipCardDoc: null,
    studentSignatureDoc: null,
    hodSignatureDoc: null
  });

  const [enrollProgress, setEnrollProgress] = useState({});
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedStudentFilterBatch, setSelectedStudentFilterBatch] = useState('All');
  const [selectedStudentFilterCourse, setSelectedStudentFilterCourse] = useState('All');

  // ─── DATA FETCHING ─────────────────────────────────────────────────────────────
  const fetchERPData = useCallback(async () => {
    try {
      const coursesRes = await academicService.getCourses();
      const coursesData = extractData(coursesRes) || [];
      if (Array.isArray(coursesData)) {
        const formatted = coursesData.map(c => ({
          id: c._id,
          _id: c._id,
          courseName: c.name,
          courseCode: c.courseCode || 'N/A',
          courseType: c.courseType || 'Postgraduate',
          programCategory: c.programCategory || 'Emergency Medicine',
          courseDuration: c.courseDuration || '2',
          durationType: c.durationType || 'Years',
          subjects: c.subjects || [],
          totalSubjects: c.subjects && Array.isArray(c.subjects) ? c.subjects.length : 0,
          courseFee: c.courseFee || '0',
          registrationFee: c.registrationFee || '0',
          examinationFee: c.examinationFee || '0',
          certificationFee: c.certificationFee || '0',
          studentsCount: c.studentsCount ?? 0,
          batchesCount: c.batchesCount ?? 0,
          status: c.status || 'Active'
        }));
        const formattedStr = JSON.stringify(formatted);
        setCourses(prev => JSON.stringify(prev) === formattedStr ? prev : formatted);
        if (localStorage.getItem('semi_courses') !== formattedStr) {
          localStorage.setItem('semi_courses', formattedStr);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch courses from API:', err);
    }

    try {
      const batchesRes = await academicService.getBatches();
      const batchesData = extractData(batchesRes) || [];
      if (Array.isArray(batchesData)) {
        const formatted = batchesData.map(b => ({
          id: b._id,
          _id: b._id,
          name: b.name || `Batch ${b.year || new Date().getFullYear()}-A`,
          startDate: b.startDate || `${b.year || new Date().getFullYear()}-01-10`,
          seats: b.seats || '5',
          activeFellows: b.activeFellows || 0,
          year: b.year
        }));
        const formattedStr = JSON.stringify(formatted);
        setBatches(prev => JSON.stringify(prev) === formattedStr ? prev : formatted);
        if (localStorage.getItem('semi_batches') !== formattedStr) {
          localStorage.setItem('semi_batches', formattedStr);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch batches from API:', err);
    }

    try {
      const studentsRes = await academicService.listStudents();
      const studentsData = extractData(studentsRes) || [];
      if (Array.isArray(studentsData)) {
        const formatted = studentsData.map(s => ({
          id: s._id,
          _id: s._id,
          fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          email: s.email,
          phone: s.contactNumber,
          qualification: s.qualification,
          graduationYear: s.yearOfPassing?.toString() || '',
          enrollmentNo: s.enrollmentId,
          admissionDate: s.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: s.remittedToAcademy ? 'Completed' : 'Active',
          attendancePercentage: s.attendancePercentage || 0,
          thesisApproved: s.thesisApproved || false,
          courseId: s.course?._id || s.course,
          batchId: s.batch?._id || s.batch,
          courseName: s.course?.name || 'General Medicine',
          batchName: s.batch?.year ? `Batch ${s.batch.year}` : 'Batch 2026',
          homeAddress: s.homeAddress,
          contactNumber: s.contactNumber,
          courseDirector: s.courseDirector,
          utrNumber: s.utrNumber,
          medicalCouncilRegistrationNumber: s.medicalCouncilRegistrationNumber,
          universityName: s.universityName,
          mbbsQualification: s.mbbsQualification,
          fmgeClearanceStatus: s.fmgeClearanceStatus,
          isForeignGraduate: s.isForeignGraduate,
          documents: s.documents || {},
        }));
        const formattedStr = JSON.stringify(formatted);
        setStudents(prev => JSON.stringify(prev) === formattedStr ? prev : formatted);
        if (localStorage.getItem('semi_students') !== formattedStr) {
          localStorage.setItem('semi_students', formattedStr);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch students from API:', err);
    }

    try {
      const examsRes = await examService.listExamApplications();
      const examsData = extractData(examsRes) || [];
      if (Array.isArray(examsData)) {
        const examsStr = JSON.stringify(examsData);
        setExamApplications(prev => JSON.stringify(prev) === examsStr ? prev : examsData);
        if (localStorage.getItem('semi_exam_applications') !== examsStr) {
          localStorage.setItem('semi_exam_applications', examsStr);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch exam applications from API:', err);
    }
  }, []);

  const fetchApplication = useCallback(async () => {
    try {
      const response = await instituteService.getMyApplication();
      const app = extractData(response);
      if (app) {
        const freshForm = {
          orgName: app.orgName || '',
          constitutionType: app.constitutionType || 'University',
          instituteAddress: app.instituteAddress || '',
          registeredOfficeAddress: app.registeredOfficeAddress || '',
          phoneNumber: app.phoneNumber || '',
          emailAddress: app.emailAddress || localStorage.getItem('semi_registered_email') || '',
          commencementDate: app.commencementDate ? app.commencementDate.split('T')[0] : '',
          seatsRequested: app.seatsRequested?.toString() || '5',
          officePhone: app.officePhone || '',
          website: app.website || '',
          headName: app.headName || '',
          headDesignation: app.headDesignation || '',
          hodName: app.hodName || '',
          bedCount: app.bedCount?.toString() || '',
          physicianAvailability: app.physicianAvailability || 'Yes',
          physicianExperience: app.physicianExperience?.toString() || '',
          courseDirectorEMQualified: app.courseDirectorEMQualified || 'Yes',
          emFacultyCount: app.emFacultyCount?.toString() || '',
          teachingSpace: app.teachingSpace || 'Yes',
          nabhStatus: app.nabhStatus || 'Yes',
          paymentBankName: app.paymentBankName || '',
          paymentTxnNo: app.paymentTxnNo || '',
          paymentTxnDate: app.paymentTxnDate ? app.paymentTxnDate.split('T')[0] : '',
          authorizedRepName: app.authorizedRepName || '',
          authorizedRepDesignation: app.authorizedRepDesignation || 'Course Director'
        };

        const freshDocs = {
          equipmentList: app.documents?.equipmentListUrl ? { name: 'equipmentList.pdf', size: 'Uploaded', url: app.documents.equipmentListUrl } : null,
          facultyList: app.documents?.facultyListUrl ? { name: 'facultyList.pdf', size: 'Uploaded', url: app.documents.facultyListUrl } : null,
          opdStats: app.documents?.emergencyOPDStatisticsUrl ? { name: 'opdStats.pdf', size: 'Uploaded', url: app.documents.emergencyOPDStatisticsUrl } : null,
          libraryList: app.documents?.libraryBookListUrl ? { name: 'libraryList.pdf', size: 'Uploaded', url: app.documents.libraryBookListUrl } : null,
          mannequinList: app.documents?.trainingMannequinListUrl ? { name: 'mannequinList.pdf', size: 'Uploaded', url: app.documents.trainingMannequinListUrl } : null,
          diagnosticList: app.documents?.diagnosticEquipmentListUrl ? { name: 'diagnosticList.pdf', size: 'Uploaded', url: app.documents.diagnosticEquipmentListUrl } : null,
          declarationLetter: app.documents?.declarationLetterUrl ? { name: 'declarationLetter.pdf', size: 'Uploaded', url: app.documents.declarationLetterUrl } : null,
          paymentReceiptDoc: app.documents?.inspectionPaymentReceiptUrl ? { name: 'paymentReceipt.pdf', size: 'Uploaded', url: app.documents.inspectionPaymentReceiptUrl } : null,
          signatureDoc: app.facultyCommitmentLetterUrl ? { name: 'signatureDoc.pdf', size: 'Uploaded', url: app.facultyCommitmentLetterUrl } : null
        };

        const statusMapped = app.status ? app.status.toLowerCase().replace(' ', '_') : 'pending_review';

        const freshRecord = {
          id: app._id,
          status: statusMapped,
          submittedAt: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : null,
          inspectedAt: app.inspectionTriggered ? new Date().toLocaleDateString() : null,
          rejectionReason: app.remarks || null
        };

        setAppForm(prev => JSON.stringify(prev) === JSON.stringify(freshForm) ? prev : freshForm);
        setUploadedDocs(prev => JSON.stringify(prev) === JSON.stringify(freshDocs) ? prev : freshDocs);
        setPaymentComplete(prev => prev === (app.paymentStatus === 'Completed') ? prev : (app.paymentStatus === 'Completed'));
        setApplicationRecord(prev => JSON.stringify(prev) === JSON.stringify(freshRecord) ? prev : freshRecord);

        if (app.orgName) {
          setUser(prev => {
            if (prev && prev.instituteName === app.orgName) return prev;
            const updated = prev ? { ...prev, instituteName: app.orgName } : { instituteName: app.orgName };
            localStorage.setItem('semi_user', JSON.stringify(updated));
            return updated;
          });
        }

        if (statusMapped === 'approved' && currentStep !== 'active_erp') {
          setCurrentStep('active_erp');
          fetchERPData();
        } else if ((statusMapped === 'pending_review' || statusMapped === 'rejected') && currentStep !== 'pending_review') {
          setCurrentStep('pending_review');
        } else if (statusMapped === 'draft' && currentStep !== 'onboarding_form' && currentStep !== 'verify_pending') {
          setCurrentStep('onboarding_form');
        }

        const freshDataStr = JSON.stringify({
          form: freshForm,
          uploadedDocs: freshDocs,
          paymentComplete: app.paymentStatus === 'Completed',
          paymentDetails: app.paymentStatus === 'Completed' ? { transactionId: app.paymentTxnNo } : null,
          record: freshRecord,
          activeWizardStep: 4
        });
        if (localStorage.getItem('semi_institute_data') !== freshDataStr) {
          localStorage.setItem('semi_institute_data', freshDataStr);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user application from API:', err);
    }
  }, [setCurrentStep, fetchERPData]);

  const loadApplicationFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem('semi_user');
    const storedAppData = localStorage.getItem('semi_institute_data');
    const storedCourses = localStorage.getItem('semi_courses');
    const storedBatches = localStorage.getItem('semi_batches');
    const storedStudents = localStorage.getItem('semi_students');

    // Seed default data if nothing exists
    if (!storedCourses) {
      const initialCourses = [
        { id: '1', courseName: 'MBBS', courseCode: 'MBBS-001', courseType: 'Undergraduate', programCategory: 'General Medicine', courseDuration: '5', durationType: 'Years', totalSubjects: '24', courseFee: '12,0,000', registrationFee: '50,000', examinationFee: '20,000', certificationFee: '10,000', studentsCount: 0, batchesCount: 1, status: 'Active' },
        { id: '2', courseName: 'MD - Emergency Medicine', courseCode: 'MD-EM-01', courseType: 'Postgraduate', programCategory: 'Emergency Medicine', courseDuration: '3', durationType: 'Years', totalSubjects: '12', courseFee: '15,0,000', registrationFee: '60,000', examinationFee: '25,000', certificationFee: '15,000', studentsCount: 0, batchesCount: 1, status: 'Active' }
      ];
      localStorage.setItem('semi_courses', JSON.stringify(initialCourses));
      setCourses(initialCourses);
    } else {
      setCourses(JSON.parse(storedCourses));
    }

    if (!storedBatches) {
      const initialBatches = [
        { id: '1', name: 'Batch 2026-A', startDate: '2026-01-10', seats: '5', activeFellows: 0 },
        { id: '2', name: 'Batch 2026-B', startDate: '2026-07-01', seats: '5', activeFellows: 0 }
      ];
      localStorage.setItem('semi_batches', JSON.stringify(initialBatches));
      setBatches(initialBatches);
    } else {
      setBatches(JSON.parse(storedBatches));
    }

    if (!storedStudents) {
      setStudents([]);
      localStorage.setItem('semi_students', JSON.stringify([]));
    } else {
      setStudents(JSON.parse(storedStudents));
    }

    // Set default exam apps and fee transactions if not present
    if (!localStorage.getItem('semi_exam_applications')) {
      localStorage.setItem('semi_exam_applications', JSON.stringify([]));
      setExamApplications([]);
    } else {
      setExamApplications(JSON.parse(localStorage.getItem('semi_exam_applications')));
    }

    if (!localStorage.getItem('semi_fee_transactions')) {
      localStorage.setItem('semi_fee_transactions', JSON.stringify([]));
      setFeeTransactions([]);
    } else {
      setFeeTransactions(JSON.parse(localStorage.getItem('semi_fee_transactions')));
    }

    if (!localStorage.getItem('semi_student_academic_details')) {
      localStorage.setItem('semi_student_academic_details', JSON.stringify([]));
      setStudentAcademicDetails([]);
    } else {
      setStudentAcademicDetails(JSON.parse(localStorage.getItem('semi_student_academic_details')));
    }

    const DEFAULT_RECORD = { status: 'draft', submittedAt: null, inspectedAt: null, rejectionReason: null };

    let verified = true;
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.emailVerified === false) {
        verified = false;
        setCurrentStep('verify_pending');
      }
    }

    if (storedAppData && verified) {
      const parsedData = JSON.parse(storedAppData);
      const registeredEmail = localStorage.getItem('semi_registered_email');
      if (registeredEmail && !parsedData.form.emailAddress) {
        parsedData.form.emailAddress = registeredEmail;
      }
      setAppForm(prev => ({ ...prev, ...parsedData.form }));
      if (parsedData.form?.orgName) {
        setUser(prev => {
          if (!prev) return { instituteName: parsedData.form.orgName };
          const updated = { ...prev, instituteName: parsedData.form.orgName };
          localStorage.setItem('semi_user', JSON.stringify(updated));
          return updated;
        });
      }
      setUploadedDocs(prev => ({ ...prev, ...parsedData.uploadedDocs }));
      setPaymentComplete(parsedData.paymentComplete || false);
      setPaymentDetails(parsedData.paymentDetails || null);
      setApplicationRecord(parsedData.record || DEFAULT_RECORD);
      if (parsedData.activeWizardStep) {
        setActiveWizardStep(parsedData.activeWizardStep);
      }
      
      if (storedUser) {
        const record = parsedData.record || DEFAULT_RECORD;
        if (record.status === 'approved') {
          setCurrentStep('active_erp');
          fetchERPData();
        } else if (record.status === 'pending_review' || record.status === 'rejected') {
          setCurrentStep('pending_review');
        } else {
          setCurrentStep('onboarding_form');
        }
      }
    }
  }, [setCurrentStep, fetchERPData]);

  // ─── EFFECTS ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadApplicationFromStorage();
  }, [loadApplicationFromStorage]);

  // Background Auto-Polling every 5 seconds
  useEffect(() => {
    let intervalId;
    if (user) {
      intervalId = setInterval(() => {
        if (currentStep === 'active_erp') {
          fetchERPData();
        } else if (currentStep === 'pending_review' || currentStep === 'status') {
          fetchApplication();
        } else if (currentStep === 'verify_pending') {
          authService.checkStatus()
            .then(res => {
              const data = res.data?.data || res.data || {};
              if (data.isEmailVerified === true) {
                setUser(prev => {
                  const updated = { ...prev, emailVerified: true };
                  localStorage.setItem('semi_user', JSON.stringify(updated));
                  return updated;
                });
                setSuccessBanner('Email verified successfully!');
                setCurrentStep('onboarding_form');
              }
            })
            .catch(err => {
              console.warn('Failed to poll user verification status:', err);
            });
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, currentStep, fetchERPData, fetchApplication]);

  // Fetch from backend when authenticated
  useEffect(() => {
    if (localStorage.getItem('token') || localStorage.getItem('semi_token')) {
      fetchApplication();
      
      authService.checkStatus()
        .then(res => {
          const data = res.data?.data || res.data || {};
          if (data.isEmailVerified === true) {
            setUser(prev => {
              const updated = { ...prev, emailVerified: true };
              localStorage.setItem('semi_user', JSON.stringify(updated));
              return updated;
            });
            if (currentStep === 'verify_pending') {
              setCurrentStep('onboarding_form');
            }
          }
        })
        .catch(err => {
          console.warn('Failed to fetch user verification status on load:', err);
        });
    }
  }, [fetchApplication, currentStep]);

  // Fetch ERP data when dashboard is active
  useEffect(() => {
    if (currentStep === 'active_erp') {
      fetchERPData();
    }
  }, [currentStep, fetchERPData]);

  // Listen to board updates from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const storedAppData = localStorage.getItem('semi_institute_data');
      if (storedAppData && user) {
        const parsedData = JSON.parse(storedAppData);
        setApplicationRecord(parsedData.record);
        if (parsedData.record.status === 'approved') {
          setCurrentStep('active_erp');
          fetchERPData();
        } else if (parsedData.record.status === 'pending_review' || parsedData.record.status === 'rejected') {
          setCurrentStep('pending_review');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, setCurrentStep, fetchERPData]);

  // URL and Auth Guard Synchronizer
  useEffect(() => {
    const currentPath = location.pathname;
    const targetStep = ROUTE_STEPS[currentPath] || 'welcome';

    const storedUser = localStorage.getItem('semi_user');
    const storedAppData = localStorage.getItem('semi_institute_data');
    
    const activeUser = user || (storedUser ? JSON.parse(storedUser) : null);
    const activeAppData = storedAppData ? JSON.parse(storedAppData) : null;
    const activeRecord = applicationRecord.status !== 'draft' ? applicationRecord : (activeAppData?.record || { status: 'draft' });

    const securedSteps = ['onboarding_form', 'pending_review', 'active_erp'];
    if (securedSteps.includes(targetStep) && !activeUser) {
      navigate('/institute/login', { replace: true });
      return;
    }

    if (activeUser && activeUser.emailVerified === false) {
      if (targetStep !== 'verify_pending') {
        navigate('/institute/verify-email', { replace: true });
        return;
      }
    }

    if (activeUser && activeUser.emailVerified === true && targetStep === 'verify_pending') {
      if (activeRecord.status === 'approved') {
        navigate('/institute/dashboard', { replace: true });
      } else if (activeRecord.status === 'pending_review' || activeRecord.status === 'rejected') {
        navigate('/institute/status', { replace: true });
      } else {
        navigate('/institute/apply', { replace: true });
      }
      return;
    }

    const publicSteps = ['welcome', 'login', 'register', 'forgot_password', 'reset_password'];
    if (activeUser && activeUser.emailVerified === true && publicSteps.includes(targetStep)) {
      if (activeRecord.status === 'approved') {
        navigate('/institute/dashboard', { replace: true });
      } else if (activeRecord.status === 'pending_review' || activeRecord.status === 'rejected') {
        navigate('/institute/status', { replace: true });
      } else {
        navigate('/institute/apply', { replace: true });
      }
      return;
    }

    if (activeUser && activeUser.emailVerified === true) {
      if (targetStep === 'onboarding_form' && activeRecord.status !== 'draft') {
        if (activeRecord.status === 'approved') {
          navigate('/institute/dashboard', { replace: true });
        } else {
          navigate('/institute/status', { replace: true });
        }
        return;
      }
      if (targetStep === 'pending_review' && (activeRecord.status !== 'pending_review' && activeRecord.status !== 'rejected')) {
        if (activeRecord.status === 'approved') {
          navigate('/institute/dashboard', { replace: true });
        } else {
          navigate('/institute/apply', { replace: true });
        }
        return;
      }
      if (targetStep === 'active_erp' && activeRecord.status !== 'approved') {
        if (activeRecord.status === 'pending_review' || activeRecord.status === 'rejected') {
          navigate('/institute/status', { replace: true });
        } else {
          navigate('/institute/apply', { replace: true });
        }
        return;
      }
    }

    setCurrentStepState(targetStep);
  }, [location.pathname, user, applicationRecord, navigate]);

  const activeStudentCount = useMemo(() => {
    return students.filter(s => s.status === 'Active').length;
  }, [students]);

  // ─── ACTIONS & HANDLERS ──────────────────────────────────────────────────────

// ─── EMAIL VERIFICATION HANDLER ──────────────────────────────────────────────
const handleVerifyEmail = useCallback(async (tokenArg) => {
  if (!user) {
    setErrorBanner('User session not found. Please register again.');
    return;
  }

  const token = tokenArg || user?.verificationToken || user?.token;
  
  if (!token) {
    setErrorBanner('Verification token not found.');
    return;
  }

  try {
    setErrorBanner(null);
    setSuccessBanner(null);
    
    // Call the API with the token
    const response = await authService.verifyEmail(token);
    
    // Check if verification was successful
    if (response.status === 200) {
      const verifiedUser = {
        ...user,
        emailVerified: true
      };
      setUser(verifiedUser);
      localStorage.setItem('semi_user', JSON.stringify(verifiedUser));
      setSuccessBanner('Email address successfully verified! Your credentials are now active.');
      setCurrentStep(applicationRecord?.status !== 'draft' ? 'pending_review' : 'onboarding_form');
    }
  } catch (err) {
    console.error('Email verification failed:', err);
    setErrorBanner(err.parsedMessage || err.message || 'Email verification failed. Please try again.');
  }
}, [user, setCurrentStep]);

  const validateWizardStep = useCallback((step) => {
    setErrorBanner(null);

    if (step === 1) {
      if (!appForm.orgName) return 'Health Care Organization Name is required.';
      if (!appForm.instituteAddress) return 'Institution Address is required.';
      if (!appForm.registeredOfficeAddress) return 'Registered Office Address is required.';
      
      const phoneRegex = /^\d{6,12}$/;
      if (!appForm.phoneNumber) return 'Phone Number is required.';
      if (!phoneRegex.test(appForm.phoneNumber.replace(/\D/g, ''))) return 'Phone Number must be a valid 6 to 12-digit phone/landline number.';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!appForm.emailAddress) return 'Email Address is required.';
      if (!emailRegex.test(appForm.emailAddress)) return 'Valid Email Address is required.';
      
      if (!appForm.commencementDate) return 'Proposed Date of Commencement is required.';
      if (!appForm.seatsRequested || parseInt(appForm.seatsRequested, 10) <= 0) return 'Valid Number of Seats Requested is required.';
      
      if (!appForm.officePhone) return 'Registered Office Phone Number is required.';
      if (!phoneRegex.test(appForm.officePhone.replace(/\D/g, ''))) return 'Registered Office Phone Number must be a valid 6 to 12-digit phone/landline number.';
      
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!appForm.website) return 'Institutional Website Address is required.';
      if (!urlRegex.test(appForm.website)) return 'Valid Institutional Website Address URL is required.';
      
      if (!appForm.headName) return 'Name of Head of Institution is required.';
      if (!appForm.headDesignation) return 'Designation of Head of Institution is required.';
    }

    if (step === 2) {
      if (!appForm.hodName) return 'Name of Head of Department is required.';
      if (!appForm.bedCount || parseInt(appForm.bedCount, 10) < 10) {
        return 'SEMI mandates a minimum of 10 Emergency Department beds.';
      }
      if (appForm.physicianAvailability !== 'Yes' && appForm.physicianAvailability !== 'Yes (Mandatory)') {
        return 'Emergency Physician Availability is mandatory (must be Yes).';
      }
      if (!appForm.physicianExperience || parseInt(appForm.physicianExperience, 10) < 24) {
        return 'Emergency Physician Experience must be a minimum of 24 months.';
      }
      if (!appForm.emFacultyCount || parseInt(appForm.emFacultyCount, 10) < 1) {
        return 'EM Qualified Faculty Count must be a minimum of 1.';
      }
      if (appForm.teachingSpace !== 'Yes' && appForm.teachingSpace !== 'Yes (Mandatory)') {
        return 'Teaching Space Availability is mandatory (must be Yes).';
      }
    }

    if (step === 3) {
      const missingDocs = [];
      for (const doc of MANDATORY_DOCUMENTS) {
        if (doc.key === 'paymentReceiptDoc') continue;
        if (!uploadedDocs[doc.key]) {
          missingDocs.push(doc.label.replace(' *', ''));
        }
      }
      if (missingDocs.length > 0) {
        return `Missing Mandatory Documents: ${missingDocs.join(', ')}.`;
      }
    }

    if (step === 4) {
      if (!paymentComplete) return 'Please complete the simulated inspection fee payment.';
      if (!appForm.paymentBankName) return 'Payment Bank Name is required.';
      if (!appForm.paymentTxnNo) return 'Payment Transaction / Ref Number is required.';
      if (!appForm.paymentTxnDate) return 'Payment Transaction Date is required.';
      if (!appForm.authorizedRepName) return 'Authorized Representative Name is required.';
      if (!uploadedDocs.signatureDoc) return 'Please upload the digital signature file.';
    }

    return null;
  }, [appForm, uploadedDocs, paymentComplete]);

  // ─── REGISTER HANDLER ────────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!regForm.instituteName || !regForm.email || !regForm.password || !regForm.confirmPassword) {
      setErrorBanner('Please fill out all registration fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regForm.email)) {
      setErrorBanner('Invalid email format. Please enter a valid institutional email address.');
      return;
    }
    if (regForm.password.length < 8) {
      setErrorBanner('Password must be a minimum of 8 characters.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorBanner('Passwords do not match.');
      return;
    }
    if (!regForm.terms) {
      setErrorBanner('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    try {
      const response = await authService.register({
        name: regForm.instituteName,
        email: regForm.email,
        password: regForm.password,
      });

      const data = extractData(response) || {};
      const userToken = data.accessToken || response.data?.token || response.token;
      const userRefreshToken = data.refreshToken;
      const verificationToken = data.verificationToken;

      const newUser = {
        name: regForm.instituteName,
        email: regForm.email,
        password: regForm.password,
        emailVerified: false,
        token: verificationToken || 'simulated-token',
        userId: data.userId || data.user?.id || data.id,
      };
      
      setUser(newUser);
      if (userToken) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('semi_token', userToken);
      }
      if (userRefreshToken) {
        localStorage.setItem('refreshToken', userRefreshToken);
      }
      localStorage.setItem('semi_registered_email', regForm.email);

      const freshForm = {
        orgName: regForm.instituteName,
        constitutionType: 'University',
        instituteAddress: '',
        registeredOfficeAddress: '',
        phoneNumber: '',
        emailAddress: regForm.email,
        commencementDate: '',
        seatsRequested: '5',
        officePhone: '',
        website: '',
        headName: '',
        headDesignation: '',
        hodName: '',
        bedCount: '',
        physicianAvailability: 'Yes',
        physicianExperience: '',
        courseDirectorEMQualified: 'Yes',
        emFacultyCount: '',
        teachingSpace: 'Yes',
        nabhStatus: 'Yes',
        paymentBankName: '',
        paymentTxnNo: '',
        paymentTxnDate: '',
        authorizedRepName: '',
        authorizedRepDesignation: 'Course Director'
      };

      const freshDocs = {
        equipmentList: null,
        facultyList: null,
        opdStats: null,
        libraryList: null,
        mannequinList: null,
        diagnosticList: null,
        declarationLetter: null,
        paymentReceiptDoc: null,
        signatureDoc: null
      };

      const freshRecord = {
        status: 'draft',
        submittedAt: null,
        inspectedAt: null,
        rejectionReason: null
      };

      setAppForm(freshForm);
      setUploadedDocs(freshDocs);
      setPaymentComplete(false);
      setPaymentDetails(null);
      setApplicationRecord(freshRecord);
      setActiveWizardStep(1);

      saveToLocalStorage(newUser, freshForm, freshDocs, false, freshRecord, 1);
      
      setSuccessBanner('Account created successfully! Please check your email to verify your account.');
      setCurrentStep('verify_pending');
    } catch (err) {
      setErrorBanner(err.parsedMessage || err.message || 'Registration failed. Please try again.');
    }
  };

  // ─── LOGIN HANDLER ────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!loginForm.email || !loginForm.password) {
      setErrorBanner('Please enter your email and password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginForm.email)) {
      setErrorBanner('Invalid email format. Please enter a valid email address.');
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
      
      const parsedUser = {
        instituteName: data.user?.instituteName || data.user?.name || 'Saraswathi Medical College',
        email: data.user?.email || loginForm.email,
        emailVerified: data.user?.emailVerified ?? true,
        role: data.user?.role || 'institute',
        ...data.user
      };

      if (userToken) {
        localStorage.setItem('token', userToken);
        localStorage.setItem('semi_token', userToken);
      }
      if (userRefreshToken) {
        localStorage.setItem('refreshToken', userRefreshToken);
      }

      setUser(parsedUser);
      localStorage.setItem('semi_user', JSON.stringify(parsedUser));
      localStorage.setItem('semi_registered_email', parsedUser.email);

      await fetchApplication();

      setSuccessBanner('Login authenticated successfully!');
    } catch (err) {
      console.error('Login failed:', err);
      setErrorBanner('Invalid credentials. Email or password is not match.');
    }
  };

  // ─── DOCUMENT UPLOAD HELPERS ─────────────────────────────────────────────────
  const simulateDocUpload = useCallback((fieldName, file) => {
    if (!file) return;
    setUploadProgress(prev => ({ ...prev, [fieldName]: 10 }));
    
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(prev => ({ ...prev, [fieldName]: null }));
        setUploadedDocs(prev => ({
          ...prev,
          [fieldName]: {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            uploadedAt: new Date().toLocaleTimeString()
          }
        }));
      } else {
        setUploadProgress(prev => ({ ...prev, [fieldName]: progress }));
      }
    }, 100);
  }, []);

  const removeDocument = useCallback((fieldName) => {
    setUploadedDocs(prev => ({ ...prev, [fieldName]: null }));
  }, []);

  // ─── PAYMENT HANDLER ──────────────────────────────────────────────────────────
  const handlePaymentInitiate = async () => {
    setPaymentProcessing(true);
    setErrorBanner(null);

    if (!appForm.orgName || !appForm.instituteAddress || !appForm.headName || !appForm.hodName) {
      setErrorBanner('Please fill out all mandatory fields in Section 1 (General Info) before paying.');
      setPaymentProcessing(false);
      return;
    }

    try {
      let orderData = {};
      let verifyData = {};
      const txId = 'TXN-' + Math.floor(100000000000 + Math.random() * 900000000000);
      const receiptNo = 'RCPT-' + Math.floor(10000000 + Math.random() * 90000000);

      try {
        const orderRes = await instituteService.createPaymentOrder();
        orderData = extractData(orderRes) || {};

        const verifyRes = await instituteService.verifyPayment({
          razorpay_order_id: orderData.orderId || orderData.id,
          razorpay_payment_id: 'pending',
          razorpay_signature: 'pending',
          transactionId: txId,
          amount: 250000
        });
        verifyData = extractData(verifyRes) || {};
      } catch (apiErr) {
        console.warn('Backend payment APIs failed or returned 404. Falling back to local mock payment...', apiErr);
        orderData = { orderId: 'order_mock_' + Math.random().toString(36).substring(2, 11) };
        verifyData = {
          paymentId: txId,
          receiptNumber: receiptNo
        };
      }

      const feeDetails = {
        receiptNumber: verifyData.receiptNumber || receiptNo,
        transactionId: verifyData.paymentId || txId,
        amount: '₹2,50,000.00',
        date: new Date().toLocaleString(),
        status: 'Success'
      };

      setPaymentComplete(true);
      setPaymentDetails(feeDetails);
      setPaymentProcessing(false);
      
      setAppForm(prev => ({
        ...prev,
        paymentBankName: 'State Bank of India',
        paymentTxnNo: verifyData.paymentId || txId,
        paymentTxnDate: new Date().toISOString().split('T')[0]
      }));

      setUploadedDocs(prev => ({ 
        ...prev, 
        paymentReceiptDoc: { name: `${verifyData.receiptNumber || receiptNo}-receipt.pdf`, size: '142.5 KB', uploadedAt: new Date().toLocaleTimeString() }
      }));
      setSuccessBanner('Inspection Fee Payment processed and verified successfully!');
    } catch (err) {
      console.error('Payment initiation/verification failed:', err);
      setPaymentProcessing(false);
      setErrorBanner(err.parsedMessage || err.message || 'Payment processing failed. Please try again.');
    }
  };

  // ─── WIZARD NAVIGATION ────────────────────────────────────────────────────────
  const handleWizardNext = () => {
    setErrorBanner(null);
    setSuccessBanner(null);
    const error = validateWizardStep(activeWizardStep);
    if (error) {
      setErrorBanner(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const nextStep = activeWizardStep + 1;
    setActiveWizardStep(nextStep);
    saveToLocalStorage(user, appForm, uploadedDocs, paymentComplete, applicationRecord, nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWizardBack = () => {
    setErrorBanner(null);
    setSuccessBanner(null);
    const prevStep = activeWizardStep - 1;
    setActiveWizardStep(prevStep);
    saveToLocalStorage(user, appForm, uploadedDocs, paymentComplete, applicationRecord, prevStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWizardStepChange = (newStep) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    setActiveWizardStep(newStep);
    saveToLocalStorage(user, appForm, uploadedDocs, paymentComplete, applicationRecord, newStep);
  };

  // ─── APPLICATION SUBMIT ──────────────────────────────────────────────────────
  const handleApplicationSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorBanner(null);

    const beds = parseInt(appForm.bedCount, 10);
    if (isNaN(beds) || beds < 10) {
      setErrorBanner('🚨 Compliance Violation: Emergency Department Bed Count is less than 10 beds.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const experience = parseInt(appForm.physicianExperience, 10);
    if (isNaN(experience) || experience < 24) {
      setErrorBanner('🚨 Compliance Violation: Emergency Physician Experience is less than 24 months.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (appForm.physicianAvailability !== 'Yes' && appForm.physicianAvailability !== 'Yes (Mandatory)') {
      setErrorBanner('🚨 Compliance Violation: Emergency Physician Availability is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const facCount = parseInt(appForm.emFacultyCount, 10);
    if (isNaN(facCount) || facCount < 1) {
      setErrorBanner('🚨 Compliance Violation: EM Qualified Faculty count must be at least 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (appForm.teachingSpace !== 'Yes' && appForm.teachingSpace !== 'Yes (Mandatory)') {
      setErrorBanner('🚨 Compliance Violation: Teaching Space Availability is mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!appForm.authorizedRepName || !uploadedDocs.signatureDoc) {
      setErrorBanner('🚨 Compliance Violation: Representative Name and Digital Signature upload are mandatory.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const missingDocs = [];
    if (!uploadedDocs.equipmentList) missingDocs.push('Equipment List');
    if (!uploadedDocs.facultyList) missingDocs.push('Faculty List');
    if (!uploadedDocs.opdStats) missingDocs.push('Emergency OPD Statistics');
    if (!uploadedDocs.libraryList) missingDocs.push('Library Book List');
    if (!uploadedDocs.mannequinList) missingDocs.push('Training Mannequin List');
    if (!uploadedDocs.diagnosticList) missingDocs.push('Diagnostic Equipment List');
    if (!uploadedDocs.declarationLetter) missingDocs.push('Declaration Letter');
    if (!uploadedDocs.paymentReceiptDoc) missingDocs.push('Inspection Payment Receipt');

    if (missingDocs.length > 0) {
      setErrorBanner(`Missing Mandatory Documents: ${missingDocs.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!paymentComplete || !appForm.paymentBankName || !appForm.paymentTxnNo || !appForm.paymentTxnDate) {
      setErrorBanner('Inspection Fee Payment and transaction reference fields must be successfully completed.');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(appForm).forEach(key => {
        if (appForm[key]) {
          formData.append(key, appForm[key]);
        }
      });

      const appendDocFile = (backendKey, stateKey) => {
        const fileState = uploadedDocs[stateKey];
        if (fileState) {
          if (fileState instanceof File) {
            formData.append(backendKey, fileState);
          } else {
            const mockBlob = new Blob(['Simulated document content for ' + backendKey], { type: 'application/pdf' });
            formData.append(backendKey, mockBlob, fileState.name || `${backendKey}.pdf`);
          }
        }
      };

      appendDocFile('equipmentList', 'equipmentList');
      appendDocFile('facultyList', 'facultyList');
      appendDocFile('emergencyOPDStatistics', 'opdStats');
      appendDocFile('libraryBookList', 'libraryList');
      appendDocFile('trainingMannequinList', 'mannequinList');
      appendDocFile('diagnosticEquipmentList', 'diagnosticList');
      appendDocFile('declarationLetter', 'declarationLetter');
      appendDocFile('facultyCommitmentLetter', 'signatureDoc');
      appendDocFile('inspectionPaymentReceipt', 'paymentReceiptDoc');

       const response = await instituteService.apply(formData);
    const data = extractData(response) || {};

    const newRecord = {
      status: data.status ? data.status.toLowerCase().replace(' ', '_') : 'pending_review',
      submittedAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      inspectedAt: data.inspectionTriggered ? new Date().toLocaleDateString() : null,
      rejectionReason: data.remarks || null,
      ...data
    };
    setApplicationRecord(newRecord);
    saveToLocalStorage(user, appForm, uploadedDocs, true, newRecord);
    
    setSuccessBanner('Application submitted successfully! Moving to Academic Board for Review.');
    setCurrentStep('pending_review');
  } catch (err) {
    console.error('Application submission failed:', err);
    
    // Handle Zod validation errors from backend
    let errorMessage = err.parsedMessage || err.message || 'Failed to submit application.';
    
    // If error contains validation errors, format them nicely
    if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
      const validationErrors = err.response.data.errors.map(e => {
        if (e.message) return e.message;
        if (e.field) return `${e.field}: ${e.message || 'Invalid value'}`;
        return JSON.stringify(e);
      });
      errorMessage = validationErrors.join('\n');
    }
    
    setErrorBanner(errorMessage);
  }
};

  // ─── ERP HANDLERS ─────────────────────────────────────────────────────────────
  const handleCreateCourse = useCallback(async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!courseForm.courseName || !courseForm.courseCode) {
      setErrorBanner('Please fill out all mandatory course fields.');
      return;
    }
    if (!courseForm.subjects || courseForm.subjects.length === 0 || courseForm.subjects.some(s => !s.trim())) {
      setErrorBanner('Please add at least one valid subject.');
      return;
    }
    const feeVal = parseFloat(courseForm.examinationFee.replace(/,/g, ''));
    if (!courseForm.examinationFee || isNaN(feeVal) || feeVal < 0) {
      setErrorBanner('Please enter a valid non-negative numeric examination fee.');
      return;
    }
    const durationVal = parseFloat(courseForm.courseDuration);
    if (!courseForm.courseDuration || isNaN(durationVal) || durationVal <= 0) {
      setErrorBanner('Please enter a valid positive numeric course duration.');
      return;
    }

    try {
      await academicService.createCourse({
        name: courseForm.courseName,
        courseCode: courseForm.courseCode,
        courseType: courseForm.courseType,
        programCategory: courseForm.programCategory,
        courseDuration: courseForm.courseDuration,
        durationType: courseForm.durationType,
        subjects: courseForm.subjects,
        examinationFee: courseForm.examinationFee,
        description: `${courseForm.courseType} - ${courseForm.programCategory}`
      });

      await fetchERPData();
      setSuccessBanner(`🎉 Course "${courseForm.courseName}" created successfully!`);

      setCourseForm({
        courseName: '',
        courseCode: '',
        courseType: '',
        programCategory: '',
        courseDuration: '',
        durationType: '',
        subjects: [],
        examinationFee: ''
      });
    } catch (err) {
      console.error('Backend course creation failed:', err);
      setErrorBanner(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to create course.');
    }
  }, [courseForm, courses, fetchERPData]);

  const handleCreateBatch = useCallback(async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);
    if (!newBatch.name || !newBatch.startDate) {
      setErrorBanner('Please fill out the batch name and commencement date.');
      return;
    }
    const seats = parseInt(newBatch.seats, 10);
    if (isNaN(seats) || seats <= 0) {
      setErrorBanner('Number of available seats must be greater than zero.');
      return;
    }
    if (!newBatch.courseId) {
      setErrorBanner('Please select a course for the batch.');
      return;
    }
    
    try {
      const courseIdVal = newBatch.courseId;
      const yearVal = new Date(newBatch.startDate).getFullYear() || 2026;
      
      await academicService.createBatch({
        courseId: courseIdVal,
        year: yearVal,
        name: newBatch.name,
        startDate: newBatch.startDate,
        seats: seats
      });

      await fetchERPData();
      setNewBatch({ name: '', startDate: '', seats: '', courseId: '' });
      setSuccessBanner(`🎉 Batch "${newBatch.name}" created successfully!`);
    } catch (err) {
      console.error('Backend batch creation failed:', err);
      setErrorBanner(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to create batch.');
    }
  }, [newBatch, batches, courses, fetchERPData]);

  const handleEnrollmentSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    if (!enrollForm.firstName || !enrollForm.lastName || !enrollForm.homeAddress || !enrollForm.contactNumber || !enrollForm.emailAddress) {
      setErrorBanner('Personal Information is incomplete. Mandatory fields are required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!enrollForm.passingYear || !enrollForm.universityName || !enrollForm.medCouncilRegNo) {
      setErrorBanner('Academic and Medical Council credentials are required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!enrollForm.declarationCheck) {
      setErrorBanner('You must accept the student declaration terms to enroll.');
      return;
    }

    if (!APPROVED_QUALIFICATIONS.includes(enrollForm.qualification)) {
      setErrorBanner(`🚨 Eligibility Rejection: Candidate degree "${enrollForm.qualification}" is not recognized for SEMI advanced fellowships.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const missingDocs = [];
    if (!enrollDocs.photoDoc) missingDocs.push('Candidate Photo');
    if (!enrollDocs.marksCertificateDoc) missingDocs.push('Marks Certificate');
    if (!enrollDocs.medCouncilCertDoc) missingDocs.push('Medical Council Certificate');
    if (!enrollDocs.paymentReceiptDoc) missingDocs.push('UTR Payment Receipt');
    if (!enrollDocs.studentSignatureDoc) missingDocs.push('Student Signature');

    if (missingDocs.length > 0) {
      setErrorBanner(`Missing Mandatory Uploads: ${missingDocs.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const studentFormData = new FormData();
      studentFormData.append('firstName', enrollForm.firstName);
      studentFormData.append('lastName', enrollForm.lastName);
      studentFormData.append('homeAddress', enrollForm.homeAddress);
      studentFormData.append('contactNumber', enrollForm.contactNumber);
      studentFormData.append('email', enrollForm.emailAddress);
      studentFormData.append('qualification', enrollForm.qualification);
      studentFormData.append('mbbsQualification', enrollForm.mcQualifications || 'MBBS');
      studentFormData.append('yearOfPassing', enrollForm.passingYear);
      studentFormData.append('universityName', enrollForm.universityName);
      studentFormData.append('medicalCouncilRegistrationNumber', enrollForm.medCouncilRegNo);
      studentFormData.append('isForeignGraduate', enrollForm.studentCategory === 'FMG' ? 'true' : 'false');
      studentFormData.append('fmgeClearanceStatus', enrollForm.studentCategory === 'FMG' ? 'Cleared' : 'Not Applicable');
      
      // Find course ID
      const courseObj = courses.find(c => c.courseName.toLowerCase() === enrollForm.course.toLowerCase());
      const courseIdVal = courseObj?._id || courseObj?.id || courses[0]?._id || courses[0]?.id || 'mock-course-id';
      
      // Find batch ID
      const batchObj = batches.find(b => b.name.toLowerCase() === enrollForm.batch.toLowerCase());
      const batchIdVal = batchObj?._id || batchObj?.id || batches[0]?._id || batches[0]?.id || 'mock-batch-id';

      studentFormData.append('courseId', courseIdVal);
      studentFormData.append('batchId', batchIdVal);
      studentFormData.append('courseDirector', enrollForm.courseDirector || 'Dr. Ananya Sen');
      studentFormData.append('utrNumber', enrollForm.utrNumber || 'UTR-' + Date.now());

      const appendEnrollFile = (backendKey, fileState) => {
        if (fileState) {
          if (fileState instanceof File) {
            studentFormData.append(backendKey, fileState);
          } else {
            const mockBlob = new Blob(['Simulated student document for ' + backendKey], { type: 'application/pdf' });
            studentFormData.append(backendKey, mockBlob, fileState.name || `${backendKey}.pdf`);
          }
        }
      };

      appendEnrollFile('passportPhoto', enrollDocs.photoDoc);
      appendEnrollFile('mbbsCertificate', enrollDocs.marksCertificateDoc);
      appendEnrollFile('medicalCouncilRegistrationCertificate', enrollDocs.medCouncilCertDoc);
      appendEnrollFile('paymentReceipt', enrollDocs.paymentReceiptDoc);
      appendEnrollFile('semiMembershipForm', enrollDocs.studentSignatureDoc || enrollDocs.lifeMembershipCardDoc);
      if (enrollDocs.fmgeCertDoc) {
        appendEnrollFile('fmgeResultCopy', enrollDocs.fmgeCertDoc);
      }

      const response = await academicService.enrollStudent(studentFormData);
      const data = extractData(response) || {};

      const enrollNo = data.enrollmentId || `SEMI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const studentRecord = {
        id: Date.now().toString(),
        fullName: `${enrollForm.firstName} ${enrollForm.middleName ? enrollForm.middleName + ' ' : ''}${enrollForm.lastName}`,
        email: enrollForm.emailAddress,
        phone: enrollForm.contactNumber,
        qualification: enrollForm.qualification,
        graduationYear: enrollForm.passingYear,
        enrollmentNo: enrollNo,
        admissionDate: enrollForm.txnDate || new Date().toISOString().split('T')[0],
        status: 'Active',
        courseName: enrollForm.course,
        batchName: enrollForm.batch,
        homeAddress: enrollForm.homeAddress,
        contactNumber: enrollForm.contactNumber,
        courseDirector: enrollForm.courseDirector,
        utrNumber: enrollForm.utrNumber,
        ...data
      };

      const updatedStudents = [studentRecord, ...students];
      setStudents(updatedStudents);
      localStorage.setItem('semi_students', JSON.stringify(updatedStudents));

      // Refresh ERP data
      await fetchERPData();

      setSuccessBanner(`🎉 Fellow "${studentRecord.fullName}" verified and successfully enrolled! Enrollment ID: ${enrollNo}`);
      
      // Reset Form
      setEnrollForm({
        firstName: '',
        middleName: '',
        lastName: '',
        homeAddress: '',
        contactNumber: '',
        emailAddress: '',
        qualification: 'MD Emergency Medicine',
        passingYear: '2025',
        universityName: '',
        medCouncilRegNo: '',
        stateMedCouncil: '',
        studentCategory: 'General',
        serialBatch: 'Batch 2026-A',
        course: courses[0]?.courseName || 'MBBS',
        batch: 'Batch 2026-A',
        courseDirector: 'Dr. T.V. Ramakrishnan',
        paymentMode: 'Online Transfer',
        utrNumber: '',
        txnDate: new Date().toISOString().split('T')[0],
        currentDesignation: 'Resident',
        lifeMembershipNo: '',
        mcQualifications: 'MBBS, MD',
        declarationCheck: false
      });

      setEnrollDocs({
        photoDoc: null,
        marksCertificateDoc: null,
        medCouncilCertDoc: null,
        fmgeCertDoc: null,
        paymentReceiptDoc: null,
        mcCertDoc: null,
        lifeMembershipCardDoc: null,
        studentSignatureDoc: null,
        hodSignatureDoc: null
      });

      setActiveTab('students');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Backend enrollment failed:', err);
      setErrorBanner(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to enroll student.');
    }
  }, [enrollForm, enrollDocs, students, courses, batches, fetchERPData]);

  const handleEnrollDocUpload = useCallback((fieldName, file) => {
    if (!file) return;
    setEnrollProgress(prev => ({ ...prev, [fieldName]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setEnrollProgress(prev => ({ ...prev, [fieldName]: null }));
        setEnrollDocs(prev => ({
          ...prev,
          [fieldName]: {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            uploadedAt: new Date().toLocaleTimeString()
          }
        }));
      } else {
        setEnrollProgress(prev => ({ ...prev, [fieldName]: progress }));
      }
    }, 80);
  }, []);

  const removeEnrollDoc = useCallback((fieldName) => {
    setEnrollDocs(prev => ({ ...prev, [fieldName]: null }));
  }, []);

  const removeStudent = useCallback((id) => {
    setConfirmConfig({
      title: 'De-enroll Fellow',
      message: 'Are you sure you want to de-enroll this fellow?',
      type: 'danger',
      confirmText: 'De-enroll',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await academicService.deleteStudent(id);
          await fetchERPData();
          setSuccessBanner('Fellow de-enrolled successfully.');
        } catch (err) {
          console.error('De-enroll error:', err);
          setErrorBanner(err.parsedMessage || err.message || 'Failed to de-enroll student.');
        }
      }
    });
  }, [fetchERPData]);

  const updateStudent = useCallback(async (updatedStudent) => {
    try {
      const nameParts = updatedStudent.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const courseObj = courses.find(c => c.courseName === updatedStudent.courseName || c.name === updatedStudent.courseName);
      const batchObj = batches.find(b => b.name === updatedStudent.batchName || b.year?.toString() === updatedStudent.batchName);

      const payload = {
        firstName,
        lastName,
        email: updatedStudent.email,
        contactNumber: updatedStudent.phone,
        qualification: updatedStudent.qualification,
        yearOfPassing: Number(updatedStudent.graduationYear),
        courseId: courseObj?._id || courseObj?.id,
        batchId: batchObj?._id || batchObj?.id,
        universityName: updatedStudent.universityName,
        mbbsQualification: updatedStudent.mbbsQualification,
        medicalCouncilRegistrationNumber: updatedStudent.medicalCouncilRegistrationNumber,
        fmgeClearanceStatus: updatedStudent.fmgeClearanceStatus,
        isForeignGraduate: updatedStudent.isForeignGraduate,
        homeAddress: updatedStudent.homeAddress,
        courseDirector: updatedStudent.courseDirector,
        utrNumber: updatedStudent.utrNumber,
      };

      await academicService.updateStudent(updatedStudent._id || updatedStudent.id, payload);

      // If attendance or thesis was provided, also update academic metrics
      if (updatedStudent.attendancePercentage !== undefined || updatedStudent.thesisDocument) {
        const metricsPayload = {
          attendancePercentage: Number(updatedStudent.attendancePercentage) || 0,
          thesisApproved: updatedStudent.thesisApproved || false
        };
        if (updatedStudent.thesisDocument) {
          metricsPayload.thesisDocument = updatedStudent.thesisDocument;
        }
        await academicService.updateAcademicMetrics(updatedStudent._id || updatedStudent.id, metricsPayload);
      }

      await fetchERPData();
      setSuccessBanner(`🎉 Fellow "${updatedStudent.fullName}" profile updated successfully!`);
    } catch (err) {
      console.error('Update student error:', err);
      setErrorBanner(err.parsedMessage || err.message || 'Failed to update fellow details.');
    }
  }, [courses, batches, fetchERPData]);

  const deleteCourse = useCallback((id) => {
    setConfirmConfig({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setConfirmConfig(null);
        const updated = courses.filter(c => c.id !== id);
        setCourses(updated);
        localStorage.setItem('semi_courses', JSON.stringify(updated));
        setSuccessBanner('Course deleted successfully.');
      }
    });
  }, [courses]);

  const handleUpdateBatch = useCallback(async (batchId, batchData) => {
    try {
      await academicService.updateBatch(batchId, batchData);
      await fetchERPData();
      setSuccessBanner('🎉 Batch updated successfully!');
    } catch (err) {
      console.error('Update batch error:', err);
      setErrorBanner(err.parsedMessage || err.message || 'Failed to update batch.');
    }
  }, [fetchERPData]);

  const handleDeleteBatch = useCallback((id) => {
    setConfirmConfig({
      title: 'Delete Batch',
      message: 'Are you sure you want to delete this batch? All associated records will remain but the batch will be de-listed.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await academicService.deleteBatch(id);
          await fetchERPData();
          setSuccessBanner('Batch deleted successfully.');
        } catch (err) {
          console.error('Delete batch error:', err);
          setErrorBanner(err.parsedMessage || err.message || 'Failed to delete batch.');
        }
      }
    });
  }, [fetchERPData]);

  const saveToLocalStorage = (updatedUser, updatedForm, updatedDocs, updatedPayment, updatedRecord, wizardStep) => {
    if (updatedUser) {
      localStorage.setItem('semi_user', JSON.stringify(updatedUser));
    }

    const appData = {
      form: updatedForm || appForm,
      uploadedDocs: updatedDocs || uploadedDocs,
      paymentComplete: updatedPayment !== undefined ? updatedPayment : paymentComplete,
      paymentDetails: updatedPayment ? paymentDetails : null,
      record: updatedRecord || applicationRecord,
      activeWizardStep: wizardStep !== undefined ? wizardStep : activeWizardStep
    };
    localStorage.setItem('semi_institute_data', JSON.stringify(appData));
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.clear();
    setCurrentStep('login');
  }, [setCurrentStep]);

  // ─── ERP CONTENT RENDERER ─────────────────────────────────────────────────────
  const renderERPContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <InstituteERPDashboard 
            user={user}
            appForm={appForm}
            activeStudentCount={activeStudentCount}
            courses={courses}
            batches={batches}
            students={students}
          />
        );
      case 'courses':
        return (
         <InstituteERPCourses 
      courses={courses}
      setCourses={setCourses}  // ← ADD THIS
      courseForm={courseForm}
      setCourseForm={setCourseForm}
      courseSearch={courseSearch}
      setCourseSearch={setCourseSearch}
      handleCreateCourse={handleCreateCourse}
      deleteCourse={deleteCourse}  // This can be removed or kept as fallback
    />
        );
      case 'batches':
        return (
          <InstituteERPBatches 
            batches={batches}
            courses={courses}
            newBatch={newBatch}
            setNewBatch={setNewBatch}
            handleCreateBatch={handleCreateBatch}
            handleUpdateBatch={handleUpdateBatch}
            handleDeleteBatch={handleDeleteBatch}
          />
        );
      case 'enrollment':
        return (
          <InstituteERPEnrollment 
            enrollForm={enrollForm}
            setEnrollForm={setEnrollForm}
            enrollDocs={enrollDocs}
            setEnrollDocs={setEnrollDocs}
            enrollProgress={enrollProgress}
            courses={courses}
            batches={batches}
            user={user}
            appForm={appForm}
            handleEnrollmentSubmit={handleEnrollmentSubmit}
            handleEnrollDocUpload={handleEnrollDocUpload}
            removeEnrollDoc={removeEnrollDoc}
          />
        );
      case 'students':
        return (
          <InstituteERPStudents 
            students={students}
            studentSearch={studentSearch}
            setStudentSearch={setStudentSearch}
            studentFilter={studentFilter}
            setStudentFilter={setStudentFilter}
            selectedStudentFilterBatch={selectedStudentFilterBatch}
            setSelectedStudentFilterBatch={setSelectedStudentFilterBatch}
            selectedStudentFilterCourse={selectedStudentFilterCourse}
            setSelectedStudentFilterCourse={setSelectedStudentFilterCourse}
            removeStudent={removeStudent}
            onUpdateStudent={updateStudent}
            courses={courses}
            batches={batches}
            setActiveTab={setActiveTab}
          />
        );
      case 'fees':
        return (
          <InstituteERPFees 
            students={students}
            courses={courses}
          />
        );
      case 'exams':
        return (
          <InstituteERPExams 
            courses={courses}
            batches={batches}
            students={students}
            examApplications={examApplications}
            setExamApplications={setExamApplications}
            fetchERPData={fetchERPData}
          />
        );
      case 'hallTicket':
        return (
          <InstituteERPHallTicket
            courses={courses}
            batches={batches}
            students={students}
            examApplications={examApplications}
            fetchERPData={fetchERPData}
            user={user}
          />
        );
      case 'studentDetails':
        return (
          <InstituteERPStudentDetails 
            students={students}
            fetchERPData={fetchERPData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <InstitutionalLayout portalType="institute" hideHeaderFooter={currentStep === 'active_erp'}>
      <div className={currentStep === 'active_erp' ? "w-full min-h-screen flex flex-col bg-[#f8fafc]" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col justify-center w-full"}>
        {errorBanner && (
          <Toast message={errorBanner} type="error" onClose={() => setErrorBanner(null)} />
        )}
        {successBanner && (
          <Toast message={successBanner} type="success" onClose={() => setSuccessBanner(null)} />
        )}

        {currentStep === 'welcome' && (
          <WelcomeLanding setCurrentStep={setCurrentStep} />
        )}

        {currentStep === 'register' && (
          <InstituteSignup 
            regForm={regForm} 
            setRegForm={setRegForm} 
            handleRegisterSubmit={handleRegisterSubmit} 
            setCurrentStep={setCurrentStep} 
          />
        )}

        {currentStep === 'verify_pending' && (
          <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center">
            {user?.emailVerified ? (
              <div className="animate-fadeIn">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-100">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Credentials Activated!</h2>
                <p className="text-sm font-bold text-green-600 uppercase tracking-widest mt-2">Email Verified Successfully</p>
                <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto leading-relaxed">
                  Your institutional account is now fully validated. You can now access the SEMI fellowship onboarding platform.
                </p>
                <div className="mt-8 max-w-md mx-auto">
                  <button 
                    onClick={() => {
                      setSuccessBanner(null);
                      setUser(null);
                      localStorage.removeItem('semi_user');
                      setCurrentStep('login');
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md transition-all text-sm uppercase tracking-wider"
                  >
                    Proceed to Login
                  </button>
                </div>
              </div>
            ) : (
              <EmailVerificationSimulator user={user} handleVerifyEmail={handleVerifyEmail} />
            )}
          </div>
        )}

        {currentStep === 'login' && (
          <InstituteLogin 
            loginForm={loginForm} 
            setLoginForm={setLoginForm} 
            handleLoginSubmit={handleLoginSubmit} 
            setCurrentStep={setCurrentStep} 
          />
        )}

        {currentStep === 'forgot_password' && (
          <ForgotPassword 
            setCurrentStep={setCurrentStep} 
            setErrorBanner={setErrorBanner} 
            setSuccessBanner={setSuccessBanner} 
          />
        )}

        {currentStep === 'reset_password' && (
          <ResetPassword 
            setCurrentStep={setCurrentStep} 
            setErrorBanner={setErrorBanner} 
            setSuccessBanner={setSuccessBanner} 
          />
        )}

        {currentStep === 'onboarding_form' && (
          <div className="max-w-5xl mx-auto w-full bg-white rounded-3xl border border-gray-150 shadow-sm p-6 sm:p-10 text-left animate-fadeIn">
            <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Institute Fellowship Application</h2>
                <p className="text-xs uppercase font-extrabold tracking-widest text-blue-600 mt-1">Institutional Onboarding</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 shadow-md flex flex-col items-center">
                  <span className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wide">Inspection Fee</span>
                  <span className="text-lg font-black tracking-tight">₹2,50,000</span>
                </div>
                <button 
                  onClick={handleLogout}
                  type="button"
                  className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold rounded-xl transition-all text-xs uppercase"
                >
                  Logout
                </button>
              </div>
            </div>

            <OnboardingWizard 
              activeWizardStep={activeWizardStep}
              setActiveWizardStep={handleWizardStepChange}
              appForm={appForm}
              setAppForm={setAppForm}
              uploadedDocs={uploadedDocs}
              setUploadedDocs={setUploadedDocs}
              uploadProgress={uploadProgress}
              setUploadProgress={setUploadProgress}
              paymentComplete={paymentComplete}
              setPaymentComplete={setPaymentComplete}
              paymentDetails={paymentDetails}
              setPaymentDetails={setPaymentDetails}
              validateWizardStep={validateWizardStep}
              setErrorBanner={setErrorBanner}
              saveToLocalStorage={saveToLocalStorage}
              user={user}
              applicationRecord={applicationRecord}
              handleWizardNext={handleWizardNext}
              handleWizardBack={handleWizardBack}
              handleApplicationSubmit={handleApplicationSubmit}
              handlePaymentInitiate={handlePaymentInitiate}
              paymentProcessing={paymentProcessing}
            />
          </div>
        )}

        {currentStep === 'pending_review' && (
          <ApplicationStatusPending 
            applicationRecord={applicationRecord}
            appForm={appForm}
            uploadedDocs={uploadedDocs}
            loadApplicationFromStorage={loadApplicationFromStorage}
            saveToLocalStorage={saveToLocalStorage}
            setApplicationRecord={setApplicationRecord}
            setCurrentStep={setCurrentStep}
            handleLogout={handleLogout}
          />
        )}

        {currentStep === 'active_erp' && (
          <div className="w-full flex-grow flex">
            <InstituteERPSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              handleLogout={handleLogout} 
              user={user}
              setErrorBanner={setErrorBanner}
              setSuccessBanner={setSuccessBanner}
            />

            <div className="flex-1 flex flex-col min-w-0">
              <InstituteERPHeader 
                activeTab={activeTab}
                user={user} 
                appForm={appForm} 
                handleLogout={handleLogout} 
              />

              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderERPContent()}
              </main>
            </div>
          </div>
        )}
        {confirmConfig && (
          <ConfirmModal
            isOpen={true}
            title={confirmConfig.title}
            message={confirmConfig.message}
            type={confirmConfig.type}
            confirmText={confirmConfig.confirmText}
            cancelText={confirmConfig.cancelText}
            onConfirm={confirmConfig.onConfirm}
            onCancel={confirmConfig.onCancel || (() => setConfirmConfig(null))}
          />
        )}
      </div>
    </InstitutionalLayout>
  );
};

export default InstitutePortal;