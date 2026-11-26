import React from 'react';
import { X, Users, MapPin, Calendar, Clock, BookOpen } from 'lucide-react';
import { RoomStudentsModalProps } from './room-students-modal/types';
import { useRoomStudentsModal } from './room-students-modal/useRoomStudentsModal';
import RoomStudentsToolbar from './room-students-modal/RoomStudentsToolbar';
import RoomStudentsTable from './room-students-modal/RoomStudentsTable';

export default function RoomStudentsModal({
  isOpen,
  onClose,
  session,
  records = [],
  userClass = '',
  initialClassFilter = 'ALL',
}: RoomStudentsModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    copiedMssv,
    roomRecords,
    classBreakdown,
    filteredStudents,
    handleCopyAllMssv,
  } = useRoomStudentsModal({
    isOpen,
    session,
    records,
    initialClassFilter,
  });

  if (!isOpen || !session) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">
                  Danh Sách Sinh Viên Trong Phòng
                </h3>
                <span className="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                  Phòng {session.room}
                </span>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-lg">
                  {roomRecords.length} SV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px] sm:max-w-xl">
                {session.subject} {session.subjectCode ? `(${session.subjectCode})` : ''} • {session.date} lúc {session.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info Banner */}
        <div className="px-5 py-3 bg-blue-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-medium" title={session.subject}>
              Môn: <strong className="text-slate-900 font-bold">{session.subject}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Ngày: <strong className="text-slate-900 font-bold">{session.date}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Giờ: <strong className="text-slate-900 font-bold">{session.time}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Phòng: <strong className="text-rose-700 font-bold">{session.room}</strong>
              {session.examFormat && (
                <span className="ml-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                  {session.examFormat}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Class Filters, Copy */}
        <RoomStudentsToolbar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          copiedMssv={copiedMssv}
          onCopyAllMssv={handleCopyAllMssv}
          filteredCount={filteredStudents.length}
          totalCount={roomRecords.length}
          classBreakdown={classBreakdown}
          userClass={userClass}
        />

        {/* Students Table */}
        <RoomStudentsTable
          students={filteredStudents}
          searchQuery={searchQuery}
          userClass={userClass}
        />

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Đang hiển thị <strong>{filteredStudents.length}</strong> / <strong>{roomRecords.length}</strong> sinh viên
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
