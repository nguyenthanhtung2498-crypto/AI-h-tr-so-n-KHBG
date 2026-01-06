
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
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

  const [view, setView] = useState<AppView>('FORM');
  const [catalog, setCatalog] = useState<string[]>([]);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const resultRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleLogin = (userData: UserSession) => {
    localStorage.setItem('lesson_plan_session', JSON.stringify(userData));
    setSession(userData);
    setInputs(prev => ({ ...prev, giao_vien: userData.username }));
  };

  const handleLogout = () => {
    localStorage.removeItem('lesson_plan_session');
    setSession(null);
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

  const clearFile = (fieldName: string) => {
    setInputs(prev => ({ ...prev, [fieldName]: '' }));
    setFileNames(prev => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
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
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64 = (reader.result as string).split(',')[1];
           setInputs(prev => ({ ...prev, textbookPdfData: base64 }));
           setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
           try {
             const lessons = await extractCatalogFromPdf(base64);
             if (lessons.length > 0) {
               setCatalog(lessons);
               setView('CATALOG');
             } else {
               setError("Không tìm thấy mục lục.");
             }
           } catch (err: any) {
             setError("Lỗi phân tích PDF.");
           } finally {
             setIsAnalyzingPdf(false);
           }
        };
        reader.readAsDataURL(file);
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
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));

      // Tự động trích xuất thông tin cho các tệp quan trọng
      if ((fieldName === 'khbg_mau' || fieldName === 'phu_luc_1' || fieldName === 'phu_luc_3') && text) {
        setIsExtractingMetadata(true);
        try {
          const meta = await extractLessonMetadata(text);
          const filled = new Set<string>();
          setInputs(prev => {
            const next = { ...prev };
            if (meta.ten_bai_day && !prev.ten_bai_day) { next.ten_bai_day = meta.ten_bai_day; filled.add('ten_bai_day'); }
            if (meta.subject) { next.subject = meta.subject as Subject; filled.add('subject'); }
            if (meta.lop && (!prev.lop || prev.lop === '6')) { next.lop = meta.lop; filled.add('lop'); }
            if (meta.so_tiet && prev.so_tiet === '1') { next.so_tiet = meta.so_tiet; filled.add('so_tiet'); }
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
    if (!inputs.ten_bai_day) return;
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateLessonPlan(inputs);
      setResult(plan);
    } catch (err: any) {
      setError("Lỗi tạo giáo án.");
    } finally {
      setIsLoading(false);
    }
  };

  const getAutoFilledClass = (name: string) => 
    autoFilledFields.has(name) ? "border-indigo-300 ring-1 ring-indigo-50 bg-indigo-50/10" : "border-gray-200 bg-white";

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={session.username} isAdmin={session.isAdmin} onLogout={handleLogout}>
      <div className="max-w-4xl mx-auto space-y-4 pb-10">
        <div className="no-print animate-in fade-in duration-500">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* I. THÔNG TIN HÀNH CHÍNH */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3 border-b pb-1">
                <h3 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                  I. Thông tin hành chính
                </h3>
                {isExtractingMetadata && (
                  <span className="text-[8px] font-black text-indigo-500 animate-pulse uppercase">Đang phân tích tệp...</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Đơn vị công tác</label>
                  <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 p-2 border-2 focus:border-indigo-500 text-sm font-black text-gray-800" />
                </div>
                <div className="w-36">
                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Tổ chuyên môn</label>
                  <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 p-2 border-2 text-sm font-black" />
                </div>
                <div className="w-48">
                  <label className="block text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Người thực hiện</label>
                  <input type="text" name="giao_vien" value={inputs.giao_vien} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 p-2 border-2 text-sm font-black text-indigo-700" />
                </div>
              </div>
            </div>

            {/* II. CHI TIẾT BÀI DẠY */}
            <div className="bg-white rounded-xl p-5 shadow-md border border-indigo-50">
              <h3 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest mb-3 border-b pb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                II. Chi tiết bài dạy
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-tight">Tên bài dạy dự kiến</label>
                    {autoFilledFields.has('ten_bai_day') && (
                      <span className="text-[7px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase">✨ Dự đoán từ tệp</span>
                    )}
                  </div>
                  <textarea 
                    name="ten_bai_day" 
                    value={inputs.ten_bai_day} 
                    onChange={handleInputChange} 
                    rows={1}
                    className={`w-full rounded-lg p-3 border-2 font-black text-lg text-gray-900 shadow-inner resize-none focus:outline-none transition-all ${getAutoFilledClass('ten_bai_day')}`}
                    placeholder="Tên bài học cụ thể..."
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Môn học</label>
                    <select name="subject" value={inputs.subject} onChange={handleInputChange} className={`w-full rounded-lg p-2 border-2 text-sm font-black appearance-none cursor-pointer ${getAutoFilledClass('subject')}`}>
                      <option value="TOÁN">Toán học</option><option value="KHTN">KHTN</option><option value="NGỮ VĂN">Ngữ văn</option><option value="TIẾNG ANH">Tiếng Anh</option>
                      <option value="LỊCH SỬ - ĐỊA LÍ">Lịch sử - Địa lí</option><option value="GDCD">GDCD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Khối lớp</label>
                    <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className={`w-full rounded-lg p-2 border-2 text-center text-sm font-black ${getAutoFilledClass('lop')}`} />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">Số lượng tiết</label>
                    <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className={`w-full rounded-lg p-2 border-2 text-center text-sm font-black ${getAutoFilledClass('so_tiet')}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* III. NGUỒN HỌC LIỆU AI */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex bg-gray-50/50 border-b">
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, autoComposeMode: 'TEMPLATE' }))} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider ${inputs.autoComposeMode === 'TEMPLATE' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>📂 Soạn từ mẫu giáo án</button>
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, autoComposeMode: 'TEXTBOOK' }))} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider ${inputs.autoComposeMode === 'TEXTBOOK' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>📚 Soạn từ SGK (PDF)</button>
              </div>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                    III. Nguồn học liệu AI
                  </h4>
                  <p className="text-[9px] text-gray-400 italic">Dữ liệu gốc để AI phân tích và xây dựng nội dung bài học.</p>
                </div>
                <div className="relative w-56 h-16 group">
                  {inputs.autoComposeMode === 'TEXTBOOK' ? (
                    fileNames.textbookPdfData ? (
                      <div className="w-full h-full bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col items-center justify-center p-2 shadow-inner">
                        <span className="text-[7px] font-black text-emerald-700 uppercase truncate w-full text-center">{fileNames.textbookPdfData}</span>
                        <button type="button" onClick={() => clearFile('textbookPdfData')} className="text-[7px] font-black text-red-500 uppercase mt-1">Đổi tệp</button>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'textbookPdfData' as any)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full h-full rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Tải PDF SGK</div>
                      </div>
                    )
                  ) : (
                    fileNames.khbg_mau ? (
                      <div className="w-full h-full bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col items-center justify-center p-2 shadow-inner">
                        <span className="text-[7px] font-black text-indigo-700 uppercase truncate w-full text-center">{fileNames.khbg_mau}</span>
                        <button type="button" onClick={() => clearFile('khbg_mau')} className="text-[7px] font-black text-red-500 uppercase mt-1">Đổi tệp</button>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'khbg_mau')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="w-full h-full rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Tải giáo án mẫu</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* IV. HỒ SƠ CHUYÊN MÔN */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest mb-3 border-b pb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                IV. Hồ sơ chuyên môn (Phụ lục)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex flex-col">
                  <span className="text-[8px] font-black text-gray-500 uppercase mb-2">Phụ lục 1: KHGD Tổ</span>
                  {fileNames.phu_luc_1 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-gray-400 truncate max-w-[120px]">{fileNames.phu_luc_1}</span>
                      <button type="button" onClick={() => clearFile('phu_luc_1')} className="text-[8px] font-black text-red-500 uppercase">Xóa</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'phu_luc_1')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="py-1.5 border border-dashed border-gray-300 rounded text-center text-[8px] font-black text-gray-400 uppercase">Chọn tệp (.docx)</div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex flex-col">
                  <span className="text-[8px] font-black text-gray-500 uppercase mb-2">Phụ lục 3: KHGD Cá nhân</span>
                  {fileNames.phu_luc_3 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-gray-400 truncate max-w-[120px]">{fileNames.phu_luc_3}</span>
                      <button type="button" onClick={() => clearFile('phu_luc_3')} className="text-[8px] font-black text-red-500 uppercase">Xóa</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'phu_luc_3')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="py-1.5 border border-dashed border-gray-300 rounded text-center text-[8px] font-black text-gray-400 uppercase">Chọn tệp (.docx)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* V. TIỆN ÍCH TÍCH HỢP */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-[10px] font-black text-indigo-950 uppercase tracking-widest mb-3 border-b pb-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
                V. Tiện ích tích hợp & Năng lực số
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, integrate_ANQP: !prev.integrate_ANQP }))} className={`p-2 rounded-lg border flex items-center justify-center space-x-2 transition-all ${inputs.integrate_ANQP ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-300'}`}>
                  <span className="text-[9px] font-black uppercase">ANQP</span>
                </button>
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, integrate_environment: !prev.integrate_environment }))} className={`p-2 rounded-lg border flex items-center justify-center space-x-2 transition-all ${inputs.integrate_environment ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' : 'bg-white border-gray-100 text-gray-300'}`}>
                  <span className="text-[9px] font-black uppercase">MÔI TRƯỜNG</span>
                </button>
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, ai_competency_assessment: !prev.ai_competency_assessment }))} className={`p-2 rounded-lg border flex items-center justify-center space-x-2 transition-all ${inputs.ai_competency_assessment ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm' : 'bg-white border-gray-100 text-gray-300'}`}>
                  <span className="text-[9px] font-black uppercase">RUBRIC AI</span>
                </button>
                <button type="button" onClick={() => setInputs(prev => ({ ...prev, nang_luc_so: prev.nang_luc_so ? '' : 'ACTIVE' }))} className={`p-2 rounded-lg border flex items-center justify-center space-x-2 transition-all ${inputs.nang_luc_so ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-300'}`}>
                  <span className="text-[9px] font-black uppercase">NLS (CV 3456)</span>
                </button>
              </div>

              {/* Ô TẢI FILE NĂNG LỰC SỐ */}
              {inputs.nang_luc_so && (
                <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border-2 border-dashed border-blue-300 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-blue-700 uppercase flex items-center">
                       <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
                       Tài liệu Khung Năng lực số (Công văn 3456)
                    </span>
                    {fileNames.nang_luc_so && <span className="text-[7px] font-black text-emerald-600">FILE ĐÃ SẴN SÀNG</span>}
                  </div>
                  {fileNames.nang_luc_so ? (
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-200">
                      <span className="text-[8px] font-bold text-blue-600 truncate max-w-[250px]">{fileNames.nang_luc_so}</span>
                      <button type="button" onClick={() => clearFile('nang_luc_so')} className="text-[8px] font-black text-red-500 uppercase hover:underline">Xóa và chọn lại</button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <input type="file" accept=".docx,.txt" onChange={(e) => handleFileUpload(e, 'nang_luc_so')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="py-3 border-2 border-dashed border-blue-200 rounded-lg text-center text-[9px] font-black text-blue-400 uppercase bg-white group-hover:bg-blue-50 transition-colors">
                        Tải tệp Khung năng lực số (.docx)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* KHỞI TẠO */}
            <div className="bg-white rounded-xl shadow-lg p-3">
               <button type="submit" disabled={isLoading || isAnalyzingPdf} className="w-full py-5 bg-[#0f172a] text-white rounded-lg font-black uppercase text-xl tracking-widest shadow-xl hover:bg-black transition-all border-b-4 border-indigo-950 active:border-b-0 active:translate-y-0.5">
                {isLoading ? "ĐANG SOẠN THẢO..." : "KHỞI TẠO KHBG"}
               </button>
            </div>
          </form>
        </div>

        {/* TRẠNG THÁI */}
        {!result && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm animate-in fade-in duration-700">
            <h3 className="text-sm font-black text-indigo-950 uppercase">HỆ THỐNG ĐÃ SẴN SÀNG</h3>
            <p className="text-gray-400 text-[9px] font-bold mt-1 uppercase tracking-wider italic">
              {inputs.ten_bai_day || "Vui lòng hoàn tất thông tin để AI bắt đầu thiết kế"}
            </p>
          </div>
        )}

        {/* KẾT QUẢ */}
        {result && (
          <div ref={resultRef} className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 pb-10 pt-4 border-t-2 border-dashed border-gray-200">
            <div className="flex justify-between items-center no-print px-1">
              <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                KHBG ĐÃ ĐƯỢC THIẾT KẾ XONG
              </h4>
              <div className="flex space-x-2">
                <button onClick={() => window.print()} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider">IN NGAY</button>
                <button onClick={() => exportToWord(result)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg shadow-md font-black text-[9px] uppercase tracking-wider border-b-2 border-indigo-900 active:border-b-0">TẢI DOCX</button>
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
