
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LessonPlanView } from './components/LessonPlanView';
import { LoginPage } from './components/LoginPage';
import { FormInputs, LessonPlan } from './types';
import { generateLessonPlan, extractLessonListFromPdf, extractMetadataFromTemplate } from './geminiService';
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
    } catch { return null; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
    nang_luc_so_file_data: '',
    autoComposeMode: 'TEMPLATE'
  });

  useEffect(() => {
    const savedKey = sessionStorage.getItem('temp_api_key');
    if (savedKey) {
      (process.env as any).API_KEY = savedKey;
      if ((window as any).process) (window as any).process.env.API_KEY = savedKey;
    }
  }, []);

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
    
    try {
      setError(null);
      setIsProcessing(true);
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (fieldName === 'textbookPdfData') {
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64 = (reader.result as string).split(',')[1];
           setInputs(prev => ({ ...prev, textbookPdfData: base64 }));
           setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
           try {
             const lessons = await extractLessonListFromPdf(base64);
             setAvailableLessons(lessons);
           } catch (err) { setError("❌ Lỗi quét mục lục PDF."); }
           finally { setIsProcessing(false); }
        };
        reader.readAsDataURL(file);
        return;
      }

      let text = "";
      if (extension === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        text = res.value;
      } else {
        text = await file.text();
      }

      setInputs(prev => ({ ...prev, [fieldName]: text }));
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));

      // TỰ ĐỘNG ĐIỀN FORM: Nếu là file mẫu hoặc phụ lục, AI sẽ đọc để điền form ngay
      if (text.trim().length > 100) {
        const metadata = await extractMetadataFromTemplate(text);
        if (metadata) {
          setInputs(prev => ({
            ...prev,
            truong: metadata.truong || prev.truong,
            to: metadata.to || prev.to,
            ten_bai_day: metadata.ten_bai_day || prev.ten_bai_day,
            subject: (metadata as any).subject || prev.subject,
            lop: metadata.lop || prev.lop,
            so_tiet: metadata.so_tiet || prev.so_tiet
          }));
        }
      }
    } catch (err) { setError("Lỗi đọc tệp."); }
    finally { setIsProcessing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.ten_bai_day) { setError("Vui lòng nhập tên bài."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateLessonPlan(inputs);
      setResult(plan);
    } catch (err: any) { setError(err.message || "Lỗi tạo giáo án."); }
    finally { setIsLoading(false); }
  };

  const handleLoginSuccess = (userData: UserSession, apiKey: string) => {
    (process.env as any).API_KEY = apiKey;
    if ((window as any).process) (window as any).process.env.API_KEY = apiKey;
    setSession(userData);
    setInputs(prev => ({ ...prev, giao_vien: userData.username }));
    localStorage.setItem('lesson_plan_session', JSON.stringify(userData));
    sessionStorage.setItem('temp_api_key', apiKey);
  };

  if (!session) return <LoginPage onLogin={handleLoginSuccess} />;

  return (
    <Layout user={session.username} isAdmin={session.isAdmin} onLogout={() => {
      setSession(null);
      localStorage.removeItem('lesson_plan_session');
      sessionStorage.removeItem('temp_api_key');
    }}>
      <div className="max-w-4xl mx-auto space-y-4 pb-10">
        <form onSubmit={handleSubmit} className="space-y-4 no-print">
          {/* Section I: Admin Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               I. Thông tin hành chính (AI tự điền khi nạp file)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="rounded-xl border-2 p-3 text-sm font-black focus:border-indigo-500 outline-none" placeholder="Tên trường" />
              <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="rounded-xl border-2 p-3 text-sm font-black focus:border-indigo-500 outline-none" placeholder="Tổ chuyên môn" />
            </div>
          </div>

          {/* Section II: Lesson details */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase">AI ĐANG ĐỌC TỆP NGUỒN...</span>
                </div>
              </div>
            )}
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               II. Kịch bản bài dạy
            </h3>
            
            {availableLessons.length > 0 && (
              <select className="w-full mb-4 rounded-xl p-3 border-2 text-sm font-bold bg-indigo-50 border-indigo-100" onChange={(e) => setInputs(prev => ({ ...prev, ten_bai_day: e.target.value }))} value={availableLessons.includes(inputs.ten_bai_day) ? inputs.ten_bai_day : ""}>
                <option value="">-- Chọn bài từ mục lục SGK --</option>
                {availableLessons.map((l, i) => <option key={i} value={l}>{l}</option>)}
              </select>
            )}

            <textarea name="ten_bai_day" value={inputs.ten_bai_day} onChange={handleInputChange} className="w-full rounded-2xl p-4 border-2 font-black text-xl focus:border-indigo-500 outline-none min-h-[100px] bg-slate-50/50" placeholder="AI sẽ tự điền tên bài khi bạn nạp file mẫu..." required />
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              <select name="subject" value={inputs.subject} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-sm font-black bg-white">
                <option value="TOÁN">Toán</option>
                <option value="NGỮ VĂN">Ngữ văn</option>
                <option value="KHTN">KHTN</option>
                <option value="TIẾNG ANH">Tiếng Anh</option>
                <option value="LỊCH SỬ - ĐỊA LÍ">Lịch sử - Địa lí</option>
                <option value="GDCD">GDCD</option>
              </select>
              <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-center text-sm font-black" placeholder="Lớp" />
              <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className="rounded-xl p-3 border-2 text-center text-sm font-black" placeholder="Tiết" />
            </div>
          </div>

          {/* Section III: Integrations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               III. Tùy chọn chuyên biệt
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'integrate_active_methods', label: 'Phương pháp tích cực', icon: '🚀' },
                { id: 'integrate_ATGT', label: 'An toàn giao thông', icon: '🚦' },
                { id: 'integrate_environment', label: 'Môi trường', icon: '🌱' },
                { id: 'integrate_ANQP', label: 'ANQP', icon: '🎖️' },
                { id: 'nang_luc_so', label: 'Năng lực số', icon: '💻' },
                { id: 'ai_competency_assessment', label: 'Đánh giá AI', icon: '🤖' }
              ].map(opt => (
                <button key={opt.id} type="button" onClick={() => toggleOption(opt.id as keyof FormInputs)} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${inputs[opt.id as keyof FormInputs] ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-gray-50 text-slate-400'}`}>
                  <span className="text-xl mb-1">{opt.icon}</span>
                  <span className="text-[9px] font-black uppercase text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section IV: Source files */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-black text-indigo-950 uppercase mb-4 flex items-center">
               <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
               IV. Nạp tệp nguồn (AI sẽ đọc để điền form)
            </h3>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 text-[10px] font-black uppercase">
              <button type="button" onClick={() => setInputs(p => ({...p, autoComposeMode: 'TEMPLATE'}))} className={`flex-1 py-3 rounded-xl transition-all ${inputs.autoComposeMode === 'TEMPLATE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Sử dụng Giáo án mẫu</button>
              <button type="button" onClick={() => setInputs(p => ({...p, autoComposeMode: 'TEXTBOOK'}))} className={`flex-1 py-3 rounded-xl transition-all ${inputs.autoComposeMode === 'TEXTBOOK' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Quét SGK PDF</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { field: 'phu_luc_1', label: 'PHỤ LỤC 1' },
                { field: 'phu_luc_3', label: 'PHỤ LỤC 3' },
                { field: inputs.autoComposeMode === 'TEMPLATE' ? 'khbg_mau' : 'textbookPdfData', label: inputs.autoComposeMode === 'TEMPLATE' ? 'FILE MẪU (.DOCX)' : 'SÁCH GK (.PDF)' },
                ...(inputs.nang_luc_so ? [{ field: 'nang_luc_so_file_data', label: 'TỆP NLS' }] : [])
              ].map(f => (
                <div key={f.field} className="relative">
                  <input type="file" accept={f.field.includes('Pdf') ? '.pdf' : '.docx,.txt'} onChange={e => handleFileUpload(e, f.field as keyof FormInputs)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className={`h-14 border-2 border-dashed rounded-2xl flex items-center justify-center px-4 text-center transition-all ${fileNames[f.field] ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="text-[9px] font-black uppercase truncate leading-tight">{fileNames[f.field] || f.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="p-4 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded-2xl border border-red-200 text-center animate-shake">⚠️ {error}</div>}

          <button type="submit" disabled={isLoading} className="w-full py-5 bg-[#0f172a] text-white rounded-2xl font-black uppercase shadow-2xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center space-x-3 text-lg tracking-widest border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
            {isLoading ? "HỆ THỐNG ĐANG SOẠN THẢO..." : "KHỞI TẠO KHBG CHUYÊN NGHIỆP V4.0"}
          </button>
        </form>

        {result && (
          <div ref={resultRef} className="pt-10">
            <div className="flex justify-between items-center mb-6 no-print bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
               <h4 className="text-sm font-black text-indigo-700 uppercase italic">KỊCH BẢN GIẢNG DẠY ĐÃ SẴN SÀNG</h4>
               <div className="flex space-x-3">
                  <button onClick={() => window.print()} className="bg-white border-2 border-indigo-200 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase">Máy in</button>
                  <button onClick={() => exportToWord(result)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-md">Xuất Word</button>
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
