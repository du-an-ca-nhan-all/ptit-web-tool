import React from 'react';
import { Users, Download, ClipboardList, CalendarDays, MapPin } from 'lucide-react';
import { ClassMonitorStats } from './types';

interface ClassOverviewColumnProps {
  selectedClass: string;
  stats: ClassMonitorStats;
  uniqueRooms: string[];
  onExportCSV: () => void;
}

export function ClassOverviewColumn({
  selectedClass,
  stats,
  uniqueRooms,
  onExportCSV,
}: ClassOverviewColumnProps) {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          Tổng quan lớp {selectedClass}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-slate-700">Sinh viên dự thi</span>
            </div>
            <span className="text-lg font-bold text-slate-800">{stats.students}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><CalendarDays className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-slate-700">Số môn thi</span>
            </div>
            <span className="text-lg font-bold text-slate-800">{stats.subjects}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ClipboardList className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-slate-700">Lượt thi (tổng)</span>
            </div>
            <span className="text-lg font-bold text-slate-800">{stats.totalExams}</span>
          </div>
        </div>
        <button
          onClick={onExportCSV}
          className="w-full mt-6 py-2.5 bg-blue-50 text-blue-600 font-semibold text-sm rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Tải CSV Lớp Này
        </button>
      </div>

      {/* Exam Rooms Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" />
          Danh sách phòng thi
        </h3>
        {uniqueRooms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {uniqueRooms.map(room => (
              <span key={room} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-sm font-bold rounded-lg border border-rose-100">
                {room}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Không có dữ liệu phòng thi.</p>
        )}
      </div>
    </div>
  );
}
