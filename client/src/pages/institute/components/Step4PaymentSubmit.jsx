import React, { useState } from 'react';
import { 
  Eye, EyeOff, FileCheck, RefreshCw, CheckCircle2, ShieldCheck, 
  CreditCard, Landmark, Copy, Check, UploadCloud, ArrowRight 
} from 'lucide-react';
import Toast from '../../../Components/Toast';

const Step4PaymentSubmit = ({ 
  appForm, 
  setAppForm, 
  uploadedDocs, 
  setUploadedDocs, 
  uploadProgress, 
  setUploadProgress,
  paymentComplete,
  setPaymentComplete,
  paymentDetails,
  setPaymentDetails,
  handlePaymentInitiate,
  paymentProcessing
}) => {
  // Local error state
  const [localError, setLocalError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCvv, setShowCvv] = useState(false);
  
  // Payment methods: 'online' or 'offline'
  const [paymentMethod, setPaymentMethod] = useState('online');
  
  // Online payment channels: 'card' or 'upi' or 'netbanking'
  const [onlineChannel, setOnlineChannel] = useState('card');
  
  // Copy state for bank transfer details
  const [copiedField, setCopiedField] = useState(null);

  // Form states for online inputs
  const [cardForm, setCardForm] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  
  // Offline verification state
  const [offlineVerifying, setOfflineVerifying] = useState(false);

  const bankDetails = {
    accountName: 'SOCIETY FOR EMERGENCY MEDICINE INDIA',
    accountNumber: '50200087654321',
    bankName: 'HDFC Bank Ltd',
    ifscCode: 'HDFC0000124',
    branch: 'Anna Salai, Chennai',
    accountType: 'Current Account'
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show error using toast
  const showError = (message) => {
    setLocalError(message);
    setToast({ message, type: 'error' });
    setTimeout(() => setLocalError(null), 5000);
  };

  // Online Payment via Razorpay
  const handleOnlinePaymentSimulated = (e) => {
    if (e) e.preventDefault();
    if (handlePaymentInitiate) {
      handlePaymentInitiate();
    } else {
      setLocalError('Payment gateway not initialized.');
    }
  };

  // Verify Offline Bank Transfer details
  const handleOfflineTransferConfirm = () => {
    if (!appForm.paymentBankName || !appForm.paymentTxnNo || !appForm.paymentTxnDate) {
      showError('Please fill out all bank transfer transaction details (Bank, NEFT/UTR No, Date).');
      return;
    }

    if (!uploadedDocs.paymentReceiptDoc) {
      showError('Please upload a file proof of your bank transfer transaction receipt in step 3 or browse/upload it here.');
      return;
    }

    setOfflineVerifying(true);
    setTimeout(() => {
      setPaymentDetails({
        receiptNumber: `REC-OFF-${Math.floor(100000 + Math.random() * 900000)}`,
        transactionId: appForm.paymentTxnNo,
        amount: '₹2,50,000',
        date: appForm.paymentTxnDate,
        method: 'Offline Bank Transfer'
      });
      setPaymentComplete(true);
      setOfflineVerifying(false);
    }, 1200);
  };

  // Mock document upload for manual bank receipt
  const handleFileUploadSimulated = (key, fileName) => {
    setUploadProgress(prev => ({ ...prev, [key]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      setUploadProgress(prev => ({ ...prev, [key]: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedDocs(prev => ({
          ...prev,
          [key]: {
            name: fileName,
            size: '142.5 KB',
            uploadedAt: new Date().toLocaleTimeString()
          }
        }));
      }
    }, 120);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-8 animate-in fade-in duration-200">
      
      {/* Step Header */}
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900">Inspection Fee Verification</h3>
        <p className="text-xs text-gray-400 mt-0.5">Please execute payment of ₹2,50,000 for standard institutional site evaluation</p>
      </div>

      {paymentComplete ? (
        /* SUCCESS TRANSACTION STATE */
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-xs font-semibold leading-relaxed flex items-start gap-4 shadow-sm animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 w-full">
              <span className="text-emerald-800 text-sm font-black block">Inspection Payment Captured & Verified</span>
              <p className="text-emerald-700 font-medium text-[11px] leading-relaxed">
                Auditing simulation complete: receipt **{paymentDetails?.receiptNumber}** matches transaction reference **{paymentDetails?.transactionId}** captured successfully.
              </p>
              
              {/* Receipt Summary Card */}
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
                  <span className="text-xs font-bold text-gray-800 block mt-0.5">{paymentDetails?.method || 'Online Card'}</span>
                </div>
              </div>

              {/* PDF Preview attached */}
              {uploadedDocs.paymentReceiptDoc && (
                <div className="mt-4 bg-emerald-100/50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] text-emerald-900 font-extrabold">{uploadedDocs.paymentReceiptDoc.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToast({ message: 'Receipt Viewer: Verification receipt matches digitally signed lock under SHA-256.', type: 'info' })}
                    className="text-emerald-800 hover:text-emerald-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Receipt
                  </button>
                </div>
              )}

              {/* Reset Payment Option */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentComplete(false);
                    setPaymentDetails(null);
                    setUploadedDocs(prev => ({ ...prev, paymentReceiptDoc: null }));
                  }}
                  className="px-4 py-2 border border-emerald-250 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-colors"
                >
                  Reset / Re-simulate Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE PAYMENT GATEWAY - Same as before, but with no setErrorBanner calls */
        <div className="space-y-6">
          {/* Payment Method Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setPaymentMethod('online');
                setLocalError(null);
              }}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                paymentMethod === 'online'
                  ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className={`p-3 rounded-xl ${paymentMethod === 'online' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-gray-900 block">Instant Online Payment</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1 leading-relaxed">
                  Pay securely via mock Payment Gateway using Credit Card, UPI, or Net Banking.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethod('offline');
                setLocalError(null);
              }}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                paymentMethod === 'offline'
                  ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-500/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div className={`p-3 rounded-xl ${paymentMethod === 'offline' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-gray-900 block">Offline Bank Transfer</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1 leading-relaxed">
                  Transfer funds offline to the SEMI bank account. Provide transaction UTR & upload payment receipt copy.
                </span>
              </div>
            </button>
          </div>
          {/* PAYMENT OPTIONS PANELS */}
          {paymentMethod === 'online' ? (
            /* ONLINE CHANNELS PANEL */
            <div className="bg-slate-50/60 border border-gray-150 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {['card', 'netbanking'].map((chan) => (
                    <button
                      key={chan}
                      type="button"
                      onClick={() => setOnlineChannel(chan)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold transition-all ${
                        onlineChannel === chan
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {chan === 'card' ? 'Credit Card' : 'Net Banking'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-100 rounded-full px-3 py-1 select-none">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  SEMI Secure Gateway
                </div>
              </div>

              {/* CARD ONLINE OPTION */}
              {onlineChannel === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Virtual visual Credit Card */}
                  <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between aspect-[1.6/1] w-full max-w-[340px] mx-auto select-none border border-slate-700 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 font-bold text-8xl -mr-6 -mb-6 tracking-tighter">VISA</div>
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-extrabold">SEMI Academic Card</span>
                        <h4 className="text-xs font-black tracking-widest text-slate-200 mt-1">₹2,50,000.00</h4>
                      </div>
                      <div className="w-10 h-7 bg-amber-500/25 border border-amber-500/20 rounded-md flex items-center justify-center font-bold text-[10px] text-amber-500">CHIP</div>
                    </div>
                    
                    <div className="space-y-1 mt-6">
                      <span className="block text-[14px] font-mono tracking-widest text-slate-100 font-bold">
                        {cardForm.number ? cardForm.number.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Cardholder Name</span>
                        <span className="text-[10px] font-bold block truncate max-w-[150px] uppercase">{cardForm.name || 'Your Institute Name'}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Expires</span>
                          <span className="text-[10px] font-mono font-bold block">{cardForm.expiry || 'MM/YY'}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">CVV</span>
                          <span className="text-[10px] font-mono font-bold block">{cardForm.cvv ? '•••' : '000'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Fields inputs */}
                  <form onSubmit={handleOnlinePaymentSimulated} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Saraswathi Medical College"
                          value={cardForm.name}
                          onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength="16"
                          placeholder="4111 2222 3333 4444"
                          value={cardForm.number}
                          onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">Expiry Date</label>
                          <input
                            type="text"
                            required
                            maxLength="5"
                            placeholder="MM/YY"
                            value={cardForm.expiry}
                            onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">CVV / CVN</label>
                          <div className="relative">
                            <input
                              type={showCvv ? "text" : "password"}
                              required
                              maxLength="3"
                              placeholder="***"
                              value={cardForm.cvv}
                              onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                              className="w-full px-3.5 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:border-blue-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCvv(!showCvv)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={offlineVerifying}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-blue-500/20 active:scale-[0.99] transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {offlineVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          Processing Security Audit...
                        </>
                      ) : (
                        <>
                          Pay ₹2,50,000 Instantly
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* NETBANKING ONLINE OPTION */}
              {onlineChannel === 'netbanking' && (
                <div className="space-y-4">
                  <span className="block text-[10px] uppercase font-black text-gray-400">Select popular banks</span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      'State Bank of India',
                      'HDFC Bank',
                      'ICICI Bank',
                      'Axis Bank',
                      'Punjab National Bank',
                      'Bank of Baroda',
                      'Union Bank of India',
                      'Canara Bank'
                    ].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-3 border rounded-xl font-bold text-[10px] tracking-wide text-center transition-all ${
                          selectedBank === bank
                            ? 'border-blue-600 bg-blue-50/50 text-blue-800 font-extrabold shadow-sm'
                            : 'border-gray-250 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleOnlinePaymentSimulated}
                    disabled={offlineVerifying || !selectedBank}
                    className="w-full py-3 bg-blue-600 disabled:bg-gray-300 disabled:shadow-none hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-blue-500/20 active:scale-[0.99] transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 mt-2"
                  >
                    {offlineVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Connecting to Secure Netbanking Portal...
                      </>
                    ) : (
                      <>
                        Pay ₹2,50,000 with {selectedBank || 'Selected Bank'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* OFFLINE BANK TRANSFER PANEL */
            <div className="space-y-6 animate-fadeIn">
              {/* Bank Account Info Card */}
              <div className="bg-slate-50 border border-gray-200/60 rounded-3xl p-6 space-y-4">
                <div className="border-b border-gray-200 pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Official SEMI Bank Details</h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Please transfer exactly ₹2,50,000 under compliance</span>
                  </div>
                  <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    RTGS / NEFT / IMPS Accepted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold leading-relaxed text-gray-700">
                  {/* Account Name */}
                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Account Name</span>
                      <span className="text-[11px] font-extrabold text-slate-800">{bankDetails.accountName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'accountName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Account Number */}
                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Account Number</span>
                      <span className="text-[11px] font-mono font-bold text-slate-800">{bankDetails.accountNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Bank & Branch */}
                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Bank Name & Branch</span>
                      <span className="text-[11px] font-extrabold text-slate-800">{bankDetails.bankName} ({bankDetails.branch})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`${bankDetails.bankName}, ${bankDetails.branch}`, 'bankName')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'bankName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* IFSC Code */}
                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-slate-400 font-extrabold">Bank IFSC Code</span>
                      <span className="text-[11px] font-mono font-bold text-slate-800">{bankDetails.ifscCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankDetails.ifscCode, 'ifscCode')}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'ifscCode' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Offline Transfer Details Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">Sender Bank Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    value={appForm.paymentBankName}
                    onChange={(e) => setAppForm({...appForm, paymentBankName: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-xs font-bold animate-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">NEFT / UTR Ref Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR87654321"
                    value={appForm.paymentTxnNo}
                    onChange={(e) => setAppForm({...appForm, paymentTxnNo: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">Transaction Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={appForm.paymentTxnDate}
                    onChange={(e) => setAppForm({...appForm, paymentTxnDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-xs font-bold cursor-pointer"
                  />
                </div>
              </div>

              {/* Upload payment receipt proof */}
              <div className="border border-gray-150 rounded-2xl p-5 bg-slate-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-black text-gray-800">Upload Transaction Receipt Proof <span className="text-red-500">*</span></span>
                    <span className="block text-[10px] text-gray-400 font-bold">Please upload receipt image or transaction PDF copy as validation proof</span>
                  </div>

                  <div className="w-full sm:w-auto">
                    {uploadedDocs.paymentReceiptDoc ? (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-[10px] font-extrabold text-emerald-900 truncate max-w-[150px]">{uploadedDocs.paymentReceiptDoc.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setToast({ message: `Audit View: Bank transfer receipt proof: "${uploadedDocs.paymentReceiptDoc.name}" is locked.`, type: 'info' })}
                          className="text-emerald-700 hover:text-emerald-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    ) : uploadProgress.paymentReceiptDoc > 0 && uploadProgress.paymentReceiptDoc < 100 ? (
                      <div className="bg-white border border-gray-150 rounded-xl p-3 min-w-[200px]">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 mb-1.5">
                          <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> Uploading...</span>
                          <span>{uploadProgress.paymentReceiptDoc}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div className="bg-blue-600 h-1 rounded-full transition-all duration-200" style={{ width: `${uploadProgress.paymentReceiptDoc}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="file-receipt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleFileUploadSimulated('paymentReceiptDoc', file.name);
                            }
                          }}
                        />
                        <label
                          htmlFor="file-receipt"
                          className="px-5 py-2.5 bg-white border border-gray-200 hover:border-slate-300 rounded-xl text-center font-bold text-[10px] text-slate-700 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm"
                        >
                          <UploadCloud className="w-4 h-4 text-slate-500" />
                          Choose Receipt file
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirm offline details button */}
              <button
                type="button"
                onClick={handleOfflineTransferConfirm}
                disabled={offlineVerifying}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-blue-500/20 active:scale-[0.99] transition-all text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                {offlineVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Locking Transfer Details...
                  </>
                ) : (
                  <>
                    Verify & Confirm Bank Transfer Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

       {/* Authorized representative declaration card */}
      <div className="space-y-4 pt-6 border-t border-gray-100">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Representative Declaration</h3>
          <p className="text-xs text-gray-400 mt-0.5">Final authorization step under compliance audit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="block text-[10px] uppercase font-black text-gray-500 mb-2">Digital Signature Upload <span className="text-red-500">*</span></label>
            {uploadedDocs.signatureDoc ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between mt-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[10px] font-extrabold text-emerald-900 truncate max-w-[140px]">{uploadedDocs.signatureDoc.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToast({ message: `Audit Signature: Verified representative signature for ${appForm.authorizedRepName}.`, type: 'info' })}
                  className="text-emerald-700 hover:text-emerald-950 font-black flex items-center gap-1 uppercase text-[9px] tracking-wider"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            ) : uploadProgress.signatureDoc > 0 && uploadProgress.signatureDoc < 100 ? (
              <div className="bg-white border border-gray-150 rounded-xl p-3 mt-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400 mb-1.5">
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin text-blue-600" /> Signing...</span>
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
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUploadSimulated('signatureDoc', file.name);
                    }
                  }}
                />
                <label
                  htmlFor="file-signature"
                  className="w-full py-2.5 bg-white border border-gray-200 hover:border-slate-300 rounded-xl text-center font-bold text-xs text-slate-700 uppercase tracking-wider block cursor-pointer transition-all shadow-sm"
                >
                  Choose Signature File
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-xs text-blue-900 leading-relaxed font-semibold mt-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block">Certification & Declarations agreement</span>
            <span className="text-blue-800 mt-1 block font-medium">
              By clicking "Submit Application", you certify that all uploaded equipment registers, PG EM clinical qualifications, faculty structures, and hospital beds counts comply with the state Medical Board standard regulations.
            </span>
          </div>
        </div>
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