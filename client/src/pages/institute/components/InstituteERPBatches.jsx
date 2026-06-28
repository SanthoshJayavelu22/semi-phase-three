import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Calendar, Users, PlusCircle, XCircle } from 'lucide-react';

const InstituteERPBatches = ({
  batches = [],
  newBatch,
  setNewBatch,
  handleCreateBatch,
  handleUpdateBatch,
  handleDeleteBatch
}) => {
  const [editingBatch, setEditingBatch] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    startDate: '',
    seats: ''
  });

  // Handle setting edit form when selecting a batch to edit
  const startEdit = (batch) => {
    setEditingBatch(batch);
    setEditForm({
      name: batch.name || '',
      startDate: batch.startDate || '',
      seats: batch.seats || '5'
    });
  };

  const cancelEdit = () => {
    setEditingBatch(null);
    setEditForm({ name: '', startDate: '', seats: '' });
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.startDate) return;
    
    const seats = parseInt(editForm.seats, 10);
    if (isNaN(seats) || seats <= 0) {
      alert('Number of available seats must be greater than zero.');
      return;
    }

    if (handleUpdateBatch) {
      await handleUpdateBatch(editingBatch._id || editingBatch.id, {
        name: editForm.name,
        startDate: editForm.startDate,
        seats: Number(editForm.seats)
      });
    }
    cancelEdit();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-left">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Batches</h2>
        <p className="text-xs text-gray-500 mt-1">Configure academic semesters and session blocks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. CREATION / EDIT PANEL */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-6 h-fit">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              {editingBatch ? 'Edit Batch' : 'Create Batch'}
            </h3>
            {editingBatch && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={editingBatch ? onEditSubmit : handleCreateBatch} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Batch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Batch 2026-C"
                value={editingBatch ? editForm.name : newBatch.name}
                onChange={(e) => {
                  if (editingBatch) {
                    setEditForm({ ...editForm, name: e.target.value });
                  } else {
                    setNewBatch({ ...newBatch, name: e.target.value });
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Commencement Date *</label>
              <input
                type="date"
                required
                value={editingBatch ? editForm.startDate : newBatch.startDate}
                onChange={(e) => {
                  if (editingBatch) {
                    setEditForm({ ...editForm, startDate: e.target.value });
                  } else {
                    setNewBatch({ ...newBatch, startDate: e.target.value });
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Intake Capacity (Seats) *</label>
              <input
                type="number"
                required
                placeholder="Intake limit"
                value={editingBatch ? editForm.seats : newBatch.seats}
                onChange={(e) => {
                  if (editingBatch) {
                    setEditForm({ ...editForm, seats: e.target.value });
                  } else {
                    setNewBatch({ ...newBatch, seats: e.target.value });
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 text-white font-extrabold rounded-xl transition-all shadow-md text-xs uppercase tracking-wider cursor-pointer ${
                editingBatch 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'
              }`}
            >
              {editingBatch ? 'Save Changes' : 'Create Batch'}
            </button>
          </form>
        </div>
 
        {/* 2. ACTIVE BATCHES LIST */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">Active Batches Registry</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs text-gray-600">
            {batches.map((batch) => {
              const ratio = Math.min(100, Math.floor(((batch.activeFellows || 0) / parseInt(batch.seats || 5, 10)) * 100));
              const isEditingThis = editingBatch && (editingBatch._id === batch._id || editingBatch.id === batch.id);

              return (
                <div 
                  key={batch.id || batch._id} 
                  className={`border rounded-2xl p-5 transition-all duration-200 bg-gray-50/20 shadow-sm flex flex-col justify-between gap-4 ${
                    isEditingThis 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10' 
                      : 'border-gray-150 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-left">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 block w-fit font-mono">
                        BATCH ID: #{String(batch.id || batch._id).substring(0, 8).toUpperCase()}
                      </span>
                      <h4 className="text-base font-black text-gray-800 pt-1.5 leading-tight">{batch.name}</h4>
                      <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Commencement: {batch.startDate}</span>
                    </div>

                    {/* Actions buttons */}
                    <div className="flex items-center gap-1 bg-white border border-slate-100 shadow-sm rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => startEdit(batch)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Batch"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBatch(batch._id || batch.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>Seat Utilization:</span>
                      <span className="text-gray-800">{batch.activeFellows || 0} / {batch.seats || 5} Fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
            {batches.length === 0 && (
              <div className="col-span-2 py-16 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No active batches registered. Configure one using the creation panel.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteERPBatches;
