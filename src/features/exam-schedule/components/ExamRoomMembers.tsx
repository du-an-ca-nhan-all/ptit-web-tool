'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, BookOpen, Loader2 } from 'lucide-react';
import { ExamRecord } from '../types/exam.types';
import DataTable from './DataTable';

interface ExamRoomMembersProps {
  roomRecord: ExamRecord;
  allRecords?: ExamRecord[];
  batchCode?: string;
  onBack: () => void;
  onStudentClick: (maSV: string) => void;
  onClassClick: (maLop: string) => void;
  onTogglePostpone?: (record: ExamRecord, newStatus: boolean) => Promise<void> | void;
  canEditPostpone?: boolean;
}

const sortByName = (a: ExamRecord, b: ExamRecord) => {
  const nameCompare = (a.TenSV || '').localeCompare(b.TenSV || '');
  if (nameCompare !== 0) return nameCompare;
  return (a.HoLotSV || '').localeCompare(b.HoLotSV || '');
};

export default function ExamRoomMembers({
  roomRecord,
  allRecords = [],
  batchCode,
  onBack,
  onStudentClick,
  onClassClick,
  onTogglePostpone,
  canEditPostpone = false,
}: ExamRoomMembersProps) {
  const [roomMembers, setRoomMembers] = useState<ExamRecord[]>(() => {
    return allRecords
      .filter(
        (r) =>
          r.MaMH === roomRecord.MaMH &&
          r.NgayThi === roomRecord.NgayThi &&
          r.GioThi === roomRecord.GioThi &&
          r.MAPTHI === roomRecord.MAPTHI
      )
      .sort(sortByName);
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const existing = allRecords.filter(
      (r) =>
        r.MaMH === roomRecord.MaMH &&
        r.NgayThi === roomRecord.NgayThi &&
        r.GioThi === roomRecord.GioThi &&
        r.MAPTHI === roomRecord.MAPTHI
    );

    if (existing.length > 1 || allRecords.length > 50) {
      setRoomMembers(existing.sort(sortByName));
      return;
    }

    setIsLoading(true);
    const bCode = batchCode || roomRecord.batchCode || roomRecord.MaDotThi || '';
    const params = new URLSearchParams({
      all: 'true',
      subjectCode: roomRecord.MaMH || '',
      date: roomRecord.NgayThi || '',
    });
    if (bCode) params.set('batchCode', bCode);
    if (roomRecord.MAPTHI) params.set('mapThi', roomRecord.MAPTHI);
    if (roomRecord.GioThi) params.set('gioThi', roomRecord.GioThi);

    fetch(`/api/exam-records?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.records) {
          const matching = (data.records as ExamRecord[]).filter(
            (r) =>
              (!roomRecord.MAPTHI || r.MAPTHI === roomRecord.MAPTHI) &&
              (!roomRecord.GioThi || r.GioThi === roomRecord.GioThi)
          );
          setRoomMembers(matching.sort(sortByName));
        }
      })
      .catch((err) => console.error('Failed to fetch room members:', err))
      .finally(() => setIsLoading(false));
  }, [roomRecord, allRecords, batchCode]);

  const handlePostponeChange = async (record: ExamRecord, newStatus: boolean) => {
    setRoomMembers((prev) =>
      prev.map((r) => {
        const isMatch =
          (record.id !== undefined && r.id !== undefined && r.id === record.id) ||
          (String(r.MaSV || '').trim().toUpperCase() === String(record.MaSV || '').trim().toUpperCase() &&
            String(r.MaMH || '').trim() === String(record.MaMH || '').trim() &&
            String(r.MAPTHI || '').trim() === String(record.MAPTHI || '').trim() &&
            String(r.NgayThi || '').trim() === String(record.NgayThi || '').trim() &&
            String(r.GioThi || '').trim() === String(record.GioThi || '').trim());
        return isMatch ? { ...r, isPostponed: newStatus } : r;
      })
    );
    if (onTogglePostpone) {
      await onTogglePostpone(record, newStatus);
    }
  };

  const activeCount = useMemo(() => roomMembers.filter((r) => !r.isPostponed).length, [roomMembers]);
  const postponedCount = useMemo(() => roomMembers.filter((r) => r.isPostponed).length, [roomMembers]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition font-bold text-xs bg-white px-3.5 py-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Quay lại Lịch Thi</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-800">Danh Sách Sinh Viên Phòng Thi</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Tick chọn để hoãn thi / không thi đối với sinh viên không tham gia chia tiền phòng
                </p>
              </div>
            </div>
            {postponedCount > 0 && (
              <span className="text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 sm:px-3 py-1 rounded-full">
                {postponedCount} sinh viên hoãn thi / miễn chia tiền
              </span>
            )}
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Môn Thi</div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">{roomRecord.TenMH}</div>
                <div className="text-[11px] text-slate-500 font-mono">{roomRecord.MaMH}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Ngày Thi</div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm font-mono">{roomRecord.NgayThi}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Giờ Thi</div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm font-mono">{roomRecord.GioThi}</div>
                <div className="text-[11px] text-slate-500">{roomRecord.SoPhutThi} phút</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Phòng Thi</div>
                <div className="font-black text-indigo-700 text-xs sm:text-sm font-mono">{roomRecord.MAPTHI}</div>
                <div className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
                  <span className="font-bold text-slate-800">{activeCount}</span> dự thi
                  {postponedCount > 0 && <span className="text-amber-700 font-bold ml-1">({postponedCount} hoãn)</span>}
                  <span className="text-slate-400 ml-1">/ {roomMembers.length} SV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium">Đang tải danh sách sinh viên phòng thi...</p>
          </div>
        ) : (
          <DataTable
            records={roomMembers}
            sortConfig={null}
            onSortChange={() => {}}
            onStudentClick={onStudentClick}
            onClassClick={onClassClick}
            onTogglePostpone={handlePostponeChange}
            canEditPostpone={canEditPostpone}
          />
        )}
      </div>
    </div>
  );
}
