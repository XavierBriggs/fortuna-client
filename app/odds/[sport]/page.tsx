'use client';

import Navbar from '@/components/layout/Navbar';
import { FilterBar } from '@/components/layout/FilterBar';
import { OddsTable } from '@/components/odds-table/OddsTable';
import { TopEdgesSidebar } from '@/components/layout/TopEdgesSidebar';
import { useOddsStore } from '@/lib/stores/odds-store';
import { useAlerts } from '@/hooks/useAlerts';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function OddsPage() {
  const params = useParams();
  const sport = params?.sport as string || 'basketball_nba';
  const setFilters = useOddsStore((state) => state.setFilters);
  
  // Enable alerts
  useAlerts({
    minEdge: 0,           // Any +EV
    maxDataAge: 10,       // Fresh data only
    enableInApp: true,    // Show in sidebar
    enableSlack: true,    // Send to Slack if configured
    enableBrowser: false, // Browser notifications disabled by default
  });
  
  // Set sport filter on mount
  useEffect(() => {
    setFilters({ sport });
  }, [sport, setFilters]);
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FilterBar />
      
      <div className="container px-4 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1">
            <OddsTable />
          </div>
          
          {/* Sidebar */}
          <div className="w-80 shrink-0">
            <TopEdgesSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

