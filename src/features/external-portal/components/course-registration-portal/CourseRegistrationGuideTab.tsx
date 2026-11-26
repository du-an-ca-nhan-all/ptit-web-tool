'use client';

import React from 'react';
import {
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export function CourseRegistrationGuideTab() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800">
            Hướng Dẫn & Mẹo Đăng Ký Môn Học QLHT / QLDTTX
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kinh nghiệm canh slot và đăng ký môn học hiệu quả cho sinh viên PTIT
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
          <h4 className="font-black text-indigo-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" /> 1. Cơ Chế Auto Canh Slot (Sniper)
          </h4>
          <p>
            Hệ thống sử dụng thuật toán mã hóa ngược chữ ký <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">ua</code> của cổng đào tạo Netweb / AQTech, cho phép gửi gói tin trực tiếp lên máy chủ mà không cần tải lại toàn bộ trang web.
          </p>
          <p>
            Khi ai đó vừa hủy môn hoặc khoa nâng sĩ số lớp, bot sẽ phát hiện trong 1.5 giây và gửi request đăng ký ngay.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
          <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Kiểm Tra Trùng Lịch Học
          </h4>
          <p>
            Trước khi đăng ký, hãy chú ý cột <strong>Thời Khóa Biểu (TKB)</strong> để tránh đăng ký 2 môn học cùng buổi (Thứ, Tiết) hoặc cùng tuần thi.
          </p>
          <p>
            Sau khi đăng ký thành công, bạn có thể chuyển sang tab <strong>Môn Học Đã Đăng Ký</strong> để xem tổng số tín chỉ và học phí tạm tính.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
          <h4 className="font-black text-amber-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" /> 3. Thời Gian Canh Slot Hiệu Quả
          </h4>
          <p>
            Sinh viên thường nhả môn vào các khung giờ: <strong>23h00 - 01h00 đêm</strong>, <strong>06h00 - 08h00 sáng</strong>, hoặc <strong>1 - 2 ngày cuối cùng</strong> của đợt điều chỉnh ĐKMH.
          </p>
          <p>
            Bạn có thể bật âm thanh thông báo và để máy tính chạy tab Auto Canh Slot.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" /> 4. An Toàn & Bảo Mật
          </h4>
          <p>
            Mật khẩu và phiên đăng nhập được lưu trữ an toàn trong cơ sở dữ liệu và chỉ dùng để giao tiếp với cổng trường <code className="font-mono bg-white px-1.5 py-0.5 rounded border">qldttx.pttc1.edu.vn</code>.
          </p>
          <p>
            Bạn có thể thay đổi hoặc hủy liên kết tài khoản bất kỳ lúc nào trong phần Hồ sơ cá nhân.
          </p>
        </div>
      </div>
    </div>
  );
}
