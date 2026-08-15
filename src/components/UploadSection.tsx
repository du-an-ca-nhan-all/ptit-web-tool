import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import Papa from 'papaparse';
import { ExamRecord } from '../types';

interface UploadSectionProps {
  onDataLoaded: (data: ExamRecord[]) => void;
  onRefreshFromDb?: () => void;
}

export default function UploadSection({ onDataLoaded, onRefreshFromDb }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUploadingDb, setIsUploadingDb] = useState(false);
  const [saveToDb, setSaveToDb] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccessMsg(null);

    if (!file.name.endsWith('.csv')) {
      setError('Vui lòng chọn file CSV.');
      return;
    }

    if (saveToDb) {
      setIsUploadingDb(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('replace', 'true');

        const res = await fetch('/api/exam-records/import', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Đã lưu dữ liệu vào cơ sở dữ liệu SQLite thành công!');
          if (onRefreshFromDb) {
            onRefreshFromDb();
          } else {
            // Read client side to display immediately
            const text = await file.text();
            Papa.parse<ExamRecord>(text, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                const cleanedData = results.data.filter((row) => row.MaSV);
                onDataLoaded(cleanedData);
              },
            });
          }
          return;
        }
        throw new Error(data.error || 'Lỗi khi lưu vào cơ sở dữ liệu');
      } catch (err: any) {
        setError(`Lỗi: ${err.message}`);
      } finally {
        setIsUploadingDb(false);
      }
    } else {
      Papa.parse<ExamRecord>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setError('Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra định dạng.');
            return;
          }
          const cleanedData = results.data.filter((row) => row.MaSV);
          onDataLoaded(cleanedData);
        },
        error: (err) => {
          setError(`Lỗi: ${err.message}`);
        },
      });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center
          ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 bg-white'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploadingDb && fileInputRef.current?.click()}
      >
        <UploadCloud className={`w-16 h-16 mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Tải lên danh sách thi</h3>
        <p className="text-slate-500 mb-6 font-medium">Kéo thả file CSV vào đây hoặc click để chọn file</p>
        
        <button 
          disabled={isUploadingDb}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
        >
          {isUploadingDb ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang lưu vào Database...
            </>
          ) : (
            'Chọn File CSV'
          )}
        </button>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={saveToDb}
            onChange={(e) => setSaveToDb(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            Lưu trực tiếp vào Cơ sở dữ liệu SQLite Server-side
          </span>
        </label>
      </div>

      {successMsg && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <p>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8 bg-slate-50 p-5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm uppercase tracking-wider">
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Định dạng hỗ trợ</span>
        </div>
        <p className="text-sm text-slate-600 font-medium">
          File tải lên phải là định dạng <strong>.csv</strong> có dòng tiêu đề (header) chứa các cột:
          <br/><br/>
          <code className="bg-white px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-700 break-all leading-loose font-mono shadow-sm">
            MaSV, HoLotSV, TenSV, PHAI, NgaySinhC, NhomThi, MAPTHI, MaMH, TenMH, MaHTThi, NhomHoc, To thi, MaLop, NgayThi, GioThi, SoPhutThi, MaDotThi, TenDotThi
          </code>
        </p>
      </div>
    </div>
  );
}
