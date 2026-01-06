
import React, { useState, useEffect } from 'react';

interface UserData {
  username: string;
  isAdmin: boolean;
}

interface LoginPageProps {
  onLogin: (userData: UserData) => void;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showError, setShowError] = useState('');

  useEffect(() => {
    checkKeyStatus();
  }, []);

  const checkKeyStatus = async () => {
    try {
      const selected = await window.aistudio?.hasSelectedApiKey();
      setHasKey(!!selected);
    } catch (e) {
      console.warn("AI Studio bridge not available");
    }
  };

  const handleSelectKey = async () => {
    try {
      await window.aistudio?.openSelectKey();
      setHasKey(true);
      setTimeout(() => setStep(2), 500);
    } catch (e) {
      setShowError("Không thể mở trình chọn Key.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) {
      setStep(1);
      return;
    }
    if (username.trim() && password.trim()) {
      const isAdmin = username.toLowerCase() === 'admin';
      onLogin({ username, isAdmin });
    } else {
      setShowError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      <style>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animated-bg {
          animation: subtle-zoom 30s infinite ease-in-out;
        }
      `}</style>
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animated-bg"
        style={{ 
          backgroundImage: 'url("https://generativelanguage.googleapis.com/v1beta/files/ey931kic0l6v")',
          filter: 'brightness(0.35)' 
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-indigo-950/80 via-black/20 to-indigo-900/50" />

      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-3xl p-8 sm:p-12 rounded-[4rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative z-20 border border-white/20 animate-in fade-in zoom-in duration-700">
        <div className="text-center relative">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border-4 border-white/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none drop-shadow-2xl">
            S-KHBG AI
          </h2>
          <p className="mt-2 text-[10px] text-indigo-300 font-bold tracking-[0.4em] uppercase">
            Hệ thống hỗ trợ chuyên sâu 5512
          </p>
        </div>

        <div className="flex items-center justify-center space-x-3 mb-10">
          <div className={`h-1.5 w-10 rounded-full transition-all duration-700 ${step === 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
          <div className={`h-1.5 w-10 rounded-full transition-all duration-700 ${step === 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
        </div>

        {step === 1 ? (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-3">Kết nối API Gemini</h3>
              <p className="text-white/50 text-[10px] leading-relaxed max-w-[240px] mx-auto">
                Chọn API Key để kích hoạt khả năng thiết kế giáo án thông minh từ Gemini 3. Pro.
              </p>
            </div>
            <button 
              onClick={handleSelectKey}
              className={`w-full py-5 px-6 rounded-3xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-4 ${hasKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02] shadow-2xl shadow-indigo-900/40'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              <span>{hasKey ? 'API ĐÃ SẴN SÀNG' : 'CHỌN API KEY'}</span>
            </button>
            {hasKey && (
              <button onClick={() => setStep(2)} className="w-full text-indigo-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-colors">
                TIẾP THEO →
              </button>
            )}
          </div>
        ) : (
          <form className="space-y-6 animate-in slide-in-from-right-8 duration-500" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text" required
                  className="w-full pl-6 pr-6 py-5 bg-white/5 border border-white/10 placeholder-white/30 text-white rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="Tên đăng nhập"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="relative group">
                <input
                  type="password" required
                  className="w-full pl-6 pr-6 py-5 bg-white/5 border border-white/10 placeholder-white/30 text-white rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                  placeholder="Mật khẩu"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {showError && <p className="text-red-400 text-[9px] font-black text-center uppercase tracking-widest">{showError}</p>}
            <button
              type="submit"
              className="w-full py-5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl text-sm font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              ĐĂNG NHẬP
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-white/30 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
              ← THAY ĐỔI API KEY
            </button>
          </form>
        )}
        <div className="text-center pt-8">
          <p className="text-[8px] text-white/10 font-black tracking-[0.5em] uppercase">
            HUYNH THUC KHANG SECONDARY SCHOOL
          </p>
        </div>
      </div>
    </div>
  );
};
