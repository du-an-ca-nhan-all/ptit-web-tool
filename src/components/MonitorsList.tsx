import React from 'react';
import { Shield, Phone, Mail, GraduationCap } from 'lucide-react';
import { LoginUser } from '../types';

interface MonitorsListProps {
  users: LoginUser[];
  onClassClick?: (classCode: string) => void;
}

export default function MonitorsList({ users, onClassClick }: MonitorsListProps) {
  const monitors = users.filter(user => user.role === 'lop_truong');

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Danh Sách Lớp Trưởng</h2>
            <p className="text-sm text-slate-500">Thông tin liên hệ của các lớp trưởng</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Shield className="w-12 h-12 mb-4 text-slate-300" />
              <p>Chưa có thông tin lớp trưởng nào được cấu hình.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monitors.map((monitor, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${monitor.username}`} 
                        alt={monitor.fullName || monitor.username} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{monitor.fullName || 'Chưa cập nhật tên'}</h3>
                      <div className="text-xs font-mono font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded inline-block mt-1">
                        {monitor.username}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-5">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      {monitor.lop ? (
                        <button 
                          onClick={() => onClassClick && onClassClick(monitor.lop!)}
                          className="text-blue-600 font-medium hover:underline text-left cursor-pointer"
                        >
                          {monitor.lop}
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Chưa rõ lớp</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className={monitor.phoneNumber ? "text-slate-700 font-medium font-mono" : "text-slate-400 italic"}>
                        {monitor.phoneNumber || 'Chưa có SĐT'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
