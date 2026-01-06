
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

  const SchoolSeal = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-sm">
      <defs>
        {/* Fix: Changed second x2 attribute to y2 to define gradient direction correctly */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="white" stroke="url(#goldGrad)" strokeWidth="2" />
      <path d="M30 65 L50 75 L70 65 V35 L50 25 L30 35 Z" fill="#1e1b4b" />
      <path d="M50 30 V55 M40 45 L50 55 L60 45" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="50" y="92" fontSize="7" fontWeight="900" textAnchor="middle" fill="#1e1b4b" className="uppercase tracking-tighter">HTK SCHOOL</text>
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col relative z-0 bg-slate-50">
      <header className="bg-[#0f172a] text-white shadow-lg no-print border-b border-indigo-500/10">
        <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center justify-between overflow-hidden">
          <div className="flex items-center space-x-3 shrink-0 group">
            <div className="bg-white/5 p-1 rounded-full border border-white/5 flex items-center justify-center transition-transform group-hover:scale-105">
              <SchoolSeal />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tight uppercase leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                THCS HUỲNH THÚC KHÁNG
              </h1>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">HỆ THỐNG AI KHBG 4.0</span>
            </div>
          </div>

          <div className="flex-1 mx-6 overflow-hidden relative h-8 flex items-center bg-indigo-950/30 rounded-lg border border-white/5">
            <div className="animate-marquee whitespace-nowrap text-[11px] font-bold text-amber-300 uppercase tracking-wide px-4">
              <span className="mx-4">✨ Tối ưu Công văn 5512</span>
              <span className="mx-4">🚀 Phân tích SGK PDF Tự động</span>
              <span className="mx-4">✨ Công nghệ Gemini 3.0 Pro Cao cấp</span>
              <span className="mx-4">🚀 Xã Hưng Thịnh - Chuyên nghiệp - Hiện đại</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            {user && (
              <div className="hidden lg:flex flex-col items-end mr-2 border-r border-white/10 pr-3">
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-[8px] px-2 py-0.5 rounded font-black text-black uppercase shadow-sm">QUẢN TRỊ VIÊN</span>
                  )}
                  <div className="text-white text-sm font-black uppercase tracking-tight italic">GV. {user}</div>
                </div>
                <button onClick={handleSelectKey} className="text-indigo-400 text-[8px] hover:text-indigo-200 transition-colors font-black uppercase tracking-widest">
                  CÀI ĐẶT API KEY
                </button>
              </div>
            )}
            {onLogout && (
              <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black transition-all shadow-md uppercase tracking-wider border-b-2 border-red-900 active:border-b-0 active:translate-y-0.5">Thoát</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 no-print">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">
            &copy; {new Date().getFullYear()} THCS HUỲNH THÚC KHÁNG | XÃ HƯNG THỊNH | AI EDUCATION SOLUTION
          </p>
        </div>
      </footer>
    </div>
  );
};
