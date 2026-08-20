import React from 'react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-[#0F172A] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400">Đang khởi động PTIT EduSync...</p>
      </div>
    </div>
  );
}
