import React from 'react';
import {
  Archive,
  Database,
  Download,
  FileCode,
  HardDrive,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { LocalBackupFile } from './types';

interface ServerBackupsTableProps {
  localBackups: LocalBackupFile[];
  confirmDeleteFile: string | null;
  deletingFilename: string | null;
  onOpenServerRestore: (filename: string) => void;
  onDownloadSavedFile: (filename: string) => void;
  onRequestDelete: (filename: string | null) => void;
  onConfirmDelete: (filename: string) => void;
}

export function ServerBackupsTable({
  localBackups,
  confirmDeleteFile,
  deletingFilename,
  onOpenServerRestore,
  onDownloadSavedFile,
  onRequestDelete,
  onConfirmDelete,
}: ServerBackupsTableProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <Archive className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="font-bold text-white text-base">Danh Sách Bản Sao Lưu Trên Máy Chủ</h2>
            <p className="text-xs text-slate-400">
              Thư mục <code className="text-indigo-400 font-mono">backups/</code> trên máy chủ ({localBackups.length} file) - Hỗ trợ tải về & <b>phục hồi trực tiếp</b>
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
          Dòng lệnh CLI: <code className="text-amber-300 font-mono">npm run db:backup -- --telegram</code>
        </div>
      </div>

      {localBackups.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <Archive className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-60" />
          <p className="text-sm font-medium text-slate-300">Chưa có file sao lưu nào được lưu trên máy chủ</p>
          <p className="text-xs text-slate-500 mt-1">
            Bấm &quot;Tạo Snapshot Máy Chủ&quot; ở trên hoặc chạy <code className="text-slate-400 font-mono">npm run db:backup</code> từ terminal
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Tên File</th>
                <th className="py-3 px-4 font-semibold">Định Dạng</th>
                <th className="py-3 px-4 font-semibold">Dung Lượng</th>
                <th className="py-3 px-4 font-semibold">Thời Gian Tạo</th>
                <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {localBackups.map((file) => (
                <tr key={file.name} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-200 flex items-center gap-2">
                    {file.format === 'sql' ? (
                      <Database className="w-4 h-4 text-sky-400 shrink-0" />
                    ) : file.format === 'json' ? (
                      <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold">{file.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                        file.format === 'sql'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : file.format === 'json'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {file.format === 'sql' ? 'SQL (POSTGRES)' : file.format === 'json' ? 'JSON' : 'SQLITE (CŨ)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{file.sizeFormatted}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(file.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Nút Phục Hồi từ file này */}
                      <button
                        onClick={() => onOpenServerRestore(file.name)}
                        title="Phục hồi dữ liệu từ bản sao lưu này"
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded-lg border border-amber-500/30 transition cursor-pointer font-bold text-[11px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Phục hồi
                      </button>

                      <button
                        onClick={() => onDownloadSavedFile(file.name)}
                        title="Tải về máy tính"
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg border border-indigo-500/30 transition cursor-pointer font-medium text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải về
                      </button>

                      {confirmDeleteFile === file.name ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onConfirmDelete(file.name)}
                            disabled={deletingFilename === file.name}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition disabled:opacity-50"
                          >
                            {deletingFilename === file.name ? '...' : 'Xác nhận xoá'}
                          </button>
                          <button
                            onClick={() => onRequestDelete(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[11px] cursor-pointer"
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onRequestDelete(file.name)}
                          title="Xoá file sao lưu"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-900/50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
