
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
      setTimeout(() => setStep(2), 300);
    } catch (e) {
      setShowError("Lỗi kết nối API.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) {
      setStep(1);
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      setShowError("Nhập đầy đủ thông tin.");
      return;
    }

    setIsAuthenticating(true);
    setShowError('');

    setTimeout(() => {
      const lowerUser = username.toLowerCase();
      // Restoration: Demo & Admin credentials
      const isDemo = (lowerUser === 'demo1' || lowerUser === 'demo2') && password === '123456';
      const isAdmin = lowerUser === 'admin' && password === '123456';

      if (isDemo || isAdmin) {
        onLogin({ 
          username: username.trim(), 
          isAdmin: isAdmin 
        });
      } else {
        setShowError("Thông tin đăng nhập không đúng.");
      }
      setIsAuthenticating(false);
    }, 600);
  };

  const BigSchoolSeal = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full p-6 drop-shadow-xl">
      <circle cx="50" cy="50" r="48" fill="white" stroke="#6366f1" strokeWidth="1" />
      <path d="M20 50 A30 30 0 0 0 50 80 A30 30 0 0 0 80 50" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 25 L45 35 H55 L50 25 Z" fill="#ef4444" />
      <rect x="48" y="35" width="4" height="20" rx="1" fill="#3b82f6" />
      <path d="M35 55 Q50 50 65 55 V75 Q50 70 35 75 Z" fill="#1e293b" />
      <text x="50" y="20" fontSize="5" fontWeight="900" textAnchor="middle" fill="#1e1b4b" className="uppercase">HUỲNH THÚC KHÁNG</text>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 py-10 bg-[#020617]">
      <style>{`
        .bg-grid {
          background-image: radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.05) 1px, transparent 0);
          background-size: 30px 30px;
        }
        .animated-bg {
          background: linear-gradient(-45deg, #020617, #0f172a, #020617);
          background-size: 400% 400%;
          animation: gradient 10s infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <div className="absolute inset-0 z-0 bg-grid" />
      <div className="absolute inset-0 z-10 animated-bg opacity-90" />

      <div className="max-w-[1000px] w-full flex flex-row bg-white/5 backdrop-blur-3xl rounded-[2rem] shadow-2xl relative z-20 border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="flex-1 hidden lg:flex flex-col justify-center items-center p-12 border-r border-white/5 bg-indigo-950/20">
          <div className="h-48 w-48 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl border-2 border-indigo-400/20 p-2">
             <BigSchoolSeal />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">THCS HUỲNH THÚC KHÁNG</h1>
            <p className="text-lg text-indigo-300 font-black tracking-[0.4em] uppercase mt-2">AI ASSISTANT</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center p-8 sm:p-16 relative bg-white/[0.01]">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div className="flex items-center justify-center space-x-2">
              <div className={`h-1 w-16 rounded-full transition-all ${step === 1 ? 'bg-indigo-400' : 'bg-white/10'}`} />
              <div className={`h-1 w-16 rounded-full transition-all ${step === 2 ? 'bg-indigo-400' : 'bg-white/10'}`} />
            </div>

            {step === 1 ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="text-center">
                  <h3 className="text-white font-black text-xl uppercase tracking-widest">Kích hoạt AI</h3>
                  <p className="text-indigo-200/40 text-[10px] font-bold uppercase mt-1 italic">Nạp mã API Key từ Google AI Studio</p>
                </div>
                <button onClick={handleSelectKey} className={`w-full py-5 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all border-2 ${hasKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-indigo-600/10 text-indigo-100 border-indigo-500/20 hover:bg-indigo-600/20'}`}>
                  {hasKey ? 'API KEY ĐÃ KÍCH HOẠT' : 'CHỌN MÃ API KEY'}
                </button>
                {hasKey && (
                  <button onClick={() => setStep(2)} className="w-full text-indigo-400 text-[10px] uppercase font-black tracking-widest hover:text-white transition-all">Tiếp tục đăng nhập →</button>
                )}
              </div>
            ) : (
              <form className="space-y-5 animate-in slide-in-from-right-4 duration-500" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <input type="text" required disabled={isAuthenticating} className="w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-indigo-500/50 font-black text-lg uppercase placeholder-white/20" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <input type="password" required disabled={isAuthenticating} className="w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-indigo-500/50 font-black text-lg uppercase placeholder-white/20" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {showError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[9px] font-black text-center uppercase tracking-widest">{showError}</div>}
                <button type="submit" disabled={isAuthenticating} className="w-full py-5 px-6 bg-indigo-600 text-white rounded-xl text-xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all border-b-4 border-indigo-900 active:border-b-0 active:translate-y-0.5">
                  {isAuthenticating ? "..." : "ĐĂNG NHẬP"}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep(1)} className="text-[8px] text-white/20 hover:text-white uppercase font-black tracking-widest">Thay đổi API Key</button>
                </div>
              </form>
            )}
            <div className="text-center pt-6 opacity-30">
              <p className="text-[8px] text-white font-black tracking-widest uppercase italic leading-none">THCS HUỲNH THÚC KHÁNG | HỆ THỐNG NỘI BỘ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
