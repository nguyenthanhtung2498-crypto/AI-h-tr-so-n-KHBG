
import React, { useState } from 'react';

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
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setShowError("Vui lòng dán mã API Key Gemini của bạn.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setShowError("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }

    setIsAuthenticating(true);
    setShowError('');

    try {
      // Xác thực tài khoản hệ thống (Simulated)
      const lowerUser = username.toLowerCase();
      const isDemo = (lowerUser === 'demo1' || lowerUser === 'demo2') && password === '123456';
      const isAdmin = lowerUser === 'admin' && password === '123456';

      if (isDemo || isAdmin) {
        onLogin({ username: username.trim(), isAdmin: isAdmin }, apiKey.trim());
      } else {
        setShowError("Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      setShowError("Lỗi kết nối hệ thống xác thực.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[480px] w-full bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-4 p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="48" fill="none" stroke="#6366f1" strokeWidth="2" />
              <path d="M30 65 L50 75 L70 65 V35 L50 25 L30 35 Z" fill="#1e1b4b" />
              <path d="M50 30 V55 M40 45 L50 55 L60 45" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">THCS HUỲNH THÚC KHÁNG</h1>
          <p className="text-indigo-400 font-bold tracking-[0.2em] text-[8px] uppercase mt-1">AI KHBG V4.0 PROFESSIONAL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            {/* API KEY INPUT SECTION */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1 flex justify-between">
                <span>Mã API Gemini (Copy & Dán vào đây)</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">Lấy mã?</a>
              </label>
              <input 
                type="password" 
                required 
                className="w-full px-5 py-3.5 bg-indigo-500/10 border border-indigo-500/30 text-white rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs placeholder:text-slate-600" 
                placeholder="Dán mã API Key của bạn (AIzaSy...)" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
            </div>

            {/* LOGIN CREDENTIALS */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tài khoản & Mật khẩu trường</label>
              <input 
                type="text" 
                required 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-indigo-500 font-bold uppercase text-sm" 
                placeholder="Tên đăng nhập" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
              <input 
                type="password" 
                required 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl focus:outline-none focus:border-indigo-500 font-bold uppercase text-sm" 
                placeholder="Mật khẩu" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>

          {showError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[9px] font-black text-center uppercase">
              {showError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full py-4 bg-white text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 mt-4 flex items-center justify-center space-x-2"
          >
            {isAuthenticating ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-900" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>ĐANG XÁC THỰC...</span>
              </>
            ) : "VÀO HỆ THỐNG"}
          </button>
        </form>
      </div>
    </div>
  );
};
