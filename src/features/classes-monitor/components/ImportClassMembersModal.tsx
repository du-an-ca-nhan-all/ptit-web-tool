'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  downloadClassMembersSampleCsv,
  parseClassMembersFile,
  parseClassMembersText,
  type ImportClassMemberRow,
} from '../utils/classMemberImportParser';
import type { ClassMemberImportPreview } from '../server/classMemberImportService';
import ImportClassMembersConfirmView from './ImportClassMembersConfirmView';

interface ImportClassMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  existingActiveStudents: Array<{
    MaSV: string;
    HoLotSV?: string;
    TenSV?: string;
    PHAI?: string;
    NgaySinhC?: string;
    phone?: string;
    note?: string;
  }>;
  onImportSuccess: (message: string) => void;
}

type InputTab = 'FILE' | 'TEXT';

export default function ImportClassMembersModal({
  isOpen,
  onClose,
  selectedClass,
  existingActiveStudents,
  onImportSuccess,
}: ImportClassMembersModalProps) {
  const [step, setStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
  const [inputTab, setInputTab] = useState<InputTab>('FILE');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<ImportClassMemberRow[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const [previewData, setPreviewData] = useState<ClassMemberImportPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('INPUT');
      setInputTab('FILE');
      setUploadedFile(null);
      setRawText('');
      setParsedItems([]);
      setDuplicateCount(0);
      setSkippedCount(0);
      setParseError(null);
      setPreviewData(null);
      setApiError(null);
      setIsLoadingPreview(false);
      setIsExecuting(false);
    }
  }, [isOpen]);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleProcessFile = async (file: File) => {
    setParseError(null);
    setApiError(null);
    setUploadedFile(file);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.txt') && !lower.endsWith('.tsv')) {
      setParsedItems([]);
      setParseError('Vui lòng chọn file định dạng .csv, .txt hoặc .tsv');
      return;
    }

    const res = await parseClassMembersFile(file);
    setParsedItems(res.items);
    setDuplicateCount(res.duplicateCount);
    setSkippedCount(res.skippedCount);
    setParseError(res.error || null);
  };

  const handleTextChange = (value: string) => {
    setRawText(value);
    setApiError(null);
    const res = parseClassMembersText(value);
    setParsedItems(res.items);
    setDuplicateCount(res.duplicateCount);
    setSkippedCount(res.skippedCount);
    setParseError(res.error || null);
  };

  const handleRemoveItem = (maSV: string) => {
    setParsedItems((prev) => prev.filter((item) => item.maSV !== maSV));
  };

  const handleRequestPreview = async () => {
    if (parsedItems.length === 0) return;
    setIsLoadingPreview(true);
    setApiError(null);
    try {
      const res = await fetch('/api/class-members/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mode: 'PREVIEW',
          classCode: selectedClass,
          items: parsedItems,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.preview) {
        setApiError(data.error || 'Không thể kiểm tra trước dữ liệu import.');
        return;
      }
      setPreviewData(data.preview);
      setStep('CONFIRM');
    } catch {
      setApiError('Lỗi kết nối máy chủ khi phân tích dữ liệu import.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmExecute = async () => {
    if (parsedItems.length === 0) return;
    setIsExecuting(true);
    setApiError(null);
    try {
      const res = await fetch('/api/class-members/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mode: 'EXECUTE',
          classCode: selectedClass,
          items: parsedItems,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.error || 'Import thất bại. Vui lòng thử lại.');
        return;
      }
      onImportSuccess(data.message || `Import thành công danh sách lớp ${selectedClass}!`);
      onClose();
    } catch {
      setApiError('Lỗi kết nối máy chủ khi thực hiện import.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = isLoadingPreview || isExecuting;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-2xl shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {step === 'INPUT'
                    ? 'Import Danh Sách Thành Viên Trong Lớp'
                    : 'Xác Nhận Import Danh Sách Thành Viên'}
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold font-mono">
                  Lớp {selectedClass}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {step === 'INPUT'
                  ? 'Bước 1/2: Tải lên file CSV hoặc dán danh sách từ Excel để kiểm tra thay đổi'
                  : 'Bước 2/2: Xem trước đầy đủ biến động sĩ số trước khi áp dụng'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 2: Confirmation Popup View */}
        {step === 'CONFIRM' && previewData ? (
          <ImportClassMembersConfirmView
            preview={previewData}
            isExecuting={isExecuting}
            error={apiError}
            onBack={() => {
              setApiError(null);
              setStep('INPUT');
            }}
            onConfirm={handleConfirmExecute}
          />
        ) : (
          /* Step 1: Upload / Paste Input View */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
              {/* Rules Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">Quy tắc đồng bộ danh sách lớp {selectedClass}:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-blue-900/90">
                    <li>
                      Sinh viên đang học trong lớp nhưng <strong>không có trong danh sách import</strong> sẽ mặc định được chuyển sang{' '}
                      <strong className="text-rose-700">Thôi học</strong>.
                    </li>
                    <li>
                      Sinh viên đang thuộc <strong>lớp khác</strong> có trong danh sách import sẽ tự động được{' '}
                      <strong className="text-amber-700">chuyển sang lớp {selectedClass}</strong>.
                    </li>
                    <li>
                      Bạn sẽ xem đầy đủ chi tiết từng sinh viên bị ảnh hưởng ở bước xác nhận trước khi thực hiện.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Input Mode Switcher + Sample CSV */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setInputTab('FILE')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      inputTab === 'FILE'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Tải File (CSV / TXT)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputTab('TEXT')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      inputTab === 'TEXT'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Dán Từ Excel / Văn Bản</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => downloadClassMembersSampleCsv(selectedClass, existingActiveStudents)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Tải File Mẫu (.CSV)</span>
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {inputTab === 'FILE' && (
                <div
                  className={`border-2 border-dashed rounded-3xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                      : uploadedFile
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-slate-50/30'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleProcessFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadedFile ? (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-sm text-slate-800">{uploadedFile.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Đọc được{' '}
                        <strong className="text-blue-700">{parsedItems.length}</strong> sinh viên hợp lệ
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setParsedItems([]);
                          setParseError(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Chọn file khác
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-sm text-slate-800">
                        Kéo thả file CSV / TXT vào đây hoặc nhấp để chọn file
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">
                        Tương thích trực tiếp với file xuất từ nút <strong>Xuất CSV</strong> hoặc bảng danh sách có cột Mã SV, Họ tên, Giới tính, Ngày sinh, SĐT.
                      </p>
                      <span className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4" /> Chọn File Từ Máy Tính
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                    }}
                  />
                </div>
              )}

              {/* Tab 2: Text Paste */}
              {inputTab === 'TEXT' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Dán danh sách Mã SV hoặc copy các cột từ Excel (Mã SV, Họ tên, Giới tính, Ngày sinh, SĐT...):
                    </span>
                    {rawText && (
                      <button
                        type="button"
                        onClick={() => handleTextChange('')}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa nội dung
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`Ví dụ (mỗi dòng 1 sinh viên hoặc copy từ Excel):\nB21DCCN001\tNguyễn Văn An\tNam\t01/01/2003\nB21DCCN002\tTrần Thị Bình\tNữ\t15/05/2003\nhoặc chỉ danh sách Mã SV:\nB21DCCN001\nB21DCCN002`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
                  />
                </div>
              )}

              {/* Parse / API Errors */}
              {(parseError || apiError) && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{apiError || parseError}</span>
                </div>
              )}

              {/* Parsed Preview List */}
              {parsedItems.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800">
                        Đã đọc được {parsedItems.length} sinh viên
                      </span>
                      {duplicateCount > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px]">
                          Bỏ qua {duplicateCount} dòng trùng Mã SV
                        </span>
                      )}
                      {skippedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                          Bỏ qua {skippedCount} dòng không hợp lệ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-center w-10">STT</th>
                          <th className="px-3 py-2">Mã SV</th>
                          <th className="px-3 py-2">Họ và Tên</th>
                          <th className="px-3 py-2">Giới tính</th>
                          <th className="px-3 py-2">Ngày sinh</th>
                          <th className="px-3 py-2">SĐT</th>
                          <th className="px-3 py-2 text-center w-10">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedItems.map((item, idx) => (
                          <tr key={item.maSV} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-bold text-blue-700">{item.maSV}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800">
                              {item.hoTen || <span className="text-slate-400 italic">Theo dữ liệu hệ thống</span>}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{item.gioiTinh || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{item.ngaySinh || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{item.soDienThoai || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.maSV)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                title="Xóa khỏi danh sách import"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Step 1 Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoadingPreview}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleRequestPreview}
                disabled={parsedItems.length === 0 || isLoadingPreview}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-200 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang Kiểm Tra Dữ Liệu...
                  </>
                ) : (
                  <>
                    <span>Kiểm Tra & Xác Nhận ({parsedItems.length} SV)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
