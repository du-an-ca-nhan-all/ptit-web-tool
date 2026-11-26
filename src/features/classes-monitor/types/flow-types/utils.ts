import { FLOW_ACTIONS_REGISTRY } from './constants';
import type { FlowActionDefinition, FlowActionType } from './types';

/**
 * Hàm chuẩn hóa mã Action sang dạng Canonical Key chuẩn (Ví dụ: 'REGISTER' -> 'COURSE_REGISTER')
 */
export function normalizeFlowAction(actionKey?: string | null): FlowActionType {
  if (!actionKey) return 'COURSE_REGISTER';
  const upper = actionKey.trim().toUpperCase();
  const found = FLOW_ACTIONS_REGISTRY[upper];
  return found ? found.canonicalKey : (upper as FlowActionType);
}

/**
 * Hàm lấy thông tin định nghĩa hiển thị chi tiết của 1 Flow Action
 */
export function getFlowActionDefinition(actionKey?: string | null): FlowActionDefinition {
  const normKey = normalizeFlowAction(actionKey);
  return (
    FLOW_ACTIONS_REGISTRY[normKey] || {
      key: normKey,
      canonicalKey: normKey,
      category: 'CUSTOM_ACTION',
      categoryName: 'Hành Động Khác',
      categoryBadgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      name: normKey,
      shortName: normKey,
      description: 'Hành động tùy chỉnh trong hệ thống',
      icon: 'Layers',
      badgeStyle: {
        bg: 'bg-slate-100',
        text: 'text-slate-900',
        border: 'border-slate-300',
      },
      isSupported: true,
    }
  );
}
