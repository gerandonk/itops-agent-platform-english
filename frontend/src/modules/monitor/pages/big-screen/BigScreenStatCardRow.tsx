/**
 * BigScreenDashboard - 顶部 StatCard 4 列（2026-07-21 拆分）
 *
 * 从原 BigScreenDashboard.tsx L564-597 抽出
 * 4 个 StatCard + 4 个 SLA mini-card：服务器 / Agent / 任务 / 告警
 *
 * 拆分原则遵循 architecture.md §3.4.1 + 第 3 条「向后兼容的 import 路径」
 */
import { Server, Bot, Play, Bell, Clock, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { StatCard } from './BigScreenStatCard';
import type { DashboardStats, SlaStats } from './types';

export interface BigScreenStatCardRowProps {
  stats: DashboardStats | null | undefined;
  slaStats: SlaStats | null | undefined;
  onNavigate: (path: string) => void;
}

export default function BigScreenStatCardRow({
  stats,
  slaStats,
  onNavigate,
}: BigScreenStatCardRowProps) {
  return (
    <>
      {/* 4 个 StatCard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={Server}
          label="Server"
          value={`${stats?.servers.enabled || 0}/${stats?.servers.total || 0}`}
          subValue="Enabled / total"
          color={{ bg: 'bg-purple-500/15', fg: 'text-purple-400' }}
          onClick={() => onNavigate('/servers')}
        />
        <StatCard
          icon={Bot}
          label="Agent"
          value={`${stats?.agents.enabled || 0}/${stats?.agents.total || 0}`}
          subValue="Online / total"
          color={{ bg: 'bg-blue-500/15', fg: 'text-blue-400' }}
          onClick={() => onNavigate('/agents')}
        />
        <StatCard
          icon={Play}
          label="Task success rate"
          value={`${stats?.tasks.successRate || 0}%`}
          subValue={`Completed ${stats?.tasks.completed || 0} / Total ${stats?.tasks.total || 0}`}
          color={{ bg: 'bg-green-500/15', fg: 'text-green-400' }}
          onClick={() => onNavigate('/tasks')}
        />
        <StatCard
          icon={Bell}
          label="Active alerts"
          value={stats?.alerts.active || 0}
          subValue={`Critical ${stats?.alerts.critical || 0} / High ${stats?.alerts.high || 0}`}
          color={{ bg: 'bg-red-500/15', fg: 'text-red-400' }}
          onClick={() => onNavigate('/alerts')}
        />
      </div>

      {/* 4 个 SLA mini-card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-text-secondary">MTTR (Mean Time to Repair)</span>
          </div>
          <div className="text-xl font-bold text-text-primary">
            {slaStats?.mttr_minutes ? `${slaStats.mttr_minutes} min` : '--'}
          </div>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-text-secondary">System Availability</span>
          </div>
          <div className="text-xl font-bold text-text-primary">
            {slaStats?.uptime_percentage ? `${slaStats.uptime_percentage}%` : '--'}
          </div>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-text-secondary">Alert Response Time</span>
          </div>
          <div className="text-xl font-bold text-text-primary">
            {slaStats?.avg_response_seconds ? `${slaStats.avg_response_seconds} s` : '--'}
          </div>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-text-secondary">Today's Alert Resolution Rate</span>
          </div>
          <div className="text-xl font-bold text-text-primary">
            {slaStats?.alert_resolution_rate ? `${slaStats.alert_resolution_rate}%` : '--'}
          </div>
        </div>
      </div>
    </>
  );
}
