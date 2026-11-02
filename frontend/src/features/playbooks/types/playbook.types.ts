export type ActionType = 'MANUAL' | 'AUTOMATED_SIMULATED' | 'VERIFICATION';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PlaybookStep {
  id: string;
  stepOrder: number;
  name: string;
  instructions: string;
  actionType: ActionType;
  riskLevel: RiskLevel;
}

export interface Playbook {
  id: string;
  code: string;
  title: string;
  category: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  steps: PlaybookStep[];
}

export interface StepExecutionDetail {
  stepId: string;
  stepOrder: number;
  name: string;
  instructions: string;
  actionType: ActionType;
  riskLevel: RiskLevel;
  executed: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  executedByName?: string;
  notes?: string;
  executedAt?: string;
}

export interface IncidentPlaybookStatus {
  incidentId: string;
  playbookId: string;
  playbookCode: string;
  playbookTitle: string;
  category: string;
  totalSteps: number;
  completedSteps: number;
  steps: StepExecutionDetail[];
}

export interface ExecutePlaybookStepPayload {
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  notes?: string;
}
