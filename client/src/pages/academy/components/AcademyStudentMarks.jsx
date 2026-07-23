import { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Eye, 
  ChevronDown,
  FileSpreadsheet,
  Download,
  Printer,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Calendar,
  Filter,
  X,
  BarChart3
} from 'lucide-react';
import Toast from '../../../Components/Toast';

const AcademyStudentMarks = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [toast, setToast] = useState(null);

  // ─── Mock Data ──────────────────────────────────────────────────────────────
  const mockStudents = [
    { 
      id: 1, 
      name: 'Dr. Aarav Sharma', 
      enrollmentId: 'SEMI-2026-1001',
      batch: 'Batch 2024-A', 
      institute: 'Saveetha Medical College',
      course: 'Emergency Medicine',
      email: 'aarav.sharma@example.com',
      phone: '+91 98765 43210',
      percentage: 87,
      subjects: [
        { name: 'Anatomy', marks: 92, total: 100, grade: 'A' },
        { name: 'Physiology', marks: 85, total: 100, grade: 'A' },
        { name: 'Emergency Medicine', marks: 88, total: 100, grade: 'A' },
        { name: 'Pharmacology', marks: 82, total: 100, grade: 'B+' },
      ],
      attendance: 85,
      thesisStatus: 'Approved'
    },
    { 
      id: 2, 
      name: 'Dr. Priya Nair', 
      enrollmentId: 'SEMI-2026-1002',
      batch: 'Batch 2024-B', 
      institute: 'Madras Medical College',
      course: 'Emergency Medicine',
      email: 'priya.nair@example.com',
      phone: '+91 98765 43211',
      percentage: 76,
      subjects: [
        { name: 'Anatomy', marks: 78, total: 100, grade: 'B' },
        { name: 'Physiology', marks: 72, total: 100, grade: 'B-' },
        { name: 'Emergency Medicine', marks: 80, total: 100, grade: 'B+' },
        { name: 'Pharmacology', marks: 74, total: 100, grade: 'B' },
      ],
      attendance: 92,
      thesisStatus: 'Approved'
    },
    { 
      id: 3, 
      name: 'Dr. Rahul Verma', 
      enrollmentId: 'SEMI-2026-1003',
      batch: 'Batch 2023-A', 
      institute: 'Dr.MGR Medical College',
      course: 'Emergency Medicine',
      email: 'rahul.verma@example.com',
      phone: '+91 98765 43212',
      percentage: 76,
      subjects: [
        { name: 'Anatomy', marks: 70, total: 100, grade: 'B-' },
        { name: 'Physiology', marks: 75, total: 100, grade: 'B' },
        { name: 'Emergency Medicine', marks: 82, total: 100, grade: 'A-' },
        { name: 'Pharmacology', marks: 76, total: 100, grade: 'B' },
      ],
      attendance: 68,
      thesisStatus: 'Pending'
    },
    { 
      id: 4, 
      name: 'Dr. Neha Patel', 
      enrollmentId: 'SEMI-2026-1004',
      batch: 'Batch 2024-A', 
      institute: 'Saveetha Medical College',
      course: 'Emergency Medicine',
      email: 'neha.patel@example.com',
      phone: '+91 98765 43213',
      percentage: 84,
      subjects: [
        { name: 'Anatomy', marks: 88, total: 100, grade: 'A' },
        { name: 'Physiology', marks: 82, total: 100, grade: 'A-' },
        { name: 'Emergency Medicine', marks: 85, total: 100, grade: 'A' },
        { name: 'Pharmacology', marks: 81, total: 100, grade: 'A-' },
      ],
      attendance: 76,
      thesisStatus: 'Approved'
    },
    { 
      id: 5, 
      name: 'Dr. Karan Malhotra', 
      enrollmentId: 'SEMI-2026-1005',
      batch: 'Batch 2024-A', 
      institute: 'Saveetha Medical College',
      course: 'Emergency Medicine',
      email: 'karan.malhotra@example.com',
      phone: '+91 98765 43214',
      percentage: 62,
      subjects: [
        { name: 'Anatomy', marks: 65, total: 100, grade: 'C+' },
        { name: 'Physiology', marks: 58, total: 100, grade: 'C' },
        { name: 'Emergency Medicine', marks: 68, total: 100, grade: 'B-' },
        { name: 'Pharmacology', marks: 55, total: 100, grade: 'C' },
      ],
      attendance: 62,
      thesisStatus: 'Rejected'
    },
    { 
      id: 6, 
      name: 'Dr. Ananya Sen', 
      enrollmentId: 'SEMI-2026-1006',
      batch: 'Batch 2024-B', 
      institute: 'Madras Medical College',
      course: 'Emergency Medicine',
      email: 'ananya.sen@example.com',
      phone: '+91 98765 43215',
      percentage: 91,
      subjects: [
        { name: 'Anatomy', marks: 95, total: 100, grade: 'A+' },
        { name: 'Physiology', marks: 90, total: 100, grade: 'A+' },
        { name: 'Emergency Medicine', marks: 92, total: 100, grade: 'A+' },
        { name: 'Pharmacology', marks: 88, total: 100, grade: 'A' },
      ],
      attendance: 94,
      thesisStatus: 'Approved'
    },
  ];

  // ─── Computed ──────────────────────────────────────────────────────────────
  const batches = useMemo(() => {
    const unique = new Set(mockStudents.map(s => s.batch));
    return ['All', ...unique];
  }, []);

  const courses = useMemo(() => {
    const unique = new Set(mockStudents.map(s => s.course));
    return ['All', ...unique];
  }, []);

  const institutes = useMemo(() => {
    const unique = new Set(mockStudents.map(s => s.institute));
    return ['All', ...unique];
  }, []);

  const filteredStudents = useMemo(() => {
    return mockStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.institute.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBatch = selectedBatch === 'All' || s.batch === selectedBatch;
      const matchCourse = selectedCourse === 'All' || s.course === selectedCourse;
      const matchInstitute = selectedInstitute === 'All' || s.institute === selectedInstitute;
      return matchSearch && matchBatch && matchCourse && matchInstitute;
    });
  }, [mockStudents, searchQuery, selectedBatch, selectedCourse, selectedInstitute]);

  const sortedStudents = useMemo(() => {
    if (!sortConfig.key) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'percentage') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredStudents, sortConfig]);

  // ─── Statistics ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = mockStudents.length;
    const avgPercentage = total > 0 ? Math.round(mockStudents.reduce((sum, s) => sum + s.percentage, 0) / total) : 0;
    const above75 = mockStudents.filter(s => s.percentage >= 75).length;
    const below60 = mockStudents.filter(s => s.percentage < 60).length;
    return { total, avgPercentage, above75, below60 };
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    setToast({ message: '📊 Student marks data exported successfully!', type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBatch('All');
    setSelectedCourse('All');
    setSelectedInstitute('All');
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getPercentageBg = (percentage) => {
    if (percentage >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (percentage >= 60) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  const getGradeColor = (grade) => {
    const map = {
      'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'A': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'A-': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'B+': 'text-blue-600 bg-blue-50 border-blue-200',
      'B': 'text-blue-600 bg-blue-50 border-blue-200',
      'B-': 'text-amber-600 bg-amber-50 border-amber-200',
      'C+': 'text-amber-600 bg-amber-50 border-amber-200',
      'C': 'text-rose-600 bg-rose-50 border-rose-200',
    };
    return map[grade] || 'text-slate-500 bg-slate-50 border-slate-200';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 80) return <TrendingUp className="w-4 h-4" />;
    if (percentage >= 60) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Student Marks</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">View and manage all student examination marks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Avg Percentage</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.avgPercentage}%</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Above 75%</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.above75}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Below 60%</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.below60}</p>
        </div>
      </div>

      {/* ─── Search & Filters ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name, ID, or institute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all whitespace-nowrap"
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">
              {selectedBatch !== 'All' || selectedCourse !== 'All' || selectedInstitute !== 'All' ? 'Active' : '0'}
            </span>
          </button>
          {(selectedBatch !== 'All' || selectedCourse !== 'All' || selectedInstitute !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top duration-200">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {institutes.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        )}

        <div className="text-[10px] text-slate-400 font-semibold flex justify-between items-center">
          <span>{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found</span>
          <span className="text-slate-300">|</span>
          <span>Showing {Math.min(filteredStudents.length, 10)} entries</span>
        </div>
      </div>

      {/* ─── Students Table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('batch')}
                >
                  <div className="flex items-center gap-1">
                    Batch
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'batch' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'name' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('institute')}
                >
                  <div className="flex items-center gap-1">
                    Institute
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'institute' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('course')}
                >
                  <div className="flex items-center gap-1">
                    Course
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'course' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Percentage
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'percentage' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {sortedStudents.map((student, idx) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-1 rounded-full border border-blue-100">
                      <Calendar className="w-3 h-3" />
                      {student.batch}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-[10px] flex-shrink-0">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-xs">{student.name}</p>
                        <p className="text-[9px] font-mono font-bold text-slate-400">{student.enrollmentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-700">{student.institute}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-1 rounded-full border border-purple-100">
                      <BookOpen className="w-3 h-3" />
                      {student.course}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-black ${getPercentageColor(student.percentage)}`}>
                        {student.percentage}%
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPercentageBg(student.percentage)}`}>
                        {getStatusIcon(student.percentage)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleViewStudent(student)}
                      className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[9px] uppercase tracking-wider hover:bg-blue-100 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Marks
                    </button>
                  </td>
                </tr>
              ))}
              {sortedStudents.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400 text-xs font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>No students found matching your filters.</p>
                      <button
                        onClick={handleClearFilters}
                        className="text-blue-600 hover:text-blue-700 font-bold text-[10px]"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
          <span>Showing {sortedStudents.length} of {mockStudents.length} students</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ≥ 75% ({mockStudents.filter(s => s.percentage >= 75).length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              60-74% ({mockStudents.filter(s => s.percentage >= 60 && s.percentage < 75).length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              &lt; 60% ({mockStudents.filter(s => s.percentage < 60).length})
            </span>
          </div>
        </div>
      </div>

      {/* ─── Student Marks Detail Modal ──────────────────────────────────────── */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-md flex-shrink-0">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{selectedStudent.name}</h3>
                  <p className="text-[10px] font-mono font-bold text-slate-400">{selectedStudent.enrollmentId}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span>{selectedStudent.batch}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedStudent.institute}</span>
                  </div>
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
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase font-black text-slate-400">Overall</span>
                  <p className={`text-xl font-black ${getPercentageColor(selectedStudent.percentage)}`}>
                    {selectedStudent.percentage}%
                  </p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase font-black text-slate-400">Attendance</span>
                  <p className={`text-xl font-black ${selectedStudent.attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedStudent.attendance}%
                  </p>
                </div>
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase font-black text-slate-400">Thesis</span>
                  <p className={`text-sm font-black ${selectedStudent.thesisStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedStudent.thesisStatus}
                  </p>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">
                  Subject-wise Marks
                </h4>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">Subject</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Marks</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Percentage</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {selectedStudent.subjects.map((subject, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-700">{subject.name}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                            {subject.marks} / {subject.total}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-bold ${getPercentageColor(Math.round((subject.marks / subject.total) * 100))}`}>
                              {Math.round((subject.marks / subject.total) * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getGradeColor(subject.grade)}`}>
                              {subject.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/70 border-t border-slate-200">
                        <td className="px-4 py-2.5 font-black text-xs text-slate-700">Overall</td>
                        <td className="px-4 py-2.5 text-center font-bold text-slate-800">
                          {selectedStudent.subjects.reduce((sum, s) => sum + s.marks, 0)} / {selectedStudent.subjects.reduce((sum, s) => sum + s.total, 0)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-black ${getPercentageColor(selectedStudent.percentage)}`}>
                            {selectedStudent.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setToast({ message: `📜 Provisional Certificate generated and ready for download for ${selectedStudent.name}!`, type: 'success' })}
                  className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-100 transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  Generate Provisional Certificate
                </button>
                <button
                  onClick={() => setToast({ message: `📄 Marksheet generated and ready for download for ${selectedStudent.name}!`, type: 'success' })}
                  className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-purple-100 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Generate Marksheet
                </button>
                <button
                  onClick={() => setToast({ message: `📊 Marks data for ${selectedStudent.name} exported!`, type: 'success' })}
                  className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Marks
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
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
    </div>
  );
};

export default AcademyStudentMarks;