import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-background via-background to-card">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Activity className="h-16 w-16 text-primary" />
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            FORTUNA
          </h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-12">
          Real-Time Odds Intelligence
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Opportunities Card */}
          <Link 
            href="/opportunities"
            className="group relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2 text-primary">Opportunities</h2>
            <p className="text-sm text-muted-foreground mb-4">Edge Detection</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              I2 Live
            </div>
          </Link>

          {/* NBA Card */}
          <Link 
            href="/odds/basketball_nba"
            className="group relative overflow-hidden rounded-xl border-2 border-border hover:border-primary bg-card p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20"
          >
            <div className="text-6xl mb-4">🏀</div>
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">NBA</h2>
            <p className="text-sm text-muted-foreground mb-4">Basketball</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Active
            </div>
          </Link>
          
          {/* NFL Card */}
          <div className="relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 opacity-50 cursor-not-allowed">
            <div className="text-6xl mb-4">🏈</div>
            <h2 className="text-2xl font-bold mb-2">NFL</h2>
            <p className="text-sm text-muted-foreground mb-4">Football</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
              Coming v1
            </div>
          </div>
          
          {/* MLB Card */}
          <div className="relative overflow-hidden rounded-xl border-2 border-border bg-card p-8 opacity-50 cursor-not-allowed">
            <div className="text-6xl mb-4">⚾</div>
            <h2 className="text-2xl font-bold mb-2">MLB</h2>
            <p className="text-sm text-muted-foreground mb-4">Baseball</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-semibold">
              Coming v1
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-muted-foreground">
          Last Update: <span className="text-foreground font-semibold">Live</span> • 
          <span className="mx-2">•</span>
          System Status: <span className="text-fresh font-semibold">Operational</span>
        </div>
      </div>
    </main>
  );
}


