import { useState, useEffect, useMemo } from 'react';
import { Eye, CheckCircle2, XCircle, ChevronLeft, ChevronRight, X, GraduationCap, BookOpen, Users, AlertTriangle, ClipboardList, ArrowRight, Check } from 'lucide-react';
import examService from '../../../api/exams';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';

const STEPS = [
  { num: 1, label: 'Select Course', icon: BookOpen },
  { num: 2, label: 'Review Eligibility', icon: Users },
  { num: 3, label: 'Submit Application', icon: CheckCircle2 },
];

const InstituteERPExams = ({
  courses = [],
  students = [],
  examApplications = [],
  fetchERPData
}) => {
  const [step, setStep] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [viewingApp, setViewingApp] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feeRecords, setFeeRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFeeRecords = async () => {
      try {
        const res = await academicService.getFeeRecords();
        const records = res?.data?.data || res?.data || [];
        if (Array.isArray(records)) {
          setFeeRecords(records);
        }
      } catch (err) {
        console.error("Failed to fetch fee records", err);
      }
    };
    fetchFeeRecords();
  }, []);

  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(examApplications.length / itemsPerPage) || 1;

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id || courses[0]._id);
    }
  }, [courses, selectedCourseId]);

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    return students.filter(s =>
      String(s.courseId) === String(selectedCourseId)
    );
  }, [students, selectedCourseId]);

  const availableSemesters = useMemo(() => {
    const sems = new Set();
    filteredStudents.forEach(s => {
      if (s.semesters) {
        s.semesters.forEach(sem => sems.add(sem.semesterNumber));
      }
    });
    return Array.from(sems).sort((a, b) => a - b);
  }, [filteredStudents]);

  useEffect(() => {
    if (availableSemesters.length > 0 && !selectedSemester) {
      setSelectedSemester(availableSemesters[0].toString());
    } else if (availableSemesters.length === 0) {
      setSelectedSemester('');
    }
  }, [availableSemesters, selectedSemester]);

  const studentEligibility = useMemo(() => {
    const map = {};
    if (!selectedSemester) return map;
    filteredStudents.forEach(s => {
      const sem = s.semesters?.find(sm => sm.semesterNumber.toString() === selectedSemester.toString());
      if (!sem) {
        map[s.id || s._id] = { isEligible: false, reasonsText: `No record for Sem ${selectedSemester}` };
        return;
      }
      const isAttendanceOk = (sem.attendancePercentage || 0) >= 75;
      const isThesisOk = !!sem.thesisApproved;
      const isExamFeePaid = feeRecords.some(r =>
        (r.student?._id === s._id || r.student === s._id || r.student?.id === s.id || r.student === s.id) &&
        r.paymentPurpose === 'Examination fee' && r.semesterNumber?.toString() === selectedSemester.toString()
      );
      const isEligible = isAttendanceOk && isThesisOk && isExamFeePaid;
      const reasons = [];
      if (!isAttendanceOk) reasons.push(`Attendance low (${sem.attendancePercentage || 0}%)`);
      if (!isThesisOk) reasons.push("Thesis not uploaded");
      if (!isExamFeePaid) reasons.push("Exam fee not paid");
      map[s.id || s._id] = {
        isEligible,
        isAttendanceOk,
        isThesisOk,
        isExamFeePaid,
        reasonsText: reasons.join(", "),
      };
    });
    return map;
  }, [filteredStudents, feeRecords, selectedSemester]);

  const eligibleStudentIds = useMemo(() => {
    return filteredStudents
      .filter(s => studentEligibility[s.id || s._id]?.isEligible)
      .map(s => s.id || s._id);
  }, [filteredStudents, studentEligibility]);

  const canProceedFrom = (s) => {
    if (s === 1) return !!selectedCourseId && !!selectedSemester;
    if (s === 2) return eligibleStudentIds.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canProceedFrom(step)) {
      if (step === 1) {
        setToast({ message: 'Please select a course and semester.', type: 'warning' });
      } else if (step === 2) {
        setToast({ message: 'No eligible students found. Cannot proceed to submit.', type: 'warning' });
      }
      return;
    }
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (eligibleStudentIds.length === 0) {
      setToast({ message: 'No eligible students found.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const selectedCourse = courses.find(c => (c.id || c._id) === selectedCourseId);
      const courseSubjects = selectedCourse?.subjects || ['All'];
      const payload = {
        courseId: selectedCourseId,
        semesterNumber: parseInt(selectedSemester),
        studentIds: eligibleStudentIds,
        subjects: courseSubjects,
        batchId: filteredStudents[0]?.batchId || filteredStudents[0]?.batch?._id || filteredStudents[0]?.batch,
      };
      await examService.applyForExam(payload);
      if (fetchERPData) {
        await fetchERPData();
      }
      setSuccessMsg('Exam Application submitted successfully to the Academic Board!');
      setStep(1);
      setSelectedCourseId('');
      setSelectedSemester('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      let errMsg = 'Failed to submit exam application.';
      if (typeof err.parsedMessage === 'string') {
        errMsg = err.parsedMessage;
      } else if (typeof err.message === 'string' && !err.message.includes('[object Object]')) {
        errMsg = err.message;
      } else if (typeof err.response?.data?.message === 'string') {
        errMsg = err.response.data.message;
      }
      if (apiErrors && Array.isArray(apiErrors) && apiErrors.length > 0) {
        const names = apiErrors.map(e => e.name || e.studentId || '').filter(Boolean).join(', ');
        if (names) errMsg += ` Ineligible: ${names}`;
      }
      setErrorMsg(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const paginatedApplications = examApplications.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = step === s.num;
        const isCompleted = step > s.num;
        const isClickable = s.num < step;
        return (
          <div key={s.num} className="flex items-center">
            {idx > 0 && (
              <div className={`w-12 h-0.5 sm:w-20 ${isCompleted ? 'bg-blue-500' : 'bg-slate-200'}`} />
            )}
            <button
              type="button"
              onClick={() => isClickable && setStep(s.num)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all cursor-pointer ${
                isActive ? 'scale-105' : ''
              } ${!isClickable ? 'opacity-60 cursor-default' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-sm ${
                isCompleted
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : isActive
                    ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                isActive || isCompleted ? 'text-blue-700' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Select Course & Semester
        </h3>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Choose the course and semester to prepare exam applications</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Course *</label>
          <select
            value={selectedCourseId}
            onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedSemester(''); }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
          >
            {courses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.courseName || c.name}</option>)}
            {courses.length === 0 && <option value="">No courses available</option>}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Semester *</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            required
          >
            <option value="">Select Semester</option>
            {availableSemesters.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>
      {selectedCourseId && selectedSemester && (
        <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <div>
            <p className="text-sm font-extrabold text-slate-800">
              {courses.find(c => (c.id || c._id) === selectedCourseId)?.courseName || 'Selected Course'}
            </p>
            <p className="text-[10px] font-bold text-slate-400">
              Semester {selectedSemester} · {filteredStudents.length} student(s) enrolled
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Review Eligibility
        </h3>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Verify each student's eligibility criteria</p>
      </div>
      {selectedCourseId && selectedSemester && (
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 mb-2">
          <p className="text-xs font-bold text-slate-600">
            Course: <span className="text-slate-800">{courses.find(c => (c.id || c._id) === selectedCourseId)?.courseName || 'Selected'}</span>
            <span className="text-slate-300 mx-2">|</span>
            Semester: <span className="text-slate-800">{selectedSemester}</span>
          </p>
        </div>
      )}
      <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
        <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3 font-black">Student</th>
              <th className="px-4 py-3 font-black text-center">Attendance</th>
              <th className="px-4 py-3 font-black text-center">Thesis</th>
              <th className="px-4 py-3 font-black text-center">Fee Paid</th>
              <th className="px-4 py-3 font-black text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
            {filteredStudents.map(s => {
              const e = studentEligibility[s.id || s._id];
              const sid = s.id || s._id;
              return (
                <tr key={sid} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-extrabold text-slate-800 block">{s.fullName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{s.enrollmentNo || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e ? (
                      e.isAttendanceOk
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e ? (
                      e.isThesisOk
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e ? (
                      e.isExamFeePaid
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e ? (
                      e.isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] uppercase font-black">
                          <CheckCircle2 className="w-3 h-3" />
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[9px] uppercase font-black" title={e.reasonsText}>
                          <XCircle className="w-3 h-3" />
                          Ineligible
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300 text-[9px] uppercase font-black">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                  No students found for this course and semester.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <CheckCircle2 className="w-4 h-4" />
          Eligible: {eligibleStudentIds.length}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
          <XCircle className="w-4 h-4" />
          Ineligible: {filteredStudents.length - eligibleStudentIds.length}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedCourse = courses.find(c => (c.id || c._id) === selectedCourseId);
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Submit Application
          </h3>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Review and submit the exam application to the Academic Board</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Course</span>
            <span className="text-sm font-extrabold text-slate-800">{selectedCourse?.courseName || 'Selected Course'}</span>
          </div>
          <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Semester</span>
            <span className="text-sm font-extrabold text-slate-800">Semester {selectedSemester}</span>
          </div>
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Eligible Students</span>
            <span className="text-sm font-extrabold text-emerald-700">{eligibleStudentIds.length}</span>
          </div>
          <div className="bg-slate-50/40 border border-slate-100 rounded-2xl p-4">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Total Enrolled</span>
            <span className="text-sm font-extrabold text-slate-700">{filteredStudents.length}</span>
          </div>
        </div>
        <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Review before submitting</p>
            <p className="text-[10px] text-amber-700 mt-0.5">This will create exam applications for all {eligibleStudentIds.length} eligible student(s). Ineligible students will be excluded.</p>
          </div>
        </div>
        {submitting && (
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs">
            <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            Submitting exam application...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Exam Management Console</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Submit student exam registrations and manage applications history</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          {renderStepIndicator()}

          <div className="min-h-[260px]">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || eligibleStudentIds.length === 0}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Applications Registry</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Historical registry of submitted exam registrations</p>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
              <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-4 font-black w-12 text-center">#</th>
                    <th className="px-4 py-4 font-black">Course</th>
                    <th className="px-4 py-4 font-black text-center">Students</th>
                    <th className="px-4 py-4 font-black text-center">Status</th>
                    <th className="px-4 py-4 font-black text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
                  {paginatedApplications.map((app, idx) => {
                    const globalIdx = (activePage - 1) * itemsPerPage + idx;
                    const serialNo = String(globalIdx + 1).padStart(2, '0');
                    return (
                      <tr key={app._id || app.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-700 block">{app.course?.name || 'Course'}</span>
                          <span className="text-[10px] text-slate-400">Sem {app.semesterNumber}</span>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-slate-700">{app.students?.length || 0}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] uppercase font-black border ${
                            app.status === 'Approved'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                              : app.status === 'SchedulePublished'
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : app.status === 'Rejected'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                                  : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                          }`}>
                            {app.status === 'SchedulePublished' ? 'Schedule Published' : (app.status || 'Pending')}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingApp(app)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Application Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {examApplications.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                        No exam applications submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {examApplications.length > 0 && (
            <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600 pt-4 border-t border-slate-50 mt-4">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setActivePage(prev => Math.max(prev - 1, 1))}
                className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActivePage(num)}
                  className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                    activePage === num
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                disabled={activePage === totalPages}
                onClick={() => setActivePage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col scale-in-center text-left">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Exam Request Review</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Exam Application Record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Reference ID</span>
                  <span className="text-slate-800 font-mono font-bold">{viewingApp._id || viewingApp.id}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] uppercase font-black border ${
                    viewingApp.status === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                      : viewingApp.status === 'Rejected'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                        : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                  }`}>
                    {viewingApp.status || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Course Program</span>
                    <span className="text-slate-800 font-bold">{viewingApp.course?.name || 'Course'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold">{viewingApp.semesterNumber}</span>
                  </div>
                </div>
              </div>
              {(viewingApp.status === 'Approved' || viewingApp.status === 'SchedulePublished') && viewingApp.scheduledDate && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="block text-[9px] uppercase font-black text-emerald-500 tracking-wider">Scheduled Exam Date</span>
                    <span className="text-emerald-900 font-black text-xs">{new Date(viewingApp.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              )}
              {viewingApp.status === 'SchedulePublished' && viewingApp.subjectSchedules && viewingApp.subjectSchedules.length > 0 && (
                <div>
                  <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2">Subject Wise Schedule</span>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
                          <th className="px-3 py-2">Subject</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                        {viewingApp.subjectSchedules.map((s, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-bold">{s.subject}</td>
                            <td className="px-3 py-2">{new Date(s.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{s.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewingApp.remarks && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider mb-1">Board Feedback / Remarks</span>
                  <p className="text-slate-700 font-semibold">{viewingApp.remarks}</p>
                </div>
              )}
              <div>
                <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider mb-2">Enrolled Candidates ({viewingApp.students?.length || 0})</span>
                <div className="border border-slate-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2 font-mono">Enrollment ID</th>
                        <th className="px-3 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                      {viewingApp.students?.map(s => (
                        <tr key={s._id || s.enrollmentId}>
                          <td className="px-3 py-2 font-bold">{s.firstName} {s.lastName}</td>
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{s.enrollmentId}</td>
                          <td className="px-3 py-2 text-slate-500">{s.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default InstituteERPExams;
