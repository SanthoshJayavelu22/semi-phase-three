import React, { useEffect, useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2, ShieldCheck, Mail, LogOut } from 'lucide-react';
import ConfirmModal from '../../../Components/ConfirmModal';

const ApplicationStatusPending = ({
  applicationRecord,
  appForm,
  uploadedDocs,
  loadApplicationFromStorage,
  saveToLocalStorage,
  setApplicationRecord,
  setCurrentStep,
  handleLogout
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Sync Status listener
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('semi_institute_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.record) {
          setApplicationRecord(parsed.record);
          if (parsed.record.status === 'approved') {
            setCurrentStep('active_erp');
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [setApplicationRecord, setCurrentStep]);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 text-left animate-in fade-in duration-200">
      
      {/* 1. Audit status block */}
      {applicationRecord.status === 'pending_review' ? (
        <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {applicationRecord.status === 'pending_review' ? 'Awaiting Board Audit' : applicationRecord.status.replace('_', ' ')}
              </span>
              <h3 className="text-xl font-black text-gray-900 mt-2">
                Application Submitted! Status: <span className="capitalize">{applicationRecord.status.replace('_', ' ')}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-semibold leading-relaxed">
                Your institutional registration is complete, the fee has been captured, and your application was submitted on <span className="font-bold text-gray-700">{applicationRecord.submittedAt}</span>. The Academic Board is currently auditing your compliance parameters.
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors self-end sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      ) : (
        // Rejected Status block
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Compliance Violation Logged
              </span>
              <h3 className="text-xl font-black text-gray-900 mt-2">Application Audit Rejected</h3>
              <p className="text-xs text-gray-400 mt-1 font-semibold leading-relaxed">
                Your institutional onboarding application was audited by the Academic Board and flagged for compliance failures. You can review comments and re-submit.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-xs text-rose-800 font-semibold leading-relaxed">
            <span className="text-[9px] font-black uppercase text-rose-500 block tracking-wider">Academics Board Rejection Notes:</span>
            <p className="mt-1">"{applicationRecord.rejectionReason || 'Physical facilities or clinical bed capacity do not comply with the state Medical Board standard regulations.'}"</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(true)}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl font-black text-xs uppercase"
            >
              Logout
            </button>
            <button
              onClick={() => {
                const storedAppData = localStorage.getItem('semi_institute_data');
                if (storedAppData) {
                  const parsed = JSON.parse(storedAppData);
                  const updated = {
                    ...parsed,
                    record: {
                      ...parsed.record,
                      status: 'draft'
                    }
                  };
                  localStorage.setItem('semi_institute_data', JSON.stringify(updated));
                  loadApplicationFromStorage();
                  setCurrentStep('onboarding_form');
                }
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase shadow-md transition-colors"
            >
              Edit & Re-submit Application
            </button>
          </div>
        </div>
      )}

      {/* 2. Compliance Checklist */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Compliance Checklist</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Mandatory metrics audited by the Academic Board</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Emergency Dept Beds', value: `${appForm.bedCount} beds`, detail: 'SEMI Mandate: min 10 beds', pass: parseInt(appForm.bedCount, 10) >= 10 },
            { label: 'Emergency Physician Exp', value: `${appForm.physicianExperience} months`, detail: 'SEMI Mandate: min 24 months', pass: parseInt(appForm.physicianExperience, 10) >= 24 },
            { label: 'Faculty Count', value: `${appForm.emFacultyCount} teachers`, detail: 'SEMI Mandate: min 1 faculty', pass: parseInt(appForm.emFacultyCount, 10) >= 1 },
            { label: 'Teaching Space', value: (appForm.teachingSpace === 'Yes' || appForm.teachingSpace === 'Yes (Mandatory)') ? 'Available' : 'Unavailable', detail: 'SEMI Mandate: mandatory', pass: (appForm.teachingSpace === 'Yes' || appForm.teachingSpace === 'Yes (Mandatory)') }
          ].map((rule, idx) => (
            <div key={idx} className="border border-gray-150 rounded-2xl p-4 flex items-start gap-3 bg-gray-50/50">
              {rule.pass ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">{rule.label}</span>
                <span className="text-sm font-black text-gray-900 block mt-0.5">{rule.value}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block font-semibold">{rule.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {confirmOpen && (
        <ConfirmModal
          isOpen={true}
          title="Logout Confirmation"
          message="Are you sure you want to log out of your institutional dashboard session?"
          type="warning"
          confirmText="Logout"
          onConfirm={() => {
            setConfirmOpen(false);
            if (handleLogout) {
              handleLogout();
            } else {
              localStorage.clear();
              setCurrentStep('login');
            }
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default ApplicationStatusPending;
