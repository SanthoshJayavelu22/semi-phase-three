import React, { useState, useMemo, useEffect } from 'react';
import { Search, ClipboardList, CheckCircle2, XCircle, Clock, Eye, Calendar, UserCheck, Check, AlertTriangle, BookOpen, GraduationCap, X, Send, MapPin, Filter, ShieldCheck, AlertCircle, ExternalLink, IndianRupee, HelpCircle, FileText } from 'lucide-react';
import { getUploadUrl } from '../../../api/apiClient';
import examService from '../../../api/exams';

const AcademyEligibility = ({ 
  examApplications = [], 
  fetchBoardData,
  setErrorMsg,
  setSuccessMsg
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Review Modal State
  const [reviewingApp, setReviewingApp] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [scheduledDate, setScheduledDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  // Publish Schedule Modal State
  const [publishingApp, setPublishingApp] = useState(null);
  const [pubVenue, setPubVenue] = useState('');
  const [pubCenter, setPubCenter] = useState('');
  const [pubReportingTime, setPubReportingTime] = useState('');
  const [pubDate, setPubDate] = useState('');
  const [pubSubjectSchedules, setPubSubjectSchedules] = useState([]);
  const [pubLoading, setPubLoading] = useState(false);

  // Filter lists
  const filteredList = useMemo(() => {
    return examApplications.filter(app => {
      const matchSearch = 
        (app.institute?.orgName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.course?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.semesterNumber ? `Semester ${app.semesterNumber}` : '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const appStatus = app.status || 'Pending';
      const matchFilter = statusFilter === 'All' || appStatus === statusFilter;

      return matchSearch && matchFilter;
    });
  }, [examApplications, searchQuery, statusFilter]);

  // Open Review Dialog
  const handleOpenReview = (app) => {
    setReviewingApp(app);
    setReviewStatus(app.status === 'Pending' ? 'Approved' : app.status);
    setScheduledDate(app.scheduledDate ? new Date(app.scheduledDate).toISOString().split('T')[0] : '');
    setRemarks(app.remarks || '');
  };

  // Submit Review Decision
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingApp) return;

    if (reviewStatus === 'Approved' && !scheduledDate) {
      setErrorMsg("A scheduled exam date is required to approve the application.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: reviewStatus,
        scheduledDate: reviewStatus === 'Approved' ? scheduledDate : undefined,
        remarks: remarks.trim() || undefined
      };

      await examService.reviewExamApplication(reviewingApp._id || reviewingApp.id, payload);
      
      setSuccessMsg(`Exam application has been successfully ${reviewStatus.toLowerCase()}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setReviewingApp(null);

      // Reload applications list in the parent context
      if (fetchBoardData) {
        await fetchBoardData();
      }
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.message || 'Failed to submit review decision.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublish = (app) => {
    setPublishingApp(app);
    setPubDate(app.scheduledDate ? new Date(app.scheduledDate).toISOString().split('T')[0] : '');
    setPubVenue(app.examVenue || '');
    setPubCenter(app.examCenter || '');
    setPubReportingTime(app.reportingTime || '');
    
    if (app.subjectSchedules && app.subjectSchedules.length > 0) {
       setPubSubjectSchedules(app.subjectSchedules.map(s => ({...s, date: new Date(s.date).toISOString().split('T')[0]})));
    } else {
       const courseSubjects = app.course?.subjects || app.subjects || [];
       setPubSubjectSchedules(courseSubjects.map(subject => ({ subject, date: '', time: '' })));
    }
  };

  // Submit Publish Schedule
  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!publishingApp) return;
    if (!pubVenue || !pubCenter || !pubReportingTime) {
      setErrorMsg('Venue, exam center, and reporting time are all required.');
      return;
    }
    setPubLoading(true);
    try {
      await examService.publishExamSchedule(publishingApp._id || publishingApp.id, {
        examVenue: pubVenue,
        examCenter: pubCenter,
        reportingTime: pubReportingTime,
        scheduledDate: pubDate || undefined,
        subjectSchedules: pubSubjectSchedules
      });
      setSuccessMsg('Exam schedule published! Institute can now generate hall tickets.');
      setTimeout(() => setSuccessMsg(null), 4000);
      setPublishingApp(null);
      if (fetchBoardData) await fetchBoardData();
    } catch (err) {
      setErrorMsg(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to publish schedule.');
    } finally {
      setPubLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Exam Application Requests</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Review and schedule student examinations submitted by institutions
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications...."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                statusFilter === 'Pending'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'Approved' ? 'All' : 'Approved')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
              }`}
            >
              Approved (Pending Publish)
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'SchedulePublished' ? 'All' : 'SchedulePublished')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                statusFilter === 'SchedulePublished'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/70'
              }`}
            >
              Published Schedules
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'Rejected' ? 'All' : 'Rejected')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/70'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-inner bg-slate-50/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Institute</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Course</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Semester</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Students</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Exam Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/60 text-xs font-bold text-slate-700 bg-white">
              {filteredList.length > 0 ? (
                filteredList.map((app, idx) => {
                  const status = app.status || 'Pending';
                  const dateText = app.scheduledDate 
                    ? new Date(app.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'Unscheduled';
                  
                  return (
                    <tr key={app._id || app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-center text-[10px] text-gray-400 font-extrabold">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">{app.institute?.orgName || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{app.course?.name || 'MBBS'}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">{app.semesterNumber ? `Semester ${app.semesterNumber}` : 'N/A'}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-900">{app.students?.length || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider font-black border ${
                          status === 'Approved' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                            : status === 'Rejected' 
                              ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                              : status === 'SchedulePublished'
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                        }`}>
                          {status === 'Approved' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : status === 'Rejected' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          ) : status === 'SchedulePublished' ? (
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {status === 'SchedulePublished' ? 'Schedule Published' : status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${app.scheduledDate ? 'text-indigo-600' : 'text-slate-400 font-normal'}`}>{dateText}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {status === 'Pending' && (
                            <button
                              onClick={() => handleOpenReview(app)}
                              className="px-3 py-1.5 text-[10px] uppercase font-black tracking-wider bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 transition-all active:scale-95 cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                          {status === 'Approved' && (
                            <button
                              onClick={() => handleOpenPublish(app)}
                              className="px-3 py-1.5 text-[10px] uppercase font-black tracking-wider bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 transition-all active:scale-95 cursor-pointer"
                            >
                              Publish Schedule
                            </button>
                          )}
                          {status === 'SchedulePublished' && (
                            <span className="text-[9px] text-blue-600 font-black uppercase tracking-wider">Published ✓</span>
                          )}
                          {status === 'Rejected' && (
                            <span className="text-[9px] text-rose-500 font-black uppercase tracking-wider">Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-gray-400 font-medium">
                    <ClipboardList className="w-10 h-10 mx-auto text-gray-300 mb-4 stroke-1 animate-pulse" />
                    <p className="text-sm font-bold text-slate-500">No exam applications requests found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Adjust filters or search parameters and try again</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW DIALOG MODAL */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col scale-in-center">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Audit Exam Application</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Review scheduling request</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setReviewingApp(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-5 text-xs text-slate-600">
              
              {/* Request Details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Submitted By</span>
                    <span className="text-slate-800 font-extrabold text-xs block mt-0.5">{reviewingApp.institute?.orgName || 'Institute'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Course Program</span>
                    <span className="text-slate-800 font-bold block mt-0.5">{reviewingApp.course?.name || 'MBBS'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-2.5">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold block mt-0.5">{reviewingApp.semesterNumber ? `Semester ${reviewingApp.semesterNumber}` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Enrolled Candidates</span>
                    <span className="text-indigo-600 font-mono font-black block text-xs mt-0.5">{reviewingApp.students?.length || 0} Students</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-2.5">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">UTR Number</span>
                    <span className="text-slate-800 font-mono font-bold block text-xs mt-0.5">{reviewingApp.utrNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Exam Fee Receipt</span>
                    {reviewingApp.examFeeReceiptUrl ? (
                      <a 
                        href={getUploadUrl(reviewingApp.examFeeReceiptUrl)}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-bold block text-xs mt-0.5 underline"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-slate-400 font-semibold block text-xs mt-0.5">Not Provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Decision Selector */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2">Audit Decision</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Approved')}
                    className={`p-3.5 rounded-2xl border font-black uppercase text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'Approved'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm'
                        : 'border-slate-250 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className={`w-4.5 h-4.5 ${reviewStatus === 'Approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    Approve & Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Rejected')}
                    className={`p-3.5 rounded-2xl border font-black uppercase text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      reviewStatus === 'Rejected'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-800 shadow-sm'
                        : 'border-slate-255 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <XCircle className={`w-4.5 h-4.5 ${reviewStatus === 'Rejected' ? 'text-rose-600' : 'text-slate-400'}`} />
                    Reject Application
                  </button>
                </div>
              </div>

              {/* Scheduled Date Field - ONLY shown and required if Approved */}
              {reviewStatus === 'Approved' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-3 duration-200">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400">Scheduled Examination Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      min={new Date().toISOString().split('T')[0]} // Block historical dates
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs"
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400">Select the official schedule date to publish to the Institute portal.</span>
                </div>
              )}

              {/* Audit Remarks */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Remarks / Board Feedback</label>
                <textarea
                  placeholder="Enter remarks or grounds for review decision..."
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingApp(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH SCHEDULE MODAL */}
      {publishingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col scale-in-center">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Publish Exam Schedule</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fill in venue details to publish to institute</p>
                </div>
              </div>
              <button type="button" onClick={() => setPublishingApp(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 text-xs text-slate-600">
              {/* Info summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Institute</span>
                    <span className="text-slate-800 font-extrabold text-xs">{publishingApp.institute?.orgName || 'Institute'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Course</span>
                    <span className="text-slate-800 font-bold">{publishingApp.course?.name || 'Course'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-2">
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Semester</span>
                    <span className="text-slate-800 font-bold">{publishingApp.semesterNumber ? `Semester ${publishingApp.semesterNumber}` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-wider">Students</span>
                    <span className="text-indigo-600 font-black">{publishingApp.students?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Exam Venue *</label>
                <input
                  type="text"
                  required
                  value={pubVenue}
                  onChange={(e) => setPubVenue(e.target.value)}
                  placeholder="e.g. SEMI Examination Hall, Chennai"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Exam Center */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Exam Center *</label>
                <input
                  type="text"
                  required
                  value={pubCenter}
                  onChange={(e) => setPubCenter(e.target.value)}
                  placeholder="e.g. Government Medical College Auditorium"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Reporting Time */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Reporting Time *</label>
                <input
                  type="text"
                  required
                  value={pubReportingTime}
                  onChange={(e) => setPubReportingTime(e.target.value)}
                  placeholder="e.g. 8:30 AM"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Subject wise schedule */}
              {pubSubjectSchedules.length > 0 && (
                <div className="pt-2">
                  <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2">Subject Schedules *</label>
                  <div className="space-y-3">
                    {pubSubjectSchedules.map((schedule, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 p-3 border border-slate-100 rounded-xl">
                        <div className="flex-1 font-bold text-xs text-slate-700">{schedule.subject}</div>
                        <input
                          type="date"
                          required
                          value={schedule.date}
                          onChange={(e) => {
                            const newSchedules = [...pubSubjectSchedules];
                            newSchedules[idx].date = e.target.value;
                            setPubSubjectSchedules(newSchedules);
                          }}
                          className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Time (e.g. 10:00 AM)"
                          value={schedule.time}
                          onChange={(e) => {
                            const newSchedules = [...pubSubjectSchedules];
                            newSchedules[idx].time = e.target.value;
                            setPubSubjectSchedules(newSchedules);
                          }}
                          className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Date (optional update) */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1.5">Exam Date (Optional Update)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={pubDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPubDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Leave blank to keep current scheduled date</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPublishingApp(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pubLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  {pubLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <MapPin className="w-3.5 h-3.5" />
                  )}
                  Publish Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyEligibility;
