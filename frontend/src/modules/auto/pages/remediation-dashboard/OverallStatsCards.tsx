import {
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import type { RemediationStats } from './types';
import { formatDuration } from './utils';

interface OverallStatsCardsProps {
  loading: boolean;
  remediationStats?: RemediationStats;
  stats: RemediationStats['today'];
}

export function OverallStatsCards({ loading, remediationStats, stats }: OverallStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface/30 border border-border rounded-xl p-5 hover:border-blue-500/50 transition-all">
        <div className="flex items-center justify-between flex-wrap mb-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {loading ? '...' : remediationStats?.total_policies || 0}
        </div>
        <div className="text-sm text-text-secondary">Total Policies</div>
        <div className="mt-2 text-xs text-green-400">
          {loading ? '' : `${remediationStats?.enabled_policies || 0} enabled`}
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-xl p-5 hover:border-green-500/50 transition-all">
        <div className="flex items-center justify-between flex-wrap mb-3">
          <div className="p-2.5 rounded-lg bg-green-500/10">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <span className={`text-sm font-medium ${stats.success_rate >= 80 ? 'text-green-400' : stats.success_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {stats.success_rate}%
          </span>
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {loading ? '...' : stats.total}
        </div>
        <div className="text-sm text-text-secondary">Today's Remediations</div>
        <div className="mt-2 text-xs text-text-tertiary">
          Success {stats.success} · Failed {stats.failed}
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-xl p-5 hover:border-purple-500/50 transition-all">
        <div className="flex items-center justify-between flex-wrap mb-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <Zap className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {loading ? '...' : formatDuration(stats.avg_duration_ms)}
        </div>
        <div className="text-sm text-text-secondary">Avg Execution Time</div>
        <div className="mt-2 text-xs text-text-tertiary">
          Rolled back today {stats.rolled_back}  times
        </div>
      </div>

      <div className="bg-surface/30 border border-border rounded-xl p-5 hover:border-orange-500/50 transition-all">
        <div className="flex items-center justify-between flex-wrap mb-3">
          <div className="p-2.5 rounded-lg bg-orange-500/10">
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          {remediationStats?.waiting_approval ? (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">
              Pending
            </span>
          ) : null}
        </div>
        <div className="text-3xl font-bold text-text-primary mb-1">
          {loading ? '...' : remediationStats?.waiting_approval || 0}
        </div>
        <div className="text-sm text-text-secondary">Pending Approval</div>
        <div className="mt-2 text-xs text-text-tertiary">
          Awaiting manual approval
        </div>
      </div>
    </div>
  );
}

export default OverallStatsCards;
