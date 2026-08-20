'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnnouncementItem } from '../types/announcement.types';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  const fetchActiveAnnouncements = useCallback(async () => {
    try {
      setIsLoadingAnnouncements(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/announcements', { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Error fetching active announcements:', err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, [fetchActiveAnnouncements]);

  return {
    announcements,
    setAnnouncements,
    isLoadingAnnouncements,
    fetchActiveAnnouncements,
  };
}
