import React from 'react';
import { CheckCheck, Code2, Copy, Info, Layers } from 'lucide-react';
import { FIELD_LABELS } from './fieldLabels';
import { MetadataViewTab } from './types';

interface MetadataPayloadSectionProps {
  metaObj: any;
  metadataViewTab: MetadataViewTab;
  onChangeTab: (tab: MetadataViewTab) => void;
  copiedJson: boolean;
  onCopyJson: (data: any) => void;
}

export function MetadataPayloadSection({
  metaObj,
  metadataViewTab,
  onChangeTab,
  copiedJson,
  onCopyJson,
}: MetadataPayloadSectionProps) {
  const hasMetadata = metaObj && typeof metaObj === 'object' && Object.keys(metaObj).length > 0;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Dữ Liệu Chi Tiết (Metadata)</span>
          </label>
          {hasMetadata && (
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-md">
              {Object.keys(metaObj).length} trường
            </span>
          )}
        </div>

        {hasMetadata && (
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onChangeTab('VISUAL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                metadataViewTab === 'VISUAL'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Trực Quan
            </button>
            <button
              type="button"
              onClick={() => onChangeTab('JSON')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                metadataViewTab === 'JSON'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>JSON</span>
            </button>
          </div>
        )}
      </div>

      {!hasMetadata ? (
        <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300" />
          <p className="text-xs font-medium">Hoạt động này không có payload dữ liệu metadata mở rộng.</p>
        </div>
      ) : metadataViewTab === 'VISUAL' ? (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-xs">
            {[0, 1].map((colMod) => (
              <div key={colMod} className="divide-y divide-slate-200/70">
                {Object.entries(metaObj)
                  .filter((_, idx) => idx % 2 === colMod)
                  .map(([key, val]) => (
                    <div key={key} className="p-3 flex flex-col gap-0.5 hover:bg-slate-100/60 transition-colors">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {FIELD_LABELS[key] || key}
                      </span>
                      <div className="font-medium text-slate-800 text-xs break-all">
                        {typeof val === 'boolean' ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {val ? '✓ Đúng / Kích hoạt' : '✕ Sai / Vô hiệu'}
                          </span>
                        ) : typeof val === 'number' ? (
                          <span className="font-mono font-bold text-indigo-600">
                            {val.toLocaleString('vi-VN')}
                          </span>
                        ) : typeof val === 'object' && val !== null ? (
                          <pre className="text-[10px] font-mono bg-white p-1.5 rounded border border-slate-200 overflow-x-auto max-h-24">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          <span className="font-mono text-slate-800">{String(val ?? '-')}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative">
          <pre className="bg-slate-900 text-emerald-300 p-3.5 sm:p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed border border-slate-800 shadow-inner">
            {JSON.stringify(metaObj, null, 2)}
          </pre>
          <button
            type="button"
            onClick={() => onCopyJson(metaObj)}
            className="absolute top-3 right-3 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer border border-white/20"
          >
            {copiedJson ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Đã Sao Chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span>Sao Chép JSON</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
