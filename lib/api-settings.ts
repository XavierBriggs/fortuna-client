import { UserSettings, UserSettingsUpdate } from '@/types/settings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1';

export async function getSettings(): Promise<UserSettings> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSettings(update: UserSettingsUpdate): Promise<{ status: string; settings: UserSettings }> {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(update),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to update settings: ${response.statusText}`);
  }

  return response.json();
}


