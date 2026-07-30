import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import OnboardingStepper from './OnboardingStepper';
import Step1GeneralInfo from './Step1GeneralInfo';
import Step2DepartmentInfo from './Step2DepartmentInfo';
import Step3DocumentsUpload from './Step3DocumentsUpload';
import Step4PaymentSubmit from './Step4PaymentSubmit';

const OnboardingWizard = ({
  activeWizardStep,
  setActiveWizardStep,
  appForm,
  setAppForm,
  uploadedDocs,
  setUploadedDocs,
  uploadProgress,
  setUploadProgress,
  paymentComplete,
  paymentDetails,
  validateWizardStep,
  setErrorBanner,
  saveToLocalStorage,
  user,
  applicationRecord,
  handleWizardNext,
  handleWizardBack,
  handleApplicationSubmit,
  applicationSubmitting
}) => {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-200">
      {/* 1. Progress Stepper Header */}
      <OnboardingStepper 
        activeWizardStep={activeWizardStep} 
        setActiveWizardStep={setActiveWizardStep} 
        validateWizardStep={validateWizardStep} 
        setErrorBanner={setErrorBanner} 
        saveToLocalStorage={saveToLocalStorage}
        user={user} 
        appForm={appForm} 
        uploadedDocs={uploadedDocs} 
        paymentComplete={paymentComplete} 
        applicationRecord={applicationRecord} 
      />

      {/* 2. Step Form Panels */}
      {activeWizardStep === 1 && (
        <Step1GeneralInfo appForm={appForm} setAppForm={setAppForm} />
      )}
      {activeWizardStep === 2 && (
        <Step2DepartmentInfo appForm={appForm} setAppForm={setAppForm} />
      )}
      {activeWizardStep === 3 && (
        <Step3DocumentsUpload 
          uploadedDocs={uploadedDocs} 
          setUploadedDocs={setUploadedDocs} 
          uploadProgress={uploadProgress} 
          setUploadProgress={setUploadProgress} 
        />
      )}
      {activeWizardStep === 4 && (
        <Step4PaymentSubmit 
          appForm={appForm} 
          setAppForm={setAppForm} 
          uploadedDocs={uploadedDocs} 
          setUploadedDocs={setUploadedDocs} 
          uploadProgress={uploadProgress} 
          setUploadProgress={setUploadProgress} 
          paymentComplete={paymentComplete} 
          paymentDetails={paymentDetails} 
        />
      )}

      {/* 3. Wizard Next / Back Stepper Actions */}
      <div className="flex justify-between items-center bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
        {activeWizardStep > 1 ? (
          <button
            type="button"
            onClick={handleWizardBack}
            className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </button>
        ) : (
          <div /> // placeholder
        )}

        {activeWizardStep < 4 ? (
          <button
            type="button"
            onClick={handleWizardNext}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors"
          >
            Next Step
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleApplicationSubmit}
            disabled={applicationSubmitting}
            className={`px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors ${applicationSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {applicationSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Submit Application
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
