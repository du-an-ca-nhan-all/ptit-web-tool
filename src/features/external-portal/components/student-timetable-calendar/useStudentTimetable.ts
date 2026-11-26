import { useState, useMemo, useCallback } from 'react';
import { TimetableCalendarEvent } from '../../server/studentTimetableServerService';
import {
  calculateTimetableProgress,
  deriveSubjectsProgress,
  SubjectProgressItem,
} from '../../utils/timetableProgress';
import {
  formatIso,
  buildAllTimetableEvents,
  buildEventSessionNumberMap,
  buildMonthGridDays,
  buildWeekDays,
} from './utils';
import { useTimetableUrlState } from './useTimetableUrlState';
import { useTimetableFetch } from './useTimetableFetch';

export function useStudentTimetable() {
  const {
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    currentDate,
    setCurrentDate,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
  } = useTimetableUrlState();

  const {
    data,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    fetchTimetable,
  } = useTimetableFetch({
    onAutoJumpDate: (firstDate, isoDate) => {
      setCurrentDate(firstDate);
      setSelectedDay(isoDate);
    },
  });

  const [selectedEventModal, setSelectedEventModal] = useState<TimetableCalendarEvent | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [copiedIcsUrl, setCopiedIcsUrl] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const allEvents = useMemo(() => buildAllTimetableEvents(data), [data]);

  const classEventsOnly = useMemo(() => {
    return (data?.events || []).filter((e) => !e.rawSession?.isReminder);
  }, [data?.events]);

  const overallProgressStats = useMemo(() => calculateTimetableProgress(classEventsOnly), [classEventsOnly]);

  const subjectsProgressList = useMemo(
    () => deriveSubjectsProgress(classEventsOnly, data?.subjects || []),
    [classEventsOnly, data?.subjects]
  );

  const subjectProgressMap = useMemo(() => {
    const map = new Map<string, SubjectProgressItem>();
    for (const item of subjectsProgressList) {
      map.set(item.subjectCode, item);
    }
    return map;
  }, [subjectsProgressList]);

  const eventSessionNumberMap = useMemo(() => buildEventSessionNumberMap(classEventsOnly), [classEventsOnly]);

  const currentContextStats = useMemo(() => {
    if (selectedSubjectFilter !== 'ALL') {
      const sub = subjectProgressMap.get(selectedSubjectFilter);
      if (sub) return sub.stats;
    }
    return overallProgressStats;
  }, [selectedSubjectFilter, subjectProgressMap, overallProgressStats]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchSubject = selectedSubjectFilter === 'ALL' || ev.subjectCode === selectedSubjectFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        ev.subjectName.toLowerCase().includes(query) ||
        ev.subjectCode.toLowerCase().includes(query) ||
        ev.room.toLowerCase().includes(query) ||
        (ev.lecturer && ev.lecturer.toLowerCase().includes(query));
      return matchSubject && matchQuery;
    });
  }, [allEvents, selectedSubjectFilter, searchQuery]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimetableCalendarEvent[]>();
    for (const ev of filteredEvents) {
      if (!map.has(ev.date)) {
        map.set(ev.date, []);
      }
      map.get(ev.date)!.push(ev);
    }
    return map;
  }, [filteredEvents]);

  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'WEEK') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'WEEK') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(formatIso(today));
  };

  const monthGridDays = useMemo(
    () => buildMonthGridDays(currentDate, selectedDay, eventsByDate),
    [currentDate, selectedDay, eventsByDate]
  );

  const weekDays = useMemo(() => buildWeekDays(currentDate, eventsByDate), [currentDate, eventsByDate]);

  const todayIso = formatIso(new Date());

  const selectedDayEvents = useMemo(() => eventsByDate.get(selectedDay) || [], [selectedDay, eventsByDate]);

  const handleJumpToNextClass = useCallback(() => {
    const futureEvents = allEvents
      .filter((ev) => ev.date >= selectedDay && ev.date !== selectedDay)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (futureEvents.length > 0) {
      const nextDate = futureEvents[0].date;
      setSelectedDay(nextDate);
      setCurrentDate(new Date(nextDate));
    } else {
      const upcomingFromToday = allEvents
        .filter((ev) => ev.date >= todayIso)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (upcomingFromToday.length > 0) {
        const nextDate = upcomingFromToday[0].date;
        setSelectedDay(nextDate);
        setCurrentDate(new Date(nextDate));
      } else if (allEvents.length > 0) {
        const firstDate = allEvents[0].date;
        setSelectedDay(firstDate);
        setCurrentDate(new Date(firstDate));
      }
    }
  }, [allEvents, selectedDay, todayIso, setSelectedDay, setCurrentDate]);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    errorType,
    syncFeedback,
    setSyncFeedback,
    viewMode,
    setViewMode,
    selectedDay,
    setSelectedDay,
    currentDate,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    searchQuery,
    setSearchQuery,
    selectedEventModal,
    setSelectedEventModal,
    copiedLink,
    isSyncModalOpen,
    setIsSyncModalOpen,
    copiedIcsUrl,
    setCopiedIcsUrl,
    isProgressModalOpen,
    setIsProgressModalOpen,
    fetchTimetable,
    allEvents,
    overallProgressStats,
    subjectsProgressList,
    subjectProgressMap,
    eventSessionNumberMap,
    currentContextStats,
    filteredEvents,
    monthGridDays,
    weekDays,
    todayIso,
    selectedDayEvents,
    handlePrev,
    handleNext,
    handleToday,
    handleJumpToNextClass,
    handleCopyLink,
  };
}
