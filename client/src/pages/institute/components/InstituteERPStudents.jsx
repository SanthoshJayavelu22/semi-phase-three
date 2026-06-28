import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Eye, Pencil, X, User, Mail, Phone, BookOpen, Calendar, Shield, Award } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import InstituteStudentEditModal from './InstituteStudentEditModal';

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
  setActiveTab
}) => {
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);

  const getDocUrl = (url) => {
    if (!url) return '';
    return getUploadUrl(url);
  };

  const batchesList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.batchName || s.batch).filter(Boolean)));
  }, [students]);

  const coursesList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.courseName || s.course).filter(Boolean)));
  }, [students]);

  const filteredList = useMemo(() => {
    return students.filter(s => {
      const name = s.fullName || '';
      const email = s.email || '';
      const enroll = s.enrollmentNo || s.applicationId || '';
      const matchesSearch = name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                            enroll.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            email.toLowerCase().includes(studentSearch.toLowerCase());
      
      const currentStatus = s.status || 'Active';
      const matchesStatus = studentFilter === 'All' || currentStatus === studentFilter;
      
      const bName = s.batchName || s.batch || '';
      const matchesBatch = selectedStudentFilterBatch === 'All' || bName === selectedStudentFilterBatch;
      
      const cName = s.courseName || s.course || '';
      const matchesCourse = selectedStudentFilterCourse === 'All' || cName === selectedStudentFilterCourse;
      
      return matchesSearch && matchesStatus && matchesBatch && matchesCourse;
    });
  }, [students, studentSearch, studentFilter, selectedStudentFilterBatch, selectedStudentFilterCourse]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Total Students</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Institutional registry of enrolled fellows and application history</p>
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
              placeholder="Search Batches...."
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
              <span className="mr-1 text-[10px] uppercase font-black tracking-wider text-slate-400">Status:</span>
              {['All', 'Active', 'Completed'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStudentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider transition-all font-bold cursor-pointer ${
                    studentFilter === filter 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                  }`}
                >
                  {filter}
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
                <th className="px-6 py-4 font-black">Application ID</th>
                <th className="px-6 py-4 font-black">Student name</th>
                <th className="px-6 py-4 font-black">Course</th>
                <th className="px-6 py-4 font-black">Email</th>
                <th className="px-6 py-4 font-black text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-600">
              {filteredList.map((student, idx) => {
                const serialNo = String(idx + 1).padStart(2, '0');
                const batch = student.batchName || student.batch || 'Batch 2026-A';
                const appId = student.enrollmentNo || student.applicationId || `SEMI00${student.id}`;
                const name = student.fullName || 'Dr. Arjun Kumar';
                const course = student.courseName || student.course || 'General Medicine';
                const email = student.email || 'arjun@gmail.com';

                return (
                  <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">{serialNo}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{batch}</td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 tracking-tight">{appId}</td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-800">{name}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{course}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{email}</td>
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
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStudent(student.id)}
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
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedStudentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col scale-in-center">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Fellow Profile Dossier</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Accredited Candidate Record</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-left text-xs text-slate-600 max-h-[75vh] overflow-y-auto">
              {/* Header profile block */}
              <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-md border border-white">
                  {selectedStudentForView.fullName ? selectedStudentForView.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR'}
                </div>
                <div>
                  <span className="text-lg font-black text-slate-800 block leading-tight">{selectedStudentForView.fullName}</span>
                  <div className="flex gap-2 items-center mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold bg-green-50 text-green-700 border border-green-100">
                      {selectedStudentForView.status || 'Active'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ID: {selectedStudentForView.enrollmentNo || `SEMI00${selectedStudentForView.id}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid sections */}
              <div className="space-y-5">
                
                {/* 1. Academic & Course Assignment */}
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50 pb-1.5 mb-2.5">Academic & Program Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Assigned Course</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.courseName || 'General Medicine'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Academic Batch</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.batchName || 'Batch 2026-A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Admission Date</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.admissionDate}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Accredited Degree</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.qualification}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">MBBS Qualification</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.mbbsQualification || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Passing Year</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.graduationYear}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">University Name</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.universityName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Med Council Reg No</span>
                      <span className="text-slate-800 font-bold font-mono">{selectedStudentForView.medicalCouncilRegistrationNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Personal & Contact Details */}
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50 pb-1.5 mb-2.5">Contact & Registration Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Email Address</span>
                        <span className="text-slate-800 font-bold break-all">{selectedStudentForView.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Contact Number</span>
                        <span className="text-slate-800 font-bold">{selectedStudentForView.phone}</span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-start gap-2 border-t border-slate-50 pt-2.5">
                      <div>
                        <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Home Address</span>
                        <span className="text-slate-800 font-bold">{selectedStudentForView.homeAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Program Metrics & Financials */}
                <div>
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50 pb-1.5 mb-2.5">Internal Progress & Fee Remittance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Course Director</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.courseDirector || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">UTR Transaction No</span>
                      <span className="text-indigo-600 font-mono font-black">{selectedStudentForView.utrNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Foreign Graduate Status</span>
                      <span className="text-slate-800 font-bold">{selectedStudentForView.isForeignGraduate ? `Yes (FMGE: ${selectedStudentForView.fmgeClearanceStatus})` : 'No'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Attendance Percentage</span>
                      <span className={`font-extrabold ${(selectedStudentForView.attendancePercentage || 0) >= 75 ? 'text-slate-800' : 'text-rose-600'}`}>
                        {selectedStudentForView.attendancePercentage || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Thesis Review Status</span>
                      <span className={`font-bold ${selectedStudentForView.thesisApproved ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {selectedStudentForView.thesisApproved ? 'Approved by Board' : 'Evaluation Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wider">Academy Fee Status</span>
                      <span className={`font-bold ${selectedStudentForView.status === 'Completed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selectedStudentForView.status === 'Completed' ? 'Remitted' : 'Remittance Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Submitted Documents */}
                {selectedStudentForView.documents && Object.keys(selectedStudentForView.documents).length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-50 pb-1.5 mb-2.5">Uploaded Credentials Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
                      {selectedStudentForView.documents.passportPhotoUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.passportPhotoUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">📷</span>
                          <span className="truncate">Candidate Passport Photo</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.mbbsCertificateUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.mbbsCertificateUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">📄</span>
                          <span className="truncate">MBBS Degree Certificate</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.medicalCouncilRegistrationCertificateUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.medicalCouncilRegistrationCertificateUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">📜</span>
                          <span className="truncate">Medical Council Certificate</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.fmgeResultCopyUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.fmgeResultCopyUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">📝</span>
                          <span className="truncate">FMGE Screening Result Copy</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.paymentReceiptUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.paymentReceiptUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">💳</span>
                          <span className="truncate">Enrollment Payment Receipt</span>
                        </a>
                      )}
                      {selectedStudentForView.documents.semiMembershipFormUrl && (
                        <a 
                          href={getDocUrl(selectedStudentForView.documents.semiMembershipFormUrl)} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-colors"
                        >
                          <span className="text-lg">🗳️</span>
                          <span className="truncate">SEMI Membership Form</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedStudentForView(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
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
