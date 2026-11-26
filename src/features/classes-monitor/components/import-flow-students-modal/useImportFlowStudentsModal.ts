import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import {
  ImportFlowStudentsModalProps,
  ImportMode,
  ParsedFlowStudent,
  TabType,
} from './types';
import {
  buildTextExamples,
  downloadSampleCSV,
  parseRawTextToRows,
  parseRowsToStudents,
} from './utils';

export function useImportFlowStudentsModal({
  isOpen,
  onClose,
  selectedClass,
  monitorUsername,
  existingClassStudents = [],
  onConfirmImport,
}: Pick<
  ImportFlowStudentsModalProps,
  | 'isOpen'
  | 'onClose'
  | 'selectedClass'
  | 'monitorUsername'
  | 'existingClassStudents'
  | 'onConfirmImport'
>) {
  const [activeTab, setActiveTab] = useState<TabType>('FILE');
  const [importMode, setImportMode] = useState<ImportMode>('MERGE');

  // Default permissions
  const [defaultAllowRegister, setDefaultAllowRegister] = useState(true);
  const [defaultAllowCancel, setDefaultAllowCancel] = useState(true);
  const [defaultIsEnabled] = useState(true);

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

  const parseRows = (rows: any[][]) =>
    parseRowsToStudents(rows, monitorUsername, selectedClass, classStudentMap, {
      defaultIsEnabled,
      defaultAllowRegister,
      defaultAllowCancel,
    });

  // Parse Text input
  const handleParseText = (text: string) => {
    setParseError(null);
    if (!text.trim()) {
      setParsedStudents([]);
      return;
    }

    const { rows, error } = parseRawTextToRows(text);
    if (error) {
      setParsedStudents([]);
      setParseError(error);
      return;
    }

    if (rows) {
      const students = parseRows(rows);
      setParsedStudents(students);
      if (students.length === 0) {
        setParseError('Không tìm thấy mã sinh viên hợp lệ nào trong văn bản đã nhập.');
      }
    }
  };

  // Parse File input
  const handleProcessFile = (file: File) => {
    setParseError(null);
    setUploadedFile(file);

    const isCsv =
      file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.tsv');
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
        const students = parseRows(results.data as any[][]);
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

  const handleClearFile = () => {
    setUploadedFile(null);
    setParsedStudents([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearText = () => {
    setRawText('');
    setParsedStudents([]);
    setSelectedExampleIndex(null);
  };

  const handleRawTextChange = (value: string) => {
    setRawText(value);
    handleParseText(value);
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

  const handleToggleRegister = (maSV: string, checked: boolean) => {
    setParsedStudents((prev) =>
      prev.map((s) => (s.maSV === maSV ? { ...s, allowRegisterCourse: checked } : s))
    );
  };

  const handleToggleCancel = (maSV: string, checked: boolean) => {
    setParsedStudents((prev) =>
      prev.map((s) => (s.maSV === maSV ? { ...s, allowCancelCourse: checked } : s))
    );
  };

  const handleDefaultRegisterChange = (checked: boolean) => {
    setDefaultAllowRegister(checked);
    setParsedStudents((prev) => prev.map((s) => ({ ...s, allowRegisterCourse: checked })));
  };

  const handleDefaultCancelChange = (checked: boolean) => {
    setDefaultAllowCancel(checked);
    setParsedStudents((prev) => prev.map((s) => ({ ...s, allowCancelCourse: checked })));
  };

  const handleDownloadSampleCSV = () => {
    downloadSampleCSV(selectedClass, existingClassStudents);
  };

  const textExamples = buildTextExamples(existingClassStudents);

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

  return {
    activeTab,
    setActiveTab,
    importMode,
    setImportMode,
    defaultAllowRegister,
    defaultAllowCancel,
    uploadedFile,
    isDragging,
    fileInputRef,
    rawText,
    parsedStudents,
    parseError,
    selectedExampleIndex,
    textExamples,
    inClassCount,
    linkedCount,
    handleProcessFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearFile,
    handleClearText,
    handleRawTextChange,
    handleRemoveStudent,
    handleToggleStudent,
    handleToggleRegister,
    handleToggleCancel,
    handleDefaultRegisterChange,
    handleDefaultCancelChange,
    handleDownloadSampleCSV,
    handleApplyExample,
    handleSubmit,
  };
}
