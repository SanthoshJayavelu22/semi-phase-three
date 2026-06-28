import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, RefreshCw } from 'lucide-react';
import authService from '../../../api/auth';

const ForgotPassword = ({ setCurrentStep, setErrorBanner, setSuccessBanner }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorBanner('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorBanner('Invalid email format. Please enter a valid institutional email address.');
      return;
    }

    setLoading(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      await authService.forgotPassword(email);
      setSuccessBanner('A 6-digit password reset OTP has been sent to your email.');
      setCurrentStep('reset_password');
    } catch (err) {
      console.error('Backend forgot-password failed:', err);
      setErrorBanner(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-left animate-in fade-in duration-200">
      <button 
        type="button"
        onClick={() => setCurrentStep('login')}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>

      <div className="text-center mb-8">
        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Passcode Recovery</span>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Forgot Passcode?</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your registered email to receive a password reset OTP.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Registered Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              required
              placeholder="e.g. registration@apollohospitals.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-md text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:bg-gray-300"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Reset OTP
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
