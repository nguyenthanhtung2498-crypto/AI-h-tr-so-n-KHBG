
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // API Key được quản lý tự động bởi nền tảng qua process.env.API_KEY
      onLogin(username);
    } else {
      setError('Vui lòng nhập đầy đủ Tài khoản và Mật khẩu.');
    }
  };

  const handleOpenSelectKey = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        alert("Đã kết nối API Key từ hệ thống thành công.");
      } else {
        alert("Tính năng này chỉ khả dụng trong môi trường AI Studio.");
      }
    } catch (err) {
      console.error("Lỗi khi mở trình chọn key:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-900">
      {/* Hiệu ứng nền */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>

      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 border border-white/20">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative bg-white p-5 rounded-3xl shadow-2xl border border-white/40 transform transition-transform hover:scale-105 duration-300">
              <img 
                src="./input_file_1.png" 
                alt="Logo Trường" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=LOGO';
                }}
              />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-md">
            Cổng Giáo Viên
          </h2>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <span className="h-px w-8 bg-indigo-400/50"></span>
            <p className="text-[11px] text-indigo-200 font-black uppercase tracking-[0.2em]">
              Hệ thống KHBG Chuẩn 5512
            </p>
            <span className="h-px w-8 bg-indigo-400/50"></span>
          </div>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="group">
              <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1.5 ml-1 tracking-widest transition-colors group-focus-within:text-white">
                Tài khoản
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-2xl relative block w-full px-4 py-3.5 bg-white/5 border border-white/10 placeholder-indigo-300/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all sm:text-sm"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-indigo-300 uppercase mb-1.5 ml-1 tracking-widest transition-colors group-focus-within:text-white">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-2xl relative block w-full px-4 py-3.5 bg-white/5 border border-white/10 placeholder-indigo-300/50 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all sm:text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button 
                type="button" 
                onClick={handleOpenSelectKey}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-indigo-500/30 rounded-2xl text-[11px] font-black text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-white transition-all uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                <span>Kết nối API Key hệ thống</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <p className="text-red-400 text-[11px] font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 uppercase tracking-[0.15em] transform active:scale-95"
          >
            Đăng nhập hệ thống
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-[10px] text-indigo-200/40 font-medium leading-relaxed uppercase tracking-wider">
            Chuẩn hóa 5512 - GDPT 2018
            <br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-white transition-colors font-bold mt-1 inline-block">
              Chi tiết về API Key & Thanh toán
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
