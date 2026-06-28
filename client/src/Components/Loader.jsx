import React from 'react';
import logo from '../assets/semi logo.png';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex flex-col items-center">
        {/* Logo with pulse effect */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl border border-blue-50">
            <img 
              src={logo} 
              alt="SEMI Loading" 
              className="h-16 w-auto object-contain animate-pulse" 
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
        
        {/* Loading Spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-blue-600 font-semibold text-sm tracking-wider animate-pulse">
            LOADING...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loader;

