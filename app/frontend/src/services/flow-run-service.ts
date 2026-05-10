const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface FlowRunRecord {
  id: number;
  flow_id: number;
  status: string;
  run_number: number;
  created_at: string;
  updated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  request_data?: Record<string, unknown> | null;
  results?: Record<string, unknown> | null;
  error_message?: string | null;
}

export const flowRunService = {
  async getRun(flowId: number, runId: number): Promise<FlowRunRecord> {
    const response = await fetch(`${API_BASE_URL}/flows/${flowId}/runs/${runId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch flow run');
    }
    return response.json();
  },
};
