import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, BookOpen, Loader2 } from 'lucide-react';
import { ExamRecord } from '../types';
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
    return allRecords.filter(r => 
      r.MaMH === roomRecord.MaMH &&
      r.NgayThi === roomRecord.NgayThi &&
      r.GioThi === roomRecord.GioThi &&
      r.MAPTHI === roomRecord.MAPTHI
    ).sort(sortByName);
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if allRecords has multiple records for this room or is a full batch dataset
    const existing = allRecords.filter(r => 
      r.MaMH === roomRecord.MaMH &&
      r.NgayThi === roomRecord.NgayThi &&
      r.GioThi === roomRecord.GioThi &&
      r.MAPTHI === roomRecord.MAPTHI
    );

    if (existing.length > 1 || allRecords.length > 50) {
      setRoomMembers(existing.sort(sortByName));
      return;
    }

    // Lazy load room members from API for minimal payload
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
          const matching = (data.records as ExamRecord[]).filter((r) =>
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

  const activeCount = useMemo(() => roomMembers.filter(r => !r.isPostponed).length, [roomMembers]);
  const postponedCount = useMemo(() => roomMembers.filter(r => r.isPostponed).length, [roomMembers]);

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Danh Sách Sinh Viên Phòng Thi</h2>
                <p className="text-xs text-slate-500">Tick chọn để hoãn thi / không thi đối với sinh viên không tham gia chia tiền phòng</p>
              </div>
            </div>
            {postponedCount > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full">
                {postponedCount} sinh viên hoãn thi / miễn chia tiền
              </span>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <BookOpen className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Môn Thi</div>
                <div className="font-medium text-slate-800">{roomRecord.TenMH}</div>
                <div className="text-sm text-slate-500 font-mono">{roomRecord.MaMH}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Ngày Thi</div>
                <div className="font-medium text-slate-800">{roomRecord.NgayThi}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Giờ Thi</div>
                <div className="font-medium text-slate-800">{roomRecord.GioThi}</div>
                <div className="text-sm text-slate-500">{roomRecord.SoPhutThi} phút</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Phòng Thi</div>
                <div className="font-medium text-slate-800">{roomRecord.MAPTHI}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  <span className="font-bold text-slate-800">{activeCount}</span> dự thi
                  {postponedCount > 0 && <span className="text-amber-700 font-bold ml-1">({postponedCount} hoãn)</span>}
                  <span className="text-slate-400 ml-1">/ Tổng {roomMembers.length} SV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
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
