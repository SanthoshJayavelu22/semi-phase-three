import React from 'react';
import { Activity, BookOpen, Layers, GraduationCap, Users, CreditCard, FileText, Database, Ticket } from 'lucide-react';

const InstituteERPSidebar = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  setErrorBanner, 
  setSuccessBanner,
  handleLogout
}) => {
  const handleTabClick = (tab) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    setActiveTab(tab);
  };

  return (
    <aside className="w-68 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 font-sans select-none">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/20 gap-3">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-1.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
            SI
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-black text-white tracking-wide">SEMI Portal</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Institution Console</span>
        </div>
      </div>
      
      {/* Logged in User Widget */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-950/10">
        <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest block text-left">Accredited Institute</span>
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-md border border-indigo-400/20">
            SI
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-slate-200 truncate">{user?.email || 'admin@saraswathi.edu.in'}</span>
            <span className="inline-flex w-fit mt-1 text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 tracking-wider">
              {user?.instituteName || 'Saraswathi Inst.'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto">
        <span className="text-[9px] uppercase font-black text-slate-500 px-3 tracking-widest block mb-3 text-left">Main Menu</span>
        
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <Activity className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span>Dashboard</span>
        </button>
        
        <span className="text-[9px] uppercase font-black text-slate-500 px-3 tracking-widest block mt-5 mb-3 text-left">Manage</span>
        
        <button
          type="button"
          onClick={() => handleTabClick('courses')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'courses'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <BookOpen className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'courses' ? 'scale-110' : ''}`} />
          <span>Courses</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('batches')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'batches'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <Layers className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'batches' ? 'scale-110' : ''}`} />
          <span>Batches</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('enrollment')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'enrollment'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <GraduationCap className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'enrollment' ? 'scale-110' : ''}`} />
          <span>Students Enrollment</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('students')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'students'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <Users className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'students' ? 'scale-110' : ''}`} />
          <span>Students List</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('studentDetails')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'studentDetails'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <Database className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'studentDetails' ? 'scale-110' : ''}`} />
          <span>Student details</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('fees')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'fees'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <CreditCard className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'fees' ? 'scale-110' : ''}`} />
          <span>Fees</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('exams')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'exams'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <FileText className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'exams' ? 'scale-110' : ''}`} />
          <span>Exam Application</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('hallTicket')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'hallTicket'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
              : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
          }`}
        >
          <Ticket className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'hallTicket' ? 'scale-110' : ''}`} />
          <span>Hall Ticket</span>
        </button>
      </nav>
    </aside>
  );
};

export default InstituteERPSidebar;
