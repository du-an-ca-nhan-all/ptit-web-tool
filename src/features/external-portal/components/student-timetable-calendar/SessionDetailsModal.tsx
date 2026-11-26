import React from 'react';
import { X } from 'lucide-react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import { SubjectProgressItem } from '../../utils/timetableProgress';
import { SessionNumberInfo } from './types';
import ReminderEventModalContent from './ReminderEventModalContent';
import ClassEventModalContent from './ClassEventModalContent';

interface SessionDetailsModalProps {
  event: TimetableCalendarEvent | null;
  eventSessionNumberMap: Map<string, SessionNumberInfo>;
  subjectProgressMap: Map<string, SubjectProgressItem>;
  copiedLink: boolean;
  onCopyLink: (link: string) => void;
  onClose: () => void;
  onNavigateToReminders?: () => void;
}

export default function SessionDetailsModal({
  event,
  eventSessionNumberMap,
  subjectProgressMap,
  copiedLink,
  onCopyLink,
  onClose,
  onNavigateToReminders,
}: SessionDetailsModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {event.rawSession?.isReminder ? (
          <ReminderEventModalContent
            event={event}
            onClose={onClose}
            onNavigateToReminders={onNavigateToReminders}
          />
        ) : (
          <ClassEventModalContent
            event={event}
            sessionInfo={eventSessionNumberMap.get(event.id)}
            subjectProgress={subjectProgressMap.get(event.subjectCode)}
            copiedLink={copiedLink}
            onCopyLink={onCopyLink}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
