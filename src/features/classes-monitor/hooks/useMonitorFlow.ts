'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoginUser } from '../../../types';
import { FollowerStudentItem, MonitorProfileData } from '../server/monitorFlowServerService';
import { FlowActionType } from '../types/flow.types';

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
  const [editedConfigs, setEditedConfigs] = useState<Record<string, {
    isEnabled: boolean;
    allowRegisterCourse: boolean;
    allowCancelCourse: boolean;
    autoSyncOnAction: boolean;
    note?: string;
  }>>({});

  // Execution result state
  const [lastExecutionResult, setLastExecutionResult] = useState<{
    flowAction: string;
    total: number;
    successCount: number;
    failCount: number;
    skippedCount: number;
    results: any[];
  } | null>(null);

  // Load flow configuration for selected class
  const fetchFlowData = useCallback(async (cls?: string) => {
    const targetClass = cls || selectedClass;
    if (!targetClass) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(
        `/api/class-monitors/flow-config?classCode=${targetClass}&monitorUsername=${currentUser.username}`
      );
      const data = await res.json();

      if (res.ok && data.success) {
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
  }, [selectedClass, currentUser.username]);

  useEffect(() => {
    if (selectedClass) {
      fetchFlowData(selectedClass);
    }
  }, [selectedClass, fetchFlowData]);

  // Combined list of students with local edits applied
  const combinedStudents = useMemo(() => {
    return students.map((st) => {
      const edit = editedConfigs[st.maSV];
      if (!edit) return st;
      return {
        ...st,
        isEnabled: edit.isEnabled !== undefined ? edit.isEnabled : st.isEnabled,
        allowRegisterCourse: edit.allowRegisterCourse !== undefined ? edit.allowRegisterCourse : st.allowRegisterCourse,
        allowCancelCourse: edit.allowCancelCourse !== undefined ? edit.allowCancelCourse : st.allowCancelCourse,
        autoSyncOnAction: edit.autoSyncOnAction !== undefined ? edit.autoSyncOnAction : st.autoSyncOnAction,
        note: edit.note !== undefined ? edit.note : st.note,
      };
    });
  }, [students, editedConfigs]);

  const hasUnsavedChanges = Object.keys(editedConfigs).length > 0;

  // Toggle or update individual follower configuration
  const updateFollowerConfig = useCallback((
    username: string,
    field: 'isEnabled' | 'allowRegisterCourse' | 'allowCancelCourse' | 'autoSyncOnAction' | 'note',
    value: any
  ) => {
    setEditedConfigs((prev) => {
      const current = prev[username] || {
        isEnabled: students.find((s) => s.maSV === username)?.isEnabled ?? false,
        allowRegisterCourse: students.find((s) => s.maSV === username)?.allowRegisterCourse ?? false,
        allowCancelCourse: students.find((s) => s.maSV === username)?.allowCancelCourse ?? false,
        autoSyncOnAction: students.find((s) => s.maSV === username)?.autoSyncOnAction ?? false,
        note: students.find((s) => s.maSV === username)?.note || '',
      };

      return {
        ...prev,
        [username]: {
          ...current,
          [field]: value,
        },
      };
    });
  }, [students]);

  // Bulk toggles
  const setAllFollowersStatus = useCallback((enabled: boolean) => {
    const newEdits: Record<string, any> = {};
    students.forEach((st) => {
      newEdits[st.maSV] = {
        isEnabled: enabled,
        allowRegisterCourse: st.allowRegisterCourse,
        allowCancelCourse: st.allowCancelCourse,
        autoSyncOnAction: st.autoSyncOnAction,
      };
    });
    setEditedConfigs(newEdits);
  }, [students]);

  const setAllPermissions = useCallback((field: 'allowRegisterCourse' | 'allowCancelCourse' | 'autoSyncOnAction', value: boolean) => {
    setEditedConfigs((prev) => {
      const updated = { ...prev };
      students.forEach((st) => {
        const curr = updated[st.maSV] || {
          isEnabled: st.isEnabled,
          allowRegisterCourse: st.allowRegisterCourse,
          allowCancelCourse: st.allowCancelCourse,
          autoSyncOnAction: st.autoSyncOnAction,
        };
        updated[st.maSV] = {
          ...curr,
          [field]: value,
        };
      });
      return updated;
    });
  }, [students]);

  // Save all modified configurations to server
  const saveAllConfigs = useCallback(async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payloadConfigs = combinedStudents.map((st) => ({
        followerUsername: st.maSV,
        isEnabled: st.isEnabled,
        allowRegisterCourse: st.allowRegisterCourse,
        allowCancelCourse: st.allowCancelCourse,
        autoSyncOnAction: st.autoSyncOnAction,
        note: st.note || undefined,
      }));

      const res = await fetch('/api/class-monitors/flow-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_CONFIG',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          configs: payloadConfigs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Lưu cấu hình Flow thành công!');
        setEditedConfigs({});
        await fetchFlowData(selectedClass);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Lưu cấu hình thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  }, [combinedStudents, selectedClass, currentUser.username, fetchFlowData]);

  // Execute Flow Action
  const executeFlow = useCallback(async (options: {
    flowAction: FlowActionType | string;
    id_to_hoc?: string;
    id_rs?: string;
    ma_mon?: string;
    ten_mon?: string;
    nhom_to?: string;
    targetFollowerUsernames?: string[];
  }) => {
    setIsExecuting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLastExecutionResult(null);

    try {
      // Tự động lưu cấu hình mới nhất trước khi thực thi nếu có thay đổi
      if (hasUnsavedChanges) {
        await saveAllConfigs();
      }

      const res = await fetch('/api/class-monitors/flow-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE_FLOW',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
          flowAction: options.flowAction,
          id_to_hoc: options.id_to_hoc,
          id_rs: options.id_rs,
          ma_mon: options.ma_mon,
          ten_mon: options.ten_mon,
          nhom_to: options.nhom_to,
          targetFollowerUsernames: options.targetFollowerUsernames,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setLastExecutionResult({
          flowAction: data.flowAction,
          total: data.total,
          successCount: data.successCount,
          failCount: data.failCount,
          skippedCount: data.skippedCount,
          results: data.results || [],
        });
        await fetchFlowData(selectedClass);
      } else {
        setErrorMsg(data.error || data.message || 'Thực thi Flow Action thất bại');
        if (data.results) {
          setLastExecutionResult({
            flowAction: options.flowAction,
            total: data.total || 0,
            successCount: data.successCount || 0,
            failCount: data.failCount || 0,
            skippedCount: data.skippedCount || 0,
            results: data.results || [],
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng khi thực thi Flow Action');
    } finally {
      setIsExecuting(false);
    }
  }, [hasUnsavedChanges, saveAllConfigs, selectedClass, currentUser.username, fetchFlowData]);

  // Kéo dữ liệu ĐKMH mới nhất từ QLDTTX cho toàn bộ tài khoản trong lớp
  const pullAllCourses = useCallback(async () => {
    setIsPullingCourses(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/class-monitors/flow-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL_COURSES',
          classCode: selectedClass,
          monitorUsername: currentUser.username,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Đã kéo dữ liệu ĐKMH mới nhất từ QLDTTX thành công!');
        if (data.students) setStudents(data.students);
        if (data.monitorData) setMonitorData(data.monitorData);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Kéo dữ liệu ĐKMH thất bại');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi mạng khi kéo dữ liệu ĐKMH');
    } finally {
      setIsPullingCourses(false);
    }
  }, [selectedClass, currentUser.username]);

  // Import danh sách sinh viên Flow từ file hoặc văn bản
  const importFlowConfigs = useCallback(
    async (options: {
      mode: 'MERGE' | 'REPLACE';
      items: Array<{
        maSV: string;
        hoTen?: string;
        isEnabled?: boolean;
        allowRegisterCourse?: boolean;
        allowCancelCourse?: boolean;
        autoSyncOnAction?: boolean;
        note?: string;
      }>;
      defaultAllowRegister?: boolean;
      defaultAllowCancel?: boolean;
      defaultAutoSync?: boolean;
    }) => {
      setIsSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch('/api/class-monitors/flow-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'IMPORT_CONFIG',
            classCode: selectedClass,
            monitorUsername: currentUser.username,
            mode: options.mode,
            items: options.items,
            defaultAllowRegister: options.defaultAllowRegister ?? true,
            defaultAllowCancel: options.defaultAllowCancel ?? true,
            defaultAutoSync: options.defaultAutoSync ?? false,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Import danh sách sinh viên Flow thành công!');
          if (data.students) setStudents(data.students);
          if (data.monitorData) setMonitorData(data.monitorData);
          setEditedConfigs({});
          setTimeout(() => setSuccessMsg(''), 5000);
          return { success: true, ...data };
        } else {
          setErrorMsg(data.error || 'Import danh sách sinh viên Flow thất bại');
          return { success: false, error: data.error };
        }
      } catch (err: any) {
        const msg = err.message || 'Lỗi mạng khi import cấu hình Flow';
        setErrorMsg(msg);
        return { success: false, error: msg };
      } finally {
        setIsSaving(false);
      }
    },
    [selectedClass, currentUser.username]
  );

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
