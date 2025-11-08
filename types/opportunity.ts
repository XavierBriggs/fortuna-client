// Opportunity types for I2
export type OpportunityType = 'edge' | 'middle' | 'scalp';

export interface OpportunityLeg {
  book_key: string;
  outcome_name: string;
  price: number;
  point?: number;
  leg_edge_pct?: number;
}

export interface Opportunity {
  id: number;
  opportunity_type: OpportunityType;
  sport_key: string;
  event_id: string;
  market_key: string;
  edge_pct: number;
  fair_price?: number;
  detected_at: string;
  data_age_seconds: number;
  legs: OpportunityLeg[];
  event_name?: string;
  home_team?: string;
  away_team?: string;
}

export interface OpportunityAction {
  id?: number;
  opportunity_id: number;
  action_type: 'taken' | 'dismissed' | 'noted';
  operator: string;
  notes?: string;
  action_time?: string;
}

