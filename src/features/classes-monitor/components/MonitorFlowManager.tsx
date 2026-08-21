'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  GitFork,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Check,
  X,
  RefreshCw,
  Save,
  Play,
  Share2,
  Trash2,
  Filter,
  Globe,
  Lock,
  ChevronDown,
  Layers,
  ArrowRight,
  BookOpen,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { LoginUser } from '../../../types';
import { useMonitorFlow } from '../hooks/useMonitorFlow';

interface MonitorFlowManagerProps {
  currentUser: LoginUser;
  availableClasses?: string[];
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function MonitorFlowManager({
  currentUser,
  availableClasses = [],
  onNavigateTab,
}: MonitorFlowManagerProps) {
  const {
    selectedClass,
    setSelectedClass,
    students,
    isLoading,
    isSaving,
    isExecuting,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    hasUnsavedChanges,
    lastExecutionResult,
    setLastExecutionResult,
    fetchFlowData,
    updateFollowerConfig,
    setAllFollowersStatus,
    setAllPermissions,
    saveAllConfigs,
    executeFlow,
  } = useMonitorFlow(currentUser, currentUser.lop || availableClasses[0] || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LINKED' | 'NOT_LINKED'>('ALL');

  // Quick Trigger Modal States
  const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);
  const [quickTargetIdToHoc, setQuickTargetIdToHoc] = useState('');
  const [quickTargetSubjectCode, setQuickTargetSubjectCode] = useState('');
  const [quickTargetGroupName, setQuickTargetGroupName] = useState('');

  const [showQuickCancelModal, setShowQuickCancelModal] = useState(false);
  const [cancelTargetIdToHoc, setCancelTargetIdToHoc] = useState('');

  const [showSyncAllModal, setShowSyncAllModal] = useState(false);

  // Statistics
  const activeFollowersCount = useMemo(() => students.filter((s) => s.isEnabled).length, [students]);
  const linkedAccountsCount = useMemo(() => students.filter((s) => s.isExternalConfigured).length, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((st) => {
      const matchQuery =
        !query ||
        st.maSV.toLowerCase().includes(query) ||
        st.hoTen.toLowerCase().includes(query) ||
        (st.soDienThoai && st.soDienThoai.includes(query));

      if (!matchQuery) return false;

      if (filterMode === 'ACTIVE') return st.isEnabled;
      if (filterMode === 'INACTIVE') return !st.isEnabled;
      if (filterMode === 'LINKED') return st.isExternalConfigured;
      if (filterMode === 'NOT_LINKED') return !st.isExternalConfigured;

      return true;
    });
  }, [students, searchQuery, filterMode]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-md shadow-amber-200">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Cấu Hình Flow Action Theo Lớp Trưởng
                </h1>
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Lớp Trưởng Tool
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Lớp trưởng: <strong className="text-amber-700 font-mono">{currentUser.fullName || currentUser.username}</strong> ({currentUser.username})
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* Class selector */}
          {(currentUser.isAdmin || (availableClasses && availableClasses.length > 1)) && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              {availableClasses.length > 0 ? (
                availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Lớp {c}
                  </option>
                ))
              ) : (
                <option value={currentUser.lop || ''}>{currentUser.lop || 'Chọn lớp'}</option>
              )}
            </select>
          )}

          <button
            onClick={() => fetchFlowData(selectedClass)}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>

          <button
            onClick={saveAllConfigs}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng Sinh Viên Lớp</div>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {students.length} <span className="text-xs font-normal text-slate-400">thành viên</span>
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">Lớp {selectedClass}</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đang Bật Flow Action</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              {activeFollowersCount} <span className="text-xs font-normal text-slate-400">/ {students.length}</span>
            </div>
            <div className="text-[11px] text-amber-700 font-bold mt-0.5">Sẽ tự động hành động theo</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Đã Liên Kết QLDTTX</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {linkedAccountsCount} <span className="text-xs font-normal text-slate-400">/ {students.length}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Sẵn sàng chạy tự động</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Chưa Cấu Hình QLDTTX</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {students.length - linkedAccountsCount} <span className="text-xs font-normal text-slate-400">bạn</span>
            </div>
            <div className="text-[11px] text-rose-600 font-bold mt-0.5">Cần nhắc cấu hình tài khoản</div>
          </div>
        </div>
      </div>

      {/* Quick Flow Actions Launcher Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-current" />
              <h3 className="font-black text-base sm:text-lg text-white">
                Bắn Lệnh Flow Action Cho Cả Lớp
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Thực thi đồng loạt cho <strong className="text-amber-300">{activeFollowersCount} thành viên</strong> đang bật Flow Action
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Action 1: Sync All courses */}
            <button
              onClick={() => setShowSyncAllModal(true)}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-emerald-900/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4" />
              <span>Đồng Bộ Tất Cả Môn Của Lớp Trưởng</span>
            </button>

            {/* Action 2: Quick Register specific group */}
            <button
              onClick={() => setShowQuickRegisterModal(true)}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-orange-900/40 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Flow Đăng Ký Môn...</span>
            </button>

            {/* Action 3: Quick Cancel specific group */}
            <button
              onClick={() => setShowQuickCancelModal(true)}
              disabled={isExecuting || activeFollowersCount === 0}
              className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all border border-rose-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Flow Hủy Môn...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table: Configuration of Class Members */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã SV, họ tên, số điện thoại..."
              className="w-full bg-white border border-slate-200 rounded-2xl pl-9.5 pr-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter & Batch Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  filterMode === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Tất Cả ({students.length})
              </button>
              <button
                onClick={() => setFilterMode('ACTIVE')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  filterMode === 'ACTIVE' ? 'bg-amber-600 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Bật Flow ({activeFollowersCount})
              </button>
              <button
                onClick={() => setFilterMode('LINKED')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  filterMode === 'LINKED' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Đã Liên Kết ({linkedAccountsCount})
              </button>
              <button
                onClick={() => setFilterMode('NOT_LINKED')}
                className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  filterMode === 'NOT_LINKED' ? 'bg-rose-600 text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Chưa Liên Kết ({students.length - linkedAccountsCount})
              </button>
            </div>

            {/* Bulk set all */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAllFollowersStatus(true)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                title="Bật Flow cho tất cả thành viên trong lớp"
              >
                Bật Tất Cả
              </button>
              <button
                onClick={() => setAllFollowersStatus(false)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                title="Tắt Flow cho tất cả thành viên trong lớp"
              >
                Tắt Tất Cả
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-bold">Đang tải danh sách thành viên và cấu hình Flow...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <Users className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Không tìm thấy sinh viên nào</p>
              <p className="text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">STT</th>
                  <th className="px-4 py-3.5">Mã SV</th>
                  <th className="px-4 py-3.5">Họ và Tên</th>
                  <th className="px-4 py-3.5 text-center">Tài Khoản QLDTTX</th>
                  <th className="px-4 py-3.5 text-center">Bật / Tắt Flow</th>
                  <th className="px-4 py-3.5 text-center">Flow Đăng Ký Môn</th>
                  <th className="px-4 py-3.5 text-center">Flow Hủy Môn</th>
                  <th className="px-4 py-3.5">Lịch Sử Flow Gần Nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  return (
                    <tr
                      key={student.maSV}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        student.isEnabled ? 'bg-amber-50/20' : 'opacity-70 bg-slate-50/30'
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>

                      {/* Mã SV */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-xs border border-indigo-100">
                          {student.maSV}
                        </span>
                      </td>

                      {/* Họ Tên */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800 text-sm block">{student.hoTen}</span>
                        {student.soDienThoai && (
                          <span className="text-[11px] text-slate-400 font-mono">SĐT: {student.soDienThoai}</span>
                        )}
                      </td>

                      {/* Trạng thái QLDTTX */}
                      <td className="px-4 py-3.5 text-center">
                        {student.isExternalConfigured ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3" /> Đã Liên Kết
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Chưa Liên Kết
                          </span>
                        )}
                      </td>

                      {/* Switch Bật/Tắt Flow */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => updateFollowerConfig(student.maSV, 'isEnabled', !student.isEnabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            student.isEnabled ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              student.isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Action 1: Allow Register Course */}
                      <td className="px-4 py-3.5 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={student.allowRegisterCourse}
                            disabled={!student.isEnabled}
                            onChange={(e) =>
                              updateFollowerConfig(student.maSV, 'allowRegisterCourse', e.target.checked)
                            }
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-40"
                          />
                          <span className="text-[11px] font-bold text-slate-700">Đăng ký</span>
                        </label>
                      </td>

                      {/* Action 2: Allow Cancel Course */}
                      <td className="px-4 py-3.5 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={student.allowCancelCourse}
                            disabled={!student.isEnabled}
                            onChange={(e) =>
                              updateFollowerConfig(student.maSV, 'allowCancelCourse', e.target.checked)
                            }
                            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer disabled:opacity-40"
                          />
                          <span className="text-[11px] font-bold text-slate-700">Hủy môn</span>
                        </label>
                      </td>

                      {/* Last Action Details */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {student.lastActionAt ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span
                                className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                                  student.lastActionResult === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : student.lastActionResult === 'SKIPPED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {student.lastActionResult || 'DONE'}
                              </span>
                              <span className="font-bold text-slate-700">{student.lastActionType}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                ({new Date(student.lastActionAt).toLocaleTimeString('vi-VN')})
                              </span>
                            </div>
                            {student.lastActionMessage && (
                              <p className="text-[11px] text-slate-500 truncate" title={student.lastActionMessage}>
                                {student.lastActionMessage}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa có hành động nào</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer save reminder */}
        {hasUnsavedChanges && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bạn có thay đổi cấu hình chưa lưu. Bấm "Lưu Cấu Hình" để áp dụng.</span>
            </div>
            <button
              onClick={saveAllConfigs}
              disabled={isSaving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Ngay'}
            </button>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: QUICK FLOW REGISTER SPECIFIC COURSE */}
      {/* ============================================================= */}
      {showQuickRegisterModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickRegisterModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 fill-current" />
                <h3 className="text-base font-black">Flow Đăng Ký Môn Học Cho Cả Lớp</h3>
              </div>
              <button
                onClick={() => setShowQuickRegisterModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần Đăng Ký (id_to_hoc):</label>
                <input
                  type="text"
                  value={quickTargetIdToHoc}
                  onChange={(e) => setQuickTargetIdToHoc(e.target.value.trim())}
                  placeholder="Ví dụ: 123456 hoặc copy ID từ danh sách môn mở..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Môn / Nhóm Tổ (Tùy chọn ghi nhớ):</label>
                <input
                  type="text"
                  value={quickTargetGroupName}
                  onChange={(e) => setQuickTargetGroupName(e.target.value)}
                  placeholder="Ví dụ: Nhóm 01 - Tiếng Anh B1..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                🚀 Hệ thống sẽ tự động gọi API đăng ký tổ học này cho toàn bộ <strong>{activeFollowersCount} thành viên</strong> có bật quyền "Flow Đăng Ký".
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!quickTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = quickTargetIdToHoc;
                    const name = quickTargetGroupName;
                    setShowQuickRegisterModal(false);
                    await executeFlow({
                      flowAction: 'REGISTER',
                      id_to_hoc: id,
                      nhom_to: name,
                    });
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắn Lệnh Đăng Ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: QUICK FLOW CANCEL SPECIFIC COURSE */}
      {/* ============================================================= */}
      {showQuickCancelModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickCancelModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black">Flow Hủy Môn Học Cho Cả Lớp</h3>
              </div>
              <button
                onClick={() => setShowQuickCancelModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ID Tổ Học Cần Hủy (id_to_hoc):</label>
                <input
                  type="text"
                  value={cancelTargetIdToHoc}
                  onChange={(e) => setCancelTargetIdToHoc(e.target.value.trim())}
                  placeholder="Nhập ID tổ học cần hủy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Cảnh báo: Thao tác này sẽ hủy môn học cho tất cả các thành viên đang bật Flow. Slot học sẽ được giải phóng ngay lập tức.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCancelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!cancelTargetIdToHoc || isExecuting}
                  onClick={async () => {
                    const id = cancelTargetIdToHoc;
                    setShowQuickCancelModal(false);
                    await executeFlow({
                      flowAction: 'CANCEL',
                      id_to_hoc: id,
                    });
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Xác Nhận Hủy Môn Cả Lớp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: SYNC ALL COURSES OF MONITOR */}
      {/* ============================================================= */}
      {showSyncAllModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSyncAllModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-black">Đồng Bộ Tất Cả Môn Học Của Lớp Trưởng</h3>
              </div>
              <button
                onClick={() => setShowSyncAllModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">
                Hệ thống sẽ lấy toàn bộ các môn học mà <strong>Lớp trưởng ({currentUser.fullName || currentUser.username})</strong> đã đăng ký thành công trên cổng QLDTTX và tự động gửi lệnh đăng ký tương ứng cho <strong>{activeFollowersCount} thành viên</strong> flow trong lớp.
              </p>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                ✨ Giúp toàn bộ các thành viên trong lớp học cùng 1 thời khóa biểu, cùng ca học và cùng phòng thi với Lớp trưởng một cách tự động!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSyncAllModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={async () => {
                    setShowSyncAllModal(false);
                    await executeFlow({
                      flowAction: 'SYNC_ALL_COURSES',
                    });
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? 'Đang thực thi...' : 'Bắt Đầu Đồng Bộ Cả Lớp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: EXECUTION RESULTS SUMMARY DIALOG */}
      {/* ============================================================= */}
      {lastExecutionResult && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLastExecutionResult(null);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black">Kết Quả Thực Thi Flow Action</h3>
              </div>
              <button
                onClick={() => setLastExecutionResult(null)}
                className="p-1 text-white/80 hover:text-white rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Counters */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center text-xs shrink-0">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Thành Công</span>
                <span className="text-lg font-black text-emerald-700">{lastExecutionResult.successCount}</span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Thất Bại</span>
                <span className="text-lg font-black text-rose-600">{lastExecutionResult.failCount}</span>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Bỏ Qua (Chưa có TK)</span>
                <span className="text-lg font-black text-amber-600">{lastExecutionResult.skippedCount}</span>
              </div>
            </div>

            {/* Detailed results list */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {lastExecutionResult.results.map((res, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {res.username}
                      </span>
                      <span className="font-bold text-slate-800">{res.hoTen || res.username}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{res.message}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                      res.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : res.status === 'SKIPPED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLastExecutionResult(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
