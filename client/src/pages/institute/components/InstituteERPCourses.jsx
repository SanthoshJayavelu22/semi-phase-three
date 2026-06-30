import React, { useState, useMemo, useCallback } from 'react';
import { Search, Eye, Edit, Trash2, BookOpen, X, Save, AlertCircle } from 'lucide-react';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';

const InstituteERPCourses = ({ 
  courses, 
  setCourses,  // Added setCourses to update parent state
  courseForm, 
  setCourseForm, 
  courseSearch, 
  setCourseSearch, 
  handleCreateCourse, 
  deleteCourse: deleteCourseProp // Renamed to avoid conflict
}) => {
  // ─── State for Edit Modal ──────────────────────────────────────────────────
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    courseName: '',
    courseCode: '',
    courseType: 'Postgraduate',
    programCategory: 'Emergency Medicine',
    courseDuration: '2',
    durationType: 'Years',
    subjects: [],
    examinationFee: '1500',
    status: 'Active'
  });
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // For delete confirmation

  // ─── View Modal State ──────────────────────────────────────────────────────
  const [viewingCourse, setViewingCourse] = useState(null);

  // ─── Pop-up and Alert State ───────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const filteredCoursesList = useMemo(() => {
    return courses.filter(c => 
      c.courseName?.toLowerCase().includes(courseSearch?.toLowerCase() || '') || 
      c.courseCode?.toLowerCase().includes(courseSearch?.toLowerCase() || '')
    );
  }, [courses, courseSearch]);

  // ─── Edit Handlers ──────────────────────────────────────────────────────────
  const openEditModal = useCallback((course) => {
    setEditingCourse(course);
    setEditForm({
      courseName: course.courseName || '',
      courseCode: course.courseCode || '',
      courseType: course.courseType || 'Postgraduate',
      programCategory: course.programCategory || 'Emergency Medicine',
      courseDuration: course.courseDuration || '2',
      durationType: course.durationType || 'Years',
      subjects: course.subjects || [],
      examinationFee: course.examinationFee || '15,000',
      status: course.status || 'Active'
    });
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
      // Validate required fields
      if (!editForm.courseName || !editForm.courseCode) {
        setEditError('Course Name and Course Code are required.');
        setIsEditLoading(false);
        return;
      }
      if (!editForm.subjects || editForm.subjects.length === 0 || editForm.subjects.some(s => !s.trim())) {
        setEditError('Please add at least one valid subject.');
        setIsEditLoading(false);
        return;
      }
      if (!editForm.examinationFee || isNaN(editForm.examinationFee.replace(/,/g, ''))) {
        setEditError('Please enter a valid numeric examination fee.');
        setIsEditLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        name: editForm.courseName,
        courseCode: editForm.courseCode,
        courseType: editForm.courseType,
        programCategory: editForm.programCategory,
        courseDuration: editForm.courseDuration,
        durationType: editForm.durationType,
        subjects: editForm.subjects,
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
            // Keep the id/_id mapping consistent
            id: c.id || c._id,
            _id: c._id || c.id,
            courseName: updatedCourse.name || editForm.courseName,
            courseCode: updatedCourse.courseCode || editForm.courseCode,
            courseType: updatedCourse.courseType || editForm.courseType,
            programCategory: updatedCourse.programCategory || editForm.programCategory,
            courseDuration: updatedCourse.courseDuration || editForm.courseDuration,
            durationType: updatedCourse.durationType || editForm.durationType,
            subjects: updatedCourse.subjects || editForm.subjects,
            totalSubjects: (updatedCourse.subjects || editForm.subjects)?.length || 0,
            examinationFee: updatedCourse.examinationFee || editForm.examinationFee,
            status: updatedCourse.status || editForm.status
          };
        }
        return c;
      });

      setCourses(updatedCourses);
      localStorage.setItem('semi_courses', JSON.stringify(updatedCourses));
      closeEditModal();
      
      // Show success notification
      setToast({ message: `Course "${editForm.courseName}" updated successfully!`, type: 'success' });
      
    } catch (err) {
      console.error('Update course error:', err);
      const errorMsg = err.parsedMessage || err.message || 'Failed to update course. Please try again.';
      setEditError(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setIsEditLoading(false);
    }
  }, [editForm, editingCourse, courses, setCourses, closeEditModal]);

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

          // Remove from local state
          const updatedCourses = courses.filter(c => c.id !== courseId && c._id !== courseId);
          setCourses(updatedCourses);
          localStorage.setItem('semi_courses', JSON.stringify(updatedCourses));
          
          // Show success notification
          setToast({ message: `Course "${course.courseName}" deleted successfully!`, type: 'success' });
          
        } catch (err) {
          console.error('Delete course error:', err);
          const errorMsg = err.parsedMessage || err.message || 'Failed to delete course.';
          
          // Check if it's a student/batch constraint error
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

          // Update local state
          const updatedCourses = courses.map(c => {
            if (c.id === courseId || c._id === courseId) {
              return { ...c, status: newStatus };
            }
            return c;
          });
          setCourses(updatedCourses);
          localStorage.setItem('semi_courses', JSON.stringify(updatedCourses));
          
          setToast({ message: `Course status updated to "${newStatus}"!`, type: 'success' });
        } catch (err) {
          console.error('Toggle status error:', err);
          setToast({ message: 'Failed to update course status. Please try again.', type: 'error' });
        }
      }
    });
  }, [courses, setCourses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">Courses</h2>
        <p className="text-xs text-gray-500 mt-1">Manage all registered courses under your institution</p>
      </div>

      {/* ─── CREATE COURSE FORM ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-base font-black text-gray-900 uppercase tracking-wider mb-6 border-b border-gray-100 pb-3">Course Creation Form</h3>
        
        <form onSubmit={handleCreateCourse} className="space-y-6">
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
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Course Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. MD-EM-01"
                value={courseForm.courseCode}
                onChange={(e) => setCourseForm({...courseForm, courseCode: e.target.value})}
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
                type="text"
                required
                placeholder="e.g. 3"
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500">Subjects *</label>
              <button 
                type="button" 
                onClick={() => setCourseForm({...courseForm, subjects: [...courseForm.subjects, '']})}
                className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors uppercase tracking-wider"
              >
                + Add Subject
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courseForm.subjects.map((subj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder={`Subject ${idx + 1}`}
                    value={subj}
                    onChange={(e) => {
                      const newSubjects = [...courseForm.subjects];
                      newSubjects[idx] = e.target.value;
                      setCourseForm({...courseForm, subjects: newSubjects});
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSubjects = [...courseForm.subjects];
                      newSubjects.splice(idx, 1);
                      setCourseForm({...courseForm, subjects: newSubjects});
                    }}
                    className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {courseForm.subjects.length === 0 && (
              <p className="text-[11px] text-gray-400 italic">No subjects added. Click "+ Add Subject" to begin.</p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Fee Configuration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Examination Fee *</label>
                <input
                  type="text"
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
              className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-blue-500/10 text-xs uppercase tracking-wider"
            >
              Create Course
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
              onChange={(e) => setCourseSearch(e.target.value)}
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
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Duration</th>
                <th className="px-6 py-4 font-bold">Students</th>
                <th className="px-6 py-4 font-bold">Batches</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-800">
              {filteredCoursesList.length > 0 ? (
                filteredCoursesList.map((course, idx) => {
                  const studentCount = course.studentsCount || 0;
                  const batchCount = course.batchesCount || 0;
                  const isActive = course.status === 'Active';

                  return (
                    <tr key={course.id || course._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-black text-gray-900">{course.courseName}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200/50 font-mono">
                          {course.courseCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{course.courseDuration} {course.durationType}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${studentCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {studentCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
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
                          {/* View Button */}
                          <button 
                            type="button" 
                            onClick={() => openViewModal(course)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* Edit Button */}
                          <button 
                            type="button" 
                            onClick={() => openEditModal(course)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" 
                            title="Edit course"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Button */}
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
      </div>

      {/* ─── EDIT COURSE MODAL ────────────────────────────────────────────────── */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 px-6 py-4 text-white sticky top-0 z-10 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Edit Course</h3>
                <p className="text-[10px] text-blue-200 font-medium">Update course details for {editingCourse.courseName}</p>
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
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
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
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-1.5">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={editForm.courseCode}
                    onChange={(e) => setEditForm({...editForm, courseCode: e.target.value})}
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
                    type="text"
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

                <div className="col-span-full space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500">Subjects</label>
                    <button 
                      type="button" 
                      onClick={() => setEditForm({...editForm, subjects: [...(editForm.subjects || []), '']})}
                      className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors uppercase tracking-wider"
                    >
                      + Add Subject
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(editForm.subjects || []).map((subj, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`Subject ${idx + 1}`}
                          value={subj}
                          onChange={(e) => {
                            const newSubjects = [...editForm.subjects];
                            newSubjects[idx] = e.target.value;
                            setEditForm({...editForm, subjects: newSubjects});
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newSubjects = [...editForm.subjects];
                            newSubjects.splice(idx, 1);
                            setEditForm({...editForm, subjects: newSubjects});
                          }}
                          className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
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

              {/* Fee Configuration Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Fee Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold tracking-wider text-gray-500 mb-1">Examination Fee</label>
                    <input
                      type="text"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 px-6 py-4 text-white sticky top-0 z-10 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base">Course Details</h3>
                <p className="text-[10px] text-indigo-200 font-medium">Course information overview</p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="p-1.5 hover:bg-indigo-600/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Course Name</span>
                  <span className="text-gray-900 font-bold block mt-0.5">{viewingCourse.courseName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Course Code</span>
                  <span className="font-mono font-bold text-blue-600 block mt-0.5">{viewingCourse.courseCode}</span>
                </div>
                <div>
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
                  <span className="block text-[10px] uppercase font-black text-gray-400">Total Subjects</span>
                  <span className="text-gray-700 font-semibold block mt-0.5">{viewingCourse.totalSubjects}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Students Enrolled</span>
                  <span className="text-blue-600 font-bold block mt-0.5">{viewingCourse.studentsCount || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black text-gray-400">Batches</span>
                  <span className="text-blue-600 font-bold block mt-0.5">{viewingCourse.batchesCount || 0}</span>
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

                {/* Subjects List */}
                <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                  <span className="block text-[10px] uppercase font-black text-gray-400 mb-2">Subjects List</span>
                  {viewingCourse.subjects && viewingCourse.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Fee Summary */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <h4 className="text-[10px] uppercase font-black text-gray-400 mb-3">Fee Structure</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div>
                    <span className="block text-[9px] uppercase text-gray-400">Examination Fee</span>
                    <span className="text-gray-900 font-bold text-sm">{viewingCourse.examinationFee}</span>
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