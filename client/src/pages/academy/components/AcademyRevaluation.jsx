import React from 'react';
import { Award } from 'lucide-react';

export default function AcademyRevaluation() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Award className="w-10 h-10 text-amber-400" />
      </div>
      <h3 className="text-xl font-black text-slate-700">Revaluation Exam</h3>
      <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
        Manage student revaluation requests and schedule re-examinations.
      </p>
      <p className="text-xs text-slate-500 mt-4 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
        🚧 This component is under development. Coming soon!
      </p>
    </div>
  );
}
