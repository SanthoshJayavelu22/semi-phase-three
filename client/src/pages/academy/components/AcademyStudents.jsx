import React from 'react';
import { Search, Compass, Eye, Edit, Trash2 } from 'lucide-react';

const AcademyStudents = ({ 
  filteredStudents, 
  studentSearchQuery, 
  setStudentSearchQuery,
  handleView
}) => {
  const [instituteFilter, setInstituteFilter] = React.useState('');

  const uniqueInstitutes = React.useMemo(() => {
    const insts = filteredStudents.map(s => s.institute || s.assignedInstitute || s.instituteName).filter(Boolean);
    return [...new Set(insts)].sort();
  }, [filteredStudents]);

  const displayedStudents = React.useMemo(() => {
    if (!instituteFilter) return filteredStudents;
    return filteredStudents.filter(s => (s.institute || s.assignedInstitute || s.instituteName) === instituteFilter);
  }, [filteredStudents, instituteFilter]);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Students Registry</h2>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mt-1">
            Auditing {displayedStudents.length} candidates registered across approved institutes
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={instituteFilter}
            onChange={(e) => setInstituteFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800 cursor-pointer"
          >
            <option value="">All Institutes</option>
            {uniqueInstitutes.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students...."
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-xl text-xs font-bold w-64 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-150 rounded-2xl shadow-inner bg-slate-50/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest w-12 text-center">#</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Application ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Student name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Institute</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Course</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/60 text-xs font-bold text-slate-700 bg-white">
              {displayedStudents.length > 0 ? (
                displayedStudents.map((s, idx) => (
                  <tr key={s.enrollmentNo} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-center text-[10px] text-gray-400 font-extrabold">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{s.batch || 'Batch 2024-A'}</td>
                    <td className="px-6 py-4 font-mono font-black text-slate-600">{s.enrollmentNo}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">{s.fullName}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{s.institute || s.assignedInstitute || s.instituteName}</td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">{s.course}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => handleView(s)}
                          className="p-2 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-xl text-blue-600 transition-all active:scale-90"
                          title="View Student details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-400 font-medium">
                    <Compass className="w-10 h-10 mx-auto text-gray-300 mb-4 stroke-1 animate-pulse" />
                    <p className="text-sm font-bold text-slate-500">No matching student enrollments found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Modify your filters and try again</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AcademyStudents;
