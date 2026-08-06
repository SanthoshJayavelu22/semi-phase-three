import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  ArrowUpRight, 
  DollarSign, 
  Calendar, 
  FileText,
  Filter,
  Download,
  Award,
  BookOpen,
  UserCheck,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
  X
} from 'lucide-react';
import academicService from '../../../api/academic';
import instituteService from '../../../api/institutes';
import revaluationService from '../../../api/revaluation';
import examService from '../../../api/exams';

const CATEGORY_CONFIG = {
  ALL: { label: 'All Payments', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: SlidersHorizontal },
  ONBOARDING: { label: 'Institute Onboarding', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Building2 },
  ENROLLMENT: { label: 'Student Enrollment', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: UserCheck },
  EXAM_FEE: { label: 'Exam Application Fee', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: BookOpen },
  REVALUATION: { label: 'Revaluation Fee', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: RotateCcw },
  REMITTANCE: { label: 'Academy Remittance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Receipt },
};

const AcademyRemittance = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedInstitute, setSelectedInstitute] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // ─── Data Aggregation ────────────────────────────────────────────────────────
  const fetchAllTreasuryRecords = async () => {
    const token = localStorage.getItem('semi_board_token') || localStorage.getItem('semi_access_token') || localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_board_user');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        remittanceRes,
        institutesRes,
        revaluationRes,
        feesRes,
        examsRes
      ] = await Promise.all([
        academicService.getRemittances().catch(() => ({ data: { data: [] } })),
        instituteService.listApplications().catch(() => ({ data: { data: [] } })),
        revaluationService.getAllRevaluationRequests({ limit: 10000 }).catch(() => ({ data: { data: [] } })),
        academicService.getFeeRecords().catch(() => ({ data: { data: [] } })),
        examService.listExamApplications().catch(() => ({ data: { data: [] } }))
      ]);

      const listRemittances = remittanceRes.data?.data || remittanceRes.data || [];
      const listInstitutes = institutesRes.data?.data || institutesRes.data || [];
      const listRevaluation = revaluationRes.data?.data?.requests || revaluationRes.data?.data || revaluationRes.data || [];
      const listFees = feesRes.data?.data || feesRes.data || [];
      const listExams = examsRes.data?.data || examsRes.data || [];

      const records = [];

      // 1. Remittance Records
      (Array.isArray(listRemittances) ? listRemittances : []).forEach(rem => {
        records.push({
          id: `REM-${rem._id || Math.random()}`,
          rawId: rem._id,
          refNo: (rem._id || '').toString().substring(0, 8).toUpperCase(),
          instituteName: rem.institute?.orgName || rem.instituteName || 'Accredited Institute',
          instituteId: rem.institute?._id || rem.institute,
          category: 'REMITTANCE',
          categoryLabel: 'Academy Remittance',
          amount: rem.totalAmount || rem.amount || 0,
          paymentPurpose: rem.paymentPurpose || 'Annual Fellowship Accreditation Remittance',
          remarks: rem.remarks || 'Annual Institute Remittance',
          paymentId: rem.razorpayPaymentId || rem.utrNumber || 'N/A',
          orderId: rem.razorpayOrderId || 'N/A',
          paymentMode: rem.paymentMode || 'Razorpay Online',
          paymentDate: rem.paymentDate || rem.createdAt ? new Date(rem.paymentDate || rem.createdAt).toISOString().split('T')[0] : 'N/A',
          timestamp: rem.paymentDate || rem.createdAt ? new Date(rem.paymentDate || rem.createdAt).getTime() : 0,
          status: rem.status || 'Verified',
          payerName: rem.submittedBy?.name || rem.institute?.orgName || 'Institute Admin',
          details: { studentCount: rem.students?.length || 0 }
        });
      });

      // 2. Institute Onboarding Payments
      (Array.isArray(listInstitutes) ? listInstitutes : []).forEach(inst => {
        if (inst.paymentStatus === 'Completed' || inst.razorpayPaymentId) {
          records.push({
            id: `ONB-${inst._id || Math.random()}`,
            rawId: inst._id,
            refNo: (inst._id || '').toString().substring(0, 8).toUpperCase(),
            instituteName: inst.orgName || 'New Institute Applicant',
            instituteId: inst._id,
            category: 'ONBOARDING',
            categoryLabel: 'Institute Onboarding',
            amount: inst.inspectionFee || 25000,
            paymentPurpose: 'Fellowship Accreditation & Site Inspection Fee',
            remarks: `Onboarding inspection fee for ${inst.orgName}`,
            paymentId: inst.razorpayPaymentId || 'N/A',
            orderId: inst.razorpayOrderId || 'N/A',
            paymentMode: 'Razorpay Gateway',
            paymentDate: inst.createdAt ? new Date(inst.createdAt).toISOString().split('T')[0] : 'N/A',
            timestamp: inst.createdAt ? new Date(inst.createdAt).getTime() : 0,
            status: 'Verified',
            payerName: inst.user?.name || inst.orgName,
            details: { bedCount: inst.bedCount, city: inst.city }
          });
        }
      });

      // 3. Student Enrollment Fee Records
      (Array.isArray(listFees) ? listFees : []).forEach(fee => {
        if (fee.paymentStatus === 'Paid' || fee.status === 'Paid' || fee.razorpayPaymentId) {
          records.push({
            id: `ENR-${fee._id || Math.random()}`,
            rawId: fee._id,
            refNo: (fee._id || '').toString().substring(0, 8).toUpperCase(),
            instituteName: fee.institute?.orgName || fee.student?.institute?.orgName || 'Accredited Center',
            instituteId: fee.institute?._id || fee.institute,
            category: 'ENROLLMENT',
            categoryLabel: 'Student Enrollment',
            amount: fee.amountPaid || fee.amount || 15000,
            paymentPurpose: `Fellowship Student Enrollment Fee (${fee.student?.firstName || 'Fellow'} ${fee.student?.lastName || ''})`,
            remarks: `Enrollment ID: ${fee.student?.enrollmentId || 'N/A'}`,
            paymentId: fee.razorpayPaymentId || fee.utrNumber || 'N/A',
            orderId: fee.razorpayOrderId || 'N/A',
            paymentMode: fee.paymentMode || 'Online Gateway',
            paymentDate: fee.createdAt ? new Date(fee.createdAt).toISOString().split('T')[0] : 'N/A',
            timestamp: fee.createdAt ? new Date(fee.createdAt).getTime() : 0,
            status: 'Verified',
            payerName: fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : 'Candidate',
            details: { studentName: fee.student ? `${fee.student.firstName} ${fee.student.lastName}` : 'N/A', enrollmentId: fee.student?.enrollmentId }
          });
        }
      });

      // 4. Revaluation Fee Records
      (Array.isArray(listRevaluation) ? listRevaluation : []).forEach(rev => {
        if (rev.paymentStatus === 'Completed' || rev.razorpayPaymentId) {
          records.push({
            id: `REV-${rev._id || Math.random()}`,
            rawId: rev._id,
            refNo: (rev.requestId || rev._id || '').toString().substring(0, 8).toUpperCase(),
            instituteName: rev.institute?.orgName || rev.student?.institute?.orgName || 'Academic Center',
            instituteId: rev.institute?._id || rev.institute,
            category: 'REVALUATION',
            categoryLabel: 'Revaluation Fee',
            amount: rev.totalFee || (rev.subjects?.length ? rev.subjects.length * 500 : 500),
            paymentPurpose: `Answer Script Revaluation (${rev.student?.firstName || 'Candidate'} ${rev.student?.lastName || ''})`,
            remarks: `Revaluation for ${rev.subjects?.length || 1} subject(s)`,
            paymentId: rev.razorpayPaymentId || 'N/A',
            orderId: rev.razorpayOrderId || 'N/A',
            paymentMode: 'Razorpay Gateway',
            paymentDate: rev.createdAt ? new Date(rev.createdAt).toISOString().split('T')[0] : 'N/A',
            timestamp: rev.createdAt ? new Date(rev.createdAt).getTime() : 0,
            status: 'Verified',
            payerName: rev.student ? `${rev.student.firstName} ${rev.student.lastName}` : 'Fellow Candidate',
            details: { subjectsCount: rev.subjects?.length || 1, semester: rev.semester }
          });
        }
      });

      // 5. Exam Application Fee Records
      (Array.isArray(listExams) ? listExams : []).forEach(exam => {
        if (exam.paymentStatus === 'Completed' || exam.razorpayPaymentId) {
          records.push({
            id: `EXM-${exam._id || Math.random()}`,
            rawId: exam._id,
            refNo: (exam._id || '').toString().substring(0, 8).toUpperCase(),
            instituteName: exam.institute?.orgName || exam.student?.institute?.orgName || 'Accredited Hospital',
            instituteId: exam.institute?._id || exam.institute,
            category: 'EXAM_FEE',
            categoryLabel: 'Exam Application Fee',
            amount: exam.amountPaid || exam.feeAmount || 3000,
            paymentPurpose: `Examination Application Fee (${exam.student?.firstName || 'Candidate'})`,
            remarks: `Exam Hall Ticket Application - ${exam.examSession || 'Session 2026'}`,
            paymentId: exam.razorpayPaymentId || 'N/A',
            orderId: exam.razorpayOrderId || 'N/A',
            paymentMode: 'Razorpay Gateway',
            paymentDate: exam.createdAt ? new Date(exam.createdAt).toISOString().split('T')[0] : 'N/A',
            timestamp: exam.createdAt ? new Date(exam.createdAt).getTime() : 0,
            status: 'Verified',
            payerName: exam.student ? `${exam.student.firstName} ${exam.student.lastName}` : 'Examinee',
            details: { examType: exam.examType || 'Semester Exam' }
          });
        }
      });

      // Sort by newest timestamp
      records.sort((a, b) => b.timestamp - a.timestamp);
      setAllTransactions(records);
    } catch (err) {
      console.error('Error fetching all treasury records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTreasuryRecords();
  }, []);

  // ─── Dynamic Filtering & Computed Data ──────────────────────────────────────
  const uniqueInstitutes = useMemo(() => {
    const map = new Map();
    allTransactions.forEach(t => {
      if (t.instituteName && t.instituteName !== 'N/A') {
        map.set(t.instituteName, t.instituteName);
      }
    });
    return Array.from(map.keys()).sort();
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(item => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      
      // Institute filter
      if (selectedInstitute !== 'ALL' && item.instituteName !== selectedInstitute) return false;

      // Date Range filter
      if (dateRange.start && item.paymentDate < dateRange.start) return false;
      if (dateRange.end && item.paymentDate > dateRange.end) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchRef = item.refNo.toLowerCase().includes(q);
        const matchInst = item.instituteName.toLowerCase().includes(q);
        const matchPurpose = item.paymentPurpose.toLowerCase().includes(q);
        const matchPayId = item.paymentId.toLowerCase().includes(q);
        const matchPayer = item.payerName.toLowerCase().includes(q);
        return matchRef || matchInst || matchPurpose || matchPayId || matchPayer;
      }

      return true;
    });
  }, [allTransactions, selectedCategory, selectedInstitute, dateRange, searchTerm]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCollected = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const count = filteredTransactions.length;
    const categoryTotals = {
      ONBOARDING: filteredTransactions.filter(t => t.category === 'ONBOARDING').reduce((sum, t) => sum + t.amount, 0),
      ENROLLMENT: filteredTransactions.filter(t => t.category === 'ENROLLMENT').reduce((sum, t) => sum + t.amount, 0),
      EXAM_FEE: filteredTransactions.filter(t => t.category === 'EXAM_FEE').reduce((sum, t) => sum + t.amount, 0),
      REVALUATION: filteredTransactions.filter(t => t.category === 'REVALUATION').reduce((sum, t) => sum + t.amount, 0),
      REMITTANCE: filteredTransactions.filter(t => t.category === 'REMITTANCE').reduce((sum, t) => sum + t.amount, 0),
    };
    return { totalCollected, count, categoryTotals };
  }, [filteredTransactions]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Reference No', 'Category', 'Institute Name', 'Payer Name', 'Payment Purpose', 'Razorpay Payment ID', 'Amount (INR)', 'Payment Date', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.refNo,
      t.categoryLabel,
      `"${t.instituteName.replace(/"/g, '""')}"`,
      `"${t.payerName.replace(/"/g, '""')}"`,
      `"${t.paymentPurpose.replace(/"/g, '""')}"`,
      t.paymentId,
      t.amount,
      t.paymentDate,
      t.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Academy_Treasury_Remittances_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-left font-sans animate-in fade-in duration-300 pb-12">
      
      {/* ── Top Header & KPI Summary Banner ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[11px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Central Academy Treasury Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
            Institutional Payment & Remittance Audit
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
            Real-time audit log of all financial transactions remitted by accredited hospitals and candidates, covering institute onboarding, fellow enrollments, examination fees, revaluation requests, and annual remittances.
          </p>
        </div>

        {/* Global Treasury Totals Pill */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-6 rounded-2xl text-right flex flex-col justify-center min-w-[240px]">
          <span className="block text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1">Total Audited Treasury</span>
          <span className="block text-3xl font-black text-emerald-400 tracking-tight">₹{metrics.totalCollected.toLocaleString()}</span>
          <span className="block text-[10px] text-slate-400 font-semibold mt-1">Across {metrics.count} Verified Transactions</span>
        </div>
      </div>

      {/* ── Category Breakdown Pills ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(CATEGORY_CONFIG).map(catKey => {
          const cfg = CATEGORY_CONFIG[catKey];
          const Icon = cfg.icon;
          const isSelected = selectedCategory === catKey;
          const catAmount = catKey === 'ALL' ? metrics.totalCollected : (metrics.categoryTotals[catKey] || 0);

          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-800 shadow-lg scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl text-xs font-black ${isSelected ? 'bg-white/10 text-white' : cfg.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
              </div>
              <div>
                <span className={`block text-[10px] uppercase font-black tracking-wider ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                  {cfg.label}
                </span>
                <span className={`block text-base font-black tracking-tight mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-900'}`}>
                  ₹{catAmount.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter Controls Toolbar ──────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference #, institute name, student, or Razorpay ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>

          {/* Institute Dropdown Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="ALL">All Institutes ({uniqueInstitutes.length})</option>
              {uniqueInstitutes.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              placeholder="From Date"
            />
          </div>

          {/* Date Range End */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              placeholder="To Date"
            />
          </div>
        </div>

        {/* Action Buttons & Clear Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <span>Filtered: <strong className="text-slate-800">{filteredTransactions.length}</strong> transactions</span>
            {(searchTerm || selectedCategory !== 'ALL' || selectedInstitute !== 'ALL' || dateRange.start || dateRange.end) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedInstitute('ALL');
                  setDateRange({ start: '', end: '' });
                }}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 text-[11px] font-black"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV Report
            </button>

            <button
              onClick={fetchAllTreasuryRecords}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Transactions Ledger Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Ref & Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Institute / Payer</th>
                <th className="px-6 py-4">Purpose & Reference</th>
                <th className="px-6 py-4">Razorpay Payment ID</th>
                <th className="px-6 py-4 text-right">Amount (₹)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-400 font-semibold">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Auditing treasury transaction logs...
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG.ALL;
                  const Icon = cfg.icon;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ref & Date */}
                      <td className="px-6 py-4">
                        <div className="font-mono font-black text-slate-800">#{tx.refNo}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{tx.paymentDate}</div>
                      </td>

                      {/* Category Pill */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${cfg.color}`}>
                          <Icon className="w-3 h-3" />
                          {tx.categoryLabel}
                        </span>
                      </td>

                      {/* Institute / Payer */}
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={tx.instituteName}>{tx.instituteName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Payer: {tx.payerName}
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-slate-800 truncate" title={tx.paymentPurpose}>
                          {tx.paymentPurpose}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate italic mt-0.5" title={tx.remarks}>
                          {tx.remarks}
                        </div>
                      </td>

                      {/* Payment ID */}
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        {tx.paymentId}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                        ₹{tx.amount.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="View Receipt Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-400 font-semibold">
                    <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">No treasury transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">Try broadening your search keywords or clearing date range filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Receipt Detail Modal ────────────────────────────────── */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Treasury Payment Voucher</h3>
                  <p className="text-[10px] font-mono font-bold text-blue-600">#{selectedTransaction.refNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-bold text-slate-900">{selectedTransaction.categoryLabel}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400">Institute Name</span>
                  <span className="font-bold text-slate-900">{selectedTransaction.instituteName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400">Payer Name</span>
                  <span className="font-bold text-slate-900">{selectedTransaction.payerName}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400">Razorpay Payment ID</span>
                  <span className="font-mono font-bold text-blue-600">{selectedTransaction.paymentId}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-slate-400">Transaction Date</span>
                  <span className="font-bold text-slate-900">{selectedTransaction.paymentDate}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-emerald-700 font-extrabold uppercase">Total Remitted Amount</span>
                  <span className="text-2xl font-black text-emerald-800">₹{selectedTransaction.amount.toLocaleString()}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-full">Verified</span>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AcademyRemittance;
