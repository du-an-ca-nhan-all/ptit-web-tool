import React, { useMemo, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import TelegramAutoDetectModal from './TelegramAutoDetectModal';
import AdminHeaderBanner from './admin-telegram-bot-manager/AdminHeaderBanner';
import BackupAlertsTab from './admin-telegram-bot-manager/BackupAlertsTab';
import BroadcastTab from './admin-telegram-bot-manager/BroadcastTab';
import GlobalBotConfigTab from './admin-telegram-bot-manager/GlobalBotConfigTab';
import QueueMonitorTab from './admin-telegram-bot-manager/QueueMonitorTab';
import RemindersTab from './admin-telegram-bot-manager/RemindersTab';
import SubscribersTab from './admin-telegram-bot-manager/SubscribersTab';
import {
  AdminDetectTarget,
  AdminSubTab,
  AdminTelegramBotManagerProps,
  SubscriberFilterStatus,
} from './admin-telegram-bot-manager/types';
import { useBackupAlertsConfig } from './admin-telegram-bot-manager/useBackupAlertsConfig';
import { useGlobalBotConfig } from './admin-telegram-bot-manager/useGlobalBotConfig';
import { useQueueManager } from './admin-telegram-bot-manager/useQueueManager';
import { useRemindersAndBroadcast } from './admin-telegram-bot-manager/useRemindersAndBroadcast';
import { filterSubscribersList, isAdminUser } from './admin-telegram-bot-manager/utils';

export default function AdminTelegramBotManager({ currentUser }: AdminTelegramBotManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('CONFIG');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SubscriberFilterStatus>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdminAutoDetectOpen, setIsAdminAutoDetectOpen] = useState(false);
  const [adminDetectTarget, setAdminDetectTarget] = useState<AdminDetectTarget>('TEST');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const queue = useQueueManager({ activeSubTab, setSuccessMsg, setErrorMsg });
  const backup = useBackupAlertsConfig({ setSuccessMsg, setErrorMsg });
  const bot = useGlobalBotConfig({
    onQueueStats: queue.setQueueStats,
    onHydrateAdminConfig: backup.hydrateFromAdminConfig,
    onHydrateBackupConfig: backup.hydrateFromBackupConfig,
    setSuccessMsg,
    setErrorMsg,
  });
  const reminders = useRemindersAndBroadcast({
    subscribers: bot.subscribers,
    setSuccessMsg,
    setErrorMsg,
  });

  const filteredSubscribers = useMemo(
    () => filterSubscribersList(bot.subscribers, searchQuery, filterStatus),
    [bot.subscribers, searchQuery, filterStatus]
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalActive = bot.subscribers.filter((s) => s.isEnabled).length;
  const totalSystemBotUsers = bot.subscribers.filter((s) => !s.isCustomBot).length;

  if (!isAdminUser(currentUser)) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto my-8">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Quyền Truy Cập Bị Giới Hạn</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Màn hình Quản trị Bot Toàn Cục chỉ hiển thị và cho phép truy cập với người quản trị
          (Admin).
        </p>
      </div>
    );
  }

  if (bot.isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-sm font-medium">Đang tải trung tâm quản trị Telegram Bot...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminHeaderBanner
        systemBot={bot.systemBot}
        systemBotConfig={bot.systemBotConfig}
        subscribersCount={bot.subscribers.length}
        totalActive={totalActive}
        totalSystemBotUsers={totalSystemBotUsers}
        successMsg={successMsg}
        errorMsg={errorMsg}
        activeSubTab={activeSubTab}
        onChangeSubTab={setActiveSubTab}
        queueStats={queue.queueStats}
      />

      {activeSubTab === 'CONFIG' && (
        <GlobalBotConfigTab
          systemBot={bot.systemBot}
          systemBotConfig={bot.systemBotConfig}
          botTokenInput={bot.botTokenInput}
          setBotTokenInput={bot.setBotTokenInput}
          botDescription={bot.botDescription}
          setBotDescription={bot.setBotDescription}
          showToken={bot.showToken}
          setShowToken={bot.setShowToken}
          isSavingBot={bot.isSavingBot}
          isTogglingBot={bot.isTogglingBot}
          onSaveGlobalBot={bot.handleSaveGlobalBot}
          onToggleGlobalBot={bot.handleToggleGlobalBot}
          onRefresh={bot.fetchData}
          testChatId={bot.testChatId}
          setTestChatId={bot.setTestChatId}
          testThreadId={bot.testThreadId}
          setTestThreadId={bot.setTestThreadId}
          isTesting={bot.isTesting}
          testResult={bot.testResult}
          onAdminTest={bot.handleAdminTest}
          onOpenAutoDetectForTest={() => {
            setAdminDetectTarget('TEST');
            setIsAdminAutoDetectOpen(true);
          }}
        />
      )}

      {activeSubTab === 'SUBSCRIBERS' && (
        <SubscribersTab
          filteredSubscribers={filteredSubscribers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          copiedId={copiedId}
          onCopy={handleCopy}
        />
      )}

      {activeSubTab === 'REMINDERS' && (
        <RemindersTab
          customReminderDate={reminders.customReminderDate}
          setCustomReminderDate={reminders.setCustomReminderDate}
          forceAllReminders={reminders.forceAllReminders}
          setForceAllReminders={reminders.setForceAllReminders}
          isTriggeringReminders={reminders.isTriggeringReminders}
          reminderRunResult={reminders.reminderRunResult}
          onRunReminders={reminders.handleRunReminders}
          classReminderDays={reminders.classReminderDays}
          setClassReminderDays={reminders.setClassReminderDays}
          isTriggeringClassReminders={reminders.isTriggeringClassReminders}
          classReminderRunResult={reminders.classReminderRunResult}
          onRunClassNearestReminders={reminders.handleRunClassNearestReminders}
        />
      )}

      {activeSubTab === 'BROADCAST' && (
        <BroadcastTab
          totalActive={totalActive}
          broadcastTitle={reminders.broadcastTitle}
          setBroadcastTitle={reminders.setBroadcastTitle}
          broadcastContent={reminders.broadcastContent}
          setBroadcastContent={reminders.setBroadcastContent}
          isBroadcasting={reminders.isBroadcasting}
          broadcastResult={reminders.broadcastResult}
          onBroadcast={reminders.handleBroadcast}
        />
      )}

      {activeSubTab === 'BACKUP_ALERTS' && (
        <BackupAlertsTab
          systemBot={bot.systemBot}
          backup={backup}
          onOpenAutoDetectForBackup={() => {
            setAdminDetectTarget('BACKUP');
            setIsAdminAutoDetectOpen(true);
          }}
        />
      )}

      {activeSubTab === 'QUEUE' && (
        <QueueMonitorTab
          queueStats={queue.queueStats}
          isFetchingQueue={queue.isFetchingQueue}
          isTogglingQueuePause={queue.isTogglingQueuePause}
          isClearingQueue={queue.isClearingQueue}
          onRefreshQueue={queue.fetchQueueStats}
          onToggleQueuePause={queue.handleToggleQueuePause}
          onClearQueue={queue.handleClearQueue}
        />
      )}

      <TelegramAutoDetectModal
        isOpen={isAdminAutoDetectOpen}
        onClose={() => setIsAdminAutoDetectOpen(false)}
        botToken={backup.useCustomBackupBot && adminDetectTarget === 'BACKUP' ? backup.telBackupBotToken : undefined}
        botUsername={bot.systemBot?.botUsername}
        onSelectChat={({ chatId: selectedChatId, chatTitle, threadId: selectedThreadId }) => {
          if (adminDetectTarget === 'TEST') {
            bot.setTestChatId(selectedChatId);
            if (selectedThreadId) bot.setTestThreadId(selectedThreadId);
          } else {
            backup.setTelChatId(selectedChatId);
            if (selectedThreadId) backup.setTelThreadId(selectedThreadId);
          }
          setSuccessMsg(`Đã áp dụng: ${chatTitle} (${selectedChatId}${selectedThreadId ? ` - Topic #${selectedThreadId}` : ''})`);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
}
