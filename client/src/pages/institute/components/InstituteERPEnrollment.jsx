import React, { useState } from 'react';
import { Check, CheckCircle2, Trash2, User, BookOpen, Shield, Globe, GraduationCap, CreditCard, Award, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

const InstituteERPEnrollment = ({
  enrollForm,
  setEnrollForm,
  enrollDocs,
  setEnrollDocs,
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

  // Local state to track "Is FMG Candidate?" matching screenshot dropdown
  const [isFmgSelected, setIsFmgSelected] = useState(enrollForm.studentCategory === 'FMG' ? 'Yes' : 'No');

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
    if (step === 1) {
      if (!enrollForm.firstName?.trim()) return 'First Name is a mandatory field.';
      if (!enrollForm.lastName?.trim()) return 'Last Name is a mandatory field.';
      if (!enrollForm.homeAddress?.trim()) return 'Home Address is a mandatory field.';
      
      const phoneRegex = /^\d{10}$/;
      if (!enrollForm.contactNumber?.trim()) return 'Contact Number is a mandatory field.';
      if (!phoneRegex.test(enrollForm.contactNumber.replace(/\D/g, ''))) return 'Contact Number must be a valid 10-digit number.';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!enrollForm.emailAddress?.trim()) return 'Email Address is a mandatory field.';
      if (!emailRegex.test(enrollForm.emailAddress)) return 'Valid Email Address is required.';
      if (!enrollDocs.photoDoc) return 'Candidate Passport photograph must be uploaded.';
    }
    if (step === 2) {
      if (!enrollForm.qualification) return 'Postgraduate qualification selection is mandatory.';
      
      const year = parseInt(enrollForm.passingYear, 10);
      if (!enrollForm.passingYear?.trim() || isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
        return 'Valid Passing Year is required (e.g. 2018).';
      }
      
      if (!enrollForm.universityName?.trim()) return 'University Name is a mandatory field.';
      if (!enrollDocs.marksCertificateDoc) return 'MBBS Degree Certificate must be uploaded.';
      if (!enrollForm.medCouncilRegNo?.trim()) return 'Medical Council Registration Number is a mandatory field.';
      if (!enrollForm.stateMedCouncil?.trim()) return 'State Medical Council is a mandatory field.';
      if (!enrollDocs.medCouncilCertDoc) return 'Medical Council Registration Certificate must be uploaded.';
      if (isFmgSelected === 'Yes' && !enrollDocs.fmgeCertDoc) {
        return 'FMGE Screening Pass Result Certificate copy must be uploaded for Foreign Medical Graduates.';
      }
    }
    if (step === 3) {
      if (!enrollForm.course) return 'Please select a program course.';
      if (!enrollForm.batch) return 'Please select an academic batch.';
      if (!enrollForm.courseDirector?.trim()) return 'Course Director is a mandatory field.';
      if (!enrollForm.currentDesignation?.trim()) return 'Designation is a mandatory field.';
      if (!enrollForm.lifeMembershipNo?.trim()) return 'Life Membership Number is a mandatory field.';
      if (!enrollForm.mcQualifications?.trim()) return 'Medical Council Qualifications is a mandatory field.';
      if (!enrollDocs.lifeMembershipCardDoc) return 'SEMI Membership Card/Form document must be uploaded.';
    }
    if (step === 4) {
      if (!enrollForm.paymentMode) return 'Payment Mode selection is mandatory.';
      if (!enrollForm.utrNumber?.trim()) return 'UTR Transaction Reference Number is mandatory.';
      if (enrollForm.utrNumber.trim().length < 8) return 'UTR Transaction Reference Number must be at least 8 characters.';
      if (!enrollForm.txnDate) return 'Transaction Date is mandatory.';
      if (!enrollDocs.paymentReceiptDoc) return 'Enrollment Payment Receipt must be uploaded.';
      if (!enrollDocs.studentSignatureDoc) return 'Student Signature file must be uploaded.';
      if (!enrollDocs.hodSignatureDoc) return 'PG Degree Certificate / HOD confirmation document must be uploaded.';
      if (!enrollForm.declarationCheck) return 'You must check the candidate credentials declaration check.';
    }
    return null;
  };

  const handleNext = () => {
    setLocalError(null);
    const error = validateStep(wizardStep);
    if (error) {
      setLocalError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setWizardStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setLocalError(null);
    setWizardStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitIntercept = (e) => {
    e.preventDefault();
    setLocalError(null);
    const error = validateStep(4);
    if (error) {
      setLocalError(error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    handleEnrollmentSubmit(e);
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
      </div>

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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={enrollForm.firstName}
                  onChange={(e) => setEnrollForm({...enrollForm, firstName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
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
                  onChange={(e) => setEnrollForm({...enrollForm, lastName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Home Address *</label>
              <textarea
                required
                placeholder="Temporary Address / Residential Address"
                value={enrollForm.homeAddress}
                onChange={(e) => setEnrollForm({...enrollForm, homeAddress: e.target.value})}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Contact Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 Contact Number"
                  value={enrollForm.contactNumber}
                  onChange={(e) => setEnrollForm({...enrollForm, contactNumber: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@example.com"
                  value={enrollForm.emailAddress}
                  onChange={(e) => setEnrollForm({...enrollForm, emailAddress: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
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
                    required
                    placeholder="2025"
                    value={enrollForm.passingYear}
                    onChange={(e) => setEnrollForm({...enrollForm, passingYear: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
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
                    onChange={(e) => setEnrollForm({...enrollForm, course: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.courseName}>{c.courseName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Academic Batch Group *</label>
                  <select
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({...enrollForm, batch: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
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

                {/* Remittance Fields */}
                <div className="lg:col-span-2 space-y-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Remittance Mode *</label>
                      <select
                        value={enrollForm.paymentMode}
                        onChange={(e) => setEnrollForm({...enrollForm, paymentMode: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="Online Transfer">Online Transfer</option>
                        <option value="UTR Reference">UTR Reference</option>
                        <option value="Demand Draft">Demand Draft</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">UTR / Bank Txn ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="Transaction UTR Number"
                        value={enrollForm.utrNumber}
                        onChange={(e) => setEnrollForm({...enrollForm, utrNumber: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Transaction Date *</label>
                      <input
                        type="date"
                        required
                        value={enrollForm.txnDate}
                        onChange={(e) => setEnrollForm({...enrollForm, txnDate: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Payment Receipt PDF *</label>
                      {renderUploadCard("Choose Fee Receipt", 'paymentReceiptDoc')}
                    </div>
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
                Submit Application
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default InstituteERPEnrollment;
