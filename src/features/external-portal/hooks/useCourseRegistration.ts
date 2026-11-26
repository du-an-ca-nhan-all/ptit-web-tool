'use client';

import { useState, useCallback } from 'react';
import { LoginUser } from '../../../types';
import { AlertSoundType } from './use-course-registration/types';
import { playAlertSoundEffect } from './use-course-registration/utils';
import { usePortalCourseData } from './use-course-registration/usePortalCourseData';
import { useSniperBot } from './use-course-registration/useSniperBot';

export type {
  SniperTarget,
  SniperLogEntry,
  MonitorFlowConfigInfo,
} from './use-course-registration/types';

export function useCourseRegistration(currentUser: LoginUser) {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playAlertSound = useCallback(
    (type: AlertSoundType) => {
      playAlertSoundEffect(type, soundEnabled);
    },
    [soundEnabled]
  );

  const portal = usePortalCourseData({
    username: currentUser.username,
    playAlertSound,
    setSuccessMsg,
    setErrorMsg,
  });

  const sniper = useSniperBot({
    username: currentUser.username,
    currentIdRsRef: portal.currentIdRsRef,
    setCurrentIdRs: portal.setCurrentIdRs,
    monitorFlowConfig: portal.monitorFlowConfig,
    fetchPortalData: portal.fetchPortalData,
    playAlertSound,
    setSuccessMsg,
    setErrorMsg,
  });

  return {
    // Data & Info
    openCourses: portal.openCourses,
    registeredCourses: portal.registeredCourses,
    externalAccount: portal.externalAccount,
    monitorFlowConfig: portal.monitorFlowConfig,
    currentIdRs: portal.currentIdRs,
    isLoading: portal.isLoading,
    isRefreshing: portal.isRefreshing,
    registeringIds: portal.registeringIds,
    cancellingIds: portal.cancellingIds,
    successMsg,
    setSuccessMsg,
    errorMsg,
    setErrorMsg,

    // Actions
    fetchPortalData: portal.fetchPortalData,
    handleRegister: portal.handleRegister,
    handleCancel: portal.handleCancel,

    // Sniper Bot State & Actions
    isSniperActive: sniper.isSniperActive,
    sniperInterval: sniper.sniperInterval,
    setSniperInterval: sniper.setSniperInterval,
    soundEnabled,
    setSoundEnabled,
    sniperTargets: sniper.sniperTargets,
    sniperLogs: sniper.sniperLogs,
    sniperStats: sniper.sniperStats,
    startSniper: sniper.startSniper,
    stopSniper: sniper.stopSniper,
    addSniperTarget: sniper.addSniperTarget,
    removeSniperTarget: sniper.removeSniperTarget,
    clearSniperTargets: sniper.clearSniperTargets,
    clearSniperLogs: sniper.clearSniperLogs,
  };
}
