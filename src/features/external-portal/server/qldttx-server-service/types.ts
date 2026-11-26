/**
 * Shared types for QLDTTX Server Service.
 */

export interface QldttxAccountInput {
  username: string;
  password?: string;
  token?: string | null;
}

export interface QldttxStudentProfileInfo {
  ngaySinh: string | null;
  gioiTinh: string | null;
  soDienThoai: string | null;
  soCMND: string | null;
  email1: string | null;
  email2: string | null;
  noiSinh: string | null;
  quocTich: string | null;
  rawData?: any;
}
