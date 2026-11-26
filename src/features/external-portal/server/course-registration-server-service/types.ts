export interface QldttxAccountInput {
  username: string;
  password?: string;
  token?: string | null;
}

export interface CourseMutationOptions {
  id_to_hoc: string;
  id_rs?: string;
  sv_nganh?: number;
}

export interface OpenCourseGroupItem {
  id_to_hoc: string;
  ma_mon: string;
  ten_mon?: string;
  nhom_to: string;
  so_tc?: number;
  so_tc_hp?: number;
  sl_dk: number;
  sl_cl: number;
  sl_cp: number;
  enable: boolean;
  gc_enable?: string;
  tkb?: string;
  phai_dong?: number;
  hoc_phi_tam_tinh?: number;
  lop?: string;
  ds_khoa?: any[];
  [key: string]: any;
}

export interface SubjectDictItem {
  ma: string;
  ten: string;
  so_tc?: number;
  so_tc_hp?: number;
  [key: string]: any;
}

export interface OpenCoursesResult {
  ds_nhom_to: OpenCourseGroupItem[];
  ds_mon_hoc: SubjectDictItem[];
  hoc_ky_dang_ky: string;
  trong_thoi_gian_dang_ky: boolean;
  id_rs: string;
  newToken?: string;
  rawResponse?: any;
}

export interface RegisteredCoursesResult {
  ds_kqdkmh: any[];
  totalCourses: number;
  totalCredits: number;
  tuitionFee: number;
  id_rs?: string;
  newToken?: string;
  rawResponse?: any;
}

export interface RegisterCourseResponse {
  success: boolean;
  message?: string;
  id_rs?: string;
  ket_qua_dang_ky?: any;
  newToken?: string;
  rawResponse?: any;
}
