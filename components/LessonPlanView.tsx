
import React from 'react';
import { LessonPlan } from '../types';

interface LessonPlanViewProps {
  plan: LessonPlan;
}

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({ plan }) => {
  const renderList = (items: string[] | undefined) => (
    <ul className="list-disc ml-8 space-y-2">
      {items && items.length > 0 ? (
        items.map((item, idx) => (
          <li key={idx} className="text-justify text-black">{item}</li>
        ))
      ) : (
        <li className="text-gray-400 italic">Chưa có nội dung chi tiết</li>
      )}
    </ul>
  );

  if (!plan || !plan.header) return <div className="p-8 text-center text-red-500 font-bold">Lỗi dữ liệu.</div>;

  return (
    <div className="lesson-plan-container bg-white p-12 sm:p-20 shadow-xl border border-gray-200 max-w-5xl mx-auto text-[14pt] leading-[1.6] text-black">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 mb-12 border-b border-gray-300 pb-4">
        <div className="text-center">
          <p className="font-bold uppercase text-[12pt]">{plan.header.truong}</p>
          <p className="font-bold uppercase text-[12pt]">TỔ: {plan.header.to}</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-[12pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="font-bold text-[12pt]">Độc lập - Tự do - Hạnh phúc</p>
        </div>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-[18pt] font-bold uppercase">KẾ HOẠCH BÀI DẠY</h1>
        <h2 className="text-[16pt] font-bold uppercase mt-2">BÀI: {plan.header.ten_bai_day}</h2>
        <div className="mt-4 flex justify-center space-x-8 font-medium italic text-[12pt]">
          <span>Môn: {plan.header.mon}</span>
          <span>Lớp: {plan.header.lop}</span>
          <span>Thời lượng: {plan.header.so_tiet} tiết</span>
        </div>
      </div>

      {/* I. MỤC TIÊU */}
      <section className="mb-10">
        <h2 className="font-bold uppercase border-b-2 border-black mb-4">I. MỤC TIÊU</h2>
        <div className="ml-4 space-y-4">
          <div><p className="font-bold">1. Kiến thức:</p>{renderList(plan.muc_tieu.kien_thuc)}</div>
          <div>
            <p className="font-bold">2. Năng lực:</p>
            <div className="ml-4">
              <p className="italic font-bold">a) Năng lực chung:</p>
              {renderList(plan.muc_tieu.nang_luc.chung)}
              <p className="italic font-bold mt-2">b) Năng lực đặc thù (môn học):</p>
              {renderList(plan.muc_tieu.nang_luc.dac_thu)}
              {(plan.muc_tieu.nang_luc as any).so && (plan.muc_tieu.nang_luc as any).so.length > 0 && (
                <>
                  <p className="italic font-bold mt-2 text-blue-800">c) Năng lực số (CV 3456):</p>
                  {renderList((plan.muc_tieu.nang_luc as any).so)}
                </>
              )}
            </div>
          </div>
          <div><p className="font-bold">3. Phẩm chất:</p>{renderList(plan.muc_tieu.pham_chat)}</div>
        </div>
      </section>

      {/* II. THIẾT BỊ DẠY HỌC */}
      <section className="mb-10">
        <h2 className="font-bold uppercase border-b-2 border-black mb-4">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
        {renderList(plan.thiet_bi_hoc_lieu)}
      </section>

      {/* III. TIẾN TRÌNH DẠY HỌC */}
      <section className="mb-10">
        <h2 className="font-bold uppercase border-b-2 border-black mb-4">III. TIẾN TRÌNH DẠY HỌC</h2>
        {plan.tien_trinh_day_hoc.map((hd, i) => (
          <div key={i} className="mb-10">
            <p className="font-bold mb-3 uppercase">Hoạt động {hd.hoat_dong_so}: {hd.ten_hoat_dong}</p>
            {(hd as any).ky_thuat_day_hoc && (
              <p className="mb-2 text-indigo-700 font-bold italic underline">Kĩ thuật sử dụng: {(hd as any).ky_thuat_day_hoc}</p>
            )}
            <div className="ml-4 space-y-3">
              <p><strong>a) Mục tiêu:</strong> {hd.muc_tieu.join(' ')}</p>
              <p><strong>b) Nội dung:</strong> {hd.noi_dung.join(' ')}</p>
              <p><strong>c) Sản phẩm:</strong> {hd.san_pham.join(' ')}</p>
              <div className="mt-4">
                <p><strong>d) Tổ chức thực hiện:</strong></p>
                <div className="ml-6 mt-2 space-y-3">
                  <p><strong>- Bước 1: Chuyển giao nhiệm vụ:</strong> {hd.to_chuc_thuc_hien.chuyen_giao_nhiem_vu.join(' ')}</p>
                  <p><strong>- Bước 2: Thực hiện nhiệm vụ:</strong> {hd.to_chuc_thuc_hien.thuc_hien_nhiem_vu.join(' ')}</p>
                  <p><strong>- Bước 3: Báo cáo, thảo luận:</strong> {hd.to_chuc_thuc_hien.bao_cao_thao_luan.join(' ')}</p>
                  <p><strong>- Bước 4: Kết luận, nhận định:</strong> {hd.to_chuc_thuc_hien.ket_luan_nhan_dinh.join(' ')}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* AI ASSESSMENT / RUBRIC */}
      {plan.ai_assessment.enabled && (
        <section className="mb-10">
          <h2 className="font-bold uppercase border-b-2 border-black mb-4">IV. ĐÁNH GIÁ KẾT QUẢ (RUBRIC)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[12pt]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2">Tiêu chí</th>
                  <th className="border border-black p-2">Mức độ đạt</th>
                  <th className="border border-black p-2">Minh chứng</th>
                </tr>
              </thead>
              <tbody>
                {plan.ai_assessment.rubric.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-2">{r.tieu_chi}</td>
                    <td className="border border-black p-2">{r.muc_dat}</td>
                    <td className="border border-black p-2">{r.minh_chung}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PHỤ LỤC */}
      {(plan.phu_luc?.phu_luc_1 || plan.phu_luc?.phu_luc_3) && (
        <section className="mt-16 pt-10 border-t-4 border-double border-gray-400 no-print">
          <h2 className="text-[16pt] font-black uppercase text-center mb-10">PHẦN PHỤ LỤC THAM CHIẾU</h2>
          <div className="grid grid-cols-1 gap-6">
            {plan.phu_luc.phu_luc_1 && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="font-black text-indigo-700 uppercase mb-2">Từ KHGD Tổ chuyên môn:</p>
                <p className="italic">{plan.phu_luc.phu_luc_1}</p>
              </div>
            )}
            {plan.phu_luc.phu_luc_3 && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="font-black text-amber-700 uppercase mb-2">Từ KHGD Cá nhân:</p>
                <p className="italic">{plan.phu_luc.phu_luc_3}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="mt-20 grid grid-cols-2 text-center">
        <div><p className="font-bold uppercase">Tổ trưởng chuyên môn</p><p className="mt-24 italic">(Ký và ghi rõ họ tên)</p></div>
        <div><p className="font-bold uppercase">Giáo viên soạn</p><p className="mt-24 font-bold uppercase">{plan.header.giao_vien}</p></div>
      </div>
    </div>
  );
};
