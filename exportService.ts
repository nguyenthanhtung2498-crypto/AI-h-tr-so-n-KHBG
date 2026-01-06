
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { LessonPlan } from "./types";

export async function exportToWord(plan: LessonPlan) {
  const children: any[] = [
    // Header hành chính
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: plan.header.truong.toUpperCase(), bold: true })] }), new Paragraph({ children: [new TextRun({ text: `TỔ: ${plan.header.to.toUpperCase()}`, bold: true })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, italics: true })] })] })
          ]
        })
      ]
    }),
    
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `BÀI: ${plan.header.ten_bai_day.toUpperCase()}`, bold: true, size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Môn học: ${plan.header.mon}; Lớp: ${plan.header.lop}`, italics: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Thời gian thực hiện: ${plan.header.so_tiet} tiết`, italics: true })] }),

    // I. Mục tiêu
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "I. MỤC TIÊU", bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: "1. Kiến thức", bold: true })] }),
    ...plan.muc_tieu.kien_thuc.map(k => new Paragraph({ children: [new TextRun({ text: `- ${k}` })], indent: { left: 360 } })),
    
    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "2. Năng lực", bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: "a) Năng lực chung:", italics: true })], indent: { left: 360 } }),
    ...plan.muc_tieu.nang_luc.chung.map(n => new Paragraph({ children: [new TextRun({ text: `- ${n}` })], indent: { left: 720 } })),
    new Paragraph({ children: [new TextRun({ text: "b) Năng lực đặc thù:", italics: true })], indent: { left: 360 } }),
    ...plan.muc_tieu.nang_luc.dac_thu.map(n => new Paragraph({ children: [new TextRun({ text: `- ${n}` })], indent: { left: 720 } })),
    
    ...( (plan.muc_tieu.nang_luc as any).so?.length > 0 ? [
        new Paragraph({ children: [new TextRun({ text: "c) Năng lực số (CV 3456):", italics: true })], indent: { left: 360 } }),
        ...(plan.muc_tieu.nang_luc as any).so.map((s: string) => new Paragraph({ children: [new TextRun({ text: `- ${s}` })], indent: { left: 720 } }))
    ] : []),

    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "3. Phẩm chất", bold: true })] }),
    ...plan.muc_tieu.pham_chat.map(p => new Paragraph({ children: [new TextRun({ text: `- ${p}` })], indent: { left: 360 } })),

    // II. Thiết bị
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", bold: true })] }),
    ...plan.thiet_bi_hoc_lieu.map(t => new Paragraph({ children: [new TextRun({ text: `- ${t}` })], indent: { left: 360 } })),

    // III. Tiến trình
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "III. TIẾN TRÌNH DẠY HỌC", bold: true })] }),
    ...plan.tien_trinh_day_hoc.flatMap(hd => [
      new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: `Hoạt động ${hd.hoat_dong_so}: ${hd.ten_hoat_dong}`, bold: true, underline: {} })] }),
      ...( (hd as any).ky_thuat_day_hoc ? [new Paragraph({ children: [new TextRun({ text: `Kĩ thuật sử dụng: ${(hd as any).ky_thuat_day_hoc}`, italics: true, color: "1d4ed8" })], indent: { left: 360 } })] : [] ),
      new Paragraph({ children: [new TextRun({ text: "a) Mục tiêu:", bold: true })], indent: { left: 360 } }),
      new Paragraph({ children: [new TextRun({ text: hd.muc_tieu.join(' ') })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: "b) Nội dung:", bold: true })], indent: { left: 360 } }),
      new Paragraph({ children: [new TextRun({ text: hd.noi_dung.join(' ') })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: "c) Sản phẩm:", bold: true })], indent: { left: 360 } }),
      new Paragraph({ children: [new TextRun({ text: hd.san_pham.join(' ') })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: "d) Tổ chức thực hiện:", bold: true })], indent: { left: 360 } }),
      new Paragraph({ children: [new TextRun({ text: "- Bước 1: Chuyển giao nhiệm vụ:", bold: true })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: hd.to_chuc_thuc_hien.chuyen_giao_nhiem_vu.join(' ') })], indent: { left: 1080 } }),
      new Paragraph({ children: [new TextRun({ text: "- Bước 2: Thực hiện nhiệm vụ:", bold: true })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: hd.to_chuc_thuc_hien.thuc_hien_nhiem_vu.join(' ') })], indent: { left: 1080 } }),
      new Paragraph({ children: [new TextRun({ text: "- Bước 3: Báo cáo, thảo luận:", bold: true })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: hd.to_chuc_thuc_hien.bao_cao_thao_luan.join(' ') })], indent: { left: 1080 } }),
      new Paragraph({ children: [new TextRun({ text: "- Bước 4: Kết luận, nhận định:", bold: true })], indent: { left: 720 } }),
      new Paragraph({ children: [new TextRun({ text: hd.to_chuc_thuc_hien.ket_luan_nhan_dinh.join(' ') })], indent: { left: 1080 } })
    ]),

    // IV. Rubric
    ...(plan.ai_assessment.enabled ? [
      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "IV. ĐÁNH GIÁ KẾT QUẢ", bold: true })] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tiêu chí", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mức đạt", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Minh chứng", bold: true })] })] })
            ]
          }),
          ...plan.ai_assessment.rubric.map(r => new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: r.tieu_chi })] }),
              new TableCell({ children: [new Paragraph({ text: r.muc_dat })] }),
              new TableCell({ children: [new Paragraph({ text: r.minh_chung })] })
            ]
          }))
        ]
      })
    ] : []),

    // Chữ ký
    new Paragraph({ spacing: { before: 1200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "XÁC NHẬN CỦA TỔ TRƯỞNG", bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GIÁO VIÊN SOẠN", bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1000 }, children: [new TextRun({ text: plan.header.giao_vien.toUpperCase(), bold: true })] })] })
          ]
        })
      ]
    })
  ];

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `KHBG_${plan.header.ten_bai_day}.docx`;
  a.click();
}
