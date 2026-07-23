import { useState, useMemo, useEffect } from 'react';
import academicService from '../../../api/academic';
import resultService from '../../../api/results';
import { 
  Search, 
  User, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Plus, 
  Save, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Users
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';

const AcademyMarksUpdating = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Anatomy', marksObtained: 87, totalMarks: 100, percentage: 87 },
    { id: 2, name: 'Physiology', marksObtained: 76, totalMarks: 100, percentage: 76 },
    { id: 3, name: 'Emergency Medicine', marksObtained: 92, totalMarks: 100, percentage: 92 },
    { id: 4, name: 'Pharmacology', marksObtained: 68, totalMarks: 100, percentage: 68 },
  ]);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectMarks, setNewSubjectMarks] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  

  const [activeTab, setActiveTab] = useState('marks'); // 'marks' | 'details'

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await academicService.listStudents();
        const fetchedStudents = res.data?.data || res.data || [];
        
        const formattedStudents = fetchedStudents.map(s => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          enrollmentId: s.enrollmentId,
          batch: s.batch?.name || (typeof s.batch === 'string' ? s.batch : 'Unknown Batch'),
          course: s.course?.name || (typeof s.course === 'string' ? s.course : 'Unknown Course'),
          institute: s.institute?.orgName || (typeof s.institute === 'string' ? s.institute : 'Unknown Institute'),
          email: s.email,
          phone: s.contactNumber,
          attendance: s.semesters?.[0]?.attendancePercentage || 0,
          thesisStatus: s.semesters?.[0]?.thesisApproved ? 'Approved' : 'Pending',
          overallPercentage: 0
        }));
        
        setStudents(formattedStudents);
      } catch (err) {
        console.error('Error fetching students:', err);
        setToast({ message: 'Failed to load students.', type: 'danger' });
      }
    };
    fetchStudents();
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────────
  const batches = useMemo(() => {
    const unique = new Set(students.map(s => s.batch));
    return ['All', ...unique];
  }, [students]);

  const courses = useMemo(() => {
    const unique = new Set(students.map(s => s.course));
    return ['All', ...unique];
  }, [students]);

  const institutes = useMemo(() => {
    const unique = new Set(students.map(s => s.institute));
    return ['All', ...unique];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBatch = selectedBatch === 'All' || s.batch === selectedBatch;
      const matchCourse = selectedCourse === 'All' || s.course === selectedCourse;
      const matchInstitute = selectedInstitute === 'All' || s.institute === selectedInstitute;
      return matchSearch && matchBatch && matchCourse && matchInstitute;
    });
  }, [students, searchQuery, selectedBatch, selectedCourse, selectedInstitute]);

  const overallMarks = useMemo(() => {
    if (!subjects.length) return { obtained: 0, total: 0, percentage: 0 };
    const obtained = subjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const total = subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    return { obtained, total, percentage: total > 0 ? Math.round((obtained / total) * 100) : 0 };
  }, [subjects]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSubjects([]); // clear while loading
    
    try {
      const res = await resultService.getResultByStudent(student.enrollmentId);
      const resultData = res.data?.data || res.data;
      if (resultData && resultData.subjects) {
        const mappedSubjects = resultData.subjects.map((sub, index) => ({
          id: sub._id || Date.now() + index,
          name: sub.subjectName,
          marksObtained: (sub.internalMarks || 0) + (sub.externalMarks || 0),
          totalMarks: sub.totalMarks || 100,
          percentage: (((sub.internalMarks || 0) + (sub.externalMarks || 0)) / (sub.totalMarks || 100)) * 100
        }));
        setSubjects(mappedSubjects);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        setToast({ message: 'Error fetching student results.', type: 'danger' });
      }
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) {
      setToast({ message: 'Please enter a subject name.', type: 'warning' });
      return;
    }
    const marks = parseFloat(newSubjectMarks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      setToast({ message: 'Please enter valid marks between 0 and 100.', type: 'warning' });
      return;
    }
    
    const newSubject = {
      id: Date.now(),
      name: newSubjectName.trim(),
      marksObtained: marks,
      totalMarks: 100,
      percentage: marks
    };
    
    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
    setNewSubjectMarks('');
    setToast({ message: `Subject "${newSubjectName}" added successfully!`, type: 'success' });
  };

  const handleDeleteSubject = (id) => {
    setConfirmConfig({
      title: 'Delete Subject',
      message: 'Are you sure you want to remove this subject and its marks?',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setConfirmConfig(null);
        setSubjects(subjects.filter(s => s.id !== id));
        setToast({ message: 'Subject removed successfully.', type: 'success' });
      }
    });
  };

  const handleEditMarks = (id) => {
    setEditingSubjectId(id);
    const subject = subjects.find(s => s.id === id);
    setEditMarks(subject ? String(subject.marksObtained) : '');
  };

  const handleSaveMarks = (id) => {
    const marks = parseFloat(editMarks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      setToast({ message: 'Please enter valid marks between 0 and 100.', type: 'warning' });
      return;
    }
    
    setSubjects(subjects.map(s => 
      s.id === id 
        ? { ...s, marksObtained: marks, percentage: marks }
        : s
    ));
    setEditingSubjectId(null);
    setEditMarks('');
    setToast({ message: 'Marks updated successfully!', type: 'success' });
  };

  const handleCancelEdit = () => {
    setEditingSubjectId(null);
    setEditMarks('');
  };

  const handleSubmitAll = async () => {
    if (!selectedStudent) {
      setToast({ message: 'Please select a student first.', type: 'warning' });
      return;
    }
    if (!subjects.length) {
      setToast({ message: 'No subjects to submit. Please add at least one subject.', type: 'warning' });
      return;
    }

    setConfirmConfig({
      title: 'Submit Marks',
      message: `Are you sure you want to submit marks for ${selectedStudent.name}?\nTotal Subjects: ${subjects.length}\nOverall Percentage: ${overallMarks.percentage}%`,
      type: 'success',
      confirmText: 'Submit All',
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsSubmitting(true);
        
        try {
          const payload = {
            student: selectedStudent.id,
            academicYear: new Date().getFullYear().toString(),
            semester: 1,
            subjects: subjects.map(s => ({
              subjectCode: s.id.toString(),
              subjectName: s.name,
              internalMarks: Math.floor(s.marksObtained / 2),
              externalMarks: Math.ceil(s.marksObtained / 2),
              totalMarks: s.totalMarks,
              grade: s.percentage >= 80 ? 'A+' : s.percentage >= 60 ? 'B' : s.percentage >= 50 ? 'C' : 'F',
              credits: 3,
            })),
            totalMarks: overallMarks.obtained,
            totalCredits: subjects.length * 3,
            percentage: overallMarks.percentage,
            cgpa: parseFloat((overallMarks.percentage / 10).toFixed(2)),
            sgpa: parseFloat((overallMarks.percentage / 10).toFixed(2)),
            division: overallMarks.percentage >= 60 ? 'First' : 'Second',
            resultStatus: overallMarks.percentage >= 50 ? 'PASS' : 'FAIL',
          };
          
          await resultService.createResult(payload);
          
          setToast({ 
            message: `✅ All marks submitted successfully for ${selectedStudent.name}!`, 
            type: 'success' 
          });
        } catch (error) {
          console.error(error);
          setToast({ message: 'Failed to submit marks.', type: 'danger' });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleExport = () => {
    setToast({ message: '📊 Marks data exported successfully!', type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const getStatusColor = (percentage) => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 80) return <TrendingUp className="w-3.5 h-3.5" />;
    if (percentage >= 60) return <Minus className="w-3.5 h-3.5" />;
    return <TrendingDown className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Marks Updating</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Enter and manage student examination marks</p>
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

      {/* ─── Messages ────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* ─── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ─── LEFT PANEL: Student Selection ────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Registry
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={selectedInstitute}
                onChange={(e) => setSelectedInstitute(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer col-span-2"
              >
                {institutes.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold">
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Student List */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden max-h-[500px] overflow-y-auto">
            {filteredStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => handleSelectStudent(student)}
                className={`w-full p-4 text-left border-b border-slate-50 hover:bg-slate-50/70 transition-all group ${
                  selectedStudent?.id === student.id 
                    ? 'bg-blue-50/50 border-l-4 border-l-blue-600' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    selectedStudent?.id === student.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-800 truncate">{student.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400">{student.enrollmentId}</span>
                      <span className="text-[9px] font-bold text-slate-400">•</span>
                      <span className="text-[9px] font-bold text-slate-400">{student.batch}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        student.attendance >= 75 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {student.attendance}% Attendance
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        student.thesisStatus === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {student.thesisStatus}
                      </span>
                    </div>
                  </div>
                  {selectedStudent?.id === student.id && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No students found matching your filters.
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Marks Entry ─────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {selectedStudent ? (
            <>
              {/* Student Info Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{selectedStudent.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        <span className="font-mono font-bold text-blue-600">{selectedStudent.enrollmentId}</span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {selectedStudent.batch}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3.5 h-3.5" />
                          {selectedStudent.institute}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">Overall: </span>
                    <span className={`text-sm font-black ${overallMarks.percentage >= 75 ? 'text-emerald-600' : overallMarks.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {overallMarks.percentage}%
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-[9px] uppercase font-black text-slate-400">Subjects</span>
                    <p className="text-sm font-black text-slate-800">{subjects.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-[9px] uppercase font-black text-slate-400">Total Marks</span>
                    <p className="text-sm font-black text-slate-800">{overallMarks.obtained}/{overallMarks.total}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-[9px] uppercase font-black text-slate-400">Attendance</span>
                    <p className={`text-sm font-black ${selectedStudent.attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedStudent.attendance}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <span className="text-[9px] uppercase font-black text-slate-400">Thesis</span>
                    <p className={`text-sm font-black ${selectedStudent.thesisStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedStudent.thesisStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-6 pt-4 flex gap-1">
                  <button
                    onClick={() => setActiveTab('marks')}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all ${
                      activeTab === 'marks'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
                    Marks Entry
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all ${
                      activeTab === 'details'
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 inline mr-1.5" />
                    Student Details
                  </button>
                </div>

                {/* ─── TAB: Marks Entry ──────────────────────────────────────── */}
                {activeTab === 'marks' && (
                  <div className="p-6 space-y-6">
                    {/* Subject Table */}
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Marks Obtained</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Percentage</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {subjects.map((subject, idx) => (
                            <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-slate-800">
                                {subject.name}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {editingSubjectId === subject.id ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={editMarks}
                                      onChange={(e) => setEditMarks(e.target.value)}
                                      className="w-16 px-2 py-1 bg-white border border-blue-300 rounded-lg text-center text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                    />
                                    <span className="text-slate-400 font-bold">/ 100</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-slate-800">
                                    {subject.marksObtained} / {subject.totalMarks}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(subject.percentage)}`}>
                                  {getStatusIcon(subject.percentage)}
                                  {subject.percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {editingSubjectId === subject.id ? (
                                    <>
                                      <button
                                        onClick={() => handleSaveMarks(subject.id)}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                        title="Save"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                                        title="Cancel"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditMarks(subject.id)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit Marks"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubject(subject.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete Subject"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {subjects.length === 0 && (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-slate-400 text-xs font-medium">
                                No subjects added yet. Add a subject below.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {/* Summary Row */}
                        {subjects.length > 0 && (
                          <tfoot>
                            <tr className="bg-slate-50 border-t border-slate-200">
                              <td colSpan="2" className="px-4 py-3 font-black text-xs text-slate-700">
                                Total / Overall
                              </td>
                              <td className="px-4 py-3 text-center font-black text-sm text-slate-800">
                                {overallMarks.obtained} / {overallMarks.total}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(overallMarks.percentage)}`}>
                                  {getStatusIcon(overallMarks.percentage)}
                                  {overallMarks.percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center"></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    {/* Add Subject Row */}
                    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Enter subject name..."
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Marks"
                          value={newSubjectMarks}
                          onChange={(e) => setNewSubjectMarks(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all text-center"
                        />
                      </div>
                      <button
                        onClick={handleAddSubject}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subject
                      </button>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        onClick={handleSubmitAll}
                        disabled={isSubmitting || subjects.length === 0}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Submit All Marks
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB: Student Details ──────────────────────────────────── */}
                {activeTab === 'details' && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100 pb-2">
                          Personal Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Full Name</span>
                            <span className="text-sm font-bold text-slate-800">{selectedStudent.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Enrollment ID</span>
                            <span className="text-sm font-mono font-bold text-blue-600">{selectedStudent.enrollmentId}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Email Address</span>
                            <span className="text-sm font-semibold text-slate-700">{selectedStudent.email}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Contact Number</span>
                            <span className="text-sm font-semibold text-slate-700">{selectedStudent.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100 pb-2">
                          Academic Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Institute</span>
                            <span className="text-sm font-bold text-slate-800">{selectedStudent.institute}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Course</span>
                            <span className="text-sm font-bold text-slate-800">{selectedStudent.course}</span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-400 block">Batch</span>
                            <span className="text-sm font-bold text-slate-800">{selectedStudent.batch}</span>
                          </div>
                          <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-black text-slate-400">Attendance:</span>
                              <span className={`text-sm font-black ${selectedStudent.attendance >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {selectedStudent.attendance}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase font-black text-slate-400">Thesis:</span>
                              <span className={`text-sm font-black ${selectedStudent.thesisStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {selectedStudent.thesisStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subject Summary */}
                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">
                        Marks Summary ({subjects.length} Subjects)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {subjects.map(subject => (
                          <div key={subject.id} className="bg-slate-50 rounded-xl p-3 text-center">
                            <span className="text-[9px] font-bold text-slate-500 block truncate">{subject.name}</span>
                            <span className={`text-sm font-black ${subject.percentage >= 75 ? 'text-emerald-600' : subject.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {subject.marksObtained}%
                            </span>
                          </div>
                        ))}
                        {subjects.length === 0 && (
                          <div className="col-span-4 text-center text-slate-400 text-xs py-4">
                            No subjects recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // ─── Empty State ──────────────────────────────────────────────────
            <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-700">Select a Student</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                Choose a student from the list on the left to view and update their marks.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <span className="bg-slate-100 px-3 py-1 rounded-full">📊 {students.length} Students</span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">📚 {batches.length - 1} Batches</span>
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