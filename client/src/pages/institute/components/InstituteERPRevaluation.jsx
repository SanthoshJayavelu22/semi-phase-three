import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  TrendingUp,
  Minus,
  AlertCircle,
  CreditCard,
  RefreshCw,
  X,
  Check,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckSquare,
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import revaluationService from '../../../api/revaluation';
import academicService from '../../../api/academic';
import { PaymentStatusChecker } from '../../../Components/PaymentStatusChecker';
import { initiateRazorpayPayment, getPaymentState, clearPaymentState } from '../../../utils/razorpay';

const InstituteERPRevaluation = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState({});
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [showPaymentChecker, setShowPaymentChecker] = useState(false);
  const [currentPaymentStudent, setCurrentPaymentStudent] = useState(null);
  const [processingStudentId, setProcessingStudentId] = useState(null);
  const [singleStudentMode, setSingleStudentMode] = useState(false);
  const [selectedSingleStudent, setSelectedSingleStudent] = useState(null);
  const itemsPerPage = 10;

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [coursesRes, batchesRes, summaryRes] = await Promise.all([
        academicService.getCourses().catch(() => ({ data: { data: [] } })),
        academicService.getBatches().catch(() => ({ data: { data: [] } })),
        revaluationService.getInstituteSummary().catch(() => ({ data: { data: {} } })),
      ]);

      const coursesData = coursesRes.data?.data || coursesRes.data || [];
      const batchesData = batchesRes.data?.data || batchesRes.data || [];
      const summaryData = summaryRes.data?.data || summaryRes.data || {};

      setCourses(coursesData);
      setBatches(batchesData);
      setSummary(summaryData);

      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0]._id || coursesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  const fetchRequests = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (!token) return;
    try {
      const params = { limit: 10000 };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      if (selectedCourse) params.courseId = selectedCourse;
      if (selectedBatch) params.batchId = selectedBatch;

      const res = await revaluationService.getAllRevaluationRequests(params);
      const data = res.data?.data || res.data || {};
      const list = data.requests || data.results || data;
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setToast({ message: err.parsedMessage || 'Failed to load revaluation requests', type: 'error' });
    }
  }, [statusFilter, searchQuery, selectedCourse, selectedBatch]);

  const fetchEligibleStudents = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (!token) return;
    try {
      const res = await revaluationService.getEligibleStudents({
        courseId: selectedCourse,
        batchId: selectedBatch,
        semester: selectedSemester,
      });
      const data = res.data?.data || res.data || [];

      // Initialize selectedSubjects for all students with empty sets
      const initialSubjects = {};
      data.forEach((student) => {
        initialSubjects[student.studentId] = new Set();
      });

      setEligibleStudents(Array.isArray(data) ? data : []);
      setSelectedSubjects(initialSubjects);
      setExpandedStudent(null);
      setSelectedSingleStudent(null);
      setSingleStudentMode(false);
    } catch (err) {
      console.error('Error fetching eligible students:', err);
      setToast({ message: err.parsedMessage || 'Failed to load eligible students', type: 'error' });
      setEligibleStudents([]);
    }
  }, [selectedCourse, selectedBatch, selectedSemester]);

  const fetchSingleStudentEligibility = useCallback(async (studentId) => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (!token) return;
    try {
      const res = await revaluationService.getSingleStudentEligibility(studentId, {
        semester: selectedSemester,
      });
      const data = res.data?.data || res.data;
      if (data) {
        setSelectedSingleStudent(data);
        setSingleStudentMode(true);
        // Initialize subjects for this student
        setSelectedSubjects({
          [data.studentId]: new Set(),
        });
      }
    } catch (err) {
      console.error('Error fetching student eligibility:', err);
      setToast({ message: err.parsedMessage || 'Failed to load student eligibility', type: 'error' });
    }
  }, [selectedSemester]);

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(), 400);
    return () => clearTimeout(timer);
  }, [statusFilter, searchQuery, selectedCourse, selectedBatch, fetchRequests]);

  useEffect(() => {
    if (!selectedCourse || !selectedBatch || !selectedSemester) return;
    const timer = setTimeout(() => fetchEligibleStudents(), 0);
    return () => clearTimeout(timer);
  }, [selectedCourse, selectedBatch, selectedSemester, fetchEligibleStudents]);

  // ─── Payment Recovery ──────────────────────────────────────────────────────
  useEffect(() => {
    const recoverPayment = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
      if (!token) return;
      const pendingState = getPaymentState();
      if (pendingState && pendingState.paymentType === 'revaluation' && pendingState.additionalData?.studentId) {
        try {
          const res = await revaluationService.getPaymentStatus(
            pendingState.additionalData.studentId,
            pendingState.additionalData.semester
          );
          const data = res.data?.data || res.data;
          if (data && data.paymentStatus === 'Completed') {
            clearPaymentState();
            setToast({ message: 'Payment recovered successfully!', type: 'success' });
            await fetchEligibleStudents();
          } else {
            setShowPaymentChecker(true);
          }
        } catch (err) {
          console.warn('Failed to check pending revaluation payment:', err);
        }
      }
    };
    recoverPayment();
  }, [fetchEligibleStudents]);

  // ─── Computed Values ──────────────────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    if (!selectedCourse) return batches;
    return batches.filter((b) => {
      const courseId = b.course?._id || b.course || b.courseId;
      return String(courseId) === String(selectedCourse);
    });
  }, [batches, selectedCourse]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];
    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const student = r.student;
        const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase() : '';
        const enrollmentId = student?.enrollmentId?.toLowerCase() || '';
        return name.includes(q) || enrollmentId.includes(q) || (r.requestId || '').toLowerCase().includes(q);
      });
    }
    return filtered;
  }, [requests, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // ─── Subject Selection Handlers ──────────────────────────────────────────
  const toggleSubject = (studentId, subjectCode) => {
    setSelectedSubjects((prev) => {
      const studentSubjects = prev[studentId] || new Set();
      const newSet = new Set(studentSubjects);
      if (newSet.has(subjectCode)) {
        newSet.delete(subjectCode);
      } else {
        newSet.add(subjectCode);
      }
      const updated = { ...prev, [studentId]: newSet };
      if (newSet.size === 0) {
        delete updated[studentId];
      }
      return updated;
    });
  };

  const toggleAllSubjectsForStudent = (studentId, allSubjects) => {
    setSelectedSubjects((prev) => {
      const eligibleSubjectCodes = allSubjects
        .filter((s) => s.isEligible !== false)
        .map((s) => s.subjectCode);
      const current = prev[studentId] || new Set();
      const allSelected = eligibleSubjectCodes.every((code) => current.has(code));

      const newSet = new Set(current);
      if (allSelected) {
        eligibleSubjectCodes.forEach((code) => newSet.delete(code));
      } else {
        eligibleSubjectCodes.forEach((code) => newSet.add(code));
      }
      const updated = { ...prev, [studentId]: newSet };
      if (newSet.size === 0) {
        delete updated[studentId];
      }
      return updated;
    });
  };

  // ─── Fee Calculation ─────────────────────────────────────────────────────
  const getStudentTotalFee = (studentId) => {
    const student = eligibleStudents.find((s) => s.studentId === studentId);
    if (!student) return 0;
    const selectedCodes = selectedSubjects[studentId] || new Set();
    return selectedCodes.size * (student.feePerSubject || 500);
  };

  // ─── Payment Handlers ─────────────────────────────────────────────────────
  const handlePaymentInitiate = async (studentId) => {
    const student = eligibleStudents.find((s) => s.studentId === studentId);
    if (!student) {
      setToast({ message: 'Student not found', type: 'error' });
      return;
    }

    const selectedCodes = selectedSubjects[studentId] || new Set();
    const selectedSubjectDetails = (student.allSubjects || student.subjects || [])
      .filter((s) => selectedCodes.has(s.subjectCode));

    if (selectedSubjectDetails.length === 0) {
      setToast({ message: 'Please select at least one subject for this student.', type: 'warning' });
      return;
    }

    const totalFee = selectedSubjectDetails.length * (student.feePerSubject || 500);
    setCurrentPaymentStudent(studentId);
    setProcessingStudentId(studentId);
    setIsPaymentProcessing(true);

    try {
      const orderRes = await revaluationService.createRazorpayOrder({
        studentId: studentId,
        semester: student.semester,
        totalFee: totalFee,
        requestId: 'pending',
        subjects: selectedSubjectDetails,
      });

      const orderData = orderRes?.data?.data || orderRes?.data || orderRes;
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order from server.');
      }

      await initiateRazorpayPayment({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        name: 'SEMI Revaluation Fee',
        description: `Revaluation - ${student.name} (Sem ${student.semester})`,
        paymentType: 'revaluation',
        additionalData: {
          studentId: studentId,
          semester: student.semester,
          purpose: 'Revaluation fee',
        },
        prefill: {
          name: student.name,
          email: '',
        },
        onSuccess: async (response) => {
          try {
            setToast({ message: '✅ Payment successful! Verifying...', type: 'info' });

            const subjectsData = selectedSubjectDetails.map((s) => ({
              subjectCode: s.subjectCode,
              subjectName: s.subjectName,
              originalMarks: s.originalMarks || 0,
              originalGrade: s.originalGrade || 'F',
              internalMarks: s.internalMarks || 0,
              externalMarks: s.externalMarks || 0,
              revaluationReason: s.revaluationReason || 'Requesting revaluation of answer script',
            }));

            const verifyRes = await revaluationService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId: studentId,
              semester: student.semester,
              subjects: subjectsData,
              academicYear: student.academicYear,
              instituteId: student.instituteId,
              resultId: student.resultId,
              feePerSubject: student.feePerSubject || 500,
              totalFee: totalFee,
            });

            const verifyData = verifyRes.data?.data || verifyRes.data;
            if (verifyData && verifyData.paymentStatus === 'Completed') {
              clearPaymentState();
              setToast({
                message: `✅ Revaluation request submitted for ${student.name}!`,
                type: 'success',
              });

              await fetchEligibleStudents();
              await fetchRequests();

              setSelectedSingleStudent(null);
              setSingleStudentMode(false);
              setProcessingStudentId(null);
              setCurrentPaymentStudent(null);
              setIsPaymentProcessing(false);
            } else {
              setToast({ message: 'Payment succeeded but verification is pending.', type: 'warning' });
              setShowPaymentChecker(true);
            }
          } catch (verifyErr) {
            console.error('Verification failed:', verifyErr);
            const statusRes = await revaluationService.getPaymentStatus(studentId, student.semester);
            const statusData = statusRes.data?.data || statusRes.data;
            if (statusData && statusData.paymentStatus === 'Completed') {
              clearPaymentState();
              setToast({ message: 'Payment verified!', type: 'success' });
              await fetchEligibleStudents();
              await fetchRequests();
              setSelectedSingleStudent(null);
              setSingleStudentMode(false);
            } else {
              setToast({ message: 'Payment processed but verification failed. Please contact support.', type: 'error' });
            }
            setProcessingStudentId(null);
            setCurrentPaymentStudent(null);
            setIsPaymentProcessing(false);
          }
        },
        onDismiss: () => {
          setIsPaymentProcessing(false);
          setCurrentPaymentStudent(null);
          setProcessingStudentId(null);
          setShowPaymentChecker(true);
          setToast({ message: 'Payment window closed. Checking your payment status...', type: 'info' });
        },
        onFailure: (error) => {
          setIsPaymentProcessing(false);
          setCurrentPaymentStudent(null);
          setProcessingStudentId(null);
          setShowPaymentChecker(true);
          setToast({
            message: `Payment failed: ${error?.description || 'Transaction unsuccessful.'}`,
            type: 'error',
          });
        },
      });
    } catch (err) {
      console.error('Payment initiation failed:', err);
      setIsPaymentProcessing(false);
      setCurrentPaymentStudent(null);
      setProcessingStudentId(null);
      setToast({
        message: err?.parsedMessage || err?.message || 'Failed to initiate payment.',
        type: 'error',
      });
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedBatch('');
    setSelectedSubjects({});
    setEligibleStudents([]);
    setSelectedSingleStudent(null);
    setSingleStudentMode(false);
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
    setSelectedSubjects({});
    setEligibleStudents([]);
    setSelectedSingleStudent(null);
    setSingleStudentMode(false);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSelectedSubjects({});
    setEligibleStudents([]);
    setSelectedSingleStudent(null);
    setSingleStudentMode(false);
  };

  const handleViewStudentEligibility = async (student) => {
    await fetchSingleStudentEligibility(student.studentId);
  };

  const handleExitSingleStudentMode = () => {
    setSingleStudentMode(false);
    setSelectedSingleStudent(null);
    setSelectedSubjects({});
    setExpandedStudent(null);
    // Re-fetch to reset subjects
    fetchEligibleStudents();
  };

  const handleViewRequest = (request) => {
    setViewingRequest(request);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchData();
    fetchRequests();
    if (singleStudentMode && selectedSingleStudent) {
      fetchSingleStudentEligibility(selectedSingleStudent.studentId);
    } else {
      fetchEligibleStudents();
    }
    setToast({ message: 'Data refreshed!', type: 'success' });
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const map = {
      PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
      UNDER_REVIEW: { label: 'Under Review', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
      ASSIGNED: { label: 'Assigned', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <UserCheck className="w-3.5 h-3.5" /> },
      IN_PROGRESS: { label: 'In Progress', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" /> },
      COMPLETED: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
      REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: <XCircle className="w-3.5 h-3.5" /> },
      CANCELLED: { label: 'Cancelled', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: <X className="w-3.5 h-3.5" /> },
    };
    return map[status] || map.PENDING;
  };

  const getSubjectStatusBadge = (subject) => {
    const marks = subject.originalMarks || 0;
    const grade = subject.originalGrade || 'F';

    if (grade === 'ABSENT') {
      return { label: 'ABSENT', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle className="w-3 h-3 text-slate-400" /> };
    }
    if (marks >= 40) {
      return { label: 'PASS', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" /> };
    }
    return { label: 'FAIL', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <AlertCircle className="w-3 h-3 text-rose-500" /> };
  };

  const getResultBadge = (finalResult) => {
    if (finalResult === 'CHANGED') {
      return { label: 'Marks Changed', color: 'text-emerald-600', icon: <TrendingUp className="w-4 h-4" /> };
    }
    if (finalResult === 'UNCHANGED') {
      return { label: 'No Change', color: 'text-amber-600', icon: <Minus className="w-4 h-4" /> };
    }
    return { label: 'Pending', color: 'text-slate-400', icon: <Clock className="w-4 h-4" /> };
  };

  // ─── Render Single Student Mode ──────────────────────────────────────────
  const renderSingleStudent = () => {
    if (!selectedSingleStudent) return null;

    const student = selectedSingleStudent;
    const selectedCodes = selectedSubjects[student.studentId] || new Set();
    const selectedCount = selectedCodes.size;
    const totalFee = selectedCount * (student.feePerSubject || 500);
    const allSubjects = student.allSubjects || [];
    const eligibleSubjects = student.subjects || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleExitSingleStudentMode}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to all students
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold">{student.name}</span>
            <span className="text-slate-400">•</span>
            <span className="font-mono">{student.enrollmentId}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-black">
                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">{student.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{student.enrollmentId} • Sem {student.semester}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Selected Subjects</span>
              <span className="text-xl font-black text-blue-600">{selectedCount}/{eligibleSubjects.length}</span>
            </div>
          </div>

          {/* Subject Selection */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                Select Subjects for Revaluation
              </span>
              <button
                onClick={() => toggleAllSubjectsForStudent(student.studentId, allSubjects)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {selectedCount === eligibleSubjects.length && eligibleSubjects.length > 0 ? (
                  <>Deselect All</>
                ) : (
                  <><CheckSquare className="w-3 h-3" /> Select All Eligible</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allSubjects.map((subject) => {
                const isEligible = subject.isEligible !== false;
                const isSelected = selectedCodes.has(subject.subjectCode);
                const status = getSubjectStatusBadge(subject);
                const marks = subject.originalMarks || 0;

                return (
                  <div
                    key={subject.subjectCode}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/60 shadow-sm'
                        : isEligible
                        ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        : 'border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <button
                      onClick={() => toggleSubject(student.studentId, subject.subjectCode)}
                      disabled={!isEligible}
                      className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : isEligible
                          ? 'border-slate-300 hover:border-blue-400 bg-white'
                          : 'border-slate-200 bg-slate-100 cursor-not-allowed'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isEligible ? 'text-slate-800' : 'text-slate-400'}`}>
                          {subject.subjectName}
                        </span>
                        <span className="text-[8px] font-mono text-slate-400 flex-shrink-0">
                          {subject.subjectCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold ${
                        marks >= 40 ? 'text-emerald-600' : marks >= 35 ? 'text-amber-600' : 'text-rose-600'
                      } ${!isEligible ? 'opacity-50' : ''}`}>
                        {marks}%
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black border ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {eligibleSubjects.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">No eligible subjects found for revaluation.</p>
                <p className="text-xs mt-1">All subjects are either absent or not eligible.</p>
              </div>
            )}
          </div>

          {/* Payment Button */}
          {eligibleSubjects.length > 0 && selectedCount > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Fee</span>
                <span className="text-xl font-black text-slate-800">₹{totalFee.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 ml-2">({selectedCount} subject{selectedCount > 1 ? 's' : ''})</span>
              </div>
              <button
                onClick={() => handlePaymentInitiate(student.studentId)}
                disabled={isPaymentProcessing && processingStudentId === student.studentId}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {isPaymentProcessing && processingStudentId === student.studentId ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...</>
                ) : (
                  <><CreditCard className="w-4 h-4" /> Pay & Submit</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render Student Cards (Multi-Student Mode) ──────────────────────────
  const renderStudentCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {eligibleStudents.map((student) => {
        const allSubjects = student.allSubjects || student.subjects || [];
        const eligibleSubjects = allSubjects.filter((s) => s.isEligible !== false);
        const selectedCount = (selectedSubjects[student.studentId] || new Set()).size;
        const totalEligible = eligibleSubjects.length;
        const isExpanded = expandedStudent === student.studentId;
        const hasAbsentSubjects = allSubjects.some((s) => !s.isEligible);
        const hasPendingPayment = student.hasPendingPayment;
        const totalFee = selectedCount * (student.feePerSubject || 500);
        const hasSubjectsSelected = selectedCount > 0;

        return (
          <div
            key={student.studentId}
            className={`group rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
              hasSubjectsSelected
                ? 'border-blue-400 bg-blue-50/30 shadow-lg shadow-blue-500/10'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            } ${isExpanded ? 'shadow-xl' : ''}`}
          >
            {/* Card Header */}
            <div
              className={`p-4 cursor-pointer transition-colors ${
                hasSubjectsSelected ? 'hover:bg-blue-50/40' : 'hover:bg-slate-50/60'
              }`}
              onClick={() => setExpandedStudent(isExpanded ? null : student.studentId)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar & Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm flex-shrink-0 ${
                      hasSubjectsSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
                    }`}>
                      {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-black truncate ${hasSubjectsSelected ? 'text-blue-800' : 'text-slate-800'}`}>
                        {student.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400">{student.enrollmentId}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-medium text-slate-500">Sem {student.semester}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Chip & Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewStudentEligibility(student);
                    }}
                    className="px-2 py-1 text-[9px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1" />
                    View
                  </button>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-700">
                      {selectedCount}/{totalEligible}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">selected</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedStudent(isExpanded ? null : student.studentId);
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isExpanded
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick subject status pills - shows which subjects are selected */}
              <div className="flex flex-wrap gap-1.5 mt-3 ml-0">
                {allSubjects.slice(0, 6).map((subject) => {
                  const status = getSubjectStatusBadge(subject);
                  const isSelected = (selectedSubjects[student.studentId] || new Set()).has(subject.subjectCode);
                  const isEligible = subject.isEligible !== false;

                  if (!isEligible) {
                    return (
                      <span
                        key={subject.subjectCode}
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold border ${status.color}`}
                      >
                        {subject.subjectName.substring(0, 4)}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={subject.subjectCode}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSubject(student.studentId, subject.subjectCode);
                      }}
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subject.subjectName.substring(0, 4)}
                      {isSelected && <Check className="w-2 h-2 ml-0.5" />}
                    </button>
                  );
                })}
                {allSubjects.length > 6 && (
                  <span className="text-[8px] text-slate-400 font-bold px-1.5 py-0.5">
                    +{allSubjects.length - 6} more
                  </span>
                )}
              </div>

              {/* Payment status indicator */}
              <div className="mt-2 flex items-center gap-3">
                {hasPendingPayment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid
                  </span>
                )}
                {hasSubjectsSelected && !hasPendingPayment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-bold border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {selectedCount} subject{selectedCount > 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Subject Details */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">
                      All Subjects — Click any subject to toggle selection
                    </span>
                    {hasAbsentSubjects && (
                      <span className="text-[8px] text-slate-400 font-medium bg-slate-200/50 px-2 py-0.5 rounded-full">
                        Absent disabled
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllSubjectsForStudent(student.studentId, allSubjects);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {selectedCount === totalEligible && totalEligible > 0 ? (
                      <>Deselect All</>
                    ) : (
                      <><CheckSquare className="w-3 h-3" /> Select All Eligible</>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allSubjects.map((subject) => {
                    const isEligible = subject.isEligible !== false;
                    const isSelected = (selectedSubjects[student.studentId] || new Set()).has(subject.subjectCode);
                    const status = getSubjectStatusBadge(subject);
                    const marks = subject.originalMarks || 0;

                    return (
                      <div
                        key={subject.subjectCode}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50/60 shadow-sm'
                            : isEligible
                            ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                            : 'border-slate-200 bg-slate-50/50 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (isEligible) {
                            toggleSubject(student.studentId, subject.subjectCode);
                          }
                        }}
                      >
                        <button
                          disabled={!isEligible}
                          className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : isEligible
                              ? 'border-slate-300 hover:border-blue-400 bg-white'
                              : 'border-slate-200 bg-slate-100 cursor-not-allowed'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold truncate ${isEligible ? 'text-slate-800' : 'text-slate-400'}`}>
                              {subject.subjectName}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 flex-shrink-0">
                              {subject.subjectCode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold ${
                            marks >= 40 ? 'text-emerald-600' : marks >= 35 ? 'text-amber-600' : 'text-rose-600'
                          } ${!isEligible ? 'opacity-50' : ''}`}>
                            {marks}%
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black border ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2.5">
                  <span>
                    {totalEligible} eligible · {allSubjects.length - totalEligible} absent (disabled)
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    ₹{totalFee.toLocaleString()} fee
                  </span>
                </div>

                {/* Payment Button - always visible when subjects are selected */}
                {selectedCount > 0 && !hasPendingPayment && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => handlePaymentInitiate(student.studentId)}
                      disabled={isPaymentProcessing && processingStudentId === student.studentId}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
                      {isPaymentProcessing && processingStudentId === student.studentId ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...</>
                      ) : (
                        <><CreditCard className="w-4 h-4" /> Pay & Submit for {student.name} (₹{totalFee.toLocaleString()})</>
                      )}
                    </button>
                  </div>
                )}

                {hasPendingPayment && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-center text-emerald-600 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    Payment already completed for this student
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-4 font-medium">Loading revaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Revaluation</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Click any subject to select, then pay per student via Razorpay
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary && (
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div className="text-center">
                <span className="text-[8px] uppercase font-black text-slate-400 block">Pending</span>
                <span className="text-sm font-black text-amber-600">{summary.pending || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] uppercase font-black text-slate-400 block">Completed</span>
                <span className="text-sm font-black text-emerald-600">{summary.completed || 0}</span>
              </div>
              <div className="text-center">
                <span className="text-[8px] uppercase font-black text-slate-400 block">Total</span>
                <span className="text-sm font-black text-blue-600">{summary.total || 0}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Payment Status Checker ─────────────────────────────────────────── */}
      {showPaymentChecker && (
        <PaymentStatusChecker
          isOpen={showPaymentChecker}
          paymentType="revaluation"
          message="Verifying your revaluation payment..."
          onComplete={() => {
            setShowPaymentChecker(false);
            setToast({ message: 'Payment verified successfully!', type: 'success' });
            if (singleStudentMode && selectedSingleStudent) {
              fetchSingleStudentEligibility(selectedSingleStudent.studentId);
            } else {
              fetchEligibleStudents();
            }
          }}
          onRetry={() => {
            setShowPaymentChecker(false);
            if (currentPaymentStudent) {
              handlePaymentInitiate(currentPaymentStudent);
            }
          }}
          onCancel={() => {
            setShowPaymentChecker(false);
            setIsPaymentProcessing(false);
            setCurrentPaymentStudent(null);
            setProcessingStudentId(null);
          }}
        />
      )}

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">
                {singleStudentMode ? 'Student Revaluation' : 'Select Students'}
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {singleStudentMode ? selectedSingleStudent?.name : `${eligibleStudents.length} eligible students`}
              </p>
            </div>
          </div>
          {singleStudentMode && (
            <button
              onClick={handleExitSingleStudentMode}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Exit Single View
            </button>
          )}
        </div>

        {/* Filter Bar (only show in multi-student mode) */}
        {!singleStudentMode && (
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  Course <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                >
                  {courses.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name || c.courseName}
                    </option>
                  ))}
                  {courses.length === 0 && <option value="">No courses available</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  Batch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBatch}
                  onChange={handleBatchChange}
                  disabled={!selectedCourse}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:border-slate-300"
                >
                  <option value="">Select Batch</option>
                  {filteredBatches.map((b) => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name || `Batch ${b.year}`}
                    </option>
                  ))}
                  {filteredBatches.length === 0 && <option value="">No batches available</option>}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSemester}
                  onChange={handleSemesterChange}
                  disabled={!selectedBatch}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:border-slate-300"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRefresh}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Load Students
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on mode */}
        {singleStudentMode ? (
          renderSingleStudent()
        ) : eligibleStudents.length > 0 ? (
          <>
            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{eligibleStudents.length} Students</h3>
                    <p className="text-xs text-blue-200 font-medium">with published results for this semester</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-2xl font-black">
                      {Object.values(selectedSubjects).reduce((sum, set) => sum + set.size, 0)}
                    </span>
                    <p className="text-[9px] text-blue-200 uppercase tracking-wider font-bold">Subjects Selected</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <span className="text-2xl font-black">
                      ₹{eligibleStudents.reduce((sum, s) => sum + getStudentTotalFee(s.studentId), 0).toLocaleString()}
                    </span>
                    <p className="text-[9px] text-blue-200 uppercase tracking-wider font-bold">Total Fee</p>
                  </div>
                </div>
              </div>
            </div>

            {renderStudentCards()}
          </>
        ) : selectedCourse && selectedBatch && selectedSemester ? (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 border-2 border-amber-200 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-amber-200">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-amber-800">No Students Found</h3>
            <p className="text-sm text-amber-600 mt-2 max-w-md mx-auto">
              No students with published results found for the selected batch and semester.
              Students must have published results to apply for revaluation.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/30 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-200">
              <Filter className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-600">Select Filters</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Choose a course, batch, and semester above to view students with published results.
            </p>
          </div>
        )}
      </div>

      {/* ─── Requests History ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Request History</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {filteredRequests.length} revaluation requests
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-48 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Request ID</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Student</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Subjects</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Fee</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {paginatedRequests.map((request, idx) => {
                const statusBadge = getStatusBadge(request.status);
                const resultBadge = getResultBadge(request.finalResult);
                const student = request.student;
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

                return (
                  <tr key={request._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                      {String(globalIdx).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-blue-600 block">
                        {request.requestId || request._id.toString().substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${resultBadge.color}`}>
                        {resultBadge.icon}
                        {resultBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {student?.enrollmentId || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      Sem {request.semester || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {request.subjects?.length || 0}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800">₹{request.totalFee?.toLocaleString() || 0}</span>
                        <span className={`text-[8px] font-bold uppercase ${request.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {request.paymentStatus === 'PAID' ? '✓ Paid' : request.paymentStatus || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusBadge.color}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleViewRequest(request)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No revaluation requests found</p>
                    <p className="text-xs text-slate-400 mt-1">Submit a request using the form above</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-semibold">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-blue-600 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Request Detail Modal ───────────────────────────────────────────── */}
      {isModalOpen && viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Revaluation Request Details</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewingRequest.requestId || viewingRequest._id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left">
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student</span>
                    <span className="text-slate-800 font-bold">
                      {viewingRequest.student ? `${viewingRequest.student.firstName || ''} ${viewingRequest.student.lastName || ''}`.trim() : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrollment ID</span>
                    <span className="text-slate-800 font-mono font-bold">{viewingRequest.student?.enrollmentId || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold">Semester {viewingRequest.semester || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Academic Year</span>
                    <span className="text-slate-800 font-bold">{viewingRequest.academicYear || 'N/A'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Status</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadge(viewingRequest.status).color}`}>
                      {getStatusBadge(viewingRequest.status).icon}
                      {getStatusBadge(viewingRequest.status).label}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Fee</span>
                    <span className="text-slate-800 font-bold">₹{viewingRequest.totalFee?.toLocaleString() || 0}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Payment Status</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${
                      viewingRequest.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      <CreditCard className="w-3.5 h-3.5" />
                      {viewingRequest.paymentStatus === 'PAID' ? 'Paid via Razorpay' : viewingRequest.paymentStatus || 'Pending'}
                    </span>
                    {viewingRequest.paymentId && (
                      <span className="text-[8px] text-slate-400 font-mono block">
                        Payment ID: {viewingRequest.paymentId}
                      </span>
                    )}
                    {viewingRequest.paymentOrderId && (
                      <span className="text-[8px] text-slate-400 font-mono block">
                        Order ID: {viewingRequest.paymentOrderId}
                      </span>
                    )}
                    {viewingRequest.paymentDate && (
                      <span className="text-[8px] text-slate-400 block">
                        Paid on: {new Date(viewingRequest.paymentDate).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject Details */}
              {viewingRequest.subjects && viewingRequest.subjects.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">Subjects for Revaluation</h4>
                  <div className="space-y-2">
                    {viewingRequest.subjects.map((subject, idx) => (
                      <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block">{subject.subjectName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{subject.subjectCode}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Original Marks</span>
                          <span className="text-sm font-black text-slate-700">{subject.originalMarks}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revaluation Results */}
              {viewingRequest.revaluationResults && viewingRequest.revaluationResults.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">Revaluation Results</h4>
                  <div className="space-y-2">
                    {viewingRequest.revaluationResults.map((result, idx) => (
                      <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block">{result.subjectName}</span>
                          <span className="text-[10px] text-slate-400">{result.subjectCode}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Original</span>
                            <span className="text-sm font-black text-slate-600">{result.originalMarks}%</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Revised</span>
                            <span className={`text-sm font-black ${result.marksChange > 0 ? 'text-emerald-600' : result.marksChange < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                              {result.revisedTotalMarks}%
                            </span>
                          </div>
                          <div className={`text-xs font-black px-2 py-1 rounded-lg ${
                            result.marksChange > 0 ? 'bg-emerald-100 text-emerald-700' :
                            result.marksChange < 0 ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {result.marksChange > 0 ? '+' : ''}{result.marksChange}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {viewingRequest.auditTrail && viewingRequest.auditTrail.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">Audit Trail</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {viewingRequest.auditTrail.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[10px] text-slate-600 border-b border-slate-50 pb-1.5">
                        <span className="font-black text-slate-400">{entry.action}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-slate-700">{entry.newStatus}</span>
                        <span className="text-slate-400 ml-auto">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal ─────────────────────────────────────────────── */}
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
};

export default InstituteERPRevaluation;
