import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';

const PAGE_TITLES = {
  '/academy/dashboard':    'Dashboard',
  '/academy/applications': 'Institutional Applications',
  '/academy/students':     'Students Registry',
  '/academy/eligibility':  'Exam Eligibility',
  '/academy/verification': 'Eligibility Verification',
  '/academy/exams':        'Exam Approval & Scheduling',
};

const AcademyHeader = ({ boardUser, handleLogout }) => {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white flex items-center justify-between px-8 flex-shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 select-none">
        <span>Home</span>
        <ChevronRight className="w-3 h-3 text-gray-300" />
        <span className="text-gray-900 font-extrabold uppercase tracking-wider">
          {pageTitle}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Profile Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs">
            {boardUser?.name ? boardUser.name.substring(0, 2).toUpperCase() : 'SA'}
          </div>
          <span className="text-xs font-black text-gray-800">
            {boardUser?.name || 'Super Admin'}
          </span>
        </div>

        {handleLogout && (
          <>
            <div className="h-8 w-[1px] bg-gray-200"></div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all text-xs font-bold border border-gray-100 hover:border-rose-100 cursor-pointer"
              title="Logout Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default AcademyHeader;
