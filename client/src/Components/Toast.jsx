import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'error', onClose, duration = 6000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    error: {
      bg: 'bg-red-50/90 backdrop-blur border-red-200 text-red-900',
      icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />,
      accent: 'bg-red-500',
      title: 'Compliance & Verification Error'
    },
    success: {
      bg: 'bg-emerald-50/90 backdrop-blur border-emerald-250 text-emerald-950',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
      accent: 'bg-emerald-500',
      title: 'Action Successful'
    },
    warning: {
      bg: 'bg-amber-50/90 backdrop-blur border-amber-200 text-amber-950',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
      accent: 'bg-amber-500',
      title: 'Warning Alert'
    },
    info: {
      bg: 'bg-blue-50/90 backdrop-blur border-blue-200 text-blue-950',
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />,
      accent: 'bg-blue-500',
      title: 'Notification'
    }
  };

  const config = typeConfig[type] || typeConfig.error;

  // Helper to convert error objects to readable strings
  const formatMessage = (msg) => {
    if (!msg) return 'An error occurred.';
    
    // If it's an array, join with commas
    if (Array.isArray(msg)) {
      return msg.map(m => {
        if (typeof m === 'object' && m !== null) {
          // Handle Zod error objects
          if (m.message) return m.message;
          if (m.field && m.message) return `${m.field}: ${m.message}`;
          return JSON.stringify(m);
        }
        return String(m);
      }).join(', ');
    }
    
    // If it's an object, try to extract message
    if (typeof msg === 'object' && msg !== null) {
      if (msg.message) return String(msg.message);
      if (msg.field && msg.message) return `${msg.field}: ${msg.message}`;
      try {
        return JSON.stringify(msg);
      } catch {
        return 'An error occurred.';
      }
    }
    
    return String(msg);
  };

  const displayMessage = formatMessage(message);

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] max-w-md w-full p-4 rounded-2xl border shadow-2xl ${config.bg} flex items-start gap-3.5 animate-in slide-in-from-bottom-6 fade-in duration-300 overflow-hidden`}>
      {/* Dynamic Progress indicator bar at bottom */}
      {duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
          <div 
            className={`h-full ${config.accent} transition-all`} 
            style={{ 
              animation: `shrinkWidth ${duration}ms linear forwards` 
            }}
          />
        </div>
      )}

      {/* Type Specific Icon */}
      {config.icon}

      <div className="flex-1 space-y-1 text-left pb-1">
        <span className="text-xs font-black uppercase tracking-wider block">{config.title}</span>
        
        {/* Render multiple lines if message has newlines */}
        {displayMessage.includes('\n') ? (
          <ul className="list-disc pl-4 text-xs font-semibold space-y-1 leading-relaxed text-opacity-90">
            {displayMessage.split('\n').map((m, idx) => m.trim() && <li key={idx}>{m}</li>)}
          </ul>
        ) : (
          <p className="text-xs font-semibold leading-relaxed text-opacity-90">{displayMessage}</p>
        )}
      </div>

      <button 
        type="button" 
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>

      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;