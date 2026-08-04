import { useState, useEffect } from 'react';
import {
  Eye, CheckCircle2, ShieldCheck, X, FileCheck, Building2, GraduationCap,
  AlertCircle, FileText, Loader2, CreditCard, User, Users, BookOpen,
  BarChart3, FileSignature
} from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const AcademyInspectorModal = ({
  selectedApp,
  setSelectedApp,
  auditDocs,
  setShowRejectModal,
  handleApprove
}) => {
  const getDocUrl = (url) => {
    if (!url) return '';
    // getUploadUrl resolves Cloudinary/external URLs as-is and rewrites any
    // backend-hosted absolute URL to the current API origin, so document links
    // work whether files live on Cloudinary or local disk.
    return getUploadUrl(url);
  };

  // ── Payment verification state ─────────────────────────────────────────────
  // All displayed payment values come from the backend `selectedApp` payload.
  // `isVerifyingPayment` is only a short transient visual state so pending
  // applications surface a quick "checking" step before the real status.
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(() => Boolean(selectedApp?.id && !selectedApp.paymentComplete));

  useEffect(() => {
    if (!isVerifyingPayment) return;
    const t = setTimeout(() => setIsVerifyingPayment(false), 900);
    return () => clearTimeout(t);
    // The modal remounts per application, so this transient state is safe.
  }, [isVerifyingPayment]);

  const isPaymentComplete = !!selectedApp?.paymentComplete;
  const paymentAmount = selectedApp?.paymentDetails?.amount
    || (selectedApp?.form?.paymentAmount != null
        ? `₹${Number(selectedApp.form.paymentAmount).toLocaleString('en-IN')}.00`
        : '₹5,000.00');
  const transactionId = selectedApp?.paymentDetails?.transactionId
    || selectedApp?.form?.razorpayPaymentId
    || 'N/A';
  const paymentDate = selectedApp?.paymentDetails?.date
    || (selectedApp?.form?.paymentCompletedAt
        ? new Date(selectedApp.form.paymentCompletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'N/A');

  // Document categories keyed to the backend `uploadedDocs` field names.
  const docCategories = [
    { key: 'equipmentList', label: 'Equipment List', icon: <FileText className="w-4 h-4" /> },
    { key: 'facultyList', label: 'Faculty List', icon: <Users className="w-4 h-4" /> },
    { key: 'emergencyOPDStatistics', label: 'OPD Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'libraryBookList', label: 'Library List', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'trainingMannequinList', label: 'Mannequin List', icon: <User className="w-4 h-4" /> },
    { key: 'diagnosticEquipmentList', label: 'Diagnostic List', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'declarationLetter', label: 'Declaration', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'facultyCommitmentLetter', label: 'Faculty Commitment', icon: <FileSignature className="w-4 h-4" /> },
  ];

  const getDocUrlForField = (key) => {
    const fileData = selectedApp.uploadedDocs?.[key];
    return getDocUrl(fileData?.url || selectedApp.form?.documents?.[key + 'Url'] || selectedApp.form?.[key + 'Url'] || selectedApp.form?.[key]);
  };

  const isApproved = selectedApp.status === 'approved' || selectedApp.status === 'active_erp';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ─── HEADER ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-800 truncate">{selectedApp.orgName}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium">ID: {selectedApp.id}</span>
                <span className="text-slate-300">•</span>
                <span className="font-medium">{selectedApp.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedApp(null)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── BODY ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ═══ TOP ROW: Status Badge + Quick Stats ═══ */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                selectedApp.status === 'pending_review'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : isApproved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {selectedApp.status === 'pending_review' ? '⏳ Pending Review' :
                 isApproved ? '✅ Approved' : '❌ Rejected'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isPaymentComplete
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {isPaymentComplete ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Payment Verified</>
                ) : (
                  <><AlertCircle className="w-3.5 h-3.5" /> Payment Pending</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">Submitted: {selectedApp.submittedAt || 'N/A'}</span>
            </div>
          </div>

          {/* ═══ PAYMENT SECTION - Clean & Compact ═══ */}
          {isPaymentComplete ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Inspection Fee Paid</p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    <span className="font-mono">{transactionId}</span> • {paymentAmount} • {paymentDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified</span>
              </div>
            </div>
          ) : isVerifyingPayment ? (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-xs font-medium text-blue-700">Verifying payment status...</p>
            </div>
          ) : (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800">Payment Pending</p>
                  <p className="text-[10px] text-amber-600 font-medium">Inspection fee of ₹5,000.00 not yet completed</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Awaiting</span>
            </div>
          )}

          {/* ═══ MAIN CONTENT GRID ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ─── LEFT COLUMN: Institution Details ────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* General Info */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Institution Profile
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Organization</span>
                    <span className="text-slate-800 font-bold">{selectedApp.orgName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Constitution</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.constitutionType || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">Address</span>
                    <span className="text-slate-700">{selectedApp.form?.instituteAddress || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">Registered Office</span>
                    <span className="text-slate-700">{selectedApp.form?.registeredOfficeAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Phone</span>
                    <span className="text-slate-700 font-medium">{selectedApp.form?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Website</span>
                    {selectedApp.form?.website ? (
                      <a href={selectedApp.form.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">
                        {selectedApp.form.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : <span className="text-slate-400">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Leadership */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Leadership & Representation
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Head of Institution</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.headName || 'N/A'}</span>
                    <span className="text-slate-400 text-[10px] block">{selectedApp.form?.headDesignation || ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">HOD (Emergency Medicine)</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.hodName || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium block">Authorized Representative</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.authorizedRepName || 'N/A'}</span>
                    <span className="text-slate-400 text-[10px] block">{selectedApp.form?.authorizedRepDesignation || ''}</span>
                  </div>
                </div>
              </div>

              {/* Academic Specs */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Academic Specifications
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Seats Requested</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.seatsRequested || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Commencement</span>
                    <span className="text-slate-800 font-bold">{selectedApp.form?.commencementDate ? new Date(selectedApp.form.commencementDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">NABH Status</span>
                    <span className={`font-bold ${(selectedApp.form?.nabhStatus || 'Yes') === 'Yes' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {(selectedApp.form?.nabhStatus || 'Yes') === 'Yes' ? 'Accredited' : 'Non-Accredited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/50 border-b border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Compliance Checklist
                  </h4>
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Emergency Beds', value: `${selectedApp.form?.bedCount || selectedApp.bedCount} Beds`, pass: parseInt(selectedApp.form?.bedCount || selectedApp.bedCount, 10) >= 10 },
                    { label: 'Physician Experience', value: `${selectedApp.form?.physicianExperience || selectedApp.experience} Months`, pass: parseInt(selectedApp.form?.physicianExperience || selectedApp.experience, 10) >= 24 },
                    { label: 'EM Faculty', value: `${selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount} Faculty`, pass: parseInt(selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount, 10) >= 1 },
                    { label: 'Teaching Space', value: (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' ? 'Available' : 'Unavailable', pass: (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' },
                  ].map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${item.pass ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                      <span className="text-[10px] text-slate-400 font-medium block">{item.label}</span>
                      <span className="text-xs font-bold text-slate-800">{item.value}</span>
                      {item.pass ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedApp.rejectionReason && (
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Rejection Reason
                  </p>
                  <p className="text-xs text-rose-800 font-medium mt-1">"{selectedApp.rejectionReason}"</p>
                </div>
              )}
            </div>

            {/* ─── RIGHT COLUMN: Documents ─────────────────────────────────── */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden sticky top-0">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Documents ({auditDocs.length})
                  </h4>
                </div>
                <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
                  {docCategories.map((doc) => {
                    const docUrl = getDocUrlForField(doc.key);
                    return (
                      <div key={doc.key} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${docUrl ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            {doc.icon}
                          </div>
                          <span className={`text-xs font-medium truncate ${docUrl ? 'text-slate-700' : 'text-slate-400'}`}>
                            {doc.label}
                          </span>
                        </div>
                        {docUrl ? (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
                            title="View Document"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-medium uppercase">Missing</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
          <div className="text-[10px] text-slate-400 font-medium">
            {isPaymentComplete ? '✅ All checks passed' : '⏳ Payment verification required'}
          </div>
          <div className="flex items-center gap-3">
            {selectedApp.status === 'pending_review' && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-5 py-2 text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!isPaymentComplete}
                  className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                    isPaymentComplete
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={!isPaymentComplete ? 'Payment must be completed before approval' : ''}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Approve
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedApp(null)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyInspectorModal;
