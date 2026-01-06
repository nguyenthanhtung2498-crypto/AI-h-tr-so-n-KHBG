
import React from 'react';
import { LessonPlan } from '../types';

interface LessonPlanViewProps {
  plan: LessonPlan;
}

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({ plan }) => {
  const renderList = (items: string[] | undefined) => (
    <ul className="list-disc ml-8 space-y-1">
      {items && items.length > 0 ? (
        items.map((item, idx) => (
          <li key={idx} className="text-justify text-black">{item}</li>
        ))
      ) : (
        <li className="text-gray-400 italic">Chưa có nội dung chi tiết</li>
      )}
    </ul>
  );

  if (!plan || !plan.header) return <div className="p-8 text-center text-red-500 font-bold">Dữ liệu không hợp lệ. Vui lòng tạo lại.</div>;

  return (
    <div className="lesson-plan-container bg-white p-12 sm:p-16 shadow-xl border border-gray-100 max-w-4xl mx-auto text-[14pt] leading-[1.3] text-black">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-10 pb-4 border-b border-gray-200">
        <div className="text-center">
          <p className="font-bold uppercase text-[12pt]">{plan.header.truong}</p>
          <p className="font-bold uppercase text-[12pt]">TỔ: {plan.header.to}</p>
          <div className="h-0.5 w-24 bg-black mx-auto mt-1"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-[12pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="font-bold text-[12pt]">Độc lập - Tự do - Hạnh phúc</p>
          <div className="h-0.5 w-32 bg-black mx-auto mt-1"></div>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-[16pt] font-bold uppercase mb-2">KẾ HOẠCH BÀI DẠY</h1>
        <h2 className="text-[14pt] font-bold uppercase mb-6">TÊN BÀI DẠY: {plan.header.ten_bai_day}</h2>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 font-medium text-[12pt] uppercase tracking-tight">
          <span>Môn: {plan.header.mon}</span>
          <span>Lớp: {plan.header.lop}</span>
          <span>Số tiết: {plan.header.so_tiet} tiết</span>
        </div>
        <p className="mt-4 font-bold text-[12pt]">Họ và tên giáo viên: {plan.header.giao_vien}</p>
        {plan.header.ghi_chu && <p className="text-[11pt] text-red-600 mt-2 italic">Ghi chú: {plan.header.ghi_chu}</p>}
      </div>

      {/* I. Mục tiêu */}
      <section className="mb-10">
        <h2 className="text-[14pt] font-bold mb-4 uppercase">I. MỤC TIÊU</h2>
        
        <div className="mb-6">
          <h3 className="font-bold mb-2">1. Kiến thức:</h3>
          {renderList(plan.muc_tieu?.kien_thuc)}
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">2. Năng lực:</h3>
          <div className="ml-4 mb-4">
            <h4 className="font-bold italic">- Năng lực chung:</h4>
            {renderList(plan.muc_tieu?.nang_luc?.chung)}
          </div>
          <div className="ml-4">
            <h4 className="font-bold italic">- Năng lực đặc thù:</h4>
            {renderList(plan.muc_tieu?.nang_luc?.dac_thu)}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2">3. Phẩm chất:</h3>
          {renderList(plan.muc_tieu?.pham_chat)}
        </div>
      </section>

      {/* II. Thiết bị dạy học */}
      <section className="mb-10">
        <h2 className="text-[14pt] font-bold mb-4 uppercase">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
        {renderList(plan.thiet_bi_hoc_lieu)}
      </section>

      {/* III. Tiến trình dạy học */}
      <section className="mb-12">
        <h2 className="text-[14pt] font-bold mb-6 uppercase">III. TIẾN TRÌNH DẠY HỌC</h2>
        
        {plan.tien_trinh_day_hoc?.map((hd, idx) => (
          <div key={idx} className="mb-10">
            <h3 className="text-[13pt] font-bold mb-4 p-2 bg-gray-50 border-l-4 border-black">
              Hoạt động {hd.hoat_dong_so}: {hd.ten_hoat_dong}
            </h3>
            
            <div className="space-y-6 ml-4">
              <div>
                <p className="font-bold mb-1">a) Mục tiêu:</p>
                <p className="text-justify italic text-gray-700 ml-4 leading-relaxed">{hd.muc_tieu?.join('; ')}</p>
              </div>
              
              <div>
                <p className="font-bold mb-1">b) Nội dung:</p>
                <div className="ml-4">{renderList(hd.noi_dung)}</div>
              </div>
              
              <div>
                <p className="font-bold mb-1">c) Sản phẩm:</p>
                <div className="ml-4">{renderList(hd.san_pham)}</div>
              </div>
              
              <div>
                <p className="font-bold mb-3">d) Tổ chức thực hiện:</p>
                <div className="ml-4 space-y-4">
                  <div className="border-l-2 border-gray-300 pl-4 py-1">
                    <p className="font-bold italic text-[12pt] mb-1">* Chuyển giao nhiệm vụ:</p>
                    <div className="text-justify text-black text-[12pt]">{hd.to_chuc_thuc_hien?.chuyen_giao_nhiem_vu?.join(' ')}</div>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4 py-1">
                    <p className="font-bold italic text-[12pt] mb-1">* Thực hiện nhiệm vụ:</p>
                    <div className="text-justify text-black text-[12pt]">{hd.to_chuc_thuc_hien?.thuc_hien_nhiem_vu?.join(' ')}</div>
                  </div>
                  <div className="border-l-2 border-gray-300 pl-4 py-1">
                    <p className="font-bold italic text-[12pt] mb-1">* Báo cáo, thảo luận:</p>
                    <div className="text-justify text-black text-[12pt]">{hd.to_chuc_thuc_hien?.bao_cao_thao_luan?.join(' ')}</div>
                  </div>
                  <div className="border-l-2 border-black pl-4 py-1">
                    <p className="font-bold italic text-[12pt] mb-1">* Kết luận, nhận định:</p>
                    <div className="text-justify font-bold text-black text-[12pt]">{hd.to_chuc_thuc_hien?.ket_luan_nhan_dinh?.join(' ')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* IV. Phụ lục */}
      {(plan.ai_assessment?.enabled || plan.tich_hop?.ATGT?.enabled || plan.tich_hop?.ANQP?.enabled || plan.tich_hop?.BAO_VE_MT?.enabled) && (
        <section className="mb-10 pt-6 border-t-2 border-black">
          <h2 className="text-[14pt] font-bold mb-4 uppercase">IV. PHỤ LỤC VÀ TÍCH HỢP</h2>
          
          {plan.ai_assessment?.enabled && (
            <div className="mb-8">
              <h3 className="font-bold mb-4 italic">1. Đánh giá năng lực sử dụng AI trong bài dạy:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-black text-[12pt]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-3 text-left font-bold uppercase">Tiêu chí</th>
                      <th className="border border-black p-3 text-left font-bold uppercase">Mức đạt</th>
                      <th className="border border-black p-3 text-left font-bold uppercase">Minh chứng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.ai_assessment.rubric?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-black p-3 font-bold">{item.tieu_chi}</td>
                        <td className="border border-black p-3">{item.muc_dat}</td>
                        <td className="border border-black p-3 italic">{item.minh_chung}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {plan.tich_hop?.ATGT?.enabled && (
              <div className="flex items-start">
                <span className="font-bold min-w-[200px] italic">- Tích hợp ATGT:</span>
                <span className="text-justify">{plan.tich_hop.ATGT.the_hien_o?.join('; ')}</span>
              </div>
            )}
            {plan.tich_hop?.ANQP?.enabled && (
              <div className="flex items-start">
                <span className="font-bold min-w-[200px] italic">- Tích hợp ANQP:</span>
                <span className="text-justify">{plan.tich_hop.ANQP.the_hien_o?.join('; ')}</span>
              </div>
            )}
            {plan.tich_hop?.BAO_VE_MT?.enabled && (
              <div className="flex items-start">
                <span className="font-bold min-w-[200px] italic">- Bảo vệ môi trường:</span>
                <span className="text-justify">{plan.tich_hop.BAO_VE_MT.the_hien_o?.join('; ')}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-gray-100 grid grid-cols-2 text-center">
        <div>
          <p className="font-bold mb-24 uppercase text-[12pt]">Tổ trưởng chuyên môn</p>
          <div className="h-[1px] w-2/3 bg-gray-200 mx-auto mb-2"></div>
          <p className="text-gray-400 italic text-[10pt]">(Ký và ghi rõ họ tên)</p>
        </div>
        <div>
          <p className="font-bold mb-24 uppercase text-[12pt]">Giáo viên soạn</p>
          <p className="font-bold text-[13pt] uppercase">{plan.header.giao_vien}</p>
          <div className="h-[1px] w-2/3 bg-gray-200 mx-auto mb-2"></div>
          <p className="text-gray-400 italic text-[10pt]">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
};
