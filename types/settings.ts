export interface UserSettings {
  id: number;
  user_id: string;
  bankrolls: Record<string, number>;  // { "fanduel": 5000, "draftkings": 3000, ... }
  kelly_fraction: number;              // 0.25 = 1/4 Kelly
  min_edge_threshold: number;          // 1.0 = 1%
  max_stake_pct: number;               // 10.0 = 10%
  created_at: string;
  updated_at: string;
}

export interface UserSettingsUpdate {
  bankrolls: Record<string, number>;
  kelly_fraction: number;
  min_edge_threshold: number;
  max_stake_pct: number;
}




