'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface FlowResultBadgeProps {
  result?: string | null;
}

export function FlowResultBadge({ result }: FlowResultBadgeProps) {
  if (!result) return null;
  const upper = result.toUpperCase();
  if (upper === 'SUCCESS') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Thành công
      </span>
    );
  }
  if (upper === 'FAILED' || upper === 'ERROR') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <AlertCircle className="w-3 h-3 text-rose-600" />
        Thất bại
      </span>
    );
  }
  if (upper === 'QUEUED' || upper === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
        <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
        Đang chờ xử lý
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
      {result}
    </span>
  );
}
