'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, TrendingUp, BarChart3, Target, Home, DollarSign, Settings, Radio, Users } from 'lucide-react';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

export default function Navbar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  const navItems = [
    { href: '/', label: 'Bots', icon: Home },
    { href: '/odds/basketball_nba', label: 'Live Odds', icon: BarChart3 },
    { href: '/opportunities', label: 'Opportunities', icon: Target },
    { href: '/minerva', label: 'NBA Analytics', icon: Radio },
    { href: '/bets', label: 'Bets', icon: DollarSign },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/debug/raw-odds', label: 'Debug', icon: TrendingUp },
  ];

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand - Left */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">FORTUNA</span>
          </Link>
          
          {/* Navigation Links & Connection Status - Right */}
          <div className="flex items-center gap-1">
            {/* Navigation Links */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium
                    ${active 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* Divider */}
            <div className="h-6 w-px bg-border mx-2"></div>
            
            {/* Connection Status */}
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}

