import { Activity, BookOpen, Layers, GraduationCap, Users, CreditCard, FileText, Database, Ticket } from 'lucide-react';

const InstituteERPSidebar = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  setErrorBanner, 
  setSuccessBanner,

}) => {
  const handleTabClick = (tab) => {
    setErrorBanner(null);
    setSuccessBanner(null);
    setActiveTab(tab);
  };

  return (
    <aside className="w-68 bg-primary-900 border-r border-primary-800 flex flex-col flex-shrink-0 text-primary-200 font-sans select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>

      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-primary-800/80 bg-primary-950/40 gap-3 relative z-10">
        <div className="bg-gradient-to-tr from-primary-500 to-primary-400 p-1.5 rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center text-white font-extrabold text-sm">
            SI
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-black text-white tracking-wide drop-shadow-sm">SEMI Portal</span>
          <span className="text-[9px] text-primary-400 font-bold uppercase tracking-widest mt-0.5">Institution Console</span>
        </div>
      </div>
      
      {/* Logged in User Widget */}
      <div className="px-5 py-4 border-b border-primary-800/60 bg-primary-950/20 relative z-10">
        <span className="text-[8px] uppercase font-black text-primary-400 tracking-widest block text-left">Accredited Institute</span>
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 text-white flex items-center justify-center font-black text-xs shadow-md border border-primary-400/20">
            SI
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-primary-100 truncate">{user?.email || 'admin@saraswathi.edu.in'}</span>
            <span className="inline-flex w-fit mt-1 text-[8px] font-black uppercase text-primary-200 bg-primary-500/20 px-2 py-0.5 rounded-md border border-primary-500/30 tracking-wider">
              {user?.instituteName || 'Saraswathi Inst.'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto">
        <span className="text-[9px] uppercase font-black text-primary-500 px-3 tracking-widest block mb-3 text-left">Main Menu</span>
        
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <Activity className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'notifications'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <Activity className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'notifications' ? 'scale-110' : ''}`} />
          <span>Notifications</span>
        </button>
        
        <span className="text-[9px] uppercase font-black text-primary-500 px-3 tracking-widest block mt-5 mb-3 text-left">Manage</span>
        
        <button
          type="button"
          onClick={() => handleTabClick('courses')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'courses'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <CreditCard className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'fees' ? 'scale-110' : ''}`} />
          <span>Fees</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('remittance')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'remittance'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <CreditCard className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'remittance' ? 'scale-110' : ''}`} />
          <span>Academy Remittance</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('exams')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'exams'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
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
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <Ticket className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'hallTicket' ? 'scale-110' : ''}`} />
          <span>Hall Ticket</span>
        </button>

        <span className="text-[9px] uppercase font-black text-primary-500 px-3 tracking-widest block mt-5 mb-3 text-left">Post-Exam</span>

        <button
          type="button"
          onClick={() => handleTabClick('results')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'results'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <FileText className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'results' ? 'scale-110' : ''}`} />
          <span>Results</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('revaluation')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'revaluation'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
              : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
          }`}
        >
          <FileText className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'revaluation' ? 'scale-110' : ''}`} />
          <span>Revaluation</span>
        </button>
      </nav>
    </aside>
  );
};

export default InstituteERPSidebar;
