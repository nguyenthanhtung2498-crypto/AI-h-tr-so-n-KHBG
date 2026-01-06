
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, isAdmin, onLogout }) => {
  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative z-0">
      <header className="bg-indigo-900 text-white shadow-2xl no-print border-b border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="bg-indigo-700 p-3 rounded-2xl shadow-inner border border-indigo-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none">
                  AI Hỗ trợ KHBG
                </h1>
                {isAdmin && (
                  <span className="bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                    Quản trị viên
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-indigo-300 font-bold tracking-[0.2em] uppercase mt-1">
                THCS Huỳnh Thúc Kháng
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <div className="hidden lg:flex flex-col items-end mr-4 border-r border-indigo-700/50 pr-6">
                <div className="text-indigo-50 text-sm font-bold tracking-tight">GV. {user}</div>
                <button 
                  onClick={handleSelectKey}
                  className="text-indigo-400 text-[9px] hover:text-white transition-colors font-black uppercase tracking-widest flex items-center mt-0.5"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                  Quản lý API
                </button>
              </div>
            )}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-red-500/30 flex items-center uppercase tracking-widest"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Thoát
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Công cụ hỗ trợ giáo dục 4.0 | Chuẩn 5512
          </p>
        </div>
      </footer>
    </div>
  );
};
