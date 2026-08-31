import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronRight, 
  UserCheck, 
  Inbox, 
  Clock, 
  AlertCircle,
  Download,
  ShieldCheck,
  User,
  Calendar,
  Award,
  Filter,
  Eye,
  ChevronDown,
  Search,
  Users,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  Stethoscope,
  GraduationCap,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import academicService from '../../../api/academic';
import { getUploadUrl } from '../../../api/apiClient';

export default function AcademyStudentVerification({ 
  students = [], 
  fetchBoardData = () => {},
  setErrorMsg = () => {},
  setSuccessMsg = () => {} 
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  
  // Active student being inspected in modal/drawer
  const [inspectingStudent, setInspectingStudent] = useState(null);
  
  // Action states
  const [actionType, setActionType] = useState(null); // 'Approved' | 'Correction Required' | 'Rejected'
  const [actionRemarks, setActionRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Extract unique filter dropdown values
  const institutes = useMemo(() => {
    return [...new Set(students.map(s => s.institute).filter(Boolean))].sort();
  }, [students]);

  const courses = useMemo(() => {
    return [...new Set(students.map(s => s.course).filter(Boolean))].sort();
  }, [students]);

  const batches = useMemo(() => {
    return [...new Set(students.map(s => s.batch).filter(Boolean))].sort();
  }, [students]);

  // Normalize verification status
  const normalizedStudents = useMemo(() => {
    return students.map(s => {
      let status = s.verificationStatus || 'Pending Verification';
      if (status === 'Pending') status = 'Pending Verification';
      return {
        ...s,
        verificationStatus: status,
      };
    });
  }, [students]);

  // Filter logic
  const filteredStudents = useMemo(() => {
    return normalizedStudents.filter(student => {
      // Tab filter
      if (activeTab === 'pending' && student.verificationStatus !== 'Pending Verification') {
        return false;
      }
      if (activeTab === 'approved' && student.verificationStatus !== 'Approved') {
        return false;
      }
      if (activeTab === 'correction' && student.verificationStatus !== 'Correction Required') {
        return false;
      }
      if (activeTab === 'rejected' && student.verificationStatus !== 'Rejected') {
        return false;
      }

      // Dropdown filters
      if (filterInstitute && student.institute !== filterInstitute) return false;
      if (filterCourse && student.course !== filterCourse) return false;
      if (filterBatch && student.batch !== filterBatch) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = (student.fullName || `${student.firstName || ''} ${student.lastName || ''}`).toLowerCase();
        const enrollNo = (student.enrollmentNo || student.enrollmentId || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const phone = (student.contactNumber || student.mobile || '').toLowerCase();
        const regNo = (student.medicalCouncilRegistrationNumber || '').toLowerCase();
        const inst = (student.institute || '').toLowerCase();
        const crs = (student.course || '').toLowerCase();

        return (
          fullName.includes(q) ||
          enrollNo.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          regNo.includes(q) ||
          inst.includes(q) ||
          crs.includes(q)
        );
      }

      return true;
    });
  }, [normalizedStudents, activeTab, filterInstitute, filterCourse, filterBatch, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = normalizedStudents.length;
    const pending = normalizedStudents.filter(s => s.verificationStatus === 'Pending Verification').length;
    const approved = normalizedStudents.filter(s => s.verificationStatus === 'Approved').length;
    const correction = normalizedStudents.filter(s => s.verificationStatus === 'Correction Required').length;
    const rejected = normalizedStudents.filter(s => s.verificationStatus === 'Rejected').length;
    return { total, pending, approved, correction, rejected };
  }, [normalizedStudents]);

  // Handle Verification Action Submission
  const handlePerformAction = async (statusToSet) => {
    if (!inspectingStudent) return;
    
    if ((statusToSet === 'Correction Required' || statusToSet === 'Rejected') && !actionRemarks.trim()) {
      setToast({
        type: 'error',
        message: `Please provide specific remarks or reasons for ${statusToSet === 'Correction Required' ? 'correction' : 'rejection'}.`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const studentId = inspectingStudent._id || inspectingStudent.id;
      await academicService.verifyStudentEnrollment(studentId, {
        status: statusToSet,
        remarks: actionRemarks.trim()
      });

      setToast({
        type: 'success',
        message: `Student enrollment successfully marked as ${statusToSet}!`
      });

      // Reset action forms and modal
      setActionType(null);
      setActionRemarks('');
      setInspectingStudent(null);
      
      // Refresh board data
      if (fetchBoardData) {
        await fetchBoardData();
      }
    } catch (err) {
      console.error('Error verifying student enrollment:', err);
      setToast({
        type: 'error',
        message: err.parsedMessage || err.message || 'Failed to update student verification status.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Correction Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
            Correction Required
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      case 'Pending Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Verification
          </span>
        );
    }
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
          confirmType={confirmConfig.confirmType || 'primary'}
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
            <UserCheck className="w-4 h-4" />
            <span>Academic Department Governance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Student Verification & Approval
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit student personal info, medical council credentials, eligibility certificates, and approve enrollments.
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
        {/* Total */}
        <div 
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'all' 
              ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 -translate-y-0.5' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'all' ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Enrolled
            </span>
            <Users className={`w-4 h-4 ${activeTab === 'all' ? 'text-slate-300' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            {stats.total}
          </div>
          <span className={`text-[11px] font-semibold mt-0.5 block ${activeTab === 'all' ? 'text-slate-400' : 'text-slate-400'}`}>
            All registered candidates
          </span>
        </div>

        {/* Pending */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'pending' 
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 -translate-y-0.5' 
              : 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300 shadow-sm text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
              Pending Review
            </span>
            <Clock className={`w-4 h-4 ${activeTab === 'pending' ? 'text-amber-100' : 'text-amber-600'} animate-pulse`} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            {stats.pending}
          </div>
          <span className={`text-[11px] font-semibold mt-0.5 block ${activeTab === 'pending' ? 'text-amber-100' : 'text-amber-600'}`}>
            Awaiting verification
          </span>
        </div>

        {/* Approved */}
        <div 
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'approved' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 -translate-y-0.5' 
              : 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300 shadow-sm text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Approved Active
            </span>
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'approved' ? 'text-emerald-100' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            {stats.approved}
          </div>
          <span className={`text-[11px] font-semibold mt-0.5 block ${activeTab === 'approved' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Active in academic workflow
          </span>
        </div>

        {/* Correction Required */}
        <div 
          onClick={() => setActiveTab('correction')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'correction' 
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 -translate-y-0.5' 
              : 'bg-purple-50/60 border-purple-200/80 hover:border-purple-300 shadow-sm text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'correction' ? 'text-purple-100' : 'text-purple-700'}`}>
              Corrections
            </span>
            <RotateCcw className={`w-4 h-4 ${activeTab === 'correction' ? 'text-purple-100' : 'text-purple-600'}`} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            {stats.correction}
          </div>
          <span className={`text-[11px] font-semibold mt-0.5 block ${activeTab === 'correction' ? 'text-purple-100' : 'text-purple-600'}`}>
            Flagged for update
          </span>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => setActiveTab('rejected')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            activeTab === 'rejected' 
              ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20 -translate-y-0.5' 
              : 'bg-red-50/60 border-red-200/80 hover:border-red-300 shadow-sm text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'rejected' ? 'text-red-100' : 'text-red-700'}`}>
              Rejected
            </span>
            <XCircle className={`w-4 h-4 ${activeTab === 'rejected' ? 'text-red-100' : 'text-red-600'}`} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            {stats.rejected}
          </div>
          <span className={`text-[11px] font-semibold mt-0.5 block ${activeTab === 'rejected' ? 'text-red-100' : 'text-red-600'}`}>
            Disapproved enrollments
          </span>
        </div>
      </div>

      {/* ─── Search & Filters Bar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 border-b border-slate-100">
          {[
            { id: 'pending', label: 'Pending Verification', count: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { id: 'approved', label: 'Approved Students', count: stats.approved, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'correction', label: 'Correction Required', count: stats.correction, icon: RotateCcw, color: 'text-purple-600 bg-purple-50' },
            { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
            { id: 'all', label: 'All Students', count: stats.total, icon: Users, color: 'text-slate-600 bg-slate-100' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-primary-700/80 text-white' : tab.color
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, reg no, email..."
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
              {institutes.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
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
              {courses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
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
              {batches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Student Records Table / List ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Student Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery || filterInstitute || filterCourse || filterBatch
                ? 'No student matches your current filter criteria. Try clearing some filters.'
                : `There are currently no students under "${activeTab}" status.`}
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
                  <th className="py-4 px-4">Medical Registration</th>
                  <th className="py-4 px-4">Institute & Course</th>
                  <th className="py-4 px-4">Documents</th>
                  <th className="py-4 px-4">Verification Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((student) => {
                  const hasPhoto = student.documents?.passportPhotoUrl;
                  const photoSrc = hasPhoto ? getUploadUrl(student.documents.passportPhotoUrl) : null;
                  const docCount = Object.values(student.documents || {}).filter(Boolean).length;

                  return (
                    <tr 
                      key={student.id || student._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Student Candidate Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                            {photoSrc ? (
                              <img src={photoSrc} alt="Passport" className="w-full h-full object-cover" />
                            ) : (
                              <span>{(student.firstName?.[0] || 'S') + (student.lastName?.[0] || '')}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {student.fullName || `${student.firstName || ''} ${student.lastName || ''}`}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>{student.enrollmentNo || student.enrollmentId}</span>
                              <span>•</span>
                              <span>{student.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Medical Registration & Degree */}
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                            <span>{student.medicalCouncilRegistrationNumber || 'N/A'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-400" />
                            <span>{student.qualification || student.mbbsQualification || 'MBBS'} ({student.yearOfPassing || 'N/A'})</span>
                          </div>
                          {student.isForeignGraduate && (
                            <span className="inline-block mt-1 text-[9px] font-black uppercase text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200">
                              Foreign Grad • FMGE: {student.fmgeClearanceStatus || 'N/A'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Institute & Course */}
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate max-w-xs">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{student.institute || 'Unassigned Institute'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {student.course} • <span className="font-semibold text-slate-600">{student.batch}</span>
                          </div>
                        </div>
                      </td>

                      {/* Documents Badge */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <FileCheck2 className="w-3.5 h-3.5 text-primary-600" />
                          <span>{docCount} Uploads</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-4 px-4">
                        <div>
                          {getStatusBadge(student.verificationStatus)}
                          {student.verificationRemarks && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-xs truncate italic">
                              "{student.verificationRemarks}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setInspectingStudent(student);
                            setActionType(null);
                            setActionRemarks(student.verificationRemarks || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm border border-primary-200/60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Dossier</span>
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
          STUDENT VERIFICATION DOSSIER MODAL / INSPECTOR
          ════════════════════════════════════════════════════════════════════════ */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white flex items-center justify-between border-b border-primary-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {inspectingStudent.documents?.passportPhotoUrl ? (
                    <img 
                      src={getUploadUrl(inspectingStudent.documents.passportPhotoUrl)} 
                      alt="Student" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white/80" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight text-white">
                      {inspectingStudent.fullName || `${inspectingStudent.firstName || ''} ${inspectingStudent.lastName || ''}`}
                    </h2>
                    {getStatusBadge(inspectingStudent.verificationStatus)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary-200 mt-0.5">
                    <span>Enrollment ID: <strong className="text-white font-mono">{inspectingStudent.enrollmentNo || inspectingStudent.enrollmentId}</strong></span>
                    <span>•</span>
                    <span>{inspectingStudent.institute}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectingStudent(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow divide-y divide-slate-100">
              {/* Previous Remarks Alert if exists */}
              {inspectingStudent.verificationRemarks && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  inspectingStudent.verificationStatus === 'Correction Required'
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : inspectingStudent.verificationStatus === 'Rejected'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black block uppercase tracking-wider text-[10px]">
                      Verification Remarks / Audit Notes:
                    </strong>
                    <p className="mt-1 leading-relaxed">{inspectingStudent.verificationRemarks}</p>
                    {inspectingStudent.verifiedAt && (
                      <span className="text-[10px] opacity-75 mt-1 block">
                        Updated on {new Date(inspectingStudent.verifiedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Section 1: Candidate Personal Details ──────────────────────── */}
              <div className="pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600" />
                  <span>1. Student Personal & Contact Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Full Name</span>
                    <span className="font-extrabold text-slate-800">{inspectingStudent.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Email Address</span>
                    <span className="font-semibold text-slate-800">{inspectingStudent.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Contact Number</span>
                    <span className="font-semibold text-slate-800">{inspectingStudent.contactNumber || inspectingStudent.mobile || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{inspectingStudent.dobFormatted || inspectingStudent.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Home Address</span>
                    <span className="font-medium text-slate-800">{inspectingStudent.homeAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Medical Qualifications & Registration ────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary-600" />
                  <span>2. Medical Registration & Qualifications</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Medical Council Reg. Number</span>
                    <span className="font-black text-primary-700 bg-primary-100/50 px-2 py-0.5 rounded border border-primary-200 inline-block mt-0.5">
                      {inspectingStudent.medicalCouncilRegistrationNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">MBBS / Primary Qualification</span>
                    <span className="font-extrabold text-slate-800">{inspectingStudent.qualification || inspectingStudent.mbbsQualification || 'MBBS'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Year of Passing</span>
                    <span className="font-bold text-slate-800">{inspectingStudent.yearOfPassing || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">University / Medical College Name</span>
                    <span className="font-semibold text-slate-800">{inspectingStudent.universityName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Foreign Medical Graduate</span>
                    <span className="font-bold text-slate-800">
                      {inspectingStudent.isForeignGraduate ? 'Yes' : 'No'}
                      {inspectingStudent.isForeignGraduate && ` (FMGE: ${inspectingStudent.fmgeClearanceStatus || 'N/A'})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Course & Institute Information ───────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  <span>3. Course, Batch & Institute Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Enrolled Course</span>
                    <span className="font-black text-slate-800">{inspectingStudent.course}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Batch</span>
                    <span className="font-bold text-slate-800">{inspectingStudent.batch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Course Director</span>
                    <span className="font-semibold text-slate-800">{inspectingStudent.courseDirector || 'Dr. Assigned Director'}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Sponsoring Institute</span>
                    <span className="font-extrabold text-slate-900">{inspectingStudent.institute}</span>
                  </div>
                </div>
              </div>

              {/* ── Section 4: Document Verification Dossier ─────────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span>4. Uploaded Enrollment Documents & Proofs</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'passportPhotoUrl', label: 'Passport Size Photo', isImage: true },
                    { key: 'mbbsCertificateUrl', label: 'MBBS Degree Certificate' },
                    { key: 'medicalCouncilRegistrationCertificateUrl', label: 'Medical Council Registration' },
                    { key: 'semiMembershipFormUrl', label: 'SEMI Membership Form' },
                    { key: 'studentSignatureUrl', label: 'Candidate Signature', isImage: true },
                    { key: 'hodSignatureUrl', label: 'HOD Approval Signature', isImage: true },
                    ...(inspectingStudent.isForeignGraduate ? [{ key: 'fmgeResultCopyUrl', label: 'FMGE Clearance Result' }] : []),
                    // Course Completion Certificates (Pre-Examination Requirement)
                    { key: 'nblsCertificateUrl', label: 'NBLS Certificate (Basic Life Support)' },
                    { key: 'nclsCertificateUrl', label: 'NCLS Certificate (Comprehensive Life Support)' },
                    { key: 'ntlsCertificateUrl', label: 'NTLS Certificate (Trauma Life Support)' },
                    { key: 'nulsCertificateUrl', label: 'NULS Certificate (Ultrasound Life Support)' },
                  ].map(docItem => {
                    const url = inspectingStudent.documents?.[docItem.key];
                    const fullUrl = url ? getUploadUrl(url) : null;

                    return (
                      <div 
                        key={docItem.key}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-400 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-800">{docItem.label}</span>
                            {fullUrl ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold">
                                ✗
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {fullUrl ? 'Uploaded & available' : 'Not attached'}
                          </span>
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
                  })}
                </div>
              </div>

              {/* ── Section 5: Verification Decision Panel ───────────────────────── */}
              <div className="pt-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  <span>5. Academic Department Verification Decision</span>
                </h3>

                {actionType ? (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Confirm Decision: <span className={
                          actionType === 'Approved' ? 'text-emerald-600' :
                          actionType === 'Correction Required' ? 'text-purple-600' : 'text-red-600'
                        }>{actionType}</span>
                      </span>
                      <button
                        onClick={() => setActionType(null)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>

                    {(actionType === 'Correction Required' || actionType === 'Rejected') && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Remarks / Reason for {actionType} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={actionRemarks}
                          onChange={(e) => setActionRemarks(e.target.value)}
                          placeholder={
                            actionType === 'Correction Required'
                              ? 'e.g., MBBS degree certificate is blurry, please re-upload clear scanned copy.'
                              : 'e.g., Medical council registration number mismatch with official registry.'
                          }
                          className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                        />

                        {/* Quick Presets for Correction */}
                        {actionType === 'Correction Required' && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold self-center">Quick tags:</span>
                            {[
                              'MBBS Certificate illegible',
                              'Medical Council Reg. certificate missing',
                              'SEMI form signature incomplete',
                              'FMGE result copy required'
                            ].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setActionRemarks(prev => prev ? `${prev}, ${preset}` : preset)}
                                className="text-[10px] bg-slate-200/80 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {actionType === 'Approved' && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        Approving this student will mark them as verified and activate them across the examination, attendance, marks entry, and marksheet generation workflows.
                      </p>
                    )}

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
                        disabled={isSubmitting}
                        onClick={() => handlePerformAction(actionType)}
                        className={`px-5 py-2 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 ${
                          actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25' :
                          actionType === 'Correction Required' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25' :
                          'bg-red-600 hover:bg-red-700 shadow-red-600/25'
                        }`}
                      >
                        {isSubmitting ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Confirm {actionType}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Approve Button */}
                    <button
                      onClick={() => {
                        setActionType('Approved');
                        setActionRemarks(inspectingStudent.verificationRemarks || '');
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all -translate-y-0.5 active:translate-y-0"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve Enrollment</span>
                    </button>

                    {/* Request Correction Button */}
                    <button
                      onClick={() => {
                        setActionType('Correction Required');
                        setActionRemarks(inspectingStudent.verificationRemarks || '');
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Request Correction</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => {
                        setActionType('Rejected');
                        setActionRemarks(inspectingStudent.verificationRemarks || '');
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Enrollment</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Candidate ID: <strong className="font-mono text-slate-700">{inspectingStudent._id}</strong></span>
              <button
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
