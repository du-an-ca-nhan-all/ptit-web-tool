'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Users,
  Check,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Trash2,
  KeyRound,
  ShieldAlert,
  ChevronDown,
  Info,
} from 'lucide-react';
import Papa from 'papaparse';
import { FollowerStudentItem } from '../server/monitorFlowServerService';

export interface ParsedFlowStudent {
  maSV: string;
  hoTen?: string;
  isEnabled: boolean;
  allowRegisterCourse: boolean;
  allowCancelCourse: boolean;
  autoSyncOnAction?: boolean;
  note?: string;
  // Computed matching info
  isInClass: boolean;
  isLinked: boolean;
  classCode?: string;
  matchedName?: string;
  warning?: string;
}

interface ImportFlowStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  monitorUsername: string;
  monitorFullName?: string;
  existingClassStudents: FollowerStudentItem[];
  onConfirmImport: (payload: {
    mode: 'MERGE' | 'REPLACE';
    items: Array<{
      maSV: string;
      hoTen?: string;
      isEnabled?: boolean;
      allowRegisterCourse?: boolean;
      allowCancelCourse?: boolean;
      autoSyncOnAction?: boolean;
      note?: string;
    }>;
    defaultAllowRegister: boolean;
    defaultAllowCancel: boolean;
  }) => Promise<boolean | void>;
  isSubmitting?: boolean;
}

type TabType = 'FILE' | 'TEXT';
type ImportMode = 'MERGE' | 'REPLACE';

export default function ImportFlowStudentsModal({
  isOpen,
  onClose,
  selectedClass,
  monitorUsername,
  monitorFullName,
  existingClassStudents = [],
  onConfirmImport,
  isSubmitting = false,
}: ImportFlowStudentsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('FILE');
  const [importMode, setImportMode] = useState<ImportMode>('MERGE');

  // Default permissions
  const [defaultAllowRegister, setDefaultAllowRegister] = useState(true);
  const [defaultAllowCancel, setDefaultAllowCancel] = useState(true);
  const [defaultIsEnabled, setDefaultIsEnabled] = useState(true);

  // File state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text state
  const [rawText, setRawText] = useState('');

  // Parsed students list
  const [parsedStudents, setParsedStudents] = useState<ParsedFlowStudent[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number | null>(null);

  // Map for quick lookup of existing students in this class
  const classStudentMap = useMemo(() => {
    const map = new Map<string, FollowerStudentItem>();
    existingClassStudents.forEach((st) => {
      map.set(st.maSV.toUpperCase(), st);
    });
    return map;
  }, [existingClassStudents]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUploadedFile(null);
      setRawText('');
      setParsedStudents([]);
      setParseError(null);
      setSelectedExampleIndex(null);
      setImportMode('MERGE');
    }
  }, [isOpen]);

  // Parse raw text or rows into ParsedFlowStudent[]
  const parseRowsToStudents = (rows: any[][]): ParsedFlowStudent[] => {
    if (!rows || rows.length === 0) return [];

    const normMonitor = monitorUsername.trim().toUpperCase();
    const result: ParsedFlowStudent[] = [];
    const seen = new Set<string>();

    // Detect if first row is header
    let startIndex = 0;
    if (rows.length > 0) {
      const firstRowStr = rows[0].map((c) => String(c || '').toLowerCase()).join(' ');
      if (
        firstRowStr.includes('masv') ||
        firstRowStr.includes('mã sv') ||
        firstRowStr.includes('mã sinh viên') ||
        firstRowStr.includes('mssv') ||
        firstRowStr.includes('student')
      ) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Extract MaSV
      const rawMaSV = String(row[0] || '').trim().toUpperCase();
      if (!rawMaSV) continue;

      // Check if it's the monitor themselves
      if (rawMaSV === normMonitor) continue;

      // Deduplicate
      if (seen.has(rawMaSV)) continue;
      seen.add(rawMaSV);

      // Extract HoTen (if available)
      const rawHoTen = row[1] ? String(row[1]).trim() : undefined;

      // Extract permissions if given in columns 2, 3, 4
      let isEnabled = defaultIsEnabled;
      let allowRegister = defaultAllowRegister;
      let allowCancel = defaultAllowCancel;
      let note: string | undefined = undefined;

      if (row.length >= 3 && row[2] !== undefined && row[2] !== '') {
        const val = String(row[2]).trim().toLowerCase();
        isEnabled = val === '1' || val === 'true' || val === 'có' || val === 'bật' || val === 'yes';
      }
      if (row.length >= 4 && row[3] !== undefined && row[3] !== '') {
        const val = String(row[3]).trim().toLowerCase();
        allowRegister = val === '1' || val === 'true' || val === 'có' || val === 'bật' || val === 'yes';
      }
      if (row.length >= 5 && row[4] !== undefined && row[4] !== '') {
        const val = String(row[4]).trim().toLowerCase();
        allowCancel = val === '1' || val === 'true' || val === 'có' || val === 'bật' || val === 'yes';
      }
      if (row.length >= 6 && row[5] !== undefined && row[5] !== '') {
        note = String(row[5]).trim();
      }

      // Check against existing class data
      const matched = classStudentMap.get(rawMaSV);
      const isInClass = Boolean(matched);
      const isLinked = Boolean(matched?.isExternalConfigured);
      const matchedName = matched?.hoTen || rawHoTen;

      result.push({
        maSV: rawMaSV,
        hoTen: matchedName,
        isEnabled,
        allowRegisterCourse: allowRegister,
        allowCancelCourse: allowCancel,
        note,
        isInClass,
        isLinked,
        classCode: matched?.maLop || selectedClass,
        matchedName,
        warning: !isInClass
          ? `Mã SV không thuộc danh sách lớp ${selectedClass}`
          : !isLinked
          ? 'Chưa liên kết tài khoản Cổng QLDTTX'
          : undefined,
      });
    }

    return result;
  };

  // Parse Text input
  const handleParseText = (text: string) => {
    setParseError(null);
    if (!text.trim()) {
      setParsedStudents([]);
      return;
    }

    try {
      // First try standard Papa parse with automatic delimiter detection
      const parsed = Papa.parse(text.trim(), {
        skipEmptyLines: true,
      });

      if (parsed.data && parsed.data.length > 0) {
        // If single column with commas/spaces or clean list
        const processedRows: any[][] = [];
        (parsed.data as any[][]).forEach((row) => {
          if (row.length === 1 && typeof row[0] === 'string') {
            const singleCell = row[0].trim();
            // Check if user separated by commas, spaces, or semicolons in one line
            if (singleCell.includes(',') || singleCell.includes(';') || singleCell.includes('\t')) {
              const subItems = singleCell.split(/[,;\t]/).map((s) => s.trim()).filter(Boolean);
              // If all subItems look like student IDs, push each as its own row
              const allAreIds = subItems.every((item) => /^[a-zA-Z0-9_-]{5,15}$/.test(item));
              if (allAreIds) {
                subItems.forEach((id) => processedRows.push([id]));
              } else {
                processedRows.push(subItems);
              }
            } else {
              processedRows.push([singleCell]);
            }
          } else {
            processedRows.push(row);
          }
        });

        const students = parseRowsToStudents(processedRows);
        setParsedStudents(students);
        if (students.length === 0) {
          setParseError('Không tìm thấy mã sinh viên hợp lệ nào trong văn bản đã nhập.');
        }
      } else {
        setParsedStudents([]);
        setParseError('Không thể đọc dữ liệu từ văn bản đã nhập.');
      }
    } catch (err: any) {
      setParseError(`Lỗi khi xử lý dữ liệu: ${err.message}`);
    }
  };

  // Parse File input
  const handleProcessFile = (file: File) => {
    setParseError(null);
    setUploadedFile(file);

    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv');
    if (!isCsv) {
      setParseError('Vui lòng chọn file định dạng .csv, .txt, hoặc .tsv');
      return;
    }

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          setParseError('Có lỗi khi đọc file CSV. Vui lòng kiểm tra định dạng.');
          return;
        }
        const students = parseRowsToStudents(results.data as any[][]);
        setParsedStudents(students);
        if (students.length === 0) {
          setParseError('Không tìm thấy mã sinh viên hợp lệ trong file.');
        }
      },
      error: (err) => {
        setParseError(`Lỗi khi đọc file: ${err.message}`);
      },
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Remove individual student from preview
  const handleRemoveStudent = (maSV: string) => {
    setParsedStudents((prev) => prev.filter((s) => s.maSV !== maSV));
  };

  // Toggle student active in preview
  const handleToggleStudent = (maSV: string) => {
    setParsedStudents((prev) =>
      prev.map((s) => (s.maSV === maSV ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const headers = [
      'Mã SV',
      'Họ và Tên',
      'Bật Flow (1=Bật/0=Tắt)',
      'Flow Đăng Ký (1=Bật/0=Tắt)',
      'Flow Hủy Môn (1=Bật/0=Tắt)',
      'Ghi Chú',
    ];

    // Pick top 3 actual students from class if available, or use placeholder samples
    const sampleRows =
      existingClassStudents.length > 0
        ? existingClassStudents.slice(0, 5).map((st, i) => [
            st.maSV,
            st.hoTen,
            '1',
            '1',
            i % 2 === 0 ? '1' : '0',
            i === 0 ? 'Học chung 100% môn' : '',
          ])
        : [
            ['B21DCCN001', 'Nguyễn Văn An', '1', '1', '1', 'Học chung nhóm 01'],
            ['B21DCCN002', 'Trần Thị Bình', '1', '1', '0', 'Không tự hủy môn'],
            ['B21DCCN003', 'Lê Văn Cường', '1', '1', '1', ''],
          ];

    const csvRows = [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );

    // UTF-8 BOM for correct Excel Vietnamese character display
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvRows], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mau_Import_Flow_Lop_${selectedClass}.csv`;
    link.click();
  };

  // Text Examples Presets
  const textExamples = [
    {
      id: 1,
      title: 'Mẫu 1: Chỉ danh sách Mã SV (Đơn giản nhất)',
      description: 'Mỗi dòng 1 mã sinh viên (phù hợp copy từ Zalo, tin nhắn, danh sách)',
      sample:
        existingClassStudents.length > 0
          ? existingClassStudents
              .slice(0, 4)
              .map((s) => s.maSV)
              .join('\n')
          : 'B21DCCN001\nB21DCCN002\nB21DCCN003\nB21DCCN004',
    },
    {
      id: 2,
      title: 'Mẫu 2: Mã SV & Họ Tên (Copy từ Excel)',
      description: 'Cột Mã SV và Họ tên phân cách bằng phím Tab hoặc dấu phẩy',
      sample:
        existingClassStudents.length > 0
          ? existingClassStudents
              .slice(0, 4)
              .map((s) => `${s.maSV}\t${s.hoTen}`)
              .join('\n')
          : 'B21DCCN001\tNguyễn Văn An\nB21DCCN002\tTrần Thị Bình\nB21DCCN003\tLê Văn Cường',
    },
    {
      id: 3,
      title: 'Mẫu 3: Đầy đủ tùy chọn phân quyền Flow',
      description: 'Mã SV, Họ tên, Bật Flow (1/0), Đăng ký (1/0), Hủy môn (1/0), Ghi chú',
      sample:
        'B21DCCN001, Nguyễn Văn An, 1, 1, 1, Học chung cả kỳ\nB21DCCN002, Trần Thị Bình, 1, 1, 0, Không hủy môn\nB21DCCN003, Lê Văn Cường, 1, 1, 1, Nhóm chính',
    },
  ];

  const handleApplyExample = (exampleIndex: number) => {
    const ex = textExamples[exampleIndex];
    if (ex) {
      setRawText(ex.sample);
      setSelectedExampleIndex(exampleIndex);
      handleParseText(ex.sample);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (parsedStudents.length === 0) return;

    const payloadItems = parsedStudents.map((st) => ({
      maSV: st.maSV,
      hoTen: st.hoTen,
      isEnabled: st.isEnabled,
      allowRegisterCourse: st.allowRegisterCourse,
      allowCancelCourse: st.allowCancelCourse,
      note: st.note,
    }));

    const ok = await onConfirmImport({
      mode: importMode,
      items: payloadItems,
      defaultAllowRegister,
      defaultAllowCancel,
    });

    if (ok !== false) {
      onClose();
    }
  };

  // Statistics from parsed data
  const inClassCount = parsedStudents.filter((s) => s.isInClass).length;
  const linkedCount = parsedStudents.filter((s) => s.isLinked).length;
  const activeCount = parsedStudents.filter((s) => s.isEnabled).length;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 text-amber-400 rounded-2xl shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Import Danh Sách Sinh Viên Flow Theo Lớp Trưởng
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold">
                  Lớp {selectedClass}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Lớp trưởng phụ trách: <strong className="text-white font-mono">{monitorFullName || monitorUsername}</strong> ({monitorUsername})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Section 1: Input Mode Tab Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'FILE'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải File Lên (CSV / TXT)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TEXT')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'TEXT'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Nhập Văn Bản Trực Tiếp</span>
              </button>
            </div>

            {/* Download Sample CSV Action */}
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer ml-auto"
              title="Tải file mẫu định dạng .CSV tương thích Excel tiếng Việt"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải File Mẫu (.CSV)</span>
            </button>
          </div>

          {/* Tab 1: File Upload Box */}
          {activeTab === 'FILE' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : uploadedFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50 bg-slate-50/30'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedFile ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-sm text-slate-800">{uploadedFile.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Đã phân tích được{' '}
                      <strong className="text-indigo-700">{parsedStudents.length}</strong> sinh viên
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setParsedStudents([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Chọn file khác
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-sm text-slate-800">
                      Kéo thả file CSV / TXT vào đây hoặc nhấp để chọn file
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                      Hỗ trợ file .CSV, .TXT hoặc bảng copy từ Excel. Tự động nhận diện cột Mã SV và phân quyền.
                    </p>
                    <span className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5">
                      <UploadCloud className="w-4 h-4" /> Chọn File Từ Máy Tính
                    </span>
                  </>
                )}

                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleProcessFile(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Text Input with Ready Presets */}
          {activeTab === 'TEXT' && (
            <div className="space-y-4">
              {/* Presets Quick Insert Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Chèn Nhanh Dữ Liệu Mẫu (Nhấp để thử ngay):
                  </span>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setRawText('');
                        setParsedStudents([]);
                        setSelectedExampleIndex(null);
                      }}
                      className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Xóa nội dung
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {textExamples.map((ex, idx) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleApplyExample(idx)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedExampleIndex === idx
                          ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-2 ring-amber-400/40'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-slate-800 text-[11px] block">{ex.title}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-1">{ex.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    handleParseText(e.target.value);
                  }}
                  placeholder="Dán danh sách mã sinh viên vào đây (mỗi dòng 1 mã sinh viên hoặc phân cách bằng dấu phẩy)...&#10;Ví dụ:&#10;B21DCCN001&#10;B21DCCN002&#10;B21DCCN003"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-y leading-relaxed shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-center gap-2.5 font-bold animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Section 2: Import Mode Selector (Crucial Feature) */}
          <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-800">
                Tùy Chọn Chế Độ Import (Import Mode)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: MERGE */}
              <div
                onClick={() => setImportMode('MERGE')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                  importMode === 'MERGE'
                    ? 'border-indigo-600 bg-white shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    importMode === 'MERGE' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {importMode === 'MERGE' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black text-xs text-slate-900 block flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    Thêm Mới / Bổ Sung (Add & Merge)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Giữ nguyên trạng thái flow của các bạn cũ trong lớp, chỉ kích hoạt và cập nhật thêm cho danh sách sinh viên import này.
                  </p>
                </div>
              </div>

              {/* Option B: REPLACE */}
              <div
                onClick={() => setImportMode('REPLACE')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                  importMode === 'REPLACE'
                    ? 'border-amber-600 bg-amber-50/30 shadow-md shadow-amber-100 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    importMode === 'REPLACE' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {importMode === 'REPLACE' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black text-xs text-amber-900 block flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Xóa Flow Cũ & Chỉ Theo Danh Sách Mới (Replace All)
                  </span>
                  <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
                    Tắt flow của tất cả các sinh viên cũ trong lớp, <strong>CHỈ BẬT flow</strong> cho danh sách sinh viên có trong file/text này.
                  </p>
                </div>
              </div>
            </div>

            {/* Default Permissions Toggle */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-4 flex-wrap text-xs text-slate-700">
              <span className="font-bold text-slate-500 text-[11px] uppercase">Quyền cấp mặc định:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={defaultAllowRegister}
                  onChange={(e) => {
                    setDefaultAllowRegister(e.target.checked);
                    setParsedStudents((prev) =>
                      prev.map((s) => ({ ...s, allowRegisterCourse: e.target.checked }))
                    );
                  }}
                  className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Flow Đăng Ký Môn</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={defaultAllowCancel}
                  onChange={(e) => {
                    setDefaultAllowCancel(e.target.checked);
                    setParsedStudents((prev) =>
                      prev.map((s) => ({ ...s, allowCancelCourse: e.target.checked }))
                    );
                  }}
                  className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
                <span>Flow Hủy Môn</span>
              </label>
            </div>
          </div>

          {/* Section 3: Live Preview Analysis & Table */}
          {parsedStudents.length > 0 && (
            <div className="space-y-3">
              {/* Preview Stats Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-xs">
                    Danh Sách Phân Tích Được ({parsedStudents.length} bạn):
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                    🟢 {inClassCount} bạn trong lớp
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-lg text-[11px]">
                    🔑 {linkedCount} bạn đã liên kết QLDTTX
                  </span>
                  {parsedStudents.length - inClassCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">
                      ⚪ {parsedStudents.length - inClassCount} bạn ngoài lớp
                    </span>
                  )}
                  {parsedStudents.length - linkedCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px]">
                      ⚠️ {parsedStudents.length - linkedCount} bạn chưa có TK QLDTTX
                    </span>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-center w-10">STT</th>
                      <th className="px-3 py-2">Mã SV</th>
                      <th className="px-3 py-2">Họ và Tên</th>
                      <th className="px-3 py-2 text-center">Thuộc Lớp</th>
                      <th className="px-3 py-2 text-center">Tài Khoản QLDTTX</th>
                      <th className="px-3 py-2 text-center">Bật Flow</th>
                      <th className="px-3 py-2 text-center">Đăng Ký</th>
                      <th className="px-3 py-2 text-center">Hủy Môn</th>
                      <th className="px-3 py-2 text-center w-10">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedStudents.map((st, i) => (
                      <tr key={st.maSV} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {st.maSV}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <strong className="text-slate-800">{st.hoTen || st.matchedName || '—'}</strong>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {st.isInClass ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" /> {st.classCode}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Khác lớp
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {st.isLinked ? (
                            <span className="text-emerald-700 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              🔑 Đã có TK
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              ⚠️ Chưa có TK
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={st.isEnabled}
                            onChange={() => handleToggleStudent(st.maSV)}
                            className="rounded text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={st.allowRegisterCourse}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedStudents((prev) =>
                                prev.map((s) => (s.maSV === st.maSV ? { ...s, allowRegisterCourse: checked } : s))
                              );
                            }}
                            className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={st.allowCancelCourse}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setParsedStudents((prev) =>
                                prev.map((s) => (s.maSV === st.maSV ? { ...s, allowCancelCourse: checked } : s))
                              );
                            }}
                            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(st.maSV)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Xóa bạn này khỏi danh sách import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-[11px] text-slate-500">
            {parsedStudents.length > 0 ? (
              <span>
                Sẽ cấu hình Flow cho <strong className="text-indigo-700">{parsedStudents.length} bạn</strong> (
                {importMode === 'REPLACE' ? (
                  <strong className="text-amber-700">Chế độ ghi đè toàn bộ</strong>
                ) : (
                  <strong className="text-emerald-700">Chế độ bổ sung</strong>
                )}
                )
              </span>
            ) : (
              <span>Vui lòng chọn file CSV hoặc nhập danh sách text để bắt đầu.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={parsedStudents.length === 0 || isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                importMode === 'REPLACE'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý import...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    Xác Nhận Import ({parsedStudents.length} Sinh Viên)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
