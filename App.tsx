
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FormSection } from './components/FormSection';
import { LessonPlanView } from './components/LessonPlanView';
import { LoginPage } from './components/LoginPage';
import { FormInputs, LessonPlan, Subject } from './types';
import { generateLessonPlan, extractLessonMetadata, extractCatalogFromPdf } from './geminiService';
import { exportToWord } from './exportService';
import mammoth from 'mammoth';

interface UserSession {
  username: string;
  isAdmin: boolean;
}

type AppView = 'FORM' | 'CATALOG' | 'RESULT';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('lesson_plan_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userApiKey, setUserApiKey] = useState<string>("");
  const [view, setView] = useState<AppView>('FORM');
  const [catalog, setCatalog] = useState<string[]>([]);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [tichHopNLS, setTichHopNLS] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  const [inputs, setInputs] = useState<FormInputs>({
    truong: 'Trường THCS Huỳnh Thúc Kháng',
    to: '',
    giao_vien: session?.username || '',
    ten_bai_day: '',
    subject: 'TOÁN',
    lop: '6',
    so_tiet: '1',
    muc_tieu_them: '',
    ai_competency_assessment: false,
    integrate_ATGT: false,
    integrate_ANQP: false,
    integrate_environment: false,
    phu_luc_1: '',
    phu_luc_3: '',
    khbg_mau: '',
    nang_luc_so: '',
    autoComposeMode: 'TEMPLATE'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (userData: UserSession, apiKey: string) => {
  localStorage.setItem('lesson_plan_session', JSON.stringify(userData)); // chỉ lưu user + role
  setSession(userData);
  setUserApiKey(apiKey); // ✅ lưu API key trong RAM
  setInputs(prev => ({ ...prev, giao_vien: userData.username }));
};

  const handleLogout = () => {
  localStorage.removeItem('lesson_plan_session');
  setSession(null);
  setUserApiKey(""); // ✅ xoá API key khỏi RAM
  setResult(null);
  setView('FORM');
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputs(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
      if (autoFilledFields.has(name)) {
        const next = new Set(autoFilledFields);
        next.delete(name);
        setAutoFilledFields(next);
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormInputs) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    try {
      if (fieldName === 'textbookPdfData' as any) {
        if (extension !== '.pdf') {
          setError("Vui lòng tải tệp PDF Sách giáo khoa.");
          return;
        }
        setIsAnalyzingPdf(true);
        const base64 = await blobToBase64(file);
        setInputs(prev => ({ ...prev, textbookPdfData: base64 }));
        try {
          const lessons = await extractCatalogFromPdf(base64, userApiKey);
          if (lessons.length > 0) {
            setCatalog(lessons);
            setView('CATALOG');
          } else {
            setError("Hệ thống không tìm thấy mục lục.");
          }
        } catch (err: any) {
          setError("Lỗi phân tích PDF.");
        } finally {
          setIsAnalyzingPdf(false);
        }
        return;
      }

      let text = "";
      if (extension === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        text = res.value;
      } else if (extension === '.txt') {
        text = await file.text();
      } else {
        setError("Vui lòng dùng tệp .docx hoặc .txt.");
        return;
      }

      setInputs(prev => ({ ...prev, [fieldName]: text }));

      if (fieldName === 'khbg_mau' && text) {
        setIsExtractingMetadata(true);
        try {
          const meta = await extractLessonMetadata(text, userApiKey);;
          const filled = new Set<string>();
          
          setInputs(prev => {
            const next = { ...prev };
            if (meta.ten_bai_day) {
              next.ten_bai_day = meta.ten_bai_day;
              filled.add('ten_bai_day');
            }
            if (meta.subject) {
              next.subject = meta.subject as Subject;
              filled.add('subject');
            }
            if (meta.lop) {
              next.lop = meta.lop;
              filled.add('lop');
            }
            if (meta.so_tiet) {
              next.so_tiet = meta.so_tiet;
              filled.add('so_tiet');
            }
            return next;
          });
          setAutoFilledFields(filled);
        } finally {
          setIsExtractingMetadata(false);
        }
      }
    } catch (err: any) {
      setError(`Lỗi tệp: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputs.ten_bai_day) {
      setError("Vui lòng nhập hoặc chọn Tên bài dạy.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateLessonPlan(inputs, userApiKey);
      setResult(plan);
      setView('RESULT');
    } catch (err: any) {
      setError(err.message || "Lỗi tạo giáo án.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectLessonFromCatalog = (lessonName: string) => {
    setInputs(prev => ({ ...prev, ten_bai_day: lessonName }));
    const next = new Set(autoFilledFields);
    next.add('ten_bai_day');
    setAutoFilledFields(next);
    setView('FORM');
  };

  if (!session) return <LoginPage onLogin={handleLogin} />;

  if (view === 'CATALOG') {
    return (
      <Layout user={session.username} isAdmin={session.isAdmin}>
        <div className="max-w-2xl mx-auto py-12 px-6 bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-indigo-100 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter">Mục lục Sách giáo khoa</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">Chọn bài học bạn muốn AI thiết kế chi tiết</p>
          </div>
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {catalog.map((lesson, idx) => (
              <button key={idx} onClick={() => selectLessonFromCatalog(lesson)} className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center group shadow-sm">
                <span className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-bold mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{idx + 1}</span>
                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-900 flex-1">{lesson}</span>
              </button>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
            <button onClick={() => setView('FORM')} className="text-xs font-black uppercase text-gray-400 hover:text-indigo-600 transition-colors">Quay lại</button>
          </div>
        </div>
      </Layout>
    );
  }

  const getAutoFilledClass = (name: string) => 
    autoFilledFields.has(name) ? "border-indigo-400 ring-4 ring-indigo-50 bg-indigo-50/20 transition-all duration-700" : "border-gray-200 bg-gray-50/30";

  return (
    <Layout user={session.username} isAdmin={session.isAdmin} onLogout={handleLogout}>
      {view === 'RESULT' && result ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center mb-4 no-print">
            <button onClick={() => setView('FORM')} className="flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              Quay lại chỉnh sửa
            </button>
            <div className="flex space-x-3">
              <button onClick={() => window.print()} className="bg-white border px-6 py-3 rounded-2xl hover:bg-gray-50 flex items-center shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">Xuất PDF / In</button>
              <button onClick={() => exportToWord(result)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 shadow-xl font-black text-[10px] uppercase tracking-widest transition-all">Lưu Word</button>
            </div>
          </div>
          <LessonPlanView plan={result} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 no-print">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* SECTION 1: ADMIN INFO - COMPACT */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tên trường</label>
                  <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="w-full rounded-xl border-gray-100 p-2.5 border focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-gray-600" />
                </div>
                <div className="w-32">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tổ chuyên môn</label>
                  <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="w-full rounded-xl border-gray-100 p-2.5 border text-xs" placeholder="Tổ..." />
                </div>
                <div className="w-40">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Giáo viên</label>
                  <input type="text" name="giao_vien" value={inputs.giao_vien} onChange={handleInputChange} className="w-full rounded-xl border-gray-100 p-2.5 border text-xs font-bold text-indigo-700" />
                </div>
              </div>

              {/* SECTION 2: THE CORE (LESSON ESSENCE) */}
              <div className="bg-gradient-to-br from-white to-indigo-50/30 rounded-[2.5rem] p-8 shadow-xl border border-indigo-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-24 h-24 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.2em] flex items-center">
                        <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Tên bài dạy chi tiết
                      </label>
                      {autoFilledFields.has('ten_bai_day') && (
                        <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">✨ AI đã tự điền</span>
                      )}
                    </div>
                    <textarea 
                      name="ten_bai_day" 
                      value={inputs.ten_bai_day} 
                      onChange={handleInputChange} 
                      rows={2}
                      className={`w-full rounded-2xl p-4 border font-black text-xl text-gray-800 shadow-sm resize-none focus:ring-0 ${getAutoFilledClass('ten_bai_day')}`}
                      placeholder="VD: Bài 1: Sự truyền ánh sáng..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Môn học</label>
                      <select name="subject" value={inputs.subject} onChange={handleInputChange} className={`w-full rounded-xl p-3 border text-sm font-bold shadow-sm appearance-none cursor-pointer ${getAutoFilledClass('subject')}`}>
                        <option value="TOÁN">Toán học</option><option value="KHTN">KHTN</option><option value="NGỮ VĂN">Ngữ văn</option><option value="TIẾNG ANH">Tiếng Anh</option>
                        <option value="LỊCH SỬ - ĐỊA LÍ">Lịch sử - Địa lí</option><option value="GDCD">GDCD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Khối lớp</label>
                      <div className="relative">
                        <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className={`w-full rounded-xl p-3 border text-center text-sm font-black shadow-sm ${getAutoFilledClass('lop')}`} />
                        <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-300">LỚP</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Số tiết</label>
                      <div className="relative">
                        <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className={`w-full rounded-xl p-3 border text-center text-sm font-black shadow-sm ${getAutoFilledClass('so_tiet')}`} />
                        <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-300">TIẾT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MODE & SOURCE */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-50">
                  <button 
                    type="button" 
                    onClick={() => setInputs(prev => ({ ...prev, autoComposeMode: 'TEMPLATE' }))}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${inputs.autoComposeMode === 'TEMPLATE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50/50 text-gray-400 hover:text-gray-600'}`}
                  >
                    📂 Dùng giáo án mẫu
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setInputs(prev => ({ ...prev, autoComposeMode: 'TEXTBOOK' }))}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${inputs.autoComposeMode === 'TEXTBOOK' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50/50 text-gray-400 hover:text-gray-600'}`}
                  >
                    📚 Soạn từ SGK PDF
                  </button>
                </div>
                <div className="p-6">
                  {inputs.autoComposeMode === 'TEMPLATE' ? (
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-700">Tải tệp nguồn</h4>
                        <p className="text-[10px] text-gray-400">AI sẽ đọc cấu trúc và nội dung để tùy biến giáo án của bạn.</p>
                      </div>
                      <div className="relative">
                        <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'khbg_mau')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          {isExtractingMetadata ? "Đang đọc..." : "Chọn Tệp"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-gray-700">Tải SGK điện tử</h4>
                        <p className="text-[10px] text-gray-400">Hệ thống sẽ trích xuất bài học trực tiếp từ PDF Sách giáo khoa.</p>
                      </div>
                      <div className="relative">
                        <input type="file" accept=".pdf" disabled={isAnalyzingPdf} onChange={(e) => handleFileUpload(e, 'textbookPdfData' as any)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="bg-amber-50 text-amber-600 px-6 py-2.5 rounded-xl text-xs font-black uppercase group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                          {isAnalyzingPdf ? "Đang quét..." : "Chọn PDF"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: INTEGRATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                    Tích hợp đặc thù
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors">
                      <input type="checkbox" name="integrate_ANQP" checked={inputs.integrate_ANQP} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded" />
                      <div className="ml-3">
                        <div className="text-[11px] font-black text-indigo-900 uppercase">An ninh Quốc phòng</div>
                        <div className="text-[9px] text-gray-400 font-bold">TT 08/2024 (Lớp {inputs.lop})</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                      <input type="checkbox" name="integrate_environment" checked={inputs.integrate_environment} onChange={handleInputChange} className="w-4 h-4 text-emerald-600 rounded" />
                      <div className="ml-3 text-[11px] font-black text-emerald-900 uppercase">Bảo vệ Môi trường</div>
                    </label>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                    Năng lực kỷ nguyên số
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl cursor-pointer">
                      <input type="checkbox" checked={tichHopNLS} onChange={(e) => setTichHopNLS(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" />
                      <span className="ml-3 text-[11px] font-black text-indigo-900 uppercase">Năng lực số (3456)</span>
                    </label>
                    {tichHopNLS && (
                      <div className="px-2">
                        <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'nang_luc_so')} className="text-[9px] text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold uppercase border border-red-100 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading || isAnalyzingPdf} 
                className="w-full py-6 bg-indigo-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center group"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Đang thiết kế giáo án...
                  </>
                ) : (
                  <>
                    Thiết kế bài dạy ngay
                    <svg className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 sticky top-10">
            <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-100 p-10 text-center shadow-inner h-[600px] flex flex-col items-center justify-center relative group">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Bản thảo KHBG</h3>
              <p className="text-gray-400 text-xs mt-4 font-medium max-w-[250px] leading-relaxed italic">
                Sau khi bấm nút, AI sẽ thiết kế một kế hoạch bài dạy chi tiết bám sát Công văn 5512 và tích hợp ANQP phù hợp khối {inputs.lop}.
              </p>
              
              {/* Mini preview tags */}
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                <span className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">Chuẩn 5512</span>
                <span className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">Tích hợp ANQP</span>
                <span className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-100">Năng lực số</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
