import { StudentMonitorFlowSummary } from '../../types/dashboard.types';

export interface StudentMonitorFlowCardProps {
  flowSummary: StudentMonitorFlowSummary;
  onNavigateTab: (tab: string, subTab?: string, options?: any) => void;
}
