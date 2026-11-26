import React from 'react';
import { Shield, Phone, GraduationCap, Crown, ArrowRightLeft } from 'lucide-react';
import { LoginUser } from '../../types/class.types';

interface MonitorCardProps {
  monitor: LoginUser;
  onClassClick?: (classCode: string) => void;
}

export function MonitorCard({ monitor, onClassClick }: MonitorCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group hover:border-amber-200">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-amber-700 font-black text-sm shrink-0 shadow-xs">
            {monitor.fullName ? monitor.fullName.charAt(0) : monitor.username.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-slate-800 text-sm truncate">
                {monitor.fullName || 'Chưa cập nhật tên'}
              </h3>
              <span className="p-0.5 text-amber-500">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
              </span>
            </div>
            <div className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block mt-1">
              {monitor.username}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Lớp quản lý:
            </span>
            {monitor.lop ? (
              onClassClick ? (
                <button
                  onClick={() => onClassClick(monitor.lop!)}
                  className="font-bold text-blue-600 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded"
                >
                  {monitor.lop}
                </button>
              ) : (
                <span className="font-bold text-slate-700">{monitor.lop}</span>
              )
            ) : (
              <span className="text-slate-400 italic text-[11px]">Chưa gán lớp</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Số điện thoại:
            </span>
            {monitor.phoneNumber ? (
              <a
                href={`tel:${monitor.phoneNumber}`}
                className="font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                {monitor.phoneNumber}
              </a>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Chưa có</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> Vai trò:
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {monitor.role === 'admin'
                ? '👑 Quản Trị Viên'
                : '🛡️ Lớp Trưởng'}
            </span>
          </div>
        </div>
      </div>

      {onClassClick && monitor.lop && (
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => onClassClick(monitor.lop!)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:gap-1.5 transition-all cursor-pointer"
          >
            <span>Xem chi tiết danh sách lớp</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
