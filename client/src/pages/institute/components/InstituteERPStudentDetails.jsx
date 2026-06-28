import React, { useState, useRef, useMemo } from 'react';
import { Eye, Download, CheckCircle2, ChevronLeft, ChevronRight, X, Database, FileText, UploadCloud, Trash2, Calendar, Award, Percent, RefreshCw } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import Toast from '../../../Components/Toast';
import academicService from '../../../api/academic';

const InstituteERPStudentDetails = ({
  students = [],
  fetchERPData
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(''); // This will be the actual MongoDB _id
  const [studentName, setStudentName] = useState('');
  const [attendance, setAttendance] = useState('');
  
  // File upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const [viewingDetails, setViewingDetails] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Toasts
  const [toast, setToast] = useState(null);

  // Pagination states
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(students.length / itemsPerPage) || 1;

  const getDocUrl = (url) => {
    if (!url) return '';
    return getUploadUrl(url);
  };

  // Handle student selection change
  const handleStudentChange = (id) => {
    setSelectedStudentId(id);
    if (id === '') {
      setStudentName('');
      setAttendance('');
      return;
    }
    const student = students.find(s => String(s.id) === id || String(s._id) === id);
    if (student) {
      setStudentName(student.fullName || '');
      setAttendance(student.attendancePercentage || '');
    } else {
      setStudentName('');
      setAttendance('');
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !studentName || !attendance) {
      setToast({ message: 'Please select a student and enter attendance.', type: 'warning' });
      return;
    }

    const attendanceNum = parseFloat(attendance);
    if (isNaN(attendanceNum) || attendanceNum < 0 || attendanceNum > 100) {
      setToast({ message: 'Please enter a valid attendance percentage between 0 and 100.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = { attendancePercentage: attendanceNum };
      if (uploadedFile) {
        payload.thesisDocument = uploadedFile;
      }

      await academicService.updateAcademicMetrics(selectedStudentId, payload);
      
      setSuccessMsg('🎉 Student details and thesis uploaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Refresh global state
      if (fetchERPData) await fetchERPData();

      // Reset Form
      setSelectedStudentId('');
      setStudentName('');
      setAttendance('');
      setUploadedFile(null);

    } catch (err) {
      console.error("Error updating academic metrics:", err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit details');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDetails = (student) => {
    handleStudentChange(student._id || student.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDetails = async (studentId) => {
    if (!window.confirm("Are you sure you want to clear this student's attendance and thesis records?")) return;
    
    setIsSubmitting(true);
    try {
      await academicService.updateAcademicMetrics(studentId, {
        clearAttendance: true,
        clearThesis: true,
      });
      setSuccessMsg('Academic records cleared successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      if (fetchERPData) await fetchERPData();
    } catch (err) {
      console.error("Error clearing academic metrics:", err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to clear details');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current page items
  const paginatedStudents = useMemo(() => {
    return students.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
  }, [students, activePage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* Page Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Students Details Console</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">Submit attendance records, upload thesis papers, and view student portfolios</p>
          </div>
        </div>
      </div>

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

      {/* Grid Layout for Form and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. STUDENT DETAILS SUBMISSION FORM */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Update Details</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Enter attendance and upload thesis file</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student ID Dropdown */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student ID *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer hover:bg-slate-100/55"
                  required
                >
                  <option value="">Select Enrolled Student...</option>
                  {students.map(s => {
                    const idStr = s.enrollmentNo || `STUD00${s.id}`;
                    return (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {idStr} - {s.fullName}
                      </option>
                    );
                  })}
                  {students.length === 0 && (
                    <option value="" disabled>No students found</option>
                  )}
                </select>
              </div>

              {/* Student Name (pre-filled) */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student Name</label>
                <input
                  type="text"
                  placeholder="Student name..."
                  value={studentName}
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-not-allowed opacity-80"
                />
              </div>

              {/* Attendance percentage */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Attendance percentage *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    placeholder="percentage.."
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                </div>
              </div>

              {/* Thesis upload Drag & Drop Zone */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Thesis upload (Optional if only updating attendance)</label>
                
                {uploadedFile ? (
                  <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{uploadedFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/65'
                    }`}
                  >
                    <UploadCloud className="w-7 h-7 text-blue-500" />
                    <span className="text-xs font-bold text-blue-600">choose file or Drag and drop</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">PDF, DOCX, or ZIP (Max 10MB)</span>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                      accept=".pdf,.docx,.zip"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudentId}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:pointer-events-none text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:scale-[1.01] flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 2. STUDENT DETAILS LIST */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Student Details List</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Overview of uploaded student attendance and thesis details</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
              <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4 font-black w-16 text-center">#</th>
                    <th className="px-6 py-4 font-black">Student ID</th>
                    <th className="px-6 py-4 font-black">Student name</th>
                    <th className="px-6 py-4 font-black">Attendance</th>
                    <th className="px-6 py-4 font-black text-center">Thesis Status</th>
                    <th className="px-6 py-4 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
                  {paginatedStudents.map((s, idx) => {
                    const globalIdx = (activePage - 1) * itemsPerPage + idx;
                    const serialNo = String(globalIdx + 1).padStart(2, '0');
                    const hasThesis = s.documents && s.documents.thesisDocumentUrl;
                    return (
                      <tr key={s.id || s._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">{s.enrollmentNo || `STUD00${s.id}`}</td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-slate-800">{s.fullName}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {s.attendancePercentage !== undefined && s.attendancePercentage !== null ? `${s.attendancePercentage}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {hasThesis ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold bg-green-50 text-green-700 border border-green-100 shadow-sm">
                              {s.thesisApproved ? 'Approved' : 'Uploaded'}
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingDetails(s)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditDetails(s)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {hasThesis && (
                              <a
                                href={getDocUrl(s.documents.thesisDocumentUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer inline-flex"
                                title="Download Thesis File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDetails(s._id || s.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                              title="Delete Details"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                        No students available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION PANEL */}
          {students.length > 0 && (
            <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-600 pt-4 border-t border-slate-50 mt-4">
              <button 
                type="button" 
                disabled={activePage === 1}
                onClick={() => setActivePage(prev => Math.max(prev - 1, 1))} 
                className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActivePage(num)}
                  className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                    activePage === num 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button 
                type="button" 
                disabled={activePage === totalPages}
                onClick={() => setActivePage(prev => Math.min(prev + 1, totalPages))} 
                className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* DETAIL VIEW MODAL */}
      {viewingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col scale-in-center">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Student Academic Record</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Academic Portfolio</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingDetails(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 text-xs text-slate-600 text-left bg-slate-50/20">
              <div className="border border-slate-150 bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student ID</span>
                    <span className="text-slate-800 font-bold">{viewingDetails.enrollmentNo || `STUD00${viewingDetails.id}`}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Student Name</span>
                    <span className="text-slate-800 font-black">{viewingDetails.fullName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3.5">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Attendance Rate</span>
                      <span className="text-slate-800 font-bold">{viewingDetails.attendancePercentage !== undefined ? `${viewingDetails.attendancePercentage}%` : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Thesis Approval</span>
                      <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">{viewingDetails.thesisApproved ? 'Approved' : 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-3.5 space-y-1">
                  <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Thesis Document</span>
                  {viewingDetails.documents && viewingDetails.documents.thesisDocumentUrl ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-slate-700 font-bold truncate text-[11px]">{viewingDetails.documents.thesisDocumentUrl.split('/').pop()}</span>
                      </div>
                      <a
                        href={getDocUrl(viewingDetails.documents.thesisDocumentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-blue-600 transition-colors shadow-sm inline-flex"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-150 border-dashed">
                      No thesis uploaded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingDetails(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
