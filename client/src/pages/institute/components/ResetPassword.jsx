import React, { useState } from 'react';
import { Lock, ArrowLeft, KeyRound, RefreshCw } from 'lucide-react';
import authService from '../../../api/auth';

const ResetPassword = ({ setCurrentStep, setErrorBanner, setSuccessBanner }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !newPassword || !confirmPassword) {
      setErrorBanner('Please fill out all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorBanner('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorBanner('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      await authService.resetPassword({ token, newPassword });
      setSuccessBanner('Password reset successfully! You can now log in with your new password.');
      setCurrentStep('login');
    } catch (err) {
      console.error('Backend reset-password failed:', err);
      setErrorBanner(err.parsedMessage || err.response?.data?.message || err.message || 'Failed to reset password. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-left animate-in fade-in duration-200">
      <button 
        type="button"
        onClick={() => setCurrentStep('forgot_password')}
        className="mb-6 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Forgot Password
      </button>

      <div className="text-center mb-8">
        <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Passcode Reset</span>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Reset Passcode</h2>
        <p className="text-sm text-gray-500 mt-1">Enter the 6-digit OTP sent to your email and your new passcode.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">6-Digit OTP Token</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              required
              maxLength="6"
              placeholder="e.g. 123456"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-mono font-bold text-sm tracking-widest text-center"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">New Passcode</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              required
              placeholder="Enter new passcode"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-500 mb-2">Confirm New Passcode</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              required
              placeholder="Confirm new passcode"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Resetting Passcode...
            </>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              Reset Passcode
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
