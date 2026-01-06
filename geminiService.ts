
import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";
import * as pdfjs from "pdfjs-dist";

// Cấu hình worker cho pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;
function createAI(apiKey: string) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Bạn chưa nhập API key Gemini.");
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

const SYSTEM_PROMPT = `Bạn là Chuyên gia Tư vấn Giáo dục cao cấp tại Việt Nam, am hiểu sâu sắc Chương trình GDPT 2018 và Công văn 5512.
NHIỆM VỤ: Thiết kế Kế hoạch bài dạy (KHBG) tích hợp LỒNG GHÉP GIÁO DỤC QUỐC PHÒNG VÀ AN NINH theo Thông tư 08/2024/TT-BGDĐT.

QUY ĐỊNH LỒNG GHÉP ANQP CHI TIẾT THEO KHỐI LỚP (BẮT BUỘC TUÂN THỦ):
- LỚP 6: Giới thiệu lịch sử, truyền thống Quân đội/Công an; các địa danh lịch sử kháng chiến; cách đánh mưu trí, sáng tạo của quân và dân ta.
- LỚP 7: Hoạt động bảo vệ chủ quyền biển, đảo; bảo vệ thông tin cá nhân trên mạng xã hội; quyền tự do tín ngưỡng, tôn giáo.
- LỚP 8: Lòng tự hào dân tộc và sức mạnh đại đoàn kết; giới thiệu các mốc quốc giới; tác hại tệ nạn xã hội; phòng chống bạo lực học đường.
- LỚP 9: Hậu quả chiến tranh xâm lược; phát triển kinh tế gắn với quốc phòng; các bài hát ca ngợi truyền thống QĐND/CAND; trách nhiệm bảo vệ Tổ quốc.`;

const lessonPlanSchema = {
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
        so_tiet: { type: Type.STRING },
        ghi_chu: { type: Type.STRING }
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
            chung: { type: Type.ARRAY, items: { type: Type.STRING } },
            dac_thu: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["chung", "dac_thu"]
        },
        pham_chat: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["kien_thuc", "nang_luc", "pham_chat"]
    },
    thiet_bi_hoc_lieu: { type: Type.ARRAY, items: { type: Type.STRING } },
    tien_trinh_day_hoc: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hoat_dong_so: { type: Type.INTEGER },
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
            },
            required: ["chuyen_giao_nhiem_vu", "thuc_hien_nhiem_vu", "bao_cao_thao_luan", "ket_luan_nhan_dinh"]
          }
        },
        required: ["hoat_dong_so", "ten_hoat_dong", "muc_tieu", "noi_dung", "san_pham", "to_chuc_thuc_hien"]
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
              min_chung: { type: Type.STRING }
            },
            required: ["tieu_chi", "muc_dat", "min_chung"]
          }
        },
        huong_dan_dao_duc_ai: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["enabled", "rubric", "huong_dan_dao_duc_ai"]
    },
    tich_hop: {
      type: Type.OBJECT,
      properties: {
        ATGT: {
          type: Type.OBJECT,
          properties: {
            enabled: { type: Type.BOOLEAN },
            the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["enabled", "the_hien_o"]
        },
        ANQP: {
          type: Type.OBJECT,
          properties: {
            enabled: { type: Type.BOOLEAN },
            the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["enabled", "the_hien_o"]
        },
        BAO_VE_MT: {
          type: Type.OBJECT,
          properties: {
            enabled: { type: Type.BOOLEAN },
            the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["enabled", "the_hien_o"]
        }
      },
      required: ["ATGT", "ANQP", "BAO_VE_MT"]
    }
  },
  required: ["header", "muc_tieu", "thiet_bi_hoc_lieu", "tien_trinh_day_hoc", "ai_assessment", "tich_hop"]
};

async function getPdfVisualDiagnosis(pdfBase64: string): Promise<{ 
  summaryText: string; 
  pageImages: string[];
  totalPages: number;
}> {
  try {
    const pdfData = atob(pdfBase64);
    const uint8Array = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      uint8Array[i] = pdfData.charCodeAt(i);
    }

    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    
    let summaryText = "";
    const pageImages: string[] = [];
    const targetPages = new Set<number>();
    
    for (let i = 1; i <= Math.min(5, pdf.numPages); i++) targetPages.add(i);
    const scanDepth = 12; 
    for (let i = Math.max(1, pdf.numPages - scanDepth); i <= pdf.numPages; i++) targetPages.add(i);

    const pageIndices = Array.from(targetPages).sort((a, b) => a - b);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    for (const pageNum of pageIndices) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const strings = content.items.map((it: any) => it.str).join(" ");
        summaryText += `[Trang ${pageNum}]: ${strings}\n\n`;

        const viewport = page.getViewport({ scale: 1.2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        pageImages.push(imgData);
      } catch (e) {}
    }
    
    return { summaryText, pageImages, totalPages: pdf.numPages };
  } catch (e) {
    throw new Error("Lỗi xử lý PDF.");
  }
}

export async function extractCatalogFromPdf(pdfBase64: string, apiKey: string): Promise<string[]> {
  const ai = createAI(apiKey);
  const diagnosis = await getPdfVisualDiagnosis(pdfBase64);

  const contentParts: any[] = [];
  diagnosis.pageImages.forEach(imgBase64 => {
    contentParts.push({ inlineData: { data: imgBase64, mimeType: "image/jpeg" } });
  });
  contentParts.push({ text: `VĂN BẢN TRÍCH XUẤT: ${diagnosis.summaryText}` });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: contentParts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

/**
 * Trích xuất toàn bộ thông tin chi tiết bài học từ văn bản giáo án mẫu
 */
export async function extractLessonMetadata(fileContent: string): Promise<{
  ten_bai_day: string;
  subject?: string;
  lop?: string;
  so_tiet?: stringexport async function extractLessonMetadata(
  fileContent: string,
  apiKey: string
): Promise<{
  ten_bai_day: string;
  subject?: string;
  lop?: string;
  so_tiet?: string;
}> {
  const ai = createAI(apiKey);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy trích xuất thông tin hành chính từ giáo án sau: 
      "${fileContent.substring(0, 4000)}"
      
      Yêu cầu trích xuất:
      - Tên bài dạy (ten_bai_day)
      - Môn học (subject): Chọn 1 trong các giá trị: KHTN, TOÁN, NGỮ VĂN, TIẾNG ANH, LỊCH SỬ - ĐỊA LÍ, GDCD.
      - Khối lớp (lop): Ví dụ 6, 7, 8 hoặc 9.
      - Số tiết (so_tiet): Ví dụ 1, 2, 3...
      
      Trả về định dạng JSON chính xác.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ten_bai_day: { type: Type.STRING },
            subject: { type: Type.STRING },
            lop: { type: Type.STRING },
            so_tiet: { type: Type.STRING }
          },
          required: ["ten_bai_day"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { ten_bai_day: "" };
  }
}

export async function generateLessonPlan(inputs: FormInputs, apiKey: string): Promise<LessonPlan> {
  const ai = createAI(apiKey);
  const contentParts: any[] = [];

  if (inputs.autoComposeMode === 'TEXTBOOK' && (inputs as any).textbookPdfData) {
    contentParts.push({ inlineData: { data: (inputs as any).textbookPdfData, mimeType: "application/pdf" } });
    contentParts.push({ text: `SOẠN GIÁO ÁN CHI TIẾT BÀI: "${inputs.ten_bai_day}" từ nội dung SGK PDF đính kèm.` });
  } else {
    contentParts.push({ text: `SOẠN GIÁO ÁN CHI TIẾT BÀI: "${inputs.ten_bai_day}" theo cấu trúc mẫu: ${inputs.khbg_mau.substring(0, 6000)}` });
  }

  const promptText = `Căn cứ hành chính: Trường ${inputs.truong}, GV ${inputs.giao_vien}, Môn ${inputs.subject}, Lớp ${inputs.lop}, Tiết ${inputs.so_tiet}. Tích hợp ANQP lớp ${inputs.lop} theo TT 08/2024.`;
  contentParts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: contentParts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    const plan = JSON.parse(response.text || "{}") as LessonPlan;
    plan.header.truong = inputs.truong;
    plan.header.to = inputs.to;
    plan.header.giao_vien = inputs.giao_vien;
    plan.header.ten_bai_day = inputs.ten_bai_day;
    plan.header.mon = inputs.subject;
    plan.header.lop = inputs.lop;
    plan.header.so_tiet = inputs.so_tiet;
    return plan;
  } catch (e: any) {
    throw new Error("Lỗi thiết kế giáo án: " + (e?.message || e));
  }
}
