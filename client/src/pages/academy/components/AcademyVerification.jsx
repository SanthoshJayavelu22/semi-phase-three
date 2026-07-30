import React from 'react';
import { useState, useMemo } from 'react';
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
  BarChart3,
  ListChecks,
  X
} from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import { academicService } from '../../../api/academic';

const AcademyVerification = ({ 
  students, 
  onVerifyStudent,
  selectedStudentId,
  setSelectedStudentId,
  fetchBoardData
}) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [internalSelectedId, setInternalSelectedId] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isThesisLoading, setIsThesisLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [viewingStudent, setViewingStudent] = useState(null);

  const institutes = useMemo(() => [...new Set(students.map(s => s.institute).filter(Boolean))], [students]);
  const courses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))], [students]);
  const batches = useMemo(() => [...new Set(students.map(s => s.batch).filter(Boolean))], [students]);

  const activeId = selectedStudentId !== undefined && selectedStudentId !== '' ? selectedStudentId : internalSelectedId;
  const setActiveId = setSelectedStudentId !== undefined ? setSelectedStudentId : setInternalSelectedId;

  const allStudentRecords = useMemo(() => {
    const records = [];
    students.forEach(s => {
      if (s.semesters && Array.isArray(s.semesters)) {
        s.semesters.forEach(sem => {
          const hasData = (sem.attendancePercentage !== undefined && sem.attendancePercentage > 0) || !!sem.thesisDocumentUrl;
          const status = sem.eligibilityStatus || 'Pending';
          if (hasData || status !== 'Pending') {
            records.push({
              ...s,
              semesterNumber: sem.semesterNumber,
              attendancePercentage: sem.attendancePercentage || 0,
              thesisApproved: sem.thesisApproved || false,
              thesisDocumentUrl: sem.thesisDocumentUrl || '',
              eligibilityStatus: status,
              rejectionNotes: sem.rejectionNotes || '',
              hasData: hasData
            });
          }
        });
      }
    });
    return records;
  }, [students]);

  const filteredRecords = useMemo(() => {
    let result = allStudentRecords;
    
    if (filterInstitute) {
      result = result.filter(s => s.institute === filterInstitute);
    }
    if (filterCourse) {
      result = result.filter(s => s.course === filterCourse);
    }
    if (filterBatch) {
      result = result.filter(s => s.batch === filterBatch);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.fullName?.toLowerCase().includes(q) ||
        s.enrollmentNo?.toLowerCase().includes(q) ||
        s.institute?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [allStudentRecords, filterInstitute, filterCourse, filterBatch, searchQuery]);

  const pendingRecords = useMemo(() => {
    return filteredRecords.filter(s => s.eligibilityStatus === 'Pending' && s.hasData);
  }, [filteredRecords]);

  const approvedRecords = useMemo(() => {
    return filteredRecords.filter(s => s.eligibilityStatus === 'Approved');
  }, [filteredRecords]);

  const rejectedRecords = useMemo(() => {
    return filteredRecords.filter(s => s.eligibilityStatus === 'Rejected');
  }, [filteredRecords]);

  const currentRecords = useMemo(() => {
    switch (activeTab) {
      case 'pending': return pendingRecords;
      case 'approved': return approvedRecords;
      case 'rejected': return rejectedRecords;
      case 'all': return filteredRecords;
      default: return pendingRecords;
    }
  }, [activeTab, pendingRecords, approvedRecords, rejectedRecords, filteredRecords]);

  const activeRecord = useMemo(() => {
    if (!activeId) return currentRecords[0] || null;
    return currentRecords.find(s => `${s.enrollmentNo}_${s.semesterNumber}` === activeId) || currentRecords[0] || null;
  }, [currentRecords, activeId]);

  React.useEffect(() => {
    if (currentRecords.length > 0) {
      const first = currentRecords[0];
      const newId = `${first.enrollmentNo}_${first.semesterNumber}`;
      if (!activeId || !currentRecords.find(s => `${s.enrollmentNo}_${s.semesterNumber}` === activeId)) {
        setActiveId(newId);
      }
    } else {
      setActiveId('');
    }
  }, [currentRecords, activeId, setActiveId]);

  const handleThesisToggle = async (student, newStatus) => {
    if (!student) return;
    setIsThesisLoading(true);
    try {
      await academicService.updateAcademicMetrics(student._id || student.id, {
        semesterNumber: student.semesterNumber,
        thesisApproved: newStatus
      });
      setToast({ 
        message: `Thesis ${newStatus ? 'approved' : 'rejected'} successfully for ${student.fullName}.`, 
        type: 'success' 
      });
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      setToast({ 
        message: err.parsedMessage || err.message || 'Failed to update thesis status.', 
        type: 'error' 
      });
    } finally {
      setIsThesisLoading(false);
    }
  };

  const handleCertifyEligibility = (student) => {
    if (!student) return;
    
    const isAttendanceOk = (student.attendancePercentage || 0) >= 75;
    const isThesisOk = !!student.thesisApproved;
    
    if (!isAttendanceOk || !isThesisOk) {
      setToast({ 
        message: `Cannot certify: ${!isAttendanceOk ? 'Attendance is below 75%' : ''}${!isAttendanceOk && !isThesisOk ? ' and ' : ''}${!isThesisOk ? 'Thesis is not approved' : ''}.`,
        type: 'warning' 
      });
      return;
    }

    setConfirmConfig({
      title: 'Certify Eligibility',
      message: `Are you sure you want to certify ${student.fullName} (Semester ${student.semesterNumber}) as eligible for the final board examination?`,
      type: 'success',
      confirmText: 'Yes, Certify',
      onConfirm: () => {
        setConfirmConfig(null);
        onVerifyStudent(student.enrollmentNo, student.semesterNumber, 'Approved');
        setShowRejectionForm(false);
        setRejectionNotes('');
      }
    });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!activeRecord) return;
    if (!rejectionNotes.trim()) {
      setToast({ message: 'Please enter auditor rejection notes before submitting.', type: 'warning' });
      return;
    }
    onVerifyStudent(activeRecord.enrollmentNo, activeRecord.semesterNumber, 'Rejected', rejectionNotes);
    setRejectionNotes('');
    setShowRejectionForm(false);
  };

  const handleViewStudent = (student) => {
    setViewingStudent(student);
  };

  const getStatusBadge = (status, student) => {
    if (status === 'Approved') {
      return { label: 'Certified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
    }
    if (status === 'Rejected') {
      return { label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <XCircle className="w-3.5 h-3.5" /> };
    }
    if (student) {
      const isAttendanceOk = (student.attendancePercentage || 0) >= 75;
      const isThesisOk = !!student.thesisApproved;
      if (isAttendanceOk && isThesisOk) {
        return { label: 'Ready to Certify', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <ShieldCheck className="w-3.5 h-3.5" /> };
      }
    }
    return { label: 'Incomplete', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle className="w-3.5 h-3.5" /> };
  };

  const getCriteriaStatus = (student) => {
    if (!student) return { attendance: false, thesis: false };
    return {
      attendance: (student.attendancePercentage || 0) >= 75,
      thesis: !!student.thesisApproved
    };
  };

  const TabButton = ({ tab, label, count, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
        activeTab === tab
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] ${
        activeTab === tab 
          ? 'bg-white/20 text-white' 
          : 'bg-slate-100 text-slate-500'
      }`}>
        {count}
      </span>
    </button>
  );

  const StatusSummaryCard = ({ label, count, color, icon: Icon }) => (
    <div className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between ${color}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('border', 'bg').replace('text', 'text')} bg-opacity-20`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-black text-slate-400 block">{label}</span>
          <span className="text-2xl font-black text-slate-800">{count}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Eligibility Verification</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Review attendance & thesis, then certify eligible candidates for board exams
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <UserCheck className="w-4.5 h-4.5 text-blue-600" />
            <span className="text-xs font-black text-blue-900">{pendingRecords.length} Pending</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <span className="text-xs font-black text-emerald-900">{approvedRecords.length} Approved</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 flex items-center gap-2">
            <XCircle className="w-4.5 h-4.5 text-rose-600" />
            <span className="text-xs font-black text-rose-900">{rejectedRecords.length} Rejected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusSummaryCard 
          label="Total Records" 
          count={allStudentRecords.length} 
          color="border-blue-100 text-blue-600"
          icon={BarChart3}
        />
        <StatusSummaryCard 
          label="Pending Review" 
          count={pendingRecords.length} 
          color="border-amber-100 text-amber-600"
          icon={Clock}
        />
        <StatusSummaryCard 
          label="Approved" 
          count={approvedRecords.length} 
          color="border-emerald-100 text-emerald-600"
          icon={CheckCircle2}
        />
        <StatusSummaryCard 
          label="Rejected" 
          count={rejectedRecords.length} 
          color="border-rose-100 text-rose-600"
          icon={XCircle}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <TabButton tab="pending" label="Pending" count={pendingRecords.length} icon={Clock} />
        <TabButton tab="approved" label="Approved" count={approvedRecords.length} icon={CheckCircle2} />
        <TabButton tab="rejected" label="Rejected" count={rejectedRecords.length} icon={XCircle} />
        <TabButton tab="all" label="All" count={filteredRecords.length} icon={ListChecks} />
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all w-40"
            />
          </div>
          <select
            value={filterInstitute}
            onChange={(e) => setFilterInstitute(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Institutes</option>
            {institutes.map(inst => <option key={inst} value={inst}>{inst}</option>)}
          </select>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {currentRecords.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-4 shadow-sm space-y-3 max-h-[70vh] overflow-y-auto">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>
                {activeTab === 'pending' ? 'Review Queue' : 
                 activeTab === 'approved' ? 'Approved Candidates' : 
                 activeTab === 'rejected' ? 'Rejected Candidates' : 'All Candidates'}
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px]">
                {currentRecords.length}
              </span>
            </h3>
            
            {currentRecords.length > 0 ? (
              currentRecords.map(s => {
                const isActive = activeRecord?.enrollmentNo === s.enrollmentNo && activeRecord?.semesterNumber === s.semesterNumber;
                const status = getStatusBadge(s.eligibilityStatus, s);
                const criteria = getCriteriaStatus(s);
                const isReady = criteria.attendance && criteria.thesis && s.eligibilityStatus === 'Pending';
                
                return (
                  <button
                    key={`${s.enrollmentNo}_${s.semesterNumber}`}
                    onClick={() => {
                      setActiveId(`${s.enrollmentNo}_${s.semesterNumber}`);
                      setShowRejectionForm(false);
                      setRejectionNotes('');
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition-all duration-200 border-2 ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-transparent hover:bg-slate-50/70 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {s.fullName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          {s.enrollmentNo} • Sem {s.semesterNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {s.eligibilityStatus === 'Pending' && isReady && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {s.eligibilityStatus === 'Approved' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        {s.eligibilityStatus === 'Rejected' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        {s.eligibilityStatus === 'Pending' && !isReady && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform ${isActive ? 'translate-x-0.5' : ''}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[8px] text-slate-400 font-semibold">
                        Att: {s.attendancePercentage || 0}%
                      </span>
                      <span className={`text-[8px] font-semibold ${s.thesisApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {s.thesisApproved ? '✓ Thesis' : '✗ Thesis'}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 font-medium">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No records in this category
              </div>
            )}
          </div>

          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            
            {activeRecord ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">
                        {activeRecord.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{activeRecord.fullName}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {activeRecord.enrollmentNo} • {activeRecord.course} • Sem {activeRecord.semesterNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${getStatusBadge(activeRecord.eligibilityStatus, activeRecord).color}`}>
                      {getStatusBadge(activeRecord.eligibilityStatus, activeRecord).label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className={`rounded-2xl p-5 border-2 transition-all ${
                    (activeRecord.attendancePercentage || 0) >= 75 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-amber-200 bg-amber-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          (activeRecord.attendancePercentage || 0) >= 75 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Attendance</h4>
                          <span className={`text-sm font-black ${(activeRecord.attendancePercentage || 0) >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {activeRecord.attendancePercentage || 0}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-2">
                            {(activeRecord.attendancePercentage || 0) >= 75 ? '✓ Meets 75%' : '⚠️ Below 75%'}
                          </span>
                        </div>
                      </div>
                      {(activeRecord.attendancePercentage || 0) >= 75 ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                  </div>

                  <div className={`rounded-2xl p-5 border-2 transition-all ${
                    activeRecord.thesisApproved 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-amber-200 bg-amber-50/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activeRecord.thesisApproved 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Thesis</h4>
                          <span className={`text-sm font-black ${activeRecord.thesisApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {activeRecord.thesisApproved ? 'Approved ✓' : 'Pending'}
                          </span>
                          {activeRecord.thesisDocumentUrl && (
                            <a 
                              href={getUploadUrl(activeRecord.thesisDocumentUrl)}
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline font-medium ml-2 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {activeRecord.eligibilityStatus === 'Pending' && (
                        <div className="flex items-center gap-1.5">
                          {!activeRecord.thesisApproved && activeRecord.thesisDocumentUrl ? (
                            <button
                              onClick={() => handleThesisToggle(activeRecord, true)}
                              disabled={isThesisLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                              Approve Thesis
                            </button>
                          ) : activeRecord.thesisApproved ? (
                            <button
                              onClick={() => handleThesisToggle(activeRecord, false)}
                              disabled={isThesisLoading}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-semibold">No doc</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl p-5 border-2 ${
                  activeRecord.eligibilityStatus === 'Approved'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : activeRecord.eligibilityStatus === 'Rejected'
                    ? 'border-rose-200 bg-rose-50/20'
                    : (activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved)
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-amber-200 bg-amber-50/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        activeRecord.eligibilityStatus === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : activeRecord.eligibilityStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : (activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {activeRecord.eligibilityStatus === 'Approved' ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : activeRecord.eligibilityStatus === 'Rejected' ? (
                          <XCircle className="w-6 h-6" />
                        ) : (activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved) ? (
                          <ShieldCheck className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800">Eligibility Status</h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {activeRecord.eligibilityStatus === 'Approved'
                            ? '✅ Student is certified eligible for board exam.'
                            : activeRecord.eligibilityStatus === 'Rejected'
                            ? '❌ Student has been rejected. See notes below.'
                            : activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved
                            ? 'All criteria met. Ready to certify for board exam.'
                            : 'Some criteria not met. Review the checklist above.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black px-3 py-1 rounded-full border ${getStatusBadge(activeRecord.eligibilityStatus, activeRecord).color}`}>
                        {getStatusBadge(activeRecord.eligibilityStatus, activeRecord).label}
                      </span>
                    </div>
                  </div>
                  {activeRecord.eligibilityStatus === 'Rejected' && activeRecord.rejectionNotes && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                      <span className="font-black block text-[9px] uppercase tracking-wider text-rose-600">Rejection Reason:</span>
                      {activeRecord.rejectionNotes}
                    </div>
                  )}
                  {activeRecord.eligibilityStatus === 'Approved' && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                      <span className="font-black block text-[9px] uppercase tracking-wider text-emerald-600">Certified On:</span>
                      {new Date().toLocaleDateString()} by Board Member
                    </div>
                  )}
                </div>

                {activeRecord.eligibilityStatus === 'Pending' && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">Review all criteria before certifying</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setShowRejectionForm(!showRejectionForm)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleCertifyEligibility(activeRecord)}
                        disabled={!(activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved)}
                        className={`flex-1 sm:flex-none px-8 py-2.5 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
                          (activeRecord.attendancePercentage >= 75 && activeRecord.thesisApproved)
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 cursor-pointer'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        Certify Eligibility
                      </button>
                    </div>
                  </div>
                )}

                {showRejectionForm && activeRecord.eligibilityStatus === 'Pending' && (
                  <form onSubmit={handleRejectSubmit} className="space-y-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top duration-200">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-rose-600 tracking-wider mb-2">
                        Rejection Reason <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        placeholder="Provide detailed reason for rejection..."
                        className="w-full px-4 py-3 bg-slate-50 border border-rose-200 focus:border-rose-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all text-xs font-bold leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setShowRejectionForm(false); setRejectionNotes(''); }}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md text-xs uppercase transition-colors cursor-pointer"
                      >
                        Submit Rejection
                      </button>
                    </div>
                  </form>
                )}

                {activeRecord.eligibilityStatus !== 'Pending' && (
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleViewStudent(activeRecord)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Profile
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 font-medium">
                <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-4 stroke-1 animate-pulse" />
                <p className="text-base font-black text-slate-700">No records in this category</p>
                <p className="text-xs text-slate-400 mt-1">Switch to another tab or adjust your filters.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 shadow-sm text-center">
          <Inbox className="w-12 h-12 mx-auto text-gray-300 mb-4 stroke-1 animate-pulse" />
          <p className="text-base font-black text-slate-700">No Student Records Found</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'pending' ? 'All students have been reviewed.' :
             activeTab === 'approved' ? 'No students have been approved yet.' :
             activeTab === 'rejected' ? 'No students have been rejected yet.' :
             'No student records match your filters.'}
          </p>
          {activeTab !== 'pending' && (
            <button
              onClick={() => setActiveTab('pending')}
              className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Go to Pending Reviews
            </button>
          )}
        </div>
      )}

      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Student Profile</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewingStudent.fullName} · Sem {viewingStudent.semesterNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-600 text-left">
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student Name</span>
                    <span className="text-slate-800 font-bold text-sm">{viewingStudent.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrollment ID</span>
                    <span className="text-slate-800 font-mono font-bold">{viewingStudent.enrollmentNo}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Course</span>
                    <span className="text-slate-800 font-bold">{viewingStudent.course}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Batch</span>
                    <span className="text-slate-800 font-bold">{viewingStudent.batch}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Institute</span>
                    <span className="text-slate-800 font-bold">{viewingStudent.institute}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold">Semester {viewingStudent.semesterNumber}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Attendance</span>
                    <span className={`font-bold ${(viewingStudent.attendancePercentage || 0) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {viewingStudent.attendancePercentage || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Thesis Status</span>
                    <span className={`font-bold ${viewingStudent.thesisApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {viewingStudent.thesisApproved ? 'Approved ✓' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Eligibility Status</span>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[10px] font-black border ${
                    viewingStudent.eligibilityStatus === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : viewingStudent.eligibilityStatus === 'Rejected'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {viewingStudent.eligibilityStatus === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {viewingStudent.eligibilityStatus === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                    {viewingStudent.eligibilityStatus === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                    {viewingStudent.eligibilityStatus || 'Pending'}
                  </span>
                </div>
                {viewingStudent.eligibilityStatus === 'Rejected' && viewingStudent.rejectionNotes && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="block text-[8px] uppercase font-black text-rose-600 tracking-wider">Rejection Reason</span>
                    <p className="text-rose-800 font-semibold mt-1 bg-rose-50 p-2 rounded-xl border border-rose-100">
                      {viewingStudent.rejectionNotes}
                    </p>
                  </div>
                )}
              </div>

              {viewingStudent.thesisDocumentUrl && (
                <div>
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider mb-2">Thesis Document</span>
                  <a
                    href={getUploadUrl(viewingStudent.thesisDocumentUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Thesis
                  </a>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      {confirmConfig && (
        <ConfirmModal
          isOpen={true}
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

export default AcademyVerification;
