'use client';

import { useCallback, Dispatch, SetStateAction } from 'react';
import {
  FollowerStudentItem,
  MonitorProfileData,
} from '../../server/monitorFlowServerService';
import { postFlowConfigAction } from './api';
import {
  EditedFollowerConfig,
  ExecuteFlowOptions,
  ExecutionResult,
  ImportFlowConfigsOptions,
} from './types';
import { buildSaveConfigPayload } from './utils';

interface UseMonitorFlowActionsParams {
  selectedClass: string;
  monitorUsername: string;
  combinedStudents: FollowerStudentItem[];
  hasUnsavedChanges: boolean;
  fetchFlowData: (cls?: string) => Promise<void>;
  setStudents: Dispatch<SetStateAction<FollowerStudentItem[]>>;
  setMonitorData: Dispatch<SetStateAction<MonitorProfileData | null>>;
  setEditedConfigs: Dispatch<SetStateAction<Record<string, EditedFollowerConfig>>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  setIsExecuting: Dispatch<SetStateAction<boolean>>;
  setIsPullingCourses: Dispatch<SetStateAction<boolean>>;
  setSuccessMsg: Dispatch<SetStateAction<string>>;
  setErrorMsg: Dispatch<SetStateAction<string>>;
  setLastExecutionResult: Dispatch<SetStateAction<ExecutionResult | null>>;
}

export function useMonitorFlowActions({
  selectedClass,
  monitorUsername,
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
}: UseMonitorFlowActionsParams) {
  // Save all modified configurations to server
  const saveAllConfigs = useCallback(async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payloadConfigs = buildSaveConfigPayload(combinedStudents);
      const { ok, data } = await postFlowConfigAction({
        action: 'SAVE_CONFIG',
        classCode: selectedClass,
        monitorUsername,
        configs: payloadConfigs,
      });

      if (ok && data.success) {
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
  }, [combinedStudents, selectedClass, monitorUsername, fetchFlowData, setIsSaving, setErrorMsg, setSuccessMsg, setEditedConfigs]);

  // Execute Flow Action
  const executeFlow = useCallback(
    async (options: ExecuteFlowOptions) => {
      setIsExecuting(true);
      setErrorMsg('');
      setSuccessMsg('');
      setLastExecutionResult(null);

      try {
        // Tự động lưu cấu hình mới nhất trước khi thực thi nếu có thay đổi
        if (hasUnsavedChanges) {
          await saveAllConfigs();
        }

        const { ok, data } = await postFlowConfigAction({
          action: 'EXECUTE_FLOW',
          classCode: selectedClass,
          monitorUsername,
          flowAction: options.flowAction,
          id_to_hoc: options.id_to_hoc,
          id_rs: options.id_rs,
          ma_mon: options.ma_mon,
          ten_mon: options.ten_mon,
          nhom_to: options.nhom_to,
          targetFollowerUsernames: options.targetFollowerUsernames,
        });

        if (ok && data.success) {
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
    },
    [hasUnsavedChanges, saveAllConfigs, selectedClass, monitorUsername, fetchFlowData, setIsExecuting, setErrorMsg, setSuccessMsg, setLastExecutionResult]
  );

  // Kéo dữ liệu ĐKMH mới nhất từ QLDTTX cho toàn bộ tài khoản trong lớp
  const pullAllCourses = useCallback(async () => {
    setIsPullingCourses(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { ok, data } = await postFlowConfigAction({
        action: 'PULL_COURSES',
        classCode: selectedClass,
        monitorUsername,
      });

      if (ok && data.success) {
        setSuccessMsg(
          data.message || 'Đã kéo dữ liệu ĐKMH mới nhất từ QLDTTX thành công!'
        );
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
  }, [selectedClass, monitorUsername, setIsPullingCourses, setErrorMsg, setSuccessMsg, setStudents, setMonitorData]);

  // Import danh sách sinh viên Flow từ file hoặc văn bản
  const importFlowConfigs = useCallback(
    async (options: ImportFlowConfigsOptions) => {
      setIsSaving(true);
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const { ok, data } = await postFlowConfigAction({
          action: 'IMPORT_CONFIG',
          classCode: selectedClass,
          monitorUsername,
          mode: options.mode,
          items: options.items,
          defaultAllowRegister: options.defaultAllowRegister ?? true,
          defaultAllowCancel: options.defaultAllowCancel ?? true,
          defaultAutoSync: options.defaultAutoSync ?? false,
        });

        if (ok && data.success) {
          setSuccessMsg(
            data.message || 'Import danh sách sinh viên Flow thành công!'
          );
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
    [selectedClass, monitorUsername, setIsSaving, setErrorMsg, setSuccessMsg, setStudents, setMonitorData, setEditedConfigs]
  );

  return {
    saveAllConfigs,
    executeFlow,
    pullAllCourses,
    importFlowConfigs,
  };
}
