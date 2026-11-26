import { useState, useEffect } from 'react';
import { parseTelegramInput, parseTopicInput } from '../../utils/telegramParser';

interface UseTelegramInputParsersParams {
  setChatId: (val: string) => void;
  setThreadId: (val: string) => void;
  setSelectedTopicName: (val: string | null) => void;
  setIsCustomBot: (val: boolean) => void;
  setBotToken: (val: string) => void;
  setSuccessMsg: (msg: string) => void;
}

export function useTelegramInputParsers({
  setChatId,
  setThreadId,
  setSelectedTopicName,
  setIsCustomBot,
  setBotToken,
  setSuccessMsg,
}: UseTelegramInputParsersParams) {
  const [smartChatSuggestion, setSmartChatSuggestion] = useState<string | null>(null);
  const [parsedNotice, setParsedNotice] = useState<string | null>(null);

  // Read URL query parameters (magic links from Telegram bot)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramChatId = urlParams.get('chatId');
      const paramThreadId = urlParams.get('threadId');
      const paramBotToken = urlParams.get('botToken');

      if (paramChatId) {
        setChatId(paramChatId);
        if (paramThreadId) {
          setThreadId(paramThreadId);
          setSelectedTopicName(`Topic #${paramThreadId}`);
        }
        if (paramBotToken) {
          setIsCustomBot(true);
          setBotToken(paramBotToken);
        }
        setSuccessMsg(`Đã tự động điền Chat ID ${paramChatId}${paramThreadId ? ` (Topic #${paramThreadId})` : ''} từ liên kết Telegram!`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    }
  }, []);

  // Smart Chat ID Input Change Handler (Link parser & suggestions)
  const handleChatIdChange = (val: string) => {
    const clean = val.trim();
    setSmartChatSuggestion(null);
    setParsedNotice(null);

    // Check if user pasted a Telegram link or topic link
    const parsed = parseTelegramInput(clean);
    if (parsed.isLink && parsed.chatId) {
      setChatId(parsed.chatId);
      if (parsed.threadId) {
        setThreadId(parsed.threadId);
        setSelectedTopicName(`Topic #${parsed.threadId}`);
      }
      setParsedNotice(parsed.explanation || `Đã trích xuất Chat ID: ${parsed.chatId}`);
      setTimeout(() => setParsedNotice(null), 5000);
      return;
    }

    if (parsed.username && parsed.isLink) {
      setChatId(parsed.username);
      if (parsed.threadId) {
        setThreadId(parsed.threadId);
        setSelectedTopicName(`Topic #${parsed.threadId}`);
      }
      setParsedNotice(`Đã nhận diện Kênh/Nhóm công khai: ${parsed.username}`);
      setTimeout(() => setParsedNotice(null), 5000);
      return;
    }

    setChatId(val);

    // If user enters 9-11 digits without negative prefix, suggest adding -100
    if (/^\d{9,11}$/.test(clean)) {
      setSmartChatSuggestion(`-100${clean}`);
    }
  };

  // Smart Thread ID Input Change Handler (Extract thread ID from topic links)
  const handleThreadIdChange = (val: string) => {
    const parsedTopic = parseTopicInput(val);
    if (parsedTopic && parsedTopic !== val) {
      setThreadId(parsedTopic);
      setParsedNotice(`Đã trích xuất Topic ID: #${parsedTopic}`);
      setTimeout(() => setParsedNotice(null), 4000);
    } else {
      setThreadId(val);
    }
    setSelectedTopicName(null);
  };

  return {
    smartChatSuggestion,
    setSmartChatSuggestion,
    parsedNotice,
    setParsedNotice,
    handleChatIdChange,
    handleThreadIdChange,
  };
}
