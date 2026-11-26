'use client';

import React from 'react';
import { BookOpen, User, Info, X } from 'lucide-react';
import { ReminderItemDto, EnrolledCourseOption } from '../../types/reminder.types';
import { ReminderFormData } from './types';
import { ReminderOffsetsField } from './ReminderOffsetsField';

interface ReminderFormModalProps {
  editingReminder: ReminderItemDto | null;
  formData: ReminderFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReminderFormData>>;
  enrolledCourses: EnrolledCourseOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleOffset: (minutes: number) => void;
  onAddCustomOffset: () => void;
  onRemoveOffset: (minutes: number) => void;
}

export function ReminderFormModal({
  editingReminder,
  formData,
  setFormData,
  enrolledCourses,
  isSubmitting,
  onClose,
  onSubmit,
  onToggleOffset,
  onAddCustomOffset,
  onRemoveOffset,
}: ReminderFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                formData.type === 'PERSONAL'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {formData.type === 'PERSONAL' ? <User className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                {editingReminder ? 'Chỉnh Sửa Lịch Nhắc Hẹn' : 'Tạo Lịch Nhắc Hẹn Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {formData.type === 'PERSONAL'
                  ? 'Lịch nhắc hẹn riêng cho bản thân'
                  : 'Lịch nhắc hẹn cho cả lớp/tổ học cùng môn'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-4 scrollbar-thin">
          {/* Type Switcher (only for new reminders) */}
          {!editingReminder && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Loại nhắc hẹn:</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'PERSONAL' }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.type === 'PERSONAL'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Nhắc Hẹn Cá Nhân</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'COURSE' }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    formData.type === 'COURSE'
                      ? 'bg-white text-amber-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Nhắc Hẹn Môn Học</span>
                </button>
              </div>
            </div>
          )}

          {/* Course Selection if type === 'COURSE' */}
          {formData.type === 'COURSE' && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Chọn môn học hiện tại bạn đang học:</span>
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
                  {enrolledCourses.length} môn đang học
                </span>
              </div>

              {enrolledCourses.length > 0 ? (
                <select
                  value={formData.selectedCourseKey}
                  onChange={(e) => setFormData((prev) => ({ ...prev, selectedCourseKey: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {enrolledCourses.map((c) => (
                    <option key={c.idToHoc} value={c.idToHoc}>
                      {c.maMon} - {c.tenMon} (Tổ: {c.nhomTo || '01'}{c.lop ? ` | Lớp: ${c.lop}` : ''})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Mã môn (vd: INT1306)"
                    value={formData.customMaMon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customMaMon: e.target.value }))}
                    className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Tên môn học"
                    value={formData.customTenMon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customTenMon: e.target.value }))}
                    className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nhóm/Tổ (vd: 03)"
                    value={formData.customNhomTo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customNhomTo: e.target.value }))}
                    className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Mã lớp (vd: D25TXCN11-K)"
                    value={formData.customLop}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customLop: e.target.value }))}
                    className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                </div>
              )}

              <p className="text-[11px] text-amber-800 leading-relaxed flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Tất cả sinh viên học cùng môn, tổ và lớp này sẽ được tự động thêm vào lịch cá nhân và nhận thông báo Telegram trước thời điểm sự kiện!
                </span>
              </p>
            </div>
          )}

          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Tiêu đề nhắc hẹn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nộp bài tập lớn nhóm 3, Thi trắc nghiệm giữa kỳ..."
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Event Time Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Thời gian diễn ra / Hạn chót <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.eventTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, eventTime: e.target.value }))}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Location or Online Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Địa điểm / Đường dẫn học online (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Phòng 302-A2, hoặc link Zoom / Google Meet / LMS..."
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              💡 Nhập link (Google Meet, Zoom, MS Teams...), tin nhắn Telegram sẽ tự động tạo đường link có thể bấm trực tiếp.
            </p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Dặn dò / Ghi chú chi tiết (tùy chọn):
            </label>
            <textarea
              rows={4}
              placeholder="Chi tiết đề bài, nội dung cần chuẩn bị, dặn dò của giáo viên..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y min-h-[90px]"
            />
            <p className="text-[11px] text-slate-400">
              💡 Hỗ trợ xuống dòng và tự động nhận diện các liên kết (Drive, Docs, LMS...) để có thể bấm trực tiếp.
            </p>
          </div>

          {/* ── NOTIFICATION OFFSETS CONFIGURATION ── */}
          <ReminderOffsetsField
            formData={formData}
            setFormData={setFormData}
            onToggleOffset={onToggleOffset}
            onAddCustomOffset={onAddCustomOffset}
            onRemoveOffset={onRemoveOffset}
          />

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{editingReminder ? 'Lưu Thay Đổi' : 'Tạo Nhắc Hẹn'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
