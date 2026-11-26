'use client';

import { useEffect, useRef, useState } from 'react';
import {
  parseClassMembersFile,
  parseClassMembersText,
  type ImportClassMemberRow,
} from '../../utils/classMemberImportParser';
import type { ClassMemberImportPreview } from '../../server/classMemberImportService';
import type { ImportStep, InputTab } from './types';

interface UseImportClassMembersParams {
  isOpen: boolean;
  selectedClass: string;
  onImportSuccess: (message: string) => void;
  onClose: () => void;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function useImportClassMembers({
  isOpen,
  selectedClass,
  onImportSuccess,
  onClose,
}: UseImportClassMembersParams) {
  const [step, setStep] = useState<ImportStep>('INPUT');
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

  const handleClearFile = () => {
    setUploadedFile(null);
    setParsedItems([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleBackToInput = () => {
    setApiError(null);
    setStep('INPUT');
  };

  return {
    step,
    inputTab,
    setInputTab,
    uploadedFile,
    isDragging,
    setIsDragging,
    fileInputRef,
    rawText,
    parsedItems,
    duplicateCount,
    skippedCount,
    parseError,
    previewData,
    isLoadingPreview,
    isExecuting,
    apiError,
    isBusy: isLoadingPreview || isExecuting,
    handleProcessFile,
    handleClearFile,
    handleTextChange,
    handleRemoveItem,
    handleRequestPreview,
    handleConfirmExecute,
    handleBackToInput,
  };
}
