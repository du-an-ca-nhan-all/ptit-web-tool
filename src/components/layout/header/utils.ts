import { NavigationTab } from '../../../types/navigation';

export function getHeaderTitle(activeTab: NavigationTab): string {
  switch (activeTab) {
    case 'dashboard':
      return 'Tổng Quan';
    case 'schedule':
      return 'Lịch Thi Tổng';
    case 'personal_schedule':
      return 'Lịch Thi Cá Nhân';
    case 'monitors_list':
      return 'Danh Sách Lớp Trưởng';
    case 'course_registration':
      return 'Đăng Ký Môn Học (QLHT)';
    case 'registered_courses':
      return 'Môn Học Đã Đăng Ký';
    case 'course_compare':
      return 'So Sánh ĐKMH';
    case 'members':
      return 'Danh Sách sinh viên trong Lớp';
    case 'monitor_flow':
      return 'Cấu Hình Flow Lớp Trưởng';
    case 'exam_review':
      return 'Đăng Ký Ôn Tập Đợt Thi';
    case 'room_analysis':
      return 'Lọc Tách Phòng & Sĩ Số Phòng Thi';
    case 'batches':
      return 'Quản Lý Đợt Thi';
    case 'telegram_admin':
      return 'Quản Trị Bot Telegram Toàn Cục';
    case 'database_backup':
      return 'Sao Lưu & Xuất Dữ Liệu DB';
    case 'announcements_admin':
      return 'Quản Lý Thông Báo Hệ Thống';
    case 'activity_logs':
      return 'Nhật Ký Hoạt Động';
    case 'user_registrations':
      return 'Duyệt Đăng Ký Tài Khoản';
    case 'external_accounts_admin':
      return 'Tài Khoản QLĐT Từ Xa';
    case 'global_jobs':
      return 'Job Global / Tác Vụ Tự Động';
    case 'envelope':
    case 'envelope_all':
      return 'Phân Công Nước Uống & Hỗ Trợ';
    case 'settlement':
      return 'Bù Trừ Qũy Nước & Chi Phí';
    case 'profile':
      return 'Hồ Sơ Cá Nhân';
    case 'all_students':
      return 'Toàn Bộ Sinh Viên';
    default:
      return 'WIP';
  }
}
