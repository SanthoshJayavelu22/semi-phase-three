import { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, CheckCircle2, Building2, ShieldCheck, ArrowUpRight, DollarSign, Calendar, FileText } from 'lucide-react';
import academicService from '../../../api/academic';

const AcademyRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRemittance, setSelectedRemittance] = useState(null);

  const fetchRemittances = async () => {
    setLoading(true);
    try {
      const res = await academicService.getRemittances();
      const rawData = res.data?.data || res.data || [];
      const mapped = (Array.isArray(rawData) ? rawData : []).map(rem => ({
        id: rem._id,
        refNo: (rem._id || '').toString().substring(0, 8).toUpperCase(),
        instituteName: rem.institute?.orgName || 'N/A',
        totalAmount: rem.totalAmount || rem.amount || 0,
        paymentPurpose: rem.paymentPurpose || 'Annual Fellowship Accreditation Remittance',
        remarks: rem.remarks || '',
        paymentId: rem.razorpayPaymentId || rem.utrNumber || 'N/A',
        orderId: rem.razorpayOrderId || 'N/A',
        paymentMode: rem.paymentMode || 'Razorpay Online',
        paymentDate: rem.paymentDate || rem.createdAt ? new Date(rem.paymentDate || rem.createdAt).toISOString().split('T')[0] : 'N/A',
        status: rem.status || 'Verified',
        students: rem.students || []
      }));
      setRemittances(mapped);
    } catch (err) {
      console.error('Error fetching remittances in Academy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemittances();
  }, []);

  const filteredRemittances = remittances.filter(rem => 
    rem.instituteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rem.paymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rem.paymentPurpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rem.refNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = remittances.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <div className="space-y-6 text-left font-sans animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Academy Central Treasury Audit
          </div>
          <h2 className="text-2xl font-black tracking-tight">Institutional Remittance Records</h2>
          <p className="text-xs text-slate-300 max-w-xl font-medium">
            Monitor and audit all fee remittances, accreditation payments, and Razorpay gateway transactions submitted by accredited institutes.
          </p>
        </div>

        {/* Global Stats Badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 rounded-2xl text-right flex flex-col justify-center">
          <span className="block text-[10px] text-blue-300 font-extrabold uppercase tracking-widest mb-0.5">Total Treasury Remitted</span>
          <span className="block text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">₹{totalCollected.toLocaleString()}</span>
        </div>
      </div>

      {/* Control Bar: Search & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institute, Razorpay ID, purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-bold">
            Showing <strong className="text-slate-800">{filteredRemittances.length}</strong> of {remittances.length} Records
          </span>
          <button
            onClick={fetchRemittances}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>
      </div>

      {/* Remittance Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Ref & Date</th>
                <th className="px-6 py-4">Institute</th>
                <th className="px-6 py-4">Purpose & Remarks</th>
                <th className="px-6 py-4">Razorpay Payment ID</th>
                <th className="px-6 py-4">Amount (₹)</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading treasury remittance logs...
                  </td>
                </tr>
              ) : filteredRemittances.length > 0 ? (
                filteredRemittances.map((rem) => (
                  <tr key={rem.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-800">#{rem.refNo}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{rem.paymentDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        {rem.instituteName}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate" title={rem.paymentPurpose}>{rem.paymentPurpose}</div>
                      {rem.remarks && (
                        <div className="text-[10px] text-slate-400 truncate italic" title={rem.remarks}>
                          Note: {rem.remarks}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">
                      {rem.paymentId}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-sm">
                      ₹{rem.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-semibold">
                    No institutional remittance records matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AcademyRemittance;
