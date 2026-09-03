import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Search, Eye, Edit, Trash2, BookOpen, X, Save, AlertCircle, Loader2, Plus, 
  CheckCircle2, Layers, Award, Sparkles, GraduationCap 
} from 'lucide-react';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import Pagination from '../../../Components/Pagination';

// Helper to calculate required examination count based on course duration and durationType
const getExaminationCount = (duration, durationType) => {
  const durVal = parseInt(duration, 10) || 1;
  if (durationType === 'Years') return Math.min(2, Math.max(1, durVal * 2));
  if (durationType === 'Months') return Math.min(2, Math.max(1, Math.ceil(durVal / 6)));
  return Math.min(2, 1);
};

// Helper to sync examinations array length while preserving existing data
const syncExaminations = (existingExaminations = [], targetCount) => {
  const count = Math.max(1, targetCount || 1);
  const result = [];
  for (let i = 1; i <= count; i++) {
    const existing = (existingExaminations || []).find(e => e.examinationNumber === i);
    if (existing) {
      result.push({
        examinationNumber: i,
        examinationName: existing.examinationName || `Examination ${i}`,
        monthsRequired: existing.monthsRequired || '',
        subjects: existing.subjects && existing.subjects.length > 0 
          ? existing.subjects.map(s => typeof s === 'string' ? { code: '', name: s } : { code: s.code || '', name: s.name || '' })
          : [{ code: '', name: '' }],
        practicalExams: existing.practicalExams && existing.practicalExams.length > 0 
          ? existing.practicalExams.map(p => typeof p === 'string' ? { code: '', name: p } : { code: p.code || '', name: p.name || '' })
          : [{ code: '', name: '' }],
      });
    } else {
      result.push({
        examinationNumber: i,
        examinationName: `Examination ${i}`,
        monthsRequired: '',
        subjects: [{ code: '', name: '' }],
        practicalExams: [{ code: '', name: '' }],
      });
    }
  }
  return result;
};

export default function AcademyCoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [activeCreateExamTab, setActiveCreateExamTab] = useState(1);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  const [courseForm, setCourseForm] = useState({
    name: '',
    courseCode: '',
    courseType: 'Fellowship',
    programCategory: 'Emergency Medicine',
    courseDuration: '2',
    durationType: 'Years',
    examinations: [
      { examinationNumber: 1, examinationName: 'Examination 1', monthsRequired: '', subjects: [{ code: 'EM-101', name: 'Basic Emergency Care' }], practicalExams: [{ code: 'PRAC-101', name: 'Airway Management OSCE' }] },
      { examinationNumber: 2, examinationName: 'Examination 2', monthsRequired: '', subjects: [{ code: 'EM-201', name: 'Advanced Trauma Care' }], practicalExams: [{ code: 'PRAC-201', name: 'Trauma Resuscitation OSCE' }] }
    ],
    status: 'Active'
  });

  // Modal states
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeEditExamTab, setActiveEditExamTab] = useState(1);
  const [editForm, setEditForm] = useState({
    name: '',
    courseCode: '',
    courseType: 'Fellowship',
    programCategory: 'Emergency Medicine',
    courseDuration: '2',
    durationType: 'Years',
    examinations: [],
    status: 'Active'
  });
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Auto-sync examinations array when creation form duration changes
  useEffect(() => {
    const targetCount = getExaminationCount(courseForm.courseDuration, courseForm.durationType);
    const updatedExaminations = syncExaminations(courseForm.examinations, targetCount);
    if (JSON.stringify(updatedExaminations) !== JSON.stringify(courseForm.examinations)) {
      setCourseForm(prev => ({ ...prev, examinations: updatedExaminations }));
    }
  }, [courseForm.courseDuration, courseForm.durationType]);

  // Auto-sync edit modal examinations when duration changes
  useEffect(() => {
    if (!editingCourse) return;
    const targetCount = getExaminationCount(editForm.courseDuration, editForm.durationType);
    const updatedExaminations = syncExaminations(editForm.examinations, targetCount);
    if (JSON.stringify(updatedExaminations) !== JSON.stringify(editForm.examinations)) {
      setEditForm(prev => ({ ...prev, examinations: updatedExaminations }));
    }
  }, [editForm.courseDuration, editForm.durationType, editingCourse]);

  // Fetch all courses
  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await academicService.getCourses();
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        setCourses(data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setToast({ message: 'Failed to load courses catalogue.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const q = courseSearch.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.courseCode && c.courseCode.toLowerCase().includes(q)) ||
        (c.courseType && c.courseType.toLowerCase().includes(q)) ||
        (c.programCategory && c.programCategory.toLowerCase().includes(q))
      );
    });
  }, [courses, courseSearch]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;

  // ─── Examination Subject & Practical Management Helpers ──────────────────────
  const handleExaminationSubjectChange = (isEdit, examNum, subjectIdx, field, val) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        const newSubs = [...(e.subjects || [])];
        newSubs[subjectIdx] = { ...newSubs[subjectIdx], [field]: val };
        return { ...e, subjects: newSubs };
      });
      return { ...prev, examinations: examList };
    });
  };

  const addExaminationSubject = (isEdit, examNum) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        return { ...e, subjects: [...(e.subjects || []), { code: '', name: '' }] };
      });
      return { ...prev, examinations: examList };
    });
  };

  const removeExaminationSubject = (isEdit, examNum, subjectIdx) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        const newSubs = e.subjects.filter((_, idx) => idx !== subjectIdx);
        return { ...e, subjects: newSubs.length > 0 ? newSubs : [{ code: '', name: '' }] };
      });
      return { ...prev, examinations: examList };
    });
  };

  const handleExaminationPracticalChange = (isEdit, examNum, pracIdx, field, val) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        const newPracs = [...(e.practicalExams || [])];
        newPracs[pracIdx] = { ...newPracs[pracIdx], [field]: val };
        return { ...e, practicalExams: newPracs };
      });
      return { ...prev, examinations: examList };
    });
  };

  const addExaminationPractical = (isEdit, examNum) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        return { ...e, practicalExams: [...(e.practicalExams || []), { code: '', name: '' }] };
      });
      return { ...prev, examinations: examList };
    });
  };

  const removeExaminationPractical = (isEdit, examNum, pracIdx) => {
    const updater = isEdit ? setEditForm : setCourseForm;
    updater(prev => {
      const examList = (prev.examinations || []).map(e => {
        if (e.examinationNumber !== examNum) return e;
        const newPracs = e.practicalExams.filter((_, idx) => idx !== pracIdx);
        return { ...e, practicalExams: newPracs.length > 0 ? newPracs : [{ code: '', name: '' }] };
      });
      return { ...prev, examinations: examList };
    });
  };

  // ─── Creation handler ──────────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.name?.trim()) {
      setToast({ message: 'Course Name is required.', type: 'warning' });
      return;
    }

    // Clean examinations
    const cleanedExaminations = (courseForm.examinations || []).map(exam => ({
      examinationNumber: exam.examinationNumber,
      examinationName: exam.examinationName || `Examination ${exam.examinationNumber}`,
      monthsRequired: exam.monthsRequired || '',
      subjects: (exam.subjects || []).filter(s => s.name && s.name.trim().length > 0),
      practicalExams: (exam.practicalExams || []).filter(p => p.name && p.name.trim().length > 0),
    }));

    setIsCreateLoading(true);
    try {
      const token = localStorage.getItem('semi_board_token') || 
                    localStorage.getItem('semi_access_token') || 
                    localStorage.getItem('semi_token') ||
                    localStorage.getItem('token');
      
      const payload = {
        name: courseForm.name.trim(),
        courseCode: (courseForm.courseCode || '').trim().toUpperCase(),
        courseType: courseForm.courseType,
        programCategory: courseForm.programCategory,
        courseDuration: courseForm.courseDuration,
        durationType: courseForm.durationType,
        examinations: cleanedExaminations,
        status: 'Active'
      };

      console.log('Publishing course with token:', token ? 'Token exists' : 'NO TOKEN FOUND', payload);

      await academicService.createCourse(payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setToast({ message: `Course "${courseForm.name}" created successfully in centralized catalog!`, type: 'success' });
      
      // Reset form
      setCourseForm({
        name: '',
        courseCode: '',
        courseType: 'Fellowship',
        programCategory: 'Emergency Medicine',
        courseDuration: '2',
        durationType: 'Years',
        examinations: syncExaminations([], 2),
        status: 'Active'
      });

      await fetchCourses();
    } catch (err) {
      console.error('Course creation error:', err);
      const errMsg = err.parsedMessage || err.response?.data?.message || err.message || 'Failed to create course.';
      setToast({ 
        message: errMsg, 
        type: 'error' 
      });
    } finally {
      setIsCreateLoading(false);
    }
  };

  // ─── Edit Modal ────────────────────────────────────────────────────────────
  const openEditModal = (c) => {
    setEditingCourse(c);
    setActiveEditExamTab(1);
    setEditForm({
      name: c.name || '',
      courseCode: c.courseCode || '',
      courseType: c.courseType || 'Fellowship',
      programCategory: c.programCategory || 'Emergency Medicine',
      courseDuration: c.courseDuration || '2',
      durationType: c.durationType || 'Years',
      examinations: c.examinations && c.examinations.length > 0 ? c.examinations : syncExaminations([], getExaminationCount(c.courseDuration, c.durationType)),
      status: c.status || 'Active'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name?.trim()) {
      setToast({ message: 'Course Name is required.', type: 'warning' });
      return;
    }

    const cleanedExaminations = (editForm.examinations || []).map(exam => ({
      examinationNumber: exam.examinationNumber,
      examinationName: exam.examinationName || `Examination ${exam.examinationNumber}`,
      monthsRequired: exam.monthsRequired || '',
      subjects: (exam.subjects || []).filter(s => s.name && s.name.trim().length > 0),
      practicalExams: (exam.practicalExams || []).filter(p => p.name && p.name.trim().length > 0),
    }));

    setIsEditLoading(true);
    try {
      const token = localStorage.getItem('semi_board_token') || 
                    localStorage.getItem('semi_access_token') || 
                    localStorage.getItem('semi_token');

      await academicService.updateCourse(editingCourse._id, {
        name: editForm.name.trim(),
        courseCode: (editForm.courseCode || '').trim().toUpperCase(),
        courseType: editForm.courseType,
        programCategory: editForm.programCategory,
        courseDuration: editForm.courseDuration,
        durationType: editForm.durationType,
        examinations: cleanedExaminations,
        status: editForm.status
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setToast({ message: `Course "${editForm.name}" updated successfully!`, type: 'success' });
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      console.error('Course update error:', err);
      setToast({ 
        message: err.parsedMessage || err.response?.data?.message || 'Failed to update course.', 
        type: 'error' 
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  // ─── Toggle Course Status (Active/Inactive) ────────────────────────────────
  const toggleCourseStatus = async (course) => {
    const newStatus = course.status === 'Active' ? 'Inactive' : 'Active';
    const token = localStorage.getItem('semi_board_token') || 
                  localStorage.getItem('semi_access_token') || 
                  localStorage.getItem('semi_token');
    try {
      await academicService.updateCourse(course._id, { status: newStatus }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setToast({ message: `Course "${course.name}" marked as ${newStatus}.`, type: 'success' });
      await fetchCourses();
    } catch (err) {
      console.error('Toggle status error:', err);
      setToast({ message: 'Failed to update course status.', type: 'error' });
    }
  };

  // ─── Delete Course ─────────────────────────────────────────────────────────
  const handleDeleteCourse = (course) => {
    setConfirmConfig({
      title: `Delete Course: ${course.name}`,
      message: `Are you sure you want to permanently delete "${course.name}"? If students or batches exist across colleges, deactivating the course is recommended instead.`,
      type: 'danger',
      confirmText: 'Delete Course',
      onConfirm: async () => {
        setConfirmConfig(null);
        const token = localStorage.getItem('semi_board_token') || 
                      localStorage.getItem('semi_access_token') || 
                      localStorage.getItem('semi_token');
        try {
          await academicService.deleteCourse(course._id, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          setToast({ message: 'Course deleted successfully.', type: 'success' });
          await fetchCourses();
        } catch (err) {
          console.error('Delete course error:', err);
          setToast({ 
            message: err.parsedMessage || err.response?.data?.message || 'Failed to delete course.', 
            type: 'error' 
          });
        }
      }
    });
  };

  // ─── Render Examination Editor Component ─────────────────────────────────────
  const renderExaminationEditor = (formState, activeTab, setActiveTab, isEdit) => {
    const exams = formState.examinations || [];
    const activeExam = exams.find(e => e.examinationNumber === activeTab) || exams[0] || { examinationNumber: 1, monthsRequired: '', subjects: [], practicalExams: [] };

    return (
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Examination Breakdown & Curriculum ({exams.length} Examinations)
            </h4>
            <p className="text-[11px] text-slate-500">Define theory subjects and practical OSCE modules for each examination</p>
          </div>
        </div>

        {/* Examination Tab Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {exams.map((exam) => {
            const num = exam.examinationNumber;
            const subCount = (exam.subjects || []).filter(s => s.name?.trim()).length;
            const pracCount = (exam.practicalExams || []).filter(p => p.name?.trim()).length;
            const isTabActive = activeTab === num;

            return (
              <button
                key={num}
                type="button"
                onClick={() => setActiveTab(num)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isTabActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Examination {num}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isTabActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {subCount} Sub / {pracCount} Prac
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Examination Editor Card */}
        {activeExam && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-6">
            
            {/* 0. Months Required */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Months Required for Examination {activeExam.examinationNumber}
                </span>
              </div>
              <input
                type="number"
                min="1"
                placeholder="e.g. 6"
                value={activeExam.monthsRequired || ''}
                onChange={(e) => {
                  const updater = isEdit ? setEditForm : setCourseForm;
                  updater(prev => {
                    const examList = (prev.examinations || []).map(ex => {
                      if (ex.examinationNumber !== activeExam.examinationNumber) return ex;
                      return { ...ex, monthsRequired: e.target.value };
                    });
                    return { ...prev, examinations: examList };
                  });
                }}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold"
              />
            </div>

            {/* 1. Subjects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Theory Subjects for Examination {activeExam.examinationNumber}
                  </span>
                  <p className="text-[10px] text-slate-500">Add subject codes and official SEMI subject titles</p>
                </div>
                <button
                  type="button"
                  onClick={() => addExaminationSubject(isEdit, activeExam.examinationNumber)}
                  className="text-[11px] bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg font-bold transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Subject
                </button>
              </div>

              <div className="space-y-2">
                {(activeExam.subjects || []).map((sub, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Subject Code (e.g. EM-101)"
                        value={sub.code || ''}
                        onChange={(e) => handleExaminationSubjectChange(isEdit, activeExam.examinationNumber, sIdx, 'code', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Subject Name (e.g. Resuscitation & Shock Management)"
                        value={sub.name || ''}
                        onChange={(e) => handleExaminationSubjectChange(isEdit, activeExam.examinationNumber, sIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExaminationSubject(isEdit, activeExam.examinationNumber, sIdx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Subject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Practical Exams Section */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Practical & OSCE Stations for Examination {activeExam.examinationNumber}
                  </span>
                  <p className="text-[10px] text-slate-500">Add practical examination modules, stations and codes</p>
                </div>
                <button
                  type="button"
                  onClick={() => addExaminationPractical(isEdit, activeExam.examinationNumber)}
                  className="text-[11px] bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg font-bold transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Practical Exam
                </button>
              </div>

              <div className="space-y-2">
                {(activeExam.practicalExams || []).map((prac, pIdx) => (
                  <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Practical Code (e.g. PRAC-101)"
                        value={prac.code || ''}
                        onChange={(e) => handleExaminationPracticalChange(isEdit, activeExam.examinationNumber, pIdx, 'code', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        placeholder="Practical Station Name (e.g. Clinical OSCE Station: Airway & Vascular Access)"
                        value={prac.name || ''}
                        onChange={(e) => handleExaminationPracticalChange(isEdit, activeExam.examinationNumber, pIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExaminationPractical(isEdit, activeExam.examinationNumber, pIdx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Practical Exam"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      
      {/* ─── PAGE TITLE & HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-md border border-indigo-500/30">
              Centralized Academic Registry
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Course & Subject Management</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Standardized academic courses, curricula, and subjects governed centrally by SEMI Academic Board. Institutes inherit this structure automatically.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-indigo-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider">Total Standardized Courses</span>
            <span className="text-lg font-black text-white">{courses.length}</span>
          </div>
        </div>
      </div>

      {/* ─── COURSE CREATION FORM ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
              Create New Standardized Course
            </h3>
            <p className="text-xs text-slate-500">Define course code, category, duration, examination subjects & practical exams</p>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
            Admin Controlled
          </span>
        </div>

        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fellowship in Emergency Medicine"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FEM / DEM / MEM"
                value={courseForm.courseCode}
                onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-mono font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">Used for automated batch naming (e.g. FEM-2026-A)</p>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Type *</label>
              <select
                value={courseForm.courseType}
                onChange={(e) => setCourseForm({ ...courseForm, courseType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-bold"
              >
                <option value="Fellowship">Fellowship</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="Undergraduate">Undergraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Program Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Emergency Medicine"
                value={courseForm.programCategory}
                onChange={(e) => setCourseForm({ ...courseForm, programCategory: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Duration *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 2"
                value={courseForm.courseDuration}
                onChange={(e) => setCourseForm({ ...courseForm, courseDuration: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Duration Type *</label>
              <select
                value={courseForm.durationType}
                onChange={(e) => setCourseForm({ ...courseForm, durationType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-bold"
              >
                <option value="Years">Years</option>
                <option value="Months">Months</option>
                <option value="Weeks">Weeks</option>
              </select>
            </div>
          </div>

          {/* Dynamic Examination, Subject & Practical Exams Editor */}
          {renderExaminationEditor(courseForm, activeCreateExamTab, setActiveCreateExamTab, false)}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isCreateLoading}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-indigo-600/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Course...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Save & Publish Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── ALL STANDARDIZED COURSES LIST ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
              Standardized Courses Catalog
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{courses.length} Standardized Academic Programs Registered</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search course name or code..."
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="px-5 py-4 font-bold">#</th>
                <th className="px-5 py-4 font-bold">Code</th>
                <th className="px-5 py-4 font-bold">Course Title</th>
                <th className="px-5 py-4 font-bold">Program Type</th>
                <th className="px-5 py-4 font-bold">Duration</th>
                <th className="px-5 py-4 font-bold">Examinations</th>
                <th className="px-5 py-4 font-bold">Active Batches</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((c, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const isActive = c.status === 'Active';
                  const examCount = c.examinations?.length || getExaminationCount(c.courseDuration, c.durationType);
                  const batchCount = c.batchesCount || 0;

                  return (
                    <tr key={c._id || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 text-slate-400 font-mono">{(globalIdx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-5 py-4 font-mono font-bold text-indigo-600">
                        <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {c.courseCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">{c.name}</td>
                      <td className="px-5 py-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-slate-700">
                          {c.courseType || 'Fellowship'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{c.courseDuration} {c.durationType}</td>
                      <td className="px-5 py-4">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          {examCount} Examinations
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100">
                          {batchCount} Batches
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleCourseStatus(c)}
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingCourse(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Course Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Edit Course & Subjects"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    No standardized courses found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCourses.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* ─── EDIT COURSE MODAL ────────────────────────────────────────────── */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto text-left">
            <div className="bg-indigo-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Edit Standardized Course</h3>
                <p className="text-[10px] text-indigo-200">Updating academic structure for {editingCourse.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="p-1.5 hover:bg-indigo-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={editForm.courseCode}
                    onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Course Type</label>
                  <select
                    value={editForm.courseType}
                    onChange={(e) => setEditForm({ ...editForm, courseType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-bold"
                  >
                    <option value="Fellowship">Fellowship</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Program Category</label>
                  <input
                    type="text"
                    required
                    value={editForm.programCategory}
                    onChange={(e) => setEditForm({ ...editForm, programCategory: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Duration</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.courseDuration}
                    onChange={(e) => setEditForm({ ...editForm, courseDuration: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-600 mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 text-xs font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {renderExaminationEditor(editForm, activeEditExamTab, setActiveEditExamTab, true)}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 shadow-md shadow-indigo-600/20"
                >
                  {isEditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW COURSE MODAL ────────────────────────────────────────────── */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto text-left">
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">{viewingCourse.courseCode}</span>
                <h3 className="font-extrabold text-base">{viewingCourse.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCourse(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Program Type</span>
                  <span className="font-bold text-slate-800">{viewingCourse.courseType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                  <span className="font-bold text-slate-800">{viewingCourse.programCategory}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                  <span className="font-bold text-slate-800">{viewingCourse.courseDuration} {viewingCourse.durationType}</span>
                </div>
              </div>

              {/* Examinations list */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">Examination-wise Curriculum</h4>
                {(viewingCourse.examinations || []).map((exam) => (
                  <div key={exam.examinationNumber} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-black text-indigo-700 text-xs uppercase">
                        Examination {exam.examinationNumber}: {exam.examinationName || `Examination ${exam.examinationNumber}`}
                      </span>
                      {exam.monthsRequired && (
                        <span className="text-[10px] font-bold text-slate-500">
                          {exam.monthsRequired} months required
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Theory Subjects:</span>
                      <div className="flex flex-wrap gap-2">
                        {(exam.subjects || []).map((s, sIdx) => (
                          <span key={sIdx} className="bg-indigo-50 text-indigo-800 border border-indigo-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                            {s.code && <strong className="font-mono mr-1 text-indigo-600">[{s.code}]</strong>}
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Practical Exams:</span>
                      <div className="flex flex-wrap gap-2">
                        {(exam.practicalExams || []).map((p, pIdx) => (
                          <span key={pIdx} className="bg-purple-50 text-purple-800 border border-purple-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                            {p.code && <strong className="font-mono mr-1 text-purple-600">[{p.code}]</strong>}
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingCourse(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast and confirm */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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
}
