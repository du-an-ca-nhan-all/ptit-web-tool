import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  AlertSoundType,
  SniperLogEntry,
  SniperStatsState,
  SniperTarget,
} from './types';
import {
  filterOutMatchedSniperTargets,
  isAlreadyRegisteredMessage,
  mergeMatchedSlotsIntoTargets,
} from './utils';

export interface ExecuteSniperStepParams {
  username: string;
  isSniperActiveRef: MutableRefObject<boolean>;
  sniperTargetsRef: MutableRefObject<SniperTarget[]>;
  currentIdRsRef: MutableRefObject<string>;
  setCurrentIdRs: (idRs: string) => void;
  setSniperTargets: Dispatch<SetStateAction<SniperTarget[]>>;
  setSniperStats: Dispatch<SetStateAction<SniperStatsState>>;
  addSniperLog: (type: SniperLogEntry['type'], message: string) => void;
  playAlertSound: (type: AlertSoundType) => void;
  fetchPortalData: (quiet?: boolean) => Promise<void>;
  stopSniperTimerAndDeactivate: () => void;
}

export async function executeSniperStep({
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
}: ExecuteSniperStepParams): Promise<void> {
  if (!isSniperActiveRef.current) return;

  // Filter only targets that are not finished
  const targets = sniperTargetsRef.current.filter((t) => t.status !== 'SUCCESS');
  if (targets.length === 0) {
    stopSniperTimerAndDeactivate();
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
        targetUsername: username,
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
    setSniperTargets((prev) => mergeMatchedSlotsIntoTargets(prev, matchedList));

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
          targetUsername: username,
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
        const updatedTargets = filterOutMatchedSniperTargets(
          sniperTargetsRef.current,
          itemMaMonUpper,
          itemIdToHocStr
        );

        sniperTargetsRef.current = updatedTargets;
        setSniperTargets(updatedTargets);

        await fetchPortalData(true);

        // Nếu đã hoàn thành tất cả môn mục tiêu -> Tự động dừng Sniper Bot
        if (updatedTargets.length === 0) {
          stopSniperTimerAndDeactivate();
          addSniperLog('success', '🎯 ĐÃ HOÀN TẤT TẤT CẢ MỤC TIÊU! Sniper Bot đã tự động dừng.');
          return;
        }
      } else {
        const rawMsg = regData.message || regData.error || '';
        if (isAlreadyRegisteredMessage(rawMsg)) {
          addSniperLog(
            'info',
            `ℹ️ [${item.ten_mon}]: ${regData.message || 'Môn học đã tồn tại trong danh sách'}. Đã xóa khỏi hàng đợi.`
          );
          const updatedTargets = filterOutMatchedSniperTargets(
            sniperTargetsRef.current,
            itemMaMonUpper,
            itemIdToHocStr
          );
          sniperTargetsRef.current = updatedTargets;
          setSniperTargets(updatedTargets);

          if (updatedTargets.length === 0) {
            stopSniperTimerAndDeactivate();
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
}
