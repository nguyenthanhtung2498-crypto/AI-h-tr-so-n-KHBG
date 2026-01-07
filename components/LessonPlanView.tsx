
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

  const formatStepContent = (lines: string[]) => {
    return lines.map((line, idx) => {
      const isGV = line.startsWith('GV:') || line.startsWith('Giáo viên:');
      const isHS = line.startsWith('HS:') || line.startsWith('Học sinh:');
      
      return (
        <p key={idx} className={`mb-2 leading-relaxed ${isGV ? 'font-medium text-slate-900' : isHS ? 'italic text-slate-700 ml-4' : 'text-slate-800'}`}>
          {isGV && <span className="text-indigo-600 font-black mr-2">●</span>}
          {isHS && <span className="text-emerald-600 font-black mr-2">○</span>}
          <MathSpan text={line} />
        </p>
      );
    });
  };

  if (!plan || !plan.header) return null;

  return (
    <div className="lesson-plan-container bg-white p-12 sm:p-16 shadow-2xl border border-gray-100 max-w-5xl mx-auto text-[13pt] leading-[1.6] text-black">
      {/* Administrative Header */}
      <div className="flex justify-between items-start mb-12">
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

      <div className="text-center mb-12">
        <h1 className="text-[16pt] font-bold uppercase mb-2 tracking-tight">KẾ HOẠCH BÀI DẠY</h1>
        <h2 className="text-[14pt] font-bold uppercase mb-3 italic">BÀI: {plan.header.ten_bai_day}</h2>
        <div className="flex justify-center space-x-10 font-bold text-[11pt]">
          <span>Môn: {plan.header.mon}</span>
          <span>Lớp: {plan.header.lop}</span>
          <span>Số tiết: {plan.header.so_tiet}</span>
        </div>
      </div>

      {/* I. OBJECTIVES */}
      <section className="mb-10">
        <h2 className="font-bold uppercase text-[13pt] mb-4 border-b border-black inline-block">I. MỤC TIÊU</h2>
        <div className="ml-4 space-y-5">
          <div><p className="font-bold mb-1">1. Kiến thức:</p>{renderList(plan.muc_tieu?.kien_thuc)}</div>
          <div>
            <p className="font-bold mb-1">2. Năng lực:</p>
            <div className="ml-4 space-y-3">
              <div><p className="italic font-bold">a) Năng lực chung:</p>{renderList(plan.muc_tieu?.nang_luc?.chung)}</div>
              <div><p className="italic font-bold">b) Năng lực đặc thù:</p>{renderList(plan.muc_tieu?.nang_luc?.dac_thu)}</div>
              {plan.muc_tieu?.nang_luc?.so && plan.muc_tieu.nang_luc.so.length > 0 && (
                <div><p className="italic font-bold">c) Năng lực số (CV 3456):</p>{renderList(plan.muc_tieu.nang_luc.so)}</div>
              )}
            </div>
          </div>
          <div><p className="font-bold mb-1">3. Phẩm chất:</p>{renderList(plan.muc_tieu?.pham_chat)}</div>
        </div>
      </section>

      {/* II. EQUIPMENT */}
      <section className="mb-10">
        <h2 className="font-bold uppercase text-[13pt] mb-4 border-b border-black inline-block">II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h2>
        <div className="ml-4">{renderList(plan.thiet_bi_hoc_lieu)}</div>
      </section>

      {/* III. PROCEDURE */}
      <section className="mb-10">
        <h2 className="font-bold uppercase text-[13pt] mb-8 border-b border-black inline-block">III. TIẾN TRÌNH DẠY HỌC</h2>
        
        {plan.tien_trinh_day_hoc && plan.tien_trinh_day_hoc.map((hd, i) => (
          <div key={i} className="mb-12 break-inside-avoid">
            <h3 className="font-bold uppercase text-black text-[12pt] mb-6 flex items-start">
              <span className="bg-black text-white px-2 py-0.5 mr-3 rounded text-[10pt]">Hoạt động {hd.hoat_dong_so}</span>
              <span>{hd.ten_hoat_dong}</span>
            </h3>
            
            {/* Kỹ thuật dạy học tích cực Box */}
            {hd.ky_thuat_day_hoc && (
              <div className="mb-8 bg-indigo-50/40 p-6 rounded-2xl border-l-4 border-indigo-600 no-print">
                <p className="text-indigo-900 font-black text-[10pt] uppercase mb-3 tracking-widest flex items-center">
                  🚀 KĨ THUẬT: {hd.ky_thuat_day_hoc}
                </p>
                <div className="text-[12pt] text-indigo-950 italic leading-relaxed">
                  <MathSpan text={hd.mo_ta_ky_thuat_chi_tiet || ""} />
                </div>
              </div>
            )}

            <div className="ml-6 space-y-6 text-justify">
              <p><span className="font-bold">a) Mục tiêu:</span> <MathSpan text={hd.muc_tieu?.join(' ') || ''} /></p>
              <p><span className="font-bold">b) Nội dung:</span> <MathSpan text={hd.noi_dung?.join(' ') || ''} /></p>
              <p><span className="font-bold">c) Sản phẩm:</span> <MathSpan text={hd.san_pham?.join(' ') || ''} /></p>
              
              <div className="mt-6">
                <p className="font-bold underline mb-5">d) Tổ chức thực hiện:</p>
                <div className="ml-6 space-y-8">
                  <div className="relative pl-6 border-l border-slate-200">
                    <p className="font-bold text-slate-900 mb-3 flex items-center">
                      <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                      Bước 1: Chuyển giao nhiệm vụ
                    </p>
                    <div className="pl-4">{formatStepContent(hd.to_chuc_thuc_hien?.chuyen_giao_nhiem_vu || [])}</div>
                  </div>

                  <div className="relative pl-6 border-l border-slate-200">
                    <p className="font-bold text-slate-900 mb-3 flex items-center">
                      <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                      Bước 2: Thực hiện nhiệm vụ
                    </p>
                    <div className="pl-4">{formatStepContent(hd.to_chuc_thuc_hien?.thuc_hien_nhiem_vu || [])}</div>
                  </div>

                  <div className="relative pl-6 border-l border-slate-200">
                    <p className="font-bold text-slate-900 mb-3 flex items-center">
                      <span className="absolute left-[-5px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
                      Bước 3: Báo cáo, thảo luận
                    </p>
                    <div className="pl-4">{formatStepContent(hd.to_chuc_thuc_hien?.bao_cao_thao_luan || [])}</div>
                  </div>

                  <div className="relative pl-6 border-l-2 border-black bg-slate-50 p-5 rounded-r-xl">
                    <p className="font-bold text-black mb-4 flex items-center uppercase text-[11pt]">
                      <span className="absolute left-[-6px] top-1 w-3 h-3 bg-black rounded-full"></span>
                      Bước 4: Kết luận, nhận định (Chốt ghi vở)
                    </p>
                    <div className="pl-4 font-bold border-t border-slate-200 pt-4 mt-2">
                      {formatStepContent(hd.to_chuc_thuc_hien?.ket_luan_nhan_dinh || [])}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Signature Section */}
      <div className="mt-24 flex justify-between px-12 text-center text-[11pt] font-bold uppercase tracking-tight">
        <div className="w-[40%]">
          <p>XÁC NHẬN CỦA TỔ TRƯỞNG</p>
          <div className="h-32"></div>
          <div className="w-40 h-[1px] bg-slate-200 mx-auto"></div>
        </div>
        <div className="w-[40%]">
          <p>GIÁO VIÊN SOẠN</p>
          <div className="h-32"></div>
          <p className="capitalize font-black text-[12pt]">{plan.header.giao_vien}</p>
        </div>
      </div>
    </div>
  );
};
