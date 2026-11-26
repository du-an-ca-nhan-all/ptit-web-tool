/**
 * Hệ thống định nghĩa chuẩn hóa các loại Flow Action theo Lớp trưởng
 * Hỗ trợ mở rộng đa module: Đăng Ký Môn Học, Lịch Thi, Khảo Sát Giảng Viên, Học Phí, Điểm Danh, v.v.
 */

// 1. Phân loại nhóm tính năng Flow (Flow Action Category)
export type FlowCategory =
  | 'COURSE_REGISTRATION' // Nhóm Đăng ký môn học & Tín chỉ
  | 'EXAM_SCHEDULE'       // Nhóm Lịch thi & Phòng thi
  | 'TEACHER_SURVEY'      // Nhóm Khảo sát & Đánh giá giảng viên
  | 'TUITION_PAYMENT'     // Nhóm Học phí & Công nợ
  | 'ACCOUNT_PROFILE'     // Nhóm Tài khoản & Dữ liệu sinh viên
  | 'CUSTOM_ACTION';      // Nhóm Hành động tùy chỉnh mở rộng

// 2. Danh mục chi tiết từng Flow Action Type
export type FlowActionType =
  // =========================================================================
  // MODULE 1: ĐĂNG KÝ MÔN HỌC (Course Registration Module)
  // =========================================================================
  | 'COURSE_REGISTER'       // Flow Đăng ký 1 tổ môn học cụ thể
  | 'COURSE_CANCEL'         // Flow Hủy đăng ký 1 tổ môn học
  | 'COURSE_SYNC_ALL'       // Flow Đồng bộ 2 chiều toàn bộ môn học với Lớp trưởng
  | 'COURSE_SNIPE_AUTO'     // Flow Săn slot / tự động đăng ký khi môn mở
  | 'COURSE_CHANGE_GROUP'   // Flow Chuyển nhóm lớp học phần

  // =========================================================================
  // MODULE 2: LỊCH THI & PHÒNG THI (Exam Schedule Module)
  // =========================================================================
  | 'EXAM_REGISTER_ROOM'    // Flow Đăng ký ca thi / phòng thi theo Lớp trưởng
  | 'EXAM_CANCEL_ROOM'      // Flow Hủy ca thi / phòng thi
  | 'EXAM_SYNC_SCHEDULE'    // Flow Đồng bộ toàn bộ lịch thi với Lớp trưởng

  // =========================================================================
  // MODULE 3: KHẢO SÁT & ĐÁNH GIÁ GIẢNG VIÊN (Surveys & Evaluations Module)
  // =========================================================================
  | 'SURVEY_EVALUATE_ALL'   // Flow Tự động đánh giá giảng viên hàng loạt
  | 'SURVEY_SUBMIT_FEEDBACK'// Flow Nộp phiếu khảo sát học kỳ

  // =========================================================================
  // MODULE 4: HỌC PHÍ & CÔNG NỢ (Tuition & Fees Module)
  // =========================================================================
  | 'TUITION_SYNC_STATUS'   // Flow Đồng bộ kiểm tra trạng thái nộp học phí
  | 'TUITION_CONFIRM_PAID'  // Flow Xác nhận thanh toán học phí

  // =========================================================================
  // MODULE 5: TÀI KHOẢN & HỒ SƠ (Account & Profile Sync Module)
  // =========================================================================
  | 'ACCOUNT_REFRESH_TOKEN' // Flow Làm mới phiên token QLDTTX
  | 'PROFILE_SYNC_DATA'     // Flow Kéo và đồng bộ hồ sơ thông tin sinh viên

  // =========================================================================
  // LEGACY ALIASES (Tương thích ngược với các mã cũ)
  // =========================================================================
  | 'REGISTER'
  | 'CANCEL'
  | 'SYNC_ALL_COURSES';

// 3. Interface cấu trúc định nghĩa chi tiết của từng Flow Action
export interface FlowActionDefinition {
  key: FlowActionType;
  canonicalKey: FlowActionType; // Chuẩn hóa về key chính
  category: FlowCategory;
  categoryName: string;
  categoryBadgeColor: string;
  name: string;             // Tên đầy đủ
  shortName: string;        // Tên ngắn gọn
  description: string;      // Mô tả chi tiết hành động
  icon: string;             // Tên icon gợi ý
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  isSupported: boolean;     // Đã triển khai hay đang phát triển
}
