import React, { useState } from 'react';
import { CheckCircle2, Trash2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { initiateRazorpayPayment } from '../../../utils/razorpay';
import academicService from '../../../api/academic';

const InstituteERPEnrollment = ({ 
  enrollForm, 
  setEnrollForm, 
  enrollDocs, 
  enrollProgress, 
  courses = [], 
  batches = [], 
  user, 
  appForm, 
  handleEnrollmentSubmit, 
  handleEnrollDocUpload, 
  removeEnrollDoc 
}) => {
  const [wizardStep, setWizardStep] = useState(1);
  const [localError, setLocalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Local state to track "Is FMG Candidate?" matching screenshot dropdown
  const [isFmgSelected, setIsFmgSelected] = useState(enrollForm.studentCategory === 'FMG' ? 'Yes' : 'No');

  // Filter batches matching the selected course
  const filteredBatches = React.useMemo(() => {
    return batches.filter(b => {
      const courseNameOfBatch = b.course?.name || b.course?.courseName || b.courseName || '';
      return courseNameOfBatch.toLowerCase() === (enrollForm.course || '').toLowerCase();
    });
  }, [batches, enrollForm.course]);

  // Keep course and batch selection synchronized
  React.useEffect(() => {
    let selectedCourse = enrollForm.course;
    let updated = false;

    if (courses.length > 0) {
      const isValidCourse = courses.some(c => (c.courseName || '').toLowerCase() === (enrollForm.course || '').toLowerCase());
      if (!isValidCourse) {
        selectedCourse = courses[0].courseName;
        updated = true;
      }
    } else if (courses.length === 0 && enrollForm.course !== '') {
      selectedCourse = '';
      updated = true;
    }

    const matchingBatches = batches.filter(b => {
      const cName = b.course?.name || b.course?.courseName || b.courseName || '';
      return cName.toLowerCase() === (selectedCourse || '').toLowerCase();
    });

    const isCurrentBatchValid = matchingBatches.some(b => b.name === enrollForm.batch);

    if (!isCurrentBatchValid && matchingBatches.length > 0) {
      setEnrollForm(prev => ({
        ...prev,
        course: selectedCourse,
        batch: matchingBatches[0].name
      }));
    } else if (updated) {
      setEnrollForm(prev => ({
        ...prev,
        course: selectedCourse
      }));
    }
  }, [courses, batches, enrollForm.course, enrollForm.batch, setEnrollForm]);

  const handleFmgChange = (val) => {
    setIsFmgSelected(val);
    if (val === 'Yes') {
      setEnrollForm(prev => ({ ...prev, studentCategory: 'FMG' }));
    } else {
      setEnrollForm(prev => ({ ...prev, studentCategory: 'General' }));
    }
  };

  // Helper to render file upload card
  const renderUploadCard = (label, docKey) => {
    const file = enrollDocs[docKey];
    const progress = enrollProgress[docKey];

    return (
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">{label}</span>
          {file ? (
            <span className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {file.name} ({file.size})
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium block mt-1">No file uploaded</span>
          )}
          {progress !== undefined && progress !== null && (
            <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
        {file ? (
          <button 
            type="button" 
            onClick={() => removeEnrollDoc(docKey)} 
            className="px-3 py-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 font-bold rounded-lg text-[10px] uppercase transition-all tracking-wider flex items-center gap-1 w-fit cursor-pointer animate-in fade-in"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        ) : (
          <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-[10px] uppercase tracking-wider cursor-pointer shadow-sm transition-colors w-fit select-none">
            Choose File
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              className="hidden" 
              onChange={(e) => handleEnrollDocUpload(docKey, e.target.files[0])} 
            />
          </label>
        )}
      </div>
    );
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!enrollForm.firstName?.trim()) errors.firstName = 'First Name is mandatory.';
      if (!enrollForm.lastName?.trim()) errors.lastName = 'Last Name is mandatory.';
      if (!enrollForm.dateOfBirth) {
        errors.dateOfBirth = 'Date of Birth is mandatory.';
      } else if (new Date(enrollForm.dateOfBirth) > new Date()) {
        errors.dateOfBirth = 'Date of Birth cannot be in the future.';
      }
      if (!enrollForm.homeAddress?.trim()) errors.homeAddress = 'Home Address is mandatory.';
      
      const phoneDigits = (enrollForm.contactNumber || '').replace(/\D/g, '');
      const phoneRegex = /^\d{10,15}$/;
      if (!enrollForm.contactNumber?.trim()) {
        errors.contactNumber = 'Contact Number is mandatory.';
      } else if (!phoneRegex.test(phoneDigits)) {
        errors.contactNumber = 'Contact Number must be 10-15 digits.';
      }
      
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!enrollForm.emailAddress?.trim()) {
        errors.emailAddress = 'Email Address is mandatory.';
      } else if (/\s/.test(enrollForm.emailAddress)) {
        errors.emailAddress = 'Email Address cannot contain spaces.';
      } else if (!emailRegex.test(enrollForm.emailAddress)) {
        errors.emailAddress = 'Enter a valid email address (e.g. doctor@example.com).';
      }
      if (!enrollDocs.photoDoc) errors.photoDoc = 'Passport photograph must be uploaded.';
    }
    if (step === 2) {
      if (!enrollForm.qualification) errors.qualification = 'Postgraduate qualification selection is mandatory.';
      
      const year = parseInt(enrollForm.passingYear, 10);
      if (!enrollForm.passingYear?.trim() || isNaN(year)) {
        errors.passingYear = 'Passing Year is required.';
      } else if (year < 1900) {
        errors.passingYear = 'Passing Year cannot be before 1900.';
      } else if (year > currentYear) {
        errors.passingYear = 'Passing Year cannot be in the future.';
      }
      
      if (!enrollForm.universityName?.trim()) errors.universityName = 'University Name is mandatory.';
      if (!enrollDocs.marksCertificateDoc) errors.marksCertificateDoc = 'MBBS Degree Certificate must be uploaded.';
      if (!enrollForm.medCouncilRegNo?.trim()) errors.medCouncilRegNo = 'Medical Council Registration Number is mandatory.';
      if (!enrollForm.stateMedCouncil?.trim()) errors.stateMedCouncil = 'State Medical Council is mandatory.';
      if (!enrollDocs.medCouncilCertDoc) errors.medCouncilCertDoc = 'Medical Council Registration Certificate must be uploaded.';
      if (isFmgSelected === 'Yes' && !enrollDocs.fmgeCertDoc) {
        errors.fmgeCertDoc = 'FMGE Screening Pass Result Certificate must be uploaded for Foreign Medical Graduates.';
      }
    }
    if (step === 3) {
      if (!enrollForm.course) errors.course = 'Please select a program course.';
      if (!enrollForm.batch) errors.batch = 'Please select an academic batch.';
      if (!enrollForm.courseDirector?.trim()) errors.courseDirector = 'Course Director is mandatory.';
      if (!enrollForm.currentDesignation?.trim()) errors.currentDesignation = 'Designation is mandatory.';
      if (!enrollForm.lifeMembershipNo?.trim()) errors.lifeMembershipNo = 'Life Membership Number is mandatory.';
      if (!enrollForm.mcQualifications?.trim()) errors.mcQualifications = 'Medical Council Qualifications is mandatory.';
      if (!enrollDocs.lifeMembershipCardDoc) errors.lifeMembershipCardDoc = 'SEMI Membership Card/Form must be uploaded.';
    }
    if (step === 4) {
      if (!enrollDocs.studentSignatureDoc) errors.studentSignatureDoc = 'Student Signature file must be uploaded.';
      if (!enrollDocs.hodSignatureDoc) errors.hodSignatureDoc = 'PG Degree Certificate / HOD confirmation must be uploaded.';
      if (!enrollForm.declarationCheck) errors.declarationCheck = 'You must accept the declaration.';
    }
    return errors;
  };

  const handleNext = () => {
    setLocalError(null);
    const errors = validateStep(wizardStep);
    setFieldErrors(errors);
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      setLocalError(errorMessages[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setWizardStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setLocalError(null);
    setFieldErrors({});
    setWizardStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmitIntercept = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const errors = validateStep(4);
    setFieldErrors(errors);
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      setLocalError(errorMessages[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    try {
      // 1. Create Razorpay order (Using 1 INR for testing to avoid test limit errors)
      const orderRes = await academicService.createRazorpayOrder({ amount: 1, purpose: 'Student Enrollment' });
      const orderData = orderRes.data || orderRes;
      
      // 2. Initiate Payment
      const finalOrderId = orderData.data?.orderId || orderData.orderId || orderData.id || orderData.data?.id;
      initiateRazorpayPayment({
        orderId: finalOrderId,
        amount: 1 * 100, // Razorpay takes amount in paise
        prefill: {
          name: `${enrollForm.firstName} ${enrollForm.lastName}`,
          email: enrollForm.emailAddress,
          contact: enrollForm.contactNumber
        },
        onSuccess: async (response) => {
          try {
            // Verify payment
            await academicService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            // Set payment data dynamically
            enrollForm.paymentMode = 'Razorpay';
            enrollForm.razorpayOrderId = response.razorpay_order_id;
            enrollForm.razorpayPaymentId = response.razorpay_payment_id;
            enrollForm.razorpaySignature = response.razorpay_signature;
            enrollForm.txnDate = new Date().toISOString().split('T')[0];
            
            // Wait for enrollment form submission
            const success = await handleEnrollmentSubmit(e);
            if (success) {
              setWizardStep(1);
            }
          } catch (err) {
            console.error(err);
            setLocalError('Payment verification failed.');
          }
        },
        onDismiss: () => {
          setLocalError('Payment was cancelled.');
        }
      });
    } catch (err) {
      console.error(err);
      setLocalError('Failed to initialize payment gateway.');
    }
  };

  const stepsMeta = [
    { title: 'Personal Profile', desc: 'Identity details & photo' },
    { title: 'Qualifications', desc: 'Degrees & registrations' },
    { title: 'SEMI Program', desc: 'Batch, course & membership' },
    { title: 'Declaration & Fee', desc: 'UTR payment & sign-off' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left font-sans select-none">
      {/* Form Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Student Enrollment Form</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Registration of Candidates for the Fellowship Training program Guidelines</p>
        </div>
        <div className="bg-blue-600 text-white rounded-2xl px-6 py-3 shadow-md text-center flex flex-col items-center shadow-blue-500/15">
          <span className="text-[9px] text-blue-200 uppercase font-black tracking-widest block">App Fee Due</span>
          <span className="text-lg font-black tracking-tight">₹1,40,000</span>
        </div>
      </div>``

      {/* Dynamic Wizard Steps Indicators */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-8">
          {stepsMeta.map((s, idx) => {
            const stepNum = idx + 1;
            const isActive = wizardStep === stepNum;
            const isCompleted = wizardStep > stepNum;
            return (
              <div key={idx} className="flex items-center gap-3.5 flex-1 w-full lg:w-auto">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all shadow-inner ${
                  isActive 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : isCompleted 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-55 border border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : stepNum}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-black tracking-tight ${isActive ? 'text-slate-800' : isCompleted ? 'text-emerald-800' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{s.desc}</span>
                </div>
                {idx < stepsMeta.length - 1 && (
                  <div className="hidden lg:block h-[1px] bg-slate-100 flex-grow mx-2"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form container */}
      <form onSubmit={handleSubmitIntercept} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
        {localError && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-bold rounded-r-xl leading-relaxed flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <span className="text-sm">⚠️</span>
            <div>
              <span className="block font-black uppercase text-[9px] tracking-wider text-rose-600">Form Error Blocked</span>
              {localError}
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL INFORMATION */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center shadow-inner">1</span>
              Personal Profile & Contact
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={enrollForm.firstName}
                  onChange={(e) => { setEnrollForm({...enrollForm, firstName: e.target.value}); clearFieldError('firstName'); }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.firstName ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.firstName && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Middle Name</label>
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={enrollForm.middleName || ''}
                  onChange={(e) => setEnrollForm({...enrollForm, middleName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={enrollForm.lastName}
                  onChange={(e) => { setEnrollForm({...enrollForm, lastName: e.target.value}); clearFieldError('lastName'); }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.lastName ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.lastName && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.lastName}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  required
                  max={today}
                  value={enrollForm.dateOfBirth || ''}
                  onChange={(e) => { setEnrollForm({...enrollForm, dateOfBirth: e.target.value}); clearFieldError('dateOfBirth'); }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.dateOfBirth ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.dateOfBirth && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.dateOfBirth}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Home Address *</label>
              <textarea
                required
                placeholder="Temporary Address / Residential Address"
                value={enrollForm.homeAddress}
                onChange={(e) => { setEnrollForm({...enrollForm, homeAddress: e.target.value}); clearFieldError('homeAddress'); }}
                rows={3}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.homeAddress ? 'border-red-400' : 'border-slate-200'}`}
              />
              {fieldErrors.homeAddress && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.homeAddress}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Contact Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 Contact Number"
                  value={enrollForm.contactNumber}
                  onChange={(e) => { setEnrollForm({...enrollForm, contactNumber: e.target.value}); clearFieldError('contactNumber'); }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.contactNumber ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.contactNumber && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.contactNumber}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@example.com"
                  value={enrollForm.emailAddress}
                  onChange={(e) => { setEnrollForm({...enrollForm, emailAddress: e.target.value}); clearFieldError('emailAddress'); }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.emailAddress ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.emailAddress && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.emailAddress}</p>}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Passport Photo *</label>
                {renderUploadCard("Choose Passport Photo", 'photoDoc')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: QUALIFICATIONS & MEDICAL COUNCIL */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Academic Section */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center shadow-inner">2</span>
                Academic Qualifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Recognized Postgraduate Qualification *</label>
                  <select
                    value={enrollForm.qualification}
                    onChange={(e) => setEnrollForm({...enrollForm, qualification: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="MD Emergency Medicine">MD Emergency Medicine</option>
                    <option value="DNB Emergency Medicine">DNB Emergency Medicine</option>
                    <option value="MEM (Emergency Medicine)">MEM (Emergency Medicine)</option>
                    <option value="MD General Medicine">MD General Medicine (Ineligible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Passing Year *</label>
                  <input
                    type="number"
                    min="1900"
                    max={currentYear}
                    required
                    placeholder="2025"
                    value={enrollForm.passingYear}
                    onChange={(e) => { setEnrollForm({...enrollForm, passingYear: e.target.value}); clearFieldError('passingYear'); }}
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all ${fieldErrors.passingYear ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {fieldErrors.passingYear && <p className="text-red-500 text-[10px] mt-1 font-semibold">{fieldErrors.passingYear}</p>}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">University Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="University Name"
                    value={enrollForm.universityName}
                    onChange={(e) => setEnrollForm({...enrollForm, universityName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">MBBS Degree Certificate Upload *</label>
                  {renderUploadCard("Choose MBBS Certificate", 'marksCertificateDoc')}
                </div>
              </div>
            </div>

            {/* Medical Council Section */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Council Registration</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="Council Reg No"
                    value={enrollForm.medCouncilRegNo}
                    onChange={(e) => setEnrollForm({...enrollForm, medCouncilRegNo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">State Medical Council *</label>
                  <input
                    type="text"
                    required
                    placeholder="State Medical Council"
                    value={enrollForm.stateMedCouncil}
                    onChange={(e) => setEnrollForm({...enrollForm, stateMedCouncil: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Medical Council Certificate Upload *</label>
                {renderUploadCard("Choose Registration Certificate", 'medCouncilCertDoc')}
              </div>
            </div>

            {/* FMG Section */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foreign Medical Graduate Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Student Category *</label>
                  <select
                    value={enrollForm.studentCategory}
                    onChange={(e) => setEnrollForm({...enrollForm, studentCategory: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="General">General / Domestic</option>
                    <option value="FMG">FMG (Foreign Medical Graduate)</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Is FMG Candidate? *</label>
                  <select
                    value={isFmgSelected}
                    onChange={(e) => handleFmgChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {isFmgSelected === 'Yes' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">FMGE Pass Certificate Upload *</label>
                  {renderUploadCard("Choose FMGE Result Copy", 'fmgeCertDoc')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ENROLLMENT & SEMI MEMBERSHIP */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Placement details */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center shadow-inner">3</span>
                SEMI Fellowship Allocation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Accredited Institute of Enrollment *</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-not-allowed"
                    value={user?.instituteName || appForm.orgName || 'Saraswathi Inst.'}
                    disabled
                  >
                    <option>{user?.instituteName || appForm.orgName || 'Saraswathi Inst.'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Fellowship Course *</label>
                  <select
                    value={enrollForm.course}
                    onChange={(e) => {
                      const selectedCourseName = e.target.value;
                      const matchingBatches = batches.filter(b => {
                        const cName = b.course?.name || b.course?.courseName || b.courseName || '';
                        return cName.toLowerCase() === selectedCourseName.toLowerCase();
                      });
                      setEnrollForm(prev => ({
                        ...prev,
                        course: selectedCourseName,
                        batch: matchingBatches.length > 0 ? matchingBatches[0].name : ''
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {courses.map(c => (
                      <option key={c.id || c._id} value={c.courseName}>{c.courseName}</option>
                    ))}
                    {courses.length === 0 && (
                      <option value="">No courses available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Academic Batch Group *</label>
                  <select
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({...enrollForm, batch: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {filteredBatches.map(b => (
                      <option key={b.id || b._id} value={b.name}>{b.name}</option>
                    ))}
                    {filteredBatches.length === 0 && (
                      <option value="">No batches available</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Course Director *</label>
                  <input
                    type="text"
                    required
                    placeholder="Course Director"
                    value={enrollForm.courseDirector}
                    onChange={(e) => setEnrollForm({...enrollForm, courseDirector: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* SEMI Membership details */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEMI Society Membership Card</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Current Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Resident Doctor / EM Fellow"
                    value={enrollForm.currentDesignation}
                    onChange={(e) => setEnrollForm({...enrollForm, currentDesignation: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Life Membership No *</label>
                  <input
                    type="text"
                    required
                    placeholder="Life Membership No"
                    value={enrollForm.lifeMembershipNo}
                    onChange={(e) => setEnrollForm({...enrollForm, lifeMembershipNo: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Medical Council (MC) Qualifications *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBBS, MD Emergency Medicine"
                  value={enrollForm.mcQualifications}
                  onChange={(e) => setEnrollForm({...enrollForm, mcQualifications: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">SEMI Membership Card Upload *</label>
                {renderUploadCard("Choose Membership Card PDF", 'lifeMembershipCardDoc')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT & DECLARATION */}
        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Payment Section */}
            <div className="space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center shadow-inner">4</span>
                Fee Remittance & Sign-off
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fee Checklist */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-blue-600 border-b border-blue-100 pb-2">Fellowship Fee Includes</h4>
                  <ul className="space-y-2 text-xs text-blue-800 font-semibold">
                    {[
                      '3 Year Advanced Fellowship Training Fee',
                      'Access to e-learning Modules & Portals',
                      'SEMI Central Board Examination Fees',
                      'Degree Certification and Governance Fees',
                      'GST & Administrative Processing Fees'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Remittance Info Removed */}
                <div className="lg:col-span-2 space-y-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center items-center text-center">
                  <div className="text-slate-400 font-medium text-sm mb-4">
                    Secure payment is processed through Razorpay. You will be prompted to complete the ₹1,40,000 fee when you submit the application.
                  </div>
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Online Payment Integration
                  </div>
                </div>
              </div>
            </div>

            {/* Declaration & Signature Section */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Declarations</h4>
              <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  I hereby declare that all clinical qualifications, postgraduate degrees, state registration details, and UTR remittance information provided in this wizard represent my own genuine credentials. I understand that any false declaration will immediately blacklist my candidacy from SEMI advanced training board programs and revoke active institutional allocations.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="enrollDeclarationCheck"
                    required
                    checked={enrollForm.declarationCheck || false}
                    onChange={(e) => setEnrollForm({...enrollForm, declarationCheck: e.target.checked})}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="enrollDeclarationCheck" className="text-xs text-slate-600 font-bold cursor-pointer select-none">
                    I confirm and authorize all candidate credentials as accurate and true.
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Candidate Signature *</label>
                  {renderUploadCard("Choose Signature File", 'studentSignatureDoc')}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">PG Degree Certificate / HOD Sign-off *</label>
                  {renderUploadCard("Choose PG Certificate File", 'hodSignatureDoc')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions Bar */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            {wizardStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-55 text-slate-650 hover:text-slate-850 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div>
            {wizardStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Submit Application & Pay
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default InstituteERPEnrollment;
