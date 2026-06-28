import React from 'react';

const AcademyEditModal = ({
  editingApp,
  setEditingApp,
  editForm,
  setEditForm,
  handleSaveEdit
}) => {
  return (
    <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 px-6 py-4 text-white">
          <h3 className="font-extrabold text-base">Compliance Override</h3>
          <p className="text-[10px] text-blue-200 font-medium">Edit compliance parameters for {editingApp.orgName}</p>
        </div>

        <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs font-bold text-gray-800">
          <div>
            <label className="block text-[9px] uppercase font-black text-gray-400 mb-2">Emergency Beds Count</label>
            <input
              type="number"
              required
              placeholder="Minimum 10 beds"
              value={editForm.bedCount}
              onChange={(e) => setEditForm({...editForm, bedCount: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-955 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-black text-gray-400 mb-2">Physician Experience (Months)</label>
            <input
              type="number"
              required
              placeholder="Minimum 24 months"
              value={editForm.experience}
              onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-955 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-black text-gray-400 mb-2">EM Faculty Count</label>
            <input
              type="number"
              required
              placeholder="Minimum 1 faculty"
              value={editForm.emFacultyCount}
              onChange={(e) => setEditForm({...editForm, emFacultyCount: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-955 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase font-black text-gray-400 mb-2">Teaching Space Availability</label>
            <select
              value={editForm.teachingSpace}
              onChange={(e) => setEditForm({...editForm, teachingSpace: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-955 focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-bold cursor-pointer"
            >
              <option value="Yes">Yes (Mandatory)</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <button
              type="button"
              onClick={() => setEditingApp(null)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-xs uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs uppercase transition-colors"
            >
              Save Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademyEditModal;
