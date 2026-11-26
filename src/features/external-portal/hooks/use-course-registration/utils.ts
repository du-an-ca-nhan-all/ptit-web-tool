import { AlertSoundType, SniperLogEntry, SniperTarget } from './types';

// Sound generator helper using Web Audio API
export function playAlertSoundEffect(type: AlertSoundType, soundEnabled: boolean): void {
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
}

export function createSniperLogEntry(
  type: SniperLogEntry['type'],
  message: string
): SniperLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    type,
    message,
  };
}

export function mergeMatchedSlotsIntoTargets(
  targets: SniperTarget[],
  matchedList: any[]
): SniperTarget[] {
  return targets.map((t) => {
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
  });
}

export function filterOutMatchedSniperTargets(
  targets: SniperTarget[],
  itemMaMonUpper: string,
  itemIdToHocStr: string
): SniperTarget[] {
  return targets.filter((t) => {
    const targetMaMonUpper = (t.maMon || '').toUpperCase();
    const targetIdToHocStr = t.idToHoc ? String(t.idToHoc) : '';
    const isMatched =
      targetMaMonUpper === itemMaMonUpper ||
      (targetIdToHocStr && targetIdToHocStr === itemIdToHocStr);
    return !isMatched;
  });
}

export function isAlreadyRegisteredMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('đã đăng ký') ||
    msg.includes('đã có trong danh sách') ||
    msg.includes('trùng lịch') ||
    msg.includes('đã tồn tại')
  );
}
