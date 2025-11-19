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
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand - Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Activity className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-primary/20 group-hover:ring-primary/40 transition-all" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                FORTUNA
              </span>
            </Link>
          </div>

          {/* Navigation Links & Connection Status - Right */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                      ${active
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    {item.label}
                    {active && (
                      <span className="absolute inset-x-0 -bottom-[17px] h-[2px] bg-primary shadow-[0_0_10px_var(--primary)]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="hidden md:block h-6 w-px bg-white/10 mx-2"></div>

            {/* Connection Status */}
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </nav>
  );
}

