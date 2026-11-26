import React from 'react';
import { CalendarDays, Lock } from 'lucide-react';
import type {
  QldtViewLayout,
  StudentPersonalExamScheduleProps,
} from '../types/studentPersonalExam.types';
import { exportQldtExamsToCsv } from '../utils/studentExamScheduleUtils';
import { useStudentPersonalExamState } from '../hooks/useStudentPersonalExamState';
import SourceModeSwitcherBar from './personal-exam/SourceModeSwitcherBar';
import QldtHeaderCard from './personal-exam/QldtHeaderCard';
import QldtViewToolbar from './personal-exam/QldtViewToolbar';
import QldtMobileCards from './personal-exam/QldtMobileCards';
import QldtDesktopTable from './personal-exam/QldtDesktopTable';
import QldtGridView from './personal-exam/QldtGridView';
import QldtTimelineView from './personal-exam/QldtTimelineView';
import QldtPrintView from './personal-exam/QldtPrintView';
import QldtExamDetailModal from './personal-exam/QldtExamDetailModal';
import FileTongScheduleSection from './personal-exam/FileTongScheduleSection';
import ReviewMembersModal from './personal-exam/ReviewMembersModal';

export type { QldtViewLayout };

export default function StudentPersonalExamSchedule(props: StudentPersonalExamScheduleProps) {
  const { currentUser, onNavigateToExternalAccounts, records, totalRecords, setSelectedExamRoom } =
    props;

  const state = useStudentPersonalExamState({
    currentUser,
    records,
    setSelectedExamRoom,
  });

  const handleSelectSemester = (semesterId: number) => {
    state.setSelectedSemester(semesterId);
    state.fetchQldtExams(false, semesterId);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
      <SourceModeSwitcherBar
        viewSourceMode={state.viewSourceMode}
        onChangeMode={state.setViewSourceMode}
        qldtTotalExams={state.qldtData?.totalExams}
        totalFileRecords={totalRecords}
      />

      {state.viewSourceMode === 'QLDTTX' && (
        <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-200">
          <QldtHeaderCard
            qldtData={state.qldtData}
            selectedSemester={state.selectedSemester}
            isLoadingQldt={state.isLoadingQldt}
            isRefreshingQldt={state.isRefreshingQldt}
            errorType={state.errorType}
            syncFeedback={state.syncFeedback}
            onDismissFeedback={() => state.setSyncFeedback(null)}
            onSelectSemester={handleSelectSemester}
            onRefresh={() => state.fetchQldtExams(true, state.selectedSemester)}
            onExportCsv={() => exportQldtExamsToCsv(state.qldtData, currentUser.username)}
            onNavigateToExternalAccounts={onNavigateToExternalAccounts}
          />

          {state.qldtData?.exams && state.qldtData.exams.length > 0 && (
            <QldtViewToolbar
              layoutMode={state.layoutMode}
              onChangeLayoutMode={state.handleChangeLayoutMode}
              statusFilter={state.statusFilter}
              onChangeStatusFilter={state.setStatusFilter}
              totalCount={state.qldtData.exams.length}
              upcomingCount={state.qldtData.upcomingExams.length}
              pastCount={state.qldtData.pastExams.length}
              distinctFormats={state.distinctFormats}
              formatFilter={state.formatFilter}
              onChangeFormatFilter={state.setFormatFilter}
              searchQuery={state.searchQuery}
              onChangeSearchQuery={state.setSearchQuery}
            />
          )}

          {state.isLoadingQldt ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 min-h-[300px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600">
                Đang tải lịch thi cá nhân từ QLDTTX...
              </span>
            </div>
          ) : !state.qldtData?.isConfigured && state.errorType === 'NOT_CONFIGURED' ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto my-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-800">
                Chưa Cấu Hình Tài Khoản QLDTTX
              </h4>
              <p className="text-xs text-slate-600 max-w-md">
                Vui lòng cấu hình tài khoản Cổng Quản Lý Đào Tạo Từ Xa (PTTC1) để hệ thống tự động
                kéo thông tin lịch thi cá nhân, số báo danh và phòng thi.
              </p>
              {onNavigateToExternalAccounts && (
                <button
                  onClick={onNavigateToExternalAccounts}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
                >
                  Cấu Hình Tài Khoản Ngay
                </button>
              )}
            </div>
          ) : state.filteredQldtExams.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
                <CalendarDays className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-slate-800">Không Có Môn Thi Nào</h4>
              <p className="text-xs text-slate-500 max-w-md">
                {state.searchQuery || state.formatFilter !== 'ALL'
                  ? 'Không tìm thấy môn thi phù hợp với bộ lọc tìm kiếm.'
                  : 'Bạn không có môn thi nào trong học kỳ này hoặc nhà trường chưa công bố lịch thi.'}
              </p>
            </div>
          ) : state.layoutMode === 'TABLE' ? (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <QldtMobileCards
                exams={state.filteredQldtExams}
                onSelectExam={state.setSelectedExamModal}
              />
              <QldtDesktopTable
                exams={state.filteredQldtExams}
                tableSortKey={state.tableSortKey}
                onSortTable={state.handleSortTable}
                roomClassStatsLookup={state.roomClassStatsLookup}
                onSelectExam={state.setSelectedExamModal}
                onOpenRoomMembers={state.handleOpenRoomMembersFromQldt}
                onOpenReviewMembers={state.setReviewMembersModalRecord}
              />
            </div>
          ) : state.layoutMode === 'GRID' ? (
            <QldtGridView
              exams={state.filteredQldtExams}
              roomClassStatsLookup={state.roomClassStatsLookup}
              onSelectExam={state.setSelectedExamModal}
              onOpenRoomMembers={state.handleOpenRoomMembersFromQldt}
              onOpenReviewMembers={state.setReviewMembersModalRecord}
            />
          ) : state.layoutMode === 'TIMELINE' ? (
            <QldtTimelineView
              timelineGroups={state.timelineGroups}
              roomClassStatsLookup={state.roomClassStatsLookup}
              onSelectExam={state.setSelectedExamModal}
              onOpenRoomMembers={state.handleOpenRoomMembersFromQldt}
              onOpenReviewMembers={state.setReviewMembersModalRecord}
            />
          ) : (
            <QldtPrintView
              currentUser={currentUser}
              semesterName={state.qldtData?.semesterName}
              exams={state.filteredQldtExams}
              onPrint={() => window.print()}
            />
          )}

          {state.selectedExamModal && (
            <QldtExamDetailModal
              exam={state.selectedExamModal}
              copiedId={state.copiedId}
              roomClassStatsLookup={state.roomClassStatsLookup}
              onClose={() => state.setSelectedExamModal(null)}
              onCopyText={state.handleCopyText}
              onOpenRoomMembers={state.handleOpenRoomMembersFromQldt}
              onOpenReviewMembers={state.setReviewMembersModalRecord}
            />
          )}
        </div>
      )}

      {state.viewSourceMode === 'FILE_TONG' && (
        <FileTongScheduleSection
          {...props}
          onOpenReviewMembers={state.setReviewMembersModalRecord}
        />
      )}

      {state.reviewMembersModalRecord && (
        <ReviewMembersModal
          record={state.reviewMembersModalRecord}
          currentUser={currentUser}
          onClose={() => state.setReviewMembersModalRecord(null)}
          onViewAllRoomMembers={(target) => {
            state.setReviewMembersModalRecord(null);
            state.handleOpenRoomMembersFromQldt(target);
          }}
        />
      )}
    </div>
  );
}
