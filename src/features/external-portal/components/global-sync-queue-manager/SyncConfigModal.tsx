'use client';

import React from 'react';
import {
  X,
  BookOpen,
  Calendar,
  GraduationCap,
  Sliders,
  Award,
  UserCheck,
} from 'lucide-react';
import { JobConfigKey, SyncConfigFormState } from './types';

interface SyncConfigModalProps {
  configForm: SyncConfigFormState;
  isSubmitting: boolean;
  onChangeConfigForm: (next: SyncConfigFormState) => void;
  onSaveConfig: (e: React.FormEvent) => void;
  onClose: () => void;
}

interface JobConfigFieldSpec {
  key: JobConfigKey;
  title: string;
  subtitle: string;
  placeholder: string;
  hoverBorderClass: string;
  iconBgClass: string;
  checkboxAccentClass: string;
  inputFocusRingClass: string;
  icon: React.ReactNode;
}

const JOB_CONFIG_FIELDS: JobConfigFieldSpec[] = [
  {
    key: 'timetableJob',
    title: 'Job 1: Lịch Học & Thời Khóa Biểu',
    subtitle: 'Chỉ quét SV đã liên kết Cổng QLHT',
    placeholder: '22:00',
    hoverBorderClass: 'hover:border-indigo-300',
    iconBgClass: 'bg-indigo-50 text-indigo-600',
    checkboxAccentClass: 'accent-indigo-600',
    inputFocusRingClass: 'focus:ring-indigo-500',
    icon: <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
  {
    key: 'gradesJob',
    title: 'Job 2: Điểm & GPA Tích Lũy',
    subtitle: 'Chỉ quét SV đã liên kết Cổng QLHT',
    placeholder: '22:00',
    hoverBorderClass: 'hover:border-emerald-300',
    iconBgClass: 'bg-emerald-50 text-emerald-600',
    checkboxAccentClass: 'accent-emerald-600',
    inputFocusRingClass: 'focus:ring-emerald-500',
    icon: <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
  {
    key: 'lmsJob',
    title: 'Job 3: Khóa Học & Tiến Độ LMS',
    subtitle: 'Chỉ quét SV đã liên kết LMS PTTC1',
    placeholder: '22:00',
    hoverBorderClass: 'hover:border-purple-300',
    iconBgClass: 'bg-purple-50 text-purple-600',
    checkboxAccentClass: 'accent-purple-600',
    inputFocusRingClass: 'focus:ring-purple-500',
    icon: <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
  {
    key: 'examsJob',
    title: 'Job 4: Lịch Thi QLDTTX & Biến Động',
    subtitle: 'Quét 7h sáng & quét 20-30p nếu có ca thi hôm nay',
    placeholder: '07:00',
    hoverBorderClass: 'hover:border-amber-300',
    iconBgClass: 'bg-amber-50 text-amber-600',
    checkboxAccentClass: 'accent-amber-600',
    inputFocusRingClass: 'focus:ring-amber-500',
    icon: <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
  {
    key: 'slinkGradesJob',
    title: 'Job 5: Kết Quả Học Tập PTIT S-Link',
    subtitle: 'Chỉ quét SV đã liên kết PTIT S-Link',
    placeholder: '23:00',
    hoverBorderClass: 'hover:border-violet-300',
    iconBgClass: 'bg-violet-50 text-violet-600',
    checkboxAccentClass: 'accent-violet-600',
    inputFocusRingClass: 'focus:ring-violet-500',
    icon: <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
  {
    key: 'profileJob',
    title: 'Job 6: Thông Tin Cá Nhân Sinh Viên (QLHT)',
    subtitle: 'Đồng bộ ngày sinh, giới tính, SĐT, CMND, Email, nơi sinh, quốc tịch',
    placeholder: '22:30',
    hoverBorderClass: 'hover:border-sky-300',
    iconBgClass: 'bg-sky-50 text-sky-600',
    checkboxAccentClass: 'accent-sky-600',
    inputFocusRingClass: 'focus:ring-sky-500',
    icon: <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
  },
];

export function SyncConfigModal({
  configForm,
  isSubmitting,
  onChangeConfigForm,
  onSaveConfig,
  onClose,
}: SyncConfigModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Cài Đặt Lịch Chạy Tự Động Từng Job
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Tùy chỉnh giờ hẹn và bật/tắt độc lập cho từng tác vụ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={onSaveConfig} className="space-y-4 sm:space-y-5 overflow-y-auto pr-0.5">
          {/* BẬT TẮT CHUNG TOÀN HỆ THỐNG */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Bật Hệ Thống Tự Động Toàn Cục</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500">
                Công tắc tổng kích hoạt các Job theo giờ hẹn
              </div>
            </div>
            <input
              type="checkbox"
              checked={configForm.isEnabled}
              onChange={(e) => onChangeConfigForm({ ...configForm, isEnabled: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* CẤU HÌNH TỪNG JOB ĐỘC LẬP */}
          <div className="space-y-3 sm:space-y-4">
            <div className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Cấu Hình Giờ Chạy Riêng Biệt
            </div>

            {JOB_CONFIG_FIELDS.map((field) => {
              const jobState = configForm[field.key];
              return (
                <div
                  key={field.key}
                  className={`p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-2xl space-y-2.5 sm:space-y-3 ${field.hoverBorderClass} transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${field.iconBgClass} flex items-center justify-center font-bold text-xs shrink-0`}
                      >
                        {field.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{field.title}</div>
                        <div className="text-[10px] text-slate-500">{field.subtitle}</div>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={jobState.isEnabled}
                        onChange={(e) =>
                          onChangeConfigForm({
                            ...configForm,
                            [field.key]: { ...jobState, isEnabled: e.target.checked },
                          })
                        }
                        className={`w-4 h-4 ${field.checkboxAccentClass} rounded cursor-pointer`}
                      />
                      <span>Bật</span>
                    </label>
                  </div>

                  {jobState.isEnabled && (
                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-medium text-slate-600 shrink-0">Giờ chạy:</label>
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={jobState.scheduleTime}
                        onChange={(e) =>
                          onChangeConfigForm({
                            ...configForm,
                            [field.key]: { ...jobState, scheduleTime: e.target.value },
                          })
                        }
                        className={`w-24 sm:w-32 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:ring-2 ${field.inputFocusRingClass} text-center`}
                      />
                      <span className="text-[10px] sm:text-[11px] text-slate-400">(HH:mm)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 sm:pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Lưu Cài Đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
