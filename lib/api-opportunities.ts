import { Opportunity, OpportunityAction } from '@/types/opportunity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface GetOpportunitiesParams {
  type?: string;
  sport?: string;
  since?: string;
  limit?: number;
  offset?: number;
}

export async function getOpportunities(params: GetOpportunitiesParams = {}): Promise<Opportunity[]> {
  const queryParams = new URLSearchParams();
  
  if (params.type) queryParams.append('type', params.type);
  if (params.sport) queryParams.append('sport', params.sport);
  if (params.since) queryParams.append('since', params.since);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const url = `${API_BASE_URL}/api/v1/opportunities?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
  }

  const data = await response.json();
  return data.opportunities || [];
}

export async function getOpportunity(id: number): Promise<Opportunity> {
  const url = `${API_BASE_URL}/api/v1/opportunities/${id}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunity: ${response.statusText}`);
  }

  return response.json();
}

export async function createOpportunityAction(
  opportunityId: number,
  action: Omit<OpportunityAction, 'id' | 'opportunity_id' | 'action_time'>
): Promise<OpportunityAction> {
  const url = `${API_BASE_URL}/api/v1/opportunities/${opportunityId}/actions`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    throw new Error(`Failed to create action: ${response.statusText}`);
  }

  return response.json();
}

