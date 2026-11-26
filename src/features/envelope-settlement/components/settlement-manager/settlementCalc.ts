import { ExamRecord, ExamSession } from '../../../../types';
import { calculateRoomPrice } from '../../../../config/pricingConfig';
import {
  getEffectiveResponsibleClass,
  EnvelopeAssignmentsMap,
} from '../../../../config/envelopeAssignmentConfig';
import {
  AvailableClasses,
  DebtDetail,
  PartnerBalance,
  SettlementData,
  SettlementScope,
} from './types';

export interface ComputeSettlementDataParams {
  sessions: ExamSession[];
  selectedClass: string;
  monitorClasses: Set<string>;
  availableClasses: AvailableClasses;
  getMonitorName: (cls: string) => string;
  isStudentExcluded: (sessionId: string, r: ExamRecord) => boolean;
  envelopeAssignments: EnvelopeAssignmentsMap;
  settlementScope: SettlementScope;
}

export function computeSettlementData({
  sessions,
  selectedClass,
  monitorClasses,
  availableClasses,
  getMonitorName,
  isStudentExcluded,
  envelopeAssignments,
  settlementScope,
}: ComputeSettlementDataParams): SettlementData {
  if (!selectedClass || sessions.length === 0) {
    return {
      receivables: [],
      payables: [],
      settled: [],
      totalReceive: 0,
      totalPay: 0,
      netTotal: 0,
      involvedRoomsCount: 0,
      claimedRoomsInvolvedCount: 0,
    };
  }

  const allDebts: DebtDetail[] = [];
  const involvedRoomIds = new Set<string>();
  let claimedRoomsInvolvedCount = 0;

  sessions.forEach((session) => {
    // Recalculate effective class counts (excluding students marked as hoãn thi / excluded)
    const effectiveCounts = new Map<string, number>();
    session.records.forEach((r) => {
      const isExcluded = isStudentExcluded(session.id, r);
      if (!isExcluded) {
        const cls = r.MaLop || 'Khác';
        effectiveCounts.set(cls, (effectiveCounts.get(cls) || 0) + 1);
      }
    });

    // Find classes with monitors in this session (using effective counts)
    const monitoredClassesInRoom = Array.from(effectiveCounts.entries())
      .filter(([cls]) => monitorClasses.has(cls))
      .map(([cls, count]) => ({ className: cls, count }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.className.localeCompare(b.className)));

    // The monitor who claimed or has the most students is responsible for the envelope
    const { responsibleClass, isClaimedManual, assignmentInfo } = getEffectiveResponsibleClass(
      session,
      monitoredClassesInRoom,
      envelopeAssignments
    );
    if (!responsibleClass) return;

    // Scope Filter: When CLAIMED_ONLY, only calculate for sessions that have been claimed
    if (settlementScope === 'CLAIMED_ONLY' && !isClaimedManual) {
      return;
    }

    const allClassesInRoom = Array.from(effectiveCounts.entries())
      .map(([className, count]) => ({ className, count }))
      .filter((c) => c.count > 0);

    if (allClassesInRoom.length === 0) return;

    // If only 1 class in room and it's the responsible class (and not manually claimed from another class), no debts
    if (allClassesInRoom.length === 1 && allClassesInRoom[0].className === responsibleClass && !isClaimedManual) {
      return;
    }

    const totalStudents = allClassesInRoom.reduce((acc, c) => acc + c.count, 0);
    const roomPrice = calculateRoomPrice(session.subject, session.subjectCode, session.room, session.examFormat, session.id);
    const pricePerStudent = totalStudents > 0 ? roomPrice / totalStudents : 0;

    let isSessionInvolved = false;

    allClassesInRoom.forEach((c) => {
      if (c.className !== responsibleClass) {
        allDebts.push({
          session: { ...session, isClaimedManual, assignmentInfo, room: session.room, subject: session.subject },
          fromClass: c.className, // Class C owes
          toClass: responsibleClass, // Class responsible (the one who receives the envelope)
          amount: c.count * pricePerStudent,
          studentsCount: c.count,
          pricePerStudent,
          totalRoomPrice: roomPrice,
        });

        if (c.className === selectedClass || responsibleClass === selectedClass) {
          isSessionInvolved = true;
        }
      }
    });

    if (isSessionInvolved) {
      involvedRoomIds.add(session.id);
      if (isClaimedManual) {
        claimedRoomsInvolvedCount++;
      }
    }
  });

  const pMap = new Map<string, PartnerBalance>();
  // Pre-populate with all known classes so they are available
  availableClasses.allClasses.forEach((c) => {
    if (c !== selectedClass) {
      pMap.set(c, {
        partnerClass: c,
        partnerMonitor: getMonitorName(c),
        netBalance: 0,
        detailsOweUs: [],
        detailsWeOwe: [],
      });
    }
  });

  allDebts.forEach((debt) => {
    if (debt.fromClass === selectedClass) {
      // We owe them
      let p = pMap.get(debt.toClass);
      if (!p) {
        p = {
          partnerClass: debt.toClass,
          partnerMonitor: getMonitorName(debt.toClass),
          netBalance: 0,
          detailsOweUs: [],
          detailsWeOwe: [],
        };
        pMap.set(debt.toClass, p);
      }
      p.netBalance -= debt.amount;
      p.detailsWeOwe.push(debt);
    } else if (debt.toClass === selectedClass) {
      // They owe us
      let p = pMap.get(debt.fromClass);
      if (!p) {
        p = {
          partnerClass: debt.fromClass,
          partnerMonitor: getMonitorName(debt.fromClass),
          netBalance: 0,
          detailsOweUs: [],
          detailsWeOwe: [],
        };
        pMap.set(debt.fromClass, p);
      }
      p.netBalance += debt.amount;
      p.detailsOweUs.push(debt);
    }
  });

  const activePartners = Array.from(pMap.values()).filter(
    (p) => Math.abs(p.netBalance) > 0.01 || p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0
  );

  let totalReceive = 0;
  let totalPay = 0;

  activePartners.forEach((p) => {
    if (p.netBalance > 0.01) totalReceive += p.netBalance;
    if (p.netBalance < -0.01) totalPay += Math.abs(p.netBalance);
  });

  const receivables = activePartners
    .filter((p) => p.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);
  const payables = activePartners
    .filter((p) => p.netBalance < -0.01)
    .sort((a, b) => a.netBalance - b.netBalance);
  const settled = activePartners.filter(
    (p) => Math.abs(p.netBalance) <= 0.01 && (p.detailsOweUs.length > 0 || p.detailsWeOwe.length > 0)
  );

  return {
    receivables,
    payables,
    settled,
    totalReceive,
    totalPay,
    netTotal: totalReceive - totalPay,
    involvedRoomsCount: involvedRoomIds.size,
    claimedRoomsInvolvedCount,
  };
}
