import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  TrendingUp,
  Minus,
  CreditCard,
  RefreshCw,
  X,
  Check,
  UserCheck,
  User,
  Mail,
  Building2,
  Activity,
  Plus,
  Edit,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import revaluationService from '../../../api/revaluation';

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'PENDING', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
  { value: 'ASSIGNED', label: 'Assigned', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: UserCheck },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Activity },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: XCircle },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: X },
];

const getStatusBadge = (status) => {
  const found = STATUS_OPTIONS.find(s => s.value === status);
  return found || STATUS_OPTIONS[0];
};

const getSubjectProgress = (request) => {
  const total = request.subjects?.length || 0;
  const evaluated = new Set((request.revaluationResults || []).map((r) => r.subjectCode).filter(Boolean)).size;
  return { evaluated, total };
};

const AcademyRevaluation = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [instituteFilter, setInstituteFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Detail View State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Modal State
  const [actionModal, setActionModal] = useState(null); // 'status' | 'marks' | null

  const itemsPerPage = 10;

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const res = await revaluationService.getAcademySummary();
      const data = res.data?.data || res.data || {};
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setToast({ message: err.parsedMessage || 'Failed to load summary', type: 'error' });
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 10000 };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (instituteFilter !== 'All') params.institute = instituteFilter;
      if (semesterFilter !== 'All') params.semester = parseInt(semesterFilter);
      if (academicYearFilter !== 'All') params.academicYear = academicYearFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await revaluationService.getAllRevaluationRequests(params);
      const data = res.data?.data || res.data || {};
      const list = data.requests || data.results || data;
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setToast({ message: err.parsedMessage || 'Failed to load revaluation requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, instituteFilter, semesterFilter, academicYearFilter, searchQuery]);

  const fetchData = useCallback(async () => {
    await Promise.all([fetchSummary(), fetchRequests()]);
  }, [fetchSummary, fetchRequests]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // ─── Computed Values ──────────────────────────────────────────────────────
  const institutes = useMemo(() => {
    const stats = summary?.instituteStats || [];
    return stats
      .filter((s) => s.instituteName)
      .map((s) => ({ _id: s._id, name: s.instituteName, count: s.count || 0 }));
  }, [summary]);

  const academicYears = useMemo(() => {
    const set = new Set();
    requests.forEach((r) => {
      if (r.academicYear) set.add(r.academicYear);
    });
    return [...set].sort().reverse();
  }, [requests]);

  const semesters = useMemo(() => {
    const set = new Set();
    requests.forEach((r) => {
      if (r.semester) set.add(r.semester);
    });
    return [...set].sort((a, b) => a - b);
  }, [requests]);

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (statusFilter !== 'All') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (instituteFilter !== 'All') {
      filtered = filtered.filter((r) => String(r.institute?._id || r.institute) === String(instituteFilter));
    }

    if (semesterFilter !== 'All') {
      filtered = filtered.filter((r) => String(r.semester) === String(semesterFilter));
    }

    if (academicYearFilter !== 'All') {
      filtered = filtered.filter((r) => r.academicYear === academicYearFilter);
    }

    return filtered;
  }, [requests, statusFilter, instituteFilter, semesterFilter, academicYearFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getGrade = (marks, total = 100) => {
    if (marks === null || marks === undefined || marks === '') return '';
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'O';
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B+';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const getResultBadge = (finalResult) => {
    if (finalResult === 'CHANGED') {
      return { label: 'Marks Changed', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <TrendingUp className="w-3.5 h-3.5" /> };
    }
    if (finalResult === 'UNCHANGED') {
      return { label: 'No Change', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Minus className="w-3.5 h-3.5" /> };
    }
    return { label: 'Pending', color: 'text-slate-400 bg-slate-50 border-slate-200', icon: <Clock className="w-3.5 h-3.5" /> };
  };

  const canTakeAction = (request) => {
    return !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleViewRequest = async (request) => {
    setIsDetailOpen(true);
    setSelectedRequest(request);
    setDetailLoading(true);
    try {
      const res = await revaluationService.getRevaluationRequestById(request._id);
      setSelectedRequest(res.data?.data || res.data);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setToast({ message: err.parsedMessage || 'Failed to load request details', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    setToast({ message: 'Data refreshed!', type: 'success' });
  };

  const handleStatusUpdate = async (requestId, statusData) => {
    setSubmitting(true);
    try {
      await revaluationService.updateRequestStatus(requestId, statusData);
      setToast({ message: 'Request status updated successfully', type: 'success' });
      setActionModal(null);
      await fetchData();
      if (isDetailOpen && selectedRequest?._id === requestId) {
        await handleViewRequest(selectedRequest);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setToast({ message: err.parsedMessage || 'Failed to update request status', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarksSubmit = async (requestId, marksData) => {
    setSubmitting(true);
    try {
      await revaluationService.addRevaluationResult(requestId, marksData);
      setToast({ message: 'Revaluation result added successfully', type: 'success' });
      setActionModal(null);
      await fetchData();
      if (isDetailOpen && selectedRequest?._id === requestId) {
        await handleViewRequest(selectedRequest);
      }
    } catch (err) {
      console.error('Error adding revaluation result:', err);
      setToast({ message: err.parsedMessage || 'Failed to add revaluation result', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveResult = async (resultId, requestId) => {
    setSubmitting(true);
    try {
      await revaluationService.approveRevaluationResult(resultId, { isFinal: true });
      setToast({ message: 'Revaluation result approved and published', type: 'success' });
      if (isDetailOpen && selectedRequest?._id === requestId) {
        await handleViewRequest(selectedRequest);
      }
      await fetchData();
    } catch (err) {
      console.error('Error approving result:', err);
      setToast({ message: err.parsedMessage || 'Failed to approve revaluation result', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render Summary Cards ──────────────────────────────────────────────────
  const renderSummaryCards = () => {
    const cards = [
      { label: 'Total', value: summary?.total || 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: <FileText className="w-5 h-5 text-blue-500" /> },
      { label: 'Pending', value: summary?.pending || 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <Clock className="w-5 h-5 text-amber-500" /> },
      { label: 'Under Review', value: summary?.underReview || 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: <Eye className="w-5 h-5 text-blue-500" /> },
      { label: 'In Progress', value: summary?.inProgress || 0, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: <Activity className="w-5 h-5 text-purple-500" /> },
      { label: 'Completed', value: summary?.completed || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
      { label: 'Marks Changed', value: summary?.changed || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
      { label: 'No Change', value: summary?.unchanged || 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', icon: <Minus className="w-5 h-5 text-amber-500" /> },
      { label: 'Subjects', value: summary?.subjectsCount || 0, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', icon: <BookOpen className="w-5 h-5 text-indigo-500" /> },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {cards.map((card) => (
          <div key={card.label} className={`${card.bg} border rounded-2xl p-4 text-center transition-all hover:shadow-md hover:scale-[1.02] duration-200`}>
            <div className="flex items-center justify-center mb-2">{card.icon}</div>
            <span className={`block text-2xl font-black ${card.color}`}>{card.value}</span>
            <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">{card.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // ─── Render Institute Breakdown ────────────────────────────────────────────
  const renderInstituteBreakdown = () => {
    const stats = summary?.instituteStats || [];
    if (stats.length === 0) return null;

    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Institute Breakdown</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Requests by institute</p>
          </div>
        </div>
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Institute</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Total</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Pending</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {stats.map((stat, idx) => (
                <tr key={stat._id || idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{stat.instituteName || 'Unknown Institute'}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{stat.count || 0}</td>
                  <td className="px-4 py-3 text-center font-bold text-amber-600">{stat.pending || 0}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">{stat.completed || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── Render Filters ───────────────────────────────────────────────────────
  const renderFilters = () => (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, enrollment ID, or institute..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
        >
          <option value="All">All Status</option>
          {STATUS_OPTIONS.filter(s => s.value !== 'All').map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={instituteFilter}
          onChange={(e) => {
            setInstituteFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
        >
          <option value="All">All Institutes</option>
          {institutes.map((inst) => (
            <option key={inst._id} value={inst._id}>
              {inst.name} ({inst.count})
            </option>
          ))}
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => {
            setSemesterFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
        >
          <option value="All">All Semesters</option>
          {semesters.map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>

        <select
          value={academicYearFilter}
          onChange={(e) => {
            setAcademicYearFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
        >
          <option value="All">All Years</option>
          {academicYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // ─── Render Requests Table ────────────────────────────────────────────────
  const renderRequestsTable = () => (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Request / Student</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Institute</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Semester</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Subjects</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Fee</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
            <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-36">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {paginatedRequests.map((request, idx) => {
            const statusBadge = getStatusBadge(request.status);
            const resultBadge = getResultBadge(request.finalResult);
            const student = request.student;
            const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
            const isActionable = canTakeAction(request);
            const StatusIcon = statusBadge.icon;
            const { evaluated, total } = getSubjectProgress(request);

            return (
              <tr key={request._id} className={`hover:bg-slate-50/50 transition-colors group ${!isActionable ? 'opacity-75' : ''}`}>
                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                  {String(globalIdx).padStart(2, '0')}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                      {student ? `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase() : '??'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 text-[10px]">
                          {request.requestId || request._id.toString().substring(0, 8).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold ${resultBadge.color} border px-1.5 py-0.5 rounded-full`}>
                          {resultBadge.icon}
                          {resultBadge.label}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 block text-[11px]">
                        {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {student?.enrollmentId || 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-bold text-slate-700 block max-w-[140px] truncate text-[11px]" title={request.institute?.orgName}>
                    {request.institute?.orgName || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-slate-700 text-[11px]">
                  Sem {request.semester || 'N/A'}
                </td>
                <td className="px-4 py-3.5 text-center font-bold text-slate-700 text-[11px]">
                  {total > 0 && evaluated > 0 ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-slate-700 text-[11px]">{evaluated}/{total}</span>
                      <span className={`text-[8px] font-bold uppercase ${evaluated >= total ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {evaluated >= total ? '✓ Evaluated' : 'Evaluating'}
                      </span>
                    </div>
                  ) : (
                    total
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800 text-[11px]">{formatCurrency(request.totalFee)}</span>
                    <span className={`text-[8px] font-bold uppercase ${request.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {request.paymentStatus === 'PAID' ? '✓ Paid' : request.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusBadge.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusBadge.label}
                    {request.status === 'IN_PROGRESS' && total > 0 && evaluated > 0 && (
                      <span className="opacity-70">· {evaluated}/{total}</span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-center gap-1">
                    {/* View Button - Always visible */}
                    <button
                      onClick={() => handleViewRequest(request)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Action Button - Only for actionable requests */}
                    {isActionable && (
                      <div className="relative">
                        <button
                          onClick={() => setActionModal({
                            type: 'action_menu',
                            request,
                            isOpen: true
                          })}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Take Action"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!isActionable && (
                      <span className="text-[8px] text-slate-400 font-medium px-2">Complete</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredRequests.length === 0 && (
            <tr>
              <td colSpan="8" className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">No revaluation requests found</p>
                  <p className="text-xs text-slate-400">Try adjusting your filters above</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ─── Render Pagination ────────────────────────────────────────────────────
  const renderPagination = () => (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
      <span className="text-[10px] text-slate-400 font-semibold">
        Showing {filteredRequests.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-blue-600 shadow-sm">
          {currentPage} / {totalPages}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // ─── Render Action Menu ──────────────────────────────────────────────────
  const renderActionMenu = () => {
    if (!actionModal || actionModal.type !== 'action_menu') return null;

    const { request } = actionModal;
    const menuItems = [
      {
        id: 'status',
        label: 'Update Status',
        icon: <Edit className="w-4 h-4" />,
        color: 'text-indigo-600',
        bg: 'hover:bg-indigo-50',
        onClick: () => {
          setActionModal({
            type: 'status',
            request,
            status: request.status,
            comments: '',
            assignedEvaluator: '',
          });
        }
      },
      {
        id: 'marks',
        label: 'Add Revaluation Result',
        icon: <Plus className="w-4 h-4" />,
        color: 'text-emerald-600',
        bg: 'hover:bg-emerald-50',
        onClick: () => {
          const firstSubject = request.subjects?.[0];
          setActionModal({
            type: 'marks',
            request,
            subjectCode: firstSubject?.subjectCode || '',
            subjectName: firstSubject?.subjectName || '',
            revisedTotalMarks: '',
            evaluatorComments: '',
            isFinal: true,
          });
        }
      },
    ];

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden scale-in-center animate-in zoom-in-95 duration-150">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MoreVertical className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Actions</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {request.requestId || request._id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActionModal(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${item.bg} transition-all group`}
              >
                <span className={item.color}>{item.icon}</span>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={() => setActionModal(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Status Update Modal ──────────────────────────────────────────
  const renderStatusModal = () => {
    if (!actionModal || actionModal.type !== 'status') return null;

    const { request, status, comments, assignedEvaluator } = actionModal;

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden scale-in-center animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Update Status</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {request.requestId || request._id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActionModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Student Info Summary */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                {request.student ? `${request.student.firstName?.[0] || ''}${request.student.lastName?.[0] || ''}`.toUpperCase() : '??'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {request.student ? `${request.student.firstName || ''} ${request.student.lastName || ''}`.trim() : 'Unknown'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">{request.student?.enrollmentId || 'N/A'}</p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-[10px] text-slate-400 block">Current Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(request.status).color}`}>
                  {request.status}
                </span>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                New Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.filter(s => s.value !== 'All').map((s) => {
                  const isSelected = status === s.value;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setActionModal((prev) => ({ ...prev, status: s.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                        isSelected
                          ? `${s.color} border-current shadow-sm`
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assign Evaluator (only when ASSIGNED) */}
            {status === 'ASSIGNED' && (
              <div className="animate-in slide-in-from-top duration-200">
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                  Assign Evaluator <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={assignedEvaluator}
                    onChange={(e) => setActionModal((prev) => ({ ...prev, assignedEvaluator: e.target.value }))}
                    placeholder="e.g. Dr. A. Kumar"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                Comments <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setActionModal((prev) => ({ ...prev, comments: e.target.value }))}
                rows="3"
                placeholder="Add any notes or remarks..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              onClick={() => setActionModal(null)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const payload = { status };
                if (comments.trim()) payload.comments = comments.trim();
                if (status === 'ASSIGNED' && assignedEvaluator.trim()) {
                  payload.assignedEvaluator = assignedEvaluator.trim();
                }
                handleStatusUpdate(request._id, payload);
              }}
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Update Status
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Marks Modal ──────────────────────────────────────────────────
  const renderMarksModal = () => {
    if (!actionModal || actionModal.type !== 'marks') return null;

    const {
      request,
      subjectCode,
      subjectName,
      revisedTotalMarks,
      evaluatorComments,
      isFinal
    } = actionModal;

    const selectedSubject = request.subjects?.find(s => s.subjectCode === subjectCode);
    const computedGrade = revisedTotalMarks === '' ? '' : getGrade(Number(revisedTotalMarks));

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden scale-in-center animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Add Revaluation Result</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {request.requestId || request._id}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActionModal(null)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Student Info Summary */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                {request.student ? `${request.student.firstName?.[0] || ''}${request.student.lastName?.[0] || ''}`.toUpperCase() : '??'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {request.student ? `${request.student.firstName || ''} ${request.student.lastName || ''}`.trim() : 'Unknown'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">{request.student?.enrollmentId || 'N/A'}</p>
              </div>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                Select Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={subjectCode}
                onChange={(e) => {
                  const subj = request.subjects.find(s => s.subjectCode === e.target.value);
                  setActionModal((prev) => ({
                    ...prev,
                    subjectCode: e.target.value,
                    subjectName: subj?.subjectName || '',
                  }));
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
              >
                <option value="">Select a subject...</option>
                {request.subjects?.map((subject) => (
                  <option key={subject.subjectCode} value={subject.subjectCode}>
                    {subject.subjectName} ({subject.originalMarks}%)
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-medium">Original Marks:</span>
                  <span className="font-bold text-slate-700">{selectedSubject.originalMarks}%</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-medium">Grade:</span>
                  <span className="font-bold text-slate-700">{selectedSubject.originalGrade || 'N/A'}</span>
                </div>
              )}
            </div>

            {/* Revised Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                  Revised Marks <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={revisedTotalMarks}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, revisedTotalMarks: e.target.value }))}
                  placeholder="0-100"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                  Revised Grade <span className="text-rose-500">*</span>
                </label>
                <div className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-black transition-all ${computedGrade ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'}`}>
                  {computedGrade || 'Auto'}
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-1.5">
                  Auto-calculated from revised marks
                </p>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 mb-2">
                Evaluator Comments <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={evaluatorComments}
                onChange={(e) => setActionModal((prev) => ({ ...prev, evaluatorComments: e.target.value }))}
                rows="3"
                placeholder="Notes from the evaluator..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
              />
            </div>

            {/* Final Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50/50 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all">
              <input
                type="checkbox"
                checked={isFinal}
                onChange={(e) => setActionModal((prev) => ({ ...prev, isFinal: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-700 block">Mark as Final & Republish</span>
                <span className="text-[9px] text-slate-400 font-medium">
                  This will update the student's original result with the revised marks
                </span>
              </div>
            </label>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              onClick={() => setActionModal(null)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const payload = {
                  subjectCode,
                  subjectName,
                  revisedTotalMarks: Number(revisedTotalMarks),
                  revisedGrade: computedGrade,
                  isFinal,
                };
                if (evaluatorComments.trim()) payload.evaluatorComments = evaluatorComments.trim();
                handleMarksSubmit(request._id, payload);
              }}
              disabled={submitting || !subjectCode || !revisedTotalMarks || !computedGrade}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Add Result
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Detail Modal ──────────────────────────────────────────────────
  const renderDetailModal = () => {
    if (!isDetailOpen || !selectedRequest) return null;

    const request = selectedRequest;
    const statusBadge = getStatusBadge(request.status);
    const resultBadge = getResultBadge(request.finalResult);
    const student = request.student;
    const hasRevaluationResults = request.revaluationResults && request.revaluationResults.length > 0;
    const isActionable = canTakeAction(request);
    const StatusIcon = statusBadge.icon;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Request Details</h3>
                <p className="text-[10px] font-mono font-bold text-blue-600">
                  {request.requestId || request._id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${statusBadge.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusBadge.label}
              </span>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left">
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Student Profile */}
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
                      {student ? `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase() : '??'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-black text-slate-800">
                        {student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown Student'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="font-mono font-bold text-blue-600">{student?.enrollmentId || 'N/A'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student?.email || 'N/A'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {request.institute?.orgName || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block">Semester</span>
                      <span className="text-sm font-black text-slate-800">Sem {request.semester || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Total Fee</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(request.totalFee)}</span>
                    <span className={`block text-[8px] font-bold uppercase ${request.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {request.paymentStatus === 'PAID' ? '✓ Paid' : request.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-center">
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Subjects</span>
                    {(() => {
                      const { evaluated, total } = getSubjectProgress(request);
                      return total > 0 && evaluated > 0 ? (
                        <>
                          <span className="text-lg font-black text-slate-800">{evaluated}<span className="text-xs text-slate-400">/{total}</span></span>
                          <span className={`block text-[8px] font-bold uppercase ${evaluated >= total ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {evaluated >= total ? '✓ All Evaluated' : 'Evaluating'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black text-slate-800">{total}</span>
                          <span className="block text-[8px] text-slate-400 font-medium">Requested</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-center">
                    <span className="text-[8px] uppercase font-black text-slate-400 block">Final Result</span>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-black ${resultBadge.color} border px-3 py-1 rounded-full mt-1`}>
                      {resultBadge.icon}
                      {resultBadge.label}
                    </span>
                  </div>
                </div>

                {/* Payment Details */}
                {request.paymentId && (
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                    <h5 className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" /> Payment Details
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Payment ID</span>
                        <p className="font-mono font-bold text-slate-700 break-all text-[10px]">{request.paymentId}</p>
                      </div>
                      {request.paymentOrderId && (
                        <div>
                          <span className="text-slate-400 font-medium">Order ID</span>
                          <p className="font-mono font-bold text-slate-700 break-all text-[10px]">{request.paymentOrderId}</p>
                        </div>
                      )}
                      {request.paymentDate && (
                        <div>
                          <span className="text-slate-400 font-medium">Paid On</span>
                          <p className="font-bold text-slate-700 text-[10px]">{formatDateTime(request.paymentDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subjects */}
                {request.subjects && request.subjects.length > 0 && (
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" /> Subjects for Revaluation
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {request.subjects.map((subject, idx) => {
                        const hasResult = request.revaluationResults?.some(r => r.subjectCode === subject.subjectCode);
                        return (
                          <div key={idx} className={`border rounded-xl p-3 flex items-center justify-between ${hasResult ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200'}`}>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{subject.subjectName}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{subject.subjectCode}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Original</span>
                              <span className="text-sm font-black text-slate-700">{subject.originalMarks}%</span>
                              {hasResult && (
                                <span className="block text-[8px] text-emerald-600 font-bold">✓ Reviewed</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Revaluation Results */}
                {hasRevaluationResults && (
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" /> Revaluation Results
                    </h5>
                    <div className="space-y-2.5">
                      {request.revaluationResults.map((result, idx) => {
                        const isApproved = result.reviewStatus === 'APPROVED';
                        return (
                          <div key={idx} className={`border rounded-xl p-3 flex items-center justify-between ${isApproved ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`}>
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">{result.subjectName}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{result.subjectCode}</span>
                              <span className={`inline-flex items-center gap-1 ml-2 text-[8px] font-bold ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {isApproved ? 'Approved' : 'Pending Approval'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block">Original</span>
                                <span className="text-xs font-black text-slate-600">{result.originalMarks}%</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block">Revised</span>
                                <span className={`text-xs font-black ${result.marksChange > 0 ? 'text-emerald-600' : result.marksChange < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                                  {result.revisedTotalMarks}%
                                </span>
                              </div>
                              <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                result.marksChange > 0 ? 'bg-emerald-100 text-emerald-700' :
                                result.marksChange < 0 ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {result.marksChange > 0 ? '+' : ''}{result.marksChange}%
                              </div>
                              {!isApproved && isActionable && (
                                <button
                                  onClick={() => handleApproveResult(result._id, request._id)}
                                  disabled={submitting}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Audit Trail */}
                {request.auditTrail && request.auditTrail.length > 0 && (
                  <div>
                    <h5 className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Activity Timeline
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {request.auditTrail.slice().reverse().map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                                {entry.action}
                              </span>
                              <span className="text-slate-400">→</span>
                              <span className={`text-[10px] font-bold ${getStatusBadge(entry.newStatus).color} border px-2 py-0.5 rounded-full`}>
                                {entry.newStatus}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{formatDateTime(entry.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(request.submittedDate)}
              </span>
              {request.evaluatedDate && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Evaluated: {formatDate(request.evaluatedDate)}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isActionable && (
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setTimeout(() => {
                      setActionModal({
                        type: 'action_menu',
                        request,
                        isOpen: true
                      });
                    }, 200);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                  Take Action
                </button>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Revaluation Management</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Review, assign and evaluate revaluation requests from institutes
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ─── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Summary Cards ───────────────────────────────────────────────────── */}
      {renderSummaryCards()}

      {/* ─── Institute Breakdown ─────────────────────────────────────────────── */}
      {renderInstituteBreakdown()}

      {/* ─── Requests Table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Revaluation Requests</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
              {filteredRequests.length} of {requests.length} requests
            </p>
          </div>
        </div>

        {renderFilters()}

        <div className="mt-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {renderRequestsTable()}
              {totalPages > 1 && renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}
      {renderDetailModal()}
      {renderActionMenu()}
      {renderStatusModal()}
      {renderMarksModal()}

      {/* ─── Confirmation Modal ─────────────────────────────────────────────── */}
      {confirmConfig && (
        <ConfirmModal
          isOpen
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

export default AcademyRevaluation;
