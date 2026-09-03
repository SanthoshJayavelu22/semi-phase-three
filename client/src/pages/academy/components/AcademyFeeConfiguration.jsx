import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, BadgeCheck, BadgeX } from 'lucide-react';
import academicService from '../../../api/academic';
import Toast from '../../../Components/Toast';

const AcademyFeeConfiguration = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedExamination, setSelectedExamination] = useState(1);
  const [config, setConfig] = useState({
    firstAttemptFee: 0,
    reappearingFee: 0,
    feeApplicableForFirstAttempt: false,
  });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await academicService.getCourses();
        const data = res?.data?.data || res?.data || [];
        if (Array.isArray(data)) setCourses(data);
      } catch (err) {
        setToast({ message: err?.parsedMessage || err?.message || 'Failed to load courses', type: 'error' });
      }
    };
    fetchCourses();
  }, []);

  const fetchConfiguration = async (courseId, examination) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await academicService.getFeeConfiguration(courseId, examination);
      const data = res?.data?.data || res?.data || res;
      if (data) {
        setConfig({
          firstAttemptFee: Number(data.firstAttemptFee) || 0,
          reappearingFee: Number(data.reappearingFee) || 0,
          feeApplicableForFirstAttempt: Boolean(data.feeApplicableForFirstAttempt),
        });
      }
    } catch (err) {
      setToast({ message: err?.parsedMessage || err?.message || 'Failed to load configuration', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId && selectedExamination) {
      fetchConfiguration(selectedCourseId, selectedExamination);
    }
  }, [selectedCourseId, selectedExamination]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedExamination(1);
  };

  const firstAttemptCharged = config.feeApplicableForFirstAttempt && config.firstAttemptFee > 0;

  const handleSave = async () => {
    if (!selectedCourseId) {
      setToast({ message: 'Please select a course', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await academicService.updateFeeConfiguration({
        courseId: selectedCourseId,
        examinationNumber: selectedExamination,
        ...config,
      });
      setToast({ message: 'Exam fee configuration saved successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err?.parsedMessage || err?.message || 'Failed to save configuration', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-300 font-sans">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Exam Fee Configuration</h2>
          <p className="text-xs text-gray-400 font-semibold mt-1">
            Set, waive, or charge examination fees for first-time and reappearing students
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">Course *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1.5">Examination</label>
            <select
              value={selectedExamination}
              onChange={(e) => setSelectedExamination(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
            >
              {[1, 2].map((exam) => (
                <option key={exam} value={exam}>
                  Examination {exam}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
          {/* First Attempt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-black tracking-wider text-gray-500">
                First Attempt Fee (₹)
              </label>
              {config.firstAttemptFee > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[9px] uppercase font-black">
                  <BadgeCheck className="w-3 h-3" /> Charged
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] uppercase font-black">
                  <BadgeX className="w-3 h-3" /> Waived
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
              <input
                type="number"
                min="0"
                value={config.firstAttemptFee}
                onChange={(e) => setConfig({ ...config, firstAttemptFee: parseInt(e.target.value) || 0 })}
                className="w-full pl-7 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.feeApplicableForFirstAttempt}
                onChange={(e) => setConfig({ ...config, feeApplicableForFirstAttempt: e.target.checked })}
                className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-bold text-blue-900">
                Charge first-attempt students (instead of waiving)
              </span>
            </label>
            <p className="text-[10px] text-gray-400">
              Set fee to <span className="font-bold">0</span> (or untick above) to waive exam fees for first-time candidates.
            </p>
          </div>

          {/* Reappearing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase font-black tracking-wider text-gray-500">
                Reappearing Fee (₹)
              </label>
              {config.reappearingFee > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] uppercase font-black">
                  <BadgeCheck className="w-3 h-3" /> Charged
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] uppercase font-black">
                  <BadgeX className="w-3 h-3" /> Waived
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
              <input
                type="number"
                min="0"
                value={config.reappearingFee}
                onChange={(e) => setConfig({ ...config, reappearingFee: parseInt(e.target.value) || 0 })}
                className="w-full pl-7 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400">
              Set fee to <span className="font-bold">0</span> to waive exam fees for reappearing candidates.
            </p>
          </div>
        </div>

        {/* Live summary */}
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-2">
          <span className="block text-[9px] uppercase font-black tracking-wider text-indigo-400">Live Status</span>
          <ul className="text-xs font-bold text-slate-700 space-y-1">
            <li className="flex items-center gap-2">
              {firstAttemptCharged ? (
                <BadgeCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <BadgeX className="w-4 h-4 text-emerald-600" />
              )}
              First-time candidates: {firstAttemptCharged ? `₹${config.firstAttemptFee.toLocaleString()} payable` : 'No fee (Free)'}
            </li>
            <li className="flex items-center gap-2">
              {config.reappearingFee > 0 ? (
                <BadgeCheck className="w-4 h-4 text-amber-600" />
              ) : (
                <BadgeX className="w-4 h-4 text-emerald-600" />
              )}
              Reappearing candidates: {config.reappearingFee > 0 ? `₹${config.reappearingFee.toLocaleString()} payable` : 'No fee (Free)'}
            </li>
          </ul>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !selectedCourseId}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Working...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
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

export default AcademyFeeConfiguration;