'use client';

import { useState, useMemo } from 'react';
import { LoginUser } from '../../../../types';
import { useCourseRegistration } from '../../hooks/useCourseRegistration';
import {
  CourseRegistrationSubTab,
  CourseStatusFilter,
  CourseViewMode,
} from './types';
import {
  buildRegisteredSubjectCodeMap,
  filterFlatOpenCourses,
  groupAndFilterOpenCourses,
} from './utils';

export function useCourseRegistrationPortalState(currentUser: LoginUser) {
  const registration = useCourseRegistration(currentUser);

  // Sub-tabs within Course Registration
  const [activeSubTab, setActiveSubTab] = useState<CourseRegistrationSubTab>('OPEN_COURSES');

  // Filter & View States for Open Courses
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<CourseViewMode>('ACCORDION');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Modals
  const [confirmCancelGroup, setConfirmCancelGroup] = useState<any | null>(null);
  const [showAddSniperModal, setShowAddSniperModal] = useState(false);
  const [manualSniperSubjectCode, setManualSniperSubjectCode] = useState('');
  const [manualSniperGroupId, setManualSniperGroupId] = useState('');
  const [manualSniperAnyGroup, setManualSniperAnyGroup] = useState(true);

  // Map of registered subject codes
  const registeredSubjectCodeMap = useMemo(
    () => buildRegisteredSubjectCodeMap(registration.registeredCourses.ds_kqdkmh),
    [registration.registeredCourses.ds_kqdkmh]
  );

  // Group open course groups by Subject
  const groupedOpenCourses = useMemo(
    () =>
      groupAndFilterOpenCourses(
        registration.openCourses.ds_nhom_to,
        searchQuery,
        statusFilter,
        registeredSubjectCodeMap
      ),
    [registration.openCourses.ds_nhom_to, searchQuery, statusFilter, registeredSubjectCodeMap]
  );

  // Flat list for Flat View
  const flatFilteredGroups = useMemo(
    () =>
      filterFlatOpenCourses(
        registration.openCourses.ds_nhom_to,
        searchQuery,
        statusFilter,
        registeredSubjectCodeMap
      ),
    [registration.openCourses.ds_nhom_to, searchQuery, statusFilter, registeredSubjectCodeMap]
  );

  const toggleExpandSubject = (maMon: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [maMon]: !prev[maMon],
    }));
  };

  const expandAllSubjects = () => {
    const allExpanded: Record<string, boolean> = {};
    groupedOpenCourses.forEach((s) => {
      allExpanded[s.ma_mon] = true;
    });
    setExpandedSubjects(allExpanded);
  };

  const collapseAllSubjects = () => {
    setExpandedSubjects({});
  };

  return {
    ...registration,
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    expandedSubjects,
    toggleExpandSubject,
    expandAllSubjects,
    collapseAllSubjects,
    confirmCancelGroup,
    setConfirmCancelGroup,
    showAddSniperModal,
    setShowAddSniperModal,
    manualSniperSubjectCode,
    setManualSniperSubjectCode,
    manualSniperGroupId,
    setManualSniperGroupId,
    manualSniperAnyGroup,
    setManualSniperAnyGroup,
    registeredSubjectCodeMap,
    groupedOpenCourses,
    flatFilteredGroups,
  };
}
