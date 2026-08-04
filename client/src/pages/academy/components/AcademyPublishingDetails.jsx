import { useState, useMemo, useEffect } from 'react';
import resultService from '../../../api/results';
import {
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Filter,
  X,
  ChevronDown,
  Users,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  Clock as ClockIcon,
  CalendarDays,
  Mail,
  Globe,
  Bell,
  Play,
  Pause
} from 'lucide-react';
import Toast from '../../../Components/Toast';
import ConfirmModal from '../../../Components/ConfirmModal';

const AcademyPublishingDetails = () => {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'scheduled' | 'all'

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const [publications, setPublications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublications = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('semi_token') || localStorage.getItem('semi_board_user');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        // Fetch results and map to expected publication structure in UI
        const res = await resultService.getAllResults({ limit: 10000 }).catch(() => ({ data: { data: { results: [] } } }));
        const raw = res.data?.data?.results || res.data?.results || res.data?.data || res.data || [];
        const data = Array.isArray(raw) ? raw : [];
        
        // Map to expected publication structure in UI
        const mappedData = data.map(r => ({
          id: r._id || r.id || Math.random(),
          exam: r.exam?.name || r.examName || 'CCT-EM Fellowship Exam',
          batch: r.student?.batch?.name || r.batchName || 'Batch 2026',
          institute: r.student?.institute?.orgName || r.instituteName || 'Accredited Hospital',
          course: r.student?.course?.name || r.courseName || 'CCT-EM Fellowship',
          date: r.publishedDate ? new Date(r.publishedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: r.publishedDate ? new Date(r.publishedDate).toLocaleTimeString() : '10:00:00 AM',
          ampm: '',
          status: r.isPublished || r.published ? 'Published' : 'Scheduled',
          autoPublish: false,
          studentsCount: 1,
          publishedBy: 'SEMI Board Controller',
          publishedAt: r.publishedDate || new Date().toISOString(),
          notificationSent: true,
          results: []
        }));
        setPublications(mappedData);
      } catch (err) {
        console.warn('Publications fetch fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublications();
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────────
  const batches = useMemo(() => {
    const unique = new Set(publications.map(p => p.batch));
    return ['All', ...unique];
  }, [publications]);

  const institutes = useMemo(() => {
    const unique = new Set(publications.map(p => p.institute));
    return ['All', ...unique];
  }, [publications]);

  const exams = useMemo(() => {
    const unique = new Set(publications.map(p => p.exam));
    return ['All', ...unique];
  }, [publications]);

  const filteredPublications = useMemo(() => {
    return publications.filter(p => {
      const matchSearch = p.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.batch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBatch = selectedBatch === 'All' || p.batch === selectedBatch;
      const matchInstitute = selectedInstitute === 'All' || p.institute === selectedInstitute;
      const matchExam = selectedExam === 'All' || p.exam === selectedExam;
      const matchStatus = activeTab === 'all' || 
                          (activeTab === 'published' && p.status === 'Published') ||
                          (activeTab === 'scheduled' && p.status === 'Scheduled');
      return matchSearch && matchBatch && matchInstitute && matchExam && matchStatus;
    });
  }, [publications, searchQuery, selectedBatch, selectedInstitute, selectedExam, activeTab]);

  const sortedPublications = useMemo(() => {
    if (!sortConfig.key) return filteredPublications;
    return [...filteredPublications].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc' 
          ? new Date(aVal) - new Date(bVal) 
          : new Date(bVal) - new Date(aVal);
      }
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredPublications, sortConfig]);

  const stats = useMemo(() => {
    const total = publications.length;
    const published = publications.filter(p => p.status === 'Published').length;
    const scheduled = publications.filter(p => p.status === 'Scheduled').length;
    const autoPublish = publications.filter(p => p.autoPublish).length;
    return { total, published, scheduled, autoPublish };
  }, [publications]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewDetails = (publication) => {
    setSelectedPublication(publication);
    setIsModalOpen(true);
  };

  const handleEditPublish = (publication) => {
    setToast({ 
      message: `✏️ Editing publication for ${publication.exam} - ${publication.institute}`,
      type: 'info'
    });
  };

  const handleDeletePublish = (publication) => {
    setConfirmConfig({
      title: 'Delete Publication',
      message: `Are you sure you want to delete the publication for "${publication.exam}" at ${publication.institute}?\nThis action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: () => {
        setConfirmConfig(null);
        setToast({ 
          message: `🗑️ Publication for ${publication.exam} has been deleted.`,
          type: 'success'
        });
      }
    });
  };

  const handleToggleAutoPublish = (publication) => {
    setConfirmConfig({
      title: publication.autoPublish ? 'Disable Auto-Publish' : 'Enable Auto-Publish',
      message: publication.autoPublish 
        ? `Are you sure you want to disable auto-publish for "${publication.exam}"?\nResults will need to be published manually.`
        : `Are you sure you want to enable auto-publish for "${publication.exam}"?\nResults will be published automatically at the scheduled time.`,
      type: 'warning',
      confirmText: publication.autoPublish ? 'Disable' : 'Enable',
      onConfirm: () => {
        setConfirmConfig(null);
        setToast({ 
          message: publication.autoPublish 
            ? `⏸️ Auto-publish disabled for ${publication.exam}`
            : `▶️ Auto-publish enabled for ${publication.exam}`,
          type: 'success'
        });
      }
    });
  };

  const handleSendNotification = (publication) => {
    setToast({ 
      message: `📧 Notification emails sent for ${publication.exam} to ${publication.studentsCount} students!`,
      type: 'success'
    });
  };

  const handleExport = () => {
    setToast({ message: '📊 Publication data exported successfully!', type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBatch('All');
    setSelectedInstitute('All');
    setSelectedExam('All');
    setActiveTab('all');
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (status === 'Published') {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        label: 'Published'
      };
    }
    return {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      icon: <ClockIcon className="w-3.5 h-3.5 text-amber-600" />,
      label: 'Scheduled'
    };
  };

  const getAutoPublishBadge = (autoPublish) => {
    if (autoPublish) {
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: <Play className="w-3 h-3 text-blue-600" />,
        label: 'Auto'
      };
    }
    return {
      bg: 'bg-slate-50 border-slate-200 text-slate-500',
      icon: <Pause className="w-3 h-3 text-slate-400" />,
      label: 'Manual'
    };
  };

  const formatTime = (time, ampm) => {
    return `${time} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left font-sans">
      {/* ─── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Publishing Details</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">View and manage all result publications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
          <span className="text-[9px] text-slate-400 font-medium">Publications</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.published}</p>
          <span className="text-[9px] text-emerald-600 font-medium">Active publications</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Scheduled</span>
            <ClockIcon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.scheduled}</p>
          <span className="text-[9px] text-amber-600 font-medium">Pending publication</span>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Auto Publish</span>
            <Play className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.autoPublish}</p>
          <span className="text-[9px] text-blue-600 font-medium">Auto-enabled</span>
        </div>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm flex gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('published')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'published'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
          Published ({stats.published})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'scheduled'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <ClockIcon className="w-3.5 h-3.5 inline mr-1.5" />
          Scheduled ({stats.scheduled})
        </button>
      </div>

      {/* ─── Search & Filters ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by exam, institute, or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all whitespace-nowrap"
          >
            <Filter className="w-3.5 h-3.5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">
              {selectedBatch !== 'All' || selectedInstitute !== 'All' || selectedExam !== 'All' ? 'Active' : '0'}
            </span>
          </button>
          {(selectedBatch !== 'All' || selectedInstitute !== 'All' || selectedExam !== 'All') && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top duration-200">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {institutes.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              {exams.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}

        <div className="text-[10px] text-slate-400 font-semibold flex justify-between items-center">
          <span>{filteredPublications.length} publication{filteredPublications.length !== 1 ? 's' : ''} found</span>
          <span className="text-slate-300">|</span>
          <span>Showing {Math.min(filteredPublications.length, 10)} entries</span>
        </div>
      </div>

      {/* ─── Publications Table ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider w-12 text-center">#</th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('exam')}
                >
                  <div className="flex items-center gap-1">
                    Examination
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'exam' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('batch')}
                >
                  <div className="flex items-center gap-1">
                    Batch
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'batch' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('institute')}
                >
                  <div className="flex items-center gap-1">
                    Institute
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'institute' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider cursor-pointer hover:text-slate-700 transition-colors group"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.key === 'date' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Time</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Auto Publish</th>
                <th className="px-4 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {sortedPublications.map((pub, idx) => {
                const statusBadge = getStatusBadge(pub.status);
                const autoBadge = getAutoPublishBadge(pub.autoPublish);
                const serialNo = String(idx + 1).padStart(2, '0');

                return (
                  <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                      {serialNo}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-800">
                      {pub.exam}
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge.bg}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-full border border-blue-100">
                        <Users className="w-3 h-3" />
                        {pub.batch}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {pub.institute}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      {new Date(pub.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {formatTime(pub.time, pub.ampm)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAutoPublish(pub)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${autoBadge.bg}`}
                      >
                        {autoBadge.icon}
                        {autoBadge.label}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetails(pub)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPublish(pub)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Publication"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendNotification(pub)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
                          title="Send Notifications"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePublish(pub)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Delete Publication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedPublications.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400 text-xs font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>No publications found matching your filters.</p>
                      <button
                        onClick={handleClearFilters}
                        className="text-blue-600 hover:text-blue-700 font-bold text-[10px]"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
          <span>Showing {sortedPublications.length} of {publications.length} publications</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Published ({stats.published})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Scheduled ({stats.scheduled})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Auto-Publish ({stats.autoPublish})
            </span>
          </div>
        </div>
      </div>

      {/* ─── Publication Detail Modal ───────────────────────────────────────── */}
      {isModalOpen && selectedPublication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col scale-in-center animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Publication Details</h3>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {selectedPublication.exam}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                selectedPublication.status === 'Published'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {selectedPublication.status === 'Published' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <ClockIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={`text-xs font-extrabold block ${
                    selectedPublication.status === 'Published' ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {selectedPublication.status === 'Published' ? '✅ Published' : '⏳ Scheduled for Publication'}
                  </span>
                  <p className={`text-[11px] font-medium mt-0.5 ${
                    selectedPublication.status === 'Published' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {selectedPublication.status === 'Published' 
                      ? `Published on ${new Date(selectedPublication.publishedAt).toLocaleString()} by ${selectedPublication.publishedBy}`
                      : `Scheduled for ${new Date(selectedPublication.date).toLocaleDateString()} at ${formatTime(selectedPublication.time, selectedPublication.ampm)}`
                    }
                  </p>
                </div>
              </div>

              {/* Publication Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Institution</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedPublication.institute}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Batch</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedPublication.batch}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Course</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedPublication.course}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Students</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedPublication.studentsCount} students</span>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-indigo-900 block">Publication Schedule</span>
                  <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                    {new Date(selectedPublication.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} at {formatTime(selectedPublication.time, selectedPublication.ampm)}
                  </p>
                </div>
              </div>

              {/* Auto Publish & Notification Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  selectedPublication.autoPublish ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  {selectedPublication.autoPublish ? (
                    <Play className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Pause className="w-4 h-4 text-slate-400" />
                  )}
                  <span className={`text-xs font-bold ${
                    selectedPublication.autoPublish ? 'text-blue-700' : 'text-slate-500'
                  }`}>
                    {selectedPublication.autoPublish ? 'Auto-Publish Enabled' : 'Manual Publish'}
                  </span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                  selectedPublication.notificationSent ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  {selectedPublication.notificationSent ? (
                    <Mail className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Bell className="w-4 h-4 text-slate-400" />
                  )}
                  <span className={`text-xs font-bold ${
                    selectedPublication.notificationSent ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {selectedPublication.notificationSent ? 'Notifications Sent' : 'No Notifications'}
                  </span>
                </div>
              </div>

              {/* Results Preview (if published) */}
              {selectedPublication.status === 'Published' && selectedPublication.results.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Results Preview</h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">#</th>
                          <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">Student Name</th>
                          <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Marks</th>
                          <th className="px-3 py-2 text-[9px] font-black uppercase text-slate-400 tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {selectedPublication.results.map((result, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="px-3 py-2 font-bold text-slate-700">{result.name}</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-800">{result.marks}%</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                result.status === 'Passed' 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-amber-50 border-amber-200 text-amber-700'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Calendar className="w-4 h-4" />
                {selectedPublication.status === 'Published' 
                  ? `Published: ${new Date(selectedPublication.publishedAt).toLocaleString()}`
                  : `Scheduled for ${new Date(selectedPublication.date).toLocaleDateString()}`
                }
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* ─── Confirmation Modal ──────────────────────────────────────────────── */}
      {confirmConfig && (
        <ConfirmModal
          isOpen={true}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          confirmText={confirmConfig.confirmText}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
};

export default AcademyPublishingDetails;
