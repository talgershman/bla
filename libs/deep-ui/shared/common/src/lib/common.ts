export interface DuplicateResponse {
  isDuplicate: boolean;
}

export interface ValidationResponse {
  error?: string;
}

export interface ApiErrorResponse {
  error?: string;
}

export const DUPLICATE_SUFFIX_STR = '_new';

export const BUDGET_GROUP_TOOLTIP_MSG = `Cloud budgets are allocated to organizational units by the FinOps team.
As part of the integration, DEEP will validate budget availability before triggering an job.`;
