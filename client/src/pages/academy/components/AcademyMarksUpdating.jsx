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
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import marksService from '../../../api/marks';

const AcademyMarksUpdating = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSemesters] = useState([1, 2, 3, 4, 5, 6]);
  const [editingCell, setEditingCell] = useState(null); // { subjectCode, field }
  const [editValue, setEditValue] = useState('');

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBatch !== 'All') params.batchId = selectedBatch;
      if (selectedCourse !== 'All') params.courseId = selectedCourse;
      if (selectedInstitute !== 'All') params.instituteId = selectedInstitute;
      if (searchQuery) params.search = searchQuery;
      if (selectedSemester) params.semesterNumber = selectedSemester;

      const res = await marksService.getStudentsWithMarks(params);
      const data = res.data?.data || res.data || [];
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setToast({ message: err.parsedMessage || 'Failed to load students.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, selectedCourse, selectedInstitute, searchQuery, selectedSemester]);

  useEffect(() => {
    const id = setTimeout(() => fetchStudents(), 0);
    return () => clearTimeout(id);
  }, [fetchStudents]);

  // Refresh selected student's marks when semester changes
  useEffect(() => {
    if (!selectedStudent?._id) return;
    let cancelled = false;
    marksService
      .getStudentMarks(selectedStudent._id, selectedSemester)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || res.data;
        if (data) setSelectedStudent(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester]);

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

  // ─── Student Selection ─────────────────────────────────────────────────────
  const handleSelectStudent = useCallback(async (student) => {
    setSelectedStudent(student);
    setEditingCell(null);
    setEditValue('');

    if (student.course?._id) {
      try {
        const res = await marksService.getCourseSubjects(student.course._id);
        const subjects = res.data?.data || [];
        // Seed marks from course subjects if the student has none saved yet
        if (subjects.length > 0 && (!student.marks || student.marks.length === 0)) {
          const seeded = subjects.map((s) => ({
            subjectCode: s.code,
            subjectName: s.name,
            marksObtained: null,
            totalMarks: 100,
            isAbsent: null,
            grade: '',
          }));
          setSelectedStudent({ ...student, marks: seeded });
        }
      } catch (err) {
        console.error('Error fetching course subjects:', err);
      }
    }
  }, []);

  // ─── Marks Handlers ──────────────────────────────────────────────────────
  const handleMarksChange = useCallback(
    (subjectCode, value) => {
      if (!selectedStudent) return;

      const updatedMarks = selectedStudent.marks.map((m) => {
        if (m.subjectCode !== subjectCode) return m;
        const numVal = value === '' || value === null ? null : parseFloat(value);
        return { ...m, marksObtained: numVal, isAbsent: numVal === null ? null : false };
      });

      setSelectedStudent({ ...selectedStudent, marks: updatedMarks });
    },
    [selectedStudent]
  );

  const handleStatusToggle = useCallback(
    (subjectCode) => {
      if (!selectedStudent) return;

      const updatedMarks = selectedStudent.marks.map((m) => {
        if (m.subjectCode !== subjectCode) return m;
        let newIsAbsent;
        if (m.isAbsent === true) newIsAbsent = null;
        else if (m.isAbsent === false) newIsAbsent = true;
        else newIsAbsent = false;
        return { ...m, isAbsent: newIsAbsent, marksObtained: newIsAbsent === true ? null : m.marksObtained };
      });

      setSelectedStudent({ ...selectedStudent, marks: updatedMarks });
    },
    [selectedStudent]
  );

  const handleAddSubject = useCallback(() => {
    if (!selectedStudent) return;
    const newSubject = {
      subjectCode: `SUB-${Date.now()}`,
      subjectName: 'New Subject',
      marksObtained: null,
      totalMarks: 100,
      isAbsent: null,
      grade: '',
    };
    setSelectedStudent({
      ...selectedStudent,
      marks: [...(selectedStudent.marks || []), newSubject],
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

  // ─── Start Editing ──────────────────────────────────────────────────────
  const startEditing = useCallback((subjectCode, field, currentValue) => {
    setEditingCell({ subjectCode, field });
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : '');
  }, []);

  const finishEditing = useCallback(() => {
    if (!editingCell) return;
    const { subjectCode, field } = editingCell;

    if (field === 'marksObtained') {
      handleMarksChange(subjectCode, editValue === '' ? null : editValue);
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, handleMarksChange]);

  // ─── Save Marks ────────────────────────────────────────────────────────────
  const handleSaveMarks = useCallback(async () => {
    if (!selectedStudent) {
      setToast({ message: 'Please select a student first.', type: 'warning' });
      return;
    }

    const marks = selectedStudent.marks || [];
    if (marks.length === 0) {
      setToast({ message: 'No subjects to save.', type: 'warning' });
      return;
    }

    const emptySubjects = marks.filter(
      (m) => !m.isAbsent && (m.marksObtained === null || m.marksObtained === undefined || m.marksObtained === '')
    );
    if (emptySubjects.length > 0) {
      setToast({
        message: `Cannot save — ${emptySubjects.length} subject(s) have no marks entered.`,
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        semesterNumber: selectedSemester,
        subjects: marks.map((m) => ({
          subjectCode: m.subjectCode,
          subjectName: m.subjectName,
          marksObtained: m.isAbsent === true ? null : m.marksObtained,
          isAbsent: m.isAbsent === true,
          totalMarks: m.totalMarks || 100,
        })),
      };

      await marksService.updateStudentMarks(selectedStudent._id, payload);

      await fetchStudents();

      const updatedRes = await marksService.getStudentMarks(selectedStudent._id, selectedSemester);
      const updatedData = updatedRes.data?.data || updatedRes.data;
      if (updatedData) {
        setSelectedStudent(updatedData);
      }

      setToast({ message: 'Marks saved successfully!', type: 'success' });
    } catch (err) {
      console.error('Error saving marks:', err);
      setToast({ message: err.parsedMessage || 'Failed to save marks.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStudent, selectedSemester, fetchStudents]);

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const getGrade = (marks, total = 100) => {
    if (marks === null || marks === undefined) return '';
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

  const getGradeColor = (grade) => {
    const map = {
      O: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'A+': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      A: 'bg-blue-100 text-blue-800 border-blue-200',
      'B+': 'bg-blue-100 text-blue-800 border-blue-200',
      B: 'bg-amber-100 text-amber-800 border-amber-200',
      C: 'bg-amber-100 text-amber-800 border-amber-200',
      D: 'bg-rose-100 text-rose-800 border-rose-200',
      F: 'bg-rose-100 text-rose-800 border-rose-200',
      ABSENT: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return map[grade] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getStatusIcon = (marks) => {
    if (marks === null || marks === undefined) return <XCircle className="w-5 h-5 text-rose-500" />;
    if (marks >= 80) return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    if (marks >= 60) return <Minus className="w-5 h-5 text-amber-500" />;
    return <TrendingDown className="w-5 h-5 text-rose-500" />;
  };

  const calculateOverall = (marks) => {
    if (!marks || marks.length === 0) return { obtained: 0, total: 0, percentage: 0, count: 0 };
    const validMarks = marks.filter((m) => !m.isAbsent && m.marksObtained !== null);
    const obtained = validMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
    const total = validMarks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
    const count = validMarks.length;
    return { obtained, total, percentage: total > 0 ? Math.round((obtained / total) * 100) : 0, count };
  };

  const overall = selectedStudent
    ? calculateOverall(selectedStudent.marks)
    : { obtained: 0, total: 0, percentage: 0, count: 0 };

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
              Enter and manage student examination marks •{' '}
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

          {/* Semester Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2.5">
              Select Semester
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSemesters.map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSemester === sem
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sem {sem}
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
                filteredStudents.map((student) => {
                  const isSelected = selectedStudent?._id === student._id;
                  const hasMarks = student.marks && student.marks.length > 0;
                  const allEntered = student.marks?.every((m) => m.isAbsent === true || m.marksObtained !== null);

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
                            {hasMarks && allEntered ? (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                ✓ Complete
                              </span>
                            ) : hasMarks ? (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                ⚠ Partial
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                ✗ No Marks
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
                          Semester {selectedSemester}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Overall:</span>
                    <span
                      className={`text-lg font-black ${
                        overall.percentage >= 75
                          ? 'text-emerald-600'
                          : overall.percentage >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {overall.count > 0 ? `${overall.percentage}%` : 'N/A'}
                    </span>
                    {overall.count > 0 && (
                      <span className="text-xs text-slate-500">
                        ({overall.obtained}/{overall.total})
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Subjects</span>
                    <p className="text-lg font-black text-slate-800">{selectedStudent.marks?.length || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-xs uppercase font-bold text-slate-500">Scored</span>
                    <p className="text-lg font-black text-slate-800">
                      {overall.obtained}/{overall.total}
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
                    <h4 className="text-sm font-bold text-slate-700">Marks Entry - Semester {selectedSemester}</h4>
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
                    <button
                      onClick={handleSaveMarks}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Marks
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
                          Marks Obtained
                        </th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-28 text-center">
                          Status
                        </th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-24 text-center">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-xs font-black uppercase text-slate-600 tracking-wider w-20 text-center">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(selectedStudent.marks || []).map((subject, idx) => {
                        const grade = subject.isAbsent === true
                          ? 'ABSENT'
                          : getGrade(subject.marksObtained, subject.totalMarks || 100);
                        const isEditing = editingCell?.subjectCode === subject.subjectCode;
                        const isAbsent = subject.isAbsent === true;
                        const isUnmarked = subject.isAbsent === null || subject.isAbsent === undefined;

                        // Status badge colors: Present = Green (emerald), Absent = Red (rose), Unmarked = Gray
                        const statusColor = isAbsent
                          ? 'bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200'
                          : isUnmarked
                            ? 'bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200';

                        return (
                          <tr
                            key={subject.subjectCode || `subject-${selectedStudent._id}-${subject.subjectName}`}
                            className={`hover:bg-slate-50/70 transition-colors ${isAbsent ? 'bg-rose-50/40' : ''}`}
                          >
                            <td className="px-4 py-3.5 text-center font-bold text-slate-400 text-sm">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="px-4 py-3.5">
                              <div>
                                <span className="text-sm font-bold text-slate-800">{subject.subjectName}</span>
                                <span className="ml-2.5 text-xs font-mono text-slate-400">{subject.subjectCode}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {isEditing && editingCell?.field === 'marksObtained' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={subject.totalMarks || 100}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={finishEditing}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEditing();
                                    }}
                                    autoFocus
                                    className="w-20 px-2.5 py-1.5 border-2 border-blue-500 rounded-xl text-center text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                                  />
                                  <span className="text-xs text-slate-400 font-bold">/ {subject.totalMarks || 100}</span>
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center gap-2.5 cursor-pointer group ${isAbsent ? 'opacity-60' : ''}`}
                                  onClick={() =>
                                    !isAbsent && startEditing(subject.subjectCode, 'marksObtained', subject.marksObtained)
                                  }
                                >
                                  <span
                                    className={`text-sm font-bold ${
                                      isAbsent ? 'text-slate-400' : 'text-slate-800'
                                    }`}
                                  >
                                    {isAbsent || subject.marksObtained === null ? '—' : subject.marksObtained}
                                  </span>
                                  <span className="text-xs text-slate-400 font-bold">/ {subject.totalMarks || 100}</span>
                                  {!isAbsent && (
                                    <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                      (click to edit)
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleStatusToggle(subject.subjectCode)}
                                title="Click to cycle: NOT MARKED → PRESENT → ABSENT"
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusColor}`}
                              >
                                {isAbsent ? 'ABSENT' : isUnmarked ? 'NOT MARKED' : 'PRESENT'}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {subject.isAbsent ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getGradeColor('ABSENT')}`}
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  ABSENT
                                </span>
                              ) : grade ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${getGradeColor(grade)}`}
                                >
                                  {getStatusIcon(subject.marksObtained)}
                                  {grade}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">—</span>
                              )}
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
                          <td colSpan="6" className="px-5 py-12 text-center">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-base font-medium text-slate-500">No subjects added yet.</p>
                            <p className="text-sm text-slate-400 mt-1">Click "Add Subject" to begin entering marks.</p>
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
                          <td className="px-4 py-3.5 text-center font-black text-lg text-slate-800">
                            {overall.obtained} / {overall.total}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-black border ${
                                overall.percentage >= 75
                                  ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                  : overall.percentage >= 60
                                    ? 'bg-amber-100 border-amber-200 text-amber-700'
                                    : 'bg-rose-100 border-rose-200 text-rose-700'
                              }`}
                            >
                              {getStatusIcon(overall.percentage)}
                              {overall.count > 0 ? `${overall.percentage}%` : 'N/A'}
                            </span>
                          </td>
                          <td colSpan="2" className="px-4 py-3.5 text-center"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ─── Quick Actions ────────────────────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">
                    <span className="font-bold text-emerald-700">PRESENT</span> = Green •
                    <span className="font-bold text-rose-700 ml-1">ABSENT</span> = Red
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updatedMarks = (selectedStudent.marks || []).map((m) => ({
                        ...m,
                        isAbsent: false,
                      }));
                      setSelectedStudent({ ...selectedStudent, marks: updatedMarks });
                      setToast({ message: 'All subjects set to PRESENT', type: 'success' });
                    }}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-xl text-xs transition-all border border-emerald-200"
                  >
                    Set All Present
                  </button>
                  <button
                    onClick={() => {
                      const updatedMarks = (selectedStudent.marks || []).map((m) => ({
                        ...m,
                        isAbsent: true,
                        marksObtained: null,
                      }));
                      setSelectedStudent({ ...selectedStudent, marks: updatedMarks });
                      setToast({ message: 'All subjects set to ABSENT', type: 'info' });
                    }}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-xs transition-all border border-rose-200"
                  >
                    Set All Absent
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
