import React from 'react';
import { ClassMonitorToolsProps } from './class-monitor-tools/types';
import { useClassMonitorTools } from './class-monitor-tools/useClassMonitorTools';
import { ClassOverviewColumn } from './class-monitor-tools/ClassOverviewColumn';
import { ClassAnnouncementCard } from './class-monitor-tools/ClassAnnouncementCard';
import { RoomDetailsTable } from './class-monitor-tools/RoomDetailsTable';

export default function ClassMonitorTools({ records, selectedClass, onClassChange }: ClassMonitorToolsProps) {
  const {
    copied,
    classes,
    stats,
    uniqueRooms,
    roomDetails,
    announcementText,
    handleCopy,
    handleExportClassCSV,
  } = useClassMonitorTools({ records, selectedClass, onClassChange });

  if (records.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Vui lòng tải dữ liệu lịch thi trước.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Công Cụ Lớp Trưởng</h2>
          <p className="text-sm text-slate-500">Hỗ trợ trích xuất và thông báo cho từng lớp</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm min-w-[200px]">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Chọn Lớp:</span>
          <select
            className="bg-transparent text-sm font-semibold outline-none text-slate-700 w-full"
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
          >
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {selectedClass ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Column */}
            <ClassOverviewColumn
              selectedClass={selectedClass}
              stats={stats}
              uniqueRooms={uniqueRooms}
              onExportCSV={handleExportClassCSV}
            />

            {/* Announcement Column */}
            <ClassAnnouncementCard
              announcementText={announcementText}
              copied={copied}
              onCopy={handleCopy}
            />
          </div>

          {/* Detailed Room Table */}
          <RoomDetailsTable roomDetails={roomDetails} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu lớp.</p>
        </div>
      )}
    </div>
  );
}
