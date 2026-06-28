import React from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

const EmailVerificationSimulator = ({ user, handleVerifyEmail }) => {
  // Get the verification link from the user object or generate a demo one
const getVerificationLink = () => {
  const token = user?.verificationToken || user?.token || 'demo-token-123456';
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify-email/${token}`;  // Changed from /auth/verify-email to /verify-email
};

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 text-left">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-2xl shadow-sm text-xs font-semibold text-amber-800 flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase block tracking-wider">Awaiting Verification Response</span>
          <p className="mt-1 leading-relaxed text-amber-700 font-medium">
            Your institutional credentials have been reserved successfully! Please verify your email address.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden font-sans">
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 px-6 py-4 text-white flex justify-between items-center select-none shadow">
          <div className="flex items-center gap-2">
            <span className="text-lg">📬</span>
            <span className="text-sm font-extrabold tracking-wider uppercase">Simulated Institutional Mailbox</span>
          </div>
          <span className="bg-blue-600 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase">
            1 Unread
          </span>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4 text-xs font-bold text-gray-500 space-y-1.5 leading-relaxed">
            <div><span className="text-gray-400 font-black">FROM:</span> academics@semi.org.in (Society for Emergency Medicine India)</div>
            <div><span className="text-gray-400 font-black">TO:</span> {user?.email}</div>
            <div><span className="text-gray-400 font-black">DATE:</span> {new Date().toLocaleString()}</div>
            <div><span className="text-gray-400 font-black">SUBJECT:</span> 🔒 Verify your Institutional Portal Credentials</div>
          </div>

          <div className="text-xs leading-relaxed text-gray-600 font-semibold space-y-4">
            <p>Dear Academic Representative,</p>
            <p>
              Thank you for initiating the institutional onboarding and fellowship licensing pipeline with the <strong>Society for Emergency Medicine India (SEMI)</strong>.
            </p>
            <p>
              To activate your institutional portal credentials and proceed to submit your onboarding application, please click the secure confirmation button below:
            </p>
          </div>

          {/* Verification Link Button */}
          <div className="py-4 text-center space-y-3">
            <button
              onClick={() => handleVerifyEmail()}
              className="px-8 py-3.5 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-xs uppercase tracking-wider inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify Email & Activate Account
            </button>
            
            <div className="text-[10px] text-gray-400">
              <p>Or copy and paste this link in your browser:</p>
              <code className="block mt-1 text-blue-600 break-all bg-gray-50 p-2 rounded border border-gray-200 text-[9px]">
                {getVerificationLink()}
              </code>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-4 leading-relaxed font-semibold text-center select-none">
            Society for Emergency Medicine India (SEMI) Academic Board Office • SSL Secured and Encrypted Transmissions
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSimulator;