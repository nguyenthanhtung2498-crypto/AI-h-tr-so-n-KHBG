
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
  };
  pham_chat: string[];
}

export interface ActivityStep {
  chuyen_giao_nhiem_vu: string[];
  thuc_hien_nhiem_vu: string[];
  bao_cao_thao_luan: string[];
  ket_luan_nhan_dinh: string[];
}

export interface Activity {
  hoat_dong_so: number;
  ten_hoat_dong: string;
  muc_tieu: string[];
  noi_dung: string[];
  san_pham: string[];
  to_chuc_thuc_hien: ActivityStep;
}

export interface RubricItem {
  tieu_chi: string;
  muc_dat: string;
  minh_chung: string;
}

export interface IntegrationTopic {
  enabled: boolean;
  the_hien_o: string[];
}

export interface LessonPlan {
  header: LessonHeader;
  muc_tieu: LessonObjectives;
  thiet_bi_hoc_lieu: string[];
  tien_trinh_day_hoc: Activity[];
  ai_assessment: {
    enabled: boolean;
    rubric: RubricItem[];
    huong_dan_dao_duc_ai: string[];
  };
  tich_hop: {
    ATGT: IntegrationTopic;
    ANQP: IntegrationTopic;
    BAO_VE_MT: IntegrationTopic;
  };
  nguon_noi_dung: {
    tom_tat_tu_file_upload: string[];
    noi_dung_suy_luan_can_ra_soat: string[];
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
  phu_luc_1: string;
  phu_luc_3: string;
  khbg_mau: string;
  nang_luc_so: string;
}
