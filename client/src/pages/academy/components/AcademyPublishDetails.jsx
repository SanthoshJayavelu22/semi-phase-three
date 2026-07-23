import { RefreshCw } from 'lucide-react';

export default function AcademyPublishDetails() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <RefreshCw className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-black text-slate-700">Publishing Details</h3>
      <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
        View detailed history of all published results, including timestamps and publication status.
      </p>
      <p className="text-xs text-slate-500 mt-4 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
        🚧 This component is under development. Coming soon!
      </p>
    </div>
  );
}
