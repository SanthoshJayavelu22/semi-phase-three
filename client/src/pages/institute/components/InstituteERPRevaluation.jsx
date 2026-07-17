import React, { useState } from 'react';
import { Search, Filter, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

const InstituteERPRevaluation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock data for eligible students
  const [eligibleStudents] = useState([
    { id: 1, enrollmentId: 'SEMI-2023-003', name: 'Dr. Amit Kumar', course: 'MEM (Emergency Medicine)', subject: 'Clinical Emergency Medicine', currentMarks: 45, status: 'Eligible', fee: 5000 },
    { id: 2, enrollmentId: 'SEMI-2023-004', name: 'Dr. Sneha Verma', course: 'MD Emergency Medicine', subject: 'Traumatology', currentMarks: 48, status: 'Eligible', fee: 5000 },
    { id: 3, enrollmentId: 'SEMI-2023-005', name: 'Dr. Vikram Singh', course: 'DNB Emergency Medicine', subject: 'Pediatric Emergencies', currentMarks: 42, status: 'Eligible', fee: 5000 },
  ]);

  const filteredStudents = eligibleStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  const totalFee = selectedStudents.reduce((sum, id) => {
    const student = eligibleStudents.find(s => s.id === id);
    return sum + (student ? student.fee : 0);
  }, 0);

  const handlePayFee = () => {
    // Simulate payment process
    setTimeout(() => {
      setShowPaymentModal(false);
      alert('Revaluation request submitted successfully!');
      setSelectedStudents([]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-800">Revaluation Requests</h2>
          <p className="text-sm text-slate-500 mt-1">Select students eligible for revaluation and submit requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Total Fee</span>
            <span className="block text-lg font-black text-primary-600">₹{totalFee.toLocaleString()}</span>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            disabled={selectedStudents.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              selectedStudents.length > 0 
                ? 'bg-primary-600 text-white hover:bg-primary-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pay & Submit Request
          </button>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong className="block font-bold mb-1">Revaluation Rules:</strong>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Revaluation is allowed only within 7-10 days after result publication.</li>
            <li>Marks may increase, decrease, or remain the same after revaluation.</li>
            <li>The final revaluation result is considered final and binding.</li>
          </ul>
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
              placeholder="Search by student name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Student Details</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Current Marks</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className={`transition-colors group ${selectedStudents.includes(student.id) ? 'bg-primary-50/50' : 'hover:bg-slate-50/80'}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{student.name}</span>
                        <span className="text-xs text-slate-500">{student.enrollmentId} ({student.course})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{student.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{student.currentMarks}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">₹{student.fee.toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm">No eligible students found for revaluation.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Confirm Payment</h3>
            <p className="text-sm text-slate-500 mb-6">You are requesting revaluation for {selectedStudents.length} student(s).</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-slate-600">Total Fee</span>
                <span className="text-lg font-black text-primary-600">₹{totalFee.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400">Payment goes directly to the Academy.</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePayFee}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all active:scale-95"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteERPRevaluation;
