import { FollowerStudentItem } from '../../server/monitorFlowServerService';
import {
  EditedFollowerConfig,
  FollowerConfigField,
  FollowerPermissionField,
  SaveConfigPayloadItem,
} from './types';

export function mergeStudentsWithEdits(
  students: FollowerStudentItem[],
  editedConfigs: Record<string, EditedFollowerConfig>
): FollowerStudentItem[] {
  return students.map((st) => {
    const edit = editedConfigs[st.maSV];
    if (!edit) return st;
    return {
      ...st,
      isEnabled: edit.isEnabled !== undefined ? edit.isEnabled : st.isEnabled,
      allowRegisterCourse:
        edit.allowRegisterCourse !== undefined
          ? edit.allowRegisterCourse
          : st.allowRegisterCourse,
      allowCancelCourse:
        edit.allowCancelCourse !== undefined
          ? edit.allowCancelCourse
          : st.allowCancelCourse,
      autoSyncOnAction:
        edit.autoSyncOnAction !== undefined
          ? edit.autoSyncOnAction
          : st.autoSyncOnAction,
      note: edit.note !== undefined ? edit.note : st.note,
    };
  });
}

export function buildUpdatedFollowerConfig(
  prev: Record<string, EditedFollowerConfig>,
  students: FollowerStudentItem[],
  username: string,
  field: FollowerConfigField,
  value: any
): Record<string, EditedFollowerConfig> {
  const existingStudent = students.find((s) => s.maSV === username);
  const current = prev[username] || {
    isEnabled: existingStudent?.isEnabled ?? false,
    allowRegisterCourse: existingStudent?.allowRegisterCourse ?? false,
    allowCancelCourse: existingStudent?.allowCancelCourse ?? false,
    autoSyncOnAction: existingStudent?.autoSyncOnAction ?? false,
    note: existingStudent?.note || '',
  };

  return {
    ...prev,
    [username]: {
      ...current,
      [field]: value,
    },
  };
}

export function buildAllFollowersStatusEdits(
  students: FollowerStudentItem[],
  enabled: boolean
): Record<string, EditedFollowerConfig> {
  const newEdits: Record<string, EditedFollowerConfig> = {};
  students.forEach((st) => {
    newEdits[st.maSV] = {
      isEnabled: enabled,
      allowRegisterCourse: st.allowRegisterCourse,
      allowCancelCourse: st.allowCancelCourse,
      autoSyncOnAction: st.autoSyncOnAction,
    };
  });
  return newEdits;
}

export function buildAllPermissionsEdits(
  prev: Record<string, EditedFollowerConfig>,
  students: FollowerStudentItem[],
  field: FollowerPermissionField,
  value: boolean
): Record<string, EditedFollowerConfig> {
  const updated = { ...prev };
  students.forEach((st) => {
    const curr = updated[st.maSV] || {
      isEnabled: st.isEnabled,
      allowRegisterCourse: st.allowRegisterCourse,
      allowCancelCourse: st.allowCancelCourse,
      autoSyncOnAction: st.autoSyncOnAction,
    };
    updated[st.maSV] = {
      ...curr,
      [field]: value,
    };
  });
  return updated;
}

export function buildSaveConfigPayload(
  combinedStudents: FollowerStudentItem[]
): SaveConfigPayloadItem[] {
  return combinedStudents.map((st) => ({
    followerUsername: st.maSV,
    isEnabled: st.isEnabled,
    allowRegisterCourse: st.allowRegisterCourse,
    allowCancelCourse: st.allowCancelCourse,
    autoSyncOnAction: st.autoSyncOnAction,
    note: st.note || undefined,
  }));
}
