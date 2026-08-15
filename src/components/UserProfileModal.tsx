import React, { useState } from 'react';
import { LoginUser } from '../types';
import {
  X,
  User as UserIcon,
  Phone,
  Calendar,
  GraduationCap,
  Crown,
  Edit3,
  Check,
  LogOut,
  Sparkles,
  BookOpen,
  FileText,
  Copy,
  CheckCheck
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: LoginUser & { student?: any };
  onClose: () => void;
  onLogout: () => void;
  onProfileUpdated?: (updatedUser: any) => void;
  hasExamSchedule?: boolean;
}

export default function UserProfileModal({
  currentUser,
  onClose,
  onLogout,
  onProfileUpdated,
  hasExamSchedule = false,
}: UserProfileModalProps) {
  const student = currentUser?.student || {};
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(student?.soDienThoai || currentUser?.phoneNumber || '');
  const [note, setNote] = useState(student?.ghiChu || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedMssv, setCopiedMssv] = useState(false);

  const isAdmin = currentUser?.isAdmin || (currentUser?.role ? currentUser.role.includes('admin') : false);
  const isMonitor = currentUser?.isMonitor || (currentUser?.role ? currentUser.role.includes('lop_truong') : false);
  const fullName = student?.hoTen || currentUser.fullName || currentUser.username;
  const maSV = currentUser.username;
  const maLop = student?.maLop || currentUser.lop || 'Chưa cập nhật';
  const gioiTinh = student?.gioiTinh || 'Nam';
  const ngaySinh = student?.ngaySinh || 'Chưa cập nhật';
  const exams = student?.exams || [];

  const handleCopyMssv = () => {
    navigator.clipboard.writeText(maSV);
    setCopiedMssv(true);
    setTimeout(() => setCopiedMssv(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soDienThoai: phone.trim(),
          ghiChu: note.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Đã lưu thông tin thành công!');
        setIsEditing(false);
        if (onProfileUpdated) {
          onProfileUpdated({
            ...currentUser,
            phoneNumber: phone.trim(),
            student: {
              ...student,
              soDienThoai: phone.trim(),
              ghiChu: note.trim(),
            },
          });
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Banner with Profile Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mt-2">
            <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-lg shrink-0 overflow-hidden ring-4 ring-white/20">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${maSV}`}
                alt={fullName}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight truncate">{fullName}</h2>
                {isAdmin && (
                  <span className="bg-rose-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-300" /> Admin
                  </span>
                )}
                {isMonitor && (
                  <span className="bg-amber-400 text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3" /> Lớp Trưởng
                  </span>
                )}
                {!isAdmin && !isMonitor && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Sinh Viên
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-blue-100 text-xs font-mono">
                <button
                  onClick={handleCopyMssv}
                  className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sao chép MSSV"
                >
                  <span>{maSV}</span>
                  {copiedMssv ? <CheckCheck className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
                <span>•</span>
                <span className="font-semibold text-white">Lớp {maLop}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Profile Details Grid */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                Hồ Sơ Sinh Viên
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa SĐT / Ghi chú
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-0.5">Mã sinh viên:</span>
                    <span className="font-mono font-bold text-slate-800">{maSV}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block mb-0.5">Lớp:</span>
                    <span className="font-bold text-blue-600">{maLop}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú cá nhân</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Thêm ghi chú..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setPhone(student?.soDienThoai || currentUser?.phoneNumber || '');
                      setNote(student?.ghiChu || '');
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Lưu Thông Tin
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Mã sinh viên:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">{maSV}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Giới tính:</span>
                  <span className="font-bold text-slate-800">{gioiTinh}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Ngày sinh:</span>
                  <span className="font-bold text-slate-800">{ngaySinh}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Lớp học chính:</span>
                  <span className="font-bold text-blue-600 text-sm">{maLop}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Số điện thoại:</span>
                  <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {phone || <span className="text-slate-400 font-normal italic">Chưa cập nhật</span>}
                  </span>
                </div>
                {note && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60">
                    <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Ghi chú:</span>
                    <span className="text-slate-700 italic">"{note}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exam Schedule Summary Section */}
          {hasExamSchedule && exams && exams.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Lịch Thi Đã Đăng Ký ({exams.length} môn)
                </h3>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="px-3.5 py-2.5">Ngày thi</th>
                      <th className="px-3.5 py-2.5">Giờ</th>
                      <th className="px-3.5 py-2.5">Tên môn học</th>
                      <th className="px-3.5 py-2.5 text-center">Phòng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exams.map((ex: any, idx: number) => (
                      <tr key={idx} className="hover:bg-blue-50/50">
                        <td className="px-3.5 py-2 font-bold text-slate-700">{ex.NgayThi}</td>
                        <td className="px-3.5 py-2 text-blue-600 font-medium">{ex.GioThi}</td>
                        <td className="px-3.5 py-2 font-semibold text-slate-800">
                          {ex.TenMH} <span className="text-[10px] text-slate-400 font-mono">({ex.MaMH})</span>
                        </td>
                        <td className="px-3.5 py-2 text-center font-bold text-emerald-700">{ex.MAPTHI || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng Xuất
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
