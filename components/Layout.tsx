
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  user?: string;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
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
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-indigo-200 flex items-center justify-center overflow-hidden">
              <img 
                src="input_file_1.png" 
                alt="Logo Trường" 
                className="w-14 h-14 sm:w-20 sm:h-20 object-contain block"
                onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=LOGO';
                }}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase leading-none">
                Tạo KHBG THCS
              </h1>
              <p className="text-[10px] sm:text-xs text-indigo-300 font-bold tracking-[0.2em] uppercase mt-1">
                Trường THCS Huỳnh Thúc Kháng
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

      <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Công cụ hỗ trợ giáo dục 4.0 | Chuẩn 5512
          </p>
        </div>
      </footer>
    </div>
  );
};
