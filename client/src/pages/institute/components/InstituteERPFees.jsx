import { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle2, ChevronLeft, ChevronRight, X, CreditCard, User, Loader2, FileText, ArrowRight, Check } from 'lucide-react';
import Toast from '../../../Components/Toast';
import { academicService } from '../../../api/academic';
import { initiateRazorpayPayment, getPaymentState, clearPaymentState } from '../../../utils/razorpay';
import { PaymentStatusChecker } from '../../../Components/PaymentStatusChecker';

const fmtCurrency = (val) =>
  Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtDate = (val) => {
  if (!val) return 'N/A';
  try { return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return val; }
};

const STEPS = [
  { num: 1, label: 'Select Student', icon: User },
  { num: 2, label: 'Choose Semester', icon: FileText },
  { num: 3, label: 'Enter Payment', icon: CreditCard },
  { num: 4, label: 'Review & Submit', icon: CheckCircle2 },
];

const InstituteERPFees = ({ students = [], courses = [] }) => {
  const [step, setStep] = useState(1);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [unpaidSemesters, setUnpaidSemesters] = useState([]);
  const [feeType, setFeeType] = useState('Examination fee');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewingTx, setViewingTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [showPaymentChecker, setShowPaymentChecker] = useState(false);
  const itemsPerPage = 8;

  const fetchFeeRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await academicService.getFeeRecords();
      const data = res?.data?.data || res?.data || [];
      if (Array.isArray(data)) setFeeRecords(data);
    } catch (err) {
      setToast({ message: err?.parsedMessage || err?.message || 'Failed to load fee records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (token) {
      setTimeout(() => fetchFeeRecords(), 0);
    }
  }, [fetchFeeRecords]);

  useEffect(() => {
    const checkPending = async () => {
      const pendingState = getPaymentState();
      if (pendingState && pendingState.paymentType === 'exam' && pendingState.additionalData?.studentId) {
        try {
          const res = await academicService.getPaymentStatus(pendingState.additionalData.studentId, 'Examination fee');
          const data = res?.data?.data || res?.data;
          if (data && data.paymentStatus === 'Completed') {
            clearPaymentState();
            setToast({ message: 'Payment recovered successfully!', type: 'success' });
            resetForm();
            await fetchFeeRecords();
          } else {
            setShowPaymentChecker(true);
          }
        } catch (err) {
          console.warn('Failed to check pending exam payment:', err);
        }
      }
    };
    checkPending();
  }, [fetchFeeRecords]);

  const resetForm = () => {
    setStep(1);
    setSelectedStudentId('');
    setSelectedSemester('');
    setAmount('');
    setFeeType('Examination fee');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const eligibleStudents = students;
  const selectedStudent = students.find(s => s._id === selectedStudentId || s.id === selectedStudentId);

  useEffect(() => {
    setTimeout(() => {
      if (!selectedStudentId) {
        setUnpaidSemesters([]);
        return;
      }
      const paidSemesters = feeRecords
        .filter(r => (r.student?._id === selectedStudentId || r.student?.id === selectedStudentId || r.student === selectedStudentId) && r.paymentPurpose === feeType)
        .map(r => Number(r.semesterNumber));
      const available = [1, 2, 3, 4, 5, 6]
        .filter(num => !paidSemesters.includes(num))
        .map(num => ({ semesterNumber: num }));
      setUnpaidSemesters(available);
      if (selectedSemester && paidSemesters.includes(Number(selectedSemester))) {
        setSelectedSemester('');
      }
    }, 0);
  }, [selectedStudentId, feeRecords, feeType, selectedSemester]);

  useEffect(() => {
    setTimeout(() => {
      if (selectedStudent && courses.length > 0) {
        const studentCourseName = selectedStudent.course || selectedStudent.courseName;
        const course = courses.find(c =>
          c.name === studentCourseName ||
          c.courseCode === studentCourseName ||
          c._id === selectedStudent.courseId
        );
        if (course && course.examinationFee) {
          setAmount(course.examinationFee.toString().replace(/,/g, ''));
        } else {
          setAmount('');
        }
      } else {
        setAmount('');
      }
    }, 0);
  }, [selectedStudent, courses]);

  const canProceedFrom = (s) => {
    if (s === 1) return !!selectedStudentId;
    if (s === 2) return !!selectedSemester;
    if (s === 3) {
      const parsedAmount = parseFloat(amount);
      return !isNaN(parsedAmount) && parsedAmount > 0 && !!paymentDate;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceedFrom(step)) {
      setToast({ message: 'Please fill all required fields before proceeding.', type: 'warning' });
      return;
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmitPayment = async () => {
    if (!selectedStudentId) {
      setToast({ message: 'Please select a student.', type: 'warning' });
      return;
    }
    if (!selectedSemester) {
      setToast({ message: 'Please select a semester.', type: 'warning' });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setToast({ message: 'Amount must be a positive number.', type: 'warning' });
      return;
    }
    if (!paymentDate) {
      setToast({ message: 'Payment Date is mandatory.', type: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      const orderRes = await academicService.createRazorpayOrder({ amount: 1, purpose: 'Fee Payment' });
      const orderData = orderRes?.data?.data || orderRes?.data || orderRes;
      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order from server.');
      }

      await initiateRazorpayPayment({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        name: 'Semi Phase 3 Student Fees',
        description: `Fee Payment - ${feeType}`,
        paymentType: 'exam',
        additionalData: { studentId: selectedStudentId, purpose: feeType, semester: selectedSemester },
        prefill: { name: selectedStudent?.fullName || '', email: selectedStudent?.email || '' },
        onSuccess: async (response) => {
          try {
            const verifyRes = await academicService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await academicService.payStudentFees(selectedStudentId, {
              semesterNumber: parseInt(selectedSemester),
              amount: parseFloat(amount),
              paymentMode: 'Razorpay Online',
              paymentDate,
              paymentPurpose: feeType,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearPaymentState();
            setToast({ message: 'Fee payment recorded successfully!', type: 'success' });
            resetForm();
            await fetchFeeRecords();
          } catch (verifyErr) {
            console.error('Verification failed', verifyErr);
            const statusRes = await academicService.getPaymentStatus(selectedStudentId, feeType);
            if (statusRes.data?.data?.paymentStatus === 'Completed') {
              clearPaymentState();
              setToast({ message: 'Payment verified successfully!', type: 'success' });
              await fetchFeeRecords();
            } else {
              setToast({ message: 'Payment processed but verification failed. Please contact support.', type: 'error' });
            }
          } finally {
            setSubmitting(false);
          }
        },
        onDismiss: () => {
          setSubmitting(false);
          setShowPaymentChecker(true);
          setToast({ message: 'Payment window closed. Checking your payment status...', type: 'info' });
        },
        onFailure: (error) => {
          setSubmitting(false);
          setShowPaymentChecker(true);
          setToast({ message: `Payment failed: ${error?.description || 'Transaction unsuccessful.'}`, type: 'error' });
        },
      });
    } catch (err) {
      const msg = err?.parsedMessage || err?.response?.data?.message || err?.message || 'Failed to record fee payment.';
      setToast({ message: msg, type: 'error' });
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(feeRecords.length / itemsPerPage) || 1;
  const paginatedRecords = feeRecords.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = step === s.num;
        const isCompleted = step > s.num;
        const isClickable = s.num < step;
        return (
          <div key={s.num} className="flex items-center">
            {idx > 0 && (
              <div className={`w-12 h-0.5 sm:w-20 ${isCompleted ? 'bg-blue-500' : 'bg-slate-200'}`} />
            )}
            <button
              type="button"
              onClick={() => isClickable && setStep(s.num)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                isActive ? 'scale-105' : ''
              } ${!isClickable ? 'opacity-60 cursor-default' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-sm ${
                isCompleted
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : isActive
                    ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                isActive || isCompleted ? 'text-blue-700' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" />
          Select Student
        </h3>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Choose the student for fee payment</p>
      </div>
      <div>
        <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student *</label>
        <select
          value={selectedStudentId}
          onChange={(e) => { setSelectedStudentId(e.target.value); setSelectedSemester(''); }}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          required
        >
          <option value="">Select Enrolled Student...</option>
          {eligibleStudents.map(s => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.enrollmentNo} — {s.fullName}
            </option>
          ))}
        </select>
        {eligibleStudents.length === 0 && students.length > 0 && (
          <p className="text-[10px] text-emerald-600 font-bold mt-1">All enrolled students have paid their exam fees.</p>
        )}
      </div>
      {selectedStudent && (
        <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center text-lg font-black shadow-inner">
              {(selectedStudent.fullName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">{selectedStudent.fullName || 'Unnamed Student'}</p>
              <p className="text-[10px] font-mono font-bold text-slate-400">{selectedStudent.enrollmentNo || 'N/A'} · {selectedStudent.course || selectedStudent.courseName || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Choose Semester
        </h3>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Select the semester for which fee is to be paid</p>
      </div>
      {selectedStudent && (
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-2">
          <p className="text-xs font-bold text-slate-600">
            Student: <span className="text-slate-800">{selectedStudent.fullName}</span>
            <span className="text-slate-300 mx-2">|</span>
            Course: <span className="text-slate-800">{selectedStudent.course || selectedStudent.courseName || 'N/A'}</span>
          </p>
        </div>
      )}
      {unpaidSemesters.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-300 mb-3" />
          <p className="text-sm font-bold text-slate-500">All semesters paid for this student!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {unpaidSemesters.map(sem => (
            <button
              key={sem.semesterNumber}
              type="button"
              onClick={() => setSelectedSemester(sem.semesterNumber)}
              className={`py-4 rounded-2xl text-sm font-bold transition-all border cursor-pointer ${
                String(selectedSemester) === String(sem.semesterNumber)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              Sem {sem.semesterNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          Enter Payment Details
        </h3>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Configure payment amount</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Fee Type</label>
          <select
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            disabled
            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-not-allowed"
          >
            <option value="Examination fee">Examination fee</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Amount (INR) *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
            <input
              type="number"
              required
              min="1"
              placeholder="Enter amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Mode</label>
          <input
            type="text"
            value="Razorpay Online"
            readOnly
            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Date *</label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const reviewItems = [
      { label: 'Student', value: selectedStudent?.fullName || '—' },
      { label: 'Enrollment No', value: selectedStudent?.enrollmentNo || '—' },
      { label: 'Course', value: selectedStudent?.course || selectedStudent?.courseName || '—' },
      { label: 'Semester', value: `Semester ${selectedSemester}` },
      { label: 'Fee Type', value: feeType },
      { label: 'Amount', value: fmtCurrency(amount) },
      { label: 'Payment Mode', value: 'Razorpay Online' },
      { label: 'Payment Date', value: fmtDate(paymentDate) },
    ];
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Review & Submit
          </h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Verify all details before submitting the payment</p>
        </div>
        <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-3">
          {reviewItems.map((item) => (
            <div key={item.label} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{item.label}</span>
              <span className="text-xs font-bold text-slate-800 text-right max-w-[60%] truncate">{item.value}</span>
            </div>
          ))}
        </div>
        {submitting && (
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing payment...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Fee Payment Portal</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Record student fee payments — fully backed by the API</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Records</span>
            <span className="text-lg font-black text-blue-600">{feeRecords.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Collected</span>
            <span className="text-lg font-black text-emerald-600">
              {fmtCurrency(feeRecords.reduce((sum, r) => sum + (r.amount || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        {renderStepIndicator()}

        <div className="min-h-[280px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitPayment}
              disabled={submitting}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Confirm & Pay'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Fee Transaction History</h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">All recorded student fee payments from the database</p>
        </div>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-sm font-bold">Loading fee records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
              <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4 font-black w-14 text-center">#</th>
                    <th className="px-6 py-4 font-black">Student</th>
                    <th className="px-6 py-4 font-black">Enrollment ID</th>
                    <th className="px-6 py-4 font-black">Fee Purpose</th>
                    <th className="px-6 py-4 font-black">Amount</th>
                    <th className="px-6 py-4 font-black">Mode</th>
                    <th className="px-6 py-4 font-black">Date</th>
                    <th className="px-6 py-4 font-black">Payment ID</th>
                    <th className="px-6 py-4 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
                  {paginatedRecords.map((rec, idx) => {
                    const serialNo = String((activePage - 1) * itemsPerPage + idx + 1).padStart(2, '0');
                    const studentName = rec.student
                      ? `${rec.student.firstName || ''} ${rec.student.lastName || ''}`.trim()
                      : 'N/A';
                    const enrollmentId = rec.student?.enrollmentId || '—';
                    return (
                      <tr key={rec._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">{studentName}</td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">{enrollmentId}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {rec.paymentPurpose}
                          {rec.semesterNumber && <span className="block text-[10px] text-slate-400">Sem {rec.semesterNumber}</span>}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{fmtCurrency(rec.amount)}</td>
                        <td className="px-6 py-4 text-slate-600">{rec.paymentMode}</td>
                        <td className="px-6 py-4 text-slate-500">{fmtDate(rec.paymentDate)}</td>
                        <td className="px-6 py-4 font-mono text-slate-600 text-[11px]">{rec.razorpayPaymentId || rec.utrNumber || '—'}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingTx(rec)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {feeRecords.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-16 text-center">
                        <FileText className="w-10 h-10 mx-auto text-slate-200 mb-3 stroke-1" />
                        <p className="text-sm font-bold text-slate-500">No fee records found</p>
                        <p className="text-xs text-slate-400 mt-1">Submit the form above to record a student fee payment.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {feeRecords.length > itemsPerPage && (
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setActivePage(p => Math.max(p - 1, 1))}
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActivePage(num)}
                    className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                      activePage === num
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={activePage === totalPages}
                  onClick={() => setActivePage(p => Math.min(p + 1, totalPages))}
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {viewingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Fee Payment Record</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transaction Details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingTx(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-600 text-left bg-slate-50/20">
              <div className="border border-dashed border-slate-200 bg-white rounded-2xl p-5 shadow-sm space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student Name</span>
                    <span className="text-slate-800 font-bold block mt-0.5">
                      {viewingTx.student ? `${viewingTx.student.firstName} ${viewingTx.student.lastName}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrollment ID</span>
                    <span className="text-slate-800 font-mono font-bold block mt-0.5">{viewingTx.student?.enrollmentId || '—'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Fee Purpose</span>
                    <span className="text-slate-800 font-bold block mt-0.5">{viewingTx.paymentPurpose} {viewingTx.semesterNumber ? `(Sem ${viewingTx.semesterNumber})` : ''}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Payment Mode</span>
                    <span className="text-slate-800 font-bold block mt-0.5">{viewingTx.paymentMode}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Payment Date</span>
                    <span className="text-slate-800 font-bold block mt-0.5">{fmtDate(viewingTx.paymentDate)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Payment ID</span>
                    <span className="text-slate-800 font-mono font-bold block mt-0.5 break-all">{viewingTx.razorpayPaymentId || viewingTx.utrNumber || '—'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <span className="text-xs font-black text-slate-700">Total Amount Paid</span>
                  <span className="text-sm font-black text-blue-600 font-mono">{fmtCurrency(viewingTx.amount)}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingTx(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showPaymentChecker && (
        <PaymentStatusChecker
          isOpen={showPaymentChecker}
          paymentType="academic"
          message="Verifying your fee payment..."
          onComplete={() => {
            setShowPaymentChecker(false);
            setToast({ message: 'Payment verified successfully!', type: 'success' });
            fetchFeeRecords();
            resetForm();
          }}
          onRetry={() => {
            setShowPaymentChecker(false);
            handleSubmitPayment();
          }}
          onCancel={() => {
            setShowPaymentChecker(false);
            setSubmitting(false);
          }}
        />
      )}
    </div>
  );
};

export default InstituteERPFees;
