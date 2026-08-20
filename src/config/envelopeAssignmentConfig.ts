export interface EnvelopeAssignment {
  id?: number;
  roomKey: string;
  sessionId?: string;
  batchCode?: string;
  room?: string;
  date?: string;
  time?: string;
  subjectCode?: string;
  subject?: string;
  assignedClass: string;
  claimedByUsername?: string;
  claimedByName?: string;
  assistantStudentId?: string;
  assistantStudentName?: string;
  customPrice?: number;
  claimedAt?: string;
  note?: string;
}

export type EnvelopeAssignmentsMap = Record<string, EnvelopeAssignment>;

export const ENVELOPE_ASSIGNMENTS_CHANGED_EVENT = 'envelope_assignments_changed';

const STORAGE_KEY = 'ptit_envelope_assignments';

let memoryCache: EnvelopeAssignmentsMap | null = null;

export function getStoredEnvelopeAssignments(): EnvelopeAssignmentsMap {
  if (memoryCache) return memoryCache;
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache || {};
    }
  } catch {}
  return {};
}

export async function fetchEnvelopeAssignments(): Promise<EnvelopeAssignmentsMap> {
  try {
    const res = await fetch('/api/envelope-assignments', {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.assignments && typeof data.assignments === 'object') {
        memoryCache = data.assignments;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.assignments));
          window.dispatchEvent(new CustomEvent(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, { detail: data.assignments }));
          window.dispatchEvent(new CustomEvent('pricing_config_changed'));
        }
        return data.assignments;
      }
    }
  } catch (e) {
    console.error('Failed to fetch envelope assignments from API:', e);
  }
  return getStoredEnvelopeAssignments();
}

export interface SaveEnvelopeOptions {
  assistantStudentId?: string;
  assistantStudentName?: string;
  customPrice?: number | null;
  note?: string;
  batchCode?: string;
  room?: string;
  date?: string;
  time?: string;
  subjectCode?: string;
  subject?: string;
}

export async function saveEnvelopeAssignment(
  roomKey: string,
  assignedClass: string,
  options?: SaveEnvelopeOptions | string
): Promise<{ success: boolean; assignments?: EnvelopeAssignmentsMap; message?: string; assignment?: EnvelopeAssignment }> {
  try {
    const payload = typeof options === 'string' 
      ? { roomKey, sessionId: roomKey, assignedClass, note: options }
      : { roomKey, sessionId: roomKey, assignedClass, ...(options || {}) };

    const res = await fetch('/api/envelope-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || 'Không thể lưu phân công' };
    }

    if (data.assignments) {
      memoryCache = data.assignments;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.assignments));
        window.dispatchEvent(new CustomEvent(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, { detail: data.assignments }));
        window.dispatchEvent(new CustomEvent('pricing_config_changed'));
      }
    }
    return { success: true, assignments: data.assignments, message: data.message, assignment: data.assignment };
  } catch (e: any) {
    return { success: false, message: e.message || 'Lỗi mạng khi lưu phân công' };
  }
}

export async function removeEnvelopeAssignment(
  roomKey: string
): Promise<{ success: boolean; assignments?: EnvelopeAssignmentsMap; message?: string }> {
  try {
    const res = await fetch(`/api/envelope-assignments?roomKey=${encodeURIComponent(roomKey)}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.error || 'Không thể hủy nhận' };
    }

    if (data.assignments) {
      memoryCache = data.assignments;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.assignments));
        window.dispatchEvent(new CustomEvent(ENVELOPE_ASSIGNMENTS_CHANGED_EVENT, { detail: data.assignments }));
        window.dispatchEvent(new CustomEvent('pricing_config_changed'));
      }
    }
    return { success: true, assignments: data.assignments, message: data.message };
  } catch (e: any) {
    return { success: false, message: e.message || 'Lỗi mạng khi hủy nhận' };
  }
}

/**
 * Xác định lớp phụ trách đi phong bì cho một phòng thi.
 * Ưu tiên:
 * 1. Lớp Trưởng chủ động nhận (custom assignment).
 * 2. Lớp có Lớp Trưởng có số lượng sinh viên dự thi đông nhất.
 * 3. Lớp có số sinh viên đông nhất trong phòng.
 */
export function getEffectiveResponsibleClass(
  session: {
    id: string;
    room?: string;
    date?: string;
    time?: string;
    subject?: string;
    classCounts?: { className: string; count: number }[];
  },
  monitoredClassesInRoom?: { className: string; count: number }[],
  assignmentsMap?: EnvelopeAssignmentsMap
): { responsibleClass: string; isClaimedManual: boolean; assignmentInfo?: EnvelopeAssignment } {
  const assignments = assignmentsMap || getStoredEnvelopeAssignments();
  const roomKey = session.id;

  if (assignments && assignments[roomKey] && assignments[roomKey].assignedClass) {
    return {
      responsibleClass: assignments[roomKey].assignedClass,
      isClaimedManual: true,
      assignmentInfo: assignments[roomKey],
    };
  }

  if (monitoredClassesInRoom && monitoredClassesInRoom.length > 0) {
    return {
      responsibleClass: monitoredClassesInRoom[0].className,
      isClaimedManual: false,
    };
  }

  if (session.classCounts && session.classCounts.length > 0) {
    return {
      responsibleClass: session.classCounts[0].className,
      isClaimedManual: false,
    };
  }

  return {
    responsibleClass: '',
    isClaimedManual: false,
  };
}
