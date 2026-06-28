import React from 'react';
import { Building2, Plus, ArrowRight, Lock } from 'lucide-react';

const WelcomeLanding = ({ setCurrentStep }) => {
  return (
    <div className="text-center py-12 px-6 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
      <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
        <Building2 className="w-10 h-10" />
      </div>
      <span className="text-xs uppercase font-extrabold tracking-widest text-blue-600 bg-blue-100/60 px-4 py-1.5 rounded-full">
        Official Registration Hub
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-6 tracking-tight">
        Register your institution with the Medical Board
      </h2>
      <p className="text-base text-gray-600 max-w-2xl mx-auto mt-4 leading-relaxed">
        Join the state's official medical institution registry. Manage emergency medicine fellowships, student enrollments, batches, and board certifications from one secure portal.
      </p>

      {/* Registration Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => setCurrentStep('register')}
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-base group"
        >
          <Plus className="w-5 h-5" />
          Register your Institution
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={() => setCurrentStep('login')}
          className="px-8 py-4 bg-white text-gray-700 border border-gray-300 font-bold rounded-2xl shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 text-base"
        >
          <Lock className="w-5 h-5 text-gray-400" />
          Existing Institution login
        </button>
      </div>

      {/* Portal Stats Section */}
      <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <h4 className="text-3xl sm:text-4xl font-black text-blue-600">480+</h4>
          <p className="text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wider">Registered Institutions</p>
        </div>
        <div className="border-y md:border-y-0 md:border-x border-gray-100 py-6 md:py-0">
          <h4 className="text-3xl sm:text-4xl font-black text-blue-600">1,200+</h4>
          <p className="text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wider">Active Courses</p>
        </div>
        <div>
          <h4 className="text-3xl sm:text-4xl font-black text-blue-600">10k+</h4>
          <p className="text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wider">Active Students</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeLanding;
