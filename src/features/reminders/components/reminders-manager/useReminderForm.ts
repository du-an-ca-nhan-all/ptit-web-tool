'use client';

import React, { useState } from 'react';
import {
  ReminderItemDto,
  ReminderType,
  CreateReminderInput,
  EnrolledCourseOption,
} from '../../types/reminder.types';
import { ReminderFormData } from './types';
import { formatToDateTimeLocal } from './utils';

interface UseReminderFormParams {
  enrolledCourses: EnrolledCourseOption[];
  setErrorMsg: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  fetchReminders: (isRefresh?: boolean) => Promise<void>;
}

export function useReminderForm({
  enrolledCourses,
  setErrorMsg,
  setSuccessMsg,
  fetchReminders,
}: UseReminderFormParams) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItemDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    location: '',
    type: 'PERSONAL',
    eventTime: '',
    selectedCourseKey: '',
    customMaMon: '',
    customTenMon: '',
    customNhomTo: '',
    customLop: '',
    offsetMinutesList: [1440, 60], // Mặc định trước 1 ngày & trước 1 giờ
    customOffsetVal: '',
    customOffsetUnit: 'hours',
  });

  // Open Create Modal
  const handleOpenCreateModal = (prefillType?: ReminderType) => {
    // Default time: Ngày mai lúc 19:00 (giờ địa phương)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    const defaultTimeStr = formatToDateTimeLocal(tomorrow);

    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      type: prefillType || 'PERSONAL',
      eventTime: defaultTimeStr,
      selectedCourseKey: enrolledCourses[0]?.idToHoc || '',
      customMaMon: '',
      customTenMon: '',
      customNhomTo: '',
      customLop: '',
      offsetMinutesList: [1440, 60], // Trước 1 ngày & 1 giờ
      customOffsetVal: '',
      customOffsetUnit: 'hours',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (reminder: ReminderItemDto) => {
    setEditingReminder(reminder);
    const d = new Date(reminder.eventTime);
    const localIso = formatToDateTimeLocal(d);

    // Find course key if matches
    const courseMatch = enrolledCourses.find(
      (c) => c.idToHoc === reminder.idToHoc || (c.maMon === reminder.maMon && c.nhomTo === reminder.nhomTo)
    );

    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      location: reminder.location || '',
      type: reminder.type,
      eventTime: localIso,
      selectedCourseKey: courseMatch ? courseMatch.idToHoc : (reminder.idToHoc || ''),
      customMaMon: reminder.maMon || '',
      customTenMon: reminder.tenMon || '',
      customNhomTo: reminder.nhomTo || '',
      customLop: reminder.lop || '',
      offsetMinutesList: (reminder.alerts || []).map((a) => a.offsetMinutes),
      customOffsetVal: '',
      customOffsetUnit: 'hours',
    });
    setIsModalOpen(true);
  };

  // Toggle Offset Minutes
  const handleToggleOffset = (minutes: number) => {
    setFormData((prev) => {
      const exists = prev.offsetMinutesList.includes(minutes);
      const updated = exists
        ? prev.offsetMinutesList.filter((m) => m !== minutes)
        : [...prev.offsetMinutesList, minutes];
      return { ...prev, offsetMinutesList: updated };
    });
  };

  // Add Custom Offset
  const handleAddCustomOffset = () => {
    const val = parseInt(formData.customOffsetVal, 10);
    if (isNaN(val) || val < 0) return;

    let multiplier = 1;
    if (formData.customOffsetUnit === 'hours') multiplier = 60;
    if (formData.customOffsetUnit === 'days') multiplier = 1440;

    const totalMinutes = val * multiplier;
    if (!formData.offsetMinutesList.includes(totalMinutes)) {
      setFormData((prev) => ({
        ...prev,
        offsetMinutesList: [...prev.offsetMinutesList, totalMinutes],
        customOffsetVal: '',
      }));
    }
  };

  // Remove Offset
  const handleRemoveOffset = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      offsetMinutesList: prev.offsetMinutesList.filter((m) => m !== minutes),
    }));
  };

  // Handle Form Submit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề nhắc hẹn');
      return;
    }
    if (!formData.eventTime) {
      alert('Vui lòng chọn thời gian diễn ra');
      return;
    }
    if (formData.offsetMinutesList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 mốc thông báo');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload: CreateReminderInput = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        type: formData.type,
        eventTime: new Date(formData.eventTime).toISOString(),
        offsetMinutesList: formData.offsetMinutesList,
      };

      if (formData.type === 'COURSE') {
        const selectedCourse = enrolledCourses.find((c) => c.idToHoc === formData.selectedCourseKey);
        if (selectedCourse) {
          payload.idToHoc = selectedCourse.idToHoc;
          payload.idMon = selectedCourse.idMon;
          payload.maMon = selectedCourse.maMon;
          payload.tenMon = selectedCourse.tenMon;
          payload.nhomTo = selectedCourse.nhomTo;
          payload.lop = selectedCourse.lop;
          payload.tkbRaw = selectedCourse.tkb;
          payload.giangVien = selectedCourse.giangVien;
        } else {
          payload.maMon = formData.customMaMon.trim().toUpperCase() || undefined;
          payload.tenMon = formData.customTenMon.trim() || undefined;
          payload.nhomTo = formData.customNhomTo.trim() || undefined;
          payload.lop = formData.customLop.trim() || undefined;
        }
      }

      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders';
      const method = editingReminder ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(
          editingReminder
            ? 'Đã cập nhật nhắc hẹn thành công!'
            : formData.type === 'PERSONAL'
            ? 'Đã tạo nhắc hẹn cá nhân và gửi thông báo xác nhận về Telegram của bạn!'
            : 'Đã tạo nhắc hẹn môn học, chia sẻ vào lịch và gửi thông báo Telegram đến các bạn cùng lớp!'
        );
        setIsModalOpen(false);
        fetchReminders();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        alert(data.error || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingReminder,
    isSubmitting,
    formData,
    setFormData,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleToggleOffset,
    handleAddCustomOffset,
    handleRemoveOffset,
    handleSubmitForm,
  };
}
