'use client';

import React from 'react';
import {
  X,
  Play,
  Pause,
  Trash2,
  Plus,
  Volume2,
  VolumeX,
  Flame,
  Lock,
} from 'lucide-react';
import {
  MonitorFlowConfigInfo,
  SniperLogEntry,
  SniperTarget,
} from '../../hooks/useCourseRegistration';
import { CourseRegistrationHookResult } from './types';
import { SniperTerminalLog } from './SniperTerminalLog';

interface SniperBotTabProps {
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  isSniperActive: boolean;
  sniperInterval: number;
  setSniperInterval: (interval: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sniperTargets: SniperTarget[];
  sniperLogs: SniperLogEntry[];
  sniperStats: CourseRegistrationHookResult['sniperStats'];
  startSniper: () => void;
  stopSniper: () => void;
  removeSniperTarget: (id: string) => void;
  clearSniperTargets: () => void;
  clearSniperLogs: () => void;
  setShowAddSniperModal: (show: boolean) => void;
}

export function SniperBotTab({
  monitorFlowConfig,
  isSniperActive,
  sniperInterval,
  setSniperInterval,
  soundEnabled,
  setSoundEnabled,
  sniperTargets,
  sniperLogs,
  sniperStats,
  startSniper,
  stopSniper,
  removeSniperTarget,
  clearSniperTargets,
  clearSniperLogs,
  setShowAddSniperModal,
}: SniperBotTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sniper Control Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                <Flame className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Auto Canh Slot Môn Học (Sniper Bot)
              </h2>
              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Tốc độ cao
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tự động quét liên tục danh sách môn học theo chu kỳ. Ngay khi có sinh viên nhả môn hoặc Khoa mở thêm slot, bot sẽ lập tức bắn lệnh đăng ký với độ trễ tính bằng mili-giây.
            </p>
          </div>

          {/* Bot Start / Stop Button */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {monitorFlowConfig?.isEnabled ? (
              <div
                className="px-5 py-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-inner"
                title="Tính năng Canh Slot tự động bị khóa do tài khoản đang bật Flow theo Lớp trưởng"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Khóa Bởi Flow Lớp Trưởng ({monitorFlowConfig.monitorUsername})</span>
              </div>
            ) : isSniperActive ? (
              <button
                onClick={stopSniper}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>DỪNG AUTO CANH SLOT</span>
              </button>
            ) : (
              <button
                onClick={startSniper}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-black rounded-2xl transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer active:scale-98 animate-bounce"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>BẮT ĐẦU CANH SLOT</span>
              </button>
            )}
          </div>
        </div>

        {/* Config & Stats Toolbar */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Tần suất quét:</span>
              <select
                value={sniperInterval}
                onChange={(e) => setSniperInterval(Number(e.target.value))}
                disabled={isSniperActive}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1000}>1.0 giây (Siêu Tốc)</option>
                <option value={1500}>1.5 giây (Khuyên Dùng)</option>
                <option value={2000}>2.0 giây (An Toàn)</option>
                <option value={3000}>3.0 giây (Tiết Kiệm)</option>
                <option value={5000}>5.0 giây (Bình Thường)</option>
              </select>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt chuông báo khi có slot và khi đăng ký thành công"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}</span>
            </button>
          </div>

          {/* Stats Counters */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Số lần quét: </span>
              <strong className="text-sky-400 text-sm">{sniperStats.attempts}</strong>
            </div>
            <div>
              <span className="text-slate-400">Slot bắt được: </span>
              <strong className="text-amber-400 text-sm">{sniperStats.slotsFound}</strong>
            </div>
            <div>
              <span className="text-slate-400">ĐK thành công: </span>
              <strong className="text-emerald-400 text-sm">{sniperStats.successCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sniper Targets Grid + Terminal Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (5 cols): Target Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 fill-current" />
                <h3 className="font-black text-slate-800 text-sm">
                  Danh Sách Môn Cần Canh ({sniperTargets.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSniperModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Môn</span>
                </button>
                {sniperTargets.length > 0 && (
                  <button
                    onClick={clearSniperTargets}
                    disabled={isSniperActive}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Xóa tất cả mục tiêu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Target Cards */}
            {sniperTargets.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <Flame className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Chưa có môn nào trong hàng đợi</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Bấm nút "Thêm Môn" hoặc bấm biểu tượng 🔥 ở danh sách môn mở để đưa môn vào danh sách canh slot.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {sniperTargets.map((target) => (
                  <div
                    key={target.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      target.status === 'SUCCESS'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded text-xs">
                          {target.maMon}
                        </span>
                        <span className="font-bold text-xs truncate">{target.tenMon || target.maMon}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>
                          Nhóm:{' '}
                          <strong className="text-slate-700 font-mono">
                            {target.idToHoc && target.idToHoc !== 'ANY'
                              ? target.nhomTo || target.idToHoc
                              : 'Bất kỳ nhóm nào có chỗ'}
                          </strong>
                        </span>
                        {target.lastCheckedSlot && (
                          <span className="text-indigo-600 font-bold">• {target.lastCheckedSlot}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeSniperTarget(target.id)}
                      disabled={isSniperActive}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col (7 cols): Terminal Live Log */}
        <SniperTerminalLog
          isSniperActive={isSniperActive}
          sniperLogs={sniperLogs}
          clearSniperLogs={clearSniperLogs}
        />
      </div>
    </div>
  );
}
