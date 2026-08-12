import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, BookOpen, X, Save, AlertCircle, Loader2 } from 'lucide-react';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';

// Helper to calculate required semester count based on course duration and durationType
const getSemesterCount = (duration, durationType) => {
  const durVal = parseInt(duration, 10) || 1;
  if (durationType === 'Years') return Math.max(1, durVal * 2);
  if (durationType === 'Months') return Math.max(1, Math.ceil(durVal / 6));
  return 1;
};

// Helper to sync semesters array length while preserving existing data
const syncSemesters = (existingSemesters = [], targetCount) => {
  const count = Math.max(1, targetCount || 1);
  const result = [];
  for (let i = 1; i <= count; i++) {
    const existing = (existingSemesters || []).find(s => s.semesterNumber === i);
    if (existing) {
      result.push({
        semesterNumber: i,
        semesterName: existing.semesterName || `Semester ${i}`,
        subjects: existing.subjects && existing.subjects.length > 0 
          ? existing.subjects.map(s => typeof s === 'string' ? { code: '', name: s } : { code: s.code || '', name: s.name || '' })
          : [{ code: '', name: '' }],
        practicalExams: existing.practicalExams && existing.practicalExams.length > 0 
          ? existing.practicalExams.map(p => typeof p === 'string' ? { code: '', name: p } : { code: p.code || '', name: p.name || '' })
          : [{ code: '', name: '' }],
      });
    } else {
      result.push({
        semesterNumber: i,
        semesterName: `Semester ${i}`,
        subjects: [{ code: '', name: '' }],
        practicalExams: [{ code: '', name: '' }],
      });
    }
  }
  return result;
};

const InstituteERPCourses = ({ 
  courses, 
  setCourses,  // Required: function to update courses in parent
  courseForm, 
  setCourseForm, 
  courseSearch, 
  setCourseSearch, 
  handleCreateCourse
}) => {
  // ─── Creation Semester Tab State ──────────────────────────────────────────
  const [activeCreateSemTab, setActiveCreateSemTab] = useState(1);

  // Auto-sync semesters array when creation form duration or type changes
  useEffect(() => {
    const targetCount = getSemesterCount(courseForm.courseDuration, courseForm.durationType);
    const updatedSemesters = syncSemesters(courseForm.semesters, targetCount);
    if (JSON.stringify(updatedSemesters) !== JSON.stringify(courseForm.semesters)) {
      setCourseForm(prev => ({ ...prev, semesters: updatedSemesters }));
    }
  }, [courseForm.courseDuration, courseForm.durationType]);

  // ─── State for Edit Modal ──────────────────────────────────────────────────
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeEditSemTab, setActiveEditSemTab] = useState(1);
  const [editForm, setEditForm] = useState({
    courseName: '',
    courseType: 'Postgraduate',
    programCategory: 'Emergency Medicine',
    courseDuration: '2',
    durationType: 'Years',
    semesters: [],
    examinationFee: '',
    status: 'Active'
  });
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Auto-sync edit modal semesters when edit duration/durationType changes
  useEffect(() => {
    if (!editingCourse) return;
    const targetCount = getSemesterCount(editForm.courseDuration, editForm.durationType);
    const updatedSemesters = syncSemesters(editForm.semesters, targetCount);
    if (JSON.stringify(updatedSemesters) !== JSON.stringify(editForm.semesters)) {
      setEditForm(prev => ({ ...prev, semesters: updatedSemesters }));
    }
  }, [editForm.courseDuration, editForm.durationType, editingCourse]);

  // ─── View Modal State ──────────────────────────────────────────────────────
  const [viewingCourse, setViewingCourse] = useState(null);

  // ─── Pop-up and Alert State ───────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const filteredCoursesList = useMemo(() => {
    return courses.filter(c => 
      c.courseName?.toLowerCase().includes(courseSearch?.toLowerCase() || '')
    );
  }, [courses, courseSearch]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(filteredCoursesList.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCoursesList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoursesList, currentPage]);

  // ─── Edit Handlers ──────────────────────────────────────────────────────────
  const openEditModal = useCallback((course) => {
    setEditingCourse(course);
    const targetCount = getSemesterCount(course.courseDuration || '2', course.durationType || 'Years');
    const syncedSemesters = syncSemesters(course.semesters || [], targetCount);
    setEditForm({
      courseName: course.courseName || '',
      courseType: course.courseType || 'Postgraduate',
      programCategory: course.programCategory || 'Emergency Medicine',
      courseDuration: course.courseDuration || '2',
      durationType: course.durationType || 'Years',
      semesters: syncedSemesters,
      examinationFee: course.examinationFee || '',
      status: course.status || 'Active'
    });
    setActiveEditSemTab(1);
    setEditError(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditingCourse(null);
    setEditError(null);
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    setEditError(null);
    setIsEditLoading(true);

    try {
      if (!editForm.courseName?.trim()) {
        setEditError('Course Name is required.');
        setIsEditLoading(false);
        return;
      }
      
      const hasSubjects = (editForm.semesters || []).some(s => s.subjects && s.subjects.some(sub => sub.name?.trim()));
      if (!hasSubjects) {
        setEditError('Please add at least one subject with a valid name in your semesters.');
        setIsEditLoading(false);
        return;
      }

      const feeVal = parseFloat(String(editForm.examinationFee).replace(/,/g, ''));
      if (!editForm.examinationFee || isNaN(feeVal) || feeVal < 0) {
        setEditError('Please enter a valid non-negative numeric examination fee.');
        setIsEditLoading(false);
        return;
      }
      const durationVal = parseFloat(editForm.courseDuration);
      if (!editForm.courseDuration || isNaN(durationVal) || durationVal <= 0) {
        setEditError('Please enter a valid positive numeric course duration.');
        setIsEditLoading(false);
        return;
      }

      const cleanedSemesters = (editForm.semesters || []).map(s => ({
        ...s,
        subjects: (s.subjects || []).filter(sub => sub && sub.name && sub.name.trim() !== ''),
        practicalExams: (s.practicalExams || []).filter(prac => prac && prac.name && prac.name.trim() !== ''),
      }));

      // Prepare update data
      const updateData = {
        name: editForm.courseName,
        courseType: editForm.courseType,
        programCategory: editForm.programCategory,
        courseDuration: editForm.courseDuration,
        durationType: editForm.durationType,
        semesters: cleanedSemesters,
        examinationFee: editForm.examinationFee,
        status: editForm.status
      };

      // Call API to update course
      const response = await academicService.updateCourse(editingCourse._id || editingCourse.id, updateData);
      const updatedCourse = response.data?.data || response.data;

      // Update local state
      const updatedCourses = courses.map(c => {
        if (c.id === editingCourse.id || c._id === editingCourse._id) {
          return {
            ...c,
            ...updatedCourse,
            id: c.id || c._id,
            _id: c._id || c.id,
            courseName: updatedCourse.name || editForm.courseName,
            courseType: updatedCourse.courseType || editForm.courseType,
            programCategory: updatedCourse.programCategory || editForm.programCategory,
            courseDuration: updatedCourse.courseDuration || editForm.courseDuration,
            durationType: updatedCourse.durationType || editForm.durationType,
            semesters: updatedCourse.semesters || editForm.semesters,
            examinationFee: updatedCourse.examinationFee || editForm.examinationFee,
            status: updatedCourse.status || editForm.status
          };
        }
        return c;
      });

      setCourses(updatedCourses);
      closeEditModal();
      
      setToast({ message: `Course "${editForm.courseName}" updated successfully!`, type: 'success' });
      
    } catch (err) {
      console.error('Update course error:', err);
      const errorMsg = err.parsedMessage || err.message || 'Failed to update course. Please try again.';
      setEditError(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setIsEditLoading(false);
    }
  }, [editForm, editingCourse, courses, setCourses, closeEditModal]);

  const handleCreateSubmit = useCallback(async (e) => {
    if (isCreateLoading) return;
    setIsCreateLoading(true);
    try {
      await handleCreateCourse(e);
    } finally {
      setIsCreateLoading(false);
    }
  }, [handleCreateCourse, isCreateLoading]);

  // ─── Delete Handler ──────────────────────────────────────────────────────────
  const handleDeleteCourse = useCallback((course) => {
    setConfirmConfig({
      title: 'Delete Course',
      message: `Are you sure you want to delete the course "${course.courseName}"?\nThis action cannot be undone. All batches and students associated with this course will need to be transferred first.`,
      type: 'danger',
      confirmText: 'Delete Course',
      onConfirm: async () => {
        setConfirmConfig(null);
        setDeleteConfirm(course.id || course._id);

        try {
          const courseId = course._id || course.id;
          await academicService.deleteCourse(courseId);

          const updatedCourses = courses.filter(c => c.id !== courseId && c._id !== courseId);
          setCourses(updatedCourses);
          
          setToast({ message: `Course "${course.courseName}" deleted successfully!`, type: 'success' });
          
        } catch (err) {
          console.error('Delete course error:', err);
          const errorMsg = err.parsedMessage || err.message || 'Failed to delete course.';
          
          if (err.response?.status === 400 && errorMsg.includes('students')) {
            setToast({ message: `${errorMsg}. Please transfer or de-enroll all students from this course first.`, type: 'warning' });
          } else if (err.response?.status === 400 && errorMsg.includes('batches')) {
            setToast({ message: `${errorMsg}. Please delete all batches associated with this course first.`, type: 'warning' });
          } else {
            setToast({ message: errorMsg, type: 'error' });
          }
        } finally {
          setDeleteConfirm(null);
        }
      }
    });
  }, [courses, setCourses]);

  // ─── View Course Handler ──────────────────────────────────────────────────
  const openViewModal = useCallback((course) => {
    setViewingCourse(course);
  }, []);

  const closeViewModal = useCallback(() => {
    setViewingCourse(null);
  }, []);

  const toggleCourseStatus = useCallback((course) => {
    const newStatus = course.status === 'Active' ? 'Inactive' : 'Active';
    
    setConfirmConfig({
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Course`,
      message: `Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} course "${course.courseName}"?`,
      type: 'warning',
      confirmText: `Yes, ${newStatus === 'Active' ? 'Activate' : 'Deactivate'}`,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const courseId = course._id || course.id;
          await academicService.updateCourse(courseId, { status: newStatus });

          const updatedCourses = courses.map(c => {
            if (c.id === courseId || c._id === courseId) {
              return { ...c, status: newStatus };
            }
            return c;
          });
          setCourses(updatedCourses);
          
          setToast({ message: `Course status updated to "${newStatus}"!`, type: 'success' });
        } catch (err) {
          console.error('Toggle status error:', err);
          setToast({ message: 'Failed to update course status. Please try again.', type: 'error' });
        }
      }
    });
  }, [courses, setCourses]);

  // ─── Semester Modification Handlers (Generic for Form & Edit) ─────────────
  const updateSemesterSubject = (isEdit, semNum, subjectIndex, field, value) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          const newSubs = [...(s.subjects || [])];
          newSubs[subjectIndex] = { ...(newSubs[subjectIndex] || { code: '', name: '' }), [field]: value };
          return { ...s, subjects: newSubs };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  const addSemesterSubject = (isEdit, semNum) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          return { ...s, subjects: [...(s.subjects || []), { code: '', name: '' }] };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  const removeSemesterSubject = (isEdit, semNum, subjectIndex) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          const newSubs = [...(s.subjects || [])];
          newSubs.splice(subjectIndex, 1);
          return { ...s, subjects: newSubs };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  const updateSemesterPractical = (isEdit, semNum, practicalIndex, field, value) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          const newPracs = [...(s.practicalExams || [])];
          newPracs[practicalIndex] = { ...(newPracs[practicalIndex] || { code: '', name: '' }), [field]: value };
          return { ...s, practicalExams: newPracs };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  const addSemesterPractical = (isEdit, semNum) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          return { ...s, practicalExams: [...(s.practicalExams || []), { code: '', name: '' }] };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  const removeSemesterPractical = (isEdit, semNum, practicalIndex) => {
    const setter = isEdit ? setEditForm : setCourseForm;
    setter(prev => {
      const sems = (prev.semesters || []).map(s => {
        if (s.semesterNumber === semNum) {
          const newPracs = [...(s.practicalExams || [])];
          newPracs.splice(practicalIndex, 1);
          return { ...s, practicalExams: newPracs };
        }
        return s;
      });
      return { ...prev, semesters: sems };
    });
  };

  // Helper to render semester subjects & practicals editor
  const renderSemesterEditor = (formState, activeTabState, setActiveTabState, isEdit) => {
    const targetSemCount = getSemesterCount(formState.courseDuration, formState.durationType);
    const formSemesters = formState.semesters || [];
    const activeSem = formSemesters.find(s => s.semesterNumber === activeTabState) || formSemesters[0];

    return (
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Semester Structure & Curriculum</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {targetSemCount} Semester{targetSemCount > 1 ? 's' : ''} calculated based on {formState.courseDuration || 1} {formState.durationType || 'Years'} duration
            </p>
          </div>
        </div>

        {/* Semester Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
          {formSemesters.map((sem) => {
            const isSelected = activeTabState === sem.semesterNumber;
            const subCount = (sem.subjects || []).filter(s => s.name?.trim()).length;
            const pracCount = (sem.practicalExams || []).filter(p => p.name?.trim()).length;

            return (
              <button
                key={sem.semesterNumber}
                type="button"
                onClick={() => setActiveTabState(sem.semesterNumber)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>Semester {sem.semesterNumber}</span>
                {(subCount > 0 || pracCount > 0) && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {subCount} sub / {pracCount} prac
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Semester Module Content */}
        {activeSem && (
          <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-5 space-y-6">
            
            {/* 1. Subjects Section for Active Semester */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Subjects for Semester {activeSem.semesterNumber}</span>
                  <p className="text-[10px] text-gray-400">Add subject codes & names taught in Semester {activeSem.semesterNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addSemesterSubject(isEdit, activeSem.semesterNumber)}
                  className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  + Add Subject
                </button>
              </div>

              <div className="space-y-2">
                {(activeSem.subjects || []).map((subj, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Subject Code (e.g. SUB-101)"
                        value={subj.code || ''}
                        onChange={(e) => updateSemesterSubject(isEdit, activeSem.semesterNumber, sIdx, 'code', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="Subject Name (e.g. Resuscitation & Emergency Airway)"
                        value={subj.name || ''}
                        onChange={(e) => updateSemesterSubject(isEdit, activeSem.semesterNumber, sIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSemesterSubject(isEdit, activeSem.semesterNumber, sIdx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove subject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!activeSem.subjects || activeSem.subjects.length === 0) && (
                  <p className="text-[11px] text-gray-400 italic">No subjects added for Semester {activeSem.semesterNumber}. Click "+ Add Subject" to add one.</p>
                )}
              </div>
            </div>

            {/* 2. Practical Examinations Section for Active Semester */}
            <div className="space-y-3 pt-4 border-t border-gray-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">Practical Examinations for Semester {activeSem.semesterNumber}</span>
                  <p className="text-[10px] text-gray-400">Add practical exam modules & codes for Semester {activeSem.semesterNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addSemesterPractical(isEdit, activeSem.semesterNumber)}
                  className="text-[10px] bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  + Add Practical Exam
                </button>
              </div>

              <div className="space-y-2">
                {(activeSem.practicalExams || []).map((prac, pIdx) => (
                  <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Practical Code (e.g. PRAC-101)"
                        value={prac.code || ''}
                        onChange={(e) => updateSemesterPractical(isEdit, activeSem.semesterNumber, pIdx, 'code', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="Practical Exam Name (e.g. OSCE Station 1: Airway Management)"
                        value={prac.name || ''}
                        onChange={(e) => updateSemesterPractical(isEdit, activeSem.semesterNumber, pIdx, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-500 text-xs font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSemesterPractical(isEdit, activeSem.semesterNumber, pIdx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove practical exam"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!activeSem.practicalExams || activeSem.practicalExams.length === 0) && (
                  <p className="text-[11px] text-gray-400 italic">No practical exams added for Semester {activeSem.semesterNumber}. Click "+ Add Practical Exam" to add one.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Courses</h2>
        <p className="text-xs text-gray-500 mt-1">Manage all registered courses and semester-wise curricula under your institution</p>
      </div>

      {/* ─── CREATE COURSE FORM ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-black text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-100 pb-3">Course Creation Form</h3>
        
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Course Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MD - Emergency Medicine"
                value={courseForm.courseName}
                onChange={(e) => setCourseForm({...courseForm, courseName: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Course Type *</label>
              <select
                value={courseForm.courseType}
                onChange={(e) => setCourseForm({...courseForm, courseType: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
                <option value="Fellowship">Fellowship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Program Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Emergency Medicine"
                value={courseForm.programCategory}
                onChange={(e) => setCourseForm({...courseForm, programCategory: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Course Duration *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 2"
                value={courseForm.courseDuration}
                onChange={(e) => setCourseForm({...courseForm, courseDuration: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Duration Type *</label>
              <select
                value={courseForm.durationType}
                onChange={(e) => setCourseForm({...courseForm, durationType: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
              >
                <option value="Years">Years</option>
                <option value="Months">Months</option>
                <option value="Weeks">Weeks</option>
              </select>
            </div>
          </div>

          {/* Render Dynamic Semester Editor for Creation */}
          {renderSemesterEditor(courseForm, activeCreateSemTab, setActiveCreateSemTab, false)}

          {/* Fee Configuration */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Fee Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Examination Fee *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={courseForm.examinationFee}
                  onChange={(e) => setCourseForm({...courseForm, examinationFee: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={isCreateLoading}
              className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/10 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              {isCreateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Course...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── COURSES LIST ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">All Courses</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{courses.length} Courses Registered</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Courses..."
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-150 rounded-2xl bg-white">
          <table className="w-full text-left border-collapse text-xs font-semibold text-gray-600">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">#</th>
                <th className="px-6 py-4 font-bold">Course Name</th>
                <th className="px-6 py-4 font-bold">Duration</th>
                <th className="px-6 py-4 font-bold">Semesters</th>
                <th className="px-6 py-4 font-bold">Students</th>
                <th className="px-6 py-4 font-bold">Batches</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-800">
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((course, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const studentCount = course.studentsCount || 0;
                  const batchCount = course.batchesCount || 0;
                  const semCount = course.semesters && course.semesters.length > 0 
                    ? course.semesters.length 
                    : getSemesterCount(course.courseDuration, course.durationType);
                  const isActive = course.status === 'Active';

                  return (
                    <tr key={course.id || course._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-mono">{(globalIdx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-black text-gray-900">{course.courseName}</td>
                      <td className="px-6 py-4 text-gray-500">{course.courseDuration} {course.durationType}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          {semCount} Semesters
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${studentCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {studentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100">
                          {batchCount} Batches
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCourseStatus(course)}
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full transition-all ${
                            isActive 
                              ? 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100' 
                              : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button 
                            type="button" 
                            onClick={() => openViewModal(course)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => openEditModal(course)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                            title="Edit course"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course)}
                            disabled={deleteConfirm === (course.id || course._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete course"
                          >
                            {deleteConfirm === (course.id || course._id) ? (
                              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block"></span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400 font-medium">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    No courses matching search criteria.
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or create a new course.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCoursesList.length)} of {filteredCoursesList.length} Courses
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <div className="flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-blue-600 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── EDIT COURSE MODAL ────────────────────────────────────────────────── */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 px-6 py-4 text-white flex-shrink-0 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Edit Course</h3>
                <p className="text-[10px] text-blue-200 font-medium">Update course & semester curriculum for {editingCourse.courseName}</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1.5 hover:bg-blue-600/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {editError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800 font-semibold">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{editError}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.courseName}
                    onChange={(e) => setEditForm({...editForm, courseName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Course Type</label>
                  <select
                    value={editForm.courseType}
                    onChange={(e) => setEditForm({...editForm, courseType: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Fellowship">Fellowship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Program Category</label>
                  <input
                    type="text"
                    value={editForm.programCategory}
                    onChange={(e) => setEditForm({...editForm, programCategory: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Course Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.courseDuration}
                    onChange={(e) => setEditForm({...editForm, courseDuration: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Duration Type</label>
                  <select
                    value={editForm.durationType}
                    onChange={(e) => setEditForm({...editForm, durationType: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
                  >
                    <option value="Years">Years</option>
                    <option value="Months">Months</option>
                    <option value="Weeks">Weeks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Render Dynamic Semester Editor for Edit Modal */}
              {renderSemesterEditor(editForm, activeEditSemTab, setActiveEditSemTab, true)}

              {/* Fee Configuration Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Fee Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold tracking-wider text-gray-500 mb-1">Examination Fee</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.examinationFee}
                      onChange={(e) => setEditForm({...editForm, examinationFee: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW COURSE MODAL ────────────────────────────────────────────────── */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 px-6 py-4 text-white flex-shrink-0 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Course Details</h3>
                <p className="text-[10px] text-indigo-200 font-medium">Course information & semester modules overview</p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="p-1.5 hover:bg-indigo-600/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] uppercase font-black text-gray-400">Course Name</span>
                  <span className="text-gray-900 font-bold text-sm block mt-0.5">{viewingCourse.courseName}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="block text-[10px] uppercase font-black text-gray-400">Course Type</span>
                  <span className="text-gray-700 font-semibold block mt-0.5">{viewingCourse.courseType}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Program Category</span>
                  <span className="text-gray-700 font-semibold block mt-0.5">{viewingCourse.programCategory}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Duration</span>
                  <span className="text-gray-700 font-semibold block mt-0.5">{viewingCourse.courseDuration} {viewingCourse.durationType}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Students Enrolled</span>
                  <span className="text-blue-600 font-bold block mt-0.5">{viewingCourse.studentsCount || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Batches</span>
                  <span className="text-purple-600 font-bold block mt-0.5">{viewingCourse.batchesCount || 0}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase font-black text-gray-400">Status</span>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                    viewingCourse.status === 'Active' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : viewingCourse.status === 'Inactive'
                      ? 'bg-gray-100 text-gray-500 border border-gray-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      viewingCourse.status === 'Active' ? 'bg-green-600' : 
                      viewingCourse.status === 'Inactive' ? 'bg-gray-400' : 'bg-amber-500'
                    }`}></span>
                    {viewingCourse.status || 'Active'}
                  </span>
                </div>

                {/* Semester-wise Modules Breakdown */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2 space-y-4">
                  <span className="block text-[10px] uppercase font-black text-gray-400">Semester Structure & Modules</span>
                  
                  {viewingCourse.semesters && viewingCourse.semesters.length > 0 ? (
                    <div className="space-y-3">
                      {viewingCourse.semesters.map((sem, sIdx) => (
                        <div key={sIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2.5">
                          <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider block border-b border-gray-200/60 pb-1.5">
                            Semester {sem.semesterNumber}
                          </span>
                          
                          {/* Subjects */}
                          <div>
                            <span className="text-[9px] uppercase font-extrabold text-gray-400 block mb-1">Subjects:</span>
                            {sem.subjects && sem.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {sem.subjects.map((sub, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-100">
                                    {sub.code ? <strong className="mr-1 text-blue-600 font-mono">[{sub.code}]</strong> : null}
                                    {sub.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No subjects registered for this semester.</span>
                            )}
                          </div>

                          {/* Practical Exams */}
                          <div>
                            <span className="text-[9px] uppercase font-extrabold text-gray-400 block mb-1">Practical Exams:</span>
                            {sem.practicalExams && sem.practicalExams.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {sem.practicalExams.map((prac, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-[11px] font-semibold border border-purple-100">
                                    {prac.code ? <strong className="mr-1 text-purple-600 font-mono">[{prac.code}]</strong> : null}
                                    {prac.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No practical exams registered for this semester.</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Fallback for legacy course records
                    <div>
                      <span className="block text-[10px] uppercase font-black text-gray-400 mb-1">Subjects List</span>
                      {viewingCourse.subjects && viewingCourse.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {viewingCourse.subjects.map((sub, i) => (
                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100/50">
                              {sub}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No subjects registered.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fee Summary */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-[10px] uppercase font-black text-gray-400 mb-3">Fee Structure</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div>
                    <span className="block text-[9px] uppercase text-gray-400">Examination Fee</span>
                    <span className="text-gray-900 font-bold text-sm">₹{viewingCourse.examinationFee}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={closeViewModal}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs uppercase transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts and confirmation modals */}
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

export default InstituteERPCourses;