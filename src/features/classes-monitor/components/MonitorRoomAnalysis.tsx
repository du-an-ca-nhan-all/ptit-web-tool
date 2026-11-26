'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Check,
  Copy,
  Crown,
  Download,
  Filter,
  GitBranch,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Split,
  Users,
  X,
} from 'lucide-react';
import { ExamBatchItem, LoginUser, isUserAdmin } from '../../../types';
import {
  ExamDateTimeSortOrder,
  ReferenceCandidate,
  ReferenceStudentInfo,
  RoomAnalysisRecord,
  RoomCountOperator,
  SplitFilterMode,
  StudentScope,
  analyzeClassRooms,
  formatGroupLabel,
  matchesRoomCount,
  sortAnalyzedRecords,
  sortAnalyzedRooms,
} from '../types/roomAnalysis.types';
import RoomAnalysisSplitTable from './RoomAnalysisSplitTable';
import RoomAnalysisRoomsList from './RoomAnalysisRoomsList';

interface MonitorRoomAnalysisProps {
  currentUser: LoginUser;
  availableClasses: string[];
  initialClassCode?: string;
  examBatches: ExamBatchItem[];
  activeBatch: ExamBatchItem | null;
  onSelectStudentSchedule?: (studentId: string) => void;
}

type ViewTab = 'SPLIT_STUDENTS' | 'ROOMS_BY_COUNT';

const OPERATOR_LABELS: Record<RoomCountOperator, string> = {
  ALL: 'Mọi sĩ số',
  LT: '< Nhỏ hơn',
  LTE: '<= Nhỏ hơn hoặc bằng',
  GT: '> Lớn hơn',
  GTE: '>= Lớn hơn hoặc bằng',
  EQ: '= Bằng đúng',
};

const QUICK_ROOM_PRESETS: Array<{ label: string; op: RoomCountOperator; n: number }> = [
  { label: '< 3 SV', op: 'LT', n: 3 },
  { label: '< 5 SV', op: 'LT', n: 5 },
  { label: '>= 5 SV', op: 'GTE', n: 5 },
  { label: '>= 10 SV', op: 'GTE', n: 10 },
];

export default function MonitorRoomAnalysis({
  currentUser,
  availableClasses,
  initialClassCode,
  examBatches,
  activeBatch,
  onSelectStudentSchedule,
}: MonitorRoomAnalysisProps) {
  const adminMode = isUserAdmin(currentUser);

  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(
    activeBatch?.code || examBatches[0]?.code || ''
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    adminMode
      ? initialClassCode || currentUser.lop || availableClasses[0] || ''
      : currentUser.lop || initialClassCode || availableClasses[0] || ''
  );
  const [selectedRefMaSV, setSelectedRefMaSV] = useState<string>('');

  // API state
  const [records, setRecords] = useState<RoomAnalysisRecord[]>([]);
  const [referenceRecords, setReferenceRecords] = useState<RoomAnalysisRecord[]>([]);
  const [referenceStudent, setReferenceStudent] = useState<ReferenceStudentInfo | null>(null);
  const [candidates, setCandidates] = useState<ReferenceCandidate[]>([]);
  const [reviewRegisteredCount, setReviewRegisteredCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [scope, setScope] = useState<StudentScope>('CLASS');
  const [viewTab, setViewTab] = useState<ViewTab>('SPLIT_STUDENTS');
  const [splitFilter, setSplitFilter] = useState<SplitFilterMode>('ALL_SPLIT');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [roomCountOp, setRoomCountOp] = useState<RoomCountOperator>('ALL');
  const [roomCountN, setRoomCountN] = useState<number>(5);
  const [onlyNonMonitorRooms, setOnlyNonMonitorRooms] = useState<boolean>(false);
  const [hidePostponed, setHidePostponed] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [examTimeSort, setExamTimeSort] = useState<ExamDateTimeSortOrder>('DATE_ASC');

  const toggleExamTimeSort = useCallback(() => {
    setExamTimeSort((prev) => (prev === 'DATE_ASC' ? 'DATE_DESC' : 'DATE_ASC'));
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (activeBatch?.code) {
      setSelectedBatchCode(activeBatch.code);
    } else if (!selectedBatchCode && examBatches.length > 0) {
      setSelectedBatchCode(examBatches[0].code);
    }
  }, [activeBatch?.code, examBatches, selectedBatchCode]);

  const fetchAnalysis = useCallback(async () => {
    if (!selectedBatchCode || !selectedClass) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        batchCode: selectedBatchCode,
        classCode: selectedClass,
      });
      if (selectedRefMaSV) {
        params.set('referenceMaSV', selectedRefMaSV);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`/api/class-monitors/room-analysis?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.records || []);
        setReferenceRecords(data.referenceRecords || []);
        setReferenceStudent(data.referenceStudent || null);
        setCandidates(data.candidates || []);
        setReviewRegisteredCount(data.reviewRegisteredCount || 0);
      } else {
        setErrorMsg(data.error || 'Không thể tải dữ liệu phân tích phòng thi');
      }
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBatchCode, selectedClass, selectedRefMaSV]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Reset reference student when class changes
  const handleClassChange = (nextClass: string) => {
    setSelectedClass(nextClass);
    setSelectedRefMaSV('');
    setSelectedSubject('ALL');
  };

  // Run analysis whenever scope / hidePostponed / data changes
  const { analyzedRecords, analyzedRooms } = useMemo(
    () =>
      analyzeClassRooms({
        allClassRecords: records,
        referenceRecords,
        scope,
        hidePostponed,
      }),
    [records, referenceRecords, scope, hidePostponed]
  );

  // Distinct subjects in current scope
  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of analyzedRecords) {
      if (r.maMH && !map.has(r.maMH)) {
        map.set(r.maMH, r.tenMH || r.maMH);
      }
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [analyzedRecords]);

  // Base subject-filtered records & rooms for accurate summary counters
  const subjectRecords = useMemo(() => {
    if (selectedSubject === 'ALL') return analyzedRecords;
    return analyzedRecords.filter((r) => r.maMH === selectedSubject);
  }, [analyzedRecords, selectedSubject]);

  const splitCounts = useMemo(() => {
    let sameGroup = 0;
    let diffGroup = 0;
    let sameRoom = 0;
    let noMonitor = 0;
    const splitStudentIds = new Set<string>();

    for (const r of subjectRecords) {
      if (r.splitStatus === 'SPLIT_SAME_GROUP') {
        sameGroup += 1;
        splitStudentIds.add(r.maSV);
      } else if (r.splitStatus === 'SPLIT_DIFF_GROUP') {
        diffGroup += 1;
        splitStudentIds.add(r.maSV);
      } else if (r.splitStatus === 'SAME_ROOM') {
        sameRoom += 1;
      } else {
        noMonitor += 1;
      }
    }

    return {
      total: subjectRecords.length,
      allSplit: sameGroup + diffGroup,
      uniqueSplitStudents: splitStudentIds.size,
      sameGroup,
      diffGroup,
      sameRoom,
      noMonitor,
    };
  }, [subjectRecords]);

  // Filtered student records for Tab 1
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = subjectRecords.filter((r) => {
      if (splitFilter === 'ALL_SPLIT') {
        if (r.splitStatus !== 'SPLIT_SAME_GROUP' && r.splitStatus !== 'SPLIT_DIFF_GROUP') {
          return false;
        }
      } else if (splitFilter !== 'ALL' && r.splitStatus !== splitFilter) {
        return false;
      }

      if (!matchesRoomCount(r.scopeRoomCount, roomCountOp, roomCountN)) {
        return false;
      }

      if (q) {
        const groupStr = formatGroupLabel(r).toLowerCase();
        const hit =
          r.maSV.toLowerCase().includes(q) ||
          r.hoTen.toLowerCase().includes(q) ||
          r.mapThi.toLowerCase().includes(q) ||
          r.monitorRoom.toLowerCase().includes(q) ||
          r.maMH.toLowerCase().includes(q) ||
          r.tenMH.toLowerCase().includes(q) ||
          groupStr.includes(q);
        if (!hit) return false;
      }
      return true;
    });

    return sortAnalyzedRecords(matched, examTimeSort);
  }, [subjectRecords, splitFilter, roomCountOp, roomCountN, searchQuery, examTimeSort]);

  // Filtered rooms for Tab 2
  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matched = analyzedRooms.filter((room) => {
      if (selectedSubject !== 'ALL' && room.maMH !== selectedSubject) return false;
      if (onlyNonMonitorRooms && room.isMonitorRoom) return false;
      if (!matchesRoomCount(room.scopeCount, roomCountOp, roomCountN)) return false;

      if (q) {
        const roomHit =
          room.mapThi.toLowerCase().includes(q) ||
          room.maMH.toLowerCase().includes(q) ||
          room.tenMH.toLowerCase().includes(q) ||
          room.monitorRoomForSubject.toLowerCase().includes(q) ||
          room.members.some(
            (m) =>
              m.maSV.toLowerCase().includes(q) ||
              m.hoTen.toLowerCase().includes(q) ||
              formatGroupLabel(m).toLowerCase().includes(q)
          );
        if (!roomHit) return false;
      }
      return true;
    });

    return sortAnalyzedRooms(matched, examTimeSort);
  }, [
    analyzedRooms,
    selectedSubject,
    onlyNonMonitorRooms,
    roomCountOp,
    roomCountN,
    searchQuery,
    examTimeSort,
  ]);

  const handleCopyResult = async () => {
    const scopeLabel = scope === 'REVIEW' ? 'AE Ôn Tập' : 'Cả Lớp';
    let text = '';

    if (viewTab === 'SPLIT_STUDENTS') {
      if (filteredRecords.length === 0) {
        showToast('Không có dữ liệu sinh viên để sao chép', 'error');
        return;
      }
      const header = `DANH SÁCH SV BỊ TÁCH PHÒNG - LỚP ${selectedClass} (${scopeLabel})\nĐợt thi: ${selectedBatchCode} | Chuẩn LT: ${
        referenceStudent ? `${referenceStudent.hoTen} (${referenceStudent.maSV})` : '—'
      }\nTổng: ${filteredRecords.length} lượt thi\n`;

      const lines = filteredRecords.map((r, i) => {
        const statusLabel =
          r.splitStatus === 'SPLIT_SAME_GROUP'
            ? 'Cùng tổ/nhóm bị tách'
            : r.splitStatus === 'SPLIT_DIFF_GROUP'
            ? 'Khác tổ/nhóm bị tách'
            : r.splitStatus === 'SAME_ROOM'
            ? 'Cùng phòng LT'
            : 'LT không thi';
        return `${i + 1}. ${r.maSV} - ${r.hoTen} | ${r.tenMH} | Phòng: ${r.mapThi} (${r.ngayThi} ${r.gioThi}) | Phòng LT: ${
          r.monitorRoom || '—'
        } | ${statusLabel}`;
      });
      text = `${header}\n${lines.join('\n')}`;
    } else {
      if (filteredRooms.length === 0) {
        showToast('Không có dữ liệu phòng thi để sao chép', 'error');
        return;
      }
      const condText =
        roomCountOp === 'ALL' ? 'Mọi sĩ số' : `${OPERATOR_LABELS[roomCountOp]} ${roomCountN}`;
      const header = `DANH SÁCH PHÒNG THI LỚP ${selectedClass} (${scopeLabel} · ${condText})\nĐợt thi: ${selectedBatchCode} | Tổng: ${filteredRooms.length} phòng\n`;

      const lines = filteredRooms.map((room, i) => {
        const memberNames = room.members.map((m) => `${m.maSV} ${m.hoTen}`).join(', ');
        const tag = room.isMonitorRoom
          ? '[Phòng LT]'
          : room.hasMonitorExamForSubject
          ? `[Tách khỏi LT: ${room.monitorRoomForSubject}]`
          : '[LT không thi]';
        return `${i + 1}. Phòng ${room.mapThi} ${tag} - ${room.tenMH} (${room.ngayThi} ${room.gioThi}) - ${room.scopeCount} SV:\n   ${memberNames}`;
      });
      text = `${header}\n${lines.join('\n\n')}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Đã sao chép kết quả vào bộ nhớ tạm');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      showToast('Trình duyệt không hỗ trợ sao chép tự động', 'error');
    }
  };

  const handleExportCSV = () => {
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    if (viewTab === 'SPLIT_STUDENTS') {
      if (filteredRecords.length === 0) {
        showToast('Không có dữ liệu để xuất CSV', 'error');
        return;
      }
      const headers = [
        'STT',
        'Mã SV',
        'Họ và Tên',
        'SĐT',
        'Đăng ký ôn tập',
        'Mã MH',
        'Tên môn thi',
        'Phòng SV',
        'Ngày thi SV',
        'Giờ thi SV',
        'Sĩ số trong phòng',
        'Phòng Lớp Trưởng',
        'Ngày/Giờ LT',
        'Tổ/Nhóm SV',
        'Tổ/Nhóm LT',
        'Trạng thái',
      ];
      const rows = filteredRecords.map((r, i) => [
        i + 1,
        r.maSV,
        r.hoTen,
        r.soDienThoai,
        r.isReviewRegistered ? 'Có' : 'Không',
        r.maMH,
        r.tenMH,
        r.mapThi,
        r.ngayThi,
        r.gioThi,
        r.scopeRoomCount,
        r.monitorRoom || '',
        r.monitorRoom ? `${r.monitorDate} ${r.monitorTime}` : '',
        formatGroupLabel(r),
        r.monitorRoom
          ? formatGroupLabel({
              nhomHoc: r.monitorNhomHoc,
              toThi: r.monitorToThi,
              nhomThi: r.monitorNhomThi,
            })
          : '',
        r.splitStatus,
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Tach_Phong_${selectedClass}_${selectedBatchCode}_${scope}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Đã xuất ${filteredRecords.length} dòng dữ liệu`);
    } else {
      if (filteredRooms.length === 0) {
        showToast('Không có phòng thi nào để xuất CSV', 'error');
        return;
      }
      const headers = [
        'STT',
        'Phòng thi',
        'Mã MH',
        'Tên môn thi',
        'Ngày thi',
        'Giờ thi',
        'Phòng Lớp Trưởng',
        'Là phòng LT',
        'SL theo bộ lọc',
        'SL Cả lớp',
        'SL AE ôn tập',
        'Tổng phòng',
        'Danh sách SV',
      ];
      const rows = filteredRooms.map((room, i) => [
        i + 1,
        room.mapThi,
        room.maMH,
        room.tenMH,
        room.ngayThi,
        room.gioThi,
        room.monitorRoomForSubject || '',
        room.isMonitorRoom ? 'Có' : 'Không',
        room.scopeCount,
        room.classCount,
        room.reviewCount,
        room.roomTotalCount,
        room.members.map((m) => `${m.maSV} - ${m.hoTen}`).join('; '),
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Loc_Phong_Thi_${selectedClass}_${selectedBatchCode}_${scope}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Đã xuất ${filteredRooms.length} phòng thi`);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Split className="w-7 h-7 text-rose-600" />
              Lọc Tách Phòng &amp; Sĩ Số Phòng Thi
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Lớp Trưởng
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Lọc sinh viên bị tách phòng (cùng hoặc khác tổ/nhóm) dựa theo phòng thi của Lớp trưởng,
            lọc phòng theo số lượng thành viên (&gt; / &lt; N) cho Cả lớp hoặc AE ôn tập.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyResult}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép' : 'Copy kết quả'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Xuất CSV
          </button>

          <button
            type="button"
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Context Controls: Batch, Class, Reference Monitor, Scope Switch */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Batch selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> Đợt thi:
              </span>
              {examBatches.length > 0 ? (
                <select
                  value={selectedBatchCode}
                  onChange={(e) => setSelectedBatchCode(e.target.value)}
                  className="bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {examBatches.map((batch) => (
                    <option key={batch.code} value={batch.code}>
                      {batch.name} ({batch.code}){batch.isActive ? ' ★' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  Chưa có đợt thi
                </span>
              )}
            </div>

            {/* Class selector (editable for Admin, fixed badge for Monitor) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Lớp:
              </span>
              {adminMode && availableClasses.length > 0 ? (
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-black border border-slate-200">
                  {selectedClass || '—'}
                </span>
              )}
            </div>

            {/* Reference Monitor Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                <Crown className="w-3.5 h-3.5 text-amber-500" /> Phòng chuẩn:
              </span>
              <select
                value={selectedRefMaSV || referenceStudent?.maSV || ''}
                onChange={(e) => setSelectedRefMaSV(e.target.value)}
                className="bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[260px]"
              >
                {candidates.length === 0 && referenceStudent && (
                  <option value={referenceStudent.maSV}>
                    {referenceStudent.hoTen} ({referenceStudent.maSV})
                  </option>
                )}
                {candidates.map((c) => (
                  <option key={c.maSV} value={c.maSV}>
                    {c.isMonitor ? '★ LT: ' : ''}
                    {c.hoTen} ({c.maSV}) · {c.examCount} môn
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope Toggle: Danh sách lớp vs AE ôn tập */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setScope('CLASS')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'CLASS'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Danh sách lớp
              </button>
              <button
                type="button"
                onClick={() => setScope('REVIEW')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scope === 'REVIEW'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                AE ôn tập ({reviewRegisteredCount})
              </button>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hidePostponed}
                onChange={(e) => setHidePostponed(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Ẩn SV hoãn thi
            </label>
          </div>
        </div>

        {scope === 'REVIEW' && reviewRegisteredCount === 0 && !isLoading && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Chưa có sinh viên nào được đánh dấu trong mục <strong>Đăng Ký Ôn Tập</strong> cho đợt
              thi <strong>{selectedBatchCode}</strong>. Hãy cập nhật danh sách ôn tập trước để lọc
              theo AE ôn tập.
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bị Tách Phòng
            </p>
            <p className="text-2xl font-black text-slate-800">{splitCounts.allSplit}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {splitCounts.uniqueSplitStudents} sinh viên khác phòng LT
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center gap-4 ring-1 ring-rose-500/10">
          <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
              Cùng Tổ/Nhóm Bị Tách
            </p>
            <p className="text-2xl font-black text-rose-700">{splitCounts.sameGroup}</p>
            <p className="text-[11px] text-slate-500 font-medium">Lượt thi cần chú ý nhất</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Khác Tổ/Nhóm Bị Tách
            </p>
            <p className="text-2xl font-black text-amber-700">{splitCounts.diffGroup}</p>
            <p className="text-[11px] text-slate-500 font-medium">Khác tổ/nhóm &amp; khác phòng</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Phòng Khớp Bộ Lọc
            </p>
            <p className="text-2xl font-black text-indigo-700">
              {filteredRooms.length}
              <span className="text-sm font-bold text-slate-400"> / {analyzedRooms.length}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {scope === 'REVIEW' ? 'Theo AE ôn tập' : 'Theo danh sách lớp'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* View Mode Switcher */}
        <div className="px-4 pt-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab('SPLIT_STUDENTS')}
              className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                viewTab === 'SPLIT_STUDENTS'
                  ? 'border-rose-600 text-rose-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Split className="w-4 h-4" />
              SV Bị Tách Phòng ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('ROOMS_BY_COUNT')}
              className={`px-4 py-2.5 text-xs font-black rounded-t-xl border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                viewTab === 'ROOMS_BY_COUNT'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Lọc Phòng Theo Sĩ Số ({filteredRooms.length})
            </button>
          </div>

          {/* Subject Filter + Exam Date/Time Sort */}
          <div className="pb-2 sm:pb-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleExamTimeSort}
              title="Đảo chiều sắp xếp theo ngày giờ thi"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl px-3 py-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {examTimeSort === 'DATE_ASC' ? (
                <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>
                Ngày giờ thi: {examTimeSort === 'DATE_ASC' ? 'Sớm → Muộn' : 'Muộn → Sớm'}
              </span>
            </button>

            <span className="text-[11px] font-bold text-slate-400 uppercase">Môn thi:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[240px]"
            >
              <option value="ALL">Tất cả môn ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          {/* Row 1: Room Member Count Filter (> / < N) */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Sĩ số phòng ({scope === 'REVIEW' ? 'AE ôn tập' : 'SV lớp'}):
            </span>

            <select
              value={roomCountOp}
              onChange={(e) => setRoomCountOp(e.target.value as RoomCountOperator)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {(Object.keys(OPERATOR_LABELS) as RoomCountOperator[]).map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_LABELS[op]}
                </option>
              ))}
            </select>

            {roomCountOp !== 'ALL' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={roomCountN}
                  onChange={(e) => setRoomCountN(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  className="w-18 px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-black text-indigo-700 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-500">SV</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap ml-0 sm:ml-2">
              {QUICK_ROOM_PRESETS.map((preset) => {
                const isActive = roomCountOp === preset.op && roomCountN === preset.n;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setRoomCountOp('ALL');
                      } else {
                        setRoomCountOp(preset.op);
                        setRoomCountN(preset.n);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}

              {roomCountOp !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setRoomCountOp('ALL')}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  Xóa lọc N
                </button>
              )}
            </div>

            {viewTab === 'ROOMS_BY_COUNT' && (
              <label className="ml-auto inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyNonMonitorRooms}
                  onChange={(e) => setOnlyNonMonitorRooms(e.target.checked)}
                  className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                Chỉ phòng tách khỏi LT
              </label>
            )}
          </div>

          {/* Row 2: Split Status Pills (for Tab 1) + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {viewTab === 'SPLIT_STUDENTS' ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'ALL_SPLIT', label: `Tất cả bị tách (${splitCounts.allSplit})` },
                    { id: 'SPLIT_SAME_GROUP', label: `Cùng tổ/nhóm (${splitCounts.sameGroup})` },
                    { id: 'SPLIT_DIFF_GROUP', label: `Khác tổ/nhóm (${splitCounts.diffGroup})` },
                    { id: 'SAME_ROOM', label: `Cùng phòng LT (${splitCounts.sameRoom})` },
                    { id: 'NO_MONITOR_EXAM', label: `LT không thi (${splitCounts.noMonitor})` },
                    { id: 'ALL', label: `Tất cả (${splitCounts.total})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSplitFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      splitFilter === pill.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                Bấm vào từng phòng thi để xem danh sách sinh viên chi tiết bên trong.
              </p>
            )}

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm Mã SV, tên, phòng, môn, tổ..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="m-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Data Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold">
              Đang phân tích phòng thi lớp {selectedClass}...
            </p>
          </div>
        ) : viewTab === 'SPLIT_STUDENTS' ? (
          <RoomAnalysisSplitTable
            records={filteredRecords}
            scope={scope}
            examTimeSort={examTimeSort}
            onToggleExamTimeSort={toggleExamTimeSort}
            onStudentClick={onSelectStudentSchedule}
          />
        ) : (
          <RoomAnalysisRoomsList
            rooms={filteredRooms}
            scope={scope}
            onStudentClick={onSelectStudentSchedule}
          />
        )}
      </div>
    </div>
  );
}
