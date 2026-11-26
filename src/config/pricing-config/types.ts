export interface PricingConfig {
  commonRoom: number;
  englishOralRoom: number;
}

export interface ExamRoomData {
  id?: number;
  roomKey: string;
  mapThi: string;
  maMH?: string | null;
  tenMH?: string | null;
  ngayThi?: string | null;
  gioThi?: string | null;
  maHTThi?: string | null;
  batchCode?: string | null;
  customPrice: number;
  note?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SessionPriceOverrideMeta {
  mapThi?: string;
  maMH?: string;
  tenMH?: string;
  ngayThi?: string;
  gioThi?: string;
  maHTThi?: string;
  batchCode?: string;
  note?: string;
}
