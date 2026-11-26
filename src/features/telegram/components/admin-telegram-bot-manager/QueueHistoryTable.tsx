import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Inbox, RefreshCw } from 'lucide-react';

interface QueueHistoryTableProps {
  recentHistory?: any[];
}

export default function QueueHistoryTable({ recentHistory }: QueueHistoryTableProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-800">
            Lịch Sử Gửi Tin Gần Đây ({recentHistory?.length || 0})
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">Tự động cập nhật mỗi 2.5 giây</span>
      </div>

      {!recentHistory || recentHistory.length === 0 ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Inbox className="w-10 h-10 stroke-1 text-slate-300" />
          <p className="text-xs">
            Chưa có tin nhắn nào được xử lý qua hàng đợi trong phiên làm việc này.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Loại</th>
                <th className="py-2.5 px-3">Người nhận (Chat ID)</th>
                <th className="py-2.5 px-3">Độ ưu tiên</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Lần thử</th>
                <th className="py-2.5 px-3">Độ trễ</th>
                <th className="py-2.5 px-3">Xem trước / Lỗi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentHistory.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleTimeString('vi-VN')
                      : '-'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {item.type === 'document' ? (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-bold text-[10px]">
                        TẬP TIN
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-bold text-[10px]">
                        VĂN BẢN
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    <code>{item.chatId}</code>
                    {item.threadId ? (
                      <span className="ml-1 text-[10px] text-purple-600 font-normal">
                        (Topic: {item.threadId})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : item.priority === 'NORMAL'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {item.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Thành công</span>
                      </span>
                    ) : item.status === 'RETRYING' ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang thử lại</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Thất bại</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{item.attempts}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    {item.durationMs !== undefined ? `${item.durationMs}ms` : '-'}
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-slate-600">
                    {item.error ? (
                      <span className="text-rose-600 font-semibold">{item.error}</span>
                    ) : item.filename ? (
                      <span className="font-mono text-sky-700">{item.filename}</span>
                    ) : (
                      <span>{item.textPreview || '-'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
