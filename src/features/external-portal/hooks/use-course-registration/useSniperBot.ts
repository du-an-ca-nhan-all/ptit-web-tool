'use client';

import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import {
  AlertSoundType,
  MonitorFlowConfigInfo,
  SniperLogEntry,
  SniperStatsState,
  SniperTarget,
} from './types';
import { createSniperLogEntry } from './utils';
import { executeSniperStep } from './sniperStep';

interface UseSniperBotParams {
  username: string;
  currentIdRsRef: MutableRefObject<string>;
  setCurrentIdRs: (idRs: string) => void;
  monitorFlowConfig: MonitorFlowConfigInfo | null;
  fetchPortalData: (quiet?: boolean) => Promise<void>;
  playAlertSound: (type: AlertSoundType) => void;
  setSuccessMsg: (msg: string) => void;
  setErrorMsg: (msg: string) => void;
}

export function useSniperBot({
  username,
  currentIdRsRef,
  setCurrentIdRs,
  monitorFlowConfig,
  fetchPortalData,
  playAlertSound,
  setSuccessMsg,
  setErrorMsg,
}: UseSniperBotParams) {
  const [isSniperActive, setIsSniperActive] = useState(false);
  const [sniperInterval, setSniperInterval] = useState<number>(1500); // ms
  const [sniperTargets, setSniperTargets] = useState<SniperTarget[]>([]);
  const [sniperLogs, setSniperLogs] = useState<SniperLogEntry[]>([]);
  const [sniperStats, setSniperStats] = useState<SniperStatsState>({
    attempts: 0,
    slotsFound: 0,
    successCount: 0,
    lastRunAt: null,
  });

  const sniperTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSniperActiveRef = useRef(false);
  isSniperActiveRef.current = isSniperActive;

  const sniperTargetsRef = useRef(sniperTargets);
  sniperTargetsRef.current = sniperTargets;

  const addSniperLog = useCallback((type: SniperLogEntry['type'], message: string) => {
    const entry = createSniperLogEntry(type, message);
    setSniperLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  const stopSniperTimerAndDeactivate = useCallback(() => {
    setIsSniperActive(false);
    isSniperActiveRef.current = false;
    if (sniperTimerRef.current) {
      clearInterval(sniperTimerRef.current);
      sniperTimerRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------
  // SNIPER BOT EXECUTION LOOP
  // -------------------------------------------------------------
  const runSniperStep = useCallback(async () => {
    await executeSniperStep({
      username,
      isSniperActiveRef,
      sniperTargetsRef,
      currentIdRsRef,
      setCurrentIdRs,
      setSniperTargets,
      setSniperStats,
      addSniperLog,
      playAlertSound,
      fetchPortalData,
      stopSniperTimerAndDeactivate,
    });
  }, [
    username,
    addSniperLog,
    playAlertSound,
    fetchPortalData,
    stopSniperTimerAndDeactivate,
    setCurrentIdRs,
    currentIdRsRef,
  ]);

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
    if (monitorFlowConfig?.isEnabled) {
      setErrorMsg(
        `Tài khoản đang bật Flow theo Lớp trưởng (${monitorFlowConfig.monitorUsername} - Lớp ${monitorFlowConfig.classCode}). Tính năng Canh Slot (Sniper Bot) trực tiếp bị khóa để tránh trùng lịch học.`
      );
      return;
    }
    if (sniperTargets.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất 1 môn học vào danh sách cần canh slot trước khi bắt đầu.');
      return;
    }
    setIsSniperActive(true);
  }, [monitorFlowConfig, sniperTargets.length, setErrorMsg]);

  const stopSniper = useCallback(() => {
    setIsSniperActive(false);
    addSniperLog('warning', '⏸️ Đã tạm dừng Auto-Register.');
  }, [addSniperLog]);

  const addSniperTarget = useCallback(
    (target: Omit<SniperTarget, 'id'>) => {
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
    },
    [setSuccessMsg]
  );

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
    isSniperActive,
    sniperInterval,
    setSniperInterval,
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
