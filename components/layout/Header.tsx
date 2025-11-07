'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, User, Bug } from 'lucide-react';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

export function Header() {
  const pathname = usePathname();
  const isDebugPage = pathname?.startsWith('/debug');
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              FORTUNA
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link 
              href="/odds/basketball_nba" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                !isDebugPage ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Live Odds
            </Link>
            <Link 
              href="/debug/raw-odds" 
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                isDebugPage ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <Bug className="h-4 w-4" />
              Debug
            </Link>
          </nav>
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Connection Status (only show on live odds page) */}
          {!isDebugPage && <ConnectionStatus />}
          
          {/* User */}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">George</span>
          </button>
        </div>
      </div>
    </header>
  );
}

