import { useState, useMemo, useCallback } from 'react';
import { Search, Eye, BookOpen, X, ShieldCheck, Layers, Calendar, CheckCircle2, Award, GraduationCap } from 'lucide-react';
import Pagination from '../../../Components/Pagination';

// Helper to calculate required examination count based on course duration and durationType
const getExaminationCount = (duration, durationType) => {
  const durVal = parseInt(duration, 10) || 1;
  if (durationType === 'Years') return Math.min(2, Math.max(1, durVal * 2));
  if (durationType === 'Months') return Math.min(2, Math.max(1, Math.ceil(durVal / 6)));
  return Math.min(2, 1);
};

const InstituteERPCourses = ({ 
  courses = [], 
  courseSearch = '', 
  setCourseSearch = () => {},
  setActiveTab = () => {},
  setNewBatch = () => {}
}) => {
  const [viewingCourse, setViewingCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredCoursesList = useMemo(() => {
    const q = (courseSearch || '').toLowerCase();
    return (courses || []).filter(c => {
      const name = c.courseName || c.name || '';
      const code = c.courseCode || '';
      const type = c.courseType || '';
      const category = c.programCategory || '';
      return (
        name.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q)
      );
    });
  }, [courses, courseSearch]);

  const totalPages = Math.ceil(filteredCoursesList.length / itemsPerPage) || 1;
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCoursesList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoursesList, currentPage]);

  const handleSelectCourseForBatch = (course) => {
    if (setNewBatch) {
      setNewBatch(prev => ({
        ...prev,
        courseId: course.id || course._id
      }));
    }
    if (setActiveTab) {
      setActiveTab('batches');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      
      {/* ─── BANNER / HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Centralized Academic Structure
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Standardized Course Catalog</h2>
          <p className="text-xs sm:text-sm text-blue-200/90 leading-relaxed">
              All courses and examination-wise curricula are officially defined and standardized by the Society for Emergency Medicine, India (SEMI). You can browse the curriculum and initiate student batches for any approved course.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 flex items-center gap-4 flex-shrink-0">
          <GraduationCap className="w-8 h-8 text-blue-300" />
          <div className="text-right">
            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block">Available Courses</span>
            <span className="text-xl font-black text-white">{courses.length}</span>
          </div>
        </div>
      </div>

      {/* ─── COURSES LIST & CATALOG ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">
              Academic Courses Catalog
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Browse available programs and examination subject breakdowns</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search course title or code..."
              value={courseSearch}
              onChange={(e) => {
                setCourseSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-150 rounded-2xl bg-white">
          <table className="w-full text-left border-collapse text-xs font-semibold text-gray-600">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 font-bold">#</th>
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Course Title</th>
                <th className="px-6 py-4 font-bold">Program Type</th>
                <th className="px-6 py-4 font-bold">Duration</th>
                <th className="px-6 py-4 font-bold">Examinations</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-800">
              {paginatedCourses.length > 0 ? (
                paginatedCourses.map((course, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const name = course.courseName || course.name || 'N/A';
                  const code = course.courseCode || 'N/A';
                  const type = course.courseType || 'Fellowship';
                  const duration = `${course.courseDuration || '2'} ${course.durationType || 'Years'}`;
                  const semCount = (course.examinations && course.examinations.length > 0)
                    ? course.examinations.length
                    : getExaminationCount(course.courseDuration, course.durationType);
                  const isActive = (course.status || 'Active') === 'Active';

                  return (
                    <tr key={course.id || course._id || idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-mono">{(globalIdx + 1).toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-600">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-gray-700">
                          {type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{duration}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          {semCount} Examinations
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-600' : 'bg-gray-400'}`}></span>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => setViewingCourse(course)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold" 
                            title="View Curriculum"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Curriculum</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectCourseForBatch(course)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Create Batch for this course"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Create Batch</span>
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
                    No standardized courses matching search criteria.
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
          totalItems={filteredCoursesList.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* ─── VIEW CURRICULUM MODAL ────────────────────────────────────────── */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto text-left">
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 px-6 py-4 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <span className="text-[10px] font-mono text-blue-200 font-bold block">{viewingCourse.courseCode || 'SEMI-COURSE'}</span>
                <h3 className="font-extrabold text-base">{viewingCourse.courseName || viewingCourse.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCourse(null)}
                className="p-1.5 hover:bg-blue-600/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Course Type</span>
                  <span className="font-bold text-gray-800">{viewingCourse.courseType || 'Fellowship'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Program Category</span>
                  <span className="font-bold text-gray-800">{viewingCourse.programCategory || 'Emergency Medicine'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Duration</span>
                  <span className="font-bold text-gray-800">{viewingCourse.courseDuration} {viewingCourse.durationType}</span>
                </div>
              </div>

              {/* Examination breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Standardized Examination Modules & Subjects
                </h4>

                {viewingCourse.examinations && viewingCourse.examinations.length > 0 ? (
                  viewingCourse.examinations.map((sem) => (
                    <div key={sem.examinationNumber} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="font-black text-blue-700 text-xs uppercase">
                          Examination {sem.examinationNumber}: {sem.examinationName || `Examination ${sem.examinationNumber}`}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Theory Subjects:</span>
                        <div className="flex flex-wrap gap-2">
                          {(sem.subjects || []).map((s, sIdx) => (
                            <span key={sIdx} className="bg-blue-50 text-blue-800 border border-blue-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                              {s.code && <strong className="font-mono mr-1 text-blue-600">[{s.code}]</strong>}
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Practical & OSCE Stations:</span>
                        <div className="flex flex-wrap gap-2">
                          {(sem.practicalExams || []).map((p, pIdx) => (
                            <span key={pIdx} className="bg-purple-50 text-purple-800 border border-purple-100 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                              {p.code && <strong className="font-mono mr-1 text-purple-600">[{p.code}]</strong>}
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {sem.monthsRequired != null && (
                        <div className="pt-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Months Required:</span>{' '}
                          <span className="text-xs font-bold text-gray-700">{sem.monthsRequired}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No examination-wise subjects defined for this course.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  handleSelectCourseForBatch(viewingCourse);
                  setViewingCourse(null);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase flex items-center gap-1.5 shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                Select This Course & Create Batch
              </button>
              <button
                type="button"
                onClick={() => setViewingCourse(null)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstituteERPCourses;