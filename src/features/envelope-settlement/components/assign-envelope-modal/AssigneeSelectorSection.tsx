import React from 'react';
import { User, Users, Check, Search, UserCheck } from 'lucide-react';
import { LoginUser } from '../../../../types';
import { AssigneeType, ClassStudentOption } from './types';

interface AssigneeSelectorSectionProps {
  assigneeType: AssigneeType;
  onChangeAssigneeType: (type: AssigneeType) => void;
  classMonitor: LoginUser | null;
  assistantStudentId: string;
  onChangeAssistantStudentId: (value: string) => void;
  assistantStudentName: string;
  onChangeAssistantStudentName: (value: string) => void;
  studentSearch: string;
  onChangeStudentSearch: (value: string) => void;
  filteredStudents: ClassStudentOption[];
}

export function AssigneeSelectorSection({
  assigneeType,
  onChangeAssigneeType,
  classMonitor,
  assistantStudentId,
  onChangeAssistantStudentId,
  assistantStudentName,
  onChangeAssistantStudentName,
  studentSearch,
  onChangeStudentSearch,
  filteredStudents,
}: AssigneeSelectorSectionProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        Người Trực Tiếp Chuẩn Bị / Mua Nước <span className="text-rose-500">*</span>
      </label>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChangeAssigneeType('MONITOR')}
          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            assigneeType === 'MONITOR'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Lớp trưởng (Mặc định)</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeAssigneeType('ASSISTANT')}
          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            assigneeType === 'ASSISTANT'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Gán SV hỗ trợ mua nước</span>
        </button>
      </div>

      {/* If Monitor option selected */}
      {assigneeType === 'MONITOR' && (
        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
          <User className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">
              Lớp trưởng: {classMonitor?.fullName || classMonitor?.username || 'Chưa đăng ký tài khoản'}
            </p>
            <p className="text-[11px] text-emerald-700 opacity-90 mt-0.5">
              Lớp trưởng sẽ đại diện trực tiếp chuẩn bị nước uống và hỗ trợ cho phòng thi này.
            </p>
          </div>
        </div>
      )}

      {/* If Assistant Student option selected */}
      {assigneeType === 'ASSISTANT' && (
        <div className="space-y-2.5 p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Chọn sinh viên hỗ trợ của lớp:</span>
            {assistantStudentId && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                Đã chọn: {assistantStudentName || assistantStudentId}
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => onChangeStudentSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã SV..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Student list picker */}
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
            {filteredStudents.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                Không tìm thấy sinh viên phù hợp
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = assistantStudentId === s.maSV;
                return (
                  <button
                    key={s.maSV}
                    type="button"
                    onClick={() => {
                      onChangeAssistantStudentId(s.maSV);
                      onChangeAssistantStudentName(s.name);
                    }}
                    className={`w-full p-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({s.maSV})</span>
                      {s.inRoom && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1 rounded">
                          Thi phòng này
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Manual entry fallback */}
          <div className="pt-2 border-t border-indigo-100/80 flex gap-2">
            <input
              type="text"
              placeholder="Mã SV..."
              value={assistantStudentId}
              onChange={(e) => onChangeAssistantStudentId(e.target.value)}
              className="w-1/3 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Họ và tên SV hỗ trợ..."
              value={assistantStudentName}
              onChange={(e) => onChangeAssistantStudentName(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
