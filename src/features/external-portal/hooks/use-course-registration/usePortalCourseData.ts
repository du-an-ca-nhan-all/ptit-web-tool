'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertSoundType,
  ExternalAccountState,
  MonitorFlowConfigInfo,
  OpenCoursesState,
  RegisteredCoursesState,
} from './types';

interface UsePortalCourseDataParams {
  username: string;
  playAlertSound: (type: AlertSoundType) => void;
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function usePortalCourseData({
  username,
  playAlertSound,
  setSuccessMsg,
  setErrorMsg,
}: UsePortalCourseDataParams) {
  const [openCourses, setOpenCourses] = useState<OpenCoursesState>({
    ds_nhom_to: [],
    ds_mon_hoc: [],
    hoc_ky_dang_ky: '',
    trong_thoi_gian_dang_ky: true,
    id_rs: '',
  });

  const [registeredCourses, setRegisteredCourses] = useState<RegisteredCoursesState>({
    ds_kqdkmh: [],
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
  });

  const [externalAccount, setExternalAccount] = useState<ExternalAccountState>({
    isConfigured: false,
    status: 'DISCONNECTED',
  });

  const [monitorFlowConfig, setMonitorFlowConfig] = useState<MonitorFlowConfigInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeringIds, setRegisteringIds] = useState<Record<string, boolean>>({});
  const [cancellingIds, setCancellingIds] = useState<Record<string, boolean>>({});

  // Active registration session id_rs
  const [currentIdRs, setCurrentIdRs] = useState<string>('');
  const currentIdRsRef = useRef(currentIdRs);
  currentIdRsRef.current = currentIdRs;

  // -------------------------------------------------------------
  // API CALLS
  // -------------------------------------------------------------
  const fetchPortalData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/student/course-register?username=${username}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setExternalAccount(data.externalAccount || { isConfigured: false, status: 'DISCONNECTED' });
        setMonitorFlowConfig(data.monitorFlowConfig || null);
        if (data.openCourses) {
          setOpenCourses(data.openCourses);
          if (data.openCourses.id_rs) {
            setCurrentIdRs(data.openCourses.id_rs);
          }
        }
        if (data.registeredCourses) {
          setRegisteredCourses(data.registeredCourses);
          if (data.registeredCourses.id_rs && !data.openCourses?.id_rs) {
            setCurrentIdRs(data.registeredCourses.id_rs);
          }
        }
      } else {
        if (data.monitorFlowConfig) {
          setMonitorFlowConfig(data.monitorFlowConfig);
        }
        if (data.isConfigured === false) {
          setExternalAccount({ isConfigured: false, status: 'DISCONNECTED' });
        } else {
          setErrorMsg(data.error || 'Không thể tải dữ liệu đăng ký môn học từ cổng trường');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ khi tải dữ liệu ĐKMH');
    } finally {
      if (!quiet) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Đăng ký môn học
  const handleRegister = useCallback(
    async (idToHoc: string, svNganh: number = 1): Promise<boolean> => {
      if (monitorFlowConfig?.isEnabled) {
        setErrorMsg(
          `Tài khoản của bạn đang được bật chế độ Flow theo Lớp trưởng (${monitorFlowConfig.monitorUsername} - Lớp ${monitorFlowConfig.classCode}). Tính năng tự đăng ký môn học trực tiếp bị khóa để tránh trùng lịch của lớp.`
        );
        return false;
      }

      setRegisteringIds((prev) => ({ ...prev, [idToHoc]: true }));
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch('/api/student/course-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REGISTER',
            id_to_hoc: idToHoc,
            id_rs: currentIdRsRef.current,
            sv_nganh: svNganh,
            targetUsername: username,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Đăng ký môn học thành công!');
          if (data.id_rs) {
            setCurrentIdRs(data.id_rs);
          }
          playAlertSound('success');
          // Reload registered courses
          await fetchPortalData(true);
          return true;
        } else {
          setErrorMsg(data.message || data.error || 'Đăng ký môn học thất bại');
          if (data.id_rs) {
            setCurrentIdRs(data.id_rs);
          }
          return false;
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi mạng khi thực hiện đăng ký môn học');
        return false;
      } finally {
        setRegisteringIds((prev) => ({ ...prev, [idToHoc]: false }));
      }
    },
    [username, fetchPortalData, monitorFlowConfig, playAlertSound]
  );

  // Hủy môn học
  const handleCancel = useCallback(
    async (idToHoc: string, svNganh: number = 1): Promise<boolean> => {
      if (monitorFlowConfig?.isEnabled) {
        setErrorMsg(
          `Tài khoản của bạn đang được bật chế độ Flow theo Lớp trưởng (${monitorFlowConfig.monitorUsername} - Lớp ${monitorFlowConfig.classCode}). Tính năng tự hủy môn học trực tiếp bị khóa để tránh trùng lịch của lớp.`
        );
        return false;
      }

      setCancellingIds((prev) => ({ ...prev, [idToHoc]: true }));
      setErrorMsg('');
      setSuccessMsg('');

      try {
        const res = await fetch('/api/student/course-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CANCEL',
            id_to_hoc: idToHoc,
            id_rs: currentIdRsRef.current,
            sv_nganh: svNganh,
            targetUsername: username,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSuccessMsg(data.message || 'Hủy môn học thành công!');
          if (data.id_rs) {
            setCurrentIdRs(data.id_rs);
          }
          await fetchPortalData(true);
          return true;
        } else {
          setErrorMsg(data.message || data.error || 'Hủy môn học thất bại');
          if (data.id_rs) {
            setCurrentIdRs(data.id_rs);
          }
          return false;
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi mạng khi hủy môn học');
        return false;
      } finally {
        setCancellingIds((prev) => ({ ...prev, [idToHoc]: false }));
      }
    },
    [username, fetchPortalData]
  );

  return {
    openCourses,
    registeredCourses,
    externalAccount,
    monitorFlowConfig,
    currentIdRs,
    setCurrentIdRs,
    currentIdRsRef,
    isLoading,
    isRefreshing,
    registeringIds,
    cancellingIds,
    fetchPortalData,
    handleRegister,
    handleCancel,
  };
}
