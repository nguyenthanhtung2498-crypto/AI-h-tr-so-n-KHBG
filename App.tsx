
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FormSection } from './components/FormSection';
import { LessonPlanView } from './components/LessonPlanView';
import { LoginPage } from './components/LoginPage';
import { FormInputs, LessonPlan } from './types';
import { generateLessonPlan, extractLessonTitle } from './geminiService';
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

  const [isExtractingTitle, setIsExtractingTitle] = useState(false);
  const [tichHopNLS, setTichHopNLS] = useState(false);

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
    autoCompose: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (userData: UserSession) => {
    try {
      localStorage.setItem('lesson_plan_session', JSON.stringify(userData));
    } catch (e) {
      console.warn("LocalStorage is not available");
    }
    setSession(userData);
    setInputs(prev => ({ ...prev, giao_vien: userData.username }));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('lesson_plan_session');
    } catch (e) {}
    setSession(null);
    setResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputs(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormInputs) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validTypes = ['.txt', '.docx'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(extension)) {
      setError(`Định dạng tệp "${extension}" không được hỗ trợ. Vui lòng tải lên tệp .docx hoặc .txt.`);
      e.target.value = '';
      return;
    }

    try {
      let text = "";
      if (extension === '.docx') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const res = await mammoth.extractRawText({ arrayBuffer });
          text = res.value;
          if (!text.trim()) throw new Error("Tệp Word rỗng.");
        } catch (mErr: any) {
          throw new Error(`Lỗi đọc tệp Word: ${mErr.message}`);
        }
      } else if (extension === '.txt') {
        text = await file.text();
        if (!text.trim()) throw new Error("Tệp văn bản rỗng.");
      }

      setInputs(prev => ({ ...prev, [fieldName]: text }));

      if (fieldName === 'khbg_mau' && text) {
        setIsExtractingTitle(true);
        try {
          const extractedTitle = await extractLessonTitle(text);
          if (extractedTitle) setInputs(prev => ({ ...prev, ten_bai_day: extractedTitle }));
        } catch (err) {
          console.warn("Lỗi trích xuất tiêu đề:", err);
        } finally {
          setIsExtractingTitle(false);
        }
      }
    } catch (err: any) {
      setError(`Lỗi: ${err.message}`);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const plan = await generateLessonPlan(inputs);
      setResult(plan);
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Lỗi xác thực API Key. Vui lòng quay lại đăng nhập và chọn lại API Key.");
      } else {
        setError(err.message || "Đã xảy ra lỗi khi tạo giáo án.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderUploadItem = (title: string, field: keyof FormInputs, isHighlight = false) => (
    <div className={`flex flex-col p-4 rounded-xl border transition-all ${isHighlight ? 'bg-indigo-600/5 border-indigo-600/30 shadow-md' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-[10px] font-black uppercase tracking-widest ${isHighlight ? 'text-indigo-700' : 'text-gray-500'}`}>{title}</label>
        {inputs[field] && (
          <span className="text-[10px] text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Sẵn sàng
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          {!inputs[field] && field === 'khbg_mau' && (
            <label className="flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                name="autoCompose"
                checked={inputs.autoCompose} 
                onChange={handleInputChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-[10px] font-black text-indigo-600 uppercase tracking-wider group-hover:text-indigo-800">Soạn KHBG tự động</span>
            </label>
          )}
          {inputs[field] && <span className="text-[9px] text-gray-500 font-medium truncate max-w-[150px] inline-block">Dữ liệu tệp đã nạp</span>}
          {!inputs[field] && field !== 'khbg_mau' && <span className="text-[9px] text-gray-400 italic">Vui lòng tải .docx hoặc .txt</span>}
        </div>
        
        <div className="relative ml-4">
          <input 
            type="file" 
            accept=".txt,.docx" 
            onChange={(e) => handleFileUpload(e, field)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <button type="button" className={`text-[10px] px-5 py-2.5 rounded-lg font-black uppercase tracking-widest transition-all ${inputs[field] ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm'}`}>
            {inputs[field] ? 'Thay đổi' : 'Tải file'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout user={session.username} isAdmin={session.isAdmin} onLogout={handleLogout}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 no-print">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Thông tin cơ bản" icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Trường học</label>
                  <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border focus:ring-2 focus:ring-indigo-500/20 shadow-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tổ chuyên môn</label>
                    <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border focus:ring-2" placeholder="VD: KHTN" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Giáo viên soạn</label>
                    <input type="text" name="giao_vien" value={inputs.giao_vien} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border focus:ring-2 shadow-sm" required />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Thông tin bài dạy" icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tên bài dạy</label>
                  <input 
                    type="text" 
                    name="ten_bai_day" 
                    value={inputs.ten_bai_day} 
                    onChange={handleInputChange} 
                    className={`w-full rounded-xl border-gray-200 text-sm p-4 border focus:ring-2 focus:ring-indigo-500/20 font-bold text-gray-800 shadow-sm transition-colors ${isExtractingTitle ? 'bg-indigo-50 animate-pulse' : ''}`} 
                    placeholder={isExtractingTitle ? "Đang trích xuất tự động..." : "Nhập tên bài dạy..."} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tên môn học</label>
                    <select name="subject" value={inputs.subject} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border bg-white focus:ring-2 shadow-sm font-bold uppercase tracking-tight">
                      <option value="TOÁN">Toán</option>
                      <option value="KHTN">KHTN</option>
                      <option value="NGỮ VĂN">Ngữ văn</option>
                      <option value="TIẾNG ANH">Tiếng Anh</option>
                      <option value="LỊCH SỬ - ĐỊA LÍ">LS - Địa lí</option>
                      <option value="GDCD">GDCD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Lớp</label>
                    <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border text-center shadow-sm font-bold" placeholder="Lớp" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Số tiết</label>
                    <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className="w-full rounded-xl border-gray-200 text-sm p-3 border text-center shadow-sm font-bold" placeholder="Tiết" />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Tích hợp giáo dục" icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl transition-all">
                  <label className="flex items-center cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={tichHopNLS} 
                      onChange={(e) => setTichHopNLS(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 shadow-sm"
                    />
                    <span className="ml-3 text-[11px] font-black text-indigo-900 uppercase tracking-widest">Tích hợp NLS theo CV 3456</span>
                  </label>
                  {tichHopNLS && renderUploadItem("Nạp tệp Khung Năng lực số (CV 3456)", "nang_luc_so", true)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                    <input type="checkbox" name="integrate_ANQP" checked={inputs.integrate_ANQP} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded shadow-sm" />
                    <span className="ml-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Tích hợp ANQP</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                    <input type="checkbox" name="integrate_environment" checked={inputs.integrate_environment} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded shadow-sm" />
                    <span className="ml-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Tích bảo vệ MT</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                    <input type="checkbox" name="ai_competency_assessment" checked={inputs.ai_competency_assessment} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded shadow-sm" />
                    <span className="ml-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Đánh giá Năng lực AI</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                    <input type="checkbox" name="integrate_ATGT" checked={inputs.integrate_ATGT} onChange={handleInputChange} className="w-4 h-4 text-indigo-600 rounded shadow-sm" />
                    <span className="ml-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Tích hợp ATGT</span>
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection title="Tài liệu tham chiếu (Phụ lục)" icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
              <div className="space-y-4">
                {renderUploadItem("KHBG Mẫu (AI sẽ căn cứ để soạn)", "khbg_mau", true)}
                <div className="grid grid-cols-2 gap-3">
                  {renderUploadItem("Phụ lục 1 (KHGD Tổ)", "phu_luc_1")}
                  {renderUploadItem("Phụ lục 3 (KHGD GV)", "phu_luc_3")}
                </div>
              </div>
            </FormSection>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 shadow-sm">
                <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                <p className="text-red-700 text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 px-6 rounded-[2rem] text-white font-black text-sm shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-3 uppercase tracking-[0.15em] ${isLoading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Đang xử lý giáo án...</span>
                </>
              ) : (
                <span>Bắt đầu thiết kế giáo án AI</span>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7" id="result-section">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-end space-x-3 no-print">
                <button onClick={() => window.print()} className="bg-white border px-6 py-3 rounded-2xl hover:bg-gray-50 flex items-center shadow-sm font-black text-[10px] uppercase tracking-widest transition-all">
                  Xuất PDF / In
                </button>
                <button onClick={() => exportToWord(result)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 shadow-xl font-black text-[10px] uppercase tracking-widest transition-all">
                   Lưu file Word
                </button>
              </div>
              <LessonPlanView plan={result} />
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white/50 backdrop-blur-md border-2 border-dashed border-indigo-200 rounded-[3rem] p-12 text-center no-print shadow-inner">
              <div className="bg-indigo-50 p-10 rounded-full mb-8 shadow-inner border border-indigo-100">
                <svg className="w-20 h-20 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-2xl font-black text-indigo-900 uppercase tracking-tight mb-4">Sẵn sàng phục vụ bạn</h3>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed font-medium">Cung cấp thông tin và tài liệu căn cứ để AI giúp bạn thiết kế Kế hoạch bài dạy chuẩn 5512 với đầy đủ các nội dung tích hợp hiện đại.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
