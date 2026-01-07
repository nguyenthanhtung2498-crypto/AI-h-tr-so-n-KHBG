
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { LessonPlan } from "./types";

/**
 * Hàm hỗ trợ tách văn bản chứa công thức toán $...$ thành các TextRun tương ứng
 */
function createTextRunsWithMath(text: string): TextRun[] {
  const parts = text.split(/(\$.*?\$)/g);
  return parts.map(part => {
    if (part.startsWith('$') && part.endsWith('$')) {
      // Xử lý phần toán học
      const formula = part.slice(1, -1);
      return new TextRun({
        text: formula,
        font: "Cambria Math", // Font chuẩn cho toán học trong Office
        italics: true,
        size: 24,
      });
    }
    // Văn bản bình thường
    return new TextRun({
      text: part,
      font: "Times New Roman",
      size: 24,
    });
  });
}

export async function exportToWord(plan: LessonPlan) {
  const children: any[] = [
    // Administrative Header
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
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Môn học: ${plan.header?.mon || ""}; Lớp: ${plan.header?.lop || ""}; Số tiết: ${plan.header?.so_tiet || ""}`, italics: true, size: 24, font: "Times New Roman" })] }),

    // I. OBJECTIVES
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "I. MỤC TIÊU", bold: true, size: 26, font: "Times New Roman" })] }),
    new Paragraph({ children: [new TextRun({ text: "1. Kiến thức", bold: true, size: 24, font: "Times New Roman" })] }),
    ...(plan.muc_tieu?.kien_thuc || []).map(k => new Paragraph({ children: createTextRunsWithMath(`- ${k}`), indent: { left: 360 } })),
    
    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "2. Năng lực", bold: true, size: 24, font: "Times New Roman" })] }),
    new Paragraph({ children: [new TextRun({ text: "a) Năng lực chung:", italics: true, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
    ...(plan.muc_tieu?.nang_luc?.chung || []).map(n => new Paragraph({ children: createTextRunsWithMath(`- ${n}`), indent: { left: 720 } })),
    new Paragraph({ children: [new TextRun({ text: "b) Năng lực đặc thù:", italics: true, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
    ...(plan.muc_tieu?.nang_luc?.dac_thu || []).map(n => new Paragraph({ children: createTextRunsWithMath(`- ${n}`), indent: { left: 720 } })),
    
    ...(plan.muc_tieu?.nang_luc?.so && plan.muc_tieu.nang_luc.so.length > 0 ? [
      new Paragraph({ children: [new TextRun({ text: "c) Năng lực số:", italics: true, size: 24, font: "Times New Roman" })], indent: { left: 360 } }),
      ...plan.muc_tieu.nang_luc.so.map(n => new Paragraph({ children: createTextRunsWithMath(`- ${n}`), indent: { left: 720 } }))
    ] : []),

    new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "3. Phẩm chất", bold: true, size: 24, font: "Times New Roman" })] }),
    ...(plan.muc_tieu?.pham_chat || []).map(p => new Paragraph({ children: createTextRunsWithMath(`- ${p}`), indent: { left: 360 } })),

    // II. EQUIPMENT
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", bold: true, size: 26, font: "Times New Roman" })] }),
    ...(plan.thiet_bi_hoc_lieu || []).map(t => new Paragraph({ children: createTextRunsWithMath(`- ${t}`), indent: { left: 360 } })),

    // III. PROCEDURE
    new Paragraph({ spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "III. TIẾN TRÌNH DẠY HỌC", bold: true, size: 26, font: "Times New Roman" })] }),
    ...(plan.tien_trinh_day_hoc || []).flatMap(hd => {
      const hdChildren = [
        new Paragraph({ spacing: { before: 300, after: 150 }, children: [new TextRun({ text: `Hoạt động ${hd.hoat_dong_so}: ${hd.ten_hoat_dong}`, bold: true, size: 24, font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: "a) Mục tiêu:", bold: true, size: 24, font: "Times New Roman" }), ...createTextRunsWithMath(` ${(hd.muc_tieu || []).join(' ')}`)], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "b) Nội dung:", bold: true, size: 24, font: "Times New Roman" }), ...createTextRunsWithMath(` ${(hd.noi_dung || []).join(' ')}`)], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "c) Sản phẩm:", bold: true, size: 24, font: "Times New Roman" }), ...createTextRunsWithMath(` ${(hd.san_pham || []).join(' ')}`)], indent: { left: 360 } }),
        new Paragraph({ children: [new TextRun({ text: "d) Tổ chức thực hiện:", bold: true, size: 24, font: "Times New Roman", underline: {} })], indent: { left: 360 } }),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 1: Chuyển giao nhiệm vụ:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 120 } }),
        ...(hd.to_chuc_thuc_hien?.chuyen_giao_nhiem_vu || []).map(s => {
          const isGV = s.startsWith('GV:') || s.startsWith('Giáo viên:');
          return new Paragraph({ 
            children: createTextRunsWithMath(s).map(tr => {
              if (isGV) tr.options.bold = true;
              return tr;
            }), 
            indent: { left: 1080 } 
          });
        }),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 2: Thực hiện nhiệm vụ:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 120 } }),
        ...(hd.to_chuc_thuc_hien?.thuc_hien_nhiem_vu || []).map(s => {
          const isHS = s.startsWith('HS:') || s.startsWith('Học sinh:');
          return new Paragraph({ 
            children: createTextRunsWithMath(s).map(tr => {
              if (isHS) tr.options.italics = true;
              return tr;
            }), 
            indent: { left: 1080 } 
          });
        }),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 3: Báo cáo, thảo luận:", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 120 } }),
        ...(hd.to_chuc_thuc_hien?.bao_cao_thao_luan || []).map(s => new Paragraph({ children: createTextRunsWithMath(s), indent: { left: 1080 } })),
        
        new Paragraph({ children: [new TextRun({ text: "Bước 4: Kết luận, nhận định (Nội dung ghi vở):", bold: true, size: 24, font: "Times New Roman" })], indent: { left: 720 }, spacing: { before: 120 } }),
        ...(hd.to_chuc_thuc_hien?.ket_luan_nhan_dinh || []).map(s => new Paragraph({ children: createTextRunsWithMath(s).map(tr => { tr.options.bold = true; return tr; }), indent: { left: 1080 } }))
      ];
      return hdChildren;
    }),

    // Signature
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
  a.download = `KHBG_V4_5512_${plan.header?.ten_bai_day || "Giao_an"}.docx`;
  a.click();
}
