import { ExamRecord } from '../../types/class.types';

export interface ClassMonitorToolsProps {
  records: ExamRecord[];
  selectedClass: string;
  onClassChange: (cls: string) => void;
}

export interface ClassMonitorStats {
  students: number;
  subjects: number;
  totalExams: number;
}

export interface RoomDetailItem {
  room: ExamRecord['MAPTHI'];
  subjectCode: ExamRecord['MaMH'];
  subjectName: ExamRecord['TenMH'];
  date: ExamRecord['NgayThi'];
  time: ExamRecord['GioThi'];
  format: ExamRecord['MaHTThi'];
  students: number;
}
