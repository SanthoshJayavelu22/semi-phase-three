import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, ClipboardCheck, UserCheck, LogOut, ClipboardList } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     path: '/academy/dashboard',     label: 'Dashboard',                Icon: LayoutDashboard },
  { id: 'applications',  path: '/academy/applications',  label: 'Institutional Applications', Icon: Building2 },
  { id: 'students',      path: '/academy/students',      label: 'Students list',             Icon: Users },
  { id: 'eligibility',   path: '/academy/eligibility',   label: 'Exam Approvals',            Icon: ClipboardList },
  { id: 'verification',  path: '/academy/verification',  label: 'Eligibility Verification',  Icon: UserCheck },
];

const AcademySidebar = ({ boardUser, handleLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="w-68 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 font-sans select-none">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/20 gap-3">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-1.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
            SE
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-black text-white tracking-wide">SEMI Academy</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Governance Console</span>
        </div>
      </div>
      
      {/* Logged in User Widget */}
      <div className="px-5 py-4 border-b border-slate-800/60 bg-slate-950/10">
        <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest block text-left">Authorized Auditor</span>
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-black text-xs shadow-md border border-indigo-400/20">
            SA
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-slate-200 truncate">{boardUser?.email || 'board@semi.org.in'}</span>
            <span className="inline-flex w-fit mt-1 text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 tracking-wider">
              {boardUser?.role === 'board' ? 'Board Member' : boardUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <nav className="flex-grow px-4 py-6 space-y-1 overflow-y-auto">
        <span className="text-[9px] uppercase font-black text-slate-500 px-3 tracking-widest block mb-3 text-left">Navigation</span>
        
        {NAV_ITEMS.map(({ id, path, label, Icon }) => {
          const isActive = pathname === path;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 translate-x-0.5'
                  : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};

export default AcademySidebar;
