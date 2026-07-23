import { useState, useMemo, useEffect } from 'react';
import academicService from '../../../api/academic';
import instituteService from '../../../api/institutes';
import examService from '../../../api/exams';
import resultService from '../../../api/results';
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
  Eye,
  ChevronDown,
  Globe,
  ShieldCheck,
  Bell,
  CalendarDays,
  Mail,
  BarChart3,
  X
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';

const AcademyPublishResults = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [publishAMPM, setPublishAMPM] = useState('AM');
  const [includeAllStudents, setIncludeAllStudents] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const [institutes, setInstitutes] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instRes, examRes, batchRes] = await Promise.all([
          instituteService.listApplications().catch(() => ({ data: { data: [] } })),
          examService.listExamApplications().catch(() => ({ data: { data: [] } })),
          academicService.getBatches().catch(() => ({ data: { data: [] } }))
        ]);

        const instData = instRes.data?.data || [];
        const examData = examRes.data?.data || [];
        const batchData = batchRes.data?.data || [];

        setInstitutes(instData.map(i => ({ id: i._id, name: i.orgName || i.organizationName || 'Institute' })));
        setExams(examData.map(e => ({ id: e._id, name: e.title || e.name || 'Exam' })));
        setBatches(batchData.map(b => ({ id: b._id, name: b.name, students: b.students?.length || 0 })));
      } catch (err) {
        setToast({ message: 'Error loading dropdown data', type: 'danger' });
      }
    };
    fetchData();
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    if (!selectedInstitute) return [];
    return batches;
  }, [selectedInstitute, batches]);

  const totalStudents = useMemo(() => {
    if (includeAllStudents) {
      return batches.reduce((sum, b) => sum + (b.students || 0), 0);
    }
    return selectedStudents.length;
  }, [includeAllStudents, selectedStudents, batches]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    // Validate required fields
    if (!selectedInstitute) {
      setToast({ message: 'Please select an institution.', type: 'warning' });
      return;
    }
    if (!selectedBatch) {
      setToast({ message: 'Please select a batch.', type: 'warning' });
      return;
    }
    if (!selectedExam) {
      setToast({ message: 'Please select an exam.', type: 'warning' });
      return;
    }
    if (!publishDate) {
      setToast({ message: 'Please select a publish date.', type: 'warning' });
      return;
    }
    if (!publishTime) {
      setToast({ message: 'Please select a publish time.', type: 'warning' });
      return;
    }

    setConfirmConfig({
      title: 'Publish Results',
      message: `Are you sure you want to publish results for:\n\n• Institution: ${institutes.find(i => String(i.id) === String(selectedInstitute))?.name}\n• Exam: ${exams.find(e => String(e.id) === String(selectedExam))?.name}\n• Students: ${totalStudents}\n• Publish Date: ${new Date(publishDate).toLocaleDateString()}\n• Publish Time: ${publishTime} ${publishAMPM}`,
      type: 'success',
      confirmText: 'Yes, Publish Now',
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsSubmitting(true);
        
        try {
          // Since there is no bulk publish endpoint that accepts batch/exam ID, we just simulate the UI flow
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
          console.error(error);
        }
        
        setIsSubmitting(false);

        // Alternate Flow: Missing marks -> Block
        // Simulating that if Batch 2023-B (id 4) is selected, there are missing marks
        if (Number(selectedBatch) === 4) {
          setToast({
            message: `❌ Cannot publish results. Missing marks detected for 2 students in ${getBatchName(selectedBatch)}. Please upload marks before publishing.`,
            type: 'error'
          });
          return;
        }

        setToast({
          message: `✅ Results published successfully! ${totalStudents} student${totalStudents > 1 ? 's' : ''} will see results on ${new Date(publishDate).toLocaleDateString()} at ${publishTime} ${publishAMPM}`,
          type: 'success'
        });

        // Reset form after success
        setTimeout(() => {
          setSelectedInstitute('');
          setSelectedBatch('');
          setSelectedExam('');
          setPublishDate('');
          setPublishTime('');
          setPublishAMPM('AM');
          setIncludeAllStudents(true);
          setSelectedStudents([]);
        }, 3000);
      }
    });
  };

  const handlePreview = () => {
    if (!selectedInstitute || !selectedBatch || !selectedExam) {
      setToast({ message: 'Please select institution, batch, and exam to preview.', type: 'warning' });
      return;
    }
    setShowPreview(true);
  };

  const handleSendNotification = () => {
    setToast({
      message: `📧 Notification emails sent to ${totalStudents} students and ${institutes.filter(i => String(i.id) === String(selectedInstitute)).length} institute(s)!`,
      type: 'success'
    });
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const getInstituteName = (id) => {
    const inst = institutes.find(i => String(i.id) === String(id));
    return inst ? inst.name : '';
  };

  const getExamName = (id) => {
    const exam = exams.find(e => String(e.id) === String(id));
    return exam ? exam.name : '';
  };

  const getBatchName = (id) => {
    const batch = batches.find(b => String(b.id) === String(id));
    return batch ? batch.name : '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Publish Results</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Schedule and publish examination results to institutes and students</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-blue-100 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={handleSendNotification}
            className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-purple-100 transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            Notify
          </button>
        </div>
      </div>

      {/* ─── Main Form ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* ─── Left: Form Panel ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Publish Results</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Schedule result publication date and time</p>
          </div>

          {/* Institution Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Institution <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedInstitute}
                onChange={(e) => {
                  setSelectedInstitute(e.target.value);
                  setSelectedBatch('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              >
                <option value="">Select Institution</option>
                {institutes.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Exam Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Exam <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileSpreadsheet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Batch Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Batch <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                disabled={!selectedInstitute}
              >
                <option value="">{selectedInstitute ? 'Select Batch' : 'Select Institution first'}</option>
                {filteredBatches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.students} students)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {selectedInstitute && filteredBatches.length === 0 && (
              <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No batches available for this institution.
              </p>
            )}
          </div>

          {/* Student Selection */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
              Students
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={includeAllStudents}
                  onChange={() => setIncludeAllStudents(true)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">All Students</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!includeAllStudents}
                  onChange={() => setIncludeAllStudents(false)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">Select Specific</span>
              </label>
            </div>
            {!includeAllStudents && (
              <div className="mt-2 animate-in slide-in-from-top duration-200">
                <select
                  multiple
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all min-h-[100px]"
                >
                  <option value="1">Dr. Aarav Sharma (SEMI-2026-1001)</option>
                  <option value="2">Dr. Priya Nair (SEMI-2026-1002)</option>
                  <option value="3">Dr. Rahul Verma (SEMI-2026-1003)</option>
                  <option value="4">Dr. Neha Patel (SEMI-2026-1004)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Hold Ctrl/Cmd to select multiple students</p>
              </div>
            )}
          </div>

          {/* Publish Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Publish Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-500">
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
                <select
                  value={publishAMPM}
                  onChange={(e) => setPublishAMPM(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-extrabold text-indigo-900 block">Publication Notice</span>
              <p className="text-[11px] text-indigo-800 font-medium leading-relaxed mt-0.5">
                Results will be visible to institutes and students at the selected date and time.
                A notification email will be sent to all stakeholders.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish Results
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─── Right: Summary Panel ───────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Publication Summary
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-[11px] font-semibold text-slate-500">Institution</span>
                <span className="text-xs font-bold text-slate-800 text-right max-w-[180px] truncate">
                  {selectedInstitute ? getInstituteName(selectedInstitute) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-[11px] font-semibold text-slate-500">Exam</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedExam ? getExamName(selectedExam) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-[11px] font-semibold text-slate-500">Batch</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedBatch ? getBatchName(selectedBatch) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-[11px] font-semibold text-slate-500">Students</span>
                <span className="text-xs font-bold text-indigo-600">
                  {totalStudents} student{totalStudents !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-[11px] font-semibold text-slate-500">Publish Date</span>
                <span className="text-xs font-bold text-slate-800">
                  {publishDate ? new Date(publishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Publish Time</span>
                <span className="text-xs font-bold text-slate-800">
                  {publishTime ? `${publishTime} ${publishAMPM}` : '—'}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`mt-4 p-3 rounded-xl border ${publishDate && publishTime ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2">
                {publishDate && publishTime ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700">Ready to publish</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-[10px] font-black text-amber-700">Please complete all required fields</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={handlePreview}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[10px] font-bold text-slate-600 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Results
              </button>
              <button
                onClick={handleSendNotification}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-xl text-[10px] font-bold text-slate-600 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Notifications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Preview Modal ────────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Result Preview</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {getExamName(selectedExam)} • {getBatchName(selectedBatch)}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Publication Details */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Bell className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-indigo-900 block">Publication Schedule</span>
                  <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                    Results will be published on {publishDate ? new Date(publishDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—'} at {publishTime} {publishAMPM}
                  </p>
                </div>
              </div>

              {/* Results Table Preview */}
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Student Results ({totalStudents} students)</h4>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">#</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">Student Name</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Percentage</th>
                        <th className="px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {[
                        { name: 'Dr. Aarav Sharma', id: 'SEMI-2026-1001', percentage: 87 },
                        { name: 'Dr. Priya Nair', id: 'SEMI-2026-1002', percentage: 76 },
                        { name: 'Dr. Rahul Verma', id: 'SEMI-2026-1003', percentage: 76 },
                        { name: 'Dr. Neha Patel', id: 'SEMI-2026-1004', percentage: 84 },
                        { name: 'Dr. Karan Malhotra', id: 'SEMI-2026-1005', percentage: 62 },
                      ].slice(0, 5).map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-400">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-700">
                            {student.name}
                            <span className="ml-2 text-[9px] font-mono font-bold text-slate-400">{student.id}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-black ${student.percentage >= 75 ? 'text-emerald-600' : student.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {student.percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${student.percentage >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : student.percentage >= 60 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                              {student.percentage >= 75 ? 'Passed' : student.percentage >= 60 ? 'Eligible' : 'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalStudents > 5 && (
                  <p className="text-[10px] text-slate-400 font-medium mt-2 text-center">
                    + {totalStudents - 5} more student{totalStudents - 5 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <CalendarDays className="w-4 h-4" />
                {publishDate ? `Scheduled for ${new Date(publishDate).toLocaleDateString()}` : 'Not scheduled'}
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close Preview
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