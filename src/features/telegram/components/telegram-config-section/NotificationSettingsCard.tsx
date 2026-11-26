import React from 'react';
import { Bell, CheckCircle2, Lock } from 'lucide-react';
import { TelegramConfigState } from './useTelegramConfig';
import NotificationReadinessBanners from './NotificationReadinessBanners';
import NotificationOptionsGrid from './NotificationOptionsGrid';
import NotificationSchedulePanels from './NotificationSchedulePanels';

interface NotificationSettingsCardProps {
  state: TelegramConfigState;
  onNavigateTab?: (tab: string) => void;
}

export default function NotificationSettingsCard({
  state: s,
  onNavigateTab,
}: NotificationSettingsCardProps) {
  return (
    <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col gap-3 transition-colors ${
      !s.isTelegramReady
        ? 'bg-slate-100/70 border-slate-300'
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Bell className="w-3.5 h-3.5 text-sky-600" />
          <span>Tùy Chọn Nhận Các Loại Thông Báo</span>
        </div>
        <div>
          {s.isTelegramReady ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Đã sẵn sàng</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" />
              <span>Chưa kích hoạt</span>
            </span>
          )}
        </div>
      </div>

      <NotificationReadinessBanners
        isTelegramReady={s.isTelegramReady}
        isTelegramConfigured={s.isTelegramConfigured}
        testResult={s.testResult}
        config={s.config}
        isTesting={s.isTesting}
        chatId={s.chatId}
        isCustomBot={s.isCustomBot}
        botToken={s.botToken}
        onTest={s.handleTest}
        isQldttxAvailable={s.isQldttxAvailable}
        isQldttxError={s.isQldttxError}
        onNavigateTab={onNavigateTab}
      />

      <NotificationOptionsGrid
        isTelegramReady={s.isTelegramReady}
        isQldttxAvailable={s.isQldttxAvailable}
        isQldttxError={s.isQldttxError}
        isSlinkAvailable={s.isSlinkAvailable}
        isSlinkError={s.isSlinkError}
        notifyExamSchedule={s.notifyExamSchedule}
        onChangeNotifyExamSchedule={s.setNotifyExamSchedule}
        notifyClassSchedule={s.notifyClassSchedule}
        onChangeNotifyClassSchedule={s.setNotifyClassSchedule}
        notifyClassActivity={s.notifyClassActivity}
        onChangeNotifyClassActivity={s.setNotifyClassActivity}
        notifyQldtAnnouncements={s.notifyQldtAnnouncements}
        onChangeNotifyQldtAnnouncements={s.setNotifyQldtAnnouncements}
        notifySlinkAnnouncements={s.notifySlinkAnnouncements}
        onChangeNotifySlinkAnnouncements={s.setNotifySlinkAnnouncements}
      />

      <NotificationSchedulePanels
        isTelegramReady={s.isTelegramReady}
        isQldttxAvailable={s.isQldttxAvailable}
        isSlinkAvailable={s.isSlinkAvailable}
        notifyClassSchedule={s.notifyClassSchedule}
        classReminderBefore={s.classReminderBefore}
        onChangeClassReminderBefore={s.setClassReminderBefore}
        isCheckingClassSchedule={s.isCheckingClassSchedule}
        isCheckingNearestClassSchedule={s.isCheckingNearestClassSchedule}
        onCheckClassScheduleNow={s.handleCheckClassScheduleNow}
        onCheckNearestClassSchedule={s.handleCheckNearestClassSchedule}
        classScheduleCheckMsg={s.classScheduleCheckMsg}
        nearestClassScheduleMsg={s.nearestClassScheduleMsg}
        notifyQldtAnnouncements={s.notifyQldtAnnouncements}
        qldtCheckInterval={s.qldtCheckInterval}
        onChangeQldtCheckInterval={s.setQldtCheckInterval}
        isCheckingQldt={s.isCheckingQldt}
        onCheckQldtNow={s.handleCheckQldtNow}
        qldtCheckMsg={s.qldtCheckMsg}
        notifySlinkAnnouncements={s.notifySlinkAnnouncements}
        slinkCheckInterval={s.slinkCheckInterval}
        onChangeSlinkCheckInterval={s.setSlinkCheckInterval}
        isCheckingSlink={s.isCheckingSlink}
        onCheckSlinkNow={s.handleCheckSlinkNow}
        slinkCheckMsg={s.slinkCheckMsg}
      />
    </div>
  );
}
