'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  fetchStatsSummary,
  fetchTimeSeries,
  fetchBookStats,
  fetchScalpPairs,
  fetchMiddlePairs,
  fetchOpportunityCLV,
  fetchPairPerformance,
  refreshPairPerformance,
  StatsSummary,
  TimeSeriesPoint,
  BookStats,
  BookPairSummary,
  OpportunityCLVResponse,
  PairPerformance,
} from '@/lib/analytics-api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import Navbar from '@/components/layout/Navbar';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  BarChart3, 
  RefreshCw, 
  Clock, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Layers,
  GitCompare,
  Percent,
  Filter,
  ChevronDown,
  BookOpen,
  PieChart as PieChartIcon,
  ShieldCheck,
  XCircle,
  Gauge
} from 'lucide-react';

// Color palette matching the app theme
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  orange: '#F97316',
  lime: '#84CC16',
  indigo: '#6366F1',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.purple,
  COLORS.cyan,
  COLORS.orange,
  COLORS.pink,
  COLORS.lime,
  COLORS.indigo,
];

// Format seconds to human-readable hold time (e.g., "12m 17s")
function formatHoldTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'primary',
  format = 'number'
}: {
  title: string;
  value: number | string;
  subValue?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
  format?: 'number' | 'currency' | 'percent' | 'time';
}) {
  const colorClasses = {
    primary: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    danger: 'text-red-500 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  const iconColorClasses = {
    primary: 'text-blue-500',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    purple: 'text-purple-500',
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent':
        return `${val.toFixed(2)}%`;
      case 'time':
        return val >= 60 ? `${Math.floor(val / 60)}m ${Math.floor(val % 60)}s` : `${Math.floor(val)}s`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : 
               trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${
            color === 'success' ? 'text-emerald-500' : 
            color === 'danger' ? 'text-red-500' : 'text-foreground'
          }`}>
            {formatValue(value)}
          </p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Section Header Component
function SectionHeader({ title, icon: Icon, action }: { title: string; icon: any; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// Game Status Filter Component
function GameStatusFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 text-sm bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
    >
      <option value="">All Games</option>
      <option value="upcoming">🔵 Pregame Only</option>
      <option value="live">🔴 Live Only</option>
    </select>
  );
}

// Custom Tooltip for Charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-xl p-3 min-w-[160px]">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [bookStats, setBookStats] = useState<Record<string, BookStats>>({});
  const [scalpPairs, setScalpPairs] = useState<BookPairSummary[]>([]);
  const [middlePairs, setMiddlePairs] = useState<BookPairSummary[]>([]);
  const [pairPerformance, setPairPerformance] = useState<PairPerformance[]>([]);
  const [pairRecommendations, setPairRecommendations] = useState<string[]>([]);
  const [opportunityCLV, setOpportunityCLV] = useState<OpportunityCLVResponse | null>(null);
  const [refreshingPairs, setRefreshingPairs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'pairs' | 'timing' | 'validation'>('overview');

  // Filters
  const [timeRange, setTimeRange] = useState<number>(24);
  const [selectedType, setSelectedType] = useState<string>('');
  const [gameStatusFilter, setGameStatusFilter] = useState<string>(''); // '' = all, 'live', 'upcoming'

  useEffect(() => {
    loadData();
  }, [timeRange, selectedType, gameStatusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const hoursOrDays = timeRange >= 168 ? { days: Math.floor(timeRange / 24) } : { hours: timeRange };
      const options = {
        ...hoursOrDays,
        type: selectedType || undefined,
        game_status: gameStatusFilter || undefined,
      };

      const [summaryData, timeSeriesData, bookStatsData, scalpPairsData, middlePairsData, pairPerformanceData, opportunityCLVData] = await Promise.all([
        fetchStatsSummary(options).catch(() => null),
        fetchTimeSeries(options).catch(() => ({ points: [] })),
        fetchBookStats(options).catch(() => ({})),
        fetchScalpPairs({ ...hoursOrDays, limit: 10, game_status: gameStatusFilter || undefined }).catch(() => []),
        fetchMiddlePairs({ ...hoursOrDays, limit: 10, game_status: gameStatusFilter || undefined }).catch(() => []),
        fetchPairPerformance({ limit: 20 }).catch(() => ({ pairs: [], recommendations: [] })),
        fetchOpportunityCLV({ ...hoursOrDays, timeseries: true }).catch(() => null),
      ]);

      if (summaryData) setSummary(summaryData);
      setTimeSeries(timeSeriesData.points || []);
      setBookStats(bookStatsData);
      setScalpPairs(scalpPairsData);
      setMiddlePairs(middlePairsData);
      setPairPerformance(pairPerformanceData.pairs || []);
      setPairRecommendations(pairPerformanceData.recommendations || []);
      setOpportunityCLV(opportunityCLVData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const opportunityTrendData = useMemo(() => {
    const groupedByTime: Record<string, any> = {};
    
    timeSeries.forEach(point => {
      const timestamp = new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      
      if (!groupedByTime[timestamp]) {
        groupedByTime[timestamp] = { timestamp, total: 0 };
      }
      
      groupedByTime[timestamp].total += point.opportunity_count;
      groupedByTime[timestamp][point.opportunity_type] = 
        (groupedByTime[timestamp][point.opportunity_type] || 0) + point.opportunity_count;
    });
    
    return Object.values(groupedByTime);
  }, [timeSeries]);

  const edgeDistributionData = useMemo(() => {
    return Object.entries(bookStats).map(([book, stats]) => ({
      name: book.replace(/_/g, ' ').toUpperCase(),
      avg_edge: parseFloat(stats.avg_edge_pct.toFixed(2)),
      opportunities: stats.opportunity_count,
      min_edge: stats.min_edge_pct || 0,
      max_edge: stats.max_edge_pct || 0,
    })).sort((a, b) => b.avg_edge - a.avg_edge).slice(0, 10);
  }, [bookStats]);

  const profitByBookData = useMemo(() => {
    return Object.entries(bookStats)
      .map(([book, stats]) => ({
        name: book.replace(/_/g, ' '),
        profit: parseFloat(stats.net_profit.toFixed(2)),
        roi: parseFloat(stats.roi.toFixed(2)),
        bets: stats.total_bets,
      }))
      .filter(d => d.bets > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8);
  }, [bookStats]);

  const opportunityTypeData = useMemo(() => {
    if (!summary?.by_type) return [];
    return Object.entries(summary.by_type).map(([type, stats]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: stats.opportunity_count,
      profit: stats.net_profit,
    }));
  }, [summary]);

  // Calculate key insights
  const topBook = useMemo(() => {
    const entries = Object.entries(bookStats);
    if (!entries.length) return null;
    return entries.reduce((best, [book, stats]) => 
      stats.net_profit > (best?.stats?.net_profit || -Infinity) ? { book, stats } : best,
    { book: '', stats: bookStats[entries[0][0]] });
  }, [bookStats]);

  const avgWinRate = useMemo(() => {
    const entries = Object.entries(bookStats);
    if (!entries.length) return 0;
    const totalWins = entries.reduce((sum, [_, s]) => sum + s.wins, 0);
    const totalBets = entries.reduce((sum, [_, s]) => sum + s.total_bets, 0);
    return totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
  }, [bookStats]);

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <PieChartIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Opportunity Analytics</h1>
              <p className="text-sm text-muted-foreground">Advanced insights into betting opportunities</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
            </div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
              <PieChartIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Opportunity Analytics</h1>
              <p className="text-sm text-muted-foreground">Performance insights & book analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Filter */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="appearance-none bg-card text-foreground pl-4 pr-10 py-2.5 rounded-lg border border-border hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium cursor-pointer"
              >
                <option value={1}>Last Hour</option>
                <option value={6}>Last 6 Hours</option>
                <option value={24}>Last 24 Hours</option>
                <option value={72}>Last 3 Days</option>
                <option value={168}>Last 7 Days</option>
                <option value={720}>Last 30 Days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-card text-foreground pl-4 pr-10 py-2.5 rounded-lg border border-border hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="edge">Edge</option>
                <option value="middle">Middle</option>
                <option value="scalp">Scalp</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading analytics</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-muted/50 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'books', label: 'Books', icon: BookOpen },
            { id: 'pairs', label: 'Book Pairs', icon: GitCompare },
            { id: 'timing', label: 'Timing', icon: Timer },
            { id: 'validation', label: 'Edge Validation', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Filter Bar */}
            <div className="flex items-center justify-end gap-3 mb-6 p-4 bg-card/50 border border-border rounded-lg">
              <span className="text-sm text-muted-foreground">Game Status:</span>
              <GameStatusFilter value={gameStatusFilter} onChange={setGameStatusFilter} />
            </div>

            {/* Key Metrics Grid */}
        {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                <MetricCard
                  title="Total Opportunities"
                  value={summary.total_opportunities}
                  subValue="detected"
                  icon={Target}
                  color="primary"
                />
                <MetricCard
                  title="Total Bets"
                  value={summary.total_bets}
                  subValue={`${((summary.total_bets / Math.max(summary.total_opportunities, 1)) * 100).toFixed(1)}% conversion`}
                  icon={Activity}
                  color="purple"
                />
                <MetricCard
                  title="Net Profit"
                  value={summary.net_profit}
                  format="currency"
                  icon={DollarSign}
                  color={summary.net_profit >= 0 ? 'success' : 'danger'}
                  trend={summary.net_profit >= 0 ? 'up' : 'down'}
                  trendValue={`${summary.roi >= 0 ? '+' : ''}${summary.roi.toFixed(1)}% ROI`}
                />
                <MetricCard
                  title="Win Rate"
                  value={avgWinRate}
                  format="percent"
                  icon={CheckCircle2}
                  color={avgWinRate >= 52 ? 'success' : avgWinRate >= 48 ? 'warning' : 'danger'}
                />
                <MetricCard
                  title="Avg Edge"
                  value={summary.avg_edge_pct || 0}
                  format="percent"
                  icon={TrendingUp}
                  color="primary"
                  subValue={`${summary.min_edge_pct?.toFixed(1) || 0}% - ${summary.max_edge_pct?.toFixed(1) || 0}%`}
                />
                <MetricCard
                  title="Avg CLV"
                  value={summary.avg_clv}
                  icon={Zap}
                  color={summary.avg_clv >= 0 ? 'success' : 'warning'}
                  subValue="cents advantage"
                />
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Opportunity Trend */}
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader title="Opportunity Trend" icon={Activity} />
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={opportunityTrendData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke={COLORS.primary} 
                        strokeWidth={2}
                        fill="url(#colorTotal)"
                        name="Opportunities"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Opportunity Type Distribution */}
              <div className="bg-card border border-border rounded-xl p-5">
                <SectionHeader title="Opportunity Types" icon={Layers} />
                <div className="h-[280px] flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={opportunityTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {opportunityTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Edge by Book Chart */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <SectionHeader title="Average Edge by Book (Top 10)" icon={TrendingUp} />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edgeDistributionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      width={80}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg_edge" fill={COLORS.success} radius={[0, 4, 4, 0]} name="Avg Edge %">
                      {edgeDistributionData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.avg_edge >= 5 ? COLORS.success : entry.avg_edge >= 3 ? COLORS.warning : COLORS.primary} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <>
            {/* Filter Bar */}
            <div className="flex items-center justify-end gap-3 mb-6 p-4 bg-card/50 border border-border rounded-lg">
              <span className="text-sm text-muted-foreground">Game Status:</span>
              <GameStatusFilter value={gameStatusFilter} onChange={setGameStatusFilter} />
            </div>

            {/* Profit by Book Chart */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <SectionHeader title="Net Profit by Book" icon={DollarSign} />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByBookData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="profit" radius={[4, 4, 0, 0]} name="Profit ($)">
                      {profitByBookData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.profit >= 0 ? COLORS.success : COLORS.danger} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Book Performance Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <SectionHeader title="Detailed Book Performance" icon={BarChart3} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="px-5 py-3">Book</th>
                      <th className="px-5 py-3 text-right">Live</th>
                      <th className="px-5 py-3 text-right">Pregame</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Avg Edge</th>
                      <th className="px-5 py-3 text-right">Edge Range</th>
                      <th className="px-5 py-3 text-right">Bets</th>
                      <th className="px-5 py-3 text-right">Win Rate</th>
                      <th className="px-5 py-3 text-right">ROI</th>
                      <th className="px-5 py-3 text-right">Avg CLV</th>
                      <th className="px-5 py-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {Object.entries(bookStats)
                      .sort(([, a], [, b]) => b.net_profit - a.net_profit)
                      .map(([book, stats]) => {
                        const winRate = stats.total_bets > 0 
                          ? ((stats.wins / stats.total_bets) * 100) 
                          : 0;
                        
                        return (
                          <tr key={book} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-medium text-foreground capitalize">
                                {book.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-mono text-sm text-red-500">
                                {stats.live_opportunities?.toLocaleString() || 0}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="font-mono text-sm text-blue-500">
                                {stats.pregame_opportunities?.toLocaleString() || 0}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-sm font-semibold">
                              {stats.opportunity_count.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-semibold ${
                                stats.avg_edge_pct >= 5 ? 'text-emerald-500' : 
                                stats.avg_edge_pct >= 3 ? 'text-amber-500' : 'text-blue-500'
                              }`}>
                                {stats.avg_edge_pct.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                              {stats.min_edge_pct?.toFixed(1)}% - {stats.max_edge_pct?.toFixed(1)}%
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-sm">
                              {stats.total_bets.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-semibold ${
                                winRate >= 52 ? 'text-emerald-500' : 
                                winRate >= 48 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-semibold ${
                                stats.roi >= 0 ? 'text-emerald-500' : 'text-red-500'
                              }`}>
                                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-medium ${
                                stats.avg_clv >= 2 ? 'text-emerald-500' : 
                                stats.avg_clv >= 0 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {stats.avg_clv >= 0 ? '+' : ''}{stats.avg_clv.toFixed(2)}¢
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-bold ${
                                stats.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                              }`}>
                                {stats.net_profit >= 0 ? '+' : ''}${stats.net_profit.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Book Pairs Tab */}
        {activeTab === 'pairs' && (
          <>
            {/* Filter Bar */}
            <div className="flex items-center justify-end gap-3 mb-6 p-4 bg-card/50 border border-border rounded-lg">
              <span className="text-sm text-muted-foreground">Game Status:</span>
              <GameStatusFilter value={gameStatusFilter} onChange={setGameStatusFilter} />
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Scalp Pairs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border bg-gradient-to-r from-emerald-500/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <GitCompare className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Best Scalp Pairs</h3>
                    <p className="text-xs text-muted-foreground">Top book combinations for scalp opportunities</p>
                  </div>
                </div>
              </div>
              
              {scalpPairs.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {scalpPairs.map((pair, index) => (
                    <div key={index} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">#{index + 1}</span>
                          <span className="font-medium text-foreground capitalize">
                            {pair.book_key_1.replace(/_/g, ' ')}
                          </span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-medium text-foreground capitalize">
                            {pair.book_key_2.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pair.live_opportunities > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium" title="Live opportunities">
                              {pair.live_opportunities} live
                            </span>
                          )}
                          {pair.pregame_opportunities > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium" title="Pregame opportunities">
                              {pair.pregame_opportunities} pregame
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium" title="Total opportunities">
                            {pair.total_opportunities} total
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Avg Edge</span>
                          <p className="font-semibold text-emerald-500">{pair.avg_edge_pct.toFixed(2)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Best Edge</span>
                          <p className="font-semibold text-foreground">{pair.best_edge_pct.toFixed(2)}%</p>
                        </div>
                        <div 
                          className="cursor-help"
                          title={`Min: ${formatHoldTime(pair.min_hold_time_seconds || 0)} | Max: ${formatHoldTime(pair.max_hold_time_seconds || 0)}`}
                        >
                          <span className="text-muted-foreground">Hold Time</span>
                          <p className="font-semibold text-amber-500">{formatHoldTime(pair.avg_hold_time_seconds || 0)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI</span>
                          <p className={`font-semibold ${pair.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pair.roi >= 0 ? '+' : ''}{pair.roi.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit</span>
                          <p className={`font-semibold ${pair.total_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ${pair.total_profit.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <GitCompare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No scalp pair data available for this time period</p>
                </div>
              )}
            </div>

            {/* Best Middle Pairs */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border bg-gradient-to-r from-purple-500/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Layers className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Best Middle Pairs</h3>
                    <p className="text-xs text-muted-foreground">Top book combinations for middle opportunities</p>
                  </div>
                </div>
              </div>
              
              {middlePairs.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {middlePairs.map((pair, index) => (
                    <div key={index} className="p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">#{index + 1}</span>
                          <span className="font-medium text-foreground capitalize">
                            {pair.book_key_1.replace(/_/g, ' ')}
                          </span>
                          <span className="text-muted-foreground">×</span>
                          <span className="font-medium text-foreground capitalize">
                            {pair.book_key_2.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pair.live_opportunities > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium" title="Live opportunities">
                              {pair.live_opportunities} live
                            </span>
                          )}
                          {pair.pregame_opportunities > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium" title="Pregame opportunities">
                              {pair.pregame_opportunities} pregame
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium" title="Total opportunities">
                            {pair.total_opportunities} total
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Avg Edge</span>
                          <p className="font-semibold text-purple-500">{pair.avg_edge_pct.toFixed(2)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Best Edge</span>
                          <p className="font-semibold text-foreground">{pair.best_edge_pct.toFixed(2)}%</p>
                        </div>
                        <div 
                          className="cursor-help"
                          title={`Min: ${formatHoldTime(pair.min_hold_time_seconds || 0)} | Max: ${formatHoldTime(pair.max_hold_time_seconds || 0)}`}
                        >
                          <span className="text-muted-foreground">Hold Time</span>
                          <p className="font-semibold text-amber-500">{formatHoldTime(pair.avg_hold_time_seconds || 0)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ROI</span>
                          <p className={`font-semibold ${pair.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {pair.roi >= 0 ? '+' : ''}{pair.roi.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Profit</span>
                          <p className={`font-semibold ${pair.total_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ${pair.total_profit.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No middle pair data available for this time period</p>
                </div>
              )}
            </div>

            {/* Pair Performance - Handle, Profit, ROI */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border bg-gradient-to-r from-amber-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Pair Performance (Volume & ROI)</h3>
                      <p className="text-xs text-muted-foreground">Historical handle, profit, and ROI per book pair</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setRefreshingPairs(true);
                      try {
                        await refreshPairPerformance();
                        const data = await fetchPairPerformance({ limit: 20 });
                        setPairPerformance(data.pairs || []);
                        setPairRecommendations(data.recommendations || []);
                      } catch (err) {
                        console.error('Failed to refresh pair performance:', err);
                      } finally {
                        setRefreshingPairs(false);
                      }
                    }}
                    disabled={refreshingPairs}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${refreshingPairs ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Recommendations */}
              {pairRecommendations.length > 0 && (
                <div className="p-4 border-b border-border bg-muted/20">
                  <div className="flex flex-wrap gap-2">
                    {pairRecommendations.map((rec, index) => (
                      <span key={index} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pairPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-3">Pair</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Handle</th>
                        <th className="px-4 py-3 text-right">Profit</th>
                        <th className="px-4 py-3 text-right">ROI</th>
                        <th className="px-4 py-3 text-right">Bets</th>
                        <th className="px-4 py-3 text-right">W/L/P</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pairPerformance.map((pair, index) => {
                        const roi = pair.roi_pct;
                        const bets = pair.total_bets_placed;
                        let action = { icon: '🟡', text: 'New', color: 'text-amber-500' };
                        
                        if (bets >= 5) {
                          if (roi >= 3) {
                            action = { icon: '🟢', text: 'Push', color: 'text-emerald-500' };
                          } else if (roi >= 0) {
                            action = { icon: '🟡', text: 'Hold', color: 'text-amber-500' };
                          } else {
                            action = { icon: '🔴', text: 'Watch', color: 'text-red-500' };
                          }
                        }
                        
                        return (
                          <tr key={index} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-medium text-foreground capitalize text-sm">
                                {pair.book_key_1.replace(/_/g, ' ')} × {pair.book_key_2.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                pair.opportunity_type === 'scalp' 
                                  ? 'bg-emerald-500/10 text-emerald-500' 
                                  : 'bg-purple-500/10 text-purple-500'
                              }`}>
                                {pair.opportunity_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm">
                              ${pair.total_handle.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-semibold ${pair.realized_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {pair.realized_profit >= 0 ? '+' : ''}${pair.realized_profit.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-semibold ${roi >= 3 ? 'text-emerald-500' : roi >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm">
                              {bets}
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                              <span className="text-emerald-500">{pair.win_count}W</span>
                              <span className="mx-1">/</span>
                              <span className="text-red-500">{pair.loss_count}L</span>
                              <span className="mx-1">/</span>
                              <span className="text-amber-500">{pair.pending_count}P</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-medium ${action.color}`}>
                                {action.icon} {action.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pair performance data available yet</p>
                  <p className="text-xs mt-1">Place scalp/middle bets to start tracking</p>
                </div>
              )}
            </div>

            {/* Book Pair Insights */}
            <div className="lg:col-span-2 bg-gradient-to-r from-blue-500/5 via-card to-purple-500/5 border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Understanding Book Pairs</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Scalps</strong> involve betting both sides of a market across two books where the combined odds guarantee a profit. 
                    The best scalp pairs show which book combinations most frequently offer these risk-free opportunities.
                    <br /><br />
                    <strong className="text-foreground">Middles</strong> occur when you can bet both sides and potentially win both if the final score lands between the two lines.
                    Higher edge pairs indicate more frequent middle opportunities with better expected value.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {/* Timing Tab */}
        {activeTab === 'timing' && (
          <>
            {/* Filter Bar */}
            <div className="flex items-center justify-end gap-3 mb-6 p-4 bg-card/50 border border-border rounded-lg">
              <span className="text-sm text-muted-foreground">Game Status:</span>
              <GameStatusFilter value={gameStatusFilter} onChange={setGameStatusFilter} />
            </div>

            {/* Timing Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Avg Hold Time"
                value={summary?.avg_hold_time_seconds || 0}
                format="time"
                icon={Clock}
                color="primary"
                subValue="opportunity lifespan"
              />
              <MetricCard
                title="Execution Rate"
                value={(summary?.execution_rate || 0) * 100}
                format="percent"
                icon={Zap}
                color={summary?.execution_rate && summary.execution_rate >= 0.5 ? 'success' : 'warning'}
                subValue="opportunities acted on"
              />
              <MetricCard
                title="Opps per Minute"
                value={summary?.opps_per_minute?.toFixed(2) || '0'}
                icon={Activity}
                color="purple"
                subValue="detection rate"
              />
              <MetricCard
                title="Peak Detection"
                value={opportunityTrendData.reduce((max, p) => Math.max(max, p.total || 0), 0)}
                icon={TrendingUp}
                color="primary"
                subValue="in single interval"
              />
            </div>

            {/* Opportunity Activity Over Time */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <SectionHeader title="Opportunity Detection Timeline" icon={Activity} />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={opportunityTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
              <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="edge" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      dot={false}
                      name="Edge"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="scalp" 
                      stroke={COLORS.success} 
                      strokeWidth={2}
                      dot={false}
                      name="Scalp"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="middle" 
                      stroke={COLORS.purple} 
                      strokeWidth={2}
                      dot={false}
                      name="Middle"
                    />
            </LineChart>
          </ResponsiveContainer>
        </div>
            </div>

            {/* Timing Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Optimal Windows</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Most profitable opportunities appear within 30 minutes of game start. Monitor closely during this window.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Timer className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Hold Time Impact</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Shorter hold times indicate faster-moving markets. Books with longer hold times may be slower to update.
                </p>
        </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Execution Speed</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Higher execution rates correlate with better outcomes. Aim to act on opportunities within 15 seconds.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Edge Validation Tab */}
        {activeTab === 'validation' && (
          <>
            {/* Edge Validation Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-card to-emerald-500/10 border border-border rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <ShieldCheck className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Edge Detector Validation</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Validates whether detected opportunities are <strong className="text-foreground">real edges</strong> by comparing the price when detected to the closing line.
                    Positive CLV means the detected price beat the closing line — the edge was real.
                  </p>
                  {opportunityCLV?.opportunity_clv?.message && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                      opportunityCLV.opportunity_clv.summary?.edge_accuracy >= 70 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : opportunityCLV.opportunity_clv.summary?.edge_accuracy >= 50
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {opportunityCLV.opportunity_clv.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edge Validation Metrics */}
            {opportunityCLV?.opportunity_clv?.summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
                <MetricCard
                  title="Edge Accuracy"
                  value={opportunityCLV.opportunity_clv.summary.edge_accuracy || 0}
                  format="percent"
                  icon={Gauge}
                  color={opportunityCLV.opportunity_clv.summary.edge_accuracy >= 70 ? 'success' : opportunityCLV.opportunity_clv.summary.edge_accuracy >= 50 ? 'warning' : 'danger'}
                  subValue="edges that held value"
                />
                <MetricCard
                  title="Avg Opportunity CLV"
                  value={(opportunityCLV.opportunity_clv.summary.avg_clv || 0).toFixed(2)}
                  icon={Zap}
                  color={opportunityCLV.opportunity_clv.summary.avg_clv >= 0 ? 'success' : 'danger'}
                  subValue="cents vs closing"
                />
                <MetricCard
                  title="Total Validated"
                  value={opportunityCLV.opportunity_clv.summary.total_opportunities || 0}
                  icon={Target}
                  color="primary"
                  subValue="opportunities with CLV"
                />
                <MetricCard
                  title="Positive CLV"
                  value={opportunityCLV.opportunity_clv.summary.positive_clv_count || 0}
                  icon={CheckCircle2}
                  color="success"
                  subValue="real edges found"
                />
                <MetricCard
                  title="Negative CLV"
                  value={opportunityCLV.opportunity_clv.summary.negative_clv_count || 0}
                  icon={XCircle}
                  color="danger"
                  subValue="edges evaporated"
                />
                <MetricCard
                  title="Avg Edge Decay"
                  value={((opportunityCLV.opportunity_clv.summary.avg_edge_decay || 0) * 100).toFixed(2)}
                  format="percent"
                  icon={TrendingDown}
                  color="warning"
                  subValue="edge loss by close"
                />
              </div>
            )}

            {/* CLV by Book */}
            {opportunityCLV?.opportunity_clv?.summary?.by_book && Object.keys(opportunityCLV.opportunity_clv.summary.by_book).length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
                <div className="p-5 border-b border-border">
                  <SectionHeader title="Edge Accuracy by Book" icon={BookOpen} />
                </div>
          <div className="overflow-x-auto">
            <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-5 py-3">Book</th>
                        <th className="px-5 py-3 text-right">Opportunities</th>
                        <th className="px-5 py-3 text-right">Avg CLV</th>
                        <th className="px-5 py-3 text-right">Edge Accuracy</th>
                        <th className="px-5 py-3 text-right">Positive</th>
                        <th className="px-5 py-3 text-right">Negative</th>
                        <th className="px-5 py-3 text-right">Avg Edge at Detection</th>
                </tr>
              </thead>
                    <tbody className="divide-y divide-border/50">
                      {Object.entries(opportunityCLV.opportunity_clv.summary.by_book)
                        .sort(([, a], [, b]) => b.avg_clv - a.avg_clv)
                        .map(([book, stats]) => (
                          <tr key={book} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-medium text-foreground capitalize">
                                {book.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-sm">
                              {stats.total_opportunities.toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-semibold ${
                                stats.avg_clv >= 2 ? 'text-emerald-500' : 
                                stats.avg_clv >= 0 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {stats.avg_clv >= 0 ? '+' : ''}{stats.avg_clv.toFixed(2)}¢
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`font-semibold ${
                                stats.edge_accuracy >= 70 ? 'text-emerald-500' : 
                                stats.edge_accuracy >= 50 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {stats.edge_accuracy.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right text-emerald-500 font-medium">
                              {stats.positive_clv_count}
                            </td>
                            <td className="px-5 py-4 text-right text-red-500 font-medium">
                              {stats.negative_clv_count}
                      </td>
                            <td className="px-5 py-4 text-right text-muted-foreground">
                              {stats.avg_edge_at_detection.toFixed(2)}%
                      </td>
                    </tr>
                        ))}
              </tbody>
            </table>
          </div>
        </div>
            )}

            {/* CLV by Opportunity Type */}
            {opportunityCLV?.opportunity_clv?.summary?.by_type && Object.keys(opportunityCLV.opportunity_clv.summary.by_type).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {Object.entries(opportunityCLV.opportunity_clv.summary.by_type).map(([type, stats]) => (
                  <div key={type} className={`bg-card border rounded-xl p-5 ${
                    type === 'edge' ? 'border-blue-500/30' : 
                    type === 'scalp' ? 'border-emerald-500/30' : 'border-purple-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          type === 'edge' ? 'bg-blue-500/10' : 
                          type === 'scalp' ? 'bg-emerald-500/10' : 'bg-purple-500/10'
                        }`}>
                          {type === 'edge' ? <TrendingUp className="w-4 h-4 text-blue-500" /> :
                           type === 'scalp' ? <GitCompare className="w-4 h-4 text-emerald-500" /> :
                           <Layers className="w-4 h-4 text-purple-500" />}
                        </div>
                        <span className="font-semibold text-foreground capitalize">{type}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        stats.edge_accuracy >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                        stats.edge_accuracy >= 50 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {stats.edge_accuracy.toFixed(0)}% accurate
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Avg CLV</p>
                        <p className={`text-lg font-bold ${stats.avg_clv >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {stats.avg_clv >= 0 ? '+' : ''}{stats.avg_clv.toFixed(2)}¢
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Opportunities</p>
                        <p className="text-lg font-bold text-foreground">{stats.total_opportunities}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Real Edges</p>
                        <p className="text-lg font-bold text-emerald-500">{stats.positive_clv_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">False Positives</p>
                        <p className="text-lg font-bold text-red-500">{stats.negative_clv_count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Data State */}
            {(!opportunityCLV || !opportunityCLV.opportunity_clv?.summary?.total_opportunities) && (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Validation Data Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Opportunity CLV data is calculated when games go live. Make sure the CLV Calculator service is running and games have completed.
                </p>
              </div>
            )}

            {/* Validation Explanation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Gauge className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Edge Accuracy</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Percentage of detected opportunities where the CLV was positive. &gt;70% indicates a reliable edge detector.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Zap className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Opportunity CLV</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Measures how much value you gained by detecting the opportunity early. Positive = you found real edges.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <TrendingDown className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="font-semibold text-sm">Edge Decay</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  How much the detected edge decreases by game time. Lower decay means edges hold longer.
                </p>
        </div>
      </div>
    </>
        )}

        {/* Quick Insights Footer */}
        {summary && topBook && (
          <div className="mt-6 bg-gradient-to-r from-primary/5 via-card to-purple-500/5 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Quick Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Top performing book: <span className="text-foreground font-medium capitalize">{topBook.book.replace(/_/g, ' ')}</span> with{' '}
                  <span className="text-emerald-500 font-medium">${topBook.stats.net_profit.toFixed(2)}</span> profit
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Detected <span className="text-foreground font-medium">{summary.total_opportunities.toLocaleString()}</span> opportunities in selected period
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Average edge: <span className="text-foreground font-medium">{(summary.avg_edge_pct || 0).toFixed(2)}%</span> with{' '}
                  <span className="text-foreground font-medium">{(summary.median_edge_pct || 0).toFixed(2)}%</span> median
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
