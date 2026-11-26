import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Lock,
  RefreshCw,
  X,
  Zap,
} from 'lucide-react';
import type { StudentQldtExamScheduleResult } from '@/src/features/external-portal/server/studentExamScheduleServerService';
import type { QldtErrorType, SyncFeedback } from '../../types/studentPersonalExam.types';
import { formatSyncDateTime, getRelativeSyncTime } from '../../utils/studentExamScheduleUtils';

interface QldtHeaderCardProps {
  qldtData: StudentQldtExamScheduleResult | null;
  selectedSemester?: number;
  isLoadingQldt: boolean;
  isRefreshingQldt: boolean;
  errorType: QldtErrorType;
  syncFeedback: SyncFeedback | null;
  onDismissFeedback: () => void;
  onSelectSemester: (semesterId: number) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
  onNavigateToExternalAccounts?: () => void;
}

export default function QldtHeaderCard({
  qldtData,
  selectedSemester,
  isLoadingQldt,
  isRefreshingQldt,
  errorType,
  syncFeedback,
  onDismissFeedback,
  onSelectSemester,
  onRefresh,
  onExportCsv,
  onNavigateToExternalAccounts,
}: QldtHeaderCardProps) {
  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-indigo-500/20 shrink-0 mt-0.5 sm:mt-0">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-sm sm:text-lg font-black text-slate-800">
                Lịch Thi Cá Nhân (Cổng QLDTTX)
              </h3>
              {qldtData?.isCachedDb ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
                  Đã Lưu CSDL
                </span>
              ) : qldtData?.isLiveSync ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực Tuyến
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                  Đã Lưu
                </span>
              )}

              {qldtData?.lastSyncAt && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                  title="Thời điểm kéo dữ liệu từ Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)."
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden sm:inline">Lần kéo cuối:</span>
                  <strong className="font-mono text-slate-900">
                    {formatSyncDateTime(qldtData.lastSyncAt)}
                  </strong>
                  {getRelativeSyncTime(qldtData.lastSyncAt) && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({getRelativeSyncTime(qldtData.lastSyncAt)})
                    </span>
                  )}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Cổng: <strong className="text-indigo-600 font-mono">qldttx.pttc1.edu.vn</strong> •{' '}
              {qldtData?.semesterName || 'Học kỳ thi'} • <b>{qldtData?.totalExams || 0} môn thi</b>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          {qldtData?.semesters && qldtData.semesters.length > 0 && (
            <div className="relative flex-1 sm:flex-initial sm:min-w-[180px]">
              <select
                value={selectedSemester || qldtData.semesterId}
                onChange={(e) => onSelectSemester(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
              >
                {qldtData.semesters.map((sem) => (
                  <option key={sem.hocKy} value={sem.hocKy}>
                    {sem.tenHocKy}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshingQldt || isLoadingQldt}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              title="Chủ động kéo lại lịch thi mới nhất từ cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)"
            >
              {isRefreshingQldt ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              )}
              <span>{isRefreshingQldt ? 'Đang kéo...' : 'Kéo Lại QLDTTX'}</span>
            </button>

            {qldtData?.exams && qldtData.exams.length > 0 && (
              <button
                onClick={onExportCsv}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                title="Xuất danh sách lịch thi ra file CSV"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs print:hidden ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={onDismissFeedback}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!qldtData?.hasLinkedAccount && errorType === 'NOT_CONFIGURED' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-amber-500 text-white rounded-xl sm:rounded-2xl shadow-sm shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Chưa liên kết tài khoản Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 leading-relaxed">
                Liên kết tài khoản QLDTTX để xem lịch thi chính thức từ trường, bao gồm phòng thi,
                số báo danh, địa điểm thi và hình thức thi.
              </p>
            </div>
          </div>
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl sm:rounded-2xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto"
            >
              <span>Liên Kết QLĐT Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
