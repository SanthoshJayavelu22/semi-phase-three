import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  FileSpreadsheet,
  RefreshCw,
  Globe,
  Mail,
  X,
  Printer,
  Download,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';
import marksService from '../../../api/marks';
import academicService from '../../../api/academic';
import instituteService from '../../../api/institutes';

// ─── Step Indicator (module-level, presentational) ──────────────────────────
const StepIndicator = ({ current, total, labels, onStepChange }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {Array.from({ length: total }, (_, i) => i + 1).map((num, idx) => {
      const isActive = current === num;
      const isCompleted = current > num;
      const isClickable = num < current;

      return (
        <div key={num} className="flex items-center">
          {idx > 0 && (
            <div
              className={`w-12 h-0.5 sm:w-20 ${
                isCompleted ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            />
          )}
          <button
            type="button"
            onClick={() => isClickable && onStepChange(num)}
            disabled={!isClickable}
            className={`flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? 'scale-105' : ''
            } ${!isClickable ? 'opacity-60 cursor-default' : 'hover:bg-slate-50'}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all shadow-sm ${
                isCompleted || isActive
                  ? 'bg-blue-600 text-white shadow-blue-500/30'
                  : 'bg-slate-100 text-slate-400'
              } ${isActive ? 'ring-4 ring-blue-100' : ''}`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                isActive || isCompleted ? 'text-blue-700' : 'text-slate-400'
              }`}
            >
              {labels[idx]}
            </span>
          </button>
        </div>
      );
    })}
  </div>
);

const AcademyPublishResults = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1: Select, 2: Review, 3: Publish
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [publishAMPM, setPublishAMPM] = useState('AM');
  const [includeAllStudents, setIncludeAllStudents] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Data State ──────────────────────────────────────────────────────────────
  const [institutes, setInstitutes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [publicationStatus, setPublicationStatus] = useState(null);
  const [generatedResults, setGeneratedResults] = useState(null);
  const [publishResult, setPublishResult] = useState(null);

  const itemsPerPage = 10;

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, courseRes, batchRes] = await Promise.all([
          instituteService.listApplications().catch(() => ({ data: { data: [] } })),
          academicService.getCourses().catch(() => ({ data: { data: [] } })),
          academicService.getBatches().catch((err) => {
            console.warn('Failed to fetch batches from API:', err);
            setToast({
              message: err.parsedMessage || err.message || 'Failed to load batches',
              type: 'error',
            });
            return { data: { data: [] } };
          }),
        ]);

        setInstitutes((instRes.data?.data || []).map((i) => ({ id: i._id, name: i.orgName || i.name })));
        setCourses((courseRes.data?.data || []).map((c) => ({ id: c._id, name: c.name })));
        setBatches((batchRes.data?.data || []).map((b) => ({ id: b._id, name: b.name, course: b.course?._id || b.course })));
      } catch {
        setToast({ message: 'Error loading data', type: 'error' });
      }
    };
    fetchData();
  }, []);

  // ─── Fetch Publication Status ───────────────────────────────────────────────
  const fetchPublicationStatus = useCallback(async () => {
    if (!selectedBatch || !selectedCourse || !selectedSemester) return;

    try {
      const res = await marksService.getPublicationStatus({
        batchId: selectedBatch,
        courseId: selectedCourse,
        semesterNumber: selectedSemester,
      });
      const data = res.data?.data || res.data;
      setPublicationStatus(data);
    } catch {
      setToast({ message: 'Failed to load publication status', type: 'error' });
    }
  }, [selectedBatch, selectedCourse, selectedSemester]);

  useEffect(() => {
    if (selectedBatch && selectedCourse && selectedSemester) {
      const timer = setTimeout(() => {
        fetchPublicationStatus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedBatch, selectedCourse, selectedSemester, fetchPublicationStatus]);

  // ─── Derived Data ──────────────────────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    if (!selectedCourse) return [];
    return batches.filter((b) => {
      const courseId = b.course?._id || b.course;
      return String(courseId) === String(selectedCourse);
    });
  }, [batches, selectedCourse]);

  const statusSummary = useMemo(() => {
    if (!publicationStatus) return { total: 0, ready: 0, partial: 0, noMarks: 0, published: 0 };
    return publicationStatus.summary || { total: 0, ready: 0, partial: 0, noMarks: 0, published: 0 };
  }, [publicationStatus]);

  const studentList = useMemo(() => {
    if (!publicationStatus) return [];
    return publicationStatus.students || [];
  }, [publicationStatus]);

  const filteredStudents = useMemo(() => {
    if (includeAllStudents) return studentList;
    return studentList.filter((s) => selectedStudents.includes(s.studentId));
  }, [studentList, includeAllStudents, selectedStudents]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;

  const readyCount = studentList.filter((s) => s.status === 'Ready').length;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleGenerateResults = async () => {
    if (readyCount === 0) {
      setToast({ message: 'No students are ready for result generation.', type: 'warning' });
      return;
    }

    setConfirmConfig({
      title: 'Generate Results from Marks',
      message: `This will generate results for ${readyCount} student(s) who have complete marks.\nStudents with missing marks will be skipped.`,
      type: 'info',
      confirmText: 'Generate Now',
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsGenerating(true);

        try {
          const payload = {
            semesterNumber: parseInt(selectedSemester),
            batchId: selectedBatch,
            courseId: selectedCourse,
            academicYear: selectedAcademicYear || new Date().getFullYear().toString(),
            selectedStudentIds: !includeAllStudents ? selectedStudents : undefined,
          };

          const res = await marksService.generateResults(payload);
          const data = res.data?.data || res.data;

          setGeneratedResults(data);
          setStep(2);

          setToast({
            message: `✅ Generated ${data.generated} results, ${data.errors} errors`,
            type: data.errors > 0 ? 'warning' : 'success',
          });

          await fetchPublicationStatus();
        } catch (err) {
          setToast({ message: err.parsedMessage || 'Failed to generate results', type: 'error' });
        } finally {
          setIsGenerating(false);
        }
      },
    });
  };

  const handlePublishResults = async () => {
    if (!publishDate || !publishTime) {
      setToast({ message: 'Please select a publish date and time.', type: 'warning' });
      return;
    }

    const readyToPublish = studentList.filter((s) => s.status === 'Ready').length;
    if (readyToPublish === 0) {
      setToast({ message: 'No results ready to publish.', type: 'warning' });
      return;
    }

    setConfirmConfig({
      title: 'Publish Results',
      message: `Are you sure you want to publish results for ${readyToPublish} student(s)?\n\n• Date: ${new Date(publishDate).toLocaleDateString()}\n• Time: ${publishTime} ${publishAMPM}\n• Notifications: ${sendNotifications ? 'Yes' : 'No'}`,
      type: 'success',
      confirmText: 'Publish Now',
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsPublishing(true);

        try {
          const payload = {
            semesterNumber: parseInt(selectedSemester),
            batchId: selectedBatch,
            courseId: selectedCourse,
            academicYear: selectedAcademicYear || new Date().getFullYear().toString(),
            publishDate,
            publishTime: `${publishTime} ${publishAMPM}`,
            selectedStudentIds: !includeAllStudents ? selectedStudents : undefined,
            sendNotifications,
          };

          const res = await marksService.publishResults(payload);
          const data = res.data?.data || res.data;

          setPublishResult(data);
          setStep(3);

          setToast({
            message: `✅ Published ${data.publishedCount} results successfully!`,
            type: 'success',
          });

          await fetchPublicationStatus();
        } catch (err) {
          setToast({ message: err.parsedMessage || 'Failed to publish results', type: 'error' });
        } finally {
          setIsPublishing(false);
        }
      },
    });
  };

  const handleReset = () => {
    setStep(1);
    setGeneratedResults(null);
    setPublishResult(null);
    setSelectedInstitute('');
    setSelectedCourse('');
    setSelectedBatch('');
    setSelectedSemester('');
    setSelectedAcademicYear('');
    setPublishDate('');
    setPublishTime('');
    setSelectedStudents([]);
    setIncludeAllStudents(true);
    setCurrentPage(1);
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    const readyStudentIds = studentList.filter((s) => s.status === 'Ready').map((s) => s.studentId);
    if (selectedStudents.length === readyStudentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(readyStudentIds);
    }
  };

  // ─── Render Helpers ──────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const map = {
      Ready: { label: '✅ Ready', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      Partial: { label: '⚠️ Partial', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      'No Marks': { label: '❌ No Marks', color: 'bg-rose-100 text-rose-700 border-rose-200' },
      Published: { label: '📄 Published', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    };
    return map[status] || map['No Marks'];
  };

  const getStatusIcon = (status) => {
    if (status === 'Ready') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status === 'Partial') return <AlertCircle className="w-4 h-4 text-amber-600" />;
    if (status === 'Published') return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    return <X className="w-4 h-4 text-rose-600" />;
  };

  // ─── Step 1: Select & Review ──────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Institute */}
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
            Institute <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Select Institute</option>
              {institutes.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Course */}
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
            Course <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedBatch('');
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch */}
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
            Batch <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              disabled={!selectedCourse}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">{selectedCourse ? 'Select Batch' : 'Select Course first'}</option>
              {filteredBatches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
            Semester <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={!selectedBatch}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Academic Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
            Academic Year
          </label>
          <input
            type="text"
            placeholder="e.g. 2024-25"
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-end justify-end gap-3">
          <button
            onClick={() => {
              setSelectedAcademicYear(new Date().getFullYear().toString());
              setPublishDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
          >
            Set Current Year
          </button>
          <button
            onClick={fetchPublicationStatus}
            disabled={!selectedBatch || !selectedCourse || !selectedSemester}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Status
          </button>
        </div>
      </div>

      {/* Status Summary */}
      {publicationStatus && (
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Total: {statusSummary.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">Ready: {statusSummary.ready}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">Partial: {statusSummary.partial}</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-bold text-rose-700">No Marks: {statusSummary.noMarks}</span>
            </div>
            {statusSummary.published > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">Published: {statusSummary.published}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student List with Status */}
      {studentList.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h4 className="text-sm font-bold text-slate-700">Students</h4>
              <span className="text-xs text-slate-400">{studentList.length} total</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAllStudents}
                  onChange={() => setIncludeAllStudents(!includeAllStudents)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                All Students
              </label>
              {!includeAllStudents && (
                <button
                  onClick={handleSelectAllStudents}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Select Ready Students
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  {!includeAllStudents && (
                    <th className="px-4 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === studentList.filter((s) => s.status === 'Ready').length && studentList.filter((s) => s.status === 'Ready').length > 0}
                        onChange={handleSelectAllStudents}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Name</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrollment ID</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedStudents.map((s, idx) => {
                  const status = getStatusBadge(s.status);
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50/50 transition-colors">
                      {!includeAllStudents && (
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s.studentId)}
                            onChange={() => handleSelectStudent(s.studentId)}
                            disabled={s.status !== 'Ready'}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                        {String(globalIdx).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{s.enrollmentId}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}
                        >
                          {getStatusIcon(s.status)}
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginatedStudents.length === 0 && (
                  <tr>
                    <td colSpan={!includeAllStudents ? 5 : 4} className="px-4 py-8 text-center text-slate-400 text-sm font-medium">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-blue-600 shadow-sm">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
        >
          Reset
        </button>
        <button
          onClick={handleGenerateResults}
          disabled={isGenerating || readyCount === 0}
          className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-500/10"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><FileText className="w-4 h-4" /> Generate Results ({readyCount})</>
          )}
        </button>
      </div>
    </div>
  );

  // ─── Step 2: Review Results ──────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-emerald-800">Results Generated Successfully</h4>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">
            Generated {generatedResults?.generated || 0} results, {generatedResults?.errors || 0} errors
          </p>
          {generatedResults?.errors > 0 && (
            <div className="mt-2 text-xs text-amber-700 bg-amber-50/80 p-2 rounded-xl border border-amber-200">
              <span className="font-bold">⚠️ {generatedResults.errors} students were skipped:</span>
              {generatedResults.errorDetails?.slice(0, 3).map((err, i) => (
                <div key={`${err.name || 'err'}-${i}`} className="mt-0.5">{err.name}: {err.reason}</div>
              ))}
              {generatedResults.errors > 3 && (
                <div className="text-slate-500 text-[10px]">+ {generatedResults.errors - 3} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Publication Schedule */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="text-sm font-black text-slate-700 mb-4">Publication Schedule</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Publish Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">
              Publish Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="10"
                  value={publishTime}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 12) {
                      setPublishTime(e.target.value);
                    } else if (e.target.value === '') {
                      setPublishTime('');
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <select
                value={publishAMPM}
                onChange={(e) => setPublishAMPM(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={sendNotifications}
                onChange={(e) => setSendNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Send Notifications
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <span className="text-[10px] uppercase font-black text-slate-400 block">Total Students</span>
            <span className="text-xl font-black text-slate-800">{generatedResults?.totalStudents || 0}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-black text-slate-400 block">Generated</span>
            <span className="text-xl font-black text-emerald-600">{generatedResults?.generated || 0}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-black text-slate-400 block">Errors</span>
            <span className={`text-xl font-black ${generatedResults?.errors > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {generatedResults?.errors || 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] uppercase font-black text-slate-400 block">Ready to Publish</span>
            <span className="text-xl font-black text-blue-600">{generatedResults?.generated || 0}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setStep(1);
              setGeneratedResults(null);
            }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Regenerate
          </button>
          <button
            onClick={handlePublishResults}
            disabled={isPublishing || !publishDate || !publishTime}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10"
          >
            {isPublishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
            ) : (
              <><Send className="w-4 h-4" /> Publish Results</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Step 3: Publication Complete ──────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-black text-emerald-800">🎉 Results Published Successfully!</h3>
        <p className="text-sm text-emerald-700 font-medium mt-2">
          {publishResult?.publishedCount} results published, {publishResult?.skippedCount} already published
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-emerald-700">
          <span>📅 {publishDate ? new Date(publishDate).toLocaleDateString() : 'N/A'}</span>
          <span>⏰ {publishTime} {publishAMPM}</span>
          <span>📧 {sendNotifications ? 'Notifications Sent' : 'No Notifications'}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] uppercase font-black text-slate-400 block">Published</span>
          <span className="text-2xl font-black text-emerald-600">{publishResult?.publishedCount || 0}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] uppercase font-black text-slate-400 block">Skipped</span>
          <span className="text-2xl font-black text-amber-600">{publishResult?.skippedCount || 0}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] uppercase font-black text-slate-400 block">Total</span>
          <span className="text-2xl font-black text-slate-800">{publishResult?.totalResults || 0}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] uppercase font-black text-slate-400 block">Notifications</span>
          <span className="text-2xl font-black text-blue-600">{sendNotifications ? '✅ Sent' : '⏸️ Off'}</span>
        </div>
      </div>



      {/* Generated Results Preview */}
      {publishResult?.publishedResults?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h4 className="text-sm font-bold text-slate-700">Published Results</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Student</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Percentage</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Result</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {publishResult.publishedResults.slice(0, 5).map((r, idx) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {r.student?.firstName} {r.student?.lastName}
                      <span className="ml-2 text-[10px] font-mono text-slate-400">{r.student?.enrollmentId}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{r.percentage}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        r.resultStatus === 'PASS'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {r.resultStatus === 'PASS' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        {r.resultStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.resultStatus === 'PASS' ? (
                        <span className="text-emerald-600 font-bold text-[10px]">✅ Generated</span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
        >
          Start New Publication
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">

      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Publish Results</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {step === 1 && 'Select students and generate results from marks'}
              {step === 2 && 'Review generated results and schedule publication'}
              {step === 3 && 'Publication complete'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-slate-400">Step</span>
            <span className="text-sm font-black text-blue-600">{step}/3</span>
          </div>
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

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <StepIndicator
          current={step}
          total={3}
          labels={['Select & Review', 'Schedule', 'Publish']}
          onStepChange={setStep}
        />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
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

export default AcademyPublishResults;
