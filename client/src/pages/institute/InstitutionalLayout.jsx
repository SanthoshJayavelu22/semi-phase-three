import React from 'react';
import logo from '../../assets/semi logo.png';

const InstitutionalLayout = ({ children, portalType = 'institute', hideHeaderFooter = false }) => {
  if (hideHeaderFooter) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800 font-sans">
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo and Branding */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="bg-white p-1.5 rounded-lg shadow-inner flex items-center justify-center">
              <img
                src={logo}
                alt="SEMI Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/60?text=SEMI';
                }}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider leading-tight">
                Society for Emergency Medicine India
              </h1>
              <p className="text-[10px] sm:text-xs text-blue-200 font-medium italic">
                Full Member of International Federation for Emergency Medicine
              </p>
              <p className="text-[10px] sm:text-xs text-blue-300 font-medium hidden md:block">
                Leading Emergency Care Excellence Since 1999 (Regd. No. 3602/2000)
              </p>
            </div>
          </div>

          {/* Portal Type Title */}
          <div className="text-right">
            <span className="bg-blue-600/50 backdrop-blur-sm border border-blue-400/30 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase">
              {portalType === 'academy' ? 'Academic Board Portal' : 'Institutional Registration Portal'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* Official Footnotes Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4 text-xs text-gray-500 font-medium select-none shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="text-green-600">🔒</span> SSL Secured & Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-gray-600">
              <span>🌐</span> Official Government Portal Affiliate
            </span>
            <a href="tel:18001234567" className="flex items-center gap-1.5 text-blue-600 hover:underline">
              <span>📞</span> Support: 1800-XXX-XXXX
            </a>
          </div>
          <div className="text-center md:text-right text-gray-400">
            © {new Date().getFullYear()} Society for Emergency Medicine India (SEMI)
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InstitutionalLayout;
