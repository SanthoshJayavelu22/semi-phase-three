import { Eye, CheckCircle2, ShieldCheck, X, FileCheck, Building2, MapPin, Contact2, GraduationCap, AlertCircle, FileText } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const AcademyInspectorModal = ({
  selectedApp,
  setSelectedApp,
  auditDocs,
  setShowRejectModal,
  handleApprove
}) => {
  const getDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const filename = url.replace(/\\/g, '/').split('/').pop();
    return getUploadUrl(filename);
  };
  
  const InfoCard = ({ icon: Icon, title, children }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <h4 className="text-xs uppercase font-bold text-indigo-900/60 tracking-wider flex items-center gap-2 border-b border-slate-100/80 pb-3">
        <Icon className="w-4 h-4 text-indigo-400" />
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm font-medium text-slate-700 relative z-10">
        {children}
      </div>
    </div>
  );

  const StatBox = ({ label, value, isCompliant }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
      <div>
        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{label}</span>
        <span className="text-base font-black text-slate-800 mt-0.5 block">
          {value}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        {isCompliant ? (
          <span className="flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
            <CheckCircle2 className="w-3 h-3" /> Compliant
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100/50">
            <AlertCircle className="w-3 h-3" /> Non-Compliant
          </span>
        )}
      </div>
    </div>
  );

  const DetailField = ({ label, value, colSpan = 1, isLink = false }) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">{label}</span>
      {isLink && value && value !== 'N/A' ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold flex items-center gap-1 w-fit">
          {value}
        </a>
      ) : (
        <span className={`block ${value === 'N/A' ? 'text-slate-400 italic' : 'text-slate-800'}`}>{value}</span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#f4f7f9] rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 text-left">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-8 py-6 text-white flex justify-between items-start flex-shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex gap-5 items-center">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-400/30 shadow-inner backdrop-blur-sm">
              <ShieldCheck className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">
                  Compliance Audit & Inspector
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">ID: {selectedApp.id}</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{selectedApp.orgName}</h3>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-indigo-200/80 font-medium">
                <span className="flex items-center gap-1.5"><Contact2 className="w-3.5 h-3.5" /> {selectedApp.email}</span>
                <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {selectedApp.form?.instituteAddress || 'Address Not Provided'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedApp(null)}
            className="relative z-10 p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all duration-200 border border-white/10 group"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Modal Scrollable Content split panel */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
          
          {/* Left Column: Compliance checks & General specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Compliance Quick Stats */}
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs uppercase font-black text-slate-500 tracking-widest">Compliance Checks</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatBox 
                  label="Emergency Beds" 
                  value={`${selectedApp.form?.bedCount || selectedApp.bedCount} Beds`}
                  isCompliant={parseInt(selectedApp.form?.bedCount || selectedApp.bedCount, 10) >= 10}
                />
                <StatBox 
                  label="Physician Exp" 
                  value={`${selectedApp.form?.physicianExperience || selectedApp.experience} Months`}
                  isCompliant={parseInt(selectedApp.form?.physicianExperience || selectedApp.experience, 10) >= 24}
                />
                <StatBox 
                  label="EM Faculty" 
                  value={`${selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount} Instructors`}
                  isCompliant={parseInt(selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount, 10) >= 1}
                />
                <StatBox 
                  label="Classroom / Teaching Space" 
                  value={(selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' || (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes (Mandatory)' ? 'Available' : 'Unavailable'}
                  isCompliant={(selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' || (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes (Mandatory)'}
                />
              </div>
            </div>

            <InfoCard icon={Building2} title="1. Institutional Profile">
              <DetailField label="Organization Name" value={selectedApp.orgName} />
              <DetailField label="Constitution Type" value={selectedApp.form?.constitutionType || 'N/A'} />
              <DetailField label="Institutional Address" value={selectedApp.form?.instituteAddress || 'N/A'} colSpan={2} />
              <DetailField label="Registered Office Address" value={selectedApp.form?.registeredOfficeAddress || 'N/A'} colSpan={2} />
              <DetailField label="Institutional Website" value={selectedApp.form?.website} colSpan={2} isLink={true} />
            </InfoCard>

            <InfoCard icon={Contact2} title="2. Contact Registry">
              <DetailField label="Primary Account Email" value={selectedApp.email} />
              <DetailField label="Application Contact Email" value={selectedApp.form?.emailAddress || 'N/A'} />
              <DetailField label="Office Phone" value={selectedApp.form?.officePhone || 'N/A'} />
              <DetailField label="Mobile Phone" value={selectedApp.form?.phoneNumber || 'N/A'} />
            </InfoCard>

            <InfoCard icon={GraduationCap} title="3. Executive Leadership & Representation">
              <DetailField label="Head of College / Institute" value={selectedApp.form?.headName || 'N/A'} />
              <DetailField label="Head Designation" value={selectedApp.form?.headDesignation || 'N/A'} />
              <DetailField label="HOD (Emergency Medicine)" value={selectedApp.form?.hodName || 'N/A'} />
              <DetailField label="Authorized Representative" value={`${selectedApp.form?.authorizedRepName || 'N/A'} (${selectedApp.form?.authorizedRepDesignation || 'N/A'})`} />
            </InfoCard>

            <InfoCard icon={FileCheck} title="4. Academic Intake & Specifications">
              <DetailField label="Proposed Commencement" value={selectedApp.form?.commencementDate ? new Date(selectedApp.form.commencementDate).toLocaleDateString() : 'N/A'} />
              <DetailField label="Seats Requested" value={`${selectedApp.form?.seatsRequested || 'N/A'} Seats`} />
              <DetailField label="NABH Accreditation Status" value={(selectedApp.form?.nabhStatus || 'Yes') === 'Yes' ? 'Accredited' : 'Non-Accredited'} />
              <DetailField label="Course Director EM Qualified" value={selectedApp.form?.courseDirectorEMQualified || 'Yes'} />
            </InfoCard>
            
            {selectedApp.rejectionReason && (
              <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-2xl p-5 shadow-sm mt-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-rose-600 mb-2 tracking-widest">
                  <AlertCircle className="w-3.5 h-3.5" /> Logged Rejection Reason
                </span>
                <p className="text-sm font-medium text-slate-700 italic pl-1 border-l-2 border-rose-200">
                  "{selectedApp.rejectionReason}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Documents (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Uploaded Documents */}
            <div className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-[1.5rem] p-6 shadow-xl shadow-slate-200/20 sticky top-0">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Certified Upload Inspections</h4>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">9 Mandatory Documents</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {auditDocs.map((key) => {
                  const titles = {
                    equipmentList: 'Equipment Register PDF',
                    facultyList: 'Faculty bio-data PDF',
                    emergencyOPDStatistics: 'OPD Clinical Audit PDF',
                    libraryBookList: 'Library book register PDF',
                    trainingMannequinList: 'Resuscitation inventory PDF',
                    diagnosticEquipmentList: 'Imaging diagnostics PDF',
                    declarationLetter: 'Signed Declaration PDF',
                    inspectionPaymentReceipt: 'Inspection Payment Receipt PDF',
                    facultyCommitmentLetter: 'Faculty Commitment Letter PDF'
                  };
                  const fileData = selectedApp.uploadedDocs?.[key];
                  const docUrl = getDocUrl(fileData?.url || selectedApp.form?.documents?.[key + 'Url'] || selectedApp.form?.documents?.[key] || selectedApp.form?.[key + 'Url'] || selectedApp.form?.[key]);
                  
                  return (
                    <div key={key} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${docUrl ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {docUrl ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-slate-700 truncate text-xs group-hover:text-slate-900 transition-colors">
                          {titles[key] || key}
                        </span>
                      </div>
                      
                      {docUrl ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all shadow-sm flex-shrink-0"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-md flex-shrink-0">
                          Missing
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedApp.paymentComplete && selectedApp.paymentDetails && (
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[1.5rem] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3"></div>
                
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">Payment Verified</h4>
                    <p className="text-[10px] uppercase font-semibold text-emerald-100 tracking-wider mt-0.5">Fully Paid</p>
                  </div>
                </div>
                
                <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 relative z-10 text-xs text-emerald-50 leading-relaxed font-medium">
                  Inspection fee payment captured: transaction reference <span className="font-black text-white bg-black/10 px-1.5 py-0.5 rounded">{selectedApp.paymentDetails.transactionId}</span> for amount <span className="font-black text-white bg-black/10 px-1.5 py-0.5 rounded">{selectedApp.paymentDetails.amount}</span> completed on {selectedApp.paymentDetails.date}.
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Modal Bottom Actions bar */}
        {selectedApp.status === 'pending_review' && (
          <div className="bg-white/80 backdrop-blur-md px-8 py-5 border-t border-slate-200/80 flex justify-end items-center flex-shrink-0">
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Reject & Log Reason
              </button>
              <button
                onClick={handleApprove}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_8px_16px_-6px_rgba(16,185,129,0.4)] hover:shadow-[0_12px_20px_-6px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Approve Institution
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademyInspectorModal;

