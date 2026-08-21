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

// 4. Registry lưu trữ thông tin của tất cả các Flow Action
export const FLOW_ACTIONS_REGISTRY: Record<string, FlowActionDefinition> = {
  // --- Module Đăng ký môn học ---
  COURSE_REGISTER: {
    key: 'COURSE_REGISTER',
    canonicalKey: 'COURSE_REGISTER',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Đăng Ký Môn Học',
    shortName: 'Đăng Ký Môn',
    description: 'Tự động gửi lệnh đăng ký tổ học phần tương ứng cho các thành viên trong lớp',
    icon: 'Zap',
    badgeStyle: {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
    },
    isSupported: true,
  },
  COURSE_CANCEL: {
    key: 'COURSE_CANCEL',
    canonicalKey: 'COURSE_CANCEL',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Hủy Môn Học',
    shortName: 'Hủy Môn',
    description: 'Tự động hủy môn học đã đăng ký cho các thành viên trong lớp và giải phóng slot',
    icon: 'Trash2',
    badgeStyle: {
      bg: 'bg-rose-100',
      text: 'text-rose-900',
      border: 'border-rose-300',
    },
    isSupported: true,
  },
  COURSE_SYNC_ALL: {
    key: 'COURSE_SYNC_ALL',
    canonicalKey: 'COURSE_SYNC_ALL',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Đồng Bộ 2 Chiều Toàn Bộ Môn Học',
    shortName: 'Đồng Bộ Khớp 100%',
    description: 'Tự động đăng ký các môn còn thiếu và hủy các môn thừa để danh sách môn của cả lớp khớp 100% với Lớp trưởng',
    icon: 'BookOpen',
    badgeStyle: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
    },
    isSupported: true,
  },
  COURSE_SNIPE_AUTO: {
    key: 'COURSE_SNIPE_AUTO',
    canonicalKey: 'COURSE_SNIPE_AUTO',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Săn Slot & Tự Động Đăng Ký Khi Mở',
    shortName: 'Săn Slot Môn',
    description: 'Tự động quét và đăng ký ngay khi lớp học phần có slot trống hoặc mở đợt',
    icon: 'Flame',
    badgeStyle: {
      bg: 'bg-orange-100',
      text: 'text-orange-900',
      border: 'border-orange-300',
    },
    isSupported: false,
  },
  COURSE_CHANGE_GROUP: {
    key: 'COURSE_CHANGE_GROUP',
    canonicalKey: 'COURSE_CHANGE_GROUP',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Chuyển Nhóm / Lớp Học Phần',
    shortName: 'Chuyển Nhóm Tổ',
    description: 'Hủy nhóm cũ và đăng ký sang nhóm mới theo Lớp trưởng',
    icon: 'RefreshCw',
    badgeStyle: {
      bg: 'bg-blue-100',
      text: 'text-blue-900',
      border: 'border-blue-300',
    },
    isSupported: true,
  },

  // --- Module Lịch thi & Phòng thi ---
  EXAM_REGISTER_ROOM: {
    key: 'EXAM_REGISTER_ROOM',
    canonicalKey: 'EXAM_REGISTER_ROOM',
    category: 'EXAM_SCHEDULE',
    categoryName: 'Lịch Thi & Phòng Thi',
    categoryBadgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    name: 'Đăng Ký Ca Thi & Phòng Thi',
    shortName: 'Đăng Ký Ca Thi',
    description: 'Đăng ký phòng thi và ca thi cùng phòng/giờ với Lớp trưởng',
    icon: 'Calendar',
    badgeStyle: {
      bg: 'bg-sky-100',
      text: 'text-sky-900',
      border: 'border-sky-300',
    },
    isSupported: false,
  },
  EXAM_SYNC_SCHEDULE: {
    key: 'EXAM_SYNC_SCHEDULE',
    canonicalKey: 'EXAM_SYNC_SCHEDULE',
    category: 'EXAM_SCHEDULE',
    categoryName: 'Lịch Thi & Phòng Thi',
    categoryBadgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    name: 'Đồng Bộ Lịch Thi Cả Lớp',
    shortName: 'Đồng Bộ Lịch Thi',
    description: 'Đồng bộ toàn bộ lịch thi các môn học theo Lớp trưởng',
    icon: 'Clock',
    badgeStyle: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
    },
    isSupported: false,
  },

  // --- Module Khảo sát & Đánh giá giảng viên ---
  SURVEY_EVALUATE_ALL: {
    key: 'SURVEY_EVALUATE_ALL',
    canonicalKey: 'SURVEY_EVALUATE_ALL',
    category: 'TEACHER_SURVEY',
    categoryName: 'Khảo Sát & Đánh Giá',
    categoryBadgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    name: 'Tự Động Đánh Giá Giảng Viên Hàng Loạt',
    shortName: 'Đánh Giá Giảng Viên',
    description: 'Tự động trả lời khảo sát và đánh giá giảng viên cho toàn bộ môn học trong kỳ',
    icon: 'CheckCircle2',
    badgeStyle: {
      bg: 'bg-teal-100',
      text: 'text-teal-900',
      border: 'border-teal-300',
    },
    isSupported: false,
  },

  // --- Module Hồ sơ & Tài khoản ---
  ACCOUNT_REFRESH_TOKEN: {
    key: 'ACCOUNT_REFRESH_TOKEN',
    canonicalKey: 'ACCOUNT_REFRESH_TOKEN',
    category: 'ACCOUNT_PROFILE',
    categoryName: 'Tài Khoản & Hồ Sơ',
    categoryBadgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
    name: 'Làm Mới Phiên Đăng Nhập Cổng Trường',
    shortName: 'Làm Mới Token',
    description: 'Đăng nhập lại và cấp mới token cho toàn bộ tài khoản cổng QLDTTX',
    icon: 'ShieldCheck',
    badgeStyle: {
      bg: 'bg-violet-100',
      text: 'text-violet-900',
      border: 'border-violet-300',
    },
    isSupported: true,
  },
  PROFILE_SYNC_DATA: {
    key: 'PROFILE_SYNC_DATA',
    canonicalKey: 'PROFILE_SYNC_DATA',
    category: 'ACCOUNT_PROFILE',
    categoryName: 'Tài Khoản & Hồ Sơ',
    categoryBadgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
    name: 'Đồng Bộ Hồ Sơ & Điểm Số Sinh Viên',
    shortName: 'Đồng Bộ Hồ Sơ',
    description: 'Kéo thông tin sinh viên, điểm thi và chương trình đào tạo từ cổng trường',
    icon: 'Users',
    badgeStyle: {
      bg: 'bg-purple-100',
      text: 'text-purple-900',
      border: 'border-purple-300',
    },
    isSupported: true,
  },

  // --- Legacy Aliases ---
  REGISTER: {
    key: 'REGISTER',
    canonicalKey: 'COURSE_REGISTER',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Đăng Ký Môn Học',
    shortName: 'Đăng Ký Môn',
    description: 'Tự động gửi lệnh đăng ký tổ học phần tương ứng cho các thành viên trong lớp',
    icon: 'Zap',
    badgeStyle: {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-300',
    },
    isSupported: true,
  },
  CANCEL: {
    key: 'CANCEL',
    canonicalKey: 'COURSE_CANCEL',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Hủy Môn Học',
    shortName: 'Hủy Môn',
    description: 'Tự động hủy môn học đã đăng ký cho các thành viên trong lớp và giải phóng slot',
    icon: 'Trash2',
    badgeStyle: {
      bg: 'bg-rose-100',
      text: 'text-rose-900',
      border: 'border-rose-300',
    },
    isSupported: true,
  },
  SYNC_ALL_COURSES: {
    key: 'SYNC_ALL_COURSES',
    canonicalKey: 'COURSE_SYNC_ALL',
    category: 'COURSE_REGISTRATION',
    categoryName: 'Đăng Ký Môn Học',
    categoryBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    name: 'Đồng Bộ 2 Chiều Toàn Bộ Môn Học',
    shortName: 'Đồng Bộ Khớp 100%',
    description: 'Tự động đăng ký môn thiếu và hủy môn thừa để danh sách môn khớp 100% với Lớp trưởng',
    icon: 'BookOpen',
    badgeStyle: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
    },
    isSupported: true,
  },
};

/**
 * Hàm chuẩn hóa mã Action sang dạng Canonical Key chuẩn (Ví dụ: 'REGISTER' -> 'COURSE_REGISTER')
 */
export function normalizeFlowAction(actionKey?: string | null): FlowActionType {
  if (!actionKey) return 'COURSE_REGISTER';
  const upper = actionKey.trim().toUpperCase();
  const found = FLOW_ACTIONS_REGISTRY[upper];
  return found ? found.canonicalKey : (upper as FlowActionType);
}

/**
 * Hàm lấy thông tin định nghĩa hiển thị chi tiết của 1 Flow Action
 */
export function getFlowActionDefinition(actionKey?: string | null): FlowActionDefinition {
  const normKey = normalizeFlowAction(actionKey);
  return (
    FLOW_ACTIONS_REGISTRY[normKey] || {
      key: normKey,
      canonicalKey: normKey,
      category: 'CUSTOM_ACTION',
      categoryName: 'Hành Động Khác',
      categoryBadgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      name: normKey,
      shortName: normKey,
      description: 'Hành động tùy chỉnh trong hệ thống',
      icon: 'Layers',
      badgeStyle: {
        bg: 'bg-slate-100',
        text: 'text-slate-900',
        border: 'border-slate-300',
      },
      isSupported: true,
    }
  );
}
