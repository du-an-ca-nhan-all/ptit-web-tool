export interface SlinkConnectionGuideProps {
  /**
   * Chế độ hiển thị:
   * - 'card': Khung hướng dẫn đầy đủ nằm trong card cấu hình
   * - 'compact': Khung tóm tắt nhỏ gọn có nút xem chi tiết
   * - 'banner': Dải thông báo với nút mở modal ảnh hướng dẫn
   */
  variant?: 'card' | 'compact' | 'banner';
  /**
   * Trạng thái mở mặc định (đối với chế độ có thể thu gọn)
   */
  defaultExpanded?: boolean;
  /**
   * Tiêu đề tùy chỉnh
   */
  title?: string;
  /**
   * Lớp CSS bổ sung
   */
  className?: string;
  /**
   * Username / Email mặc định (giữ tương thích prop)
   */
  defaultUsername?: string;
  defaultEmail?: string;
}

export interface SlinkGuideImage {
  id: string;
  stepNum: string;
  title: string;
  shortTitle: string;
  badge: string;
  badgeColor: string;
  src: string;
  caption: string;
}
