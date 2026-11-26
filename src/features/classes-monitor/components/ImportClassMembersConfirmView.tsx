'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import ConfirmDetailTables from './import-class-members-confirm-view/ConfirmDetailTables';
import ConfirmSummarySection from './import-class-members-confirm-view/ConfirmSummarySection';
import type { DetailTab, ImportClassMembersConfirmViewProps } from './import-class-members-confirm-view/types';
import { buildDetailTabs, getDefaultDetailTab } from './import-class-members-confirm-view/utils';

export default function ImportClassMembersConfirmView({
  preview,
  isExecuting,
  error,
  onBack,
  onConfirm,
}: ImportClassMembersConfirmViewProps) {
  const defaultTab = useMemo<DetailTab>(() => getDefaultDetailTab(preview), [preview]);
  const [activeTab, setActiveTab] = useState<DetailTab>(defaultTab);

  const tabs = buildDetailTabs(preview);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
        <ConfirmSummarySection preview={preview} error={error} />

        {/* Categorized Detail Tabs */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.key
                    ? tab.activeClass
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${tab.badgeClass}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <ConfirmDetailTables preview={preview} activeTab={activeTab} />
        </div>
      </div>

      {/* Confirmation Footer */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          disabled={isExecuting}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay Lại Chỉnh Sửa
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isExecuting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang Thực Hiện Import...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Xác Nhận Thực Hiện Import ({preview.importedCount} SV)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
