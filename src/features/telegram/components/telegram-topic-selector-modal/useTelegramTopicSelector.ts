import React, { useState, useEffect, useMemo } from 'react';
import type { ForumTopicItem } from './types';

interface UseTelegramTopicSelectorParams {
  isOpen: boolean;
  onClose: () => void;
  botToken: string;
  chatId: string;
  onSelectTopic: (topic: { threadId: string; name: string }) => void;
}

export function useTelegramTopicSelector({
  isOpen,
  onClose,
  botToken,
  chatId,
  onSelectTopic,
}: UseTelegramTopicSelectorParams) {
  const [topics, setTopics] = useState<ForumTopicItem[]>([]);
  const [chatInfo, setChatInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create topic state
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  // Fetch / Pull topics from API
  const handlePullTopics = async () => {
    if (!chatId.trim()) {
      setErrorMsg('Vui lòng nhập Chat ID nhóm trước khi quét Topic.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL_TOPICS',
          botToken: botToken.trim() || undefined,
          chatId: chatId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTopics(data.topics || []);
        setChatInfo(data.chat || null);
        if (!data.isForumGroup) {
          setErrorMsg(
            'Nhóm này chưa bật tính năng Diễn đàn / Topics (Forum Supergroup). Vui lòng vào Cài đặt nhóm trên Telegram -> Bật "Topics" (Chủ đề).'
          );
        }
      } else {
        setErrorMsg(data.error || 'Không thể lấy danh sách Topic từ nhóm Telegram.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối máy chủ khi quét Topics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handlePullTopics();
    } else {
      setSearchQuery('');
      setIsCreatingTopic(false);
      setNewTopicName('');
      setCreateSuccessMsg('');
    }
  }, [isOpen]);

  // Handle Create Topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    setIsSubmittingCreate(true);
    setErrorMsg('');
    setCreateSuccessMsg('');

    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TOPIC',
          botToken: botToken.trim() || undefined,
          chatId: chatId.trim(),
          topicName: newTopicName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.topic) {
        setCreateSuccessMsg(`Đã tạo topic "${data.topic.name}" thành công!`);
        const createdTopic: ForumTopicItem = {
          threadId: data.topic.threadId,
          name: data.topic.name,
          iconColor: data.topic.iconColor,
          iconCustomEmojiId: data.topic.iconCustomEmojiId,
        };

        // Add to topic list and auto select
        setTopics((prev) => [createdTopic, ...prev.filter((t) => t.threadId !== createdTopic.threadId)]);
        onSelectTopic({ threadId: createdTopic.threadId, name: createdTopic.name });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg(data.error || 'Không thể tạo Topic mới trên Telegram.');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi kết nối khi tạo Topic.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;
    const q = searchQuery.toLowerCase().trim();
    return topics.filter(
      (t) => t.name.toLowerCase().includes(q) || String(t.threadId).includes(q)
    );
  }, [topics, searchQuery]);

  return {
    chatInfo,
    isLoading,
    errorMsg,
    searchQuery,
    setSearchQuery,
    isCreatingTopic,
    setIsCreatingTopic,
    newTopicName,
    setNewTopicName,
    isSubmittingCreate,
    createSuccessMsg,
    filteredTopics,
    handlePullTopics,
    handleCreateTopic,
  };
}
