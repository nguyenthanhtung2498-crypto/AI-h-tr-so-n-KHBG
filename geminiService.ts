import { GoogleGenAI, Type } from "@google/genai";
import { FormInputs, LessonPlan } from "./types";

const SYSTEM_PROMPT = `Bạn là Chuyên gia Tư vấn Giáo dục cao cấp, am hiểu sâu sắc Chương trình GDPT 2018, Công văn 5512 và Công văn 3456/BGDĐT-GDPT.

NHIỆM VỤ CỐT LÕI:
1. Thiết kế Kế hoạch bài dạy (KHBG) THCS chính xác theo cấu trúc 5512.
2. CĂN CỨ VÀO KHBG MẪU: Nếu người dùng cung cấp tệp mẫu, bạn phải bám sát phong cách trình bày, ngôn ngữ và các đầu mục của mẫu đó, nhưng cập nhật nội dung kiến thức cho bài dạy mới.

QUY TẮC TÍCH HỢP NĂNG LỰC SỐ (NLS) & ĐẶC THÙ:
- Tại mục "I. Mục tiêu -> 2. Năng lực -> Năng lực đặc thù":
  + Phải liệt kê năng lực đặc thù của môn học (Ví dụ môn KHTN: Nhận thức KHTN, Tìm hiểu tự nhiên, Vận dụng kiến thức...).
  + Chọn chính xác 1 hoặc 2 chỉ báo Năng lực số (NLS) phù hợp nhất từ CV 3456. KHÔNG liệt kê quá nhiều.
- Tại mục "III. Tiến trình dạy học": Mô tả rõ HS sử dụng thiết bị/công cụ số nào để hình thành NLS đó.

QUY TẮC KĨ THUẬT DẠY HỌC:
- Bắt buộc áp dụng ít nhất 01 kĩ thuật dạy học mang tính hợp tác, tích cực (như Mảnh ghép, Khăn trải bàn, KWL, Phòng tranh, XYZ, Sơ đồ tư duy,...) vào phần "d) Tổ chức thực hiện" của một hoạt động phù hợp.
- Ghi rõ tên kĩ thuật dạy học và cách thức triển khai để tăng tính tương tác giữa HS.

CẤU TRÚC JSON PHẢI TRẢ VỀ: Phải trả về một đối tượng JSON hợp lệ theo cấu trúc quy định.`;

// Schema for structured output
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

export async function extractLessonTitle(fileContent: string): Promise<string> {
  // Directly use process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Dưới đây là nội dung giáo án. Hãy trích xuất duy nhất "Tên bài dạy". Nội dung: ${fileContent.substring(0, 2000)}`,
  });

  return response.text || "";
}

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  // Directly use process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const contextMessage = `
DỮ LIỆU BÀI DẠY:
- Tên bài: "${inputs.ten_bai_day}"
- Môn: ${inputs.subject} | Lớp: ${inputs.lop} | Tiết: ${inputs.so_tiet}

TÀI LIỆU CĂN CỨ:
1. KHBG MẪU: ${inputs.khbg_mau ? inputs.khbg_mau.substring(0, 4000) : "Tự động soạn thảo chuẩn 5512"}
2. NĂNG LỰC SỐ: ${inputs.nang_luc_so ? inputs.nang_luc_so.substring(0, 2000) : "Tích hợp mức trung cấp phù hợp THCS"}
3. PHỤ LỤC: ${inputs.phu_luc_1.substring(0, 1000)} | ${inputs.phu_luc_3.substring(0, 1000)}

YÊU CẦU ĐẶC BIỆT:
- Chỉ chọn 1-2 chỉ báo NLS.
- Bổ sung Năng lực đặc thù của môn ${inputs.subject}.
- Sử dụng Kĩ thuật dạy học mang tính hợp tác (như Khăn trải bàn, Mảnh ghép...) trong ít nhất 1 hoạt động.
- Tích hợp ANQP: ${inputs.integrate_ANQP ? "Có" : "Không"}
- Tích hợp Bảo vệ môi trường: ${inputs.integrate_environment ? "Có" : "Không"}
- Đánh giá Năng lực AI: ${inputs.ai_competency_assessment ? "Có" : "Không"}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contextMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: lessonPlanSchema,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI không phản hồi.");
    
    const plan = JSON.parse(text) as LessonPlan;
    
    // Đảm bảo thông tin định danh luôn đúng theo input người dùng
    plan.header.truong = inputs.truong;
    plan.header.to = inputs.to;
    plan.header.giao_vien = inputs.giao_vien;
    plan.header.ten_bai_day = inputs.ten_bai_day;
    plan.header.mon = inputs.subject;
    plan.header.lop = inputs.lop;
    plan.header.so_tiet = inputs.so_tiet;

    return plan;
  } catch (e: any) {
    console.error("Lỗi trong quá trình gọi Gemini API:", e);
    throw new Error("Không thể tạo giáo án. Vui lòng kiểm tra lại tài liệu tải lên hoặc kết nối mạng.");
  }
}
