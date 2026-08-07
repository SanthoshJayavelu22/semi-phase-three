import { RefreshCw, CheckCircle2, UploadCloud, FileCheck, Trash2, Check, ShieldCheck } from 'lucide-react';
import Toast from '../../../Components/Toast';
import { useState, useEffect } from 'react';

const Step4PaymentSubmit = ({
  appForm,
  setAppForm,
  uploadedDocs,
  setUploadedDocs,
  uploadProgress,
  setUploadProgress,
  paymentComplete,
  paymentDetails,
}) => {

  const [toast, setToast] = useState(null);

  const showError = (message) => {
    setToast({ message, type: 'error' });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSignatureFileUpload = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Signature file must be under 5MB.', type: 'error' });
      return;
    }
    setUploadProgress(prev => ({ ...prev, signatureDoc: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(prev => ({ ...prev, signatureDoc: Math.min(progress, 100) }));
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedDocs(prev => ({ ...prev, signatureDoc: file }));
        setUploadProgress(prev => ({ ...prev, signatureDoc: null }));
      }
    }, 130);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-8 animate-in fade-in duration-200">

      {/* Step Header */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900">Inspection Fee Verification</h3>
        <p className="text-xs text-gray-400 mt-0.5">Execute payment of ₹2,50,000 for standard institutional site evaluation</p>
      </div>

      {paymentComplete ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-xs font-semibold leading-relaxed flex items-start gap-4 shadow-sm animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 w-full">
              <span className="text-emerald-800 text-sm font-black block">Inspection Payment Captured & Verified</span>
              <p className="text-emerald-700 font-medium text-[11px] leading-relaxed">
                Payment successful: receipt <strong>{paymentDetails?.receiptNumber}</strong> — transaction <strong>{paymentDetails?.transactionId}</strong> captured via {paymentDetails?.method || 'Razorpay'}.
              </p>

              <div className="mt-4 bg-white/70 backdrop-blur border border-emerald-100 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-emerald-600 tracking-wider">Transaction Status</span>
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                    Gateway Verified
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-emerald-600 tracking-wider">Ref ID / UTR</span>
                  <span className="text-xs font-mono font-bold text-gray-800 block truncate mt-0.5">{paymentDetails?.transactionId}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-emerald-600 tracking-wider">Amount Paid</span>
                  <span className="text-xs font-black text-gray-900 block mt-0.5">{paymentDetails?.amount}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-extrabold text-emerald-600 tracking-wider">Payment Mode</span>
                  <span className="text-xs font-bold text-gray-800 block mt-0.5">{paymentDetails?.method || 'Razorpay Online'}</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900">Secure Razorpay Payment</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Click <strong>Submit Application</strong> below to proceed. Your fields will be validated first, then you will be redirected to Razorpay's secure checkout to complete the payment of ₹2,50,000 via UPI, Credit Card, Net Banking, or Wallet.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secured by Razorpay
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authorized representative declaration card */}
      <div className="space-y-4 pt-6 border-t border-gray-100">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Representative Declaration</h3>
          <p className="text-xs text-gray-400 mt-0.5">Final authorization step under compliance audit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">Authorized Representative Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Ramesh Chawla (Course Director)"
              value={appForm.authorizedRepName}
              onChange={(e) => setAppForm({...appForm, authorizedRepName: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-xs font-bold"
            />
          </div>
        </div>

        {/* Digital Signature Upload */}
        <div className="border border-gray-150 rounded-2xl p-5 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="block text-[11px] font-black text-gray-800">Upload Digital Signature <span className="text-red-500">*</span></span>
              <span className="block text-[10px] text-gray-400 font-bold">Upload authorized representative's digital signature image or PDF (max 5MB)</span>
            </div>

            <div className="w-full sm:w-auto">
              {uploadedDocs.signatureDoc ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-[10px] font-extrabold text-emerald-900 truncate max-w-[150px]">
                      {uploadedDocs.signatureDoc instanceof File ? uploadedDocs.signatureDoc.name : uploadedDocs.signatureDoc.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedDocs(prev => ({ ...prev, signatureDoc: null }))}
                    className="text-rose-600 hover:text-rose-800 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              ) : uploadProgress.signatureDoc > 0 && uploadProgress.signatureDoc < 100 ? (
                <div className="bg-white border border-gray-150 rounded-xl p-3 min-w-[200px]">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 mb-1.5">
                    <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> Uploading...</span>
                    <span>{uploadProgress.signatureDoc}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div className="bg-blue-600 h-1 rounded-full transition-all duration-200" style={{ width: `${uploadProgress.signatureDoc}%` }}></div>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="file-signature"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) handleSignatureFileUpload(file);
                    }}
                  />
                  <label
                    htmlFor="file-signature"
                    className="px-5 py-2.5 bg-white border border-gray-200 hover:border-slate-300 rounded-xl text-center font-bold text-[10px] text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    Choose Signature File
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-2xl p-5 text-xs text-blue-900 leading-relaxed font-semibold mt-4 flex items-start gap-4 cursor-pointer transition-colors group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              className="peer appearance-none w-5 h-5 border-2 border-blue-300 rounded-md bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
              checked={appForm.certificationAgreement || false}
              onChange={(e) => setAppForm({...appForm, certificationAgreement: e.target.checked})}
            />
            <Check className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
          </div>
          <div>
            <span className="font-extrabold block group-hover:text-blue-700 transition-colors">Certification & Declarations agreement</span>
            <span className="text-blue-800 mt-1 block font-medium">
              By checking this box and clicking "Submit Application", you certify that all uploaded equipment registers, PG EM clinical qualifications, faculty structures, and hospital beds counts comply with the state Medical Board standard regulations.
            </span>
          </div>
        </label>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Step4PaymentSubmit;
