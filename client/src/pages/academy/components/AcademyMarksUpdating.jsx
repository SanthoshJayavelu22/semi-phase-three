import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  User,
  GraduationCap,
  BookOpen,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  Users,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Loader2,
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import marksService from '../../../api/marks';
import Pagination from '../../../Components/Pagination';

const STATUS_CYCLE = ['', 'PASS', 'FAIL', 'ABSENT'];

const AcademyMarksUpdating = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExamination, setSelectedExamination] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableExaminations] = useState([1, 2]);
  const [studentListPage, setStudentListPage] = useState(1);
  const studentsPerPage = 10;

  // ─── Status & Normalization Helpers ────────────────────────────────────────
  const deriveStatusFromMark = useCallback((m) => {
    if (!m) return '';
    if (m.status && typeof m.status === 'string' && m.status.trim() !== '') {
      return m.status.toUpperCase();
    }
    if (m.isAbsent === true || m.grade === 'ABSENT') return 'ABSENT';
    if (m.grade === 'F' || m.marksObtained === 0) return 'FAIL';
    if (m.marksObtained !== null && m.marksObtained !== undefined && m.marksObtained !== '') {
      return Number(m.marksObtained) >= 50 ? 'PASS' : 'FAIL';
    }
    if (m.grade && typeof m.grade === 'string' && m.grade.trim() !== '') {
      return ['O', 'A+', 'A', 'B+', 'B', 'C', 'D'].includes(m.grade) ? 'PASS' : '';
    }
    return '';
  }, []);

  const deriveMarkFromStatus = useCallback((status) => {
    if (status === 'ABSENT') return null;
    if (status === 'PASS') return 100;
    if (status === 'FAIL') return 0;
    return null;
  }, []);

  const normalizeStudent = useCallback(
    (student) => {
      if (!student) return null;
      const marks = (student.marks || []).map((m, idx) => {
        const status = deriveStatusFromMark(m);
        const subjectCode = m.subjectCode || m.code || `SUB${idx + 1}`;
        const subjectName = m.subjectName || m.name || m.subject || `Subject ${idx + 1}`;
        return {
          ...m,
          subjectCode,
          subjectName,
          status,
          isAbsent: status === 'ABSENT' || m.isAbsent === true,
          marksObtained:
            m.marksObtained !== null && m.marksObtained !== undefined
              ? m.marksObtained
              : deriveMarkFromStatus(status),
        };
      });
      return {
        ...student,
        marks,
      };
    },
    [deriveStatusFromMark, deriveMarkFromStatus]
  );

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBatch !== 'All') params.batchId = selectedBatch;
      if (selectedCourse !== 'All') params.courseId = selectedCourse;
      if (selectedInstitute !== 'All') params.instituteId = selectedInstitute;
      if (searchQuery) params.search = searchQuery;
      if (selectedExamination) params.examinationNumber = selectedExamination;

      const res = await marksService.getStudentsWithMarks(params);
      const data = res.data?.data || res.data || [];
      const normalizedData = data.map(normalizeStudent);
      setStudents(normalizedData);
      setSelectedStudent((prev) => {
        if (!prev?._id) return prev;
        const fresh = normalizedData.find((s) => s._id === prev._id);
        return fresh ? fresh : prev;
      });
    } catch (err) {
      console.error('Error fetching students:', err);
      setToast({ message: err.parsedMessage || 'Failed to load students.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedCourse, selectedInstitute, searchQuery, selectedExamination, normalizeStudent]);

  useEffect(() => {
    const id = setTimeout(() => fetchStudents(), 0);
    return () => clearTimeout(id);
  }, [fetchStudents]);

  // Refresh selected student's marks when examination changes
  useEffect(() => {
    if (!selectedStudent?._id) return;
    let cancelled = false;
    marksService
      .getStudentMarks(selectedStudent._id, selectedExamination)
      .then(async (res) => {
        if (cancelled) return;
        const data = res.data?.data || res.data;
        if (data) {
          let normalized = normalizeStudent(data);
          const courseId = data.course?._id || data.course;
          if ((!normalized.marks || normalized.marks.length === 0) && courseId) {
            try {
              const subjRes = await marksService.getCourseSubjects(courseId, selectedExamination);
              const subjects = subjRes.data?.data || [];
              if (subjects.length > 0 && !cancelled) {
                const seeded = subjects.map((s, idx) => ({
                  subjectCode: s.code || s.subjectCode || `SUB${idx + 1}`,
                  subjectName: s.name || s.subjectName || `Subject ${idx + 1}`,
                  marksObtained: null,
                  totalMarks: 100,
                  isAbsent: false,
                  grade: '',
                  status: '',
                }));
                normalized = { ...normalized, marks: seeded };
              }
            } catch {
              // ignore
            }
          }
          if (!cancelled) {
            setSelectedStudent(normalized);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedExamination, normalizeStudent, selectedStudent?._id]);

  // ─── Derived Data ──────────────────────────────────────────────────────────
  const batchOptions = useMemo(() => {
    const seen = new Map();
    students.forEach((s) => {
      const b = s.batch;
      if (!b) return;
      const id = b._id || b.id;
      if (!seen.has(id)) seen.set(id, b.name || `Batch ${b.year}`);
    });
    return [{ id: 'All', label: 'All Batches' }, ...Array.from(seen, ([id, label]) => ({ id, label }))];
  }, [students]);

  const courseOptions = useMemo(() => {
    const seen = new Map();
    students.forEach((s) => {
      const c = s.course;
      if (!c) return;
      const id = c._id || c.id;
      if (!seen.has(id)) seen.set(id, c.name);
    });
    return [{ id: 'All', label: 'All Courses' }, ...Array.from(seen, ([id, label]) => ({ id, label }))];
  }, [students]);

  const instituteOptions = useMemo(() => {
    const seen = new Map();
    students.forEach((s) => {
      const inst = s.institute;
      if (!inst) return;
      const id = inst._id || inst.id;
      if (!seen.has(id)) seen.set(id, inst.orgName);
    });
    return [{ id: 'All', label: 'All Institutes' }, ...Array.from(seen, ([id, label]) => ({ id, label }))];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.enrollmentId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBatch = selectedBatch === 'All' || String(s.batch?._id || s.batch?.id) === selectedBatch;
      const matchCourse = selectedCourse === 'All' || String(s.course?._id || s.course?.id) === selectedCourse;
      const matchInstitute =
        selectedInstitute === 'All' || String(s.institute?._id || s.institute?.id) === selectedInstitute;
      return matchSearch && matchBatch && matchCourse && matchInstitute;
    });
  }, [students, searchQuery, selectedBatch, selectedCourse, selectedInstitute]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStudentListPage(1);
  }, [searchQuery, selectedBatch, selectedCourse, selectedInstitute]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = useMemo(
    () => filteredStudents.slice((studentListPage - 1) * studentsPerPage, studentListPage * studentsPerPage),
    [filteredStudents, studentListPage, studentsPerPage]
  );

  // ─── Student Selection ─────────────────────────────────────────────────────
  const handleSelectStudent = useCallback(
    async (student) => {
      const normalized = normalizeStudent(student);
      setSelectedStudent(normalized);

      const courseId = student.course?._id || student.course;
      if (courseId) {
        try {
          const res = await marksService.getCourseSubjects(courseId, selectedExamination);
          const subjects = res.data?.data || [];
          if (subjects.length > 0) {
            setSelectedStudent((prev) => {
              if (!prev || prev._id !== student._id) return prev;
              const currentMarks = prev.marks || [];
              if (currentMarks.length === 0) {
                const seeded = subjects.map((s, idx) => ({
                  subjectCode: s.code || s.subjectCode || `SUB${idx + 1}`,
                  subjectName: s.name || s.subjectName || `Subject ${idx + 1}`,
                  marksObtained: null,
                  totalMarks: 100,
                  isAbsent: false,
                  grade: '',
                  status: '',
                }));
                return { ...prev, marks: seeded };
              }
              // If current marks are missing subjectName or subjectCode, enrich them:
              const enriched = currentMarks.map((m, idx) => {
                const subCode = m.subjectCode || m.code;
                const subName = m.subjectName || m.name;
                const match =
                  subjects.find(
                    (s) =>
                      (subCode && s.code && s.code.toLowerCase() === subCode.toLowerCase()) ||
                      (subName && s.name && s.name.toLowerCase() === subName.toLowerCase())
                  ) || subjects[idx];

                return {
                  ...m,
                  subjectCode: subCode || match?.code || match?.subjectCode || `SUB${idx + 1}`,
                  subjectName: subName || match?.name || match?.subjectName || `Subject ${idx + 1}`,
                };
              });
              return { ...prev, marks: enriched };
            });
          }
        } catch (err) {
          console.error('Error fetching course subjects:', err);
        }
      }
    },
    [normalizeStudent, selectedExamination]
  );

  // ─── Result Handlers ──────────────────────────────────────────────────────
  const handleStatusChange = useCallback(
    (subjectCode, status) => {
      if (!selectedStudent) return;
      const marks = (selectedStudent.marks || []).map((m) => {
        if (m.subjectCode !== subjectCode) return m;
        return {
          ...m,
          status,
          isAbsent: status === 'ABSENT',
          marksObtained: deriveMarkFromStatus(status),
        };
      });
      setSelectedStudent({ ...selectedStudent, marks });
    },
    [selectedStudent, deriveMarkFromStatus]
  );

  const handleCycleStatus = useCallback(
    (subjectCode, current) => {
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      handleStatusChange(subjectCode, next);
    },
    [handleStatusChange]
  );

  const handleAddSubject = useCallback(() => {
    if (!selectedStudent) return;
    const currentMarks = selectedStudent.marks || [];
    const nextIdx = currentMarks.length + 1;
    const newSubject = {
      subjectCode: `SUB-${nextIdx}`,
      subjectName: `Subject ${nextIdx}`,
      marksObtained: null,
      totalMarks: 100,
      isAbsent: false,
      grade: '',
      status: '',
    };
    setSelectedStudent({
      ...selectedStudent,
      marks: [...currentMarks, newSubject],
    });
  }, [selectedStudent]);

  const handleRemoveSubject = useCallback(
    (subjectCode) => {
      if (!selectedStudent) return;
      setConfirmConfig({
        title: 'Remove Subject',
        message: 'Are you sure you want to remove this subject?',
        type: 'danger',
        confirmText: 'Remove',
        onConfirm: () => {
          setConfirmConfig(null);
          setSelectedStudent({
            ...selectedStudent,
            marks: selectedStudent.marks.filter((m) => m.subjectCode !== subjectCode),
          });
          setToast({ message: 'Subject removed successfully.', type: 'success' });
        },
      });
    },
    [selectedStudent]
  );

  // ─── Save Results ────────────────────────────────────────────────────────
  const handleSaveMarks = useCallback(async () => {
    const studentId = selectedStudent?._id || selectedStudent?.id;
    if (!selectedStudent || !studentId) {
      setToast({ message: 'Please select a student first.', type: 'warning' });
      return;
    }

    const marks = selectedStudent.marks || [];
    if (marks.length === 0) {
      setToast({ message: 'No subjects to save.', type: 'warning' });
      return;
    }

    const emptySubjects = marks.filter((m) => !m.status);
    if (emptySubjects.length > 0) {
      setToast({
        message: `Cannot save — ${emptySubjects.length} subject(s) have no result recorded.`,
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        examinationNumber: Number(selectedExamination),
        subjects: marks.map((m, idx) => ({
          subjectCode: m.subjectCode || m.code || `SUB-${idx + 1}`,
          subjectName: m.subjectName || m.name || m.subject || `Subject ${idx + 1}`,
          marksObtained: deriveMarkFromStatus(m.status),
          isAbsent: m.status === 'ABSENT',
          totalMarks: Number(m.totalMarks) || 100,
          status: m.status,
        })),
      };

      await marksService.updateStudentMarks(studentId, payload);

      await fetchStudents();

      const updatedRes = await marksService.getStudentMarks(studentId, selectedExamination);
      const updatedData = updatedRes.data?.data || updatedRes.data;
      if (updatedData) {
        setSelectedStudent(normalizeStudent(updatedData));
      }

      setToast({ message: 'Results saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Error saving results:', err);
      setToast({ message: err.parsedMessage || err.response?.data?.message || 'Failed to save results.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStudent, selectedExamination, fetchStudents, deriveMarkFromStatus, normalizeStudent]);

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (status === 'PASS') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    if (status === 'FAIL') return 'bg-rose-100 text-rose-700 border-rose-300';
    if (status === 'ABSENT') return 'bg-slate-200 text-slate-600 border-slate-300';
    return 'bg-slate-100 text-slate-500 border-slate-300';
  };

  const overall = selectedStudent
    ? (() => {
        const rows = selectedStudent.marks || [];
        const entered = rows.filter((r) => !!r.status);
        const passed = entered.filter((r) => r.status === 'PASS').length;
        const failed = entered.filter((r) => r.status === 'FAIL' || r.status === 'ABSENT').length;
        const status = entered.length > 0 && failed === 0 ? 'PASS' : entered.length > 0 ? 'FAIL' : '';
        return { total: rows.length, entered: entered.length, passed, failed, status };
      })()
    : { total: 0, entered: 0, passed: 0, failed: 0, status: '' };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Marks Management</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Record and manage student examination results •{' '}
              <span className="font-bold text-blue-600">{students.length}</span> students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStudents();
              setToast({ message: 'Data refreshed!', type: 'success' });
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── LEFT PANEL: Student Selection ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Student Registry
            </h3>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                {batchOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedInstitute}
                onChange={(e) => setSelectedInstitute(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                {instituteOptions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Examination Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2.5">
              Select Examination
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableExaminations.map((exam) => (
                <button
                  key={exam}
                  onClick={() => setSelectedExamination(exam)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedExamination === exam
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Exam {exam}
                </button>
              ))}
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  <p className="text-xs text-slate-500 mt-2 font-medium">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No students found.</p>
                </div>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedStudent?._id === student._id;
                  const currentStudent = isSelected && selectedStudent ? selectedStudent : student;
                  const marks = currentStudent.marks || [];
                  const totalSubjects = marks.length;
                  const enteredCount = marks.filter(
                    (m) =>
                      m?.isAbsent === true ||
                      (typeof m?.status === 'string' && m.status.trim() !== '') ||
                      (typeof m?.resultStatus === 'string' && m.resultStatus.trim() !== '') ||
                      (m?.marksObtained !== null && m?.marksObtained !== undefined && m?.marksObtained !== '') ||
                      (typeof m?.grade === 'string' && m.grade.trim() !== '' && m.grade !== 'NOT RECORDED')
                  ).length;

                  const isComplete = totalSubjects > 0 && enteredCount === totalSubjects;
                  const isPartial = enteredCount > 0 && enteredCount < totalSubjects;

                  return (
                    <button
                      key={student._id}
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-all ${
                        isSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {student.fullName?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 truncate">{student.fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold text-blue-600">{student.enrollmentId}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">{student.batch?.year || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {isComplete ? (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                ✓ Complete
                              </span>
                            ) : isPartial ? (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                ⚠ Partial
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                ✗ Not Recorded
                              </span>
                            )}
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-500">{student.course?.name || 'N/A'}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <Pagination
              currentPage={studentListPage}
              totalPages={totalStudentPages}
              onPageChange={setStudentListPage}
              totalItems={filteredStudents.length}
              itemsPerPage={studentsPerPage}
            />
          </div>
        </div>

        {/* ─── RIGHT PANEL: Marks Entry ─────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-3">
          {selectedStudent ? (
            <>
              {/* Student Info Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
                      {selectedStudent.fullName?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{selectedStudent.fullName}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                        <span className="font-mono font-bold text-blue-600 text-sm">{selectedStudent.enrollmentId}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {selectedStudent.course?.name || 'N/A'}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Examination {selectedExamination}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Overall:</span>
                    <span
                      className={`text-lg font-black ${
                        overall.status === 'PASS'
                          ? 'text-emerald-600'
                          : overall.status === 'FAIL'
                            ? 'text-rose-600'
                            : 'text-slate-400'
                      }`}
                    >
                      {overall.status === 'PASS' ? 'PASS' : overall.status === 'FAIL' ? 'FAIL' : 'N/A'}
                    </span>
                    {overall.entered > 0 && (
                      <span className="text-xs text-slate-500">({overall.passed} passed, {overall.failed} failed)</span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Subjects</span>
                    <p className="text-lg font-black text-slate-800">{selectedStudent.marks?.length || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Passed</span>
                    <p className="text-lg font-black text-emerald-600">
                      {overall.passed}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Failed</span>
                    <p className="text-lg font-black text-rose-600">
                      {overall.failed}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Attendance</span>
                    <p
                      className={`text-lg font-black ${
                        selectedStudent.attendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {selectedStudent.attendancePercentage || 0}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Thesis</span>
                    <p
                      className={`text-lg font-black ${
                        selectedStudent.thesisApproved ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {selectedStudent.thesisApproved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Marks Table ──────────────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-700">Result Entry - Examination {selectedExamination}</h4>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-medium text-slate-500">
                      {selectedStudent.marks?.length || 0} subjects
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddSubject}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Subject
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto p-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200">
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-12 text-center">
                          #
                        </th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-44 text-center">
                          Result
                        </th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-20 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(selectedStudent.marks || []).map((subject, idx) => {
                        const status = subject.status || '';
                        const isAbsent = status === 'ABSENT';

                        return (
                          <tr
                            key={subject.subjectCode || `subject-${selectedStudent._id}-${idx}`}
                            className={`hover:bg-slate-50/70 transition-colors ${isAbsent ? 'bg-rose-50/40' : ''}`}
                          >
                            <td className="px-4 py-3.5 text-center font-bold text-slate-400 text-sm">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="px-4 py-3.5">
                              <div>
                                <span className="text-sm font-bold text-slate-800">
                                  {subject.subjectName || subject.name || subject.subject || `Subject ${idx + 1}`}
                                </span>
                                <span className="ml-2.5 text-xs font-mono text-slate-400">
                                  {subject.subjectCode || subject.code || `SUB${idx + 1}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleCycleStatus(subject.subjectCode, status)}
                                title="Click to cycle: NOT RECORDED → PASS → FAIL → ABSENT"
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${getStatusBadge(status)}`}
                              >
                                {status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />}
                                {status === 'FAIL' && <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-600" />}
                                {isAbsent ? 'ABSENT' : status || 'NOT RECORDED'}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleRemoveSubject(subject.subjectCode)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Remove Subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {(selectedStudent.marks || []).length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-5 py-12 text-center">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-base font-medium text-slate-500">No subjects added yet.</p>
                            <p className="text-sm text-slate-400 mt-1">Click "Add Subject" to begin recording results.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {(selectedStudent.marks || []).length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100/70 border-t-2 border-slate-200">
                          <td colSpan="2" className="px-4 py-3.5 font-black text-sm text-slate-700">
                            Total / Overall
                          </td>
                          <td colSpan="2" className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-black border ${
                                overall.status === 'PASS'
                                  ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                  : overall.status === 'FAIL'
                                    ? 'bg-rose-100 border-rose-200 text-rose-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-500'
                              }`}
                            >
                              {overall.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              {overall.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-600" />}
                              {overall.status ? overall.status : 'NOT RECORDED'}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ─── Bottom Actions & Submit ───────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">
                    <span className="font-bold text-emerald-700">PASS</span> = Green •
                    <span className="font-bold text-rose-700 ml-1">FAIL / ABSENT</span> = Red •
                    Click the result to cycle through options
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveMarks}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Submit Results
                  </button>
                </div>
              </div>
            </>
          ) : (
            // ─── Empty State ──────────────────────────────────────────────────
            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-700">Select a Student</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Choose a student from the list on the left to view and update their marks.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 px-3.5 py-1.5 rounded-xl font-bold">📊 {students.length} Students</span>
                <span className="bg-slate-100 px-3.5 py-1.5 rounded-xl font-bold">📚 {batchOptions.length - 1} Batches</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Confirmation Modal ──────────────────────────────────────────────── */}
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

export default AcademyMarksUpdating;
