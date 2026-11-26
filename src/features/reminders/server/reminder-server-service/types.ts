export interface GetRemindersOptions {
  type?: string;
  status?: string;
  upcomingOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
}
