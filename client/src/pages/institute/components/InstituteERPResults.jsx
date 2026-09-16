import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Loader2,
  Clock,
  X,
} from 'lucide-react';
import resultService from '../../../api/results';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';
import InstituteERPMarksheet from './InstituteERPMarksheet';
import Pagination from '../../../Components/Pagination';

const InstituteERPResults = ({ user }) => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab] = useState('results'); // 'results' | 'marksheet'
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  // ─── Filters ──────────────────────────────────────────────────────────────
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedExamination, setSelectedExamination] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resultStatusFilter, setResultStatusFilter] = useState('All');

  // ─── UI State ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // ─── Data Fetching ────────────────────────────────────────────────────────
  // Only auto-select the first course once (initial load) so background polls
  // never clobber a filter the user has already chosen.
  const autoSelectCourseRef = useRef(false);

  const fetchData = useCallback(async (showLoading = true) => {
    const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_institute_token');
    if (!token) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      // Fetch courses, batches, students, and results in parallel.
      // getAllResults is paginated by default (limit 20) — request a large
      // limit so client-side course/batch filtering covers all results.
      const [coursesRes, batchesRes, studentsRes, resultsRes] = await Promise.all([
        academicService.getCourses().catch(() => ({ data: { data: [] } })),
        academicService.getBatches().catch(() => ({ data: { data: [] } })),
        academicService.listStudents().catch(() => ({ data: { data: [] } })),
        resultService.getAllResults({ limit: 10000 }).catch(() => ({ data: { data: { results: [] } } })),
      ]);

      // Extract data — getAllResults returns { results, pagination }
      const coursesData = coursesRes.data?.data || coursesRes.data || [];
      const batchesData = batchesRes.data?.data || batchesRes.data || [];
      const studentsData = studentsRes.data?.data || studentsRes.data || [];
      const resultsData = resultsRes.data?.data?.results || resultsRes.data?.results || resultsRes.data?.data || resultsRes.data || [];

      setCourses(coursesData);
      setBatches(batchesData);
      setStudents(studentsData);
      setResults(resultsData);

      // Auto-select first course if available (only on the first load)
      if (!autoSelectCourseRef.current && coursesData.length > 0) {
        setSelectedCourse(coursesData[0]._id || coursesData[0].id);
        autoSelectCourseRef.current = true;
      }
    } catch (err) {
      if (showLoading) {
        console.error('Error fetching data:', err);
        setToast({ message: 'Failed to load data', type: 'error' });
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(true), 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Poll in the background so revaluation-approved marks are reflected
  // automatically (socket.io is not wired up on the client).
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── Computed Data ──────────────────────────────────────────────────────
  // Filter batches based on selected course
  const filteredBatches = useMemo(() => {
    if (!selectedCourse) return batches;
    return batches.filter(b => {
      const courseId = b.course?._id || b.course || b.courseId;
      return String(courseId) === String(selectedCourse);
    });
  }, [batches, selectedCourse]);

  // Auto-select first batch when course changes and no valid batch is selected
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedCourse && filteredBatches.length > 0) {
      const currentBatchExists = filteredBatches.some(b =>
        String(b._id || b.id) === String(selectedBatch)
      );
      if (!selectedBatch || !currentBatchExists) {
        setSelectedBatch(filteredBatches[0]._id || filteredBatches[0].id);
      }
    } else if (!selectedCourse) {
      setSelectedBatch('');
    }
  }, [selectedCourse, filteredBatches, selectedBatch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Get students for the selected batch (drives examination options)
  const studentsForBatch = useMemo(() => {
    if (!selectedBatch) return students;
    return students.filter(s => {
      const batchId = s.batch?._id || s.batch || s.batchId;
      return String(batchId) === String(selectedBatch);
    });
  }, [students, selectedBatch]);

  // Get available examinations for the selected batch
  const availableExaminations = useMemo(() => {
    const semSet = new Set();
    studentsForBatch.forEach(s => {
      if (s.examinations) {
        s.examinations.forEach(sem => semSet.add(sem.examinationNumber));
      }
    });
    return Array.from(semSet).sort((a, b) => a - b);
  }, [studentsForBatch]);

  // Auto-select first examination when batch changes and no valid examination is selected
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedBatch && availableExaminations.length > 0) {
      const currentSemExists = availableExaminations.includes(Number(selectedExamination));
      if (!selectedExamination || !currentSemExists) {
        setSelectedExamination(String(availableExaminations[0]));
      }
    } else if (!selectedBatch) {
      setSelectedExamination('');
    }
  }, [selectedBatch, availableExaminations, selectedExamination]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Get student lookup map
  const studentMap = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const id = s._id || s.id;
      map[id] = s;
    });
    return map;
  }, [students]);

  // Get course lookup map
  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach(c => {
      const id = c._id || c.id;
      map[id] = c;
    });
    return map;
  }, [courses]);

  // Get batch lookup map
  const batchMap = useMemo(() => {
    const map = {};
    batches.forEach(b => {
      const id = b._id || b.id;
      map[id] = b;
    });
    return map;
  }, [batches]);

  // Filter results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Only show results that are published and whose scheduled publication time has passed
    const now = new Date();
    filtered = filtered.filter(r => {
      const isPub = r.isPublished || r.published;
      if (!isPub) return false;
      if (r.publishedDate && new Date(r.publishedDate) > now) return false;
      return true;
    });

    // Filter by course
    if (selectedCourse) {
      const studentIdsInCourse = students
        .filter(s => String(s.course?._id || s.course || s.courseId) === String(selectedCourse))
        .map(s => s._id || s.id);
      filtered = filtered.filter(r => studentIdsInCourse.includes(String(r.student?._id || r.student)));
    }

    // Filter by batch
    if (selectedBatch) {
      const studentIdsInBatch = students
        .filter(s => String(s.batch?._id || s.batch || s.batchId) === String(selectedBatch))
        .map(s => s._id || s.id);
      filtered = filtered.filter(r => studentIdsInBatch.includes(String(r.student?._id || r.student)));
    }

    // Filter by examination
    if (selectedExamination) {
      filtered = filtered.filter(r => String(r.examination) === String(selectedExamination));
    }

    // Filter by status
    if (resultStatusFilter !== 'All') {
      filtered = filtered.filter(r => r.resultStatus === resultStatusFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const student = studentMap[r.student?._id || r.student];
        const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase() : '';
        const enrollmentId = student?.enrollmentId?.toLowerCase() || '';
        return name.includes(q) || enrollmentId.includes(q);
      });
    }

    return filtered;
  }, [results, selectedCourse, selectedBatch, selectedExamination, resultStatusFilter, searchQuery, students, studentMap]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage) || 1;
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, currentPage]);

  // ─── Statistics ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredResults.length;
    const passed = filteredResults.filter(r => r.resultStatus === 'PASS').length;
    const failed = filteredResults.filter(r => r.resultStatus === 'FAIL').length;
    const supplementary = filteredResults.filter(r => r.resultStatus === 'SUPPLEMENTARY').length;

    return { total, passed, failed, supplementary };
  }, [filteredResults]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleViewResult = (result) => {
    setViewingResult(result);
    setIsModalOpen(true);
  };

  const handleDownloadMarksheet = async (resultId) => {
    try {
      const response = await resultService.downloadMarksheet(resultId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marksheet-${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setToast({ message: 'Marksheet downloaded successfully!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to download marksheet', type: 'error' });
    }
  };

  const handleExportCSV = () => {
    if (filteredResults.length === 0) {
      setToast({ message: 'No results to export', type: 'warning' });
      return;
    }

    // Create CSV content
    const headers = ['Enrollment ID', 'Student Name', 'Course', 'Batch', 'Examination', 'Result'];
    const rows = filteredResults.map(r => {
      const student = studentMap[r.student?._id || r.student];
      const course = courseMap[student?.course?._id || student?.course || student?.courseId];
      const batch = batchMap[student?.batch?._id || student?.batch || student?.batchId];

      return [
        student?.enrollmentId || 'N/A',
        student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        course?.name || 'N/A',
        batch?.name || 'N/A',
        r.examination || 'N/A',
        r.resultStatus || 'N/A',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `results-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setToast({ message: 'Results exported successfully!', type: 'success' });
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const getResultBadge = (status) => {
    const map = {
      PASS: { label: 'Pass', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> },
      FAIL: { label: 'Fail', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: <XCircle className="w-3.5 h-3.5 text-rose-600" /> },
      SUPPLEMENTARY: { label: 'Supplementary', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5 text-amber-600" /> },
      REVALUATION_PENDING: { label: 'Revaluation Pending', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> },
    };
    return map[status] || map.FAIL;
  };

  const getStudentName = (result) => {
    const student = studentMap[result.student?._id || result.student];
    return student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student' : 'Unknown Student';
  };

  const getStudentEnrollment = (result) => {
    const student = studentMap[result.student?._id || result.student];
    return student?.enrollmentId || 'N/A';
  };

  const getStudentCourse = (result) => {
    const student = studentMap[result.student?._id || result.student];
    const course = courseMap[student?.course?._id || student?.course || student?.courseId];
    return course?.name || 'N/A';
  };

  const getStudentBatch = (result) => {
    const student = studentMap[result.student?._id || result.student];
    const batch = batchMap[student?.batch?._id || student?.batch || student?.batchId];
    return batch?.name || 'N/A';
  };

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-4 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Examination Results & Marksheets</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              View student results, custom marksheets generator, and download templates
            </p>
          </div>
        </div>

        {/* Sub-tab buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('results')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'results' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Results Overview
            </button>
            <button
              onClick={() => setActiveSubTab('marksheet')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'marksheet' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Marksheet Generator & Template
            </button>
          </div>

          {activeSubTab === 'results' && (
            <button
              onClick={handleExportCSV}
              disabled={filteredResults.length === 0}
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'marksheet' ? (
        <InstituteERPMarksheet
          courses={courses}
          batches={batches}
          students={students}
          results={results}
          fetchERPData={() => {}}
          user={user}
        />
      ) : (
        <>

      {/* ─── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Results</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.passed}</p>
          <span className="text-[9px] text-emerald-600 font-medium">Cleared</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Failed</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.failed}</p>
          <span className="text-[9px] text-rose-600 font-medium">{stats.supplementary} Supplementary</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Reappearing</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats.failed + stats.supplementary}</p>
          <span className="text-[9px] text-indigo-600 font-medium">Require Reappearance</span>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Course Filter */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Course <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  // Reset dependent filters
                  setSelectedBatch('');
                  setSelectedExamination('');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name || c.courseName}
                  </option>
                ))}
                {courses.length === 0 && (
                  <option value="">No courses available</option>
                )}
              </select>
            </div>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Batch <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setSelectedExamination('');
                  setCurrentPage(1);
                }}
                disabled={!selectedCourse || filteredBatches.length === 0}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {filteredBatches.length > 0 ? (
                  filteredBatches.map(b => (
                    <option key={b._id || b.id} value={b._id || b.id}>
                      {b.name || `Batch ${b.year}`}
                    </option>
                  ))
                ) : (
                  <option value="">{selectedCourse ? 'No batches available' : 'Select course first'}</option>
                )}
              </select>
            </div>
          </div>

          {/* Examination Filter - Dependent on Batch */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Examination <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedExamination}
                onChange={(e) => {
                  setSelectedExamination(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!selectedBatch || availableExaminations.length === 0}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableExaminations.length > 0 ? (
                  availableExaminations.map(sem => (
                    <option key={sem} value={sem}>Examination {sem}</option>
                  ))
                ) : (
                  <option value="">{selectedBatch ? 'No examinations available' : 'Select batch first'}</option>
                )}
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Result Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={resultStatusFilter}
                onChange={(e) => {
                  setResultStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
                <option value="SUPPLEMENTARY">Supplementary</option>
                <option value="REVALUATION_PENDING">Revaluation Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or enrollment ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
          </span>
          {(selectedExamination || resultStatusFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedExamination('');
                setResultStatusFilter('All');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Active filters display */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {selectedCourse && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-700">
              Course: {courses.find(c => String(c._id || c.id) === String(selectedCourse))?.name || 'Selected'}
            </span>
          )}
          {selectedBatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-bold text-indigo-700">
              Batch: {batches.find(b => String(b._id || b.id) === String(selectedBatch))?.name || 'Selected'}
            </span>
          )}
          {selectedExamination && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-[10px] font-bold text-purple-700">
              Examination {selectedExamination}
            </span>
          )}
          {resultStatusFilter !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700">
              Status: {resultStatusFilter}
            </span>
          )}
        </div>
      </div>

      {/* ─── Results Table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Student</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrollment ID</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Examination</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Result</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {paginatedResults.length > 0 ? (
                paginatedResults.map((result, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const statusBadge = getResultBadge(result.resultStatus);
                  const studentName = getStudentName(result);
                  const enrollmentId = getStudentEnrollment(result);

                  return (
                    <tr key={result._id || result.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                        {String(globalIdx).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{studentName}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{enrollmentId}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                        Examination {result.examination || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${statusBadge.color}`}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewResult(result)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadMarksheet(result._id || result.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            title="Download Marksheet"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {result.resultStatus === 'PASS' && (
                            <button
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                              title="Download Certificate"
                              onClick={() => setToast({ message: 'Certificate generation coming soon!', type: 'info' })}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Award className="w-12 h-12 text-slate-200 stroke-1" />
                      <p className="text-sm font-bold text-slate-500">No results found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ────────────────────────────────────────────────────── */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredResults.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* ─── Result Detail Modal ────────────────────────────────────────────── */}
      {isModalOpen && viewingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Result Details</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {getStudentName(viewingResult)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left">
              {/* Student Info */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student Name</span>
                    <span className="text-slate-800 font-bold text-sm">{getStudentName(viewingResult)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrollment ID</span>
                    <span className="text-slate-800 font-mono font-bold">{getStudentEnrollment(viewingResult)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Course</span>
                    <span className="text-slate-800 font-bold">{getStudentCourse(viewingResult)}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Batch</span>
                    <span className="text-slate-800 font-bold">{getStudentBatch(viewingResult)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Examination</span>
                    <span className="text-slate-800 font-bold">Examination {viewingResult.examination || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Academic Year</span>
                    <span className="text-slate-800 font-bold">{viewingResult.academicYear || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Result Summary */}
              <div className={`rounded-2xl p-6 text-center border-2 ${
                viewingResult.resultStatus === 'PASS' ? 'bg-emerald-50/60 border-emerald-200' :
                viewingResult.resultStatus === 'FAIL' ? 'bg-rose-50/60 border-rose-200' :
                viewingResult.resultStatus === 'SUPPLEMENTARY' ? 'bg-amber-50/60 border-amber-200' :
                'bg-blue-50/60 border-blue-200'
              }`}>
                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-2">Final Result</span>
                <span className={`text-2xl font-black ${
                  viewingResult.resultStatus === 'PASS' ? 'text-emerald-700' :
                  viewingResult.resultStatus === 'FAIL' ? 'text-rose-700' :
                  viewingResult.resultStatus === 'SUPPLEMENTARY' ? 'text-amber-700' :
                  'text-blue-700'
                }`}>
                  {viewingResult.resultStatus === 'PASS' ? '✅ Pass' :
                   viewingResult.resultStatus === 'FAIL' ? '❌ Fail' :
                   viewingResult.resultStatus === 'SUPPLEMENTARY' ? '🔄 Supplementary' :
                   '⏳ Revaluation Pending'}
                </span>
                {(viewingResult.resultStatus === 'FAIL' || viewingResult.resultStatus === 'SUPPLEMENTARY') && (
                  <p className="text-[10px] font-bold text-rose-600 mt-2">
                    This candidate is required to reappear for the examination.
                  </p>
                )}
              </div>

              {/* Subject-wise Pass/Fail */}
              {viewingResult.subjects && viewingResult.subjects.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">
                    Subject-wise Status
                  </h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">#</th>
                          <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">Subject Code</th>
                          <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">Subject Name</th>
                          <th className="px-3 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {viewingResult.subjects.map((subject, idx) => {
                          const subGrade = (subject.grade || '').toUpperCase();
                          const subPass = !['F', 'RA', 'ABSENT', 'WH'].includes(subGrade);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-400">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="px-3 py-2.5 font-mono font-bold text-slate-600">{subject.subjectCode || 'N/A'}</td>
                              <td className="px-3 py-2.5 font-bold text-slate-700">{subject.subjectName || 'N/A'}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                  subPass ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}>
                                  {subPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {subPass ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Revaluation Info */}
              {viewingResult.isRevaluationActive && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-blue-800 block">Revaluation Active</span>
                    <p className="text-[10px] text-blue-700 font-medium">
                      Revaluation deadline: {viewingResult.revaluationDeadline ? new Date(viewingResult.revaluationDeadline).toLocaleDateString() : 'N/A'}
                      {viewingResult.revaluationRequests && viewingResult.revaluationRequests.length > 0 &&
                        ` • ${viewingResult.revaluationRequests.length} request(s) submitted`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">
                  Published: {viewingResult.isPublished ? '✅ Yes' : '⏳ No'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {viewingResult.resultStatus === 'PASS' && (
                  <button
                    onClick={() => setToast({ message: 'Certificate generation coming soon!', type: 'info' })}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    Certificate
                  </button>
                )}
                <button
                  onClick={() => handleDownloadMarksheet(viewingResult._id || viewingResult.id)}
                  className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  Marksheet
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
        </>
      )}
    </div>
  );
};

export default InstituteERPResults;
