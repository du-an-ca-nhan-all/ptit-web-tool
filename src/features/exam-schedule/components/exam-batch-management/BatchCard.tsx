'use client';

import React from 'react';
import { Upload, Trash2, Edit3, Star, Power } from 'lucide-react';
import { ExamBatchItem } from '../../types/exam.types';

interface BatchCardProps {
  batch: ExamBatchItem;
  onToggleBatch: (batch: ExamBatchItem) => void;
  onSetActive: (batch: ExamBatchItem) => void;
  onImportClick: (batch: ExamBatchItem) => void;
  onEditClick: (batch: ExamBatchItem) => void;
  onDeleteClick: (batch: ExamBatchItem) => void;
}

export function BatchCard({
  batch,
  onToggleBatch,
  onSetActive,
  onImportClick,
  onEditClick,
  onDeleteClick,
}: BatchCardProps) {
  return (
    <div
      className={`relative rounded-2xl border transition-all p-6 flex flex-col justify-between gap-5 ${
        batch.isActive
          ? 'bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 border-indigo-200 shadow-md ring-2 ring-indigo-500/20'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Top Bar: Name & Status Badge with Toggle Switch */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{batch.name}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">{batch.code}</span>
              {batch.semester && (
                <>
                  <span>•</span>
                  <span>{batch.semester}</span>
                </>
              )}
              {batch.academicYear && (
                <>
                  <span>•</span>
                  <span>{batch.academicYear}</span>
                </>
              )}
            </div>
          </div>

          {/* Interactive BẬT / TẮT Toggle Switch */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleBatch(batch)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                batch.isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-slate-300'
              }`}
              title={batch.isActive ? 'Bấm để TẮT đợt thi này' : 'Bấm để BẬT đợt thi này'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  batch.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                batch.isActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Power className="w-3 h-3" />
              {batch.isActive ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
            </span>
          </div>
        </div>

        {batch.description && (
          <p className="text-xs text-slate-600 italic mt-2 line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-slate-100">
            "{batch.description}"
          </p>
        )}
      </div>

      {/* Metrics Box */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
        <div className="text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Lượt Thi</p>
          <p className="text-base font-black text-indigo-600">
            {batch.totalRecords ? batch.totalRecords.toLocaleString('vi-VN') : 0}
          </p>
        </div>
        <div className="text-center border-x border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Sinh Viên</p>
          <p className="text-base font-black text-slate-700">
            {batch.totalStudents ? batch.totalStudents.toLocaleString('vi-VN') : 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Phòng Thi</p>
          <p className="text-base font-black text-slate-700">
            {batch.totalRooms ? batch.totalRooms.toLocaleString('vi-VN') : 0}
          </p>
        </div>
      </div>

      {/* Actions Bottom Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onToggleBatch(batch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer border shadow-xs ${
              batch.isActive
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
            title={batch.isActive ? 'Tạm khóa / Tắt đợt thi này' : 'Kích hoạt / Bật đợt thi này'}
          >
            <Power className="w-3.5 h-3.5" />
            {batch.isActive ? 'Tắt Đợt Thi' : 'Bật Đợt Thi'}
          </button>

          <button
            onClick={() => onSetActive(batch)}
            disabled={batch.isActive}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors border shadow-xs ${
              batch.isActive
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer'
            }`}
            title="Đặt làm đợt thi mặc định cho toàn hệ thống"
          >
            <Star className="w-3.5 h-3.5" />
            {batch.isActive ? 'Đang Mặc Định' : 'Đặt Mặc Định'}
          </button>

          <button
            onClick={() => onImportClick(batch)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200 shadow-sm"
            title="Nạp thêm / ghi đè lịch thi từ file CSV cho đợt này"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditClick(batch)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            title="Chỉnh sửa thông tin đợt thi"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDeleteClick(batch)}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Xóa đợt thi & lịch thi liên quan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
