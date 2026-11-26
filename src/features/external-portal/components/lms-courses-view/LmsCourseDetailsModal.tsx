import React from 'react';
import {
  BookOpen,
  ExternalLink,
  FileCheck,
  FileText,
  Folder,
  HelpCircle,
  MessageSquare,
  Video,
  X,
} from 'lucide-react';
import { ActiveCourseDetails } from './types';

interface LmsCourseDetailsModalProps {
  details: ActiveCourseDetails;
  onClose: () => void;
}

// Render activity type icon
function getActivityIcon(type: string) {
  switch (type) {
    case 'videotime':
    case 'supervideo':
    case 'video':
      return <Video className="w-4 h-4 text-sky-600 shrink-0" />;
    case 'resource':
      return <FileText className="w-4 h-4 text-indigo-600 shrink-0" />;
    case 'assign':
      return <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'quiz':
      return <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'forum':
      return <MessageSquare className="w-4 h-4 text-violet-600 shrink-0" />;
    case 'folder':
      return <Folder className="w-4 h-4 text-amber-500 shrink-0" />;
    default:
      return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  }
}

export function LmsCourseDetailsModal({ details, onClose }: LmsCourseDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight line-clamp-1">
                {details.course.courseName || details.course.fullName}
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                {details.totalActivities} hoạt động bài học • Tiến độ:{' '}
                <strong>{details.course.progressPercent}%</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sections List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {details.sections.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs font-bold">
              Không tìm thấy danh sách bài học chi tiết.
            </div>
          ) : (
            details.sections.map((sec, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <h4 className="font-black text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{sec.title}</span>
                </h4>

                <div className="space-y-1.5 pl-7">
                  {sec.activities.map((act) => (
                    <a
                      key={act.id}
                      href={act.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white hover:bg-sky-50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getActivityIcon(act.type)}
                        <span className="font-medium text-slate-700 group-hover:text-sky-700 truncate">
                          {act.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                        {act.type}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <a
            href={details.course.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>Mở Trên LMS</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
