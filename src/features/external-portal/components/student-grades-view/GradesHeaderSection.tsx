import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  GraduationCap,
  RefreshCw,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { StudentGradesResult } from '../../server/studentGradesServerService';
import { DataSource, SyncFeedback } from './types';
import { formatSyncDateTime } from './utils';

interface GradesHeaderSectionProps {
  dataSource: DataSource;
  data: StudentGradesResult | null;
  semestersCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  copiedSummary: boolean;
  syncFeedback: SyncFeedback;
  onSwitchSource: (source: DataSource) => void;
  onRefresh: () => void;
  onCopySummary: () => void;
  onExportCSV: () => void;
  onDismissSyncFeedback: () => void;
  onNavigateToExternalAccounts?: () => void;
}

export function GradesHeaderSection({
  dataSource,
  data,
  semestersCount,
  isLoading,
  isRefreshing,
  copiedSummary,
  syncFeedback,
  onSwitchSource,
  onRefresh,
  onCopySummary,
  onExportCSV,
  onDismissSyncFeedback,
  onNavigateToExternalAccounts,
}: GradesHeaderSectionProps) {
  const summary = data?.summary;

  return (
    <>
      {/* Source Selector Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl sm:rounded-2xl">
          <button
            onClick={() => onSwitchSource('SLINK')}
            className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              dataSource === 'SLINK'
                ? 'bg-white text-violet-700 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-4 h-4 text-violet-600" />
            <span>Cổng PTIT S-Link</span>
            <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-black rounded-md">MỚI</span>
          </button>

          <button
            onClick={() => onSwitchSource('QLDTTX')}
            className={`px-3.5 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              dataSource === 'QLDTTX'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Cổng QLDTTX (qlht)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dataSource === 'SLINK' ? 'bg-violet-500' : 'bg-indigo-500'} inline-block animate-pulse`} />
          <span>Nguồn hiển thị:</span>
          <strong className="text-slate-800 font-semibold font-mono">
            {dataSource === 'SLINK' ? 'slink.ptit.edu.vn' : 'qldttx.pttc1.edu.vn'}
          </strong>
        </div>
      </div>

      {/* Top Banner / Quick Header */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className={`p-2.5 sm:p-3 ${dataSource === 'SLINK' ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600' : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600'} text-white rounded-xl sm:rounded-2xl shadow-xs shadow-indigo-500/20 shrink-0 mt-0.5 sm:mt-0`}>
            {dataSource === 'SLINK' ? <Award className="w-5 h-5 sm:w-6 sm:h-6" /> : <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-black text-slate-800">
                Bảng Điểm & Kết Quả Học Tập {dataSource === 'SLINK' ? '(PTIT S-Link)' : '(QLDTTX)'}
              </h2>
              {data?.isCachedDb ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" />
                  Đã Lưu CSDL
                </span>
              ) : data?.isLiveSync ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đồng bộ Trực Tuyến
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  Dữ Liệu Đã Lưu
                </span>
              )}

              {/* Last Update Badge */}
              {data?.lastSyncAt && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100/90 text-slate-700 border border-slate-200"
                  title={`Thời điểm kéo dữ liệu từ Cổng ${dataSource === 'SLINK' ? 'PTIT S-Link' : 'Quản Lý Đào Tạo Từ Xa (QLDTTX)'}`}
                >
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span>Cập nhật:</span>
                  <strong className="font-mono text-slate-900">{formatSyncDateTime(data.lastSyncAt)}</strong>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
              Cổng: <strong className="text-indigo-600 font-mono">{dataSource === 'SLINK' ? 'slink.ptit.edu.vn' : 'qldttx.pttc1.edu.vn'}</strong> • Tổng số <b>{semestersCount} học kỳ</b> ({summary?.totalSubjects || 0} học phần)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Active Pull button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className={`flex-1 sm:flex-initial px-3.5 py-2 ${dataSource === 'SLINK' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white text-xs font-bold rounded-xl sm:rounded-2xl transition-all shadow-xs shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95`}
            title={`Chủ động kết nối và kéo bảng điểm, điểm thành phần mới nhất từ Cổng ${dataSource === 'SLINK' ? 'PTIT S-Link' : 'Quản Lý Đào Tạo Từ Xa'}`}
          >
            {isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            )}
            <span>{isRefreshing ? 'Đang kéo...' : dataSource === 'SLINK' ? 'Đồng Bộ S-Link' : 'Đồng Bộ QLDTTX'}</span>
          </button>

          <button
            onClick={onCopySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl sm:rounded-2xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Sao chép tóm tắt kết quả học tập"
          >
            {copiedSummary ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? 'Đã chép' : 'Sao Chép'}</span>
          </button>

          <button
            onClick={onExportCSV}
            disabled={!data?.semesters?.length}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl sm:rounded-2xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Xuất bảng điểm ra file Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Message Banner */}
      {syncFeedback && (
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-rose-50 border-rose-200 text-rose-900 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {syncFeedback.type === 'success' ? (
              <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            ) : (
              <div className="p-1 bg-rose-500 text-white rounded-lg shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={onDismissSyncFeedback}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unlinked Account Notice Banner */}
      {!data?.hasLinkedAccount && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Chưa liên kết tài khoản {dataSource === 'SLINK' ? 'Cổng PTIT S-Link (slink.ptit.edu.vn)' : 'Cổng Quản Lý Đào Tạo Từ Xa (QLDTTX)'}
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                {dataSource === 'SLINK'
                  ? 'Liên kết tài khoản PTIT S-Link để hệ thống tự động trích xuất bảng điểm môn học, điểm quá trình, kết quả học kỳ và phân tích tiến độ học tập.'
                  : 'Liên kết tài khoản QLDTTX để hệ thống tự động trích xuất bảng điểm thi, điểm thành phần và phân tích tiến độ học tập chi tiết.'}
              </p>
            </div>
          </div>
          {onNavigateToExternalAccounts && (
            <button
              onClick={onNavigateToExternalAccounts}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>{dataSource === 'SLINK' ? 'Liên Kết S-Link Ngay' : 'Liên Kết QLĐT Ngay'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
