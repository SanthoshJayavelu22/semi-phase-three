import React, { useState, useMemo } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, FileText, ChevronRight, UserCheck, Inbox } from 'lucide-react';
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
  const [internalSelectedId, setInternalSelectedId] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [filterInstitute, setFilterInstitute] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  const institutes = useMemo(() => [...new Set(students.map(s => s.institute).filter(Boolean))], [students]);
  const courses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))], [students]);
  const batches = useMemo(() => [...new Set(students.map(s => s.batch).filter(Boolean))], [students]);

  const activeId = selectedStudentId !== undefined && selectedStudentId !== '' ? selectedStudentId : internalSelectedId;
  const setActiveId = setSelectedStudentId !== undefined ? setSelectedStudentId : setInternalSelectedId;

  // List of student-semester pairs that are pending review
  const pendingStudents = useMemo(() => {
    const list = [];
    students.forEach(s => {
      if (filterInstitute && s.institute !== filterInstitute) return;
      if (filterCourse && s.course !== filterCourse) return;
      if (filterBatch && s.batch !== filterBatch) return;

      if (s.semesters && Array.isArray(s.semesters)) {
        s.semesters.forEach(sem => {
          if (sem.eligibilityStatus === 'Pending' || !sem.eligibilityStatus) {
            list.push({
              ...s,
              semesterNumber: sem.semesterNumber,
              attendancePercentage: sem.attendancePercentage,
              thesisApproved: sem.thesisApproved,
              eligibilityStatus: sem.eligibilityStatus || 'Pending'
            });
          }
        });
      }
    });
    return list;
  }, [students, filterInstitute, filterCourse, filterBatch]);

  // Current selected student-semester
  const activeStudent = useMemo(() => {
    // internalSelectedId is now in format `${enrollmentNo}_${semesterNumber}`
    const found = pendingStudents.find(s => `${s.enrollmentNo}_${s.semesterNumber}` === activeId);
    if (found) return found;
    return pendingStudents[0] || null;
  }, [pendingStudents, activeId]);

  // Automatically select first pending student if selection is empty or invalid
  React.useEffect(() => {
    if ((!activeId || !pendingStudents.find(s => `${s.enrollmentNo}_${s.semesterNumber}` === activeId)) && pendingStudents.length > 0) {
      setActiveId(`${pendingStudents[0].enrollmentNo}_${pendingStudents[0].semesterNumber}`);
    }
  }, [pendingStudents, activeId, setActiveId]);

  const handleApprove = () => {
    if (!activeStudent) return;
    setConfirmConfig({
      title: 'Approve Exam Eligibility',
      message: `Are you sure you want to APPROVE the exam eligibility for ${activeStudent.fullName} (Semester ${activeStudent.semesterNumber})?`,
      type: 'success',
      confirmText: 'Yes, Approve',
      onConfirm: () => {
        setConfirmConfig(null);
        onVerifyStudent(activeStudent.enrollmentNo, activeStudent.semesterNumber, 'Approved');
        setRejectionNotes('');
        setShowRejectionForm(false);
      }
    });
  };

  const handleReject = (e) => {
    e.preventDefault();
    if (!activeStudent) return;
    if (!rejectionNotes.trim()) {
      setToast({ message: 'Please enter auditor rejection notes before submitting.', type: 'warning' });
      return;
    }
    onVerifyStudent(activeStudent.enrollmentNo, activeStudent.semesterNumber, 'Rejected', rejectionNotes);
    setRejectionNotes('');
    setShowRejectionForm(false);
  };

  const handleApproveThesis = async () => {
    if (!activeStudent) return;
    try {
      await academicService.updateAcademicMetrics(activeStudent._id || activeStudent.id, {
        semesterNumber: activeStudent.semesterNumber,
        thesisApproved: true
      });
      setToast({ message: 'Thesis approved successfully.', type: 'success' });
      if (fetchBoardData) {
        await fetchBoardData();
      }
    } catch (err) {
      setToast({ message: 'Failed to approve thesis.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Eligibility Verification</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Certify candidate qualifications, clinical criteria and credentials for final board exams
          </span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-2">
          <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
          <span className="text-xs font-black text-indigo-900">{pendingStudents.length} Students Awaiting Audit</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <select 
          value={filterInstitute}
          onChange={(e) => setFilterInstitute(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="">All Institutes</option>
          {institutes.map(inst => <option key={inst} value={inst}>{inst}</option>)}
        </select>
        <select 
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="">All Courses</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select 
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
        >
          <option value="">All Batches</option>
          {batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {activeStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: List of pending candidates */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">Pending Queue</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {pendingStudents.length > 0 ? (
                pendingStudents.map(s => (
                  <button
                    key={`${s.enrollmentNo}_${s.semesterNumber}`}
                    onClick={() => {
                      setActiveId(`${s.enrollmentNo}_${s.semesterNumber}`);
                      setShowRejectionForm(false);
                      setRejectionNotes('');
                    }}
                    className={`w-full p-4 border rounded-2xl text-left transition-all duration-200 flex justify-between items-center group ${
                      activeStudent.enrollmentNo === s.enrollmentNo && activeStudent.semesterNumber === s.semesterNumber
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <span className="text-xs font-black text-slate-900 block truncate group-hover:text-blue-600 transition-colors">{s.fullName}</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-1 truncate">{s.institute} | Sem {s.semesterNumber}</span>
                      <span className="font-mono text-[9px] font-extrabold text-slate-500 block mt-0.5">{s.enrollmentNo}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-transform ${activeStudent.enrollmentNo === s.enrollmentNo && activeStudent.semesterNumber === s.semesterNumber ? 'translate-x-1' : ''}`} />
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 font-medium">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  All candidates audited!
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Inspection & Actions */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-md">Auditing Candidate (Sem {activeStudent.semesterNumber})</span>
                <h3 className="text-lg font-black text-slate-900 mt-2">{activeStudent.fullName}</h3>
                <span className="text-[10px] text-slate-400 font-semibold">{activeStudent.course} | {activeStudent.batch}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-black text-slate-400 block">Enrollment ID</span>
                <span className="font-mono font-black text-sm text-slate-700 block mt-0.5">{activeStudent.enrollmentNo}</span>
              </div>
            </div>

            {/* Eligibility Status Display */}
            <div className={`p-4 rounded-2xl border ${
              activeStudent.attendancePercentage >= 75 && activeStudent.thesisApproved
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {activeStudent.attendancePercentage >= 75 && activeStudent.thesisApproved ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-amber-600" />
                )}
                <div>
                  <span className={`font-black text-sm ${
                    activeStudent.attendancePercentage >= 75 && activeStudent.thesisApproved ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {activeStudent.attendancePercentage >= 75 && activeStudent.thesisApproved ? '✅ Student meets all eligibility criteria' : '⚠️ Student does not meet all eligibility criteria'}
                  </span>
                  <div className="flex gap-4 mt-1 text-xs font-bold">
                    <span className={activeStudent.attendancePercentage >= 75 ? 'text-emerald-600' : 'text-red-500'}>
                      Attendance: {activeStudent.attendancePercentage || 0}% {activeStudent.attendancePercentage >= 75 ? '✓' : '✗'}
                    </span>
                    <span className={activeStudent.thesisApproved ? 'text-emerald-600' : 'text-red-500'}>
                      Thesis: {activeStudent.thesisApproved ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info Sheet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 border border-slate-100 rounded-2xl p-6">
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">Assigned Institution</span>
                <span className="text-xs font-black text-slate-800 mt-1 block">{activeStudent.institute || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">Email Address</span>
                <span className="text-xs font-bold text-slate-700 mt-1 block font-mono">{activeStudent.email}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">EM Qualification Details</span>
                <span className="text-xs font-extrabold text-slate-800 mt-1 block">{activeStudent.qualification || 'MBBS'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-slate-400 block">Registration Status</span>
                <span className={`inline-flex mt-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  ['Approved', 'Enrolled', 'Completed'].includes(activeStudent.status)
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : activeStudent.status === 'Rejected'
                    ? 'text-rose-700 bg-rose-50 border border-rose-200'
                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                }`}>
                  {activeStudent.status || 'Pending'}
                </span>
              </div>
            </div>
            {activeStudent.documents?.thesisDocumentUrl && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Thesis Document</span>
                  <a 
                    href={getUploadUrl(activeStudent.documents.thesisDocumentUrl)}
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs"
                  >
                    <FileText className="w-4 h-4" />
                    View Submitted Thesis
                  </a>
                </div>
                {!activeStudent.thesisApproved ? (
                  <button
                    onClick={handleApproveThesis}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase font-black tracking-wider rounded-xl transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    Approve Thesis
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] uppercase font-black tracking-wider rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Thesis Approved
                  </span>
                )}
              </div>
            )}

            {/* Reject reason details sheet */}
            {showRejectionForm && (
              <form onSubmit={handleReject} className="space-y-4 border-t border-slate-100 pt-6 animate-in slide-in-from-top duration-250">
                <div>
                  <label className="block text-[10px] uppercase font-black text-rose-600 tracking-wider mb-2">Audit Rejection Notes</label>
                  <textarea
                    required
                    rows="3"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Provide detailed auditor notes for candidate rejection. e.g. MBBS graduation date does not match the registration timeline requirements."
                    className="w-full px-4 py-3 bg-slate-50 border border-rose-200 focus:border-rose-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all font-bold text-xs leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionNotes('');
                    }}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md text-xs uppercase transition-colors"
                  >
                    Submit Rejection
                  </button>
                </div>
              </form>
            )}

            {/* Certification bottom action bar */}
            {!showRejectionForm && (
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-500">I certify that MBBS degree and State Registration are verified</span>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  {!['Approved', 'Rejected'].includes(activeStudent.status) ? (
                    <>
                      <button
                        onClick={() => setShowRejectionForm(true)}
                        className="flex-grow sm:flex-grow-0 px-6 py-3 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                      >
                        Reject Eligibility
                      </button>
                      <button
                        onClick={handleApprove}
                        className="flex-grow sm:flex-grow-0 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                      >
                        Approve & Certify
                      </button>
                    </>
                  ) : (
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border ${activeStudent.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      {activeStudent.status === 'Approved' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="text-[10px] uppercase font-black tracking-wider">
                        {activeStudent.status === 'Approved' ? 'Verified & Certified' : 'Eligibility Rejected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl p-16 shadow-sm text-center">
          <Inbox className="w-12 h-12 mx-auto text-gray-300 mb-4 stroke-1 animate-pulse" />
          <p className="text-base font-black text-slate-700">No Pending Candidate Verifications</p>
          <p className="text-xs text-slate-400 mt-1">All registered students have been audited for exam eligibility.</p>
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