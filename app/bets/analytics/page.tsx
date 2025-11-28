'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page has been consolidated into the main Analytics page
// Redirecting to /analytics for a unified experience
export default function BetsAnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/analytics');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to Analytics...</p>
      </div>
    </div>
  );
}
