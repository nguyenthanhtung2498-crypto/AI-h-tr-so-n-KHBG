
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LessonPlanView } from './components/LessonPlanView';
import { LoginPage } from './components/LoginPage';
import { FormInputs, LessonPlan } from './types';
import { generateLessonPlan, extractLessonListFromPdf } from './geminiService';
import { exportToWord } from './exportService';
import mammoth from 'mammoth';

interface UserSession {
  username: string;
  isAdmin: boolean;
}

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('lesson_plan_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingLessons, setIsExtractingLessons] = useState(false);
  const [availableLessons, setAvailableLessons] = useState<string[]>([]);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const resultRef = useRef<HTMLDivElement>(null);

  const [inputs, setInputs] = useState<FormInputs>({
    truong: 'Trường THCS Huỳnh Thúc Kháng',
    to: '',
    giao_vien: session?.username || '',
    ten_bai_day: '',
    subject: 'TOÁN',
    lop: '8',
    so_tiet: '2',
    muc_tieu_them: '',
    ai_competency_assessment: false,
    integrate_ATGT: false,
    integrate_ANQP: false,
    integrate_environment: false,
    integrate_active_methods: true,
    phu_luc_1: '',
    phu_luc_3: '',
    khbg_mau: '',
    nang_luc_so: false,
    autoComposeMode: 'TEMPLATE'
  });

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const toggleOption = (name: keyof FormInputs) => {
    setInputs(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormInputs) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    try {
      setError(null);
      if (fieldName === 'textbookPdfData') {
        setIsExtractingLessons(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64 = (reader.result as string).split(',')[1];
           setInputs(prev => ({ ...prev, textbookPdfData: base64 }));
           setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
           try {
             const lessons = await extractLessonListFromPdf(base64);
             setAvailableLessons(lessons);
           } catch (err) {
             setError("❌ Lỗi phân tích mục lục. Vui lòng nhập tay.");
           } finally {
             setIsExtractingLessons(false);
           }
        };
        reader.readAsDataURL(file);
        return;
      }

      let text = "";
      if (extension === '.docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = res.value;
      } else {
        text = await file.text();
      }

      setInputs(prev => ({ ...prev, [fieldName]: text }));
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
    } catch (err) {
      setError("Lỗi đọc tệp.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.ten_bai_day) {
      setError("Vui lòng nhập hoặc chọn tên bài dạy.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const plan = await generateLessonPlan(inputs);
      setResult(plan);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo giáo án. Vui lòng kiểm tra lại mã API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData: UserSession, apiKey: string) => {
    // Lưu API Key vào biến môi trường giả lập để geminiService có thể truy cập
    if ((window as any).process && (window as any).process.env) {
      (window as any).process.env.API_KEY = apiKey;
    }
    
    setSession(userData);
    setInputs(prev => ({ ...prev, giao_vien: userData.username }));
    localStorage.setItem('lesson_plan_session', JSON.stringify(userData));
    // Lưu tạm key vào sessionStorage để duy trì trong phiên làm việc
    sessionStorage.setItem('temp_api_key', apiKey);
  };

  // Khôi phục API Key nếu đã đăng nhập trước đó
  useEffect(() => {
    const savedKey = sessionStorage.getItem('temp_api_key');
    if (savedKey && (window as any).process && (window as any).process.env) {
      (window as any).process.env.API_KEY = savedKey;
    }
  }, []);

  if (!session) return <LoginPage onLogin={handleLoginSuccess} />;

  return (
    <Layout user={session.username} isAdmin={session.isAdmin} onLogout={() => {
      setSession(null);
      localStorage.removeItem('lesson_plan_session');
      sessionStorage.removeItem('temp_api_key');
    }}>
      <div className="max-w-4xl mx-auto space-y-4 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 no-print">
          {/* Section I */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               I. Thông tin hành chính
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tên trường</label>
                <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="w-full rounded-xl border-2 p-3 text-sm font-black focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tổ chuyên môn</label>
                <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="w-full rounded-xl border-2 p-3 text-sm font-black focus:border-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          {/* Section II */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 relative overflow-hidden">
            {isExtractingLessons && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center animate-bounce">
                  <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ĐANG PHÂN TÍCH MỤC LỤC SGK...</span>
                </div>
              </div>
            )}
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               II. Kịch bản bài dạy
            </h3>

            {availableLessons.length > 0 && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in duration-500">
                <label className="text-[9px] font-black text-indigo-600 uppercase mb-2 block">✨ Chọn bài học từ mục lục SGK:</label>
                <select 
                  className="w-full rounded-xl p-3 border-2 text-sm font-bold bg-white border-indigo-200 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  onChange={(e) => setInputs(prev => ({ ...prev, ten_bai_day: e.target.value }))}
                  value={availableLessons.includes(inputs.ten_bai_day) ? inputs.ten_bai_day : ""}
                >
                  <option value="">-- Click để chọn nhanh bài học --</option>
                  {availableLessons.map((l, idx) => (
                    <option key={idx} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea 
              name="ten_bai_day" 
              value={inputs.ten_bai_day} 
              onChange={handleInputChange} 
              className="w-full rounded-2xl p-4 border-2 font-black text-xl focus:border-indigo-500 outline-none min-h-[100px] bg-slate-50/30 transition-all" 
              placeholder="Nhập hoặc chọn tên bài dạy..." 
              required 
            />
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              <select name="subject" value={inputs.subject} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-sm font-black bg-white focus:border-indigo-500 outline-none">
                <option value="KHTN">KHTN</option>
                <option value="TOÁN">Toán</option>
                <option value="NGỮ VĂN">Ngữ văn</option>
                <option value="TIẾNG ANH">Tiếng Anh</option>
                <option value="LỊCH SỬ - ĐỊA LÍ">Lịch sử - Địa lí</option>
                <option value="GDCD">GDCD</option>
              </select>
              <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-center text-sm font-black bg-white focus:border-indigo-500 outline-none" placeholder="Lớp" />
              <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-center text-sm font-black bg-white focus:border-indigo-500 outline-none" placeholder="Tiết" />
            </div>
          </div>

          {/* Integration & Methods Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               III. Tùy chọn tích hợp chuyên sâu
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'integrate_active_methods', label: 'Phương pháp tích cực', icon: '🚀' },
                { id: 'integrate_ATGT', label: 'An toàn giao thông', icon: '🚦' },
                { id: 'integrate_environment', label: 'Bảo vệ môi trường', icon: '🌱' },
                { id: 'integrate_ANQP', label: 'An ninh quốc phòng', icon: '🎖️' },
                { id: 'nang_luc_so', label: 'Năng lực số (3456)', icon: '💻' },
                { id: 'ai_competency_assessment', label: 'Đánh giá năng lực AI', icon: '🤖' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id as keyof FormInputs)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all group ${inputs[opt.id as keyof FormInputs] ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' : 'border-gray-100 bg-gray-50 text-slate-400 hover:border-indigo-200'}`}
                >
                  <span className={`text-xl mb-1 transition-transform ${inputs[opt.id as keyof FormInputs] ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`}>{opt.icon}</span>
                  <span className="text-[9px] font-black uppercase text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               IV. Nạp dữ liệu nguồn
            </h3>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 text-[10px] font-black uppercase border border-slate-200">
              <button type="button" onClick={() => setInputs(p => ({...p, autoComposeMode: 'TEMPLATE'}))} className={`flex-1 py-3 rounded-xl transition-all ${inputs.autoComposeMode === 'TEMPLATE' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Dùng Giáo án mẫu .docx</button>
              <button type="button" onClick={() => setInputs(p => ({...p, autoComposeMode: 'TEXTBOOK'}))} className={`flex-1 py-3 rounded-xl transition-all ${inputs.autoComposeMode === 'TEXTBOOK' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Quét mục lục SGK .pdf</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { field: 'phu_luc_1', label: 'PL1 (KHGD TỔ)' },
                { field: 'phu_luc_3', label: 'PL3 (KHGD CÁ NHÂN)' },
                { field: inputs.autoComposeMode === 'TEMPLATE' ? 'khbg_mau' : 'textbookPdfData', label: inputs.autoComposeMode === 'TEMPLATE' ? 'MẪU GIÁO ÁN (.DOCX)' : 'SÁCH GIÁO KHOA (.PDF)' }
              ].map(f => (
                <div key={f.field} className="relative group">
                  <input type="file" accept={f.field === 'textbookPdfData' ? '.pdf' : '.docx,.txt'} onChange={e => handleFileUpload(e, f.field as keyof FormInputs)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`h-14 border-2 border-dashed rounded-2xl flex items-center justify-center px-4 text-center transition-all ${fileNames[f.field] ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 group-hover:bg-indigo-50 group-hover:border-indigo-300'}`}>
                    <span className="text-[9px] font-black uppercase truncate leading-tight">{fileNames[f.field] || f.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="p-4 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-2xl border border-red-200 text-center animate-shake">{error}</div>}

          <button type="submit" disabled={isLoading} className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black uppercase shadow-2xl hover:bg-black disabled:opacity-50 border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center space-x-3 text-lg tracking-widest">
            {isLoading ? (
               <>
                 <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 <span>AI ĐANG THIẾT KẾ KỊCH BẢN...</span>
               </>
            ) : "KHỞI TẠO KHBG CHUYÊN NGHIỆP V4.0"}
          </button>
        </form>

        {result && (
          <div ref={resultRef} className="pt-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex justify-between items-center mb-6 no-print bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
               <div>
                  <h4 className="text-sm font-black text-indigo-700 uppercase">KỊCH BẢN GIẢNG DẠY HOÀN TẤT</h4>
                  <p className="text-[9px] font-bold text-indigo-400">Tối ưu 5512 | Phẩm chất & Năng lực chuẩn | Script V4.0</p>
               </div>
               <div className="flex space-x-3">
                  <button onClick={() => window.print()} className="bg-white border-2 border-indigo-200 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm hover:bg-white/80 transition-all">Máy in</button>
                  <button onClick={() => exportToWord(result)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md hover:bg-indigo-700 active:scale-95 transition-all">Xuất Word</button>
               </div>
            </div>
            <LessonPlanView plan={result} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
