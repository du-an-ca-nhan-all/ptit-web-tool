'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginUser } from '../../../types';
import {
  OpenCourseGroupItem,
  SubjectDictItem,
} from '../server/courseRegistrationServerService';

export interface SniperTarget {
  id: string; // unique key in sniper list
  maMon: string;
  tenMon?: string;
  idToHoc?: string; // If specified, only this specific group; if omitted or 'ANY', any group of this subject
  nhomTo?: string;
  autoAnyGroup: boolean;
  status?: 'WAITING' | 'SNIPING' | 'SUCCESS' | 'FAILED';
  lastCheckedSlot?: string;
}

export interface SniperLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'slot';
  message: string;
}

export function useCourseRegistration(currentUser: LoginUser) {
  const [openCourses, setOpenCourses] = useState<{
    ds_nhom_to: OpenCourseGroupItem[];
    ds_mon_hoc: SubjectDictItem[];
    hoc_ky_dang_ky: string;
    trong_thoi_gian_dang_ky: boolean;
    id_rs: string;
  }>({
    ds_nhom_to: [],
    ds_mon_hoc: [],
    hoc_ky_dang_ky: '',
    trong_thoi_gian_dang_ky: true,
    id_rs: '',
  });

  const [registeredCourses, setRegisteredCourses] = useState<{
    ds_kqdkmh: any[];
    totalCourses: number;
    totalCredits: number;
    tuitionFee: number;
  }>({
    ds_kqdkmh: [],
    totalCourses: 0,
    totalCredits: 0,
    tuitionFee: 0,
  });

  const [externalAccount, setExternalAccount] = useState<{
    isConfigured: boolean;
    status: string;
    hasToken?: boolean;
    lastSyncAt?: string | null;
  }>({
    isConfigured: false,
    status: 'DISCONNECTED',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeringIds, setRegisteringIds] = useState<Record<string, boolean>>({});
  const [cancellingIds, setCancellingIds] = useState<Record<string, boolean>>({});

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active registration session id_rs
  const [currentIdRs, setCurrentIdRs] = useState<string>('');

  // -------------------------------------------------------------
  // AUTO-REGISTER / SNIPER BOT STATE
  // -------------------------------------------------------------
  const [isSniperActive, setIsSniperActive] = useState(false);
  const [sniperInterval, setSniperInterval] = useState<number>(1500); // ms
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sniperTargets, setSniperTargets] = useState<SniperTarget[]>([]);
  const [sniperLogs, setSniperLogs] = useState<SniperLogEntry[]>([]);
  const [sniperStats, setSniperStats] = useState<{
    attempts: number;
    slotsFound: number;
    successCount: number;
    lastRunAt: string | null;
  }>({
    attempts: 0,
    slotsFound: 0,
    successCount: 0,
    lastRunAt: null,
  });

  const sniperTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSniperActiveRef = useRef(false);
  isSniperActiveRef.current = isSniperActive;

  const currentIdRsRef = useRef(currentIdRs);
  currentIdRsRef.current = currentIdRs;

  const sniperTargetsRef = useRef(sniperTargets);
  sniperTargetsRef.current = sniperTargets;

  // Sound generator helper using Web Audio API
  const playAlertSound = useCallback((type: 'slot' | 'success' | 'error') => {
    if (typeof window === 'undefined' || !soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'slot') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.7);
      }
    } catch {}
  }, [soundEnabled]);

  const addSniperLog = useCallback((type: SniperLogEntry['type'], message: string) => {
    const entry: SniperLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      type,
      message,
    };
    setSniperLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  // -------------------------------------------------------------
  // API CALLS
  // -------------------------------------------------------------
  const fetchPortalData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/student/course-register?username=${currentUser.username}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setExternalAccount(data.externalAccount || { isConfigured: false, status: 'DISCONNECTED' });
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
  }, [currentUser.username]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Đăng ký môn học
  const handleRegister = useCallback(
    async (idToHoc: string, svNganh: number = 1): Promise<boolean> => {
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
            targetUsername: currentUser.username,
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
    [currentUser.username, fetchPortalData, playAlertSound]
  );

  // Hủy môn học
  const handleCancel = useCallback(
    async (idToHoc: string, svNganh: number = 1): Promise<boolean> => {
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
            targetUsername: currentUser.username,
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
    [currentUser.username, fetchPortalData]
  );

  // -------------------------------------------------------------
  // SNIPER BOT EXECUTION LOOP
  // -------------------------------------------------------------
  const runSniperStep = useCallback(async () => {
    if (!isSniperActiveRef.current) return;

    // Filter only targets that are not finished
    const targets = sniperTargetsRef.current.filter((t) => t.status !== 'SUCCESS');
    if (targets.length === 0) {
      setIsSniperActive(false);
      isSniperActiveRef.current = false;
      if (sniperTimerRef.current) {
        clearInterval(sniperTimerRef.current);
        sniperTimerRef.current = null;
      }
      addSniperLog('warning', 'Hàng đợi trống hoặc tất cả môn đã hoàn thành. Sniper Bot tự động dừng.');
      return;
    }

    setSniperStats((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      lastRunAt: new Date().toLocaleTimeString('vi-VN'),
    }));

    const targetKeys = targets.map((t) => (t.idToHoc && t.idToHoc !== 'ANY' ? t.idToHoc : t.maMon));

    try {
      const res = await fetch('/api/student/course-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_SLOTS',
          targetKeys,
          targetUsername: currentUser.username,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addSniperLog('error', `Lỗi quét slot: ${data.error || 'Không phản hồi'}`);
        return;
      }

      if (data.id_rs) {
        setCurrentIdRs(data.id_rs);
      }

      const availableList = data.availableTargets || [];
      const matchedList = data.matchedTargets || [];

      // Update remaining slots in targets view
      setSniperTargets((prev) =>
        prev.map((t) => {
          const match = matchedList.find(
            (m: any) =>
              (t.idToHoc && t.idToHoc === m.id_to_hoc) ||
              (!t.idToHoc && t.maMon?.toUpperCase() === m.ma_mon?.toUpperCase())
          );
          if (match) {
            return {
              ...t,
              lastCheckedSlot: `Còn ${match.sl_cl}/${match.sl_cp} (Đã ĐK: ${match.sl_dk})`,
            };
          }
          return t;
        })
      );

      if (availableList.length === 0) {
        // No slot found yet
        addSniperLog('info', `Quét ${targets.length} môn mục tiêu... Chưa có slot trống. Tiếp tục canh...`);
        return;
      }

      // Slot found!
      playAlertSound('slot');
      setSniperStats((prev) => ({ ...prev, slotsFound: prev.slotsFound + availableList.length }));

      for (const item of availableList) {
        if (!isSniperActiveRef.current) break;

        const itemMaMonUpper = (item.ma_mon || '').toUpperCase();
        const itemIdToHocStr = String(item.id_to_hoc || '');

        addSniperLog(
          'slot',
          `🔥 PHÁT HIỆN SLOT TRỐNG! Môn: ${item.ten_mon} (${item.ma_mon}) - Nhóm ${item.nhom_to} (Còn: ${item.sl_cl}/${item.sl_cp})`
        );

        addSniperLog('info', `🚀 Đang gửi lệnh bắn gói tin ĐKMH cho tổ học [${item.id_to_hoc}]...`);

        const regRes = await fetch('/api/student/course-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'REGISTER',
            id_to_hoc: item.id_to_hoc,
            id_rs: currentIdRsRef.current || data.id_rs,
            sv_nganh: 1,
            targetUsername: currentUser.username,
          }),
        });

        const regData = await regRes.json();
        if (regRes.ok && regData.success) {
          playAlertSound('success');
          addSniperLog(
            'success',
            `🎉 ĐĂNG KÝ THÀNH CÔNG môn [${item.ten_mon}] - Nhóm ${item.nhom_to}! Đã xóa khỏi hàng đợi.`
          );
          setSniperStats((prev) => ({ ...prev, successCount: prev.successCount + 1 }));

          // Loại bỏ môn học đã đăng ký thành công khỏi danh sách canh slot
          const updatedTargets = sniperTargetsRef.current.filter((t) => {
            const targetMaMonUpper = (t.maMon || '').toUpperCase();
            const targetIdToHocStr = t.idToHoc ? String(t.idToHoc) : '';
            const isMatched =
              targetMaMonUpper === itemMaMonUpper ||
              (targetIdToHocStr && targetIdToHocStr === itemIdToHocStr);
            return !isMatched;
          });

          sniperTargetsRef.current = updatedTargets;
          setSniperTargets(updatedTargets);

          await fetchPortalData(true);

          // Nếu đã hoàn thành tất cả môn mục tiêu -> Tự động dừng Sniper Bot
          if (updatedTargets.length === 0) {
            setIsSniperActive(false);
            isSniperActiveRef.current = false;
            if (sniperTimerRef.current) {
              clearInterval(sniperTimerRef.current);
              sniperTimerRef.current = null;
            }
            addSniperLog('success', '🎯 ĐÃ HOÀN TẤT TẤT CẢ MỤC TIÊU! Sniper Bot đã tự động dừng.');
            return;
          }
        } else {
          const msg = (regData.message || regData.error || '').toLowerCase();
          const isAlreadyRegistered =
            msg.includes('đã đăng ký') ||
            msg.includes('đã có trong danh sách') ||
            msg.includes('trùng lịch') ||
            msg.includes('đã tồn tại');

          if (isAlreadyRegistered) {
            addSniperLog(
              'info',
              `ℹ️ [${item.ten_mon}]: ${regData.message || 'Môn học đã tồn tại trong danh sách'}. Đã xóa khỏi hàng đợi.`
            );
            const updatedTargets = sniperTargetsRef.current.filter((t) => {
              const targetMaMonUpper = (t.maMon || '').toUpperCase();
              const targetIdToHocStr = t.idToHoc ? String(t.idToHoc) : '';
              const isMatched =
                targetMaMonUpper === itemMaMonUpper ||
                (targetIdToHocStr && targetIdToHocStr === itemIdToHocStr);
              return !isMatched;
            });
            sniperTargetsRef.current = updatedTargets;
            setSniperTargets(updatedTargets);

            if (updatedTargets.length === 0) {
              setIsSniperActive(false);
              isSniperActiveRef.current = false;
              if (sniperTimerRef.current) {
                clearInterval(sniperTimerRef.current);
                sniperTimerRef.current = null;
              }
              addSniperLog('success', '🎯 ĐÃ HOÀN TẤT TẤT CẢ MỤC TIÊU! Sniper Bot đã tự động dừng.');
              return;
            }
          } else {
            addSniperLog(
              'error',
              `[-] Đăng ký tổ học [${item.id_to_hoc}] thất bại: ${regData.message || regData.error || 'Bị hụt slot'}`
            );
          }
        }
      }
    } catch (err: any) {
      addSniperLog('error', `Lỗi ngoại lệ khi quét: ${err.message}`);
    }
  }, [currentUser.username, addSniperLog, playAlertSound, fetchPortalData]);

  // Sniper timer controller
  useEffect(() => {
    if (isSniperActive) {
      addSniperLog('info', `▶️ Bắt đầu Auto-Register (Chu kỳ: ${sniperInterval}ms)`);
      runSniperStep();

      const intervalId = setInterval(() => {
        runSniperStep();
      }, sniperInterval);

      sniperTimerRef.current = intervalId;
      return () => {
        clearInterval(intervalId);
      };
    } else {
      if (sniperTimerRef.current) {
        clearInterval(sniperTimerRef.current);
        sniperTimerRef.current = null;
      }
    }
  }, [isSniperActive, sniperInterval, runSniperStep, addSniperLog]);

  const startSniper = useCallback(() => {
    if (sniperTargets.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất 1 môn học vào danh sách cần canh slot trước khi bắt đầu.');
      return;
    }
    setIsSniperActive(true);
  }, [sniperTargets.length]);

  const stopSniper = useCallback(() => {
    setIsSniperActive(false);
    addSniperLog('warning', '⏸️ Đã tạm dừng Auto-Register.');
  }, [addSniperLog]);

  const addSniperTarget = useCallback((target: Omit<SniperTarget, 'id'>) => {
    const newTarget: SniperTarget = {
      ...target,
      id: `${target.maMon}-${target.idToHoc || 'ANY'}-${Date.now()}`,
      status: 'WAITING',
    };
    setSniperTargets((prev) => {
      // Check duplicate
      const exists = prev.some(
        (t) => t.maMon?.toUpperCase() === target.maMon?.toUpperCase() && t.idToHoc === target.idToHoc
      );
      if (exists) return prev;
      return [...prev, newTarget];
    });
    setSuccessMsg(`Đã thêm môn [${target.maMon}] vào hàng đợi Auto Canh Slot`);
  }, []);

  const removeSniperTarget = useCallback((id: string) => {
    setSniperTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearSniperTargets = useCallback(() => {
    setSniperTargets([]);
    setIsSniperActive(false);
  }, []);

  const clearSniperLogs = useCallback(() => {
    setSniperLogs([]);
  }, []);

  return {
    // Data & Info
    openCourses,
    registeredCourses,
    externalAccount,
    currentIdRs,
    isLoading,
    isRefreshing,
    registeringIds,
    cancellingIds,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,

    // Actions
    fetchPortalData,
    handleRegister,
    handleCancel,

    // Sniper Bot State & Actions
    isSniperActive,
    sniperInterval,
    setSniperInterval,
    soundEnabled,
    setSoundEnabled,
    sniperTargets,
    sniperLogs,
    sniperStats,
    startSniper,
    stopSniper,
    addSniperTarget,
    removeSniperTarget,
    clearSniperTargets,
    clearSniperLogs,
  };
}
