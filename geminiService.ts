
import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";
import * as pdfjs from "pdfjs-dist";

// Cấu hình worker cho pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs`;

const SYSTEM_PROMPT = `Bạn là Chuyên gia Sư phạm cốt cán bậc nhất, am hiểu sâu sắc Chương trình GDPT 2018 và Công văn 5512.
NHIỆM VỤ: Thiết kế KHBG dưới dạng KỊCH BẢN GIẢNG DẠY (DIALOGUE SCRIPT).

QUY TẮC BẮT BUỘC:
1. MỤC TIÊU: 
   - PHẨM CHẤT: Chọn đúng 01 mục tiêu từ [Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm].
   - NĂNG LỰC CHUNG: Chọn đúng 01 mục tiêu từ [Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo].
   - Phải mô tả chi tiết HS làm gì để đạt được chúng.

2. TỔ CHỨC THỰC HIỆN (HÌNH THỨC KỊCH BẢN):
   - Bước 1 (Chuyển giao): GV trình chiếu gì? Nói gì? (VD: GV: "Các em hãy quan sát hình ảnh sau và cho biết...").
   - Bước 2 (Thực hiện): HS làm việc cá nhân/nhóm như thế nào? GV theo dõi và hỗ trợ gì?
   - Bước 3 (Báo cáo): PHẢI viết kịch bản hội thoại:
     - GV: "Mời đại diện nhóm 1 trình bày kết quả."
     - HS (Đại diện nhóm 1): "Thưa thầy/cô, nhóm em nhận thấy..."
     - GV: "Nhóm 2 có nhận xét gì không? Theo em, tại sao lại có kết quả đó?"
   - Bước 4 (Kết luận): PHẢI soạn sẵn nội dung ghi vở cô đọng, súc tích.`;

/**
 * Kiểm tra mã API Key có hợp lệ không bằng cách gửi một yêu cầu thử nghiệm
 */
export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    // Sử dụng model 'gemini-3-flash-preview' cho các tác vụ kiểm tra cơ bản
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
    });
    return !!response.text;
  } catch (error: any) {
    // Nếu lỗi 404 xảy ra ở đây, thường là do model name hoặc dự án chưa kích hoạt API phù hợp
    console.error("API Key Validation Error:", error);
    return false;
  }
}

/**
 * Trình trích xuất mục lục nâng cao (Hỗ trợ cả PDF văn bản và PDF ảnh quét/OCR)
 */
export async function extractLessonListFromPdf(base64: string): Promise<string[]> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  let fullText = "";
  const pagesToScan = Math.min(pdf.numPages, 10); 

  for (let i = 1; i <= pagesToScan; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
  }

  const apiKey = (window as any).process?.env?.GEMINI_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình API Key.");
  const ai = new GoogleGenAI({ apiKey });

  if (fullText.trim().length < 100) {
    const imageParts: any[] = [];
    const visionPages = Math.min(pdf.numPages, 5);
    
    for (let i = 1; i <= visionPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        imageParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imgData
          }
        });
      }
    }

    if (imageParts.length > 0) {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            ...imageParts,
            { text: "Đây là ảnh chụp các trang đầu của một cuốn sách giáo khoa. Hãy thực hiện OCR và trích xuất danh sách tên tất cả các bài học (lessons/chapters) có trong mục lục. Trả về một mảng JSON các chuỗi." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      try {
        return JSON.parse(response.text || "[]");
      } catch (e) {
        return [];
      }
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Dưới đây là nội dung mục lục trích xuất từ sách giáo khoa. Hãy trích xuất danh sách tên các bài học.
    Trả về một mảng JSON các chuỗi (strings).
    
    Nội dung:
    ${fullText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse lesson list", e);
    return [];
  }
}

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  const apiKey = (window as any).process?.env?.GEMINI_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình API Key.");
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Hãy soạn một Kế hoạch bài dạy (KHBG) chuyên nghiệp theo Công văn 5512 cho bài học sau:
  - Tên bài: ${inputs.ten_bai_day}
  - Môn: ${inputs.subject}
  - Lớp: ${inputs.lop}
  - Số tiết: ${inputs.so_tiet}
  - Các yêu cầu tích hợp:
    + An toàn giao thông: ${inputs.integrate_ATGT ? 'Có' : 'Không'}
    + An ninh quốc phòng: ${inputs.integrate_ANQP ? 'Có' : 'Không'}
    + Bảo vệ môi trường: ${inputs.integrate_environment ? 'Có' : 'Không'}
    + Phương pháp tích cực: ${inputs.integrate_active_methods ? 'Có' : 'Không'}
    + Năng lực số (3456): ${inputs.nang_luc_so ? 'Có' : 'Không'}
    + Đánh giá năng lực AI: ${inputs.ai_competency_assessment ? 'Có' : 'Không'}
  
  Dữ liệu bổ sung:
  - Mục tiêu thêm: ${inputs.muc_tieu_them}
  - Phụ lục 1: ${inputs.phu_luc_1}
  - Phụ lục 3: ${inputs.phu_luc_3}
  - Giáo án mẫu/Nội dung SGK: ${inputs.autoComposeMode === 'TEMPLATE' ? inputs.khbg_mau : 'Sử dụng kiến thức SGK'}

  Yêu cầu về cấu trúc kịch bản giảng dạy (Dialogue Script):
  - Tổ chức thực hiện phải có lời thoại GV và dự kiến trả lời của HS.
  - Phải thể hiện rõ 4 bước của CV 5512.`;

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
              truong: { type: Type.STRING },
              to: { type: Type.STRING },
              giao_vien: { type: Type.STRING },
              ten_bai_day: { type: Type.STRING },
              mon: { type: Type.STRING },
              lop: { type: Type.STRING },
              so_tiet: { type: Type.STRING }
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
          },
          ai_assessment: {
            type: Type.OBJECT,
            properties: {
              enabled: { type: Type.BOOLEAN },
              rubric: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tieu_chi: { type: Type.STRING },
                    muc_dat: { type: Type.STRING },
                    minh_chung: { type: Type.STRING }
                  }
                }
              },
              huong_dan_dao_duc_ai: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          tich_hop: {
            type: Type.OBJECT,
            properties: {
              ATGT: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } } },
              ANQP: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } } },
              BAO_VE_MT: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } } }
            }
          }
        },
        required: ["header", "muc_tieu", "thiet_bi_hoc_lieu", "tien_trinh_day_hoc"]
      }
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse lesson plan", e);
    throw new Error("Không thể tạo giáo án từ phản hồi AI.");
  }
}
