import React, { useState } from 'react';
import { Award, Search, Filter, Edit3, CheckCircle, AlertCircle } from 'lucide-react';

export default function AcademyRevaluation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatedMarks, setUpdatedMarks] = useState('');
  const [evaluatorNotes, setEvaluatorNotes] = useState('');

  // Mock data for incoming revaluation requests
  const [requests, setRequests] = useState([
    { id: 1, reqId: 'REV-2023-001', studentName: 'Dr. Amit Kumar', enrollmentId: 'SEMI-2023-003', institute: 'Saraswathi Inst.', subject: 'Clinical Emergency Medicine', oldMarks: 45, status: 'Pending Review', date: '2023-12-20' },
    { id: 2, reqId: 'REV-2023-002', studentName: 'Dr. Sneha Verma', enrollmentId: 'SEMI-2023-004', institute: 'Apollo Med.', subject: 'Traumatology', oldMarks: 48, status: 'Under Evaluation', date: '2023-12-21' },
    { id: 3, reqId: 'REV-2023-003', studentName: 'Dr. Vikram Singh', enrollmentId: 'SEMI-2023-005', institute: 'Max Healthcare', subject: 'Pediatric Emergencies', oldMarks: 42, status: 'Completed', newMarks: 46, date: '2023-12-18' },
  ]);

  const filteredRequests = requests.filter(req => 
    req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.reqId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.institute.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openUpdateModal = (req) => {
    setSelectedRequest(req);
    setUpdatedMarks(req.newMarks ? req.newMarks.toString() : '');
    setEvaluatorNotes('');
    setShowUpdateModal(true);
  };

  const handleUpdateMarks = () => {
    setRequests(requests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, status: 'Completed', newMarks: parseInt(updatedMarks, 10) } 
        : req
    ));
    setShowUpdateModal(false);
    alert(`Results updated and republished for ${selectedRequest.studentName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Revaluation Exam</h2>
            <p className="text-sm text-slate-500 mt-1">Manage student revaluation requests and update marks.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center">
            <span className="block text-xl font-black text-slate-800">{requests.filter(r => r.status !== 'Completed').length}</span>
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center">
            <span className="block text-xl font-black text-emerald-700">{requests.filter(r => r.status === 'Completed').length}</span>
            <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Completed</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by student, ID, or institute..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white w-full sm:w-auto">
            <Filter className="w-4 h-4" />
            Filter By Status
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Request Details</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Student & Institute</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Subject & Marks</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{req.reqId}</span>
                        <span className="text-xs text-slate-500">{req.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{req.studentName}</span>
                        <span className="text-xs text-slate-500">{req.institute}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 truncate max-w-[200px]" title={req.subject}>{req.subject}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-400 line-through">{req.oldMarks}</span>
                          {req.newMarks && (
                            <span className="text-xs font-bold text-emerald-600">→ {req.newMarks}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                        req.status === 'Under Evaluation' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status !== 'Completed' ? (
                        <button 
                          onClick={() => openUpdateModal(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Update Marks
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                          <CheckCircle className="w-4 h-4" />
                          Republished
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm">No revaluation requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Marks Modal */}
      {showUpdateModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Update Results</h3>
            <p className="text-sm text-slate-500 mb-6">Enter the revised marks for {selectedRequest.studentName}.</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</span>
                <span className="block text-sm font-bold text-slate-800">{selectedRequest.subject}</span>
                <div className="mt-2 text-sm text-slate-600">
                  Original Marks: <strong className="text-slate-800">{selectedRequest.oldMarks}</strong>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Revised Marks *</label>
                <input 
                  type="number" 
                  value={updatedMarks}
                  onChange={(e) => setUpdatedMarks(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-black"
                  placeholder="e.g. 52"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Evaluator Notes (Optional)</label>
                <textarea 
                  value={evaluatorNotes}
                  onChange={(e) => setEvaluatorNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm resize-none"
                  rows="3"
                  placeholder="Any comments from the evaluator..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateMarks}
                disabled={!updatedMarks}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Republish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
