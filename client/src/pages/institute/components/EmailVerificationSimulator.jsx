import React from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

const EmailVerificationSimulator = ({ user }) => {
  return (
    <div className="max-w-xl mx-auto w-full space-y-6 text-left animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100">
          <Mail className="w-8 h-8 text-blue-600 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Awaiting Verification</span>
          <h2 className="text-2xl font-extrabold text-gray-900">Verify your Email</h2>
          <p className="text-sm text-gray-500 font-semibold leading-relaxed">
            We have reserved your institutional credentials for <span className="text-gray-900 font-bold">{user?.email || 'your registered email'}</span>.
          </p>
        </div>

        <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-6 text-xs text-blue-900 font-bold leading-relaxed space-y-4">
          <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 block">Next Steps</span>
          <p className="text-left leading-relaxed text-blue-800 font-medium">
            open mail box we sent the mail click the verify btn that mail after verify goes theis page <a href="https://semi-phase-three.swiflare.com/institute/login" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold break-all hover:text-blue-700">https://semi-phase-three.swiflare.com/institute/login</a>
          </p>
        </div>

        <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-4 leading-relaxed font-semibold">
          Society for Emergency Medicine India (SEMI) Academic Board Office
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationSimulator;