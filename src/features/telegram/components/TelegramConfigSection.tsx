import React from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import TelegramTopicSelectorModal from './TelegramTopicSelectorModal';
import TelegramAutoDetectModal from './TelegramAutoDetectModal';
import { TelegramConfigSectionProps } from './telegram-config-section/types';
import { useTelegramConfig } from './telegram-config-section/useTelegramConfig';
import TelegramHeaderBanner from './telegram-config-section/TelegramHeaderBanner';
import AdminSystemBotPanel from './telegram-config-section/AdminSystemBotPanel';
import TelegramSetupGuide from './telegram-config-section/TelegramSetupGuide';
import TelegramFeedbackBanners from './telegram-config-section/TelegramFeedbackBanners';
import BotModeSelector from './telegram-config-section/BotModeSelector';
import TelegramConnectionFields from './telegram-config-section/TelegramConnectionFields';
import NotificationSettingsCard from './telegram-config-section/NotificationSettingsCard';
import TelegramFormActions from './telegram-config-section/TelegramFormActions';
import TelegramMessagePreview from './telegram-config-section/TelegramMessagePreview';

export default function TelegramConfigSection({
  currentUser,
  targetUsername,
  onConfigUpdated,
  onNavigateTab,
}: TelegramConfigSectionProps) {
  const s = useTelegramConfig({ currentUser, targetUsername, onConfigUpdated });

  if (s.isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-sm font-medium">Đang tải thông tin cấu hình Telegram...</span>
      </div>
    );
  }

  const handleOpenTopicModal = () => {
    s.setErrorMsg('');
    if (!s.chatId.trim()) {
      s.setErrorMsg('Vui lòng nhập Chat ID nhóm trước khi quét Topic.');
      return;
    }
    if (s.isCustomBot && !s.botToken.trim()) {
      s.setErrorMsg('Vui lòng nhập Bot Token riêng trước khi quét Topic.');
      return;
    }
    s.setIsTopicModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <TelegramHeaderBanner
        showGuide={s.showGuide}
        onToggleGuide={() => s.setShowGuide(!s.showGuide)}
        isAdmin={s.isAdmin}
        onNavigateTab={onNavigateTab}
        isAdminPanelOpen={s.isAdminPanelOpen}
        onToggleAdminPanel={() => s.setIsAdminPanelOpen(!s.isAdminPanelOpen)}
        isConnected={s.isConnected}
        isCustomBot={s.isCustomBot}
        activeBotUsername={s.activeBotUsername}
      />

      {s.isAdmin && s.isAdminPanelOpen && (
        <AdminSystemBotPanel
          systemBot={s.systemBot}
          adminSystemToken={s.adminSystemToken}
          onAdminSystemTokenChange={s.setAdminSystemToken}
          isSavingSystemBot={s.isSavingSystemBot}
          systemBotMsg={s.systemBotMsg}
          systemBotError={s.systemBotError}
          onSubmit={s.handleSaveSystemBot}
        />
      )}

      {s.showGuide && (
        <TelegramSetupGuide
          activeBotUsername={s.activeBotUsername}
          onOpenAutoDetect={() => s.setIsAutoDetectModalOpen(true)}
        />
      )}

      <TelegramFeedbackBanners
        successMsg={s.successMsg}
        errorMsg={s.errorMsg}
        testResult={s.testResult}
        chatId={s.chatId}
      />

      {/* Main Configuration Form */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-sky-50 text-sky-600 rounded-xl sm:rounded-2xl shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800">Cấu Hình Thông Báo Telegram</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Tài khoản: <span className="font-mono font-bold text-indigo-600">{s.usernameToQuery}</span>
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={s.isEnabled}
              onChange={(e) => s.setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
            <span className="text-xs font-bold text-slate-700">
              {s.isEnabled ? 'Đang BẬT nhận thông báo' : 'Đang TẮT nhận thông báo'}
            </span>
          </label>
        </div>

        <BotModeSelector
          isCustomBot={s.isCustomBot}
          systemBot={s.systemBot}
          onSelectSystemBot={() => {
            s.setIsCustomBot(false);
            s.setBotToken('');
          }}
          onSelectCustomBot={() => s.setIsCustomBot(true)}
        />

        <form onSubmit={s.handleSave} className="flex flex-col gap-4 sm:gap-5">
          <TelegramConnectionFields
            isCustomBot={s.isCustomBot}
            botToken={s.botToken}
            onBotTokenChange={s.setBotToken}
            showToken={s.showToken}
            onToggleShowToken={() => s.setShowToken(!s.showToken)}
            chatId={s.chatId}
            onChatIdChange={s.handleChatIdChange}
            onApplyChatSuggestion={(suggestion) => {
              s.setChatId(suggestion);
              s.setSmartChatSuggestion(null);
            }}
            parsedNotice={s.parsedNotice}
            onDismissParsedNotice={() => s.setParsedNotice(null)}
            smartChatSuggestion={s.smartChatSuggestion}
            threadId={s.threadId}
            onThreadIdChange={s.handleThreadIdChange}
            selectedTopicName={s.selectedTopicName}
            onClearTopic={() => {
              s.setThreadId('');
              s.setSelectedTopicName(null);
            }}
            onOpenAutoDetect={() => s.setIsAutoDetectModalOpen(true)}
            onOpenTopicModal={handleOpenTopicModal}
          />

          <NotificationSettingsCard state={s} onNavigateTab={onNavigateTab} />

          <TelegramFormActions
            isConnected={s.isConnected}
            isDeleting={s.isDeleting}
            isTesting={s.isTesting}
            isSaving={s.isSaving}
            chatId={s.chatId}
            isCustomBot={s.isCustomBot}
            botToken={s.botToken}
            onDelete={s.handleDelete}
            onTest={s.handleTest}
          />
        </form>
      </div>

      <TelegramMessagePreview
        isCustomBot={s.isCustomBot}
        currentUser={currentUser}
        activeBotUsername={s.activeBotUsername}
        chatId={s.chatId}
        threadId={s.threadId}
      />

      <TelegramTopicSelectorModal
        isOpen={s.isTopicModalOpen}
        onClose={() => s.setIsTopicModalOpen(false)}
        botToken={s.isCustomBot ? s.botToken : undefined}
        chatId={s.chatId}
        currentSelectedThreadId={s.threadId}
        onSelectTopic={(topic) => {
          s.setThreadId(topic.threadId);
          s.setSelectedTopicName(topic.name);
          s.setSuccessMsg(`Đã chọn Topic: "${topic.name}" (ID: ${topic.threadId})`);
          setTimeout(() => s.setSuccessMsg(''), 3000);
        }}
      />

      <TelegramAutoDetectModal
        isOpen={s.isAutoDetectModalOpen}
        onClose={() => s.setIsAutoDetectModalOpen(false)}
        botToken={s.isCustomBot ? s.botToken : undefined}
        botUsername={s.activeBotUsername || s.systemBot?.botUsername}
        onSelectChat={({ chatId: selectedChatId, chatTitle, chatType, threadId: selectedThreadId, topicName }) => {
          s.setChatId(selectedChatId);
          s.setSmartChatSuggestion(null);
          if (selectedThreadId) {
            s.setThreadId(selectedThreadId);
            s.setSelectedTopicName(topicName || `Topic #${selectedThreadId}`);
          }
          s.setSuccessMsg(`Đã nhận diện: ${chatTitle} (${selectedChatId}${selectedThreadId ? ` - Topic #${selectedThreadId}` : ''})`);
          setTimeout(() => s.setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
}
