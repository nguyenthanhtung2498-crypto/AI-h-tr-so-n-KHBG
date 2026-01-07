
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from "docx";
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
            new TableCell({ children: [
              new Paragraph({ children: [new TextRun({ text: (plan.header?.truong || "TÊN TRƯỜNG").toUpperCase(), bold: true, size: 22, font: "Times New Roman" })] }), 
              new Paragraph({ children: [new TextRun({ text: `TỔ: ${(plan.header?.to || "CHUYÊN MÔN").toUpperCase()}`, bold: true, size: 22, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "⎯⎯⎯⎯⎯⎯⎯⎯", size: 12 })] })
            ], width: { size: 45, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 22, font: "Times New Roman" })] }), 
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, size: 24, font: "Times New Roman" })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯", size: 12 })] })
            ], width: { size: 55, type: WidthType.PERCENTAGE } })
          ]
        })
      ]
    }),
    
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32, font: "Times New Roman" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `BÀI: ${(plan.header?.ten_bai_day || "CHƯA RÕ").toUpperCase()}`, bold: true, size: 28, font: "Times New Roman" })] }),
    
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Môn học: ${plan.header?.mon || ""}; Lớp: ${plan.header?.lop || ""}; Tiết: ${plan.header?.so_tiet || ""}`, italics: true, size: 24, font: "Times New Roman" })] }),

    // I. MỤC TIÊU
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "I. MỤC TIÊU", bold: true, size: 26, font: "Times New Roman" })] }),
    new Paragraph({ children: [new TextRun({ text: "1. Kiến thức", bold: true, size: 24, font: "Times New Roman" })] }),
    ...(plan.muc_tieu?.kien_thuc || []).map(k => new Paragraph({ children: [new TextRun({ text: `- ${k}`, size: 24, font: "Times New Roman" })], indent: { left: 360 } })),
    
    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "2. Năng lực", bold: true, size: 24, font: "Times New Roman" })] }),
    new Paragraph({ children: [new TextRun({ text: "a) Năng lực chung (01):", italics: true, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
    ...(plan.muc_tieu?.nang_luc?.chung || []).map(n => new Paragraph({ children: [new TextRun({ text: `- ${n}`, size: 24, font: "Times New Roman" })], indent: { left: 720 } })),
    new Paragraph({ children: [new TextRun({ text: "b) Năng lực đặc thù:", italics: true, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
    ...(plan.muc_tieu?.nang_luc?.dac_thu || []).map(n => new Paragraph({ children: [new TextRun({ text: `- ${n}`, size: 24, font: "Times New Roman" })], indent: { left: 720 } })),
    
    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "3. Phẩm chất (01)", bold: true, size: 24, font: "Times New Roman" })] }),
    ...(plan.muc_tieu?.pham_chat || []).map(p => new Paragraph({ children: [new TextRun({ text: `- ${p}`, size: 24, font: "Times New Roman" })], indent: { left: 360 } })),

    // III. TIẾN TRÌNH
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "III. TIẾN TRÌNH DẠY HỌC", bold: true, size: 26, font: "Times New Roman" })] }),
    ...(plan.tien_trinh_day_hoc || []).flatMap(hd => {
      const hdChildren = [
        new Paragraph({ spacing: { before: 300, after: 150 }, children: [new TextRun({ text: `Hoạt động ${hd.hoat_dong_so}: ${hd.ten_hoat_dong}`, bold: true, size: 24, font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: "a) Mục tiêu:", bold: true, size: 24, font: "Times New Roman" }), new TextRun({ text: ` ${(hd.muc_tieu || []).join(' ')}`, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "b) Nội dung:", bold: true, size: 24, font: "Times New Roman" }), new TextRun({ text: ` ${(hd.noi_dung || []).join(' ')}`, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "c) Sản phẩm:", bold: true, size: 24, font: "Times New Roman" }), new TextRun({ text: ` ${(hd.san_pham || []).join(' ')}`, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "d) Tổ chức thực hiện:", bold: true, size: 24, font: "Times New Roman", underline: {} })], indent: { left: 360 } }),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 1: Chuyển giao nhiệm vụ:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 100 } }),
        ...(hd.to_chuc_thuc_hien?.chuyen_giao_nhiem_vu || []).map(s => new Paragraph({ children: [new TextRun({ text: s, size: 24, font: "Times New Roman" })], indent: { left: 1080 } })),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 2: Thực hiện nhiệm vụ:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 100 } }),
        ...(hd.to_chuc_thuc_hien?.thuc_hien_nhiem_vu || []).map(s => new Paragraph({ children: [new TextRun({ text: s, italics: true, size: 24, font: "Times New Roman" })], indent: { left: 1080 } })),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 3: Báo cáo, thảo luận:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 100 } }),
        ...(hd.to_chuc_thuc_hien?.bao_cao_thao_luan || []).map(s => new Paragraph({ children: [new TextRun({ text: s, size: 24, font: "Times New Roman" })], indent: { left: 1080 } })),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 4: Kết luận, nhận định (Nội dung ghi vở):", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 100 } }),
        ...(hd.to_chuc_thuc_hien?.ket_luan_nhan_dinh || []).map(s => new Paragraph({ children: [new TextRun({ text: s, bold: true, size: 24, font: "Times New Roman", color: "000000" })], indent: { left: 1080 } }))
      ];
      return hdChildren;
    }),

    // Signatures
    new Paragraph({ spacing: { before: 1200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "XÁC NHẬN CỦA TỔ TRƯỞNG", bold: true, size: 22, font: "Times New Roman" })] })] }),
            new TableCell({ children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GIÁO VIÊN SOẠN", bold: true, size: 22, font: "Times New Roman" })] }), 
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200 }, children: [new TextRun({ text: (plan.header?.giao_vien || "").toUpperCase(), bold: true, size: 22, font: "Times New Roman" })] })
            ] })
          ]
        })
      ]
    })
  ];

  const doc = new Document({ 
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 720 } } }, children }] 
  });
  const blob = await Packer.toBlob(doc);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `KHBG_V4_${plan.header?.ten_bai_day || "Giao_an"}.docx`;
  a.click();
}
