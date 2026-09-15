import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Inbox,
  Clock,
  AlertCircle,
  Download,
  ShieldCheck,
  User,
  Calendar,
  Award,
  Eye,
  Search,
  Users,
  FileCheck2,
  GraduationCap,
  ExternalLink,
  RotateCcw,
  Check,
  X,
  ListChecks,
  BookOpenCheck
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import academicService from '../../../api/academic';
import { getUploadUrl } from '../../../api/apiClient';

const ATTENDANCE_THRESHOLD = 75;

export default function AcademyThesisVerification({
  students = [],
  fetchBoardData = () => {}
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  // Active record being reviewed in the modal (student + examination)
  const [inspectingRecord, setInspectingRecord] = useState(null);

  // Decision / action states
  const [actionType, setActionType] = useState(null); // 'Certify' | 'Reject' | null
  const [actionRemarks, setActionRemarks] = useState('');
  const [attendanceInput, setAttendanceInput] = useState('');
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Extract unique filter dropdown values
  const institutes = useMemo(() => [...new Set(students.map(s => s.institute).filter(Boolean))].sort(), [students]);
  const courses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);
  const batches = useMemo(() => [...new Set(students.map(s => s.batch).filter(Boolean))].sort(), [students]);

  // Flatten students -> (student, examination) verification records
  // Sequential: only show the CURRENT examination for each student
  // If Exam 1 is Approved → show only Exam 2, otherwise show only Exam 1
  const studentRecords = useMemo(() => {
    const records = [];
    (students || []).forEach(s => {
      const exams = (s.examinations && s.examinations.length > 0)
        ? s.examinations
        : [{ examinationNumber: 1, attendancePercentage: 0, thesisApproved: false, eligibilityStatus: 'Pending' }];

      const exam1 = exams.find(e => e.examinationNumber === 1);
      const exam2 = exams.find(e => e.examinationNumber === 2);

      // Determine which single examination to show for this student
      const currentExam = (exam1 && exam1.eligibilityStatus === 'Approved') ? exam2 : exam1;

      if (!currentExam) return;

      const attendance = Number(currentExam.attendancePercentage ?? 0);
      const thesisUrl = currentExam.thesisDocumentUrl || '';
      const thesisApproved = Boolean(currentExam.thesisApproved);
      const status = currentExam.eligibilityStatus || 'Pending';
      records.push({
        ...s,
        examinationNumber: currentExam.examinationNumber,
        attendancePercentage: attendance,
        thesisApproved,
        thesisDocumentUrl: thesisUrl,
        eligibilityStatus: status,
        rejectionNotes: currentExam.rejectionNotes || '',
      });
    });
    return records;
  }, [students]);

  const isReady = (record) => record.attendancePercentage >= ATTENDANCE_THRESHOLD && record.thesisApproved;

  // Filter logic
  const filteredRecords = useMemo(() => {
    return studentRecords.filter(record => {
      // Tab filter
      if (activeTab === 'pending' && !(record.eligibilityStatus === 'Pending' && !isReady(record))) return false;
      if (activeTab === 'ready' && !(record.eligibilityStatus === 'Pending' && isReady(record))) return false;
      if (activeTab === 'certified' && record.eligibilityStatus !== 'Approved') return false;
      if (activeTab === 'rejected' && record.eligibilityStatus !== 'Rejected') return false;

      // Dropdown filters
      if (filterInstitute && record.institute !== filterInstitute) return false;
      if (filterCourse && record.course !== filterCourse) return false;
      if (filterBatch && record.batch !== filterBatch) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (record.fullName || `${record.firstName || ''} ${record.lastName || ''}`).toLowerCase();
        return (
          fullName.includes(q) ||
          (record.enrollmentNo || record.enrollmentId || '').toLowerCase().includes(q) ||
          (record.email || '').toLowerCase().includes(q) ||
          (record.medicalCouncilRegistrationNumber || '').toLowerCase().includes(q) ||
          (record.institute || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [studentRecords, activeTab, filterInstitute, filterCourse, filterBatch, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const pending = studentRecords.filter(r => r.eligibilityStatus === 'Pending' && !isReady(r)).length;
    const ready = studentRecords.filter(r => r.eligibilityStatus === 'Pending' && isReady(r)).length;
    const certified = studentRecords.filter(r => r.eligibilityStatus === 'Approved').length;
    const rejected = studentRecords.filter(r => r.eligibilityStatus === 'Rejected').length;
    return { total: studentRecords.length, pending, ready, certified, rejected };
  }, [studentRecords]);

  const documentCount = (record) => {
    const s = record.documents || {};
    const certs = [s.nblsCertificateUrl, s.nclsCertificateUrl, s.ntlsCertificateUrl, s.nulsCertificateUrl].filter(Boolean).length;
    return certs + (record.thesisDocumentUrl ? 1 : 0);
  };

  const showToast = (type, message) => setToast({ type, message });

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleOpenRecord = (record) => {
    setInspectingRecord(record);
    setActionType(null);
    setActionRemarks(record.rejectionNotes || '');
    setAttendanceInput(String(record.attendancePercentage || ''));
  };

  const handleUpdateAttendance = async () => {
    if (!inspectingRecord) return;
    const value = parseInt(attendanceInput, 10);
    if (isNaN(value) || value < 0 || value > 100) {
      showToast('error', 'Attendance must be a number between 0 and 100.');
      return;
    }
    setIsUpdatingAttendance(true);
    try {
      const studentId = inspectingRecord._id || inspectingRecord.id;
      await academicService.updateAcademicMetrics(studentId, {
        examinationNumber: inspectingRecord.examinationNumber,
        attendancePercentage: value,
      });
      showToast('success', `Attendance updated to ${value}% for ${inspectingRecord.fullName} (Exam ${inspectingRecord.examinationNumber}).`);
      setInspectingRecord(prev => prev ? { ...prev, attendancePercentage: value } : prev);
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      console.error('Error updating attendance:', err);
      showToast('error', err.parsedMessage || err.message || 'Failed to update attendance.');
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleThesisToggle = async (record, approved) => {
    if (!record) return;
    const key = `thesis-${approved ? 'approve' : 'revoke'}-${record.enrollmentNo || record._id || record.id}-${record.examinationNumber}`;
    setBusyKey(key);
    try {
      const studentId = record._id || record.id;
      await academicService.updateAcademicMetrics(studentId, {
        examinationNumber: record.examinationNumber,
        thesisApproved: approved,
      });
      showToast('success', approved
        ? `Thesis approved for ${record.fullName} (Exam ${record.examinationNumber}).`
        : `Thesis approval revoked for ${record.fullName} (Exam ${record.examinationNumber}).`);
      // Optimistically sync the open modal + list
      setInspectingRecord(prev => prev && (prev._id || prev.id) === studentId && prev.examinationNumber === record.examinationNumber
        ? { ...prev, thesisApproved: approved }
        : prev);
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      console.error('Error toggling thesis:', err);
      showToast('error', err.parsedMessage || err.message || 'Failed to update thesis status.');
    } finally {
      setBusyKey('');
    }
  };

  const handleCertify = async () => {
    const rec = inspectingRecord;
    if (!rec) return;
    if (!isReady(rec)) {
      showToast('warning', 'Cannot certify: attendance must be ≥ 75% and thesis must be approved.');
      return;
    }
    setIsUpdatingAttendance(true);
    try {
      const studentId = rec._id || rec.id;
      await academicService.updateAcademicMetrics(studentId, {
        examinationNumber: rec.examinationNumber,
        eligibilityStatus: 'Approved',
      });
      showToast('success', `${rec.fullName} (Exam ${rec.examinationNumber}) certified eligible for the board examination.`);
      setInspectingRecord(null);
      setActionType(null);
      setActionRemarks('');
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      console.error('Error certifying eligibility:', err);
      showToast('error', err.parsedMessage || err.message || 'Failed to certify eligibility.');
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleReject = async () => {
    const rec = inspectingRecord;
    if (!rec) return;
    if (!actionRemarks.trim()) {
      showToast('error', 'Please provide specific remarks/reasons for rejection.');
      return;
    }
    setBusyKey(`reject-${rec.enrollmentNo || rec._id || rec.id}`);
    try {
      const studentId = rec._id || rec.id;
      await academicService.updateAcademicMetrics(studentId, {
        examinationNumber: rec.examinationNumber,
        eligibilityStatus: 'Rejected',
        rejectionNotes: actionRemarks.trim(),
      });
      showToast('success', `Rejected ${rec.fullName} (Exam ${rec.examinationNumber}) with remarks recorded.`);
      setInspectingRecord(null);
      setActionType(null);
      setActionRemarks('');
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      console.error('Error rejecting eligibility:', err);
      showToast('error', err.parsedMessage || err.message || 'Failed to reject eligibility.');
    } finally {
      setBusyKey('');
    }
  };

  const getStatusBadge = (record) => {
    if (record.eligibilityStatus === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Certified
        </span>
      );
    }
    if (record.eligibilityStatus === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          Rejected
        </span>
      );
    }
    if (isReady(record)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          Ready to Certify
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        Pending Review
      </span>
    );
  };

  const getAttendanceBadge = (value) => (
    value >= ATTENDANCE_THRESHOLD ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
  );

  const getThesisBadgeClass = (record) => {
    if (record.thesisApproved) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (record.thesisDocumentUrl) return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const renderDocTile = ({ url, label, footer }) => {
    const fullUrl = url ? getUploadUrl(url) : null;
    return (
      <div className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-primary-400 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-[11px] font-bold text-slate-800">{label}</span>
            {fullUrl ? (
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">✗</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400">
            {fullUrl ? 'Uploaded & available' : 'Not attached'}
          </span>
          {footer}
        </div>
        {fullUrl && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-700 text-[11px] font-bold rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View</span>
            </a>
            <a
              href={fullUrl}
              download
              className="inline-flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Download document"
            >
              <Download className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  };

  const documentSections = {
    course: [
      { key: 'nblsCertificateUrl', label: 'NBLS Certificate (Basic Life Support)' },
      { key: 'nclsCertificateUrl', label: 'NCLS Certificate (Comprehensive Life Support)' },
      { key: 'ntlsCertificateUrl', label: 'NTLS Certificate (Trauma Life Support)' },
      { key: 'nulsCertificateUrl', label: 'NULS Certificate (Ultrasound Life Support)' },
    ],
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText || 'Confirm'}
          type={confirmConfig.type || 'success'}
          onConfirm={() => {
            const cb = confirmConfig.onConfirm;
            setConfirmConfig(null);
            if (cb) cb();
          }}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {/* ─── Header & Title ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 mb-1">
            <BookOpenCheck className="w-4 h-4" />
            <span>Academic Department Verification</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Thesis, Documents & Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and verify thesis submissions, course completion certificates, and attendance before certifying candidates for board examinations.
          </p>
        </div>

        <button
          onClick={() => fetchBoardData && fetchBoardData()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* ─── Top KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { id: 'all', label: 'Total Records', count: stats.total, sub: 'Across all examinations', Icon: ListChecks, activeCls: 'bg-slate-900 border-slate-900', inactiveCls: 'bg-white border-slate-200 hover:border-slate-300' },
          { id: 'pending', label: 'Pending Review', count: stats.pending, sub: 'Missing attendance / thesis', Icon: Clock, activeCls: 'bg-amber-500 border-amber-500', inactiveCls: 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300' },
          { id: 'ready', label: 'Ready to Certify', count: stats.ready, sub: 'All criteria fulfilled', Icon: ShieldCheck, activeCls: 'bg-sky-600 border-sky-600', inactiveCls: 'bg-sky-50/60 border-sky-200/80 hover:border-sky-300' },
          { id: 'certified', label: 'Certified', count: stats.certified, sub: 'Approved for board exam', Icon: CheckCircle2, activeCls: 'bg-emerald-600 border-emerald-600', inactiveCls: 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300' },
          { id: 'rejected', label: 'Rejected', count: stats.rejected, sub: 'Flagged with remarks', Icon: XCircle, activeCls: 'bg-red-600 border-red-600', inactiveCls: 'bg-red-50/60 border-red-200/80 hover:border-red-300' },
        ].map(card => {
          const isActive = activeTab === card.id;
          const Icon = card.Icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${isActive ? `${card.activeCls} text-white shadow-md -translate-y-0.5` : `${card.inactiveCls} shadow-sm`}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-white/90' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl font-black mt-2 tracking-tight">{card.count}</div>
              <span className={`text-[11px] font-semibold mt-0.5 block ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                {card.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 border-b border-slate-100">
          {[
            { id: 'pending', label: 'Pending Review', count: stats.pending, Icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { id: 'ready', label: 'Ready to Certify', count: stats.ready, Icon: ShieldCheck, color: 'text-sky-600 bg-sky-50' },
            { id: 'certified', label: 'Certified', count: stats.certified, Icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'rejected', label: 'Rejected', count: stats.rejected, Icon: XCircle, color: 'text-red-600 bg-red-50' },
            { id: 'all', label: 'All Records', count: stats.total, Icon: Users, color: 'text-slate-600 bg-slate-100' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-primary-700/80 text-white' : tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, reg no, email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Institute Filter */}
          <div>
            <select
              value={filterInstitute}
              onChange={(e) => setFilterInstitute(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="">All Institutes / Colleges</option>
              {institutes.map(inst => <option key={inst} value={inst}>{inst}</option>)}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-slate-50/50 font-medium text-slate-700"
            >
              <option value="">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Verification Records Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Verification Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery || filterInstitute || filterCourse || filterBatch
                ? 'No records match your current filter criteria. Try clearing some filters.'
                : `There are currently no records under "${activeTab}" status.`}
            </p>
            {(searchQuery || filterInstitute || filterCourse || filterBatch) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterInstitute('');
                  setFilterCourse('');
                  setFilterBatch('');
                }}
                className="mt-2 text-xs text-primary-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-4 px-5">Student / Candidate</th>
                  <th className="py-4 px-4">Examination</th>
                  <th className="py-4 px-4">Attendance</th>
                  <th className="py-4 px-4">Thesis</th>
                  <th className="py-4 px-4">Documents</th>
                  <th className="py-4 px-4">Eligibility Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((record, idx) => {
                  const photoSrc = record.documents?.passportPhotoUrl ? getUploadUrl(record.documents.passportPhotoUrl) : null;
                  const docCount = documentCount(record);
                  const busy = busyKey === `thesis-approve-${record.enrollmentNo || record._id || record.id}-${record.examinationNumber}`;

                  return (
                    <tr key={`${record._id || record.id}-${record.examinationNumber}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Student Candidate Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                            {photoSrc ? (
                              <img src={photoSrc} alt="Passport" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(record.firstName?.[0] || 'S') + (record.lastName?.[0] || '')}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {record.fullName || `${record.firstName || ''} ${record.lastName || ''}`}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>{record.enrollmentNo || record.enrollmentId}</span>
                              <span>•</span>
                              <span className="truncate max-w-[140px]">{record.institute}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Examination */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-primary-600" />
                          <span>Exam {record.examinationNumber}</span>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-black text-slate-800">{record.attendancePercentage}%</span>
                          <span className={`inline-flex ml-2 px-2 py-0.5 rounded-full text-[9px] font-black border ${getAttendanceBadge(record.attendancePercentage)}`}>
                            {record.attendancePercentage >= ATTENDANCE_THRESHOLD ? 'Meets 75%' : 'Below 75%'}
                          </span>
                        </div>
                      </td>

                      {/* Thesis */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getThesisBadgeClass(record)}`}>
                            <FileText className="w-3 h-3" />
                            {record.thesisApproved ? 'Approved' : record.thesisDocumentUrl ? 'Pending' : 'No Document'}
                          </span>
                          {!record.thesisApproved && record.thesisDocumentUrl && record.eligibilityStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleThesisToggle(record, true)}
                              disabled={busy}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50"
                            >
                              {busy ? '...' : 'Approve'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Documents */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <FileCheck2 className="w-3.5 h-3.5 text-primary-600" />
                          <span>{docCount} Uploads</span>
                        </div>
                      </td>

                      {/* Eligibility Status */}
                      <td className="py-4 px-4">
                        <div>
                          {getStatusBadge(record)}
                          {record.rejectionNotes && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate italic">
                              "{record.rejectionNotes}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenRecord(record)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm border border-primary-200/60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          VERIFICATION REVIEW MODAL
          ════════════════════════════════════════════════════════════════════════ */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white flex items-center justify-between border-b border-primary-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {inspectingRecord.documents?.passportPhotoUrl ? (
                    <img
                      src={getUploadUrl(inspectingRecord.documents.passportPhotoUrl)}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white/80" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black tracking-tight text-white">
                      {inspectingRecord.fullName || `${inspectingRecord.firstName || ''} ${inspectingRecord.lastName || ''}`}
                    </h2>
                    {getStatusBadge(inspectingRecord)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary-200 mt-0.5 flex-wrap">
                    <span>Enrollment ID: <strong className="text-white font-mono">{inspectingRecord.enrollmentNo || inspectingRecord.enrollmentId}</strong></span>
                    <span>•</span>
                    <span>Exam {inspectingRecord.examinationNumber}</span>
                    <span>•</span>
                    <span>{inspectingRecord.institute}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingRecord(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow divide-y divide-slate-100">
              {/* Previous Remarks Alert if exists */}
              {inspectingRecord.rejectionNotes && (
                <div className="p-4 rounded-2xl border text-xs flex items-start gap-3 bg-red-50 border-red-200 text-red-900">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black block uppercase tracking-wider text-[10px]">
                      Rejection / Audit Remarks:
                    </strong>
                    <p className="mt-1 leading-relaxed">{inspectingRecord.rejectionNotes}</p>
                  </div>
                </div>
              )}

              {/* ── Section 1: Attendance Verification ─────────────────────────── */}
              <div className="pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>1. Attendance Verification</span>
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-slate-800">
                          Reported Attendance: {inspectingRecord.attendancePercentage}%
                        </span>
                        <span className={`text-[11px] font-bold ${inspectingRecord.attendancePercentage >= ATTENDANCE_THRESHOLD ? 'text-emerald-600' : 'text-red-500'}`}>
                          {inspectingRecord.attendancePercentage >= ATTENDANCE_THRESHOLD ? 'Meets 75% minimum' : 'Below 75% minimum'}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${inspectingRecord.attendancePercentage >= ATTENDANCE_THRESHOLD ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(inspectingRecord.attendancePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Update Attendance %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={attendanceInput}
                          onChange={(e) => setAttendanceInput(e.target.value)}
                          className="w-24 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                          placeholder="e.g. 85"
                        />
                      </div>
                      <button
                        onClick={handleUpdateAttendance}
                        disabled={isUpdatingAttendance}
                        className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-600/20 transition-all disabled:opacity-50"
                      >
                        {isUpdatingAttendance ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">
                    Attendance for <strong>Examination {inspectingRecord.examinationNumber}</strong> must be at or above 75% for eligibility certification.
                  </p>
                </div>
              </div>

              {/* ── Section 2: Thesis Verification ─────────────────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span>2. Thesis Verification</span>
                </h3>
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  inspectingRecord.thesisApproved ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${inspectingRecord.thesisApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        <BookOpenCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-sm font-black ${inspectingRecord.thesisApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {inspectingRecord.thesisApproved ? 'Thesis Approved' : 'Thesis Awaiting Approval'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          {inspectingRecord.thesisDocumentUrl
                            ? 'Thesis document has been submitted by the institute.'
                            : 'No thesis document has been uploaded for this examination.'}
                        </span>
                      </div>
                    </div>
                    {inspectingRecord.thesisDocumentUrl && (
                      <div className="flex items-center gap-2">
                        <a
                          href={getUploadUrl(inspectingRecord.thesisDocumentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-primary-400 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Thesis
                        </a>
                        <a
                          href={getUploadUrl(inspectingRecord.thesisDocumentUrl)}
                          download
                          className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-200 hover:border-primary-400 text-slate-700 rounded-xl transition-colors"
                          title="Download thesis"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                  {inspectingRecord.eligibilityStatus !== 'Rejected' && (
                    <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-end gap-2">
                      {!inspectingRecord.thesisApproved ? (
                        <button
                          onClick={() => handleThesisToggle(inspectingRecord, true)}
                          disabled={!inspectingRecord.thesisDocumentUrl || busyKey === `thesis-approve-${inspectingRecord.enrollmentNo || inspectingRecord._id || inspectingRecord.id}-${inspectingRecord.examinationNumber}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {inspectingRecord.thesisDocumentUrl ? 'Approve Thesis' : 'Requires Document First'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleThesisToggle(inspectingRecord, false)}
                          disabled={busyKey === `thesis-revoke-${inspectingRecord.enrollmentNo || inspectingRecord._id || inspectingRecord.id}-${inspectingRecord.examinationNumber}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Revoke Approval
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Section 3: Course Completion Certificates ─────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-primary-600" />
                  <span>3. Course Completion Certificates (Pre-Examination Requirement)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {documentSections.course.map(item => renderDocTile({
                    ...item,
                    url: (inspectingRecord.documents || {})[item.key],
                  }))}
                </div>
              </div>

              {/* ── Section 4: Certification Decision Panel ────────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  <span>4. Board Certification Decision</span>
                </h3>

                {inspectingRecord.eligibilityStatus === 'Approved' ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-sm font-black text-emerald-800">Certified Eligible</p>
                    <p className="text-xs text-emerald-700">
                      This candidate has been certified for Examination {inspectingRecord.examinationNumber}.
                    </p>
                  </div>
                ) : inspectingRecord.eligibilityStatus === 'Rejected' ? (
                  <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto" />
                    <p className="text-sm font-black text-red-800">Rejected</p>
                    <p className="text-xs text-red-700">This candidate has been flagged with remarks recorded.</p>
                  </div>
                ) : actionType === 'Reject' ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-red-600">
                        Confirm Rejection with Remarks
                      </span>
                      <button
                        onClick={() => setActionType(null)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Remarks / Reason for Rejection <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={actionRemarks}
                        onChange={(e) => setActionRemarks(e.target.value)}
                        placeholder="e.g., Thesis content does not match the approved research protocol, please resubmit."
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActionType(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `reject-${inspectingRecord.enrollmentNo || inspectingRecord._id || inspectingRecord.id}`}
                        onClick={handleReject}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {busyKey === `reject-${inspectingRecord.enrollmentNo || inspectingRecord._id || inspectingRecord.id}` ? (
                          <span>Submitting...</span>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Confirm Rejection</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Eligibility checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                      {[
                        {
                          label: 'Attendance ≥ 75%',
                          ok: inspectingRecord.attendancePercentage >= ATTENDANCE_THRESHOLD,
                          detail: `${inspectingRecord.attendancePercentage}% reported`,
                        },
                        {
                          label: 'Thesis Approved',
                          ok: inspectingRecord.thesisApproved,
                          detail: inspectingRecord.thesisApproved ? 'Board approved' : inspectingRecord.thesisDocumentUrl ? 'Awaiting approval' : 'No document',
                        },
                        {
                          label: 'Course Certificates',
                          ok: Boolean(
                            (inspectingRecord.documents || {}).nblsCertificateUrl ||
                            (inspectingRecord.documents || {}).nclsCertificateUrl ||
                            (inspectingRecord.documents || {}).ntlsCertificateUrl ||
                            (inspectingRecord.documents || {}).nulsCertificateUrl
                          ),
                          detail: 'At least one of NBLS / NCLS / NTLS / NULS required',
                        },
                      ].map(item => (
                        <div key={item.label} className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                          item.ok ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {item.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className={`text-xs font-bold block ${item.ok ? 'text-emerald-800' : 'text-slate-600'}`}>{item.label}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{item.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const rec = inspectingRecord;
                          if (!isReady(rec)) {
                            showToast('warning', 'Cannot certify: attendance must be ≥ 75% and thesis must be approved.');
                            return;
                          }
                          setConfirmConfig({
                            title: 'Certify Candidate',
                            message: `Are you sure you want to certify ${rec.fullName} (Examination ${rec.examinationNumber}) as eligible for the board examination?`,
                            confirmText: 'Yes, Certify',
                            type: 'success',
                            onConfirm: handleCertify,
                          });
                        }}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all -translate-y-0.5 active:translate-y-0"
                      >
                        <Award className="w-4 h-4" />
                        <span>Certify Eligible for Board Exam</span>
                      </button>

                      <button
                        onClick={() => {
                          setActionType('Reject');
                          setActionRemarks(inspectingRecord.rejectionNotes || '');
                        }}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Candidate ID: <strong className="font-mono text-slate-700">{inspectingRecord._id || inspectingRecord.id}</strong></span>
              <button
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}