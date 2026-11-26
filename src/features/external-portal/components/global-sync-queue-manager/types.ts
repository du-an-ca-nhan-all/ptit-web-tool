import { LoginUser } from '../../../../types';

export interface GlobalSyncQueueManagerProps {
  currentUser: LoginUser;
}

export interface JobScheduleFormItem {
  isEnabled: boolean;
  scheduleTime: string;
}

export type JobConfigKey =
  | 'timetableJob'
  | 'gradesJob'
  | 'lmsJob'
  | 'examsJob'
  | 'slinkGradesJob'
  | 'profileJob';

export interface SyncConfigFormState {
  isEnabled: boolean;
  timetableJob: JobScheduleFormItem;
  gradesJob: JobScheduleFormItem;
  lmsJob: JobScheduleFormItem;
  examsJob: JobScheduleFormItem;
  slinkGradesJob: JobScheduleFormItem;
  profileJob: JobScheduleFormItem;
}
