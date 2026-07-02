import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Book, Calendar, Shield, MapPin, Award, Building2, ExternalLink, CreditCard, Landmark, FileText } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';

const InstituteStudentEditModal = ({ student, isOpen, onClose, onSave, courses, batches }) => {
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
    utrNumber: '',
  });

  const [error, setError] = useState(null);

  useEffect(() => {
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
        utrNumber: student.utrNumber || '',
      });
      setError(null);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.enrollmentNo) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Phone Number must be a valid 10-digit number.');
      return;
    }
    if (formData.phone.includes('-')) {
      setError('Contact Number cannot be negative.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format.');
      return;
    }
    onSave({
      ...student,
      ...formData
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full flex flex-col overflow-hidden max-h-[90vh] scale-in-center animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Edit Fellow Details</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Update student profile, academic metrics & documents</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {error && (
            <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Basic Profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Enrollment ID */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Email */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Phone */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic & Registration Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Academic & Registration Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Qualification */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Accredited Qualification *</label>
                <div className="relative">
                  <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  >
                    <option value="MD Emergency Medicine">MD Emergency Medicine</option>
                    <option value="DNB Emergency Medicine">DNB Emergency Medicine</option>
                    <option value="MEM (Emergency Medicine)">MEM (Emergency Medicine)</option>
                  </select>
                </div>
              </div>

              {/* MBBS Qualification */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Graduation Year */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* University Name */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Medical Council Registration Number */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Home Address */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Home Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    required
                    rows={2}
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                    placeholder="123, Doctor Lane, Medical City"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Foreign Graduate Details */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Foreign Graduate Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              {/* Checkbox */}
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
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isForeignGraduate" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Is Foreign Graduate
                </label>
              </div>

              {/* FMGE Clearance Status */}
              {formData.isForeignGraduate && (
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">FMGE Clearance Status *</label>
                  <select
                    value={formData.fmgeClearanceStatus}
                    onChange={(e) => setFormData({ ...formData, fmgeClearanceStatus: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
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
              {/* Course */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Course *</label>
                <select
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                >
                  {courses.map(c => (
                    <option key={c.id || c._id} value={c.courseName}>{c.courseName}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Batch *</label>
                <select
                  value={formData.batchName}
                  onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                >
                  {batches.map(b => (
                    <option key={b.id || b._id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Course Director */}
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* UTR Number */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">UTR / Txn Number *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.utrNumber}
                    onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                    placeholder="UTR123456789"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Enrollment Status */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Enrollment Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Admission Date */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1.5">Admission Date *</label>
                <input
                  type="date"
                  required
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Attached Credentials Documents */}
          {student.documents && Object.keys(student.documents).some(key => student.documents[key]) && (
            <div className="space-y-4 pt-2">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100 pb-1.5 mb-3">Submitted Credentials (View Only)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
                {student.documents.passportPhotoUrl && (
                  <a 
                    href={getDocUrl(student.documents.passportPhotoUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">📷</span>
                    <span className="truncate">Candidate Passport Photo</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.mbbsCertificateUrl && (
                  <a 
                    href={getDocUrl(student.documents.mbbsCertificateUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">📄</span>
                    <span className="truncate">MBBS Degree Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.medicalCouncilRegistrationCertificateUrl && (
                  <a 
                    href={getDocUrl(student.documents.medicalCouncilRegistrationCertificateUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">📜</span>
                    <span className="truncate">Medical Council Certificate</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.fmgeResultCopyUrl && (
                  <a 
                    href={getDocUrl(student.documents.fmgeResultCopyUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">📝</span>
                    <span className="truncate">FMGE Screening Result</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.paymentReceiptUrl && (
                  <a 
                    href={getDocUrl(student.documents.paymentReceiptUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">💳</span>
                    <span className="truncate">Enrollment Payment Receipt</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.semiMembershipFormUrl && (
                  <a 
                    href={getDocUrl(student.documents.semiMembershipFormUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">🗳️</span>
                    <span className="truncate">SEMI Membership Form</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
                {student.documents.thesisDocumentUrl && (
                  <a 
                    href={getDocUrl(student.documents.thesisDocumentUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all"
                  >
                    <span className="text-base">📑</span>
                    <span className="truncate">Thesis Document</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstituteStudentEditModal;
