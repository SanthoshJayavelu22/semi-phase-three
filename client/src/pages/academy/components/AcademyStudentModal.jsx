import React from 'react';
import { User, Mail, Phone, School, Award, FileText, CheckCircle, XCircle, ExternalLink, Calendar, BookOpen, UserCheck, ShieldAlert } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const AcademyStudentModal = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  // Helper to safely format document URLs
  const getDocUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const filename = url.replace(/\\/g, '/').split('/').pop();
    return getUploadUrl(filename);
  };

  const docs = student.documents || {};

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-250 text-left my-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              Candidate Dossier & Credentials
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Reviewing registered profile of {student.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs font-bold text-slate-800">
          
          {/* Main info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* General Info Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <User className="w-3.5 h-3.5 text-blue-600" /> General & Contact Details
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Full Name</span>
                  <span className="text-slate-900 text-sm font-black">{student.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Enrollment ID</span>
                    <span className="font-mono text-slate-700">{student.enrollmentNo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Mobile Number</span>
                    <span className="text-slate-700">{student.mobile || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Email Address</span>
                  <span className="text-slate-700 font-mono">{student.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Assigned Institution</span>
                  <span className="text-slate-900">{student.institute}</span>
                </div>
              </div>
            </div>

            {/* Academic Placement Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Academic & Program Data
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Program Course</span>
                    <span className="text-slate-900">{student.course}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Batch Group</span>
                    <span className="text-slate-900">{student.batch}</span>
                  </div>
                </div>
                <div>
  <span className="text-[10px] text-slate-400 font-medium block">FMGE Clearance</span>
  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black ${
    student.fmgeClearanceStatus === 'Cleared' ? 'bg-emerald-100 text-emerald-800' : 
    student.fmgeClearanceStatus === 'Failed' ? 'bg-rose-100 text-rose-800' : 
    'bg-slate-200 text-slate-700'
  }`}>
    {student.fmgeClearanceStatus || 'Not Applicable'}
  </span>
</div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Course Director</span>
                  <span className="text-slate-700">{student.courseDirector || 'N/A'}</span>
                </div>
              <div>
  <span className="text-[10px] text-slate-400 font-medium block">Home Address</span>
  <span className="text-slate-600 font-medium leading-relaxed block">{student.homeAddress || student.address || 'N/A'}</span>
</div>
              </div>
            </div>

          </div>

          {/* Academic Background Details */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <Award className="w-3.5 h-3.5 text-blue-600" /> Medical Qualification & Council Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Prior Qualification</span>
                <span className="text-slate-900">{student.qualification || 'MBBS'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">MBBS Degree</span>
                <span className="text-slate-900">{student.mbbsQualification || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Year of Passing</span>
                <span className="text-slate-900">{student.yearOfPassing || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-medium block">University Board Name</span>
                <span className="text-slate-900">{student.universityName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Council Registration No</span>
                <span className="font-mono text-slate-700">{student.medicalCouncilRegistrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Foreign Graduate</span>
                <span className={`inline-flex px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-black ${student.isForeignGraduate ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                  {student.isForeignGraduate ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">FMGE Clearance Status</span>
                <span className="text-slate-900">{student.fmgeClearanceStatus || 'Not Applicable'}</span>
              </div>
            </div>
          </div>

          {/* Verification Metrics & Remittance */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Evaluation & Remittance Checkpoint
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Remittance status</span>
                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] uppercase tracking-wider ${student.remittedToAcademy ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {student.remittedToAcademy ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Paid</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Pending</>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Remittance UTR No</span>
                <span className="font-mono text-slate-700">{student.utrNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Attendance Tracker</span>
                <span className={`text-xs ${student.attendancePercentage >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {student.attendancePercentage}% (Min 75%)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Thesis Status</span>
                <span className={`inline-flex items-center gap-1 mt-1 text-[9px] uppercase tracking-wider ${student.thesisApproved ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {student.thesisApproved ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Approved</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Pending</>
                  )}
                </span>
              </div>
            </div>
            {student.eligibilityStatus === 'Rejected' && (
              <div className="mt-2.5 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[10px] font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="block font-black uppercase text-[8px] tracking-wide text-rose-500">Eligibility Flag Out</span>
                  {student.rejectionReason}
                </div>
              </div>
            )}
          </div>

          {/* Documents Grid */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Digital Artifacts & Uploaded Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {docs.passportPhotoUrl && (
                <a
                  href={getDocUrl(docs.passportPhotoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">Passport Size Photograph</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {docs.mbbsCertificateUrl && (
                <a
                  href={getDocUrl(docs.mbbsCertificateUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">MBBS Degree Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {docs.medicalCouncilRegistrationCertificateUrl && (
                <a
                  href={getDocUrl(docs.medicalCouncilRegistrationCertificateUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">Council Registration Certificate</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {docs.fmgeResultCopyUrl && student.isForeignGraduate && (
                <a
                  href={getDocUrl(docs.fmgeResultCopyUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">FMGE Pass Certificate Copy</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {docs.paymentReceiptUrl && (
                <a
                  href={getDocUrl(docs.paymentReceiptUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">Remittance Payment Receipt</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {docs.semiMembershipFormUrl && (
                <a
                  href={getDocUrl(docs.semiMembershipFormUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-150 hover:border-blue-300 hover:bg-blue-50/20 rounded-xl transition-all group"
                >
                  <span className="font-bold text-slate-700 text-[11px] block truncate">Signed Membership Form</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-55 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};

export default AcademyStudentModal;
