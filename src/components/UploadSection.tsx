import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { ExamRecord } from '../types';

interface UploadSectionProps {
  onDataLoaded: (data: ExamRecord[]) => void;
}

export default function UploadSection({ onDataLoaded }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Vui lòng chọn file CSV.');
      return;
    }

    Papa.parse<ExamRecord>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError('Có lỗi xảy ra khi đọc file. Vui lòng kiểm tra định dạng.');
          return;
        }
        
        // Clean up data if necessary (e.g. trimming keys)
        const cleanedData = results.data.filter(row => row.MaSV);
        onDataLoaded(cleanedData);
      },
      error: (err) => {
        setError(`Lỗi: ${err.message}`);
      }
    });
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
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className={`w-16 h-16 mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Tải lên danh sách thi</h3>
        <p className="text-slate-500 mb-6 font-medium">Kéo thả file CSV vào đây hoặc click để chọn file</p>
        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          Chọn File CSV
        </button>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
        />
      </div>

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
