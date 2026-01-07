
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
      console.warn("Môi trường AI Studio chưa sẵn sàng.");
    }
  };

  const handleSelectKey = async () => {
    try {
      // Gọi hộp thoại hệ thống để người dùng DÁN API Key của họ vào
      await window.aistudio?.openSelectKey();
      // Theo quy định, giả định người dùng đã dán thành công và tiếp tục
      setHasKey(true);
      setStep(2);
    } catch (e) {
      setShowError("Không thể mở hộp thoại nhập Key.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) {
      setStep(1);
      return;
    }
    
    if (!username.trim() || !password.trim()) {
      setShowError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setIsAuthenticating(true);
    setShowError('');

    // Giả lập xác thực nội bộ trường Huỳnh Thúc Kháng
    setTimeout(() => {
      const lowerUser = username.toLowerCase();
      const isDemo = (lowerUser === 'demo1' || lowerUser === 'demo2') && password === '123456';
      const isAdmin = lowerUser === 'admin' && password === '123456';

      if (isDemo || isAdmin) {
        onLogin({ 
          username: username.trim(), 
          isAdmin: isAdmin 
        });
      } else {
        setShowError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const SchoolLogo = () => (
    <div className="w-32 h-32 relative mb-6">
      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
      <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-2xl">
        <circle cx="50" cy="50" r="48" fill="white" stroke="#6366f1" strokeWidth="1" />
        <path d="M20 50 A30 30 0 0 0 50 80 A30 30 0 0 0 80 50" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
        <path d="M50 20 L40 40 H60 L50 20 Z" fill="#ef4444" />
        <rect x="47" y="40" width="6" height="25" rx="1" fill="#3b82f6" />
        <text x="50" y="90" fontSize="6" fontWeight="900" textAnchor="middle" fill="#1e1b4b" className="uppercase font-sans">HTK SCHOOL</text>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[1100px] w-full bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden relative z-10 animate-in fade-in zoom-in duration-700">
        
        {/* Left Side: Branding */}
        <div className="flex-1 bg-gradient-to-br from-indigo-950/50 to-slate-950/50 p-12 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-white/5">
          <SchoolLogo />
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">
            THCS HUỲNH THÚC KHÁNG
          </h1>
          <p className="text-indigo-400 font-bold tracking-[0.3em] text-xs uppercase mb-8">AI KHBG V4.0 - PROFESSIONAL</p>
          <div className="space-y-4 max-w-xs text-indigo-200/50 text-[10px] uppercase font-black tracking-widest leading-relaxed">
            <p className="flex items-center justify-center"><span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span> Cá nhân hóa kế hoạch bài dạy</p>
            <p className="flex items-center justify-center"><span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span> Bảo mật dữ liệu giáo viên</p>
            <p className="flex items-center justify-center"><span className="w-1 h-1 bg-indigo-500 rounded-full mr-2"></span> Tích hợp kĩ thuật dạy học tích cực</p>
          </div>
        </div>

        {/* Right Side: Flow */}
        <div className="flex-1 p-8 sm:p-16 flex flex-col justify-center bg-white/[0.01]">
          <div className="max-w-sm mx-auto w-full space-y-10">
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= 1 ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-white/20'}`}>1</div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 1 ? 'text-indigo-400' : 'text-white/10'}`}>Kích hoạt API</span>
              </div>
              <div className={`flex-1 h-[2px] mx-4 transition-colors duration-500 ${step >= 2 ? 'bg-indigo-500' : 'bg-white/5'}`}></div>
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${step >= 2 ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-white/20'}`}>2</div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${step >= 2 ? 'text-indigo-400' : 'text-white/10'}`}>Đăng nhập</span>
              </div>
            </div>

            {step === 1 ? (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">BẮT BUỘC: NHẬP API KEY</h2>
                  <p className="text-indigo-300/50 text-[10px] font-bold uppercase mt-2">Dán mã khóa AI cá nhân của bạn để sử dụng</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-inner">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <p className="text-center text-[11px] text-white/60 leading-relaxed font-medium">
                      Để hệ thống chạy ổn định và độc lập, quý thầy cô vui lòng <span className="text-indigo-400 font-black italic">Copy</span> mã API Key từ Google AI Studio và <span className="text-indigo-400 font-black italic">Dán</span> vào hộp thoại bên dưới.
                    </p>
                  </div>

                  <button 
                    onClick={handleSelectKey} 
                    className="w-full py-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:scale-[1.03] active:scale-[0.98] transition-all border-b-4 border-indigo-800 active:border-b-0"
                  >
                    CLICK ĐỂ DÁN MÃ API KEY
                  </button>
                  
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block text-center text-[9px] text-white/20 hover:text-indigo-400 transition-colors uppercase font-black tracking-widest"
                  >
                    Hướng dẫn lấy mã API Key miễn phí
                  </a>
                </div>

                {hasKey && (
                  <button 
                    onClick={() => setStep(2)} 
                    className="w-full py-4 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center space-x-2 group hover:text-white transition-colors"
                  >
                    <span>Mã đã được nạp. Tiếp tục</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                )}
              </div>
            ) : (
              <form className="space-y-6 animate-in slide-in-from-right-8 duration-500" onSubmit={handleSubmit}>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">ĐĂNG NHẬP HỆ THỐNG</h2>
                  <p className="text-indigo-300/50 text-[10px] font-bold uppercase mt-2">Tài khoản giáo viên đã kích hoạt</p>
                </div>

                <div className="space-y-4">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <input 
                      type="text" 
                      required 
                      disabled={isAuthenticating}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500/50 font-black text-lg uppercase placeholder-white/10 relative z-10" 
                      placeholder="Tên đăng nhập" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                    />
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <input 
                      type="password" 
                      required 
                      disabled={isAuthenticating}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 text-white rounded-2xl focus:outline-none focus:border-indigo-500/50 font-black text-lg uppercase placeholder-white/10 relative z-10" 
                      placeholder="Mật khẩu" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                  </div>
                </div>

                {showError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black text-center uppercase tracking-widest animate-pulse">
                    {showError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isAuthenticating} 
                  className="w-full py-5 bg-white text-indigo-950 rounded-2xl text-xl font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 relative"
                >
                  {isAuthenticating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-950 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-950 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-950 rounded-full animate-bounce delay-200"></div>
                    </div>
                  ) : "VÀO HỆ THỐNG"}
                </button>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-[9px] text-white/20 hover:text-white uppercase font-black tracking-[0.3em] transition-colors"
                  >
                    Thay đổi mã API Key cá nhân
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-8 border-t border-white/5">
              <p className="text-[8px] text-white/20 font-black tracking-[0.5em] uppercase leading-none">
                Hệ thống nội bộ trường Huỳnh Thúc Kháng
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
