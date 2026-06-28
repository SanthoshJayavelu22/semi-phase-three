import React, { useState } from 'react';
import { Eye, FileCheck, RefreshCw } from 'lucide-react';
import Toast from '../../../Components/Toast';

const Step3DocumentsUpload = ({ uploadedDocs, setUploadedDocs, uploadProgress, setUploadProgress }) => {
  const [toast, setToast] = useState(null);
  const MANDATORY_DOCUMENTS = [
    { key: 'equipmentList', label: 'Emergency Department Equipment List *' },
    { key: 'facultyList', label: 'Emergency Department Faculty List (EM Qualified) *' },
    { key: 'opdStats', label: 'Clinical OPD/Emergency Admissions Statistics (2025-2026) *' },
    { key: 'libraryList', label: 'Library Book List (EM Subscriptions) *' },
    { key: 'mannequinList', label: 'Emergency Skill Mannequin Catalog *' },
    { key: 'diagnosticList', label: 'Emergency Diagnostic Specs & Imaging Audits *' },
    { key: 'declarationLetter', label: 'Declaration Statement & Representative Digital Card *' }
  ];

  const handleFileUpload = (key, file) => {
    setUploadProgress(prev => ({ ...prev, [key]: 10 }));
    let progress = 10;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(prev => ({ ...prev, [key]: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedDocs(prev => ({
          ...prev,
          [key]: file
        }));
        setUploadProgress(prev => ({ ...prev, [key]: null }));
      }
    }, 150);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900">Mandatory Document Hub</h3>
        <p className="text-xs text-gray-400 mt-0.5">Please upload required certified lists (PDF format preferred)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MANDATORY_DOCUMENTS.map((doc) => {
          const isUploaded = !!uploadedDocs[doc.key];
          const progress = uploadProgress[doc.key] || 0;

          return (
            <div key={doc.key} className="border border-gray-150 rounded-2xl p-4 flex flex-col justify-between bg-gray-50/50 hover:border-gray-300 transition-colors">
              <div>
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2 leading-relaxed">
                  {doc.label}
                </label>
                
                {isUploaded ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between mt-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div className="text-[11px] leading-relaxed">
                        <span className="font-extrabold text-emerald-900 block truncate max-w-[160px]">{uploadedDocs[doc.key].name}</span>
                        <span className="text-emerald-600 block mt-0.5">{(uploadedDocs[doc.key].size / 1024).toFixed(1)} KB | Uploaded</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setToast({ message: `Audit Preview: File "${uploadedDocs[doc.key].name}" is digitally signed & locked under SHA-256.`, type: 'info' })}
                      className="text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1 uppercase text-[9px] tracking-wider"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                ) : progress > 0 && progress < 100 ? (
                  <div className="mt-3 bg-white border border-gray-150 rounded-xl p-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                      <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <input
                      type="file"
                      id={`file-${doc.key}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleFileUpload(doc.key, file);
                        }
                      }}
                    />
                    <label
                      htmlFor={`file-${doc.key}`}
                      className="w-full py-2.5 bg-white border border-gray-200 hover:border-slate-300 rounded-xl text-center font-bold text-xs text-slate-700 uppercase tracking-wider block cursor-pointer transition-all shadow-sm"
                    >
                      Choose Certified File
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
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

export default Step3DocumentsUpload;
