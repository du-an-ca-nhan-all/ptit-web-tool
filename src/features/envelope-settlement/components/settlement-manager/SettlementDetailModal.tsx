import React from 'react';
import { DollarSign, FileText, CheckCircle2, X, Users } from 'lucide-react';
import { ExamRecord } from '../../../../types';
import { formatCurrency } from '../../../../config/pricingConfig';
import { ActiveDetailCalc, ClassCountItem, DebtDetail } from './types';
import { SettlementDetailStudentList } from './SettlementDetailStudentList';

interface SettlementDetailModalProps {
  selectedDetail: DebtDetail;
  onClose: () => void;
  activeDetailCalc: ActiveDetailCalc | null;
  excludedCountForModal: number;
  showStudentList: boolean;
  onToggleStudentList: () => void;
  onOpenStudentListForClass: (clsName: string) => void;
  currentRoomRecords: ExamRecord[];
  filteredStudentRecords: ExamRecord[];
  modalClassCounts: ClassCountItem[];
  monitorClasses: Set<string>;
  effectiveClassCountsForModal: Map<string, number>;
  getMonitorName: (cls: string) => string;
  studentListRef: React.RefObject<HTMLDivElement | null>;
  studentClassFilter: string;
  onSelectClassFilter: (cls: string) => void;
  studentSearchQuery: string;
  onSearchQueryChange: (q: string) => void;
  isStudentExcluded: (sessionId: string, r: ExamRecord) => boolean;
  onToggleStudentExclusion: (session: any, r: ExamRecord) => void;
  onClearSessionExclusions: (session: any) => void;
}

export function SettlementDetailModal({
  selectedDetail,
  onClose,
  activeDetailCalc,
  excludedCountForModal,
  showStudentList,
  onToggleStudentList,
  onOpenStudentListForClass,
  currentRoomRecords,
  filteredStudentRecords,
  modalClassCounts,
  monitorClasses,
  effectiveClassCountsForModal,
  getMonitorName,
  studentListRef,
  studentClassFilter,
  onSelectClassFilter,
  studentSearchQuery,
  onSearchQueryChange,
  isStudentExcluded,
  onToggleStudentExclusion,
  onClearSessionExclusions,
}: SettlementDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-slate-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Chi Tiết Phân Bổ Chi Phí Phòng Thi
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6 min-h-0">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Môn & Phòng</p>
              <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.room}</p>
              <p className="text-sm font-medium text-slate-600">{selectedDetail.session.subject} ({selectedDetail.session.subjectCode})</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Thời gian thi</p>
              <p className="font-bold text-slate-800 text-lg">{selectedDetail.session.time}</p>
              <p className="text-sm font-medium text-slate-600">{selectedDetail.session.date}</p>
            </div>
          </div>

          {/* Cost Calculation */}
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-5">
            <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
              <DollarSign className="w-5 h-5" />
              Bài toán chia tiền
              {excludedCountForModal > 0 && (
                <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">
                  {excludedCountForModal} SV bị loại khỏi chia tiền
                </span>
              )}
            </h4>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex justify-between items-center">
                <span>Tổng định mức kinh phí nước uống:</span>
                <span className="font-bold text-base">{formatCurrency(activeDetailCalc?.totalRoomPrice ?? selectedDetail.totalRoomPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Số SV tham gia chia tiền (thuộc các lớp có LT):</span>
                <span className="font-bold text-base">{activeDetailCalc?.totalMonitoredStudents ?? (selectedDetail.totalRoomPrice / (selectedDetail.pricePerStudent || 1))} SV</span>
              </div>
              {excludedCountForModal > 0 && (
                <div className="flex justify-between items-center text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <span className="font-semibold">SV bị loại (hoãn thi / không tính):</span>
                  <span className="font-bold">- {excludedCountForModal} SV</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-blue-100">
                <span className="font-semibold">Đơn giá trên mỗi Sinh Viên:</span>
                <span className="font-bold text-rose-600 text-base">{formatCurrency(activeDetailCalc?.pricePerStudent ?? selectedDetail.pricePerStudent)}/SV</span>
              </div>
            </div>
          </div>

          {/* Class Distribution */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-700">Phân bổ sinh viên trong phòng</h4>
              <button
                onClick={onToggleStudentList}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                {showStudentList ? 'Ẩn danh sách SV' : `Xem tất cả SV (${currentRoomRecords.length})`}
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200">Tên Lớp</th>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 text-center">Số SV chia tiền</th>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200">Trạng thái Lớp Trưởng</th>
                    <th className="px-4 py-2 font-semibold border-b border-slate-200 text-right">Danh sách SV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modalClassCounts.map((c: any, i: number) => {
                    const hasMonitor = monitorClasses.has(c.className);
                    const isResponsible = c.className === selectedDetail.toClass;
                    const isPaying = c.className === selectedDetail.fromClass;
                    const effectiveCount = effectiveClassCountsForModal.get(c.className) ?? 0;
                    const excludedInClass = c.count - effectiveCount;
                    const monName = getMonitorName(c.className);

                    return (
                      <tr key={i} className={isResponsible ? 'bg-emerald-50/70' : isPaying ? 'bg-rose-50/70' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                          {c.className}
                          {isResponsible && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">
                              {selectedDetail.session?.isClaimedManual ? 'Chủ động nhận đi PB' : 'Đại diện lấy PB'}
                            </span>
                          )}
                          {isPaying && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-bold border border-rose-200 uppercase">
                              Đang thanh toán
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-slate-700">{effectiveCount}</span>
                            {excludedInClass > 0 && (
                              <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 rounded">
                                -{excludedInClass} bỏ ra
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {hasMonitor ? (
                            <div className="flex flex-col">
                              <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Lớp có Lớp Trưởng
                              </span>
                              {isResponsible && selectedDetail.session?.assignmentInfo?.assistantStudentName ? (
                                <span className="text-indigo-700 text-[11px] font-semibold">
                                  SV hỗ trợ đi PB: <strong>{selectedDetail.session.assignmentInfo.assistantStudentName}</strong> ({selectedDetail.session.assignmentInfo.assistantStudentId})
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px] font-medium">
                                  LT: <strong className="text-slate-700 font-bold">{monName}</strong>
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-slate-500 text-xs">
                                {isResponsible && selectedDetail.session?.assignmentInfo?.assistantStudentName ? (
                                  <span className="text-indigo-700 text-[11px] font-semibold">
                                    SV hỗ trợ đi PB: <strong>{selectedDetail.session.assignmentInfo.assistantStudentName}</strong> ({selectedDetail.session.assignmentInfo.assistantStudentId})
                                  </span>
                                ) : (
                                  'Chưa có LT đăng ký'
                                )}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.count > 0 ? (
                            <button
                              onClick={() => onOpenStudentListForClass(c.className)}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                            >
                              <Users className="w-3 h-3" /> Xem {c.count} SV
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">0 SV</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Collapsible / Expandable Student List Section */}
          {showStudentList && (
            <SettlementDetailStudentList
              studentListRef={studentListRef}
              selectedDetail={selectedDetail}
              currentRoomRecords={currentRoomRecords}
              filteredStudentRecords={filteredStudentRecords}
              excludedCountForModal={excludedCountForModal}
              studentClassFilter={studentClassFilter}
              onSelectClassFilter={onSelectClassFilter}
              studentSearchQuery={studentSearchQuery}
              onSearchQueryChange={onSearchQueryChange}
              isStudentExcluded={isStudentExcluded}
              onToggleStudentExclusion={onToggleStudentExclusion}
              onClearSessionExclusions={onClearSessionExclusions}
            />
          )}

          {/* Final Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <span className="font-bold">Kết luận cho cặp lớp này: </span>
            Lớp <span className="font-bold">{selectedDetail.fromClass}</span> có {activeDetailCalc?.fromClassCount ?? selectedDetail.studentsCount} SV dự thi.
            Cần gửi cho lớp đại diện <span className="font-bold">{activeDetailCalc?.responsibleClass ?? selectedDetail.toClass}</span> số tiền là:
            <span className="font-bold text-rose-600 ml-1">
              {activeDetailCalc?.fromClassCount ?? selectedDetail.studentsCount} x {formatCurrency(activeDetailCalc?.pricePerStudent ?? selectedDetail.pricePerStudent)} = {formatCurrency(activeDetailCalc?.amount ?? selectedDetail.amount)}
            </span>.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
