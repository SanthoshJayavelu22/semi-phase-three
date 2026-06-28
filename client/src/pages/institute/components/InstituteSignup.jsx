import React from 'react';
import { Mail, Lock, UserPlus, ArrowLeft, ShieldAlert, Building2 } from 'lucide-react';

const InstituteSignup = ({ regForm, setRegForm, handleRegisterSubmit, setCurrentStep }) => {
  return (
    <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-left animate-in fade-in duration-200">
      <button 
        onClick={() => setCurrentStep('welcome')}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Welcome
      </button>

      <div className="text-center mb-8">
        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Institution Setup</span>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Create Institutional Account</h2>
        <p className="text-sm text-gray-500 mt-1">Register credentials to initiate onboarding</p>
      </div>

      <form onSubmit={handleRegisterSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Institute Name</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              required
              placeholder="e.g. Sri Ramachandra College of Medicine"
              value={regForm.instituteName}
              onChange={(e) => setRegForm({...regForm, instituteName: e.target.value})}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Registered Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="e.g. admin@saraswathi.edu.in"
              value={regForm.email}
              onChange={(e) => setRegForm({...regForm, email: e.target.value})}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
          <span className="text-[10px] text-gray-400 block mt-1 px-1 font-semibold leading-relaxed">
            * Warning: A verification and confirmation mail will be automatically dispatched to this address.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Min. 8 characters"
                value={regForm.password}
                onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm({...regForm, confirmPassword: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 mt-2">
          <input
            type="checkbox"
            id="terms"
            checked={regForm.terms}
            onChange={(e) => setRegForm({...regForm, terms: e.target.checked})}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer font-medium leading-relaxed">
            I agree to the <span className="text-blue-600 hover:underline">Terms & Conditions</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 mt-2 text-xs leading-relaxed font-semibold text-blue-900">
          <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-extrabold block">Official Onboarding Notice</span>
            <span className="text-blue-800 mt-1 block font-medium">
              Registered email credentials must represent official hospital, college, or university domains. Public addresses (such as Gmail, Yahoo, etc.) are subjected to board compliance review.
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-md text-sm uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Initialize Registration
        </button>
      </form>
      
      <div className="mt-6 text-center text-xs font-semibold text-gray-400">
        Already registered?{' '}
        <button 
          onClick={() => setCurrentStep('login')}
          className="text-blue-600 hover:underline"
        >
          Access Login Portal
        </button>
      </div>
    </div>
  );
};

export default InstituteSignup;
