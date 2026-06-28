import React from 'react';

const AcademyRejectionModal = ({
  rejectionReason,
  setRejectionReason,
  handleRejectSubmit,
  setShowRejectModal
}) => {
  return (
    <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
          <h3 className="font-extrabold text-base">Application Compliance Rejection</h3>
          <p className="text-[10px] text-red-200 font-medium">Log the regulatory reason for rejection</p>
        </div>

        <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-2">Rejection Reason / Auditor Notes</label>
            <textarea
              required
              rows="4"
              placeholder="e.g. Physical teaching space and training mannequins count do not comply with the state Medical Board standard regulations."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-950 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-500 transition-all text-xs font-bold leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl font-bold text-xs uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md text-xs uppercase transition-colors"
            >
              Log Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademyRejectionModal;
