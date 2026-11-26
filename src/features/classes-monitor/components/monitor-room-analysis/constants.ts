import { RoomCountOperator } from '../../types/roomAnalysis.types';

export const OPERATOR_LABELS: Record<RoomCountOperator, string> = {
  ALL: 'Mọi sĩ số',
  LT: '< Nhỏ hơn',
  LTE: '<= Nhỏ hơn hoặc bằng',
  GT: '> Lớn hơn',
  GTE: '>= Lớn hơn hoặc bằng',
  EQ: '= Bằng đúng',
};

export const QUICK_ROOM_PRESETS: Array<{ label: string; op: RoomCountOperator; n: number }> = [
  { label: '< 3 SV', op: 'LT', n: 3 },
  { label: '< 5 SV', op: 'LT', n: 5 },
  { label: '>= 5 SV', op: 'GTE', n: 5 },
  { label: '>= 10 SV', op: 'GTE', n: 10 },
];
