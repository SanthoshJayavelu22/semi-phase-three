import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import Toast from '../../../Components/Toast';

const AcademyLogin = ({ loginForm, setLoginForm, errorMsg, handleLogin }) => {
  const [toast, setToast] = useState(null);
  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center py-6 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="mb-6 flex justify-center">
          <div className="bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-3 rounded-2xl shadow-inner">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              SE
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Academics Board</h2>
        <p className="text-xs text-gray-500 mt-1.5 font-semibold">Authorized governance portal entry</p>

        {errorMsg && (
          <div className="my-5 bg-rose-50 border border-rose-200 p-4 rounded-xl text-left text-xs font-semibold text-rose-600 shadow-sm leading-relaxed animate-shake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 mt-8 text-left">
          <div>
            <label className="block text-[10px] uppercase font-extrabold tracking-widest text-gray-500 mb-2 pl-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="email"
                required
                placeholder="board@semi.org.in"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 pl-1">
              <label className="block text-[10px] uppercase font-extrabold tracking-widest text-gray-500">Secret Key / Password</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline">Forgot secret key?</Link>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={loginForm.rememberMe}
                onChange={(e) => setLoginForm({...loginForm, rememberMe: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 bg-gray-50 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-white cursor-pointer"
              />
              <span className="group-hover:text-gray-700 transition-colors">Remember credentials</span>
            </label>
            <button 
              type="button" 
              onClick={() => setToast({ 
                message: "🔑 Simulated credentials:\nEmail: board@semi.org.in\nPassword: boardadmin (or any 8+ chars)", 
                type: 'info' 
              })}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              Simulated Access?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.99] text-xs uppercase tracking-wider text-center"
          >
            Access Governance Console
          </button>
        </form>
      </div>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default AcademyLogin;
