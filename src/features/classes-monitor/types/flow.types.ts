/**
 * Hệ thống định nghĩa chuẩn hóa các loại Flow Action theo Lớp trưởng
 * Hỗ trợ mở rộng đa module: Đăng Ký Môn Học, Lịch Thi, Khảo Sát Giảng Viên, Học Phí, Điểm Danh, v.v.
 */

export type {
  FlowCategory,
  FlowActionType,
  FlowActionDefinition,
} from './flow-types/types';

export { FLOW_ACTIONS_REGISTRY } from './flow-types/constants';

export {
  normalizeFlowAction,
  getFlowActionDefinition,
} from './flow-types/utils';
