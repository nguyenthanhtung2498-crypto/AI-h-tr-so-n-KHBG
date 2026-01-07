
import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const SYSTEM_PROMPT = `Bạn là Chuyên gia Giáo dục cao cấp, am hiểu sâu sắc Công văn 5512/BGDĐT và Công văn 3456/BGDĐT-GDTrH (Khung năng lực số cho học sinh).
NHIỆM VỤ: Thiết kế Kế hoạch bài dạy (KHBG) có chiều sâu, cá nhân hóa cao.

QUY TẮC CHỌN LỌC NĂNG LỰC (BẮT BUỘC):
1. Năng lực chung: Chỉ chọn DUY NHẤT 01 năng lực tiêu biểu nhất.
2. Phẩm chất: Chỉ chọn DUY NHẤT 01 phẩm chất đặc trưng nhất.
3. Năng lực đặc thù: Chọn năng lực môn học bám sát "Yêu cầu cần đạt" từ tệp phụ lục được cung cấp.
4. Năng lực số (CV 3456): Nếu có tệp NLS, chỉ chọn DUY NHẤT 01 mã năng lực số phù hợp.
=> Sau khi chọn, TOÀN BỘ nội dung các hoạt động dạy học phải tập trung xoáy sâu vào việc rèn luyện đúng các năng lực/phẩm chất đã chọn này.

QUY TẮC TIẾN TRÌNH DẠY HỌC:
- LỒNG GHÉP KĨ THUẬT DẠY HỌC TÍCH CỰC: Tự động chọn 01 kĩ thuật dạy học tích cực (ví dụ: Mảnh ghép, Khăn trải bàn, Sơ đồ tư duy, Trạm, KWL, Think-Pair-Share...) phù hợp nhất với nội dung bài học để triển khai trong 01 hoạt động chính. Ghi rõ tên kĩ thuật trong phần "Tổ chức thực hiện".
- Cấu trúc 4 bước (a, b, c, d): GV giao nhiệm vụ -> HS thực hiện -> Báo cáo/Thảo luận -> Kết luận/Nhận định.

QUY TẮC ĐỌC DỮ LIỆU:
- Ưu tiên trích xuất tên bài, yêu cầu cần đạt và thời lượng từ Phụ lục 1 (Tổ) và Phụ lục 3 (Cá nhân).`;

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
            chung: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Chọn 1 năng lực chung duy nhất" },
            dac_thu: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Yêu cầu cần đạt bám sát Phụ lục" },
            so: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1 mã năng lực số duy nhất theo CV 3456" }
          },
          required: ["chung", "dac_thu"]
        },
        pham_chat: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Chọn 1 phẩm chất duy nhất" }
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
          ky_thuat_day_hoc: { type: Type.STRING, description: "Tên kĩ thuật tích cực sử dụng" },
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
              minh_chung: { type: Type.STRING }
            },
            required: ["tieu_chi", "muc_dat", "minh_chung"]
          }
        },
        huong_dan_dao_duc_ai: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["enabled", "rubric", "huong_dan_dao_duc_ai"]
    },
    tich_hop: {
      type: Type.OBJECT,
      properties: {
        ATGT: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["enabled", "the_hien_o"] },
        ANQP: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["enabled", "the_hien_o"] },
        BAO_VE_MT: { type: Type.OBJECT, properties: { enabled: { type: Type.BOOLEAN }, the_hien_o: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["enabled", "the_hien_o"] }
      },
      required: ["ATGT", "ANQP", "BAO_VE_MT"]
    },
    phu_luc: {
      type: Type.OBJECT,
      properties: {
        phu_luc_1: { type: Type.STRING },
        phu_luc_3: { type: Type.STRING }
      }
    }
  },
  required: ["header", "muc_tieu", "thiet_bi_hoc_lieu", "tien_trinh_day_hoc", "ai_assessment", "tich_hop"]
};

async function getPdfVisualDiagnosis(pdfBase64: string) {
  const pdfData = atob(pdfBase64);
  const uint8Array = new Uint8Array(pdfData.length);
  for (let i = 0; i < pdfData.length; i++) uint8Array[i] = pdfData.charCodeAt(i);
  const loadingTask = pdfjs.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  let summaryText = "";
  const pageImages: string[] = [];
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  for (let i = 1; i <= Math.min(10, pdf.numPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    summaryText += `[Trang ${i}]: ${content.items.map((it: any) => it.str).join(" ")}\n\n`;
    const viewport = page.getViewport({ scale: 1.2 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context!, viewport }).promise;
    pageImages.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
  }
  return { summaryText, pageImages };
}

export async function extractCatalogFromPdf(pdfBase64: string): Promise<string[]> {
  // Luôn khởi tạo instance mới để lấy API Key vừa được dán/chọn
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const diag = await getPdfVisualDiagnosis(pdfBase64);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `VĂN BẢN: ${diag.summaryText}\nTìm danh sách các bài học (mục lục). Trả về mảng JSON.`,
    config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
  });
  return JSON.parse(response.text || "[]");
}

export async function extractLessonMetadata(fileContent: string) {
  // Luôn khởi tạo instance mới để lấy API Key vừa được dán/chọn
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Phân tích văn bản và dự đoán: ten_bai_day (tên bài/chủ đề), subject (Môn học), lop (Khối lớp), so_tiet (Số tiết).
    Văn bản: ${fileContent.substring(0, 8000)}`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: { 
        type: Type.OBJECT, 
        properties: { 
          ten_bai_day: { type: Type.STRING }, 
          subject: { type: Type.STRING }, 
          lop: { type: Type.STRING }, 
          so_tiet: { type: Type.STRING } 
        } 
      } 
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  // Luôn khởi tạo instance mới để lấy API Key vừa được dán/chọn ngay tại thời điểm submit
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let contentParts: any[] = [];
  
  if (inputs.autoComposeMode === 'TEXTBOOK' && inputs.textbookPdfData) {
     const diag = await getPdfVisualDiagnosis(inputs.textbookPdfData);
     diag.pageImages.forEach(img => contentParts.push({ inlineData: { data: img, mimeType: "image/jpeg" } }));
     contentParts.push({ text: `DỮ LIỆU SGK: ${diag.summaryText}` });
  } else {
    contentParts.push({ text: `GIÁO ÁN MẪU: ${inputs.khbg_mau}` });
  }

  if (inputs.phu_luc_1) contentParts.push({ text: `PHỤ LỤC 1 (KHGD TỔ): ${inputs.phu_luc_1}` });
  if (inputs.phu_luc_3) contentParts.push({ text: `PHỤ LỤC 3 (KHGD CÁ NHÂN): ${inputs.phu_luc_3}` });
  if (inputs.nang_luc_so) contentParts.push({ text: `KHUNG NĂNG LỰC SỐ (3456): ${inputs.nang_luc_so}` });

  contentParts.push({ text: `SOẠN BÀI: ${inputs.ten_bai_day}. 
  YÊU CẦU:
  - Chọn duy nhất 1 NL chung, 1 Phẩm chất, 1 NL số (nếu có).
  - Tự động lồng ghép ít nhất 1 kĩ thuật dạy học tích cực vào tiến trình.
  - Nội dung 4 bước tổ chức thực hiện bám sát năng lực đã chọn.` });

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: contentParts },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: lessonPlanSchema,
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  
  return JSON.parse(response.text || "{}") as LessonPlan;
}
