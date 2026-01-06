
import { GoogleGenAI } from "@google/genai";
import { FormInputs, LessonPlan } from "./types.ts";

const SYSTEM_PROMPT = `Bạn là chuyên gia thiết kế giáo án THCS theo chương trình GDPT 2018 và chuẩn “KHUNG KẾ HOẠCH BÀI DẠY (KHBG) – mẫu 5512”.
Nhiệm vụ: từ dữ liệu người dùng nhập + nội dung tài liệu giáo viên cung cấp (Phụ lục 1, Phụ lục 3, KHBG mẫu, Phụ lục năng lực số), hãy tạo ra 01 KẾ HOẠCH BÀI DẠY theo đúng bố cục bắt buộc của Công văn 5512.

QUY TẮC CHI TIẾT CHO MỖI HOẠT ĐỘNG:
Mỗi hoạt động phải trình bày đầy đủ 4 mục (a, b, c, d) như sau:
a) Mục tiêu.
b) Nội dung.
c) Sản phẩm.
d) Tổ chức thực hiện: Phải mô tả rõ 4 bước vận hành (Chuyển giao, Thực hiện, Báo cáo, Kết luận).

Đầu ra BẮT BUỘC là JSON theo cấu trúc chính xác.`;

export async function generateLessonPlan(inputs: FormInputs): Promise<LessonPlan> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Không tìm thấy API Key. Vui lòng kết nối API Key qua nút ở trang đăng nhập.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const userMessage = `
Tạo KHBG cho bài: "${inputs.ten_bai_day}"
Môn: ${inputs.subject}, Lớp: ${inputs.lop}, Thời gian: ${inputs.so_tiet} tiết.
Dữ liệu tham khảo:
- Phụ lục 1: ${inputs.phu_luc_1.substring(0, 1000)}
- Phụ lục 3: ${inputs.phu_luc_3.substring(0, 1000)}
- Tích hợp AI: ${inputs.ai_competency_assessment}
- Tích hợp ATGT: ${inputs.integrate_ATGT}

Yêu cầu trả về JSON chuẩn theo LessonPlan interface.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text) as LessonPlan;
}
