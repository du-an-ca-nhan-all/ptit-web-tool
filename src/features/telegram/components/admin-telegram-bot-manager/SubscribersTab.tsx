import React from 'react';
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  Copy,
  Globe,
  Key,
  Search,
  Users,
} from 'lucide-react';
import { SubscriberFilterStatus, SubscriberItem } from './types';

interface SubscribersTabProps {
  filteredSubscribers: SubscriberItem[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: SubscriberFilterStatus;
  setFilterStatus: (value: SubscriberFilterStatus) => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export default function SubscribersTab({
  filteredSubscribers,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  copiedId,
  onCopy,
}: SubscribersTabProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Danh Sách Kênh & Tài Khoản Đã Liên Kết ({filteredSubscribers.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Toàn bộ sinh viên, lớp trưởng đã cấu hình nhận thông báo qua Telegram.
          </p>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã SV, họ tên, lớp, Chat ID..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang Bật nhận tin</option>
            <option value="INACTIVE">Đang Tắt</option>
            <option value="SYSTEM">Dùng Bot Hệ Thống</option>
            <option value="CUSTOM">Dùng Bot Riêng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3 px-4">Sinh Viên / Tài Khoản</th>
              <th className="py-3 px-4">Lớp Học</th>
              <th className="py-3 px-4">Loại Bot</th>
              <th className="py-3 px-4">Chat ID & Topic</th>
              <th className="py-3 px-4">Bộ Lọc Nhận Tin</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4">Lần Test Gần Nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredSubscribers.length > 0 ? (
              filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Student Info */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sub.fullName}</div>
                    <div className="font-mono text-[11px] text-indigo-600 font-bold">
                      {sub.username}
                    </div>
                  </td>

                  {/* Class */}
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold">
                      {sub.maLop}
                    </span>
                  </td>

                  {/* Bot Type */}
                  <td className="py-3 px-4">
                    {sub.isCustomBot ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold">
                        <Key className="w-3 h-3 text-indigo-500" />
                        <span>Bot Riêng</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[11px] font-bold">
                        <Globe className="w-3 h-3 text-sky-500" />
                        <span>Bot Hệ Thống</span>
                      </span>
                    )}
                    {sub.botUsername && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        @{sub.botUsername}
                      </div>
                    )}
                  </td>

                  {/* Chat ID & Thread */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                      <span>{sub.chatId}</span>
                      <button
                        type="button"
                        onClick={() => onCopy(sub.chatId, `chat-${sub.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Sao chép Chat ID"
                      >
                        {copiedId === `chat-${sub.id}` ? (
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {sub.threadId && (
                      <span className="inline-block mt-0.5 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-mono border border-sky-200">
                        Topic #{sub.threadId}
                      </span>
                    )}
                  </td>

                  {/* Notification Filters */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {sub.notifyExamSchedule && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">
                          Lịch Thi
                        </span>
                      )}
                      {sub.notifyClassActivity && (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">
                          Lớp Học
                        </span>
                      )}
                      {sub.notifyClassSchedule && (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                          Lịch Học (
                          {sub.classReminderBefore === 0
                            ? '30p & 1h'
                            : `${sub.classReminderBefore || 30}p`}
                          )
                        </span>
                      )}
                      {sub.notifyQldtAnnouncements && (
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-bold">
                          QLDTTX ({sub.qldtCheckInterval || 2}h)
                        </span>
                      )}
                      {sub.notifySlinkAnnouncements && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                          S-Link ({sub.slinkCheckInterval || 2}h)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Enabled Status */}
                  <td className="py-3 px-4">
                    {sub.isEnabled ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang Nhận
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Đang Tắt
                      </span>
                    )}
                  </td>

                  {/* Last Tested Status */}
                  <td className="py-3 px-4">
                    {sub.lastTestStatus === 'SUCCESS' ? (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Thành công</span>
                      </span>
                    ) : sub.lastTestStatus === 'FAILED' ? (
                      <span
                        className="text-[11px] text-rose-700 font-bold flex items-center gap-1"
                        title={sub.lastTestError || ''}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Thất bại</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Chưa test</span>
                    )}
                    {sub.lastTestedAt && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(sub.lastTestedAt).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  Không tìm thấy tài khoản Telegram nào phù hợp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
