import React from 'react';

const Step1GeneralInfo = ({ appForm, setAppForm }) => {
  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-left space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-lg font-black text-gray-900">Institution Information</h3>
        <p className="text-xs text-gray-400 mt-0.5">Please provide registered details of the Health Care Organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Health Care Organization Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            placeholder="e.g. Saraswathi Institute of Medical Sciences"
            value={appForm.orgName}
            onChange={(e) => setAppForm({...appForm, orgName: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Registered Constitution Type <span className="text-red-500">*</span></label>
          <select
            value={appForm.constitutionType}
            onChange={(e) => setAppForm({...appForm, constitutionType: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          >
            <option value="" disabled>Select constitution type</option>
            <option value="Trust">Trust</option>
            <option value="Society">Society</option>
            <option value="Company">Company</option>
            <option value="Partnership">Partnership</option>
            <option value="Government">Government / Public Body</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Hospital Address <span className="text-red-500">*</span></label>
        <textarea
          required
          rows="3"
          placeholder="Complete physical location details..."
          value={appForm.instituteAddress}
          onChange={(e) => setAppForm({...appForm, instituteAddress: e.target.value})}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-semibold"
        />
      </div>

      <div>
        <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Registered Office Address <span className="text-red-500">*</span></label>
        <textarea
          required
          rows="2"
          placeholder="Address of Trust/Society corporate office..."
          value={appForm.registeredOfficeAddress}
          onChange={(e) => setAppForm({...appForm, registeredOfficeAddress: e.target.value})}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-semibold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Communication Phone <span className="text-red-500">*</span></label>
          <input
            type="tel"
            required
            placeholder="e.g. 44 2233 4455"
            value={appForm.phoneNumber}
            onChange={(e) => setAppForm({...appForm, phoneNumber: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Official Email Address <span className="text-red-500">*</span></label>
          <input
            type="email"
            required
            placeholder="e.g. contact@saraswathi.edu.in"
            value={appForm.emailAddress}
            onChange={(e) => setAppForm({...appForm, emailAddress: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Proposed Commencement Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            required
            value={appForm.commencementDate}
            onChange={(e) => setAppForm({...appForm, commencementDate: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Seats Requested (Per batch) <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            placeholder="Minimum 1 required"
            value={appForm.seatsRequested}
            onChange={(e) => setAppForm({...appForm, seatsRequested: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Office Phone Number <span className="text-red-500">*</span></label>
          <input
            type="tel"
            required
            placeholder="e.g. 044-88776655"
            value={appForm.officePhone}
            onChange={(e) => setAppForm({...appForm, officePhone: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Institutional Website URL <span className="text-red-500">*</span></label>
          <input
            type="url"
            required
            placeholder="e.g. https://www.saraswathi.edu.in"
            value={appForm.website}
            onChange={(e) => setAppForm({...appForm, website: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Name of Head of Institution <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            placeholder="e.g. Dr. A. K. Saravanan"
            value={appForm.headName}
            onChange={(e) => setAppForm({...appForm, headName: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Designation of Head <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            placeholder="e.g. Dean / Vice Chancellor / Director"
            value={appForm.headDesignation}
            onChange={(e) => setAppForm({...appForm, headDesignation: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-350 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all text-sm font-bold"
          />
        </div>
      </div>
    </div>
  );
};

export default Step1GeneralInfo;
