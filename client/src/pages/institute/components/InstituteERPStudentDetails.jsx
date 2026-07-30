import { useState, useRef, useMemo } from 'react';
import { 
  Eye, 
  Download, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Database, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Percent, 
  RefreshCw,
  User,
  GraduationCap,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  FileCheck,
  Upload,
  Plus,
  Minus,
  Clock,
  ChevronUp
} from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import Toast from '../../../Components/Toast';
import academicService from '../../../api/academic';

const InstituteERPStudentDetails = ({
  students = [],
  fetchERPData
}) => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [attendance, setAttendance] = useState('');
  const [studentSearchText, setStudentSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewingSemester, setViewingSemester] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toast, setToast] = useState(null);

  // ─── Pagination ────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 6;

  const getDocUrl = (url) => {
    if (!url) return '';
    return getUploadUrl(url);
  };

  // ─── Derived Data ──────────────────────────────────────────────────────────
  // Group records by student
  const studentGroups = useMemo(() => {
    const groups = {};
    students.forEach(s => {
      const studentId = s._id || s.id;
      if (!groups[studentId]) {
        groups[studentId] = {
          ...s,
          semesters: []
        };
      }
      if (s.semesters && s.semesters.length > 0) {
        s.semesters.forEach(sem => {
          groups[studentId].semesters.push({
            semesterNumber: sem.semesterNumber,
            attendancePercentage: sem.attendancePercentage ?? 0,
            thesisApproved: sem.thesisApproved ?? false,
            thesisDocumentUrl: sem.thesisDocumentUrl || '',
            eligibilityStatus: sem.eligibilityStatus || 'Pending'
          });
        });
      }
      groups[studentId].semesters.sort((a, b) => a.semesterNumber - b.semesterNumber);
    });
    return Object.values(groups);
  }, [students]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    let result = studentGroups;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.fullName?.toLowerCase().includes(q) ||
        g.enrollmentNo?.toLowerCase().includes(q) ||
        g.institute?.toLowerCase().includes(q)
      );
    }
    
    if (filterBatch !== 'All') {
      result = result.filter(g => (g.batchName || g.batch) === filterBatch);
    }
    
    if (filterCourse !== 'All') {
      result = result.filter(g => (g.courseName || g.course) === filterCourse);
    }
    
    if (filterStatus === 'Complete') {
      result = result.filter(g => 
        g.semesters.every(s => s.attendancePercentage >= 75 && s.thesisApproved)
      );
    } else if (filterStatus === 'Incomplete') {
      result = result.filter(g => 
        g.semesters.some(s => s.attendancePercentage < 75 || !s.thesisApproved)
      );
    }
    
    return result;
  }, [studentGroups, searchQuery, filterBatch, filterCourse, filterStatus]);

  // Unique batches and courses for filters
  const uniqueBatches = useMemo(() => {
    const batches = new Set();
    students.forEach(s => {
      const b = s.batchName || s.batch;
      if (b) batches.add(b);
    });
    return ['All', ...Array.from(batches)];
  }, [students]);

  const uniqueCourses = useMemo(() => {
    const courses = new Set();
    students.forEach(s => {
      const c = s.courseName || s.course;
      if (c) courses.add(c);
    });
    return ['All', ...Array.from(courses)];
  }, [students]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage) || 1;
  const paginatedGroups = filteredGroups.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // ─── Student Selection ──────────────────────────────────────────────────────
  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    const student = students.find(s => String(s.id) === studentId || String(s._id) === studentId);
    if (student) {
      setStudentSearchText(`${student.enrollmentNo || `STUD00${student.id}`} - ${student.fullName}`);
      if (student.semesters && student.semesters.length > 0) {
        const firstSem = student.semesters.find(s => s.attendancePercentage > 0 || s.thesisDocumentUrl);
        if (firstSem) {
          setSelectedSemester(firstSem.semesterNumber);
          setAttendance(firstSem.attendancePercentage || '');
        } else {
          setSelectedSemester(student.semesters[0]?.semesterNumber || '');
          setAttendance('');
        }
      }
    }
  };

  const handleSemesterChange = (semNum) => {
    setSelectedSemester(semNum);
    const student = students.find(s => String(s.id) === selectedStudentId || String(s._id) === selectedStudentId);
    if (student && student.semesters) {
      const sem = student.semesters.find(s => String(s.semesterNumber) === String(semNum));
      if (sem) setAttendance(sem.attendancePercentage || '');
      else setAttendance('');
    }
  };

  // ─── File Upload ────────────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: 'File size must be under 10MB.', type: 'warning' });
      return;
    }
    setUploadedFile(file);
    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadProgress(100);
      } else {
        setUploadProgress(progress);
      }
    }, 100);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedSemester) {
      setToast({ message: 'Please select a student and semester.', type: 'warning' });
      return;
    }

    const attendanceNum = parseFloat(attendance);
    if (!attendance || isNaN(attendanceNum) || attendanceNum < 0 || attendanceNum > 100) {
      setToast({ message: 'Please enter a valid attendance percentage between 0 and 100.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        semesterNumber: parseInt(selectedSemester),
        attendancePercentage: attendanceNum
      };
      if (uploadedFile) {
        payload.thesisDocument = uploadedFile;
      }

      await academicService.updateAcademicMetrics(selectedStudentId, payload);

      setSuccessMsg('\uD83C\uDF89 Student details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);

      if (fetchERPData) await fetchERPData();

      setSelectedStudentId('');
      setStudentSearchText('');
      setSelectedSemester('');
      setAttendance('');
      setUploadedFile(null);
      setUploadProgress(0);

    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit details');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── View Student Details ──────────────────────────────────────────────────
  const handleViewStudent = (student, semester) => {
    setViewingStudent(student);
    setViewingSemester(semester);
  };

  // ─── Delete Record ─────────────────────────────────────────────────────────
  const handleDeleteRecord = async (studentId, semNum) => {
    if (!window.confirm(`Are you sure you want to clear this student's attendance and thesis records for Semester ${semNum}?`)) return;

    setIsSubmitting(true);
    try {
      await academicService.updateAcademicMetrics(studentId, {
        semesterNumber: semNum,
        clearAttendance: true,
        clearThesis: true,
      });
      setSuccessMsg('Academic records cleared successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (fetchERPData) await fetchERPData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to clear details');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Toggle Expand ─────────────────────────────────────────────────────────
  const toggleExpand = (studentId) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const getStatusBadge = (record) => {
    const isComplete = (record.attendancePercentage || 0) >= 75 && record.thesisApproved;
    if (isComplete) {
      return { label: 'Complete', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Incomplete', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  const getThesisStatus = (record) => {
    if (record.thesisApproved) {
      return { label: 'Approved', color: 'text-emerald-600', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> };
    }
    if (record.thesisDocumentUrl) {
      return { label: 'Uploaded', color: 'text-blue-600', icon: <FileCheck className="w-3.5 h-3.5 text-blue-500" /> };
    }
    return { label: 'Missing', color: 'text-slate-400', icon: <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> };
  };

  const getOverallStatus = (semesters) => {
    if (!semesters || semesters.length === 0) return { label: 'No Data', color: 'bg-slate-100 text-slate-500' };
    const allComplete = semesters.every(s => s.attendancePercentage >= 75 && s.thesisApproved);
    if (allComplete) {
      return { label: 'All Complete', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    const someComplete = semesters.some(s => s.attendancePercentage >= 75 && s.thesisApproved);
    if (someComplete) {
      return { label: 'Partial', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: 'Incomplete', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── DEBUG ─────────────────────────────────────────────────────────── */}
      {students.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
          Debug: students array is empty ({students.length} items). If you expected data, check the API fetch.
        </div>
      )}
      {students.length > 0 && studentGroups.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
          Debug: {students.length} students received but 0 groups created. Check if students have a `semesters` array.
        </div>
      )}
      {/* ─── PAGE HEADER ────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Student Academic Records</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {filteredGroups.length} students · {studentGroups.reduce((acc, g) => acc + g.semesters.length, 0)} records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">All Complete</span>
            <span className="text-lg font-black text-emerald-600">
              {studentGroups.filter(g => g.semesters.every(s => s.attendancePercentage >= 75 && s.thesisApproved)).length}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Partial</span>
            <span className="text-lg font-black text-amber-600">
              {studentGroups.filter(g => 
                g.semesters.some(s => s.attendancePercentage >= 75 && s.thesisApproved) &&
                g.semesters.some(s => s.attendancePercentage < 75 || !s.thesisApproved)
              ).length}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Incomplete</span>
            <span className="text-lg font-black text-rose-600">
              {studentGroups.filter(g => g.semesters.every(s => s.attendancePercentage < 75 || !s.thesisApproved)).length}
            </span>
          </div>
        </div>
      </div>

      {/* ─── SUCCESS/ERROR ──────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ─── LEFT: Student Cards ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Students</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                {filteredGroups.length} students found
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setActivePage(1); }}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all w-full sm:w-36"
                />
              </div>
              <select
                value={filterBatch}
                onChange={(e) => { setFilterBatch(e.target.value); setActivePage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value); setActivePage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setActivePage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Complete">All Complete</option>
                <option value="Incomplete">Needs Attention</option>
              </select>
            </div>
          </div>

          {/* Student Cards */}
          <div className="space-y-3">
            {paginatedGroups.map((group) => {
              const overallStatus = getOverallStatus(group.semesters);
              const isExpanded = expandedStudentId === (group._id || group.id);

              return (
                <div 
                  key={group._id || group.id} 
                  className={`border rounded-2xl transition-all duration-200 ${
                    isExpanded ? 'border-blue-300 shadow-md shadow-blue-100/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* ─── Card Header (always visible) ──────────────────────── */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors rounded-2xl"
                    onClick={() => toggleExpand(group._id || group.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-inner">
                        {group.fullName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-black text-slate-800 truncate">{group.fullName}</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{group.enrollmentNo}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] font-semibold text-slate-500">{group.batchName || group.batch}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">{group.courseName || group.course}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${overallStatus.color}`}>
                            {overallStatus.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {group.semesters.length} semester{group.semesters.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Quick status dots */}
                      <div className="flex items-center gap-1">
                        {group.semesters.map((sem, idx) => {
                          const isComplete = sem.attendancePercentage >= 75 && sem.thesisApproved;
                          return (
                            <div 
                              key={idx}
                              className={`w-2.5 h-2.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              title={`Sem ${sem.semesterNumber}: ${isComplete ? 'Complete' : 'Incomplete'}`}
                            />
                          );
                        })}
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ─── Card Body (expandable) ────────────────────────────── */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 animate-in slide-in-from-top duration-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-100">
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Sem</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Attendance</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Thesis</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                              <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {group.semesters.map((sem) => {
                              const status = getStatusBadge(sem);
                              const thesis = getThesisStatus(sem);
                              const isComplete = sem.attendancePercentage >= 75 && sem.thesisApproved;

                              return (
                                <tr key={sem.semesterNumber} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-3 py-3 text-center font-bold text-slate-700">
                                    Sem {sem.semesterNumber}
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {sem.attendancePercentage || 0}%
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {thesis.icon}
                                      <span className={`font-bold ${thesis.color}`}>{thesis.label}</span>
                                      {sem.thesisDocumentUrl && (
                                        <a
                                          href={getDocUrl(sem.thesisDocumentUrl)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-slate-400 hover:text-blue-600 transition-colors"
                                          title="Download Thesis"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black border ${status.color}`}>
                                      {isComplete ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                      {status.label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleViewStudent(group, sem.semesterNumber)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                        title="View Details"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const targetId = group._id || group.id;
                                          handleDeleteRecord(targetId, sem.semesterNumber);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                        title="Clear Record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredGroups.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-medium">
                <Database className="w-10 h-10 mx-auto text-slate-200 mb-3 stroke-1" />
                <p className="text-sm font-bold text-slate-500">No students found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold">
                Showing {((activePage - 1) * itemsPerPage) + 1} to {Math.min(activePage * itemsPerPage, filteredGroups.length)} of {filteredGroups.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setActivePage(p => Math.max(1, p - 1))}
                  disabled={activePage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-blue-600">
                  {activePage} / {totalPages}
                </div>
                <button
                  onClick={() => setActivePage(p => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Update Form ───────────────────────────────────────────── */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Update Record</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
              Enter attendance and upload thesis
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Student Selection */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                Select Student <span className="text-rose-500">*</span>
              </label>
              <input
                list="student-list"
                placeholder="Search by name or ID..."
                value={studentSearchText}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentSearchText(val);
                  const matched = students.find(s => {
                    const idStr = s.enrollmentNo || `STUD00${s.id}`;
                    return `${idStr} - ${s.fullName}` === val;
                  });
                  if (matched) {
                    handleStudentSelect(matched.id || matched._id);
                  } else {
                    setSelectedStudentId('');
                    setAttendance('');
                  }
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
              <datalist id="student-list">
                {students.map(s => {
                  const idStr = s.enrollmentNo || `STUD00${s.id}`;
                  return <option key={s.id || s._id} value={`${idStr} - ${s.fullName}`} />;
                })}
              </datalist>
            </div>

            {/* Semester Selection */}
            {selectedStudentId && (
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                  Select Semester <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(sem => {
                    const student = students.find(s => String(s.id) === selectedStudentId || String(s._id) === selectedStudentId);
                    const hasSem = student?.semesters?.some(s => s.semesterNumber === sem);
                    return (
                      <button
                        key={sem}
                        type="button"
                        onClick={() => handleSemesterChange(sem)}
                        disabled={!hasSem}
                        className={`flex-1 min-w-[30%] py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          String(selectedSemester) === String(sem)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : hasSem
                              ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                              : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                        }`}
                      >
                        Sem {sem}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attendance */}
            {selectedSemester && (
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                  Attendance Percentage <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    placeholder="Enter percentage"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>
            )}

            {/* Thesis Upload */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">
                Thesis Document
              </label>
              {uploadedFile ? (
                <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{uploadedFile.name}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                        {uploadProgress > 0 && uploadProgress < 100 && ` · Uploading ${uploadProgress}%`}
                        {uploadProgress === 100 && ' · Done'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex-shrink-0"
                    title="Remove File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                  }`}
                >
                  <UploadCloud className="w-7 h-7 text-blue-500" />
                  <span className="text-xs font-bold text-blue-600">Click or drag to upload</span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">PDF, DOCX, ZIP (Max 10MB)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.docx,.zip"
                  />
                </div>
              )}
              <p className="text-[9px] text-slate-400 font-medium mt-1.5">
                Upload thesis document (optional if only updating attendance)
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudentId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</>
              ) : (
                <><Upload className="w-4 h-4" /> Update Record</>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-5 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
              <span className="font-bold text-slate-700">Note:</span> Attendance below 75% or missing thesis will mark the student as <span className="text-amber-600 font-bold">Incomplete</span>.
            </div>
          </div>
        </div>
      </div>

      {/* ─── VIEW DETAILS MODAL ────────────────────────────────────────────── */}
      {viewingStudent && viewingSemester && (() => {
        const semData = (viewingStudent.semesters || []).find(s => String(s.semesterNumber) === String(viewingSemester));
        const semAttendance = semData?.attendancePercentage || 0;
        const semThesisApproved = semData?.thesisApproved || false;
        const semThesisUrl = semData?.thesisDocumentUrl || '';
        const isComplete = semAttendance >= 75 && semThesisApproved;

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col scale-in-center">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Academic Record</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewingStudent.fullName} · Sem {viewingSemester}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setViewingStudent(null); setViewingSemester(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600 text-left">
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student Name</span>
                    <span className="text-slate-800 font-bold text-sm">{viewingStudent.fullName}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrollment ID</span>
                    <span className="text-slate-800 font-mono font-bold">{viewingStudent.enrollmentNo || `STUD00${viewingStudent.id}`}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold">{viewingSemester}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Attendance</span>
                    <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {semAttendance}%
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Thesis Status</span>
                  <div className="flex items-center gap-2">
                    {semThesisApproved ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Approved
                      </span>
                    ) : semThesisUrl ? (
                      <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <FileCheck className="w-4 h-4" />
                        Uploaded (Pending Approval)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        Not Uploaded
                      </span>
                    )}
                  </div>
                  {semThesisUrl && (
                    <a
                      href={getDocUrl(semThesisUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Thesis
                    </a>
                  )}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${
                isComplete
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span className={`text-[10px] font-bold ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isComplete
                      ? 'Student is eligible for examination'
                      : 'Student needs attention: missing attendance or thesis'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => { setViewingStudent(null); setViewingSemester(null); }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ─── TOASTS ──────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default InstituteERPStudentDetails;
