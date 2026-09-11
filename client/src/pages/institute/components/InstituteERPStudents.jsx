import { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Eye, Pencil, X, User, Mail, Phone, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import academicService from '../../../api/academic';
import InstituteStudentEditModal from './InstituteStudentEditModal';
import Pagination from '../../../Components/Pagination';

const InstituteERPStudents = ({
  students,
  studentSearch,
  setStudentSearch,
  studentFilter,
  setStudentFilter,
  selectedStudentFilterBatch,
  setSelectedStudentFilterBatch,
  selectedStudentFilterCourse,
  setSelectedStudentFilterCourse,
  removeStudent,
  onUpdateStudent,
  courses,
  batches,
  setActiveTab,
  fetchERPData
}) => {
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Course completion certificates quick-upload (NBLS / NCLS / NTLS / NULS)
  const [certFiles, setCertFiles] = useState({});
  const [certUploading, setCertUploading] = useState(false);
  const [certSuccess, setCertSuccess] = useState('');
  const [certError, setCertError] = useState('');

  const CERT_FIELDS = [
    { key: 'nblsCertificate', label: 'NBLS (Basic Life Support)', icon: '🩺' },
    { key: 'nclsCertificate', label: 'NCLS (Comprehensive Life Support)', icon: '❤️' },
    { key: 'ntlsCertificate', label: 'NTLS (Trauma Life Support)', icon: '🩹' },
    { key: 'nulsCertificate', label: 'NULS (Ultrasound Life Support)', icon: '📡' },
  ];

  const selectCertFile = (field, file) => {
    setCertError('');
    setCertSuccess('');
    if (file && file.size > 10 * 1024 * 1024) {
      setCertError('File is too large. Maximum size is 10MB.');
      return;
    }
    setCertFiles(prev => ({ ...prev, [field]: file || null }));
  };

  const uploadCertificates = async () => {
    const selected = Object.entries(certFiles).filter(([, f]) => f instanceof File);
    if (selected.length === 0) {
      setCertError('Select at least one certificate file to upload.');
      return;
    }
    if (!selectedStudentForView) return;
    setCertUploading(true);
    setCertError('');
    setCertSuccess('');
    try {
      const formData = new FormData();
      selected.forEach(([k, v]) => formData.append(k, v));
      const res = await academicService.uploadCourseCertificates(
        selectedStudentForView._id || selectedStudentForView.id,
        formData
      );
      const data = res?.data?.data || res?.data || {};
      const newDocs = { ...(selectedStudentForView.documents || {}), ...(data.documents || {}) };
      setSelectedStudentForView(prev => (prev ? { ...prev, documents: newDocs } : prev));
      setCertFiles({});
      if (fetchERPData) await fetchERPData();
      const hasLinked = newDocs.nblsCertificateUrl || newDocs.nclsCertificateUrl || newDocs.ntlsCertificateUrl || newDocs.nulsCertificateUrl;
      setCertSuccess(hasLinked
        ? 'Certificates uploaded and linked to this fellow. Exam eligibility certificate requirement is now satisfied.'
        : 'Certificates uploaded successfully.');
    } catch (err) {
      setCertError(err?.parsedMessage || err?.message || 'Failed to upload certificates. Please try again.');
    } finally {
      setCertUploading(false);
    }
  };

  const getDocUrl = (url) => {
    if (!url) return '';
    return getUploadUrl(url);
  };

  const batchesList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.batchName || (typeof s.batch === 'string' ? s.batch : (s.batch?.name || (s.batch?.year ? `Batch ${s.batch.year}` : '')))).filter(Boolean)));
  }, [students]);

  const coursesList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.courseName || (typeof s.course === 'string' ? s.course : (s.course?.name || s.course?.courseName || ''))).filter(Boolean)));
  }, [students]);

  const filteredList = useMemo(() => {
    return students.filter(s => {
      const name = s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      const email = s.email || '';
      const enroll = s.enrollmentNo || s.applicationId || s.enrollmentId || '';
      const regNo = s.medicalCouncilRegistrationNumber || '';
      const matchesSearch = name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                            enroll.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            email.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            regNo.toLowerCase().includes(studentSearch.toLowerCase());
      
      const vStatus = s.verificationStatus || 'Pending Verification';
      const matchesStatus = studentFilter === 'All' || 
        (studentFilter === 'Approved' && vStatus === 'Approved') ||
        (studentFilter === 'Pending' && vStatus === 'Pending Verification') ||
        (studentFilter === 'Correction' && vStatus === 'Correction Required') ||
        (studentFilter === 'Rejected' && vStatus === 'Rejected') ||
        s.status === studentFilter;
      
      const bName = s.batchName || (typeof s.batch === 'string' ? s.batch : (s.batch?.name || (s.batch?.year ? `Batch ${s.batch.year}` : ''))) || '';
      const matchesBatch = selectedStudentFilterBatch === 'All' || bName === selectedStudentFilterBatch || String(s.batchId || s.batch?._id) === String(selectedStudentFilterBatch);
      
      const cName = s.courseName || (typeof s.course === 'string' ? s.course : (s.course?.name || s.course?.courseName || '')) || '';
      const matchesCourse = selectedStudentFilterCourse === 'All' || cName === selectedStudentFilterCourse || String(s.courseId || s.course?._id) === String(selectedStudentFilterCourse);
      
      return matchesSearch && matchesStatus && matchesBatch && matchesCourse;
    });
  }, [students, studentSearch, studentFilter, selectedStudentFilterBatch, selectedStudentFilterCourse]);

  // Count candidates needing correction
  const correctionCount = useMemo(() => {
    return students.filter(s => s.verificationStatus === 'Correction Required').length;
  }, [students]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [studentSearch, studentFilter, selectedStudentFilterBatch, selectedStudentFilterCourse]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredList, currentPage]);

  const getVerificationBadge = (vStatus) => {
    switch (vStatus) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Approved
          </span>
        );
      case 'Correction Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
            ↻ Correction
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            ✕ Rejected
          </span>
        );
      case 'Pending Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            ⏳ Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left font-sans">
      {/* Correction Required Alert Banner */}
      {correctionCount > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-purple-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                Action Required: {correctionCount} Candidate Enrollment(s) Need Correction
              </h4>
              <p className="text-xs text-purple-700 mt-0.5">
                The Academic Department requested corrections for document or candidate details. Click on the candidate's edit icon to view remarks and resubmit.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStudentFilter('Correction')}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            View Flagged Students
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Total Students</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Institutional registry of enrolled fellows, verification status, and academic history</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('enrollment');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Enroll New Student
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col xl:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email, reg no..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Batch:</span>
              <select
                value={selectedStudentFilterBatch}
                onChange={(e) => setSelectedStudentFilterBatch(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 font-bold cursor-pointer text-xs"
              >
                <option value="All">All Batches</option>
                {batchesList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Course:</span>
              <select
                value={selectedStudentFilterCourse}
                onChange={(e) => setSelectedStudentFilterCourse(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 font-bold cursor-pointer text-xs max-w-[150px] truncate"
              >
                <option value="All">All Courses</option>
                {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] uppercase font-black tracking-wider text-slate-400">Verification:</span>
              {[
                { id: 'All', label: 'All' },
                { id: 'Pending', label: 'Pending' },
                { id: 'Approved', label: 'Approved' },
                { id: 'Correction', label: 'Correction' },
                { id: 'Rejected', label: 'Rejected' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStudentFilter(filter.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider transition-all font-bold cursor-pointer ${
                    studentFilter === filter.id 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Database Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-inner">
          <table className="w-full text-left border-collapse text-xs text-slate-500 font-semibold">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-6 py-4 font-black w-16 text-center">#</th>
                <th className="px-6 py-4 font-black">Batch</th>
                <th className="px-6 py-4 font-black">Enrollment ID</th>
                <th className="px-6 py-4 font-black">Student Name</th>
                <th className="px-6 py-4 font-black">Course</th>
                <th className="px-6 py-4 font-black">Verification Status</th>
                <th className="px-6 py-4 font-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
              {paginatedList.map((student, idx) => {
                const serialNo = String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0');
                const batch = student.batchName || student.batch || 'Batch 2026-A';
                const appId = student.enrollmentNo || student.applicationId || student.enrollmentId || `SEMI00${student.id || idx}`;
                const name = student.fullName || 'Dr. Arjun Kumar';
                const course = student.courseName || student.course || 'General Medicine';
                const studentId = student._id || student.id;
                const vStatus = student.verificationStatus || 'Pending Verification';

                return (
                  <tr key={studentId || idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{batch}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 tracking-tight">{appId}</td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-800 block">{name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{student.email}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{course}</td>
                    <td className="px-6 py-4">
                      <div>
                        {getVerificationBadge(vStatus)}
                        {student.verificationRemarks && (
                          <p className="text-[10px] text-slate-500 mt-1 truncate max-w-xs italic" title={student.verificationRemarks}>
                            "{student.verificationRemarks}"
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForView(student)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForEdit(student)}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            vStatus === 'Correction Required'
                              ? 'text-purple-600 bg-purple-50 hover:bg-purple-100 font-bold'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                          title={vStatus === 'Correction Required' ? 'Correction Requested - Edit & Resubmit' : 'Edit Profile'}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStudent(studentId)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="De-enroll fellow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    No enrolled fellows registered in the system matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredList.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedStudentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col scale-in-center max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Fellow Profile Dossier</h3>
                  <p className="text-xs font-bold text-slate-400 tracking-wide uppercase">Accredited Candidate Record</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-7 text-left text-sm text-slate-600 overflow-y-auto">
              {/* Header profile block */}
              <div className="flex items-center gap-5 border-b border-slate-100 pb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20 border-2 border-white">
                  {selectedStudentForView.fullName ? selectedStudentForView.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR'}
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 block leading-tight">{selectedStudentForView.fullName}</span>
                  <div className="flex flex-wrap gap-2.5 items-center mt-2">
                    {getVerificationBadge(selectedStudentForView.verificationStatus || 'Pending Verification')}
                    <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
                      {selectedStudentForView.status || 'Active'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 font-mono tracking-tight">
                      ID: {selectedStudentForView.enrollmentNo || selectedStudentForView.enrollmentId || `SEMI00${selectedStudentForView.id}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Audit Alert if Remarks Present */}
              {selectedStudentForView.verificationRemarks && (
                <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                  selectedStudentForView.verificationStatus === 'Correction Required'
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : selectedStudentForView.verificationStatus === 'Rejected'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <span className="text-lg">📢</span>
                  <div>
                    <strong className="font-black block uppercase tracking-wider text-[10px]">
                      Academic Department Verification Note:
                    </strong>
                    <p className="mt-1 font-medium">{selectedStudentForView.verificationRemarks}</p>
                  </div>
                </div>
              )}

              {/* Grid sections */}
              <div className="space-y-7">
                {/* 1. Academic & Course Assignment */}
                <div>
                  <h4 className="text-xs uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4">
                    Academic & Program Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Assigned Course</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.courseName || 'General Medicine'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Academic Batch</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.batchName || 'Batch 2026-A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Admission Date</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.admissionDate}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Accredited Degree</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.qualification}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">MBBS Qualification</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.mbbsQualification || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Passing Year</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.graduationYear}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">University Name</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.universityName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Med Council Reg No</span>
                      <span className="text-slate-900 font-black font-mono text-sm">{selectedStudentForView.medicalCouncilRegistrationNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Personal & Contact Details */}
                <div>
                  <h4 className="text-xs uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4">Contact & Registration Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6">
                    <div className="flex items-center gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                      <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                        <span className="text-slate-900 font-extrabold text-sm break-all">{selectedStudentForView.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                      <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Contact Number</span>
                        <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.phone}</span>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-start gap-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Home Address</span>
                        <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.homeAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Program Metrics & Financials */}
                <div>
                  <h4 className="text-xs uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4">Internal Progress & Fee Remittance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6">
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Course Director</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.courseDirector || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Razorpay Payment ID</span>
                      <span className="text-blue-600 font-mono font-black text-sm">{selectedStudentForView.razorpayPaymentId || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Foreign Graduate Status</span>
                      <span className="text-slate-900 font-extrabold text-sm">{selectedStudentForView.isForeignGraduate ? `Yes (FMGE: ${selectedStudentForView.fmgeClearanceStatus})` : 'No'}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Attendance Percentage</span>
                      <span className={`text-sm font-black ${(selectedStudentForView.attendancePercentage || 0) >= 75 ? 'text-slate-900' : 'text-rose-600'}`}>
                        {selectedStudentForView.attendancePercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Thesis Review Status</span>
                      <span className={`text-sm font-extrabold ${selectedStudentForView.thesisApproved ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {selectedStudentForView.thesisApproved ? 'Approved by Board' : 'Evaluation Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Student Fee Status</span>
                      <span className={`text-sm font-black ${selectedStudentForView.razorpayPaymentId || selectedStudentForView.status === 'Completed' || selectedStudentForView.remittedToAcademy ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedStudentForView.razorpayPaymentId || selectedStudentForView.status === 'Completed' || selectedStudentForView.remittedToAcademy ? 'Paid & Enrolled' : 'Payment Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Submitted Documents */}
                {selectedStudentForView.documents && Object.keys(selectedStudentForView.documents).length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-4">Uploaded Credentials Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold">
                      {selectedStudentForView.documents.passportPhotoUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.passportPhotoUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">📷</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">Candidate Passport Photo</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.mbbsCertificateUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.mbbsCertificateUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">📄</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">MBBS Degree Certificate</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.medicalCouncilRegistrationCertificateUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.medicalCouncilRegistrationCertificateUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">📜</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">Medical Council Certificate</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.fmgeResultCopyUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.fmgeResultCopyUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">📝</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">FMGE Screening Result Copy</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.semiMembershipFormUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.semiMembershipFormUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">🗳️</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">SEMI Membership Form</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.studentSignatureUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.studentSignatureUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">✍️</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">Student Signature</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.hodSignatureUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.hodSignatureUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 hover:border-blue-300 rounded-2xl transition-all group"
                        >
                          <span className="text-xl">🎓</span>
                          <span className="truncate text-slate-700 group-hover:text-blue-700">PG Degree Certificate / HOD Confirmation</span>
                        </a>
                      )}
                    </div>

                    {/* Mandatory Pre-Exam Course Completion Certificates */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase font-black tracking-widest text-slate-400">
                          Course Completion Certificates (NBLS / NCLS / NTLS / NULS)
                        </span>
                        {(selectedStudentForView.documents?.nblsCertificateUrl ||
                          selectedStudentForView.documents?.nclsCertificateUrl ||
                          selectedStudentForView.documents?.ntlsCertificateUrl ||
                          selectedStudentForView.documents?.nulsCertificateUrl) ? (
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            ✓ Exam Eligible (Certificate Attached)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            ⚠️ Min 1 Certificate Required for Exam
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-bold">
                        {[
                          { key: 'nblsCertificateUrl', label: 'NBLS (Basic Life Support)', icon: '🩺' },
                          { key: 'nclsCertificateUrl', label: 'NCLS (Comprehensive Life Support)', icon: '❤️' },
                          { key: 'ntlsCertificateUrl', label: 'NTLS (Trauma Life Support)', icon: '🩹' },
                          { key: 'nulsCertificateUrl', label: 'NULS (Ultrasound Life Support)', icon: '📡' },
                        ].map(cert => {
                          const url = selectedStudentForView.documents?.[cert.key];
                          return url ? (
                            <a
                              key={cert.key}
                              href={getDocUrl(url)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 p-3 bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-200/80 rounded-2xl transition-all group"
                            >
                              <span className="text-lg">{cert.icon}</span>
                              <div className="min-w-0 flex-1">
                                <span className="truncate block text-slate-800 group-hover:text-emerald-800 text-xs font-extrabold">{cert.label}</span>
                                <span className="text-[10px] text-emerald-600 font-bold">Verified & Linked</span>
                              </div>
                            </a>
                          ) : (
                            <div
                              key={cert.key}
                              className="flex items-center gap-3 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl opacity-75"
                            >
                              <span className="text-lg">{cert.icon}</span>
                              <div className="min-w-0 flex-1">
                                <span className="truncate block text-slate-500 text-xs font-bold">{cert.label}</span>
                                <span className="text-[10px] text-rose-500 font-bold">Missing - Upload Required</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick upload for course completion certificates */}
                      <div className="mt-5 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-indigo-500" />
                          <span className="text-[11px] uppercase font-black tracking-widest text-indigo-700">
                            Upload Course Completion Certificates
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {CERT_FIELDS.map(cert => {
                            const alreadyUploaded = !!selectedStudentForView.documents?.[`${cert.key}Url`];
                            return (
                              <label
                                key={cert.key}
                                className={`flex items-center gap-2.5 px-3 py-2.5 bg-white border rounded-xl transition-all cursor-pointer ${
                                  alreadyUploaded
                                    ? 'border-emerald-200 hover:border-emerald-400'
                                    : 'border-dashed border-slate-300 hover:border-indigo-400'
                                }`}
                              >
                                <span className="text-lg">{cert.icon}</span>
                                <div className="min-w-0 flex-1">
                                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-600 truncate">{cert.label}</span>
                                  <span className={`block text-[10px] font-bold ${alreadyUploaded ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {alreadyUploaded
                                      ? '✓ Linked'
                                      : certFiles[cert.key] ? `Selected: ${certFiles[cert.key].name}` : 'Choose file to upload'}
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                  className="hidden"
                                  disabled={certUploading}
                                  onChange={(e) => {
                                    selectCertFile(cert.key, e.target.files[0] || null);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>

                        {certError && (
                          <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{certError}</span>
                          </div>
                        )}
                        {certSuccess && (
                          <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{certSuccess}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2.5">
                          <span className="text-[10px] text-slate-400 font-semibold mr-auto">
                            At least 1 certificate required for exam eligibility.
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForEdit(selectedStudentForView)}
                            className="px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                          >
                            Open Full Edit
                          </button>
                          <button
                            type="button"
                            onClick={uploadCertificates}
                            disabled={certUploading}
                            className="px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {certUploading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-3.5 h-3.5" />
                                Upload Selected
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/70">
              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT EDIT MODAL */}
      <InstituteStudentEditModal
        isOpen={!!selectedStudentForEdit}
        student={selectedStudentForEdit}
        onClose={() => setSelectedStudentForEdit(null)}
        onSave={onUpdateStudent}
        courses={courses}
        batches={batches}
      />
    </div>
  );
};

export default InstituteERPStudents;