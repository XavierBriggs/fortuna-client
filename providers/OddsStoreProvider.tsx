'use client';

import { ReactNode } from 'react';

// This is a simple wrapper to ensure Zustand store is available
// Zustand doesn't require a provider, but we include this for consistency
export function OddsStoreProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}






