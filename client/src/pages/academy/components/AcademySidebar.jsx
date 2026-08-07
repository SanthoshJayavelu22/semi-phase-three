import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  UserCheck, 
  ClipboardList,
  FileSpreadsheet,
  BarChart3,
  Globe,           // For Publish Results
  RefreshCw,       // For Publishing Details
  Award,           // For Revaluation
  CreditCard       // For Remittance Audit
} from 'lucide-react';

const NAV_GROUPS = [
  {
    groupTitle: 'Main',
    items: [
      { id: 'dashboard', path: '/academy/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    ]
  },
  {
    groupTitle: 'Colleges & Students',
    items: [
      { id: 'applications', path: '/academy/applications', label: 'College Applications', Icon: Building2 },
      { id: 'students', path: '/academy/students', label: 'All Students Roster', Icon: Users },
    ]
  },
  {
    groupTitle: 'Verification & Fees',
    items: [
      { id: 'verification', path: '/academy/verification', label: 'Student Verification', Icon: UserCheck },
      { id: 'eligibility', path: '/academy/eligibility', label: 'Exam Approvals', Icon: ClipboardList },
      { id: 'remittance', path: '/academy/remittance', label: 'Fee Payment Audit', Icon: CreditCard },
    ]
  },
  {
    groupTitle: 'Marks & Evaluation',
    items: [
      { id: 'marks', path: '/academy/marks', label: 'Enter Student Marks', Icon: FileSpreadsheet },
      { id: 'student-marks', path: '/academy/student-marks', label: 'Student Marksheets', Icon: BarChart3 },
    ]
  },
  {
    groupTitle: 'Publish & Re-checking',
    items: [
      { id: 'publish-results', path: '/academy/publish-results', label: 'Publish Results', Icon: Globe },
      { id: 'publish-details', path: '/academy/publish-details', label: 'Publish History', Icon: RefreshCw },
      { id: 'revaluation', path: '/academy/revaluation', label: 'Re-checking Requests', Icon: Award },
    ]
  }
];

const AcademySidebar = ({ boardUser }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="w-68 bg-primary-900 border-r border-primary-800 flex flex-col flex-shrink-0 text-primary-200 font-sans select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>

      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-primary-800/80 bg-primary-950/40 gap-3 relative z-10">
        <div className="bg-gradient-to-tr from-primary-500 to-primary-400 p-1.5 rounded-xl shadow-md shadow-primary-500/20 flex items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center text-white font-extrabold text-sm">
            SE
          </div>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-black text-white tracking-wide drop-shadow-sm">SEMI Board</span>
          <span className="text-[9px] text-primary-400 font-bold uppercase tracking-widest mt-0.5">Academy Governance</span>
        </div>
      </div>
      
      {/* Logged in User Widget */}
      <div className="px-5 py-4 border-b border-primary-800/60 bg-primary-950/20 relative z-10">
        <span className="text-[8px] uppercase font-black text-primary-400 tracking-widest block text-left">Board Officer</span>
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 text-white flex items-center justify-center font-black text-xs shadow-md border border-primary-400/20">
            SA
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-bold text-primary-100 truncate">{boardUser?.email || 'board@semi.org.in'}</span>
            <span className="inline-flex w-fit mt-1 text-[8px] font-black uppercase text-primary-200 bg-primary-500/20 px-2 py-0.5 rounded-md border border-primary-500/30 tracking-wider">
              {boardUser?.role === 'board' ? 'Board Member' : boardUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs */}
      <nav className="flex-grow px-4 py-5 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <span className="text-[9px] uppercase font-black text-slate-500 px-3 tracking-widest block text-left mb-1.5">
              {group.groupTitle}
            </span>
            {group.items.map(({ id, path, label, Icon }) => {
              const isActive = pathname === path;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(path)}
                  aria-label={label}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25 translate-x-0.5'
                      : 'hover:bg-primary-800/60 hover:text-primary-100 text-primary-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AcademySidebar;