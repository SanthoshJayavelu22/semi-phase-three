import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Download, CheckCircle2, ChevronLeft, ChevronRight, X, CreditCard, FileText, User, Loader2, ExternalLink } from 'lucide-react';
import Toast from '../../../Components/Toast';
import { academicService } from '../../../api/academic';
import { getUploadUrl } from '../../../api/apiClient';

const getDocUrl = (url) => {
  if (!url) return '';
  return getUploadUrl(url);
};

const fmtCurrency = (val) =>
  Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const fmtDate = (val) => {
  if (!val) return 'N/A';
  try { return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return val; }
};

const InstituteERPFees = ({ students = [], courses = [] }) => {
  // ─── Form State ────────────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeType, setFeeType] = useState('Examination fee');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Online Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionNo, setTransactionNo] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ─── Data State ────────────────────────────────────────────────────────────
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [viewingTx, setViewingTx] = useState(null);
  const [toast, setToast] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 8;

  // ─── Fetch fee records ─────────────────────────────────────────────────────
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

  useEffect(() => { fetchFeeRecords(); }, [fetchFeeRecords]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  // Filter students who haven't paid the exam fee yet
  const eligibleStudents = students.filter(s => 
    !feeRecords.some(r => 
      (r.student?._id === s._id || r.student === s._id || r.student?.id === s.id) && 
      r.paymentPurpose === 'Examination fee'
    )
  );

  const selectedStudent = students.find(s => s._id === selectedStudentId || s.id === selectedStudentId);

  useEffect(() => {
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
  }, [selectedStudent, courses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setToast({ message: 'Please select a student.', type: 'warning' });
      return;
    }
    if (!receiptFile) {
      setToast({ message: 'Payment Receipt upload is mandatory.', type: 'warning' });
      return;
    }
    try {
      setSubmitting(true);
      await academicService.payStudentFees(selectedStudentId, {
        amount: parseFloat(amount),
        paymentMode,
        utrNumber: transactionNo,
        paymentDate,
        paymentPurpose: feeType,
        paymentReceipt: receiptFile,
      });
      setToast({ message: '🎉 Fee payment recorded successfully!', type: 'success' });
      // Reset form
      setSelectedStudentId('');
      setAmount('');
      setTransactionNo('');
      setReceiptFile(null);
      setFeeType('Examination fee');
      setPaymentMode('Online Transfer');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      await fetchFeeRecords();
    } catch (err) {
      const msg = err?.parsedMessage || err?.response?.data?.message || err?.message || 'Failed to record fee payment.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(feeRecords.length / itemsPerPage) || 1;
  const paginatedRecords = feeRecords.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* Header */}
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

      {/* Form */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight">Record Exam Fee Payment</h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Enter student exam fee payment details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Student */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Student Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
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
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">All enrolled students have paid their exam fees.</p>
                )}
              </div>

              {selectedStudent && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student Name</label>
                    <input
                      type="text"
                      value={selectedStudent.fullName || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Course</label>
                    <input
                      type="text"
                      value={selectedStudent.course || selectedStudent.courseName || ''}
                      readOnly
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Payment */}
          <div className="space-y-4 pt-2 border-t border-slate-50">
            <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Payment Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fee Type */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Fee Type *</label>
                <select
                  value={feeType}
                  onChange={(e) => setFeeType(e.target.value)}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-not-allowed"
                >
                  <option value="Examination fee">Examination fee</option>
                </select>
              </div>

              {/* Amount */}
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

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option>Online Transfer</option>
                  <option>UPI</option>
                  <option>NEFT/RTGS</option>
                  <option>Demand Draft</option>
                  <option>Credit Card</option>
                  <option>Cash</option>
                </select>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              {/* UTR / Transaction No */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">UTR / Txn No *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter UTR / transaction no..."
                  value={transactionNo}
                  onChange={(e) => setTransactionNo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              {/* Payment Receipt Upload */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                  Payment Receipt (PDF/IMG) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required={!receiptFile}
                  onChange={(e) => setReceiptFile(e.target.files[0] || null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-all file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold file:text-[10px] file:cursor-pointer"
                />
                {receiptFile && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {receiptFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:scale-[1.01] flex items-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
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
                    <th className="px-6 py-4 font-black">UTR / Txn No</th>
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
                        <td className="px-6 py-4 font-bold text-slate-700">{rec.paymentPurpose}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">{fmtCurrency(rec.amount)}</td>
                        <td className="px-6 py-4 text-slate-600">{rec.paymentMode}</td>
                        <td className="px-6 py-4 text-slate-500">{fmtDate(rec.paymentDate)}</td>
                        <td className="px-6 py-4 font-mono text-slate-600 text-[11px]">{rec.utrNumber}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingTx(rec)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {rec.paymentReceiptUrl && (
                              <a
                                href={getDocUrl(rec.paymentReceiptUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Open Receipt"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
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

            {/* Pagination */}
            {feeRecords.length > itemsPerPage && (
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setActivePage(p => Math.max(p - 1, 1))}
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors"
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
                  className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Receipt Modal */}
      {viewingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col">
            {/* Header */}
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
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
                    <span className="text-slate-800 font-bold block mt-0.5">{viewingTx.paymentPurpose}</span>
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
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">UTR / Txn No</span>
                    <span className="text-slate-800 font-mono font-bold block mt-0.5 break-all">{viewingTx.utrNumber}</span>
                  </div>
                </div>

                {viewingTx.paymentReceiptUrl && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-1.5">Payment Receipt</span>
                    <a
                      href={getDocUrl(viewingTx.paymentReceiptUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Uploaded Receipt
                    </a>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <span className="text-xs font-black text-slate-700">Total Amount Paid</span>
                  <span className="text-sm font-black text-blue-600 font-mono">{fmtCurrency(viewingTx.amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingTx(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default InstituteERPFees;
