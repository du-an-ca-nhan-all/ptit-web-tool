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
