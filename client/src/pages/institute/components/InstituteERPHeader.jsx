import React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

const InstituteERPHeader = ({ activeTab, user, appForm, handleLogout }) => {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'courses': return 'Courses';
      case 'batches': return 'Batches';
      case 'enrollment': return 'Students Enrollment';
      case 'students': return 'Students List';
      case 'fees': return 'Fees';
      case 'exams': return 'Exam Application';
      case 'hallTicket': return 'Hall Ticket';
      case 'studentDetails': return 'Student details';
      default: return 'Dashboard';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'IN';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = appForm?.orgName || user?.instituteName || user?.name || 'Institute Profile';

  return (
    <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 flex-shrink-0 select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
        <span className="hover:text-slate-600 cursor-pointer transition-colors">Home</span>
        <span>/</span>
        <span className="text-slate-800 font-bold">{getTabLabel()}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Profile info dropdown */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-[11px] shadow-inner">
            {getInitials(displayName)}
          </div>
          <span className="text-xs font-bold text-slate-700">
            {displayName}
          </span>
        </div>

        <div className="h-6 w-[1px] bg-slate-100 mx-1"></div>

        {/* Logout Button */}
        {handleLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all text-xs font-bold border border-slate-100 hover:border-rose-100 cursor-pointer"
            title="Logout Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default InstituteERPHeader;
