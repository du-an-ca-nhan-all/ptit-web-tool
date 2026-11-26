import { EnhancedExamSession, EnvelopeCounts, EnvelopeFilterStatus } from './types';

export function parseDate(dStr: string): number {
  if (!dStr) return 0;
  const parts = dStr.split(/[\/\-]/);
  if (parts.length >= 3) {
    const d = parseInt(parts[0], 10) || 1;
    const m = parseInt(parts[1], 10) || 1;
    const y = parseInt(parts[2], 10) || 1970;
    return new Date(y, m - 1, d).getTime();
  }
  return 0;
}

// Check if user's class has the absolute highest number of students in the room (including classes without a monitor)
export function isUserClassStrictLargestInSession(
  s: { classCounts: { className: string; count: number }[] },
  uClass: string
): boolean {
  if (!uClass) return false;
  const cleanUClass = uClass.trim().toUpperCase();
  const userCount = s.classCounts.find((c) => c.className.trim().toUpperCase() === cleanUClass)?.count || 0;
  if (userCount <= 0) return false;
  const maxCount = Math.max(...s.classCounts.map((c) => c.count));
  return userCount === maxCount;
}

// Check if user's class is suggested by the system (prioritizing classes with a monitor)
export function isUserClassSuggestedInSession(
  s: { responsibleClasses: string[] },
  uClass: string
): boolean {
  if (!uClass) return false;
  const cleanUClass = uClass.trim().toUpperCase();
  return s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass);
}

export function computeEnvelopeCounts(
  enhancedSessions: EnhancedExamSession[],
  userClass: string
): EnvelopeCounts {
  const total = enhancedSessions.filter((s) => s.responsibleClasses.length > 0).length;
  const unclaimed = enhancedSessions.filter((s) => s.responsibleClasses.length > 0 && !s.isClaimedManual).length;
  const claimed = enhancedSessions.filter((s) => s.responsibleClasses.length > 0 && s.isClaimedManual).length;
  const myClass = userClass
    ? enhancedSessions.filter(
        (s) =>
          s.responsibleClasses.length > 0 &&
          (s.classCounts.some((c) => c.className.trim().toUpperCase() === userClass.trim().toUpperCase()) ||
            s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === userClass.trim().toUpperCase()))
      ).length
    : 0;
  const myClassStrictLargest = userClass
    ? enhancedSessions.filter(
        (s) => s.responsibleClasses.length > 0 && isUserClassStrictLargestInSession(s, userClass)
      ).length
    : 0;
  const myClassSuggested = userClass
    ? enhancedSessions.filter(
        (s) => s.responsibleClasses.length > 0 && isUserClassSuggestedInSession(s, userClass)
      ).length
    : 0;
  const myClaimed = userClass
    ? enhancedSessions.filter(
        (s) =>
          s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === userClass.trim().toUpperCase()) &&
          s.isClaimedManual
      ).length
    : 0;

  return { total, unclaimed, claimed, myClass, myClassStrictLargest, myClassSuggested, myClaimed };
}

export function filterEnvelopeSessions(
  enhancedSessions: EnhancedExamSession[],
  params: {
    filterStatus: EnvelopeFilterStatus;
    filterDate: string;
    filterClass: string;
    searchTerm: string;
    userClass: string;
  }
): EnhancedExamSession[] {
  const { filterStatus, filterDate, filterClass, searchTerm, userClass } = params;
  let filtered = enhancedSessions.filter((s) => s.responsibleClasses.length > 0);

  if (filterStatus === 'UNCLAIMED') {
    filtered = filtered.filter((s) => !s.isClaimedManual);
  } else if (filterStatus === 'CLAIMED') {
    filtered = filtered.filter((s) => s.isClaimedManual);
  } else if (filterStatus === 'MY_CLASS' && userClass) {
    const cleanUClass = userClass.trim().toUpperCase();
    filtered = filtered.filter(
      (s) =>
        s.classCounts.some((c) => c.className.trim().toUpperCase() === cleanUClass) ||
        s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass)
    );
  } else if (filterStatus === 'MY_CLASS_STRICT_LARGEST' && userClass) {
    filtered = filtered.filter((s) => isUserClassStrictLargestInSession(s, userClass));
  } else if (filterStatus === 'MY_CLASS_SUGGESTED' && userClass) {
    filtered = filtered.filter((s) => isUserClassSuggestedInSession(s, userClass));
  } else if (filterStatus === 'MY_CLAIMED' && userClass) {
    const cleanUClass = userClass.trim().toUpperCase();
    filtered = filtered.filter(
      (s) => s.responsibleClasses.some((rc) => rc.trim().toUpperCase() === cleanUClass) && s.isClaimedManual
    );
  }

  if (filterDate && filterDate !== 'ALL') {
    filtered = filtered.filter((s) => s.date === filterDate);
  }

  if (filterClass && filterClass !== 'ALL') {
    filtered = filtered.filter(
      (s) => s.classCounts.some((c) => c.className === filterClass) || s.responsibleClasses.includes(filterClass)
    );
  }

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter((s) => {
      const matchBasic =
        s.subject.toLowerCase().includes(term) ||
        s.subjectCode.toLowerCase().includes(term) ||
        s.room.toLowerCase().includes(term) ||
        (s.examFormat && s.examFormat.toLowerCase().includes(term)) ||
        s.responsibleClasses.some((c) => c.toLowerCase().includes(term)) ||
        s.classCounts.some((c) => c.className.toLowerCase().includes(term));

      if (matchBasic) return true;

      if (s.assignmentInfo) {
        const asstName = s.assignmentInfo.assistantStudentName?.toLowerCase() || '';
        const asstId = s.assignmentInfo.assistantStudentId?.toLowerCase() || '';
        const claimedBy = s.assignmentInfo.claimedByName?.toLowerCase() || '';
        const note = s.assignmentInfo.note?.toLowerCase() || '';
        if (asstName.includes(term) || asstId.includes(term) || claimedBy.includes(term) || note.includes(term)) {
          return true;
        }
      }
      return false;
    });
  }

  return filtered;
}
