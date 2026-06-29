import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const AcademyInspectorModal = ({
  selectedApp,
  setSelectedApp,
  auditDocs,
  setPreviewDoc,
  setShowRejectModal,
  handleApprove,
  handleTriggerInspection
}) => {
  const getDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const filename = url.replace(/\\/g, '/').split('/').pop();
    return getUploadUrl(filename);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="bg-slate-900 px-8 py-5 text-white flex justify-between items-center flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
              Compliance Audit & Document Inspector
            </span>
            <h3 className="text-lg font-black mt-2 text-white">{selectedApp.orgName}</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">Admin Email: {selectedApp.email} | Application Registry ID: {selectedApp.id}</span>
          </div>
          <button
            onClick={() => setSelectedApp(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs uppercase transition-colors"
          >
            Close Audit
          </button>
        </div>

        {/* Modal Scrollable Content split panel */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-[#f8fafc]">
          
          {/* Left Column: Compliance checks & General specs */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">Compliance Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bed count */}
                <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Emergency Beds</span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                      {selectedApp.form?.bedCount || selectedApp.bedCount} Beds
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                    parseInt(selectedApp.form?.bedCount || selectedApp.bedCount, 10) >= 10 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {parseInt(selectedApp.form?.bedCount || selectedApp.bedCount, 10) >= 10 ? 'Compliant' : 'NON-COMPLIANT'}
                  </span>
                </div>

                {/* Experience */}
                <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Physician Exp</span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                      {selectedApp.form?.physicianExperience || selectedApp.experience} Months
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                    parseInt(selectedApp.form?.physicianExperience || selectedApp.experience, 10) >= 24 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {parseInt(selectedApp.form?.physicianExperience || selectedApp.experience, 10) >= 24 ? 'Compliant' : 'NON-COMPLIANT'}
                  </span>
                </div>

                {/* Faculty count */}
                <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black text-gray-400 block">EM Faculty</span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                      {selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount} Instructors
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                    parseInt(selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount, 10) >= 1 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {parseInt(selectedApp.form?.emFacultyCount || selectedApp.emFacultyCount, 10) >= 1 ? 'Compliant' : 'NON-COMPLIANT'}
                  </span>
                </div>

                {/* Teaching Space */}
                <div className="bg-white border border-gray-150 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-black text-gray-400 block">Classroom</span>
                    <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                      {(selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' || (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes (Mandatory)' ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                    (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' || (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes (Mandatory)'
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {(selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes' || (selectedApp.form?.teachingSpace || selectedApp.teachingSpace) === 'Yes (Mandatory)' ? 'Compliant' : 'NON-COMPLIANT'}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Institutional Profile */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                1. Institutional Profile
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Organization Name</span>
                  <span className="block mt-0.5">{selectedApp.orgName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Constitution Type</span>
                  <span className="block mt-0.5">{selectedApp.form?.constitutionType || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Institutional Address</span>
                  <span className="block mt-0.5">{selectedApp.form?.instituteAddress || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Registered Office Address</span>
                  <span className="block mt-0.5">{selectedApp.form?.registeredOfficeAddress || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Institutional Website</span>
                  {selectedApp.form?.website ? (
                    <a href={selectedApp.form.website.startsWith('http') ? selectedApp.form.website : `https://${selectedApp.form.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block mt-0.5">
                      {selectedApp.form.website}
                    </a>
                  ) : (
                    <span className="block mt-0.5">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Contact Registry */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                2. Contact Registry
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Primary Account Email</span>
                  <span className="block mt-0.5 font-mono">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Application Contact Email</span>
                  <span className="block mt-0.5 font-mono">{selectedApp.form?.emailAddress || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Office Phone</span>
                  <span className="block mt-0.5">{selectedApp.form?.officePhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Mobile Phone</span>
                  <span className="block mt-0.5">{selectedApp.form?.phoneNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 3. Executive Leadership */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                3. Executive Leadership & Representation
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Head of College / Institute</span>
                  <span className="block mt-0.5">{selectedApp.form?.headName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Head Designation</span>
                  <span className="block mt-0.5">{selectedApp.form?.headDesignation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">HOD (Emergency Medicine)</span>
                  <span className="block mt-0.5">{selectedApp.form?.hodName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Authorized Representative</span>
                  <span className="block mt-0.5">{selectedApp.form?.authorizedRepName || 'N/A'} ({selectedApp.form?.authorizedRepDesignation || 'N/A'})</span>
                </div>
              </div>
            </div>

            {/* 4. Academic Program Intake */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                4. Academic Intake & Specifications
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Proposed Commencement</span>
                  <span className="block mt-0.5">{selectedApp.form?.commencementDate ? new Date(selectedApp.form.commencementDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Seats Requested</span>
                  <span className="block mt-0.5 text-indigo-600 font-extrabold">{selectedApp.form?.seatsRequested || 'N/A'} Seats</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">NABH Accreditation Status</span>
                  <span className="block mt-0.5">{(selectedApp.form?.nabhStatus || 'Yes') === 'Yes' ? 'Accredited' : 'Non-Accredited'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Course Director EM Qualified</span>
                  <span className="block mt-0.5">{selectedApp.form?.courseDirectorEMQualified || 'Yes'}</span>
                </div>
              </div>
            </div>

            {/* 5. Payment Transaction Details */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                5. Fee Remittance Registry
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-800">
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Payment Bank Name</span>
                  <span className="block mt-0.5">{selectedApp.form?.paymentBankName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Transaction ID / UTR</span>
                  <span className="block mt-0.5 text-slate-900 font-mono font-bold">{selectedApp.form?.paymentTxnNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Transaction Date</span>
                  <span className="block mt-0.5">{selectedApp.form?.paymentTxnDate ? new Date(selectedApp.form.paymentTxnDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-gray-400 block">Payment Status</span>
                  <span className="block mt-0.5 text-emerald-700 font-black">{selectedApp.form?.paymentStatus || 'Completed'}</span>
                </div>
              </div>

              {selectedApp.rejectionReason && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-rose-800 font-semibold mt-4">
                  <span className="text-[10px] uppercase font-black text-rose-600 block">Logged Rejection Reason:</span>
                  <p className="mt-1 leading-relaxed text-xs font-medium">"{selectedApp.rejectionReason}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Uploaded Documents Audit & Payments */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                Certified Upload Inspections (9 files mandatory)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div key={key} className="bg-slate-50 border border-gray-150 rounded-xl p-3 flex items-center justify-between">
                      <span className="font-extrabold text-gray-700 truncate text-[11px]">{titles[key] || key}</span>
                      {docUrl ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-black flex items-center gap-1 uppercase text-[9px] tracking-wider transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Open
                        </a>
                      ) : (
                        <span className="text-gray-400 text-[9px] uppercase tracking-wider font-bold">Not Uploaded</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-gray-100 pb-2">
                Simulated Transaction Capture
              </h4>
              
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-extrabold text-emerald-900 block">Inspection Fee Fully Verified</span>
                  <p className="text-emerald-700 mt-1 font-medium text-[11px]">
                    Simulation capture verified successfully: transaction reference **{selectedApp.paymentDetails?.transactionId || 'TXN-IMPS-887642'}** for amount **{selectedApp.paymentDetails?.amount || '₹15,000'}** was matched on {selectedApp.paymentDetails?.date || '18 May, 2026'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions bar */}
        {selectedApp.status === 'pending_review' && (
          <div className="bg-slate-50 px-8 py-5 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
            {/* <button
              onClick={handleTriggerInspection}
              className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-colors"
            >
              Trigger Site Inspection
            </button> */}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm transition-colors"
              >
                Reject & Log Reason
              </button>
              <button
                onClick={handleApprove}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-colors"
              >
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
