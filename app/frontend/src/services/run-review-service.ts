const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface RunReviewPayload {
  review_status: string;
  reviewer?: string;
  notes?: string;
  decision?: string;
  extra_metadata?: Record<string, unknown>;
}

export interface RunReviewRecord extends RunReviewPayload {
  id: number;
  run_id: number;
  created_at: string;
  updated_at?: string | null;
}

export const runReviewService = {
  async getReview(runId: number): Promise<RunReviewRecord | null> {
    const response = await fetch(`${API_BASE_URL}/run-reviews/${runId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch run review');
    }
    return response.json();
  },

  async saveReview(runId: number, data: RunReviewPayload): Promise<RunReviewRecord> {
    const response = await fetch(`${API_BASE_URL}/run-reviews/${runId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save run review');
    }
    return response.json();
  },
};
