import React from 'react';
import { AnnouncementFormData, PreviewTab } from './types';

interface AnnouncementFormFieldsProps {
  formData: AnnouncementFormData;
  onChangeFormData: (next: AnnouncementFormData) => void;
  onChangePreviewTab: (tab: PreviewTab) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AnnouncementFormFields({
  formData,
  onChangeFormData,
  onChangePreviewTab,
  onSubmit,
}: AnnouncementFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="lg:col-span-7 flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Tiêu đề thông báo <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Ví dụ: Đã có lịch thi Học kỳ 2 Năm học 2025-2026!"
          value={formData.title}
          onChange={(e) => onChangeFormData({ ...formData, title: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Nội dung chi tiết <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          placeholder="Nhập nội dung thông báo. Có thể xuống dòng hoặc trình bày chi tiết..."
          value={formData.content}
          onChange={(e) => onChangeFormData({ ...formData, content: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
        />
      </div>

      {/* Type and Display Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mức độ / Loại thông báo
          </label>
          <select
            value={formData.type}
            onChange={(e: any) => onChangeFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="INFO">ℹ️ Thông tin (Info)</option>
            <option value="WARNING">⚠️ Cảnh báo (Warning)</option>
            <option value="DANGER">🚨 Khẩn cấp (Danger)</option>
            <option value="MAINTENANCE">🔧 Bảo trì (Maintenance)</option>
            <option value="SUCCESS">✅ Thành công / Mới (Success)</option>
            <option value="SYSTEM">✨ Hệ thống (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Hình thức hiển thị
          </label>
          <select
            value={formData.displayMode}
            onChange={(e: any) => {
              onChangeFormData({ ...formData, displayMode: e.target.value });
              if (e.target.value === 'MODAL') onChangePreviewTab('MODAL');
              if (e.target.value === 'BANNER') onChangePreviewTab('BANNER');
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="BANNER">Thanh Banner (Đầu trang)</option>
            <option value="MODAL">Popup Modal (Bật lên khi vào web)</option>
            <option value="BOTH">Cả hai (Banner & Popup)</option>
          </select>
        </div>
      </div>

      {/* Target Role & Target Class */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Đối tượng nhận
          </label>
          <select
            value={formData.targetRole}
            onChange={(e: any) => onChangeFormData({ ...formData, targetRole: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          >
            <option value="ALL">👥 Tất cả người dùng</option>
            <option value="sinh_vien">🎓 Chỉ Sinh viên</option>
            <option value="lop_truong">👑 Chỉ Lớp trưởng</option>
            <option value="admin">🛡️ Chỉ Quản trị viên</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mã lớp cụ thể (Tùy chọn)
          </label>
          <input
            type="text"
            placeholder="Để trống nếu áp dụng tất cả lớp"
            value={formData.targetClass}
            onChange={(e) => onChangeFormData({ ...formData, targetClass: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>
      </div>

      {/* Call-to-action button & link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Đường dẫn liên kết (CTA Link)
          </label>
          <input
            type="text"
            placeholder="Ví dụ: /schedule hoặc https://..."
            value={formData.linkUrl}
            onChange={(e) => onChangeFormData({ ...formData, linkUrl: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Chữ hiển thị trên nút bấm
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Xem Lịch Thi Ngay"
            value={formData.linkText}
            onChange={(e) => onChangeFormData({ ...formData, linkText: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>
      </div>

      {/* Date scheduling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bắt đầu hiển thị từ
          </label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => onChangeFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Kết thúc / Hết hạn vào (Tùy chọn)
          </label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => onChangeFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-sky-500 outline-hidden"
          />
        </div>
      </div>

      {/* Checkbox Options */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={formData.isPinned}
            onChange={(e) => onChangeFormData({ ...formData, isPinned: e.target.checked })}
            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <span>📌 Ghim thông báo lên đầu</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => onChangeFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span>✅ Kích hoạt ngay (Active)</span>
        </label>
      </div>
    </form>
  );
}
