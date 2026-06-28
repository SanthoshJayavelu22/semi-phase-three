import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';

const InstituteLogin = ({ loginForm, setLoginForm, handleLoginSubmit, setCurrentStep }) => {
  return (
    <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-left">
      <button 
        onClick={() => setCurrentStep('welcome')}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Welcome
      </button>

      <div className="text-center mb-8">
        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Institution Access</span>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Institutional Login Portal</h2>
        <p className="text-sm text-gray-500 mt-1">Authenticate credentials to access your dashboard</p>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Registered Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="e.g. registration@apollohospitals.com"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500">Secure Passcode</label>
            <button 
              type="button" 
              onClick={() => setCurrentStep('forgot_password')} 
              className="text-xs font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Forgot passcode?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              required
              placeholder="Enter passcode"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-md text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Authenticate Dashboard
        </button>
      </form>
      
      <div className="mt-6 text-center text-xs font-semibold text-gray-400">
        Don't have an institutional account?{' '}
        <button 
          onClick={() => setCurrentStep('register')}
          className="text-blue-600 hover:underline"
        >
          Register here
        </button>
      </div>
    </div>
  );
};

export default InstituteLogin;
