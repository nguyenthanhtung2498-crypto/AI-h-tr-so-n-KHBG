
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { LessonPlan } from "./types.ts";

export async function exportToWord(plan: LessonPlan) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `Trường: ${plan.header.truong.toUpperCase()}`, bold: true })] }),
                      new Paragraph({ children: [new TextRun({ text: `Tổ: ${plan.header.to.toUpperCase()}`, bold: true })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        // Fix: Changed 'italic' to 'italics' to match docx IRunOptions
                        children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, italics: true })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 400, after: 400 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `TÊN BÀI DẠY: ${plan.header.ten_bai_day.toUpperCase()}`, bold: true, size: 28 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              // Fix: Changed 'italic' to 'italics' to match docx IRunOptions
              new TextRun({ text: `Môn: ${plan.header.mon} | Lớp: ${plan.header.lop} | Thời gian: ${plan.header.so_tiet} tiết`, italics: true }),
            ],
          }),

          new Paragraph({ spacing: { before: 400 } }),

          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "I. Mục tiêu", bold: true, size: 24 })] }),
          new Paragraph({ children: [new TextRun({ text: "1. Kiến thức:", bold: true })] }),
          ...plan.muc_tieu.kien_thuc.map(t => new Paragraph({ children: [new TextRun({ text: `- ${t}` })], indent: { left: 720 } })),

          new Paragraph({ children: [new TextRun({ text: "2. Năng lực:", bold: true })] }),
          ...plan.muc_tieu.nang_luc.dac_thu.map(t => new Paragraph({ children: [new TextRun({ text: `- ${t}` })], indent: { left: 720 } })),

          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "III. Tiến trình dạy học", bold: true, size: 24 })] }),

          ...plan.tien_trinh_day_hoc.flatMap(hd => [
            new Paragraph({
              spacing: { before: 300 },
              children: [new TextRun({ text: `Hoạt động ${hd.hoat_dong_so}: ${hd.ten_hoat_dong}`, bold: true })],
            }),
            new Paragraph({ children: [new TextRun({ text: "a) Mục tiêu:", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: hd.muc_tieu.join('; ') })], indent: { left: 360 } }),
            new Paragraph({ children: [new TextRun({ text: "d) Tổ chức thực hiện:", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: `* Chuyển giao: ${hd.to_chuc_thuc_hien.chuyen_giao_nhiem_vu.join(' ')}` })], indent: { left: 360 } }),
            new Paragraph({ children: [new TextRun({ text: `* Kết luận: ${hd.to_chuc_thuc_hien.ket_luan_nhan_dinh.join(' ')}` })], indent: { left: 360 } }),
          ]),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KHBG_${plan.header.ten_bai_day.replace(/\s+/g, '_')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
