const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ResearchBriefPayload {
  title: string;
  owner: string;
  tickers: string;
  brief: string;
  template_id?: string;
  status?: string;
  flow_id?: number | null;
  extra_metadata?: Record<string, unknown>;
}

export interface ResearchBriefRecord extends ResearchBriefPayload {
  id: number;
  status: string;
  flow_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export const researchBriefService = {
  async listBriefs(limit = 10): Promise<ResearchBriefRecord[]> {
    const response = await fetch(`${API_BASE_URL}/research-briefs/?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch research briefs');
    }
    return response.json();
  },

  async createBrief(data: ResearchBriefPayload): Promise<ResearchBriefRecord> {
    const response = await fetch(`${API_BASE_URL}/research-briefs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create research brief');
    }
    return response.json();
  },

  async updateBrief(id: number, data: Partial<ResearchBriefPayload>): Promise<ResearchBriefRecord> {
    const response = await fetch(`${API_BASE_URL}/research-briefs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update research brief');
    }
    return response.json();
  },
};
