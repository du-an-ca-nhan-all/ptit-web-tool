import React from 'react';
import { MapPin } from 'lucide-react';
import { RoomDetailItem } from './types';

interface RoomDetailsTableProps {
  roomDetails: RoomDetailItem[];
}

export function RoomDetailsTable({ roomDetails }: RoomDetailsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-2">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" />
          Chi tiết lịch theo phòng thi
        </h3>
        <span className="text-sm text-slate-500 font-medium">
          {roomDetails.length} lịch thi
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">STT</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Ngày / Giờ</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Phòng</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Môn thi</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Hình thức</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Số lượng SV</th>
            </tr>
          </thead>
          <tbody>
            {roomDetails.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              roomDetails.map((item, index) => (
                <tr key={index} className={`hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{item.date}</span>
                      <span className="text-slate-500 font-normal">{item.time}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-rose-600">{item.room}</td>
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                    <div className="flex flex-col">
                      <span>{item.subjectName}</span>
                      <span className="text-slate-400 text-xs">{item.subjectCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.format || 'Thi'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{item.students}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
