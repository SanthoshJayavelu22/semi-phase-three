import React from 'react';
import { AlertTriangle, X, Check, Trash2, HelpCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message, 
  confirmText = 'Yes, Proceed', 
  cancelText = 'Cancel', 
  type = 'warning', 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      bg: 'bg-red-50 text-red-600',
      border: 'border-red-100',
      btn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md shadow-red-500/20',
      icon: <Trash2 className="w-6 h-6" />
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-md shadow-amber-500/20',
      icon: <AlertTriangle className="w-6 h-6" />
    },
    success: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-md shadow-emerald-500/20',
      icon: <Check className="w-6 h-6" />
    },
    info: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md shadow-blue-500/20',
      icon: <HelpCircle className="w-6 h-6" />
    }
  };

  const config = typeConfig[type] || typeConfig.warning;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden scale-in-center animate-in zoom-in-95 duration-150">
        {/* Header/Close */}
        <div className="flex justify-end p-4 pb-0">
          <button 
            type="button" 
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center space-y-4">
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center ${config.bg} border ${config.border} shadow-inner`}>
            {config.icon}
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
            {message.includes('\n') ? (
              <div className="text-xs font-semibold text-slate-500 leading-relaxed space-y-1.5 max-w-xs mx-auto">
                {message.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs mx-auto">{message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all focus:outline-none ${config.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
