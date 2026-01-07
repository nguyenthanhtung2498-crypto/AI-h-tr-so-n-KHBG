
export interface LessonHeader {
  truong: string;
  to: string;
  giao_vien: string;
  ten_bai_day: string;
  mon: string;
  lop: string;
  so_tiet: string;
  ghi_chu?: string;
}

export interface LessonObjectives {
  kien_thuc: string[];
  nang_luc: {
    chung: string[];
    dac_thu: string[];
    so?: string[];
  };
  pham_chat: string[];
}

export interface ActivityStep {
  chuyen_giao_nhiem_vu: string[];
  thuc_hien_nhiem_vu: string[];
  bao_cao_thao_luan: string[];
  ket_luan_nhan_dinh: string[];
}

export interface QuestionItem {
  loai: 'TRAC_NGHIEM' | 'TU_LUAN';
  cau_hoi: string;
  lua_chon?: string[];
  dap_an_goi_y: string;
  muc_do: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';
}

export interface Activity {
  hoat_dong_so: number;
  ten_hoat_dong: string;
  ky_thuat_day_hoc?: string;
  mo_ta_ky_thuat_chi_tiet?: string;
  muc_tieu: string[];
  noi_dung: string[];
  san_pham: string[];
  to_chuc_thuc_hien: ActivityStep;
  he_thong_cau_hoi?: QuestionItem[];
}

export interface LessonPlan {
  error?: string; // Trường báo lỗi nếu không thể tích hợp
  header: LessonHeader;
  muc_tieu: LessonObjectives;
  thiet_bi_hoc_lieu: string[];
  tien_trinh_day_hoc: Activity[];
  ai_assessment: {
    enabled: boolean;
    rubric: {
      tieu_chi: string;
      muc_dat: string;
      minh_chung: string;
    }[];
    huong_dan_dao_duc_ai: string[];
  };
  tich_hop: {
    ATGT: { enabled: boolean; the_hien_o: string[] };
    ANQP: { enabled: boolean; the_hien_o: string[] };
    BAO_VE_MT: { enabled: boolean; the_hien_o: string[] };
  };
}

export type Subject = 'KHTN' | 'TOÁN' | 'NGỮ VĂN' | 'TIẾNG ANH' | 'LỊCH SỬ - ĐỊA LÍ' | 'GDCD';

export interface FormInputs {
  truong: string;
  to: string;
  giao_vien: string;
  ten_bai_day: string;
  subject: Subject;
  lop: string;
  so_tiet: string;
  muc_tieu_them: string;
  ai_competency_assessment: boolean;
  integrate_ATGT: boolean;
  integrate_ANQP: boolean;
  integrate_environment: boolean;
  integrate_active_methods: boolean;
  phu_luc_1: string;
  phu_luc_3: string;
  khbg_mau: string;
  nang_luc_so: boolean;
  nang_luc_so_file_data?: string; // Trường mới chứa nội dung tệp Năng lực số
  autoComposeMode: 'TEMPLATE' | 'TEXTBOOK';
  textbookPdfData?: string;
}
