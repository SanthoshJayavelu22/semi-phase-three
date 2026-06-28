import React from 'react';
import { Check } from 'lucide-react';

const OnboardingStepper = ({ 
  activeWizardStep, 
  setActiveWizardStep, 
  validateWizardStep, 
  setErrorBanner, 
  saveToLocalStorage,
  user, 
  appForm, 
  uploadedDocs, 
  paymentComplete, 
  applicationRecord 
}) => {
  const steps = [
    { number: 1, label: 'Institution Details' },
    { number: 2, label: 'Department Info' },
    { number: 3, label: 'Audit Uploads' },
    { number: 4, label: 'Payment & Submit' }
  ];

  const handleStepClick = (stepNo) => {
    setErrorBanner(null);
    // If the step is ahead, we need to validate all previous steps
    if (stepNo > activeWizardStep) {
      for (let s = activeWizardStep; s < stepNo; s++) {
        const error = validateWizardStep(s);
        if (error) {
          setErrorBanner(error);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }
    setActiveWizardStep(stepNo);
    saveToLocalStorage(user, appForm, uploadedDocs, paymentComplete, applicationRecord, stepNo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm select-none">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 relative">
        {/* Visual connecting bars */}
        <div className="absolute left-[34px] right-[34px] top-1/2 -translate-y-1/2 height-[2px] bg-gray-100 hidden md:block select-none pointer-events-none -z-10"></div>
        
        {steps.map((step) => {
          const isCompleted = activeWizardStep > step.number;
          const isActive = activeWizardStep === step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => handleStepClick(step.number)}
              className="flex items-center gap-4 text-left group w-full md:w-auto relative z-10 transition-all focus:outline-none"
            >
              {/* Point Circle */}
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs transition-all border ${
                isCompleted 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/10' 
                  : isActive
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Point label */}
              <div className="flex flex-col justify-center">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Step {step.number}</span>
                <span className={`text-xs font-black mt-0.5 ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingStepper;
