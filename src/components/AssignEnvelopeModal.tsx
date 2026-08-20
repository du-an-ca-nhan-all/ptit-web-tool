import React, { useState, useMemo, useEffect } from 'react';
import { X, User, Users, Check, Mail, Hand, Search, UserCheck, DollarSign, RotateCcw, Tag } from 'lucide-react';
import { ExamRecord, ExamSession, LoginUser, isUserMonitor } from '../types';
import { EnvelopeAssignment, SaveEnvelopeOptions } from '../config/envelopeAssignmentConfig';
import { getDefaultRoomPrice, formatCurrency } from '../config/pricingConfig';

interface AssignEnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession | null;
  initialClass?: string;
  records?: ExamRecord[];
  loginUsers?: LoginUser[];
  currentAssignment?: EnvelopeAssignment;
  onConfirm: (sessionId: string, targetClass: string, options: SaveEnvelopeOptions) => Promise<void>;
  isLoading?: boolean;
}

const PRESET_PRICES = [
  500000,
  600000,
  700000,
  800000,
  1000000,
  1200000,
  1500000,
  2000000,
];

export default function AssignEnvelopeModal({
  isOpen,
  onClose,
  session,
  initialClass,
  records = [],
  loginUsers = [],
  currentAssignment,
  onConfirm,
  isLoading = false,
}: AssignEnvelopeModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [assigneeType, setAssigneeType] = useState<'MONITOR' | 'ASSISTANT'>('MONITOR');
  const [assistantStudentId, setAssistantStudentId] = useState<string>('');
  const [assistantStudentName, setAssistantStudentName] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isCustomPrice, setIsCustomPrice] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<string>('600000');

  const defaultPrice = useMemo(() => {
    if (!session) return 600000;
    return getDefaultRoomPrice(
      session.subject || '',
      session.subjectCode || '',
      session.room || '',
      session.examFormat || ''
    );
  }, [session]);

  // Find candidate classes in this room
  const roomClasses = useMemo(() => {
    if (!session) return [];
    return session.classCounts || [];
  }, [session]);

  // Set initial state when modal opens
  useEffect(() => {
    if (!isOpen || !session) return;

    const defaultClass = initialClass || currentAssignment?.assignedClass || roomClasses[0]?.className || '';
    setSelectedClass(defaultClass);

    if (currentAssignment?.assistantStudentId) {
      setAssigneeType('ASSISTANT');
      setAssistantStudentId(currentAssignment.assistantStudentId);
      setAssistantStudentName(currentAssignment.assistantStudentName || '');
    } else {
      setAssigneeType('MONITOR');
      setAssistantStudentId('');
      setAssistantStudentName('');
    }

    // Price initialization
    const currentPrice = currentAssignment?.customPrice ?? defaultPrice;
    const hasCustom = currentAssignment?.customPrice !== undefined && currentAssignment?.customPrice !== null && currentAssignment?.customPrice !== defaultPrice;
    setIsCustomPrice(hasCustom);
    setPriceInput(String(currentPrice || defaultPrice));

    setNote(currentAssignment?.note || '');
    setStudentSearch('');
  }, [isOpen, session, initialClass, currentAssignment, roomClasses, defaultPrice]);

  // Get monitor for selected class
  const classMonitor = useMemo(() => {
    if (!selectedClass) return null;
    const cleanCls = selectedClass.trim().toUpperCase();
    return loginUsers.find(
      (u) => isUserMonitor(u) && u.lop && u.lop.trim().toUpperCase() === cleanCls
    ) || null;
  }, [selectedClass, loginUsers]);

  // Get all students of selected class (from room records first, then batch records)
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const cleanCls = selectedClass.trim().toUpperCase();
    
    // Map of maSV -> full name & room status
    const studentMap = new Map<string, { maSV: string; name: string; inRoom: boolean }>();

    // 1. Students in this current exam room
    if (session?.records) {
      session.records.forEach((r) => {
        if (r.MaLop && r.MaLop.trim().toUpperCase() === cleanCls && r.MaSV) {
          const name = r.HoDem ? `${r.HoDem} ${r.Ten || ''}`.trim() : (r.Ten || r.MaSV);
          studentMap.set(r.MaSV, { maSV: r.MaSV, name, inRoom: true });
        }
      });
    }

    // 2. Other students of this class in the batch
    records.forEach((r) => {
      if (r.MaLop && r.MaLop.trim().toUpperCase() === cleanCls && r.MaSV && !studentMap.has(r.MaSV)) {
        const name = r.HoDem ? `${r.HoDem} ${r.Ten || ''}`.trim() : (r.Ten || r.MaSV);
        studentMap.set(r.MaSV, { maSV: r.MaSV, name, inRoom: false });
      }
    });

    return Array.from(studentMap.values()).sort((a, b) => {
      if (a.inRoom !== b.inRoom) return a.inRoom ? -1 : 1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [selectedClass, session, records]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase().trim();
    return classStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.maSV.toLowerCase().includes(q)
    );
  }, [classStudents, studentSearch]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPriceInput(raw);
    const num = parseInt(raw, 10);
    setIsCustomPrice(!isNaN(num) && num !== defaultPrice);
  };

  const handleSelectPresetPrice = (amount: number) => {
    setPriceInput(String(amount));
    setIsCustomPrice(amount !== defaultPrice);
  };

  const handleResetDefaultPrice = () => {
    setPriceInput(String(defaultPrice));
    setIsCustomPrice(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !selectedClass) return;

    const options: SaveEnvelopeOptions = {
      room: session.room,
      date: session.date,
      time: session.time,
      subjectCode: session.subjectCode,
      subject: session.subject,
      note: note.trim() || undefined,
    };

    if (assigneeType === 'ASSISTANT' && assistantStudentId) {
      options.assistantStudentId = assistantStudentId.trim();
      options.assistantStudentName = assistantStudentName.trim() || undefined;
    } else {
      options.assistantStudentId = undefined;
      options.assistantStudentName = undefined;
    }

    const priceNum = parseInt(priceInput.replace(/\D/g, ''), 10);
    if (isCustomPrice && !isNaN(priceNum) && priceNum !== defaultPrice) {
      options.customPrice = priceNum;
    } else {
      options.customPrice = null;
    }

    await onConfirm(session.id, selectedClass, options);
    onClose();
  };

  if (!isOpen || !session) return null;

  const currentPriceVal = parseInt(priceInput.replace(/\D/g, ''), 10) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                Xác Nhận Đi Phong Bì
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phòng <strong className="text-rose-600 font-bold">{session.room}</strong> • {session.date} ({session.time})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Subject banner */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Môn thi</span>
            <span className="font-bold text-slate-800 text-sm leading-snug">{session.subject}</span>
            <span className="text-xs text-slate-500 font-mono">Mã môn: {session.subjectCode}</span>
          </div>

          {/* 1. Select Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lớp Phụ Trách Đi Phong Bì <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roomClasses.map((c) => {
                const isSelected = c.className === selectedClass;
                return (
                  <button
                    key={c.className}
                    type="button"
                    onClick={() => setSelectedClass(c.className)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <div className="text-sm">{c.className}</div>
                      <div className="text-xs text-slate-500 font-normal">{c.count} SV trong phòng</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Assignee: Monitor vs Assistant Student */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Người Trực Tiếp Đi Phong Bì <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAssigneeType('MONITOR')}
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
                onClick={() => setAssigneeType('ASSISTANT')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  assigneeType === 'ASSISTANT'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Gán SV hỗ trợ đi</span>
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
                    Lớp trưởng sẽ đại diện trực tiếp nhận và gửi phong bì bồi dưỡng cho phòng thi này.
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
                    onChange={(e) => setStudentSearch(e.target.value)}
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
                            setAssistantStudentId(s.maSV);
                            setAssistantStudentName(s.name);
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
                    onChange={(e) => setAssistantStudentId(e.target.value)}
                    className="w-1/3 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên SV hỗ trợ..."
                    value={assistantStudentName}
                    onChange={(e) => setAssistantStudentName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Room Price / Custom Price */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>Mức Bồi Dưỡng Phòng Thi</span>
              </label>
              {isCustomPrice ? (
                <button
                  type="button"
                  onClick={handleResetDefaultPrice}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục chuẩn ({formatCurrency(defaultPrice)})</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Chuẩn: {formatCurrency(defaultPrice)}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={currentPriceVal > 0 ? currentPriceVal.toLocaleString('vi-VN') : ''}
                onChange={handlePriceChange}
                placeholder="Nhập số tiền VNĐ..."
                className="w-full pl-3 pr-12 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm text-slate-800 outline-none focus:border-amber-500 shadow-2xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-0.5">Chọn nhanh:</span>
              {PRESET_PRICES.map((amt) => {
                const isSelected = currentPriceVal === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPresetPrice(amt)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-100 text-amber-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}k`}
                  </button>
                );
              })}
            </div>

            {isCustomPrice && (
              <p className="text-[11px] text-amber-800 font-medium">
                ⚠️ Giá phòng sẽ được lưu tùy chỉnh là <strong>{formatCurrency(currentPriceVal)}</strong> (khác mức chuẩn {formatCurrency(defaultPrice)}).
              </p>
            )}
          </div>

          {/* 4. Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Đã hẹn GV trước 15p, sinh viên đi hộ ca 2..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-700"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedClass || (assigneeType === 'ASSISTANT' && !assistantStudentId)}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Đang lưu vào CSDL...' : 'Lưu Xác Nhận'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
