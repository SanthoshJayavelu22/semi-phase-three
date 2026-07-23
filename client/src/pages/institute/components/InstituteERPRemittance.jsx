import { useState, useEffect } from 'react';
import { CreditCard, UploadCloud, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import academicService from '../../../api/academic';

const InstituteERPRemittance = () => {
  const [totalAmount, setTotalAmount] = useState('');
  const [transactionNo, setTransactionNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real data for remittance history
  const [remittanceHistory, setRemittanceHistory] = useState([]);
  const [payableAmount, setPayableAmount] = useState(0);

  const fetchData = async () => {
    try {
      const [historyRes, payableRes] = await Promise.all([
        academicService.getRemittances().catch(() => ({ data: { data: [] } })),
        academicService.getPayableRemittance().catch(() => ({ data: { amount: 0 } }))
      ]);
      const historyData = historyRes.data?.data || historyRes.data || [];
      const payableData = payableRes.data?.amount || payableRes.data?.payableAmount || 0;
      
      const mappedHistory = historyData.map(rem => ({
        id: rem._id.substring(0, 8),
        amount: rem.amount,
        date: new Date(rem.paymentDate || rem.createdAt).toISOString().split('T')[0],
        transactionId: rem.utrNumber || rem.transactionId || 'N/A',
        status: rem.status || 'Pending Review',
        fileUrl: rem.paymentReceiptUrl
      }));
      setRemittanceHistory(mappedHistory);
      setPayableAmount(payableData);
    } catch (err) {
      console.error('Error fetching remittance data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!totalAmount || !transactionNo || !paymentDate || !receiptFile) {
      alert('Please fill all required fields and upload the receipt.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('amount', totalAmount);
      formData.append('utrNumber', transactionNo);
      formData.append('paymentDate', paymentDate);
      formData.append('paymentReceipt', receiptFile);
      
      await academicService.submitRemittance(formData);
      
      setTotalAmount('');
      setTransactionNo('');
      setReceiptFile(null);
      alert('Remittance recorded successfully! It is now pending Academy review.');
      fetchData(); // refresh list
    } catch (error) {
      alert('Failed to submit remittance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800">Academy Remittance</h2>
          <p className="text-sm text-slate-500 mt-1">Record and track fee remittances to the Academic Board.</p>
        </div>
        <div className="bg-primary-50 border border-primary-100 px-6 py-3 rounded-xl text-right">
          <span className="block text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">Current Payable Amount</span>
          <span className="block text-2xl font-black text-primary-700">₹{payableAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Remittance Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-500" />
            New Remittance
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Total Amount (₹) *</label>
              <input 
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transaction ID / UTR *</label>
              <input 
                type="text"
                value={transactionNo}
                onChange={(e) => setTransactionNo(e.target.value)}
                placeholder="e.g. UTR123456789"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Date *</label>
              <input 
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Receipt *</label>
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center">
                {receiptFile ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{receiptFile.name}</span>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">Click to upload receipt</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">PDF, JPG, PNG up to 5MB</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-black shadow-lg shadow-primary-600/25 hover:bg-primary-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : 'Submit Remittance'}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-800">Remittance History</h3>
            <p className="text-xs text-slate-500 mt-1">Past payments made to the Academic Board.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">ID & Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {remittanceHistory.length > 0 ? (
                  remittanceHistory.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{rem.id}</span>
                          <span className="text-xs text-slate-500">{rem.date}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{rem.transactionId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-700">₹{rem.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          rem.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {rem.status === 'Verified' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {rem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors tooltip-trigger" title="View Receipt">
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <p className="text-sm">No remittance history found.</p>
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
