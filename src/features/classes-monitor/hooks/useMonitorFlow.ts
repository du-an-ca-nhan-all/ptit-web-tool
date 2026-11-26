'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginUser } from '../../../types';
import {
  FollowerStudentItem,
  MonitorProfileData,
} from '../server/monitorFlowServerService';
import { fetchFlowConfigApi } from './use-monitor-flow/api';
import {
  EditedFollowerConfig,
  ExecutionResult,
  FollowerConfigField,
  FollowerPermissionField,
} from './use-monitor-flow/types';
import { useMonitorFlowActions } from './use-monitor-flow/useMonitorFlowActions';
import {
  buildAllFollowersStatusEdits,
  buildAllPermissionsEdits,
  buildUpdatedFollowerConfig,
  mergeStudentsWithEdits,
} from './use-monitor-flow/utils';

export function useMonitorFlow(currentUser: LoginUser, initialClassCode?: string) {
  const [selectedClass, setSelectedClass] = useState<string>(
    currentUser.lop || initialClassCode || ''
  );

  const [students, setStudents] = useState<FollowerStudentItem[]>([]);
  const [monitorData, setMonitorData] = useState<MonitorProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPullingCourses, setIsPullingCourses] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local unsaved config edits: username -> Partial<FollowerStudentItem>
  const [editedConfigs, setEditedConfigs] = useState<
    Record<string, EditedFollowerConfig>
  >({});

  // Execution result state
  const [lastExecutionResult, setLastExecutionResult] =
    useState<ExecutionResult | null>(null);

  // Load flow configuration for selected class
  const fetchFlowData = useCallback(
    async (cls?: string) => {
      const targetClass = cls || selectedClass;
      if (!targetClass) return;

      setIsLoading(true);
      setErrorMsg('');

      try {
        const { ok, data } = await fetchFlowConfigApi(
          targetClass,
          currentUser.username
        );

        if (ok && data.success) {
          setStudents(data.students || []);
          setMonitorData(data.monitorData || null);
          // Reset local edits
          setEditedConfigs({});
        } else {
          setErrorMsg(data.error || 'Không thể tải danh sách cấu hình Flow');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi mạng khi tải cấu hình Flow');
      } finally {
        setIsLoading(false);
      }
    },
    [selectedClass, currentUser.username]
  );

  useEffect(() => {
    if (selectedClass) {
      fetchFlowData(selectedClass);
    }
  }, [selectedClass, fetchFlowData]);

  // Combined list of students with local edits applied
  const combinedStudents = useMemo(
    () => mergeStudentsWithEdits(students, editedConfigs),
    [students, editedConfigs]
  );

  const hasUnsavedChanges = Object.keys(editedConfigs).length > 0;

  // Toggle or update individual follower configuration
  const updateFollowerConfig = useCallback(
    (username: string, field: FollowerConfigField, value: any) => {
      setEditedConfigs((prev) =>
        buildUpdatedFollowerConfig({ prev, students, username, field, value })
      );
    },
    [students]
  );

  // Bulk toggles
  const setAllFollowersStatus = useCallback(
    (enabled: boolean) => {
      setEditedConfigs(buildAllFollowersStatusEdits(students, enabled));
    },
    [students]
  );

  const setAllPermissions = useCallback(
    (field: FollowerPermissionField, value: boolean) => {
      setEditedConfigs((prev) =>
        buildAllPermissionsEdits({ prev, students, field, value })
      );
    },
    [students]
  );

  const { saveAllConfigs, executeFlow, pullAllCourses, importFlowConfigs } =
    useMonitorFlowActions({
      selectedClass,
      monitorUsername: currentUser.username,
      combinedStudents,
      hasUnsavedChanges,
      fetchFlowData,
      setStudents,
      setMonitorData,
      setEditedConfigs,
      setIsSaving,
      setIsExecuting,
      setIsPullingCourses,
      setSuccessMsg,
      setErrorMsg,
      setLastExecutionResult,
    });

  return {
    selectedClass,
    setSelectedClass,
    students: combinedStudents,
    monitorData,
    isLoading,
    isSaving,
    isExecuting,
    isPullingCourses,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,
    hasUnsavedChanges,
    lastExecutionResult,
    setLastExecutionResult,
    fetchFlowData,
    updateFollowerConfig,
    setAllFollowersStatus,
    setAllPermissions,
    saveAllConfigs,
    executeFlow,
    pullAllCourses,
    importFlowConfigs,
  };
}
