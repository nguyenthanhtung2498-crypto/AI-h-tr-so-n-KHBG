
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
      // Chuyển sang bước 2 sau khi chọn key
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
      // Logic xác thực cơ bản: admin/admin hoặc bất kỳ tài khoản nào khác
      const isAdmin = username.toLowerCase() === 'admin';
      onLogin({ username, isAdmin });
    } else {
      setShowError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ 
          backgroundImage: 'url("https://generativelanguage.googleapis.com/v1beta/files/ey931kic0l6v")',
          filter: 'brightness(0.4) blur(1px)' 
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-indigo-950/90 via-black/40 to-indigo-900/60" />

      {/* Login Card */}
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-2xl p-8 sm:p-10 rounded-[3rem] shadow-[0_32px_64px_rgba(0,0,0,0.7)] relative z-20 border border-white/20 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/30">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight drop-shadow-lg">
            Hệ thống Soạn KHBG
          </h2>
          <p className="mt-1 text-xs text-indigo-300 font-bold tracking-[0.2em] uppercase">
            THCS Huỳnh Thúc Kháng
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 1 ? 'bg-indigo-500' : 'bg-white/20'}`} />
          <div className={`h-2 w-12 rounded-full transition-all duration-500 ${step === 2 ? 'bg-indigo-500' : 'bg-white/20'}`} />
        </div>

        {step === 1 ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Bước 1: Kết nối API Key</h3>
              <p className="text-white/60 text-[10px] leading-relaxed px-4">
                Sử dụng API Key cá nhân để đảm bảo hiệu suất xử lý giáo án nhanh nhất.
              </p>
            </div>
            
            <button 
              onClick={handleSelectKey}
              className={`w-full py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 ${hasKey ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              <span>{hasKey ? 'Đã kết nối API - Tiếp tục' : 'Chọn API Key cá nhân'}</span>
            </button>

            {hasKey && (
              <button 
                onClick={() => setStep(2)}
                className="w-full text-white/40 text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors"
              >
                Hoặc nhấn để tiếp tục →
              </button>
            )}
          </div>
        ) : (
          <form className="space-y-5 animate-in slide-in-from-right-4 duration-300" onSubmit={handleSubmit}>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-2">Bước 2: Đăng nhập tài khoản</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300 transition-colors group-focus-within:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 placeholder-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 sm:text-sm transition-all"
                  placeholder="Tên đăng nhập (hoặc admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300 transition-colors group-focus-within:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 placeholder-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 sm:text-sm transition-all"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {showError && (
              <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider">{showError}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Vào hệ thống
            </button>

            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-white/40 text-[9px] uppercase font-bold tracking-widest hover:text-white transition-colors flex items-center justify-center"
            >
              ← Quay lại bước 1
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-[9px] text-white/20 font-bold tracking-[0.3em] uppercase">
            Education Intelligence 4.0
          </p>
        </div>
      </div>
    </div>
  );
};
