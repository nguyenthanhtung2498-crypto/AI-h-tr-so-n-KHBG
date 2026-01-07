
import React, { useEffect, useRef } from 'react';
import { LessonPlan } from '../types';

interface LessonPlanViewProps {
  plan: LessonPlan;
}

const MathSpan: React.FC<{ text: string }> = ({ text }) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current && (window as any).katex) {
      const parts = text.split(/(\$.*?\$)/g);
      spanRef.current.innerHTML = '';
      
      parts.forEach(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1);
          const mathEl = document.createElement('span');
          try {
            (window as any).katex.render(formula, mathEl, { throwOnError: false, displayMode: false });
            spanRef.current?.appendChild(mathEl);
          } catch (e) {
            spanRef.current?.appendChild(document.createTextNode(part));
          }
        } else {
          spanRef.current?.appendChild(document.createTextNode(part));
        }
      });
    }
  }, [text]);

  return <span ref={spanRef} className="math-container">{text}</span>;
};

export const LessonPlanView: React.FC<LessonPlanViewProps> = ({ plan }) => {
  const renderList = (items: string[] | undefined) => (
    <ul className="list-disc ml-8 space-y-1">
      {items && Array.isArray(items) && items.length > 0 ? (
        items.map((item, idx) => (
          <li key={idx} className="text-justify text-black"><MathSpan text={item} /></li>
        ))
      ) : (
        <li className="text-gray-400 italic">Nội dung đang được cập nhật...</li>
      )}
    </ul>
  );

  if (!plan || !plan.header) return null;

  return (
    <div className="lesson-plan-container bg-white p-12 sm:p-16 shadow-2xl border border-gray-100 max-w-5xl mx-auto text-[13pt] leading-[1.5] text-black">
      {/* Header Hành chính chuẩn 5512 */}
      <div className="flex justify-between items-start mb-10">
        <div className="text-center w-[45%]">
          <p className="font-bold uppercase text-[11pt] leading-tight mb-1">{plan.header.truong || "Tên Trường"}</p>
          <p className="font-bold uppercase text-[11pt] leading-tight">TỔ: {plan.header.to || "Chuyên môn"}</p>
          <div className="w-24 h-[1px] bg-black mx-auto mt-2"></div>
        </div>
        <div className="text-center w-[50%]">
          <p className="font-bold text-[11pt] leading-tight uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="font-bold text-[12pt] leading-tight">Độc lập - Tự do - Hạnh phúc</p>
          <div className="w-32 h-[1px] bg-black mx-auto mt-2"></div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[16pt] font-bold uppercase mb-2">KẾ HOẠCH BÀI DẠY</h1>
        <h2 className="text-[14pt] font-bold uppercase mb-3 italic">BÀI: {plan.header.ten_bai_day}</h2>
        <div className="flex justify-center space-x-8 font-bold text-[11pt]">
          <span>Môn học: {plan.header.mon}</span>
          <span>Lớp: {plan.header.lop}</span>
          <span>Số tiết: {plan.header.so_tiet}</span>
        </div>
      </div>

      {/* I. MỤC TIÊU */}
      <section className="mb-8">
        <h2 className="font-bold uppercase text-[13pt] mb-3">I. MỤC TIÊU</h2>
        <div className="ml-4 space-y-4">
          <div><p className="font-bold">1. Kiến thức:</p>{renderList(plan.muc_tieu?.kien_thuc)}</div>
          <div>
            <p className="font-bold">2. Năng lực:</p>
            <div className="ml-4 mt-2">
              <p className="italic font-bold">a) Năng lực chung:</p>
              {renderList(plan.muc_tieu?.nang_luc?.chung)}
              <p className="italic font-bold mt-2">b) Năng lực đặc thù:</p>
              {renderList(plan.muc_tieu?.nang_luc?.dac_thu)}
              {plan.muc_tieu?.nang_luc?.so && plan.muc_tieu.nang_luc.so.length > 0 && (
                <>
                  <p className="italic font-bold mt-2">c) Năng lực số (CV 3456):</p>
                  {renderList(plan.muc_tieu.nang_luc.so)}
                </>
              )}
            </div>
          </div>
          <div><p className="font-bold">3. Phẩm chất:</p>{renderList(plan.muc_tieu?.pham_chat)}</div>
        </div>
      </section>

      {/* II. THIẾT BỊ */}
      <section className="mb-8">
        <h2 className="font-bold uppercase text-[13pt] mb-3">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
        {renderList(plan.thiet_bi_hoc_lieu)}
      </section>

      {/* III. TIẾN TRÌNH */}
      <section className="mb-8">
        <h2 className="font-bold uppercase text-[13pt] mb-6">III. TIẾN TRÌNH DẠY HỌC</h2>
        {plan.tien_trinh_day_hoc && plan.tien_trinh_day_hoc.map((hd, i) => (
          <div key={i} className="mb-10 pb-6">
            <div className="flex items-center mb-4">
              <p className="font-bold uppercase text-black">Hoạt động {hd.hoat_dong_so}: {hd.ten_hoat_dong}</p>
            </div>
            
            <div className="ml-4 space-y-4">
              <p><span className="font-bold">a) Mục tiêu:</span> <MathSpan text={hd.muc_tieu?.join(' ') || ''} /></p>
              <p><span className="font-bold">b) Nội dung:</span> <MathSpan text={hd.noi_dung?.join(' ') || ''} /></p>
              <p><span className="font-bold">c) Sản phẩm:</span> <MathSpan text={hd.san_pham?.join(' ') || ''} /></p>
              <div className="mt-4">
                <p className="font-bold underline mb-3">d) Tổ chức thực hiện:</p>
                <div className="ml-6 space-y-5">
                  <div>
                    <p className="font-bold">• Bước 1: Chuyển giao nhiệm vụ</p>
                    {hd.to_chuc_thuc_hien?.chuyen_giao_nhiem_vu?.map((s,idx)=><p key={idx} className="ml-4 mt-1"><MathSpan text={s}/></p>)}
                  </div>
                  <div>
                    <p className="font-bold">• Bước 2: Thực hiện nhiệm vụ</p>
                    {hd.to_chuc_thuc_hien?.thuc_hien_nhiem_vu?.map((s,idx)=><p key={idx} className="ml-4 mt-1 italic"><MathSpan text={s}/></p>)}
                  </div>
                  <div>
                    <p className="font-bold">• Bước 3: Báo cáo, thảo luận</p>
                    {hd.to_chuc_thuc_hien?.bao_cao_thao_luan?.map((s,idx)=><p key={idx} className="ml-4 mt-1"><MathSpan text={s}/></p>)}
                  </div>
                  <div className="bg-gray-50 p-3 rounded border-l-4 border-black">
                    <p className="font-bold">• Bước 4: Kết luận, nhận định (Ghi vở)</p>
                    {hd.to_chuc_thuc_hien?.ket_luan_nhan_dinh?.map((s,idx)=><p key={idx} className="ml-4 mt-2 font-bold"><MathSpan text={s}/></p>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Signature */}
      <div className="mt-20 flex justify-between px-10 text-center text-[11pt] font-bold uppercase">
        <div className="w-[40%]">
          <p>XÁC NHẬN CỦA TỔ TRƯỞNG</p>
          <div className="h-28"></div>
        </div>
        <div className="w-[40%]">
          <p>GIÁO VIÊN SOẠN</p>
          <div className="h-28"></div>
          <p className="capitalize font-bold">{plan.header.giao_vien}</p>
        </div>
      </div>
    </div>
  );
};
