import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Sparkles, Lock, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import academicService from '../../../api/academic';
import { initiateRazorpayPayment } from '../../../utils/razorpay';

const InstituteERPRemittance = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('Annual Fellowship Accreditation Fee');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remittanceHistory, setRemittanceHistory] = useState([]);
  const [payableAmount, setPayableAmount] = useState(0);
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const [historyRes, payableRes] = await Promise.all([
        academicService.getRemittances().catch(() => ({ data: { data: [] } })),
        academicService.getPayableRemittance().catch(() => ({ data: { amount: 0 } }))
      ]);
      const historyData = historyRes.data?.data || historyRes.data || [];
      const payableData = payableRes.data?.amount || payableRes.data?.payableAmount || 0;
      
      const mappedHistory = (Array.isArray(historyData) ? historyData : []).map(rem => ({
        id: (rem._id || rem.id || 'N/A').toString().substring(0, 8).toUpperCase(),
        amount: rem.totalAmount || rem.amount || 0,
        paymentPurpose: rem.paymentPurpose || 'Annual Fellowship Accreditation Remittance',
        remarks: rem.remarks || 'N/A',
        date: rem.paymentDate || rem.createdAt ? new Date(rem.paymentDate || rem.createdAt).toISOString().split('T')[0] : 'N/A',
        paymentId: rem.razorpayPaymentId || rem.utrNumber || rem.transactionId || 'N/A',
        orderId: rem.razorpayOrderId || 'N/A',
        paymentMode: rem.paymentMode || 'Razorpay Online',
        status: rem.status || 'Verified'
      }));
      
      setRemittanceHistory(mappedHistory);
      setPayableAmount(payableData);
      if (payableData > 0) {
        setTotalAmount(payableData.toString());
      }
    } catch (err) {
      console.error('Error fetching remittance data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayViaRazorpay = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(totalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setToast({ type: 'error', message: 'Please enter a valid remittance amount.' });
      return;
    }

    setIsSubmitting(true);
    setToast({ type: 'info', message: 'Initializing secure Razorpay gateway...' });

    try {
      // 1. Create Razorpay order via backend
      const orderRes = await academicService.createRazorpayOrder({
        amount: amountVal,
        purpose: paymentPurpose || 'Academy Fee Remittance'
      });

      const orderData = orderRes?.data?.data || orderRes?.data || orderRes;
      const finalOrderId = orderData.orderId || orderData.id;

      if (!finalOrderId) {
        throw new Error('Failed to generate Razorpay order token.');
      }

      // 2. Open Razorpay Checkout Modal
      initiateRazorpayPayment({
        orderId: finalOrderId,
        amount: orderData.amount || amountVal * 100,
        currency: orderData.currency || 'INR',
        keyId: orderData.keyId,
        name: 'Society for Emergency Medicine India',
        description: paymentPurpose || 'Academy Fee Remittance',
        additionalData: { purpose: paymentPurpose || 'Academy Fee Remittance' },
        onSuccess: async (response) => {
          try {
            setToast({ type: 'info', message: '✅ Payment authorized! Recording remittance...' });

            // 3. Submit Remittance with Razorpay IDs & Signature to Backend
            await academicService.submitRemittance({
              totalAmount: amountVal,
              paymentPurpose: paymentPurpose,
              remarks: remarks,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMode: 'Razorpay Online',
              paymentDate: new Date().toISOString()
            });

            setToast({ type: 'success', message: '🎉 Remittance paid & verified successfully via Razorpay!' });
            setRemarks('');
            await fetchData();
          } catch (postErr) {
            console.error('Remittance post error:', postErr);
            setToast({ type: 'error', message: postErr.parsedMessage || postErr.message || 'Failed to record payment.' });
          } finally {
            setIsSubmitting(false);
          }
        },
        onDismiss: () => {
          setIsSubmitting(false);
          setToast({ type: 'error', message: 'Payment cancelled by user.' });
        }
      });

    } catch (err) {
      console.error('Razorpay remittance error:', err);
      setToast({ type: 'error', message: err.parsedMessage || err.message || 'Payment initiation failed.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-150 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : toast.type === 'info'
              ? 'bg-blue-50 border-blue-300 text-blue-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-black">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[11px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Razorpay Automated Gateway
          </div>
          <h2 className="text-2xl font-black tracking-tight">Academy Fee Remittance</h2>
          <p className="text-xs text-slate-300 max-w-xl font-medium">
            Pay institutional fellowship fee balances instantly using Razorpay UPI, Netbanking, or Credit Cards with automated signature verification.
          </p>
        </div>

        {/* Dynamic Payable Badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 rounded-2xl text-right flex flex-col justify-center">
          <span className="block text-[10px] text-blue-300 font-extrabold uppercase tracking-widest mb-0.5">Outstanding Balance</span>
          <span className="block text-2xl sm:text-3xl font-black text-white tracking-tight">₹{payableAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Razorpay Online Payment Box (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">
              <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
            </div>
            <h3 className="text-lg font-black text-slate-800">Instant Online Remittance</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Automated Razorpay checkout & signature verification</p>
          </div>

          <form onSubmit={handlePayViaRazorpay} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                Remittance Purpose / Reason *
              </label>
              <select
                value={paymentPurpose}
                onChange={(e) => setPaymentPurpose(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-800 text-xs cursor-pointer"
              >
                <option value="Annual Fellowship Accreditation Fee">Annual Fellowship Accreditation Fee</option>
                <option value="Student Registration Remittance">Student Registration Remittance</option>
                <option value="Examination Board Fee Remittance">Examination Board Fee Remittance</option>
                <option value="Inspection & Hospital Accreditation Fee">Inspection & Hospital Accreditation Fee</option>
                <option value="Special Fellowship Assessment Fee">Special Fellowship Assessment Fee</option>
                <option value="Other Institutional Remittance">Other Institutional Remittance</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                Remittance Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">₹</span>
                <input 
                  type="number"
                  min="1"
                  step="any"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-black text-slate-800 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                Remarks / Additional Details
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Fellowship Batch 2026 1st Installment"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-semibold text-slate-800 text-xs"
              />
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Payment Partner</span>
                <span className="text-indigo-600 font-extrabold flex items-center gap-1">
                  Razorpay Secure <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Supported Methods</span>
                <span className="text-slate-800 font-extrabold">UPI, GPay, Cards, Netbanking</span>
              </div>
              <div className="flex justify-between text-slate-600 font-bold">
                <span>Verification Mode</span>
                <span className="text-emerald-600 font-extrabold">Instant HMAC Signature</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || parseFloat(totalAmount) <= 0}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Razorpay...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay ₹{parseFloat(totalAmount || 0).toLocaleString()} via Razorpay
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic Remittance History List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800">Remittance Audit Log</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Verified Razorpay payments & transaction records</p>
            </div>
            <button 
              onClick={fetchData} 
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              title="Refresh History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date & Ref</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Purpose & Details</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Razorpay Payment ID</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {remittanceHistory.length > 0 ? (
                  remittanceHistory.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{rem.date}</div>
                        <div className="text-[10px] font-mono text-slate-400">ID: #{rem.id}</div>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="font-bold text-slate-800 truncate" title={rem.paymentPurpose}>{rem.paymentPurpose}</div>
                        {rem.remarks && rem.remarks !== 'N/A' && (
                          <div className="text-[10px] text-slate-400 truncate" title={rem.remarks}>Note: {rem.remarks}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">
                        {rem.paymentId}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-800 text-sm">
                        ₹{rem.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {rem.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-semibold">
                      No remittance payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstituteERPRemittance;
