
import React, { useState } from 'react';
import { validateApiKey } from '../geminiService';

interface UserData {
  username: string;
  isAdmin: boolean;
}

interface LoginPageProps {
  onLogin: (userData: UserData, apiKey: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showError, setShowError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setShowError("VUI LÒNG DÁN MÃ API KEY VÀO Ô TRÊN.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setShowError("VUI LÒNG NHẬP TÀI KHOẢN VÀ MẬT KHẨU TRƯỜNG.");
      return;
    }

    setIsAuthenticating(true);
    setShowError('');
    setStatusMessage('ĐANG XÁC THỰC MÃ API KEY...');

    try {
      // 1. Xác thực mã API Key trước (Rất quan trọng)
      const isValidKey = await validateApiKey(apiKey.trim());

      if (!isValidKey) {
        setShowError("MÃ API KEY KHÔNG HỢP LỆ. VUI LÒNG COPY VÀ DÁN LẠI CHÍNH XÁC.");
        setIsAuthenticating(false);
        return;
      }

      // 2. Xác thực tài khoản hệ thống (Simulated)
      setStatusMessage('ĐANG KIỂM TRA TÀI KHOẢN...');
      const lowerUser = username.toLowerCase();
      const isDemo = (lowerUser === 'demo1' || lowerUser === 'demo2') && password === '123456';
      const isAdmin = lowerUser === 'admin' && password === '123456';

      if (isDemo || isAdmin) {
        onLogin({ username: username.trim(), isAdmin: isAdmin }, apiKey.trim());
      } else {
        setShowError("TÀI KHOẢN HOẶC MẬT KHẨU TRƯỜNG SAI.");
      }
    } catch (err) {
      setShowError("LỖI KẾT NỐI. VUI LÒNG KIỂM TRA MẠNG.");
    } finally {
      setIsAuthenticating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden font-sans">
      {/* Hiệu ứng nền */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[500px] w-full bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-10 sm:p-14 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 p-3 transform transition-transform hover:rotate-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="2" />
              <path d="M30 65 L50 75 L70 65 V35 L50 25 L30 35 Z" fill="#1e1b4b" />
              <path d="M50 30 V55 M40 45 L50 55 L60 45" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">THCS HUỲNH THÚC KHÁNG</h1>
          <div className="mt-2 bg-indigo-500 px-3 py-1 rounded-full">
            <p className="text-white font-black tracking-[0.1em] text-[9px] uppercase">AI KHBG V4.0 PROFESSIONAL</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {/* PHẦN NHẬP KEY THỦ CÔNG - NỔI BẬT NHẤT */}
          <div className="p-6 bg-indigo-600/20 border-2 border-indigo-500/30 rounded-[2rem] shadow-inner space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-black text-indigo-300 uppercase tracking-widest flex items-center">
                <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
                DÁN MÃ API GEMINI TẠI ĐÂY
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded-lg transition-colors uppercase"
              >
                LẤY MÃ KEY
              </a>
            </div>
            <div className="relative">
              <textarea 
                required 
                rows={2}
                className="w-full px-5 py-4 bg-slate-950/50 border border-indigo-500/30 text-indigo-100 rounded-2xl focus:outline-none focus:border-indigo-400 font-mono text-sm placeholder:text-slate-700 transition-all resize-none shadow-inner" 
                placeholder="Dán mã (AIzaSy...) của bạn vào đây..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                disabled={isAuthenticating}
              />
              <div className="absolute right-3 bottom-3 opacity-20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </div>
            </div>
          </div>

          {/* PHẦN TÀI KHOẢN TRƯỜNG */}
          <div className="space-y-4 px-2">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tài khoản & Mật khẩu trường</label>
              <div className="grid grid-cols-1 gap-3">
                <input 
                  type="text" 
                  required 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500 font-bold uppercase text-sm placeholder:text-slate-600 transition-all" 
                  placeholder="TÊN ĐĂNG NHẬP" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  disabled={isAuthenticating}
                />
                <input 
                  type="password" 
                  required 
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500 font-bold uppercase text-sm placeholder:text-slate-600 transition-all" 
                  placeholder="MẬT KHẨU" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isAuthenticating}
                />
              </div>
            </div>
          </div>

          {showError && (
            <div className="mx-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black text-center uppercase leading-tight animate-shake">
              ⚠️ {showError}
            </div>
          )}

          {statusMessage && !showError && (
            <div className="text-indigo-300 text-[10px] font-black text-center uppercase animate-pulse">
              {statusMessage}
            </div>
          )}

          <div className="px-2">
            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full py-5 bg-white text-slate-900 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:bg-slate-100 transition-all border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-900" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>ĐANG KIỂM TRA...</span>
                </>
              ) : (
                <>
                  <span>VÀO HỆ THỐNG</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
