import React from 'react';

const Step2DepartmentInfo = ({ appForm, setAppForm }) => {
  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900">Department Information</h3>
        <p className="text-xs text-gray-400 mt-0.5">Define your Emergency Medicine infrastructure, beds count, and faculty specifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Name of Head of Department <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            placeholder="e.g. Dr. Ramesh Chawla"
            value={appForm.hodName}
            onChange={(e) => setAppForm({...appForm, hodName: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Emergency Beds Capacity <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            placeholder="Minimum 10 beds mandatory"
            value={appForm.bedCount}
            onChange={(e) => setAppForm({...appForm, bedCount: e.target.value})}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-4 transition-all text-sm font-bold ${
              appForm.bedCount && parseInt(appForm.bedCount, 10) < 10 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50/50'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Emergency Physician Availability <span className="text-red-500">*</span></label>
          <select
            value={appForm.physicianAvailability}
            onChange={(e) => setAppForm({...appForm, physicianAvailability: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          >
            <option value="" disabled>Select availability</option>
            <option value="Yes">Yes (Mandatory)</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Emergency Physician Experience (Months) <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            placeholder="Minimum 24 months mandatory"
            value={appForm.physicianExperience}
            onChange={(e) => setAppForm({...appForm, physicianExperience: e.target.value})}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-4 transition-all text-sm font-bold ${
              appForm.physicianExperience && parseInt(appForm.physicianExperience, 10) < 24 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50/50'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Course Director EM Qualification <span className="text-red-500">*</span></label>
          <select
            value={appForm.courseDirectorEMQualified}
            onChange={(e) => setAppForm({...appForm, courseDirectorEMQualified: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          >
            <option value="" disabled>Select qualification</option>
            <option value="Yes">EM Qualified</option>
            <option value="No">Non-Qualified</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">EM Qualified Faculty Count <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            placeholder="Minimum 1 required"
            value={appForm.emFacultyCount}
            onChange={(e) => setAppForm({...appForm, emFacultyCount: e.target.value})}
            className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-4 transition-all text-sm font-bold ${
              appForm.emFacultyCount && parseInt(appForm.emFacultyCount, 10) < 1 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-50/50'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Teaching Space Availability <span className="text-red-500">*</span></label>
          <select
            value={appForm.teachingSpace}
            onChange={(e) => setAppForm({...appForm, teachingSpace: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          >
            <option value="" disabled>Select availability</option>
            <option value="Yes">Yes (Mandatory)</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">NABH Accreditation Status <span className="text-red-500">*</span></label>
          <select
            value={appForm.nabhStatus}
            onChange={(e) => setAppForm({...appForm, nabhStatus: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          >
            <option value="" disabled>Select status</option>
            <option value="Yes">Accredited</option>
            <option value="No">Non-Accredited</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Step2DepartmentInfo;
