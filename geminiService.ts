
import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";
import * as pdfjs from "pdfjs-dist";

// Cấu hình worker cho pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs`;

const SYSTEM_PROMPT = `Bạn là Chuyên gia Sư phạm cao cấp, chuyên gia về Công văn 5512 và Khung Năng lực số (NLS) theo Công văn 3456/BGDĐT-GDPT.

NHIỆM VỤ: Soạn thảo Kế hoạch bài dạy (KHBG) với kịch bản chi tiết, sinh động và chuẩn mực.

QUY TẮC "CHỈ CHỌN MỘT" (STRICT RULE):
1. Năng lực chung: Chọn DUY NHẤT 01 năng lực (VD: Tự chủ và tự học).
2. Năng lực số (NLS): Chọn DUY NHẤT 01 chỉ số cụ thể từ CV 3456. Phải ghi rõ mã/tên năng lực (VD: 1.1. Duyệt, tìm kiếm và lọc dữ liệu...).
3. Phẩm chất: Chọn DUY NHẤT 01 phẩm chất cốt lõi (VD: Trách nhiệm).

QUY TẮC VỀ TÍCH HỢP & CHỈNH SỬA:
- Bạn có TOÀN QUYỀN THAY ĐỔI, THÊM, SỬA HOẶC XÓA nội dung từ FILE MẪU hoặc SGK. 
- Nếu File mẫu có quá nhiều năng lực/phẩm chất, bạn phải LOẠI BỎ và chỉ giữ lại 01 cái phù hợp nhất như quy tắc trên.
- Các hoạt động trong "Tổ chức thực hiện" phải được thiết kế để trực tiếp phát triển đúng năng lực và phẩm chất đã chọn. NLS phải được thể hiện rõ qua hành động cụ thể của HS (VD: HS dùng máy tính tìm kiếm, HS đánh giá độ tin cậy của nguồn tin...).

KỊCH BẢN TỔ CHỨC THỰC HIỆN (MỤC D):
- Phải có lời thoại GV: "..." và HS: "...".
- Bước 1 (Chuyển giao): GV giao lệnh, công cụ, tiêu chí sản phẩm.
- Bước 2 (Thực hiện): Mô tả HS thao tác, thảo luận. GV quan sát, gợi mở.
- Bước 3 (Báo cáo): HS trình bày, phản biện. GV điều phối.
- Bước 4 (Kết luận): GV nhận xét và CHỐT KIẾN THỨC GHI VỞ (Dùng LaTeX $...$ cho công thức).

CHỈ TRẢ VỀ JSON DUY NHẤT.`;

async function extractTextFromPdfRange(base64: string, start: number, end: number): Promise<string> {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    
    let extractedText = "";
    const actualStart = Math.max(1, start);
    const actualEnd = Math.min(pdf.numPages, end);

    for (let i = actualStart; i <= actualEnd; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      extractedText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return extractedText;
  } catch (e) { return ""; }
}

export async function validateApiKey(key: string): Promise<{ success: boolean; error?: string }> {
  const trimmedKey = key.trim();
  if (!trimmedKey) return { success: false, error: "Vui lòng nhập mã API Key." };
  try {
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    return { success: !!response.text };
  } catch (error: any) {
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("401")) return { success: false, error: "API Key sai." };
    if (msg.includes("429")) return { success: false, error: "Hết hạn mức. Hãy chờ 1 phút." };
    return { success: false, error: "Lỗi: " + error.message };
  }
}

export async function extractLessonListFromPdf(base64: string): Promise<string[]> {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    let fullText = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    const apiKey = process.env.API_KEY;
    if (!apiKey) return [];
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Trích xuất danh sách tên bài học dạng JSON Array từ text này: ${fullText.substring(0, 5000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) { return []; }
}

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key chưa được thiết lập.");
  const ai = new GoogleGenAI({ apiKey });
  
  let sourceContext = "";
  if (inputs.autoComposeMode === 'TEXTBOOK' && inputs.textbookPdfData && inputs.startPage && inputs.endPage) {
    sourceContext = await extractTextFromPdfRange(inputs.textbookPdfData, inputs.startPage, inputs.endPage);
  } else if (inputs.autoComposeMode === 'TEMPLATE' && inputs.khbg_mau) {
    sourceContext = `FILE MẪU: ${inputs.khbg_mau.substring(0, 10000)}`;
  }

  const pl1 = inputs.phu_luc_1 ? `\nPHỤ LỤC 1 (Năng lực/Phẩm chất): ${inputs.phu_luc_1.substring(0, 3000)}` : "";
  const pl3 = inputs.phu_luc_3 ? `\nPHỤ LỤC 3 (Thiết bị): ${inputs.phu_luc_3.substring(0, 3000)}` : "";
  const nlsText = (inputs.nang_luc_so && inputs.nang_luc_so_file_data) ? `\nTÀI LIỆU NĂNG LỰC SỐ CV 3456: ${inputs.nang_luc_so_file_data.substring(0, 6000)}` : "";

  const prompt = `YÊU CẦU SOẠN GIÁO ÁN CHI TIẾT.
  
  RÀNG BUỘC CỰC NGHIÊM: 
  - CHỈ CHỌN DUY NHẤT 01 Năng lực chung.
  - CHỈ CHỌN DUY NHẤT 01 Năng lực số (dựa theo khối lớp ${inputs.lop} và CV 3456).
  - CHỈ CHỌN DUY NHẤT 01 Phẩm chất.
  
  HÀNH ĐỘNG: 
  - Phân tích và sửa đổi triệt để nguồn dữ liệu bên dưới để lồng ghép 01 NLS đã chọn vào các hoạt động giảng dạy. 
  - Tích hợp thêm: ATGT(${inputs.integrate_ATGT}), Môi trường(${inputs.integrate_environment}).
  
  DỮ LIỆU NGUỒN:
  ${sourceContext}
  ${pl1} ${pl3} ${nlsText}
  
  Thông tin hành chính: Bài ${inputs.ten_bai_day}, Môn ${inputs.subject}, Lớp ${inputs.lop}, Tiết ${inputs.so_tiet}, GV ${inputs.giao_vien}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          header: {
            type: Type.OBJECT,
            properties: {
              truong: { type: Type.STRING }, to: { type: Type.STRING }, giao_vien: { type: Type.STRING },
              ten_bai_day: { type: Type.STRING }, mon: { type: Type.STRING }, lop: { type: Type.STRING }, so_tiet: { type: Type.STRING }
            },
            required: ["truong", "to", "giao_vien", "ten_bai_day", "mon", "lop", "so_tiet"]
          },
          muc_tieu: {
            type: Type.OBJECT,
            properties: {
              kien_thuc: { type: Type.ARRAY, items: { type: Type.STRING } },
              nang_luc: {
                type: Type.OBJECT,
                properties: {
                  chung: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng chứa đúng 1 năng lực chung" },
                  dac_thu: { type: Type.ARRAY, items: { type: Type.STRING } },
                  so: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng chứa đúng 1 năng lực số CV 3456" }
                },
                required: ["chung", "dac_thu"]
              },
              pham_chat: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng chứa đúng 1 phẩm chất" }
            },
            required: ["kien_thuc", "nang_luc", "pham_chat"]
          },
          thiet_bi_hoc_lieu: { type: Type.ARRAY, items: { type: Type.STRING } },
          tien_trinh_day_hoc: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hoat_dong_so: { type: Type.NUMBER },
                ten_hoat_dong: { type: Type.STRING },
                ky_thuat_day_hoc: { type: Type.STRING },
                mo_ta_ky_thuat_chi_tiet: { type: Type.STRING },
                muc_tieu: { type: Type.ARRAY, items: { type: Type.STRING } },
                noi_dung: { type: Type.ARRAY, items: { type: Type.STRING } },
                san_pham: { type: Type.ARRAY, items: { type: Type.STRING } },
                to_chuc_thuc_hien: {
                  type: Type.OBJECT,
                  properties: {
                    chuyen_giao_nhiem_vu: { type: Type.ARRAY, items: { type: Type.STRING } },
                    thuc_hien_nhiem_vu: { type: Type.ARRAY, items: { type: Type.STRING } },
                    bao_cao_thao_luan: { type: Type.ARRAY, items: { type: Type.STRING } },
                    ket_luan_nhan_dinh: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["chuyen_giao_nhiem_vu", "thuc_hien_nhiem_vu", "bao_cao_thao_luan", "ket_luan_nhan_dinh"]
                }
              },
              required: ["hoat_dong_so", "ten_hoat_dong", "to_chuc_thuc_hien"]
            }
          }
        },
        required: ["header", "muc_tieu", "tien_trinh_day_hoc"]
      }
    }
  });

  try {
    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedJson);
    
    // Ghi đè thông tin định danh
    data.header.truong = inputs.truong;
    data.header.to = inputs.to;
    data.header.giao_vien = inputs.giao_vien;
    data.header.ten_bai_day = inputs.ten_bai_day;
    data.header.mon = inputs.subject;
    data.header.lop = inputs.lop;
    data.header.so_tiet = inputs.so_tiet;

    // Hậu kiểm quy tắc "Chỉ chọn 1"
    if (data.muc_tieu.nang_luc.chung.length > 1) data.muc_tieu.nang_luc.chung = [data.muc_tieu.nang_luc.chung[0]];
    if (data.muc_tieu.nang_luc.so && data.muc_tieu.nang_luc.so.length > 1) data.muc_tieu.nang_luc.so = [data.muc_tieu.nang_luc.so[0]];
    if (data.muc_tieu.pham_chat.length > 1) data.muc_tieu.pham_chat = [data.muc_tieu.pham_chat[0]];

    return data;
  } catch (e) {
    throw new Error("⚠️ AI gặp sự cố cấu trúc dữ liệu. Vui lòng bấm 'Khởi tạo' lại.");
  }
}
