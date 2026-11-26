'use client';

import React from 'react';
import { Terminal } from 'lucide-react';
import { SniperLogEntry } from '../../hooks/useCourseRegistration';

interface SniperTerminalLogProps {
  isSniperActive: boolean;
  sniperLogs: SniperLogEntry[];
  clearSniperLogs: () => void;
}

export function SniperTerminalLog({
  isSniperActive,
  sniperLogs,
  clearSniperLogs,
}: SniperTerminalLogProps) {
  return (
    <div className="lg:col-span-7">
      <div className="bg-[#0B132B] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full min-h-[400px]">
        {/* Terminal Window Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 ml-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" /> bot-dkmh-console.log
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSniperActive && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> LIVE
              </span>
            )}
            <button
              onClick={clearSniperLogs}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 font-mono text-xs overflow-y-auto flex-1 flex flex-col-reverse gap-1.5 max-h-[420px] scrollbar-thin">
          {sniperLogs.length === 0 ? (
            <div className="text-slate-500 py-16 text-center italic">
              Console log trống. Bấm "BẮT ĐẦU CANH SLOT" để xem luồng quét thời gian thực...
            </div>
          ) : (
            sniperLogs.map((log) => {
              let colorClass = 'text-slate-300';
              if (log.type === 'slot') colorClass = 'text-amber-300 font-bold bg-amber-950/40 p-1 rounded';
              else if (log.type === 'success')
                colorClass = 'text-emerald-400 font-bold bg-emerald-950/40 p-1 rounded';
              else if (log.type === 'error') colorClass = 'text-rose-400';
              else if (log.type === 'warning') colorClass = 'text-amber-400';

              return (
                <div key={log.id} className="leading-relaxed flex items-start gap-2">
                  <span className="text-slate-500 select-none shrink-0">[{log.timestamp}]</span>
                  <span className={`${colorClass} break-words`}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
