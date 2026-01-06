
import React from 'react';
import { LessonPlan } from '../types';

interface LessonPlanViewProps {
  plan: LessonPlan;
}

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({ plan }) => {
  const renderList = (items: string[]) => (
    <ul className="list-disc ml-5 space-y-1">
      {items.map((item, idx) => (
        <li key={idx} className="text-gray-700">{item}</li>
      ))}
    </ul>
  );

  return (
    <div className="lesson-plan-container bg-white p-8 sm:p-12 shadow-lg border border-gray-200 max-w-4xl mx-auto text-sm sm:text-base leading-relaxed">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-8 border-b-2 border-gray-100 pb-4">
        <div>
          <p className="font-bold">Trường: <span className="font-normal uppercase">{plan.header.truong}</span></p>
          <p className="font-bold">Tổ: <span className="font-normal uppercase">{plan.header.to}</span></p>
        </div>
        <div className="text-right">
          <p className="font-bold italic">Cộng hòa Xã hội Chủ nghĩa Việt Nam</p>
          <p className="text-xs">Độc lập - Tự do - Hạnh phúc</p>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold uppercase mb-2">KẾ HOẠCH BÀI DẠY</h1>
        <h2 className="text-xl font-bold uppercase mb-4">TÊN BÀI DẠY: {plan.header.ten_bai_day}</h2>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 font-medium text-gray-800">
          <span>Môn: {plan.header.mon}</span>
          <span>Lớp: {plan.header.lop}</span>
          <span>Thời gian: {plan.header.so_tiet} tiết</span>
        </div>
        <p className="mt-2 font-medium">Họ và tên giáo viên: {plan.header.giao_vien}</p>
        {plan.header.ghi_chu && <p className="text-xs text-red-500 mt-1 italic">{plan.header.ghi_chu}</p>}
      </div>

      {/* I. Mục tiêu */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-200 pb-1">I. Mục tiêu</h2>
        
        <div className="mb-4">
          <h3 className="font-bold mb-2">1. Kiến thức:</h3>
          {renderList(plan.muc_tieu.kien_thuc)}
        </div>

        <div className="mb-4">
          <h3 className="font-bold mb-2">2. Năng lực:</h3>
          <div className="ml-4 mb-3">
            <h4 className="font-bold italic text-gray-700">- Năng lực chung:</h4>
            {renderList(plan.muc_tieu.nang_luc.chung)}
          </div>
          <div className="ml-4">
            <h4 className="font-bold italic text-gray-700">- Năng lực đặc thù:</h4>
            {renderList(plan.muc_tieu.nang_luc.dac_thu)}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold mb-2">3. Phẩm chất:</h3>
          {renderList(plan.muc_tieu.pham_chat)}
        </div>
      </section>

      {/* II. Thiết bị dạy học */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-4 uppercase border-b border-gray-200 pb-1">II. Thiết bị dạy học và học liệu</h2>
        {renderList(plan.thiet_bi_hoc_lieu)}
      </section>

      {/* III. Tiến trình dạy học */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-6 uppercase border-b border-gray-200 pb-1">III. Tiến trình dạy học</h2>
        
        {plan.tien_trinh_day_hoc.map((hd, idx) => (
          <div key={idx} className="mb-12">
            <h3 className="text-md font-bold text-indigo-900 mb-4 bg-indigo-50 p-2 rounded">
              Hoạt động {hd.hoat_dong_so}: {hd.ten_hoat_dong}
            </h3>
            
            <div className="space-y-6 ml-2">
              <div>
                <p className="font-bold mb-1">a) Mục tiêu:</p>
                <div className="pl-4 border-l-2 border-gray-100 italic text-gray-600">
                  {hd.muc_tieu.join('; ')}
                </div>
              </div>
              
              <div>
                <p className="font-bold mb-1">b) Nội dung:</p>
                <div className="pl-4 border-l-2 border-gray-100">
                  {renderList(hd.noi_dung)}
                </div>
              </div>
              
              <div>
                <p className="font-bold mb-1">c) Sản phẩm:</p>
                <div className="pl-4 border-l-2 border-gray-100">
                  {renderList(hd.san_pham)}
                </div>
              </div>
              
              <div>
                <p className="font-bold mb-2">d) Tổ chức thực hiện:</p>
                <div className="ml-4 space-y-4">
                  <div>
                    <p className="font-bold text-sm italic text-gray-800 underline decoration-indigo-200 underline-offset-4 mb-1">* Chuyển giao nhiệm vụ:</p>
                    <div className="pl-4 text-gray-700 leading-relaxed">{hd.to_chuc_thuc_hien.chuyen_giao_nhiem_vu.join(' ')}</div>
                  </div>
                  <div>
                    <p className="font-bold text-sm italic text-gray-800 underline decoration-indigo-200 underline-offset-4 mb-1">* Thực hiện nhiệm vụ:</p>
                    <div className="pl-4 text-gray-700 leading-relaxed">{hd.to_chuc_thuc_hien.thuc_hien_nhiem_vu.join(' ')}</div>
                  </div>
                  <div>
                    <p className="font-bold text-sm italic text-gray-800 underline decoration-indigo-200 underline-offset-4 mb-1">* Báo cáo, thảo luận:</p>
                    <div className="pl-4 text-gray-700 leading-relaxed">{hd.to_chuc_thuc_hien.bao_cao_thao_luan.join(' ')}</div>
                  </div>
                  <div>
                    <p className="font-bold text-sm italic text-gray-800 underline decoration-indigo-200 underline-offset-4 mb-1">* Kết luận, nhận định:</p>
                    <div className="pl-4 text-gray-700 leading-relaxed font-medium bg-gray-50 p-2 rounded border border-gray-100">{hd.to_chuc_thuc_hien.ket_luan_nhan_dinh.join(' ')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* AI Assessment Section */}
      {plan.ai_assessment.enabled && (
        <section className="mb-10 p-6 bg-blue-50/50 rounded-xl border-2 border-blue-100 no-print-background">
          <h2 className="text-lg font-bold mb-4 text-blue-900 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
            Phụ lục: Đánh giá năng lực tích hợp AI
          </h2>
          <div className="overflow-hidden rounded-lg border border-blue-200 shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="border border-blue-200 p-3 text-left font-bold text-blue-900">Tiêu chí</th>
                  <th className="border border-blue-200 p-3 text-left font-bold text-blue-900">Mức đạt</th>
                  <th className="border border-blue-200 p-3 text-left font-bold text-blue-900">Minh chứng</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {plan.ai_assessment.rubric.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-blue-200 p-3 font-medium">{item.tieu_chi}</td>
                    <td className="border border-blue-200 p-3">{item.muc_dat}</td>
                    <td className="border border-blue-200 p-3 text-gray-600">{item.minh_chung}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Gợi ý hướng dẫn HS sử dụng AI:</strong> {plan.ai_assessment.huong_dan_dao_duc_ai.join('. ')}
          </div>
        </section>
      )}

      {/* Tích hợp section */}
      {(plan.tich_hop.ATGT.enabled || plan.tich_hop.ANQP.enabled || plan.tich_hop.BAO_VE_MT.enabled) && (
        <section className="mb-10 p-6 bg-green-50/50 rounded-xl border-2 border-green-100">
          <h2 className="text-lg font-bold mb-4 text-green-900 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
            Nội dung tích hợp giáo dục
          </h2>
          <div className="space-y-3">
            {plan.tich_hop.ATGT.enabled && (
              <div className="flex items-start">
                <span className="font-bold text-green-800 min-w-[120px]">Giao thông:</span>
                <span className="text-gray-700">{plan.tich_hop.ATGT.the_hien_o.join('; ')}</span>
              </div>
            )}
            {plan.tich_hop.ANQP.enabled && (
              <div className="flex items-start">
                <span className="font-bold text-green-800 min-w-[120px]">Quốc phòng:</span>
                <span className="text-gray-700">{plan.tich_hop.ANQP.the_hien_o.join('; ')}</span>
              </div>
            )}
            {plan.tich_hop.BAO_VE_MT.enabled && (
              <div className="flex items-start">
                <span className="font-bold text-green-800 min-w-[120px]">Môi trường:</span>
                <span className="text-gray-700">{plan.tich_hop.BAO_VE_MT.the_hien_o.join('; ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer Info */}
      <div className="mt-16 pt-8 border-t-2 border-gray-100 grid grid-cols-2 text-center italic">
        <div className="p-4">
          <p className="font-bold mb-20 uppercase tracking-widest text-sm">Tổ trưởng chuyên môn</p>
          <div className="h-px w-2/3 bg-gray-300 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="p-4">
          <p className="font-bold mb-20 uppercase tracking-widest text-sm text-indigo-900">Giáo viên soạn</p>
          <p className="font-bold not-italic text-lg text-indigo-900">{plan.header.giao_vien}</p>
          <p className="text-xs text-gray-500">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
};
