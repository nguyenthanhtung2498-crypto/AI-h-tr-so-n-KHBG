
import React, { useState } from 'react';
import { Layout } from './components/Layout.tsx';
import { FormSection } from './components/FormSection.tsx';
import { LessonPlanView } from './components/LessonPlanView.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { FormInputs, LessonPlan } from './types.ts';
import { generateLessonPlan } from './geminiService.ts';
import { exportToWord } from './exportService.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(localStorage.getItem('lesson_plan_user'));
  const [inputs, setInputs] = useState<FormInputs>({
    truong: 'Trường THCS Huỳnh Thúc Kháng',
    to: '',
    giao_vien: '',
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
    nang_luc_so: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    localStorage.setItem('lesson_plan_user', username);
    setUser(username);
    setInputs(prev => ({ ...prev, giao_vien: username }));
  };

  const handleLogout = () => {
    localStorage.removeItem('lesson_plan_user');
    setUser(null);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormInputs) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setInputs(prev => ({ ...prev, [fieldName]: text }));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const plan = await generateLessonPlan(inputs);
      setResult(plan);
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 no-print">
          <form onSubmit={handleSubmit}>
            <FormSection 
              title="Thông tin cơ bản" 
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trường</label>
                  <input type="text" name="truong" value={inputs.truong} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="VD: THCS Nguyễn Du" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tổ chuyên môn</label>
                    <input type="text" name="to" value={inputs.to} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="VD: Tự nhiên" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên GV</label>
                    <input type="text" name="giao_vien" value={inputs.giao_vien} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="VD: Nguyễn Văn A" required />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection 
              title="Chi tiết bài dạy" 
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên bài dạy</label>
                  <input type="text" name="ten_bai_day" value={inputs.ten_bai_day} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="VD: Nguyên tử - Phân tử" required />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
                    <select name="subject" value={inputs.subject} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                      <option value="TOÁN">Toán</option>
                      <option value="KHTN">KHTN</option>
                      <option value="NGỮ VĂN">Ngữ văn</option>
                      <option value="TIẾNG ANH">Tiếng Anh</option>
                      <option value="LỊCH SỬ - ĐỊA LÍ">LS - Địa lí</option>
                      <option value="GDCD">GDCD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                    <input type="text" name="lop" value={inputs.lop} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="6" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiết</label>
                    <input type="text" name="so_tiet" value={inputs.so_tiet} onChange={handleInputChange} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="1" />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection 
              title="Tùy chọn tích hợp" 
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            >
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="ai_competency_assessment" checked={inputs.ai_competency_assessment} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Đánh giá năng lực có hỗ trợ AI</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="integrate_ATGT" checked={inputs.integrate_ATGT} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Tích hợp An toàn giao thông</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="integrate_ANQP" checked={inputs.integrate_ANQP} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Tích hợp An ninh quốc phòng</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="integrate_environment" checked={inputs.integrate_environment} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700">Tích hợp Bảo vệ môi trường</span>
                </label>
              </div>
            </FormSection>

            <FormSection 
              title="Tài liệu tham khảo (Chuẩn 5512)" 
              icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Phụ lục 1 (Khung KH dạy học môn học)</label>
                    <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, 'phu_luc_1')} className="hidden" id="upload-p1" />
                    <label htmlFor="upload-p1" className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 font-bold transition-colors">Tải file P1</label>
                  </div>
                  <textarea name="phu_luc_1" value={inputs.phu_luc_1} onChange={handleInputChange} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border" placeholder="Dán nội dung Phụ lục 1..."></textarea>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Phụ lục 3 (KH giáo dục của GV)</label>
                    <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, 'phu_luc_3')} className="hidden" id="upload-p3" />
                    <label htmlFor="upload-p3" className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 font-bold transition-colors">Tải file P3</label>
                  </div>
                  <textarea name="phu_luc_3" value={inputs.phu_luc_3} onChange={handleInputChange} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border" placeholder="Dán nội dung Phụ lục 3..."></textarea>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">KHBG Mẫu (Nếu có)</label>
                    <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, 'khbg_mau')} className="hidden" id="upload-mau" />
                    <label htmlFor="upload-mau" className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 font-bold transition-colors">Tải file mẫu</label>
                  </div>
                  <textarea name="khbg_mau" value={inputs.khbg_mau} onChange={handleInputChange} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border" placeholder="Dán mẫu giáo án bạn muốn AI học tập..."></textarea>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Phụ lục năng lực số</label>
                    <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, 'nang_luc_so')} className="hidden" id="upload-so" />
                    <label htmlFor="upload-so" className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded cursor-pointer hover:bg-indigo-100 font-bold transition-colors">Tải file NL số</label>
                  </div>
                  <textarea name="nang_luc_so" value={inputs.nang_luc_so} onChange={handleInputChange} rows={3} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs p-2 border" placeholder="Các yêu cầu về năng lực số tích hợp..."></textarea>
                </div>
              </div>
            </FormSection>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang thiết kế KHBG...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>TẠO KẾ HOẠCH BÀI DẠY</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-7" id="result-section">
          {result ? (
            <div className="space-y-4">
              <div className="flex justify-end space-x-3 no-print mb-4">
                <button 
                  onClick={() => window.print()}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center space-x-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>In / Lưu PDF</span>
                </button>
                <button 
                  onClick={() => exportToWord(result)}
                  className="bg-blue-600 text-white border border-blue-700 px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 shadow-sm font-bold"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM6 20V4h6v6h6v10H6zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>
                  <span>Xuất file Word (.docx)</span>
                </button>
              </div>
              <LessonPlanView plan={result} />
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center no-print">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Xem trước Kế hoạch bài dạy</h3>
              <p className="text-gray-500 max-w-md">Nhập thông tin bên trái và cung cấp tài liệu tham khảo (Phụ lục 1, 3, Mẫu...) để AI thiết kế giáo án chuẩn 5512.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
