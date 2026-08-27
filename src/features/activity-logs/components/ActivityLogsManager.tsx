import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Filter,
  User,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRightLeft,
  Crown,
  Key,
  Globe,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Calendar,
  Sparkles,
  Check,
  Info,
  CheckCircle2,
  Trash2,
  Bell,
  Radio,
  Send,
  BookOpen,
  GraduationCap,
  DollarSign,
  Users,
  Layers,
  RotateCcw,
  Play,
  Pause,
  UserCheck,
  UserX,
  Archive,
  Download,
  Zap,
  Copy,
  CheckCheck,
  Code2,
  Laptop,
  Server,
  Eye,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { ACTION_CATEGORIES, ActionCategoryKey } from '../types/activityLogActions';

const FIELD_LABELS: Record<string, string> = {
  maSV: 'Mã Sinh Viên',
  username: 'Tên Đăng Nhập',
  targetUsername: 'Tài Khoản Mục Tiêu',
  fullName: 'Họ và Tên',
  userFullName: 'Họ và Tên',
  targetFullName: 'Họ Tên Mục Tiêu',
  studentName: 'Họ Tên Sinh Viên',
  hoTen: 'Họ và Tên',
  maLop: 'Lớp Sinh Hoạt',
  lop: 'Lớp Sinh Hoạt',
  cleanLop: 'Mã Lớp',
  targetClass: 'Lớp Mục Tiêu',
  currentClass: 'Lớp Hiện Tại',
  oldClass: 'Lớp Cũ',
  soDienThoai: 'Số Điện Thoại',
  phone: 'Số Điện Thoại',
  studentPhone: 'Số Điện Thoại Sinh Viên',
  gioiTinh: 'Giới Tính',
  ngaySinh: 'Ngày Sinh',
  ghiChu: 'Ghi Chú',
  note: 'Ghi Chú',
  statusNote: 'Ghi Chú Trạng Thái',
  transferNote: 'Ghi Chú Tiếp Nhận',
  reason: 'Lý Do Thao Tác',
  trangThai: 'Trạng Thái Học Tập',
  targetTrangThai: 'Trạng Thái Mục Tiêu',
  previousStatus: 'Trạng Thái Trước Đó',
  actionType: 'Loại Thao Tác',
  mode: 'Chế Độ Thực Hiện',
  role: 'Vai Trò',
  userRole: 'Vai Trò Người Dùng',
  targetRole: 'Vai Trò Mục Tiêu',
  roles: 'Danh Sách Vai Trò',
  isFirstLogin: 'Đăng Nhập Lần Đầu',
  previousLastLogin: 'Lần Đăng Nhập Trước',
  lastLogin: 'Lần Đăng Nhập Cuối',
  batchCode: 'Mã Đợt Thi',
  cleanBatchCode: 'Mã Đợt Thi',
  batchName: 'Tên Đợt Thi',
  fileName: 'Tên Tệp',
  filename: 'Tên Tệp',
  totalRecords: 'Tổng Số Bản Ghi',
  totalStudents: 'Tổng Số Sinh Viên',
  deletedCount: 'Số Bản Ghi Đã Xóa',
  successCount: 'Số Lượng Thành Công',
  failCount: 'Số Lượng Thất Bại',
  recoveredCount: 'Số Lượng Phục Hồi',
  size: 'Dung Lượng (Bytes)',
  fileSize: 'Dung Lượng (Bytes)',
  gpa10: 'Điểm GPA Hệ 10',
  gpa4: 'Điểm GPA Hệ 4',
  totalSubjects: 'Tổng Số Môn Học',
  totalCourses: 'Tổng Số Môn Học',
  totalCredits: 'Tổng Số Tín Chỉ',
  totalExams: 'Tổng Số Môn Thi',
  totalEvents: 'Tổng Số Tiết Học',
  tuitionFee: 'Học Phí (VNĐ)',
  semestersCount: 'Số Lượng Học Kỳ',
  chatId: 'ID Nhóm Telegram',
  threadId: 'Topic ID Telegram',
  isEnabled: 'Trạng Thái Bật/Tắt',
  status: 'Trạng Thái Kết Nối',
  hasToken: 'Đã Cấp Token',
  systemKey: 'Mã Cổng Ngoài',
  finalSystemName: 'Tên Cổng Trường',
  announcementId: 'ID Thông Báo',
  title: 'Tiêu Đề',
  displayMode: 'Chế Độ Hiển Thị',
  isActive: 'Kích Hoạt',
  adminUsername: 'Admin Thực Hiện',
  executedBy: 'Người Thực Hiện',
  updatedBy: 'Người Cập Nhật',
  deletedBy: 'Người Xóa',
  error: 'Thông Tin Lỗi',
  isQueryOther: 'Tra Cứu Sinh Viên Khác',
  forcedRefresh: 'Yêu Cầu Làm Mới Nhanh',
  source: 'Nguồn Cổng Dữ Liệu',
  pricePerStudent: 'Định Mức Giá / SV',
  waterFeePerRoom: 'Tiền Nước / Phòng',
  envelopeFeePerRoom: 'Tiền Phong Bì / Phòng',
  roomCode: 'Mã Phòng Thi',
  classCode: 'Mã Lớp Học',
};

const parseUserAgent = (ua?: string | null) => {
  if (!ua) return 'Không xác định';
  if (ua.includes('Postman')) return 'Postman API Client';
  if (ua.includes('node-fetch') || ua.includes('axios')) return 'Internal Server Worker';
  let browser = 'Trình duyệt web';
  if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edge/')) browser = 'Edge';

  let os = '';
  if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  return os ? `${browser} (${os})` : browser;
};

interface ActivityLogItem {
  id: number;
  userId?: number | null;
  username?: string | null;
  userRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  description: string;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface ActivityLogsManagerProps {
  currentUser: LoginUser;
}

const ACTION_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any; category: string }
> = {
  // 1. Xác thực & Tài khoản
  LOGIN: { label: 'Đăng Nhập', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, category: 'AUTH' },
  LOGIN_SUCCESS: { label: 'Đăng Nhập Thành Công', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, category: 'AUTH' },
  LOGIN_FIRST_TIME: { label: 'Đăng Nhập Lần Đầu', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: Sparkles, category: 'AUTH' },
  LOGIN_FAILED: { label: 'Đăng Nhập Thất Bại', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle, category: 'AUTH' },
  LOGOUT: { label: 'Đăng Xuất', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: User, category: 'AUTH' },
  CHANGE_PASSWORD: { label: 'Đổi Mật Khẩu', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Key, category: 'AUTH' },
  ADMIN_RESET_PASSWORD: { label: 'Admin Reset MK', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', icon: Key, category: 'AUTH' },
  IMPERSONATE: { label: 'Giả Lập Tài Khoản', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', icon: Crown, category: 'AUTH' },
  REVERT_IMPERSONATE: { label: 'Thoát Giả Lập', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: ArrowRightLeft, category: 'AUTH' },
  SWITCH_ROLE: { label: 'Chuyển Vai Trò', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Shield, category: 'AUTH' },
  REGISTER_REQUEST: { label: 'Gửi Đăng Ký TK', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: User, category: 'AUTH' },
  APPROVE_REGISTRATION: { label: 'Duyệt Đăng Ký', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: UserCheck, category: 'AUTH' },
  REJECT_REGISTRATION: { label: 'Từ Chối Đăng Ký', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: UserX, category: 'AUTH' },
  UPDATE_MY_PROFILE: { label: 'Cập Nhật Hồ Sơ', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: User, category: 'AUTH' },

  // 2. Sinh viên, Lớp học & Lớp trưởng
  UPDATE_STUDENT_INFO: { label: 'Cập Nhật Sinh Viên', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: User, category: 'STUDENT' },
  RECEIVE_STUDENT: { label: 'Tiếp Nhận Sinh Viên', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: UserCheck, category: 'STUDENT' },
  EXCLUDE_STUDENT: { label: 'Điều Chuyển / Bảo Lưu', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: ArrowRightLeft, category: 'STUDENT' },
  RESTORE_STUDENT: { label: 'Khôi Phục Sinh Viên', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, category: 'STUDENT' },
  DELETE_STUDENT: { label: 'Xóa Sinh Viên', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'STUDENT' },
  ASSIGN_MONITOR: { label: 'Phân Quyền Lớp Trưởng', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Shield, category: 'STUDENT' },
  REMOVE_MONITOR: { label: 'Hủy Quyền Lớp Trưởng', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: ShieldAlert, category: 'STUDENT' },

  // 3. Đợt thi, Lịch thi, Tiền phòng & Phong bì
  CREATE_BATCH: { label: 'Tạo Đợt Thi', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Calendar, category: 'EXAM' },
  UPDATE_BATCH: { label: 'Cập Nhật Đợt Thi', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Calendar, category: 'EXAM' },
  DELETE_BATCH: { label: 'Xóa Đợt Thi', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'EXAM' },
  SET_ACTIVE_BATCH: { label: 'Chọn Đợt Thi Mặc Định', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, category: 'EXAM' },
  TOGGLE_BATCH_STATUS: { label: 'Bật/Tắt Đợt Thi', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Calendar, category: 'EXAM' },
  IMPORT_BATCH_FILE: { label: 'Import Lịch Thi Đợt', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: FileSpreadsheet, category: 'EXAM' },
  IMPORT_EXAM_SCHEDULE: { label: 'Import Lịch Thi Tổng', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: FileSpreadsheet, category: 'EXAM' },
  TOGGLE_EXAM_POSTPONE: { label: 'Bật/Tắt Hoãn Thi', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, category: 'EXAM' },
  MARK_EXAM_POSTPONED: { label: 'Đánh Dấu Hoãn Thi', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, category: 'EXAM' },
  UNMARK_EXAM_POSTPONED: { label: 'Hủy Đánh Dấu Hoãn Thi', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: CheckCircle2, category: 'EXAM' },
  UPDATE_EXAM_ROOM_PRICE: { label: 'Định Mức Tiền Phòng', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: DollarSign, category: 'EXAM' },
  UPDATE_GLOBAL_PRICING_CONFIG: { label: 'Định Mức Giá Chung', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: DollarSign, category: 'EXAM' },
  DELETE_EXAM_ROOM: { label: 'Xóa Giá Phòng Tùy Chỉnh', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'EXAM' },
  CLEAR_ALL_EXAM_ROOMS: { label: 'Xóa Toàn Bộ Giá Phòng', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'EXAM' },
  CLAIM_ENVELOPE: { label: 'Xác Nhận Nước / Phong Bì', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: DollarSign, category: 'EXAM' },
  CANCEL_ENVELOPE_CLAIM: { label: 'Hủy Nhận Phong Bì', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: ArrowRightLeft, category: 'EXAM' },
  CLEAR_ALL_ENVELOPE_CLAIMS: { label: 'Xóa Toàn Bộ Phong Bì', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'EXAM' },

  // 4. Cổng trường & Dữ liệu Sinh viên
  SAVE_EXTERNAL_ACCOUNT: { label: 'Lưu Liên Kết QLĐT', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: Globe, category: 'PORTAL' },
  SAVE_EXTERNAL_ACCOUNT_FAILED: { label: 'Lỗi Lưu Liên Kết QLĐT', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle, category: 'PORTAL' },
  TEST_EXTERNAL_ACCOUNT: { label: 'Kiểm Tra Token QLĐT', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Globe, category: 'PORTAL' },
  TEST_EXTERNAL_ACCOUNT_CREDENTIALS: { label: 'Kiểm Tra MK Cổng Trường', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Key, category: 'PORTAL' },
  TEST_EXTERNAL_ACCOUNT_FAILED: { label: 'Lỗi Token QLĐT', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: AlertTriangle, category: 'PORTAL' },
  BATCH_GET_TOKENS: { label: 'Lấy Token Hàng Loạt', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Globe, category: 'PORTAL' },
  DELETE_EXTERNAL_ACCOUNT: { label: 'Hủy Liên Kết QLĐT', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Trash2, category: 'PORTAL' },
  SYNC_COURSE_REGISTRATION: { label: 'Đồng Bộ ĐKMH Cá Nhân', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: BookOpen, category: 'PORTAL' },
  SYNC_CLASS_REGISTRATION: { label: 'Đồng Bộ ĐKMH Cả Lớp', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Users, category: 'PORTAL' },
  DELETE_COURSE_REGISTRATION: { label: 'Xóa Cache ĐKMH', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'PORTAL' },
  PULL_STUDENT_GRADES: { label: 'Làm Mới Điểm Số', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: GraduationCap, category: 'PORTAL' },
  PULL_STUDENT_TIMETABLE: { label: 'Làm Mới Thời Khóa Biểu', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Calendar, category: 'PORTAL' },
  PULL_STUDENT_EXAM_SCHEDULE: { label: 'Làm Mới Lịch Thi Cá Nhân', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: FileSpreadsheet, category: 'PORTAL' },
  QLDT_EXAM_SCHEDULE_CHANGED: { label: 'Lịch Thi QLĐT Thay Đổi', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Bell, category: 'PORTAL' },
  COURSE_REGISTER: { label: 'Đăng Ký Môn Online', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, category: 'PORTAL' },
  COURSE_CANCEL: { label: 'Hủy Môn Online', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'PORTAL' },
  LMS_REFRESH_COURSES: { label: 'Làm Mới Khóa Học LMS', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: BookOpen, category: 'PORTAL' },
  SLINK_FORGOT_PASSWORD: { label: 'S-Link Quên Mật Khẩu', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Key, category: 'PORTAL' },
  SLINK_REFRESH_GRADES: { label: 'Làm Mới Điểm S-Link', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: GraduationCap, category: 'PORTAL' },
  SLINK_SYNC_GRADES: { label: 'Đồng Bộ Điểm S-Link', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: RefreshCw, category: 'PORTAL' },
  SLINK_REFRESH_NOTIFICATIONS: { label: 'Làm Mới Thông Báo S-Link', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Bell, category: 'PORTAL' },
  SLINK_MARK_NOTIFICATION_READ: { label: 'Đã Đọc Thông Báo S-Link', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Check, category: 'PORTAL' },

  // 5. Flow Automation Lớp trưởng
  UPDATE_MONITOR_FLOW_CONFIG: { label: 'Lưu Cấu Hình Flow', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Layers, category: 'FLOW' },
  IMPORT_MONITOR_FLOW_CONFIG: { label: 'Import DS SV Flow', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: FileSpreadsheet, category: 'FLOW' },
  ENQUEUE_MONITOR_FLOW_BATCH: { label: 'Tạo Hàng Đợi Flow', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Play, category: 'FLOW' },
  EXECUTE_MONITOR_FLOW_ACTION: { label: 'Thực Thi Lệnh Flow', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Zap, category: 'FLOW' },
  PULL_CLASS_COURSE_REGISTRATION: { label: 'Kéo ĐKMH Cả Lớp (Flow)', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Users, category: 'FLOW' },
  CANCEL_FLOW_QUEUE: { label: 'Hủy Hàng Đợi Flow', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Pause, category: 'FLOW' },
  RETRY_FLOW_QUEUE: { label: 'Thử Lại Queue Flow', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: RotateCcw, category: 'FLOW' },
  CLEAR_COMPLETED_FLOW_QUEUE: { label: 'Dọn Dẹp Queue Flow', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Trash2, category: 'FLOW' },

  // 6. Global Sync & Cron Scheduler
  ENQUEUE_GLOBAL_SYNC_JOB: { label: 'Batch Đồng Bộ Hệ Thống', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Layers, category: 'SYNC' },
  CANCEL_GLOBAL_QUEUE: { label: 'Hủy Queue Đồng Bộ', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Pause, category: 'SYNC' },
  RETRY_GLOBAL_QUEUE: { label: 'Thử Lại Queue Đồng Bộ', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: RotateCcw, category: 'SYNC' },
  UPDATE_GLOBAL_SYNC_CONFIG: { label: 'Cấu Hình Lịch Quét Đêm', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Clock, category: 'SYNC' },
  CLEAR_COMPLETED_GLOBAL_QUEUE: { label: 'Dọn Dẹp Queue Global', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Trash2, category: 'SYNC' },
  RECOVER_STUCK_QUEUE_JOBS: { label: 'Phục Hồi Tác Vụ Bị Kẹt', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: RotateCcw, category: 'SYNC' },
  CRON_GLOBAL_SYNC_TRIGGER: { label: 'Cron Đồng Bộ Ban Đêm', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Clock, category: 'SYNC' },
  CRON_CLASS_REMINDERS: { label: 'Cron Nhắc Lịch Học', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Bell, category: 'SYNC' },
  CRON_NEAREST_CLASS_SCHEDULE: { label: 'Cron Quét Tiết Học Gần Nhất', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: Clock, category: 'SYNC' },
  CRON_EXAM_REMINDERS: { label: 'Cron Nhắc Lịch Thi', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Bell, category: 'SYNC' },

  // 7. Telegram & Thông báo
  SAVE_SYSTEM_TELEGRAM_BOT: { label: 'Lưu Bot Hệ Thống', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Send, category: 'TELEGRAM' },
  TOGGLE_SYSTEM_TELEGRAM_BOT: { label: 'Bật/Tắt Bot Hệ Thống', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Send, category: 'TELEGRAM' },
  SAVE_TELEGRAM_ADMIN_CONFIG: { label: 'Lưu Nhóm Báo Cáo Admin', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Send, category: 'TELEGRAM' },
  CLEAR_TELEGRAM_QUEUE: { label: 'Xóa Queue Telegram', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'TELEGRAM' },
  BROADCAST_TELEGRAM: { label: 'Phát Sóng Telegram', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Radio, category: 'TELEGRAM' },
  CREATE_TELEGRAM_TOPIC: { label: 'Tạo Topic Telegram', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: Send, category: 'TELEGRAM' },
  CHECK_NEAREST_CLASS_SCHEDULE: { label: 'Kiểm Tra Tiết Học Gần Nhất', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Clock, category: 'TELEGRAM' },
  SAVE_TELEGRAM_CONFIG: { label: 'Lưu Cấu Hình Telegram', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Send, category: 'TELEGRAM' },
  TEST_TELEGRAM_CONFIG: { label: 'Test Gửi Telegram', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Send, category: 'TELEGRAM' },
  TOGGLE_TELEGRAM_CONFIG: { label: 'Bật/Tắt Telegram', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Send, category: 'TELEGRAM' },
  DELETE_TELEGRAM_CONFIG: { label: 'Xóa Cấu Hình Telegram', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'TELEGRAM' },
  CREATE_ANNOUNCEMENT: { label: 'Tạo Thông Báo Web', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Bell, category: 'TELEGRAM' },
  UPDATE_ANNOUNCEMENT: { label: 'Cập Nhật Thông Báo Web', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Bell, category: 'TELEGRAM' },
  TOGGLE_ANNOUNCEMENT_STATUS: { label: 'Bật/Tắt Thông Báo Web', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Bell, category: 'TELEGRAM' },
  DELETE_ANNOUNCEMENT: { label: 'Xóa Thông Báo Web', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'TELEGRAM' },
  BULK_DELETE_ANNOUNCEMENTS: { label: 'Xóa Loạt Thông Báo Web', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'TELEGRAM' },

  // 8. Sao lưu & Quản trị Hệ thống
  DOWNLOAD_BACKUP: { label: 'Tải Bản Sao Lưu', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Download, category: 'SYSTEM' },
  EXPORT_SQL_DATABASE: { label: 'Xuất SQL Database', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', icon: Database, category: 'SYSTEM' },
  RESTORE_DATABASE: { label: 'Phục Hồi CSDL', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: RotateCcw, category: 'SYSTEM' },
  SAVE_BACKUP_TELEGRAM_CONFIG: { label: 'Lưu Cấu Hình Auto Backup', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Database, category: 'SYSTEM' },
  TEST_BACKUP_TELEGRAM: { label: 'Test Gửi Backup Telegram', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: Send, category: 'SYSTEM' },
  SEND_BACKUP_TELEGRAM: { label: 'Gửi Backup Sang Telegram', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: Send, category: 'SYSTEM' },
  CREATE_SERVER_BACKUP: { label: 'Tạo Bản Sao Lưu Máy Chủ', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: Archive, category: 'SYSTEM' },
  DELETE_SERVER_BACKUP: { label: 'Xóa Bản Sao Lưu Máy Chủ', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'SYSTEM' },
  DELETE_LOGS: { label: 'Dọn Dẹp / Xóa Nhật Ký', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Trash2, category: 'SYSTEM' },
};

export default function ActivityLogsManager({ currentUser }: ActivityLogsManagerProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1,
  });
  const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [metadataViewTab, setMetadataViewTab] = useState<'VISUAL' | 'JSON'>('VISUAL');

  const handleCopyJson = (data: any) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const filteredAvailableActions = useMemo(() => {
    if (selectedCategory === 'ALL') return availableActions;
    return availableActions.filter((act) => {
      const config = ACTION_CONFIGS[act];
      return config && config.category === selectedCategory;
    });
  }, [availableActions, selectedCategory]);

  const displayedLogs = useMemo(() => {
    if (selectedCategory === 'ALL' || actionFilter) return logs;
    return logs.filter((l) => {
      const config = ACTION_CONFIGS[l.action];
      return config && config.category === selectedCategory;
    });
  }, [logs, selectedCategory, actionFilter]);

  const isAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.activeRole === 'admin' ||
    (currentUser?.role === 'admin' && !currentUser?.activeRole)
  );

  // Delete / Cleanup logs state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'COUNT' | 'DAYS' | 'ALL'>('COUNT');
  const [deleteCount, setDeleteCount] = useState<number>(100);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [deleteDays, setDeleteDays] = useState<number>(30);
  const [cleanReminderLogs, setCleanReminderLogs] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [confirmAllText, setConfirmAllText] = useState('');

  const handleDeleteLogs = async () => {
    setIsDeleting(true);
    setDeleteSuccessMsg('');
    setDeleteErrorMsg('');

    try {
      let finalCount = deleteCount;
      if (customCountInput && !isNaN(parseInt(customCountInput, 10)) && parseInt(customCountInput, 10) > 0) {
        finalCount = parseInt(customCountInput, 10);
      }

      if (
        deleteMode === 'ALL' &&
        confirmAllText.trim().toUpperCase() !== 'XÓA TẤT CẢ' &&
        confirmAllText.trim().toUpperCase() !== 'XOA TAT CA'
      ) {
        setDeleteErrorMsg('Vui lòng nhập đúng cụm từ "XÓA TẤT CẢ" để xác nhận xoá toàn bộ log.');
        setIsDeleting(false);
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = {
        mode: deleteMode,
        cleanReminderLogs,
      };

      if (deleteMode === 'COUNT') {
        body.count = finalCount;
      } else if (deleteMode === 'DAYS') {
        body.days = deleteDays;
      }

      const res = await fetch('/api/activity-logs', {
        method: 'DELETE',
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteSuccessMsg(data.message || `Đã xoá ${data.totalDeleted} bản ghi log thành công!`);
        fetchLogs(1);
        setTimeout(() => {
          setShowDeleteModal(false);
          setDeleteSuccessMsg('');
          setConfirmAllText('');
        }, 1800);
      } else {
        setDeleteErrorMsg(data.error || 'Lỗi khi xoá nhật ký.');
      }
    } catch (err: any) {
      setDeleteErrorMsg('Lỗi kết nối máy chủ khi thực hiện xoá nhật ký.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchLogs = useCallback(
    async (pageToFetch = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(pageToFetch));
        params.set('limit', String(pagination.limit));
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (actionFilter) params.set('action', actionFilter);

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/activity-logs?${params.toString()}`, { headers });
        const data = await res.json();
        if (res.ok && data.success) {
          setLogs(data.logs || []);
          setPagination(data.pagination);
          if (data.availableActions) {
            setAvailableActions(data.availableActions);
          }
        }
      } catch (err) {
        console.error('Fetch logs error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.limit, searchQuery, actionFilter]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full gap-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <History className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Nhật Ký Hoạt Động Hệ Thống
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-full">
                Audit Logs
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ghi nhận và lưu vết toàn bộ thao tác: đăng nhập, đổi vai trò, giả lập, đồng bộ ĐKMH và chỉnh sửa dữ liệu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Bản Ghi</div>
            <div className="text-lg font-black text-white">{pagination.total.toLocaleString('vi-VN')}</div>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteSuccessMsg('');
                setDeleteErrorMsg('');
                setConfirmAllText('');
              }}
              className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer border border-rose-500/40"
              title="Dọn dẹp và xoá bớt nhật ký hoạt động để giải phóng dung lượng CSDL"
            >
              <Trash2 className="w-4 h-4" />
              <span>Dọn Dẹp / Xoá Log</span>
            </button>
          )}

          <button
            onClick={() => fetchLogs(pagination.page)}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
            title="Làm mới danh sách nhật ký"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {Object.entries(ACTION_CATEGORIES).map(([key, cat]) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setActionFilter('');
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mô tả, người dùng, mã SV, hành động..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none"
            >
              <option value="">
                {selectedCategory === 'ALL'
                  ? `Tất cả hành động (${filteredAvailableActions.length})`
                  : `Tất cả trong nhóm (${filteredAvailableActions.length})`}
              </option>
              {filteredAvailableActions.map((act) => {
                const config = ACTION_CONFIGS[act] || { label: act };
                return (
                  <option key={act} value={act}>
                    {config.label} ({act})
                  </option>
                );
              })}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Pagination Summary */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold w-full md:w-auto justify-between md:justify-end">
          <span>
            Trang {pagination.page} / {pagination.totalPages || 1}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Đang tải nhật ký hoạt động...</p>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 gap-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Chưa có nhật ký hoạt động phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Không tìm thấy bản ghi hoạt động nào theo tiêu chí tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Người Thực Hiện</th>
                  <th className="py-3.5 px-4">Đối Tượng</th>
                  <th className="py-3.5 px-4 min-w-[300px]">Mô Tả Chi Tiết</th>
                  <th className="py-3.5 px-4 text-center">IP / Thiết Bị</th>
                  <th className="py-3.5 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {displayedLogs.map((log) => {
                  const actConfig = ACTION_CONFIGS[log.action] || {
                    label: log.action,
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                    icon: Info,
                  };
                  const ActIcon = actConfig.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${actConfig.bg} ${actConfig.text} ${actConfig.border}`}
                        >
                          <ActIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{actConfig.label}</span>
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.username || 'sys'}`}
                              alt={log.username || 'System'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 font-mono text-xs">
                              {log.username || 'Hệ Thống'}
                            </span>
                            {log.userRole && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {log.userRole.includes('admin')
                                  ? '👑 Admin'
                                  : log.userRole.includes('lop_truong')
                                  ? '🛡️ Lớp Trưởng'
                                  : '🎓 Sinh Viên'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.targetId ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg font-mono font-bold text-[11px]">
                            {log.targetId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-800 text-xs leading-relaxed">
                        {log.description}
                      </td>

                      {/* IP / User Agent */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                          title={log.userAgent || 'Không rõ trình duyệt'}
                        >
                          {log.ipAddress || 'Internal'}
                        </span>
                      </td>

                      {/* Metadata Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLogMetadata(log);
                            setMetadataViewTab('VISUAL');
                            setCopiedJson(false);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs border border-indigo-200/60"
                          title="Xem chi tiết toàn bộ dữ liệu hoạt động"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi Tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination */}
        {logs.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
            <div>
              Hiển thị {logs.length} / {pagination.total} bản ghi hoạt động
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                Trang Trước
              </button>
              <span>
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                Trang Kế
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLogMetadata && (() => {
        const modalConfig = ACTION_CONFIGS[selectedLogMetadata.action] || {
          label: selectedLogMetadata.action,
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          icon: Info,
          category: 'SYSTEM',
        };
        const ModalActIcon = modalConfig.icon;
        const metaObj = selectedLogMetadata.metadata;
        const hasMetadata = metaObj && typeof metaObj === 'object' && Object.keys(metaObj).length > 0;

        return (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedLogMetadata(null);
            }}
          >
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl border ${modalConfig.bg} ${modalConfig.text} ${modalConfig.border} shrink-0`}>
                    <ModalActIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base tracking-tight text-white">{modalConfig.label}</h4>
                      <span className="px-2 py-0.5 bg-white/10 text-indigo-200 text-[10px] font-mono font-bold rounded-lg border border-white/15">
                        {selectedLogMetadata.action}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bản ghi ID: <span className="font-mono text-indigo-300 font-bold">#{selectedLogMetadata.id}</span> • Phân loại:{' '}
                      <span className="font-bold text-slate-300">
                        {ACTION_CATEGORIES[modalConfig.category as ActionCategoryKey]?.label || modalConfig.category}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogMetadata(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                {/* Description Banner */}
                <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 p-4 rounded-2xl border border-indigo-100/80 flex flex-col gap-1.5 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                    Mô tả hoạt động
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {selectedLogMetadata.description}
                  </p>
                </div>

                {/* Core Meta 4-Grid Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* User */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLogMetadata.username || 'sys'}`}
                        alt={selectedLogMetadata.username || 'System'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Người thực hiện</span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate block">
                        {selectedLogMetadata.username || 'Hệ Thống'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedLogMetadata.userRole?.includes('admin')
                          ? '👑 Quản Trị Viên'
                          : selectedLogMetadata.userRole?.includes('lop_truong')
                          ? '🛡️ Cán Bộ Lớp'
                          : '🎓 Sinh Viên'}
                      </span>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đối tượng tác động</span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate block">
                        {selectedLogMetadata.targetId || 'Không có ID'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Loại: <span className="font-semibold text-slate-700">{selectedLogMetadata.targetType || 'N/A'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thời gian ghi nhận</span>
                      <span className="font-bold text-slate-800 text-xs block">
                        {formatDateTime(selectedLogMetadata.createdAt)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate block">
                        {new Date(selectedLogMetadata.createdAt).toISOString()}
                      </span>
                    </div>
                  </div>

                  {/* Network / IP */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-cyan-600 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Địa chỉ IP & Thiết bị</span>
                      <span className="font-mono font-bold text-slate-800 text-xs block">
                        {selectedLogMetadata.ipAddress || 'Internal Worker'}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block font-medium" title={selectedLogMetadata.userAgent || ''}>
                        {parseUserAgent(selectedLogMetadata.userAgent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata Section with Tabs */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span>Dữ Liệu Chi Tiết (Metadata)</span>
                      </label>
                      {hasMetadata && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md">
                          {Object.keys(metaObj).length} thông số
                        </span>
                      )}
                    </div>

                    {hasMetadata && (
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setMetadataViewTab('VISUAL')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                            metadataViewTab === 'VISUAL'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Trực Quan
                        </button>
                        <button
                          onClick={() => setMetadataViewTab('JSON')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            metadataViewTab === 'JSON'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Code2 className="w-3 h-3" />
                          <span>Mã JSON</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {!hasMetadata ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Info className="w-6 h-6 text-slate-300" />
                      <p className="text-xs font-medium">Hoạt động này không có payload dữ liệu metadata mở rộng.</p>
                    </div>
                  ) : metadataViewTab === 'VISUAL' ? (
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
                        <div className="divide-y divide-slate-200/70">
                          {Object.entries(metaObj)
                            .filter((_, idx) => idx % 2 === 0)
                            .map(([key, val]) => (
                              <div key={key} className="p-3 flex flex-col gap-0.5 hover:bg-slate-100/60 transition-colors">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {FIELD_LABELS[key] || key}
                                </span>
                                <div className="font-medium text-slate-800 text-xs break-all">
                                  {typeof val === 'boolean' ? (
                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {val ? '✓ Đúng / Kích hoạt' : '✕ Sai / Vô hiệu'}
                                    </span>
                                  ) : typeof val === 'number' ? (
                                    <span className="font-mono font-bold text-indigo-600">
                                      {val.toLocaleString('vi-VN')}
                                    </span>
                                  ) : typeof val === 'object' && val !== null ? (
                                    <pre className="text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 overflow-x-auto max-h-24">
                                      {JSON.stringify(val, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="font-mono text-slate-800">{String(val ?? '-')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="divide-y divide-slate-200/70">
                          {Object.entries(metaObj)
                            .filter((_, idx) => idx % 2 === 1)
                            .map(([key, val]) => (
                              <div key={key} className="p-3 flex flex-col gap-0.5 hover:bg-slate-100/60 transition-colors">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {FIELD_LABELS[key] || key}
                                </span>
                                <div className="font-medium text-slate-800 text-xs break-all">
                                  {typeof val === 'boolean' ? (
                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {val ? '✓ Đúng / Kích hoạt' : '✕ Sai / Vô hiệu'}
                                    </span>
                                  ) : typeof val === 'number' ? (
                                    <span className="font-mono font-bold text-indigo-600">
                                      {val.toLocaleString('vi-VN')}
                                    </span>
                                  ) : typeof val === 'object' && val !== null ? (
                                    <pre className="text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 overflow-x-auto max-h-24">
                                      {JSON.stringify(val, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="font-mono text-slate-800">{String(val ?? '-')}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed border border-slate-800 shadow-inner">
                        {JSON.stringify(metaObj, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleCopyJson(metaObj)}
                        className="absolute top-3 right-3 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer border border-white/20"
                      >
                        {copiedJson ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Đã Sao Chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Sao Chép JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Full User-Agent inspection if available */}
                {selectedLogMetadata.userAgent && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      User-Agent Đầy Đủ
                    </label>
                    <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-3 rounded-2xl border border-slate-200 break-all leading-relaxed">
                      {selectedLogMetadata.userAgent}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-medium">
                  Hoạt động #{selectedLogMetadata.id} • {modalConfig.label}
                </div>
                <button
                  onClick={() => setSelectedLogMetadata(null)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: DỌN DẸP & XOÁ NHẬT KÝ HOẠT ĐỘNG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/30 text-rose-300 rounded-xl border border-rose-400/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Dọn Dẹp & Xoá Nhật Ký Hoạt Động</h4>
                  <p className="text-[11px] text-rose-200/80">
                    Giải phóng dung lượng cơ sở dữ liệu và tối ưu hiệu năng
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
              {/* Alert Feedback */}
              {deleteSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{deleteSuccessMsg}</span>
                </div>
              )}

              {deleteErrorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-900 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{deleteErrorMsg}</span>
                </div>
              )}

              {/* Mode Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chọn Phương Thức Dọn Dẹp:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'COUNT', label: 'Xoá N Bản Ghi', desc: 'Cũ nhất' },
                    { id: 'DAYS', label: 'Theo Ngày', desc: 'Cũ hơn X ngày' },
                    { id: 'ALL', label: 'Xoá Tất Cả', desc: 'Làm sạch toàn bộ' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setDeleteMode(tab.id as any);
                        setDeleteErrorMsg('');
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                        deleteMode === tab.id
                          ? tab.id === 'ALL'
                            ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                            : 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">{tab.label}</span>
                      <span className="text-[10px] opacity-75">{tab.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MODE 1: DELETE N OLDEST LOGS */}
              {deleteMode === 'COUNT' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Số lượng bản ghi cũ cần xoá:</span>
                    <span className="text-[11px] text-slate-500">
                      Hiện có: <b>{pagination.total}</b> bản ghi
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[50, 100, 200, 500, 1000, 5000].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setDeleteCount(num);
                          setCustomCountInput('');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          deleteCount === num && !customCountInput
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num.toLocaleString('vi-VN')}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Hoặc nhập số lượng tùy chọn N:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={pagination.total || 999999}
                      value={customCountInput}
                      onChange={(e) => {
                        setCustomCountInput(e.target.value);
                        if (e.target.value) {
                          setDeleteCount(parseInt(e.target.value, 10) || 0);
                        }
                      }}
                      placeholder={`Nhập số bản ghi cần xoá (ví dụ: ${deleteCount})...`}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    💡 Hệ thống sẽ tự động quét và xoá đi <strong>{customCountInput ? parseInt(customCountInput, 10) || 0 : deleteCount}</strong> bản ghi được tạo sớm nhất, giữ lại toàn bộ bản ghi mới nhất.
                  </p>
                </div>
              )}

              {/* MODE 2: DELETE LOGS OLDER THAN X DAYS */}
              {deleteMode === 'DAYS' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-800">
                    Xoá các bản ghi được ghi nhận trước:
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { days: 7, label: '7 ngày trước (1 tuần)' },
                      { days: 14, label: '14 ngày trước (2 tuần)' },
                      { days: 30, label: '30 ngày trước (1 tháng)' },
                      { days: 60, label: '60 ngày trước (2 tháng)' },
                      { days: 90, label: '90 ngày trước (3 tháng)' },
                    ].map((item) => (
                      <button
                        key={item.days}
                        type="button"
                        onClick={() => setDeleteDays(item.days)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          deleteDays === item.days
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    💡 Toàn bộ các nhật ký hoạt động có thời điểm tạo trước <strong>{deleteDays} ngày</strong> sẽ được dọn dẹp khỏi cơ sở dữ liệu.
                  </p>
                </div>
              )}

              {/* MODE 3: DELETE ALL LOGS */}
              {deleteMode === 'ALL' && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-300 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>CẢNH BÁO NGUY HIỂM: XOÁ TOÀN BỘ NHẬT KÝ</span>
                  </div>

                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    Hành động này sẽ xoá <strong>toàn bộ {pagination.total.toLocaleString('vi-VN')} bản ghi</strong> nhật ký hoạt động trong hệ thống và không thể khôi phục.
                  </p>

                  <div className="pt-2 border-t border-rose-200">
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      Nhập chữ <code className="font-mono text-rose-900 bg-rose-200 px-1 py-0.5 rounded">XÓA TẤT CẢ</code> để xác nhận:
                    </label>
                    <input
                      type="text"
                      value={confirmAllText}
                      onChange={(e) => setConfirmAllText(e.target.value)}
                      placeholder="Gõ XÓA TẤT CẢ..."
                      className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2 text-xs font-bold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* OPTIONAL: CLEAN TELEGRAM REMINDER LOGS */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanReminderLogs}
                  onChange={(e) => setCleanReminderLogs(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded mt-0.5 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900">
                    Dọn dẹp cả nhật ký thông báo Telegram (Khuyên dùng)
                  </span>
                  <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                    Bao gồm các bản ghi theo dõi nhắc lịch thi, nhắc lịch học và thông báo QLDTTX để giải phóng tối đa dung lượng DB.
                  </p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleDeleteLogs}
                disabled={
                  isDeleting ||
                  (deleteMode === 'ALL' &&
                    confirmAllText.trim().toUpperCase() !== 'XÓA TẤT CẢ' &&
                    confirmAllText.trim().toUpperCase() !== 'XOA TAT CA')
                }
                className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  deleteMode === 'ALL'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20'
                }`}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang dọn dẹp...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {deleteMode === 'ALL'
                        ? 'Xác Nhận Xoá Tất Cả Log'
                        : deleteMode === 'COUNT'
                        ? `Xác Nhận Xoá ${customCountInput ? parseInt(customCountInput, 10) || 0 : deleteCount} Log Cũ`
                        : `Xác Nhận Xoá Log Cũ Hơn ${deleteDays} Ngày`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
