import React from 'react';
import { Clock, Database, Info, Laptop } from 'lucide-react';
import { ACTION_CATEGORIES, ActionCategoryKey } from '../../types/activityLogActions';
import { ACTION_CONFIGS } from './actionConfigs';
import { MetadataViewTab } from './types';
import { formatDateTime, parseUserAgent } from './utils';
import { MetadataPayloadSection } from './MetadataPayloadSection';

interface ActivityLogMetadataModalProps {
  selectedLogMetadata: any;
  metadataViewTab: MetadataViewTab;
  onChangeTab: (tab: MetadataViewTab) => void;
  copiedJson: boolean;
  onCopyJson: (data: any) => void;
  onClose: () => void;
}

export function ActivityLogMetadataModal({
  selectedLogMetadata,
  metadataViewTab,
  onChangeTab,
  copiedJson,
  onCopyJson,
  onClose,
}: ActivityLogMetadataModalProps) {
  const modalConfig = ACTION_CONFIGS[selectedLogMetadata.action] || {
    label: selectedLogMetadata.action,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Info,
    category: 'SYSTEM',
  };
  const ModalActIcon = modalConfig.icon;

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border ${modalConfig.bg} ${modalConfig.text} ${modalConfig.border} shrink-0`}>
              <ModalActIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm sm:text-base tracking-tight text-white truncate">{modalConfig.label}</h4>
                <span className="px-2 py-0.5 bg-white/10 text-indigo-200 text-[10px] font-mono font-bold rounded-lg border border-white/15">
                  {selectedLogMetadata.action}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                ID: <span className="font-mono text-indigo-300 font-bold">#{selectedLogMetadata.id}</span> • Phân loại:{' '}
                <span className="font-bold text-slate-300">
                  {ACTION_CATEGORIES[modalConfig.category as ActionCategoryKey]?.label || modalConfig.category}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto">
          {/* Description Banner */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 p-3.5 sm:p-4 rounded-2xl border border-indigo-100/80 flex flex-col gap-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
              Mô tả hoạt động
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {selectedLogMetadata.description}
            </p>
          </div>

          {/* Core Meta 4-Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            {/* User */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-200 overflow-hidden ring-1 ring-slate-300 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedLogMetadata.username || 'sys'}`}
                  alt={selectedLogMetadata.username || 'System'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Người thực hiện</span>
                <span className="font-mono font-bold text-slate-800 text-xs truncate block">
                  {selectedLogMetadata.username || 'Hệ Thống'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedLogMetadata.userRole?.includes('admin')
                    ? '👑 Quản Trị Viên'
                    : selectedLogMetadata.userRole?.includes('lop_truong')
                    ? '🛡️ Cán Bộ Lớp'
                    : '🎓 Sinh Viên'}
                </span>
              </div>
            </div>

            {/* Target */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Đối tượng tác động</span>
                <span className="font-mono font-bold text-slate-800 text-xs truncate block">
                  {selectedLogMetadata.targetId || 'Không có ID'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate block">
                  Loại: <span className="font-semibold text-slate-700">{selectedLogMetadata.targetType || 'N/A'}</span>
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thời gian ghi nhận</span>
                <span className="font-bold text-slate-800 text-xs block">
                  {formatDateTime(selectedLogMetadata.createdAt)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block">
                  {new Date(selectedLogMetadata.createdAt).toISOString()}
                </span>
              </div>
            </div>

            {/* Network / IP */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-50 border border-cyan-200/60 flex items-center justify-center text-cyan-600 shrink-0">
                <Laptop className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Địa chỉ IP & Thiết bị</span>
                <span className="font-mono font-bold text-slate-800 text-xs block">
                  {selectedLogMetadata.ipAddress || 'Internal Worker'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block font-medium" title={selectedLogMetadata.userAgent || ''}>
                  {parseUserAgent(selectedLogMetadata.userAgent)}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Section with Tabs */}
          <MetadataPayloadSection
            metaObj={selectedLogMetadata.metadata}
            metadataViewTab={metadataViewTab}
            onChangeTab={onChangeTab}
            copiedJson={copiedJson}
            onCopyJson={onCopyJson}
          />

          {/* Full User-Agent inspection if available */}
          {selectedLogMetadata.userAgent && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                User-Agent Đầy Đủ
              </label>
              <p className="text-[10px] sm:text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200 break-all leading-relaxed">
                {selectedLogMetadata.userAgent}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
            #{selectedLogMetadata.id} • {modalConfig.label}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 sm:px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
