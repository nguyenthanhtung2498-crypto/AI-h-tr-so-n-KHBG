
import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";
import * as pdfjs from "pdfjs-dist";

// Cấu hình worker cho pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs`;

const SYSTEM_PROMPT = `Bạn là Chuyên gia Sư phạm cốt cán bậc nhất, am hiểu sâu sắc Chương trình GDPT 2018 và Công văn 5512.
NHIỆM VỤ: Thiết kế KHBG dưới dạng KỊCH BẢN GIẢNG DẠY (DIALOGUE SCRIPT) cực kỳ chi tiết.

QUY TẮC ĐẶC BIỆT CHO MỤC "TỔ CHỨC THỰC HIỆN" (Mục d):
Bạn phải triển khai 4 bước theo đúng tinh thần 5512:
1. Bước 1 (Chuyển giao): GV nói câu lệnh gì? Sử dụng phương tiện gì? HS nhận nhiệm vụ như thế nào? Nêu rõ tiêu chí đánh giá sản phẩm (Rubric nhanh).
2. Bước 2 (Thực hiện): Mô tả chi tiết hành động của HS (cá nhân/cặp/nhóm). GV làm gì để hỗ trợ? (VD: quan sát, gợi ý cho nhóm gặp khó khăn, đặt câu hỏi giàn giáo).
3. Bước 3 (Báo cáo, thảo luận): GV điều phối thế nào? HS trình bày gì? HS khác nhận xét, phản biện ra sao? (Lồng ghép đánh giá đồng đẳng).
4. Bước 4 (Kết luận, nhận định): GV nhận xét về thái độ và kết quả làm việc. Chốt kiến thức then chốt. Cung cấp nội dung chuẩn để HS ghi vào vở (phần này phải cô đọng, khoa học).

QUY TẮC TÍCH HỢP KĨ THUẬT DẠY HỌC TÍCH CỰC:
- Nếu tích hợp kĩ thuật tích cực, hãy lồng ghép các bước của kĩ thuật đó (VD: Mảnh ghép thì phải có bước nhóm chuyên gia, nhóm mảnh ghép) vào trong 4 bước tổ chức thực hiện nêu trên.

MÔN HỌC & NGÔN NGỮ:
- Sử dụng thuật ngữ sư phạm chuẩn. 
- Viết kịch bản sinh động: GV: "..."; HS: "...".`;

/**
 * Kiểm tra mã API Key cá nhân của người dùng với phản hồi lỗi chi tiết.
 * Đảm bảo key có quyền truy cập vào Gemini API trước khi cho phép vào app.
 */
export async function validateApiKey(key: string): Promise<{ success: boolean; error?: string }> {
  const trimmedKey = key.trim();
  if (!trimmedKey) return { success: false, error: "Vui lòng nhập mã API Key." };
  
  // Kiểm tra định dạng cơ bản (thường bắt đầu bằng AIza)
  if (!trimmedKey.startsWith("AIza")) {
    return { success: false, error: "Định dạng API Key không hợp lệ (phải bắt đầu bằng AIza...)." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    // Thực hiện một yêu cầu siêu nhẹ để kiểm tra quyền truy cập
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Kiểm tra kết nối',
    });

    if (response && response.text) {
      return { success: true };
    }
    return { success: false, error: "Không nhận được phản hồi từ AI. Vui lòng kiểm tra lại Key." };
  } catch (error: any) {
    console.error("Lỗi xác thực API Key:", error);
    
    const status = error.status || 0;
    const message = error.message?.toLowerCase() || "";

    if (status === 403 || message.includes("403") || message.includes("permission")) {
      return { success: false, error: "Lỗi 403: API Key không có quyền truy cập Gemini API hoặc chưa kích hoạt dịch vụ." };
    }
    if (status === 401 || message.includes("401") || message.includes("unauthorized") || message.includes("invalid")) {
      return { success: false, error: "Lỗi 401: API Key sai hoặc không tồn tại. Vui lòng kiểm tra kỹ mã đã dán." };
    }
    if (status === 429 || message.includes("429") || message.includes("quota") || message.includes("rate limit")) {
      return { success: false, error: "Lỗi 429: API Key của bạn đã hết hạn mức sử dụng (Quota). Hãy thử lại sau." };
    }
    if (message.includes("network") || message.includes("fetch")) {
      return { success: false, error: "Lỗi kết nối mạng. Không thể liên lạc với máy chủ AI." };
    }

    return { success: false, error: `Lỗi xác thực: ${error.message || "Mã Key không hợp lệ"}` };
  }
}

export async function extractMetadataFromTemplate(text: string): Promise<Partial<FormInputs>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return {};
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Trích xuất JSON thông tin hành chính từ văn bản sau: truong, to, ten_bai_day, subject, lop, so_tiet.\n\nVăn bản: ${text.substring(0, 4000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            truong: { type: Type.STRING }, to: { type: Type.STRING }, ten_bai_day: { type: Type.STRING },
            subject: { type: Type.STRING }, lop: { type: Type.STRING }, so_tiet: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) { return {}; }
}

export async function extractLessonListFromPdf(base64: string): Promise<string[]> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) { bytes[i] = binary.charCodeAt(i); }
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  let fullText = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Trích xuất mảng JSON tên các bài học:\n${fullText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  try { return JSON.parse(response.text || "[]"); } catch (e) { return []; }
}

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Mất kết nối API Key.");
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Soạn KHBG 5512 kịch bản chi tiết:
  - Bài: ${inputs.ten_bai_day} | Môn: ${inputs.subject} | Lớp: ${inputs.lop} | Tiết: ${inputs.so_tiet}
  - Tích hợp Kỹ thuật tích cực: ${inputs.integrate_active_methods ? 'CÓ (Yêu cầu lồng ghép vào kịch bản 4 bước)' : 'Không'}
  - Tích hợp khác: ATGT(${inputs.integrate_ATGT}), Môi trường(${inputs.integrate_environment}), AI(${inputs.ai_competency_assessment})
  - Nguồn dữ liệu: ${inputs.autoComposeMode === 'TEMPLATE' ? 'File giáo án mẫu' : 'Chuẩn GDPT 2018'}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
            }
          },
          muc_tieu: {
            type: Type.OBJECT,
            properties: {
              kien_thuc: { type: Type.ARRAY, items: { type: Type.STRING } },
              nang_luc: {
                type: Type.OBJECT,
                properties: {
                  chung: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dac_thu: { type: Type.ARRAY, items: { type: Type.STRING } },
                  so: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              pham_chat: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
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
                  }
                }
              }
            }
          }
        },
        required: ["header", "muc_tieu", "tien_trinh_day_hoc"]
      }
    }
  });

  try { return JSON.parse(response.text || "{}"); } catch (e) { throw new Error("Lỗi xử lý phản hồi từ AI."); }
}
