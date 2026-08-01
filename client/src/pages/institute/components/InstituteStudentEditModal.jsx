import { useState } from 'react';
import { X, Save, User, Mail, Phone, Book, Calendar, Shield, MapPin, Award, Building2, ExternalLink, UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const DOC_FIELDS = [
  { key: 'passportPhoto', urlKey: 'passportPhotoUrl', label: 'Passport Photo (JPG/PNG)', icon: '📷', isImage: true },
  { key: 'mbbsCertificate', urlKey: 'mbbsCertificateUrl', label: 'MBBS Degree Certificate (PDF/DOC)', icon: '📄', isImage: false },
  { key: 'medicalCouncilRegistrationCertificate', urlKey: 'medicalCouncilRegistrationCertificateUrl', label: 'Medical Council Certificate (PDF)', icon: '📜', isImage: false },
  { key: 'fmgeResultCopy', urlKey: 'fmgeResultCopyUrl', label: 'FMGE Screening Result (PDF)', icon: '📝', isImage: false },
  { key: 'semiMembershipForm', urlKey: 'semiMembershipFormUrl', label: 'SEMI Membership Form (PDF/DOC)', icon: '🗳️', isImage: false },
  { key: 'studentSignature', urlKey: 'studentSignatureUrl', label: 'Student Signature (JPG/PNG)', icon: '✍️', isImage: true },
  { key: 'hodSignature', urlKey: 'hodSignatureUrl', label: 'PG Degree / HOD Confirmation (PDF)', icon: '🎓', isImage: false },
];

const InstituteStudentEditModal = ({ student, isOpen, onClose, onSave, courses = [], batches = [] }) => {
  const getDocUrl = (filename) => {
    if (!filename) return '#';
    return getUploadUrl(filename);
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    graduationYear: '',
    enrollmentNo: '',
    admissionDate: '',
    courseName: '',
    batchName: '',
    status: 'Active',
    universityName: '',
    mbbsQualification: '',
    medicalCouncilRegistrationNumber: '',
    fmgeClearanceStatus: 'Not Applicable',
    isForeignGraduate: false,
    homeAddress: '',
    courseDirector: '',
  });

  const [error, setError] = useState(null);
  const [docFiles, setDocFiles] = useState({});
  const [docPreviews, setDocPreviews] = useState({});
  const [prevStudent, setPrevStudent] = useState(student);

  // ─── Loading & Success States ──────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (student !== prevStudent) {
    setPrevStudent(student);
    Object.values(docPreviews).forEach(url => URL.revokeObjectURL(url));
    setDocPreviews({});
    setDocFiles({});
    setError(null);
    setShowSuccess(false);
    setIsSubmitting(false);

    if (student) {
      setFormData({
        fullName: student.fullName || '',
        email: student.email || '',
        phone: student.phone || student.contactNumber || '',
        qualification: student.qualification || '',
        graduationYear: student.graduationYear || student.yearOfPassing || '',
        enrollmentNo: student.enrollmentNo || student.enrollmentId || '',
        admissionDate: student.admissionDate || (student.createdAt ? student.createdAt.split('T')[0] : ''),
        courseName: student.courseName || '',
        batchName: student.batchName || '',
        status: student.status || 'Active',
        universityName: student.universityName || '',
        mbbsQualification: student.mbbsQualification || '',
        medicalCouncilRegistrationNumber: student.medicalCouncilRegistrationNumber || '',
        fmgeClearanceStatus: student.fmgeClearanceStatus || 'Not Applicable',
        isForeignGraduate: !!student.isForeignGraduate,
        homeAddress: student.homeAddress || '',
        courseDirector: student.courseDirector || '',
      });
    }
  }

  const handleDocChange = (field, file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      setDocFiles(prev => ({ ...prev, [field]: file }));
      setDocPreviews(prev => {
        if (prev[field]) URL.revokeObjectURL(prev[field]);
        const next = { ...prev };
        if (file.type.startsWith('image/')) {
          next[field] = URL.createObjectURL(file);
        } else {
          next[field] = null;
        }
        return next;
      });
      setError(null);
    } else {
      setDocFiles(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setDocPreviews(prev => {
        if (prev[field]) URL.revokeObjectURL(prev[field]);
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ─── Validation ────────────────────────────────────────────────────────────
    if (!formData.fullName || !formData.email || !formData.phone || !formData.enrollmentNo) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Phone Number must be a valid 10-digit number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format.');
      return;
    }

    // ─── Submit ────────────────────────────────────────────────────────────────
    setIsSubmitting(true);
    setError(null);
    setShowSuccess(false);

    try {
      await onSave({
        ...student,
        ...formData,
        phone: cleanPhone,
        docFiles
      });

      // ─── Show Success ───────────────────────────────────────────────────────
      setSuccessMessage(`✅ ${formData.fullName}'s profile updated successfully!`);
      setShowSuccess(true);

      // Close after a brief delay to show the success message
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      const errorMsg = err?.parsedMessage || err?.message || 'Failed to update student. Please try again.';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  // ─── Success Overlay ──────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full p-8 text-center scale-in-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Update Successful!</h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">{successMessage}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            Closing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full flex flex-col overflow-hidden max-h-[90vh] scale-in-center animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Edit Fellow Details</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isSubmitting ? 'Saving changes...' : 'Update student profile, academic metrics & documents'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {error && (
            <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-xs font-bold text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Basic Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Fellow Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Dr. Name Here"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Application ID / Enrollment No *</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.enrollmentNo}
                    onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                    placeholder="SEMI0012"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@example.com"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 99999 88888"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic & Registration Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Academic & Registration Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Accredited Qualification *</label>
                <div className="relative">
                  <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="MD Emergency Medicine">MD Emergency Medicine</option>
                    <option value="DNB Emergency Medicine">DNB Emergency Medicine</option>
                    <option value="MEM (Emergency Medicine)">MEM (Emergency Medicine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">MBBS Qualification *</label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.mbbsQualification}
                    onChange={(e) => setFormData({ ...formData, mbbsQualification: e.target.value })}
                    placeholder="MBBS"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">MBBS Passing Year *</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    placeholder="2025"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">University Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.universityName}
                    onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                    placeholder="University of Health Sciences"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Medical Council Registration Number *</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.medicalCouncilRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, medicalCouncilRegistrationNumber: e.target.value })}
                    placeholder="MCI-12345"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Home Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    placeholder="123, Doctor Lane, Medical City"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Foreign Graduate Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Foreign Graduate Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 transition-colors h-[46px]">
                <input
                  type="checkbox"
                  id="isForeignGraduate"
                  checked={formData.isForeignGraduate}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      isForeignGraduate: checked,
                      fmgeClearanceStatus: checked ? 'Cleared' : 'Not Applicable'
                    });
                  }}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="isForeignGraduate" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Is Foreign Graduate
                </label>
              </div>

              {formData.isForeignGraduate && (
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">FMGE Clearance Status *</label>
                  <select
                    value={formData.fmgeClearanceStatus}
                    onChange={(e) => setFormData({ ...formData, fmgeClearanceStatus: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Cleared">Cleared</option>
                    <option value="Failed">Failed</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Institution & Enrollment Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Program & Billing Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Course *</label>
                <select
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {courses.map(c => (
                    <option key={c.id || c._id} value={c.courseName}>{c.courseName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Batch *</label>
                <select
                  value={formData.batchName}
                  onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {batches.map(b => (
                    <option key={b.id || b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Course Director *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.courseDirector}
                    onChange={(e) => setFormData({ ...formData, courseDirector: e.target.value })}
                    placeholder="Dr. Director Name"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Enrollment Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Admission Date *</label>
                <input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Attached Credentials Documents */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Uploaded Credentials & Photo (Select a file to replace)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOC_FIELDS.map(({ key, urlKey, label, icon, isImage }) => {
                const currentUrl = student.documents?.[urlKey];
                const preview = docPreviews[key];
                return (
                  <div key={key} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2.5">
                    <div className="flex items-center gap-3">
                      {isImage ? (
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                          {preview ? (
                            <img src={preview} alt={label} className="w-full h-full object-cover" />
                          ) : currentUrl ? (
                            <img src={getDocUrl(currentUrl)} alt={label} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-lg">{icon}</span>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">{label}</span>
                        {currentUrl ? (
                          <a
                            href={getDocUrl(currentUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            View current file <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Not uploaded</span>
                        )}
                      </div>
                    </div>
                    <label className={`flex items-center gap-2 w-full px-3 py-2 bg-white border border-dashed border-slate-300 hover:border-blue-400 rounded-lg transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">
                        {docFiles[key] ? `Selected: ${docFiles[key].name}` : 'Choose file to upload'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.rtf,.txt,.odt,.ods,.odp,.csv,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.heic,.heif,.svg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files[0] || null;
                          handleDocChange(key, file);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>
                    {docFiles[key] && (
                      <button
                        type="button"
                        onClick={() => handleDocChange(key, null)}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                        disabled={isSubmitting}
                      >
                        Remove selection
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-500/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstituteStudentEditModal;
