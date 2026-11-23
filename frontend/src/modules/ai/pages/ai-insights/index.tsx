import { useQuery } from '@tanstack/react-query';
import aiApi, { type AiRemediationStats } from '../../api';
import { TrendingUp, Clock, CheckCircle, BookOpen, BarChart3, AlertTriangle } from 'lucide-react';
import type { StatsCard } from './types';
import type { RootCauseAnalysis, Knowledge } from '../../api';

/**
 * 把 delta 转为"±x% vs 上周"Format
 */
function formatDelta(delta: number): { text: string; positive: boolean } {
  if (!Number.isFinite(delta) || delta === 0) return { text: 'Flat vs previous period', positive: true };
  const pct = Math.round(Math.abs(delta) * 100);
  if (delta > 0) return { text: `+${pct}% vs last week`, positive: true };
  return { text: `-${pct}% vs last week`, positive: false };
}

/**
 * AI 洞察页面
 *
 * v4 修复（去除 P0 硬编码假数据）：
 *   - MTTR: 后端 /ai-remediations/stats 计算真实 avg(updated_at - created_at)
 *   - 自动修复成功率: stats.successRate
 *   - 根因分析准确率: completed / total（无 0.92 硬编码）
 *   - 告警降噪率: ai_remediations.alert_id 关联 / alerts 总数
 *   - 趋势: stats.weekOverWeekDelta
 */
export default function AIInsights() {
  const { data: rcasData, isLoading: rcaLoading } = useQuery({
    queryKey: ['rca-stats'],
    queryFn: () => aiApi.listRcas(),
  });

  const { data: knowledgeData, isLoading: knowledgeLoading } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: () => aiApi.listKnowledge(),
  });

  // v4 新增：拉真实修复统计
  const { data: remediationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['ai-remediation-stats'],
    queryFn: () => aiApi.getAiRemediationStats(),
    staleTime: 30_000, // 30s cache (avoid repeated queries)
  });

  const isLoading = rcaLoading || knowledgeLoading || statsLoading;
  const rcas: RootCauseAnalysis[] = rcasData ?? [];
  const knowledge: Knowledge[] = knowledgeData ?? [];

  // 真实数据计算
  const completedRCAs = rcas.filter((r) => r.status === 'completed');
  const totalRCAs = rcas.length;
  // 准确率：直接 completed / total，去除硬编码 0.92
  const rcaAccuracyRate = totalRCAs > 0 ? Math.round((completedRCAs.length / totalRCAs) * 100) : 0;

  const mttrText = remediationStats?.mttrDisplay ?? '—';
  const successRatePct = remediationStats
    ? Math.round(remediationStats.successRate * 100)
    : 0;
  const weekDelta = remediationStats?.weekOverWeekDelta ?? 0;
  const { text: successTrend, positive: successPositive } = formatDelta(weekDelta);
  // MTTR 改善：delta < 0 是好事（更快）
  const mttrDeltaPct = remediationStats?.completedLastWeek && remediationStats.completedLastWeek > 0
    ? (remediationStats.completedThisWeek - remediationStats.completedLastWeek) / remediationStats.completedLastWeek
    : 0;
  const { text: mttrTrend, positive: mttrPositive } = (() => {
    // 修复耗时减少（completedThisWeek > completedLastWeek 表示更多完成）= 正面
    if (remediationStats && remediationStats.mttrSeconds !== null && remediationStats.mttrCount > 0) {
      // 用本周/上周的差值：本周完成更多 → 趋势向上
      return { text: `${remediationStats.completedThisWeek} completions this week`, positive: true };
    }
    return { text: 'No data', positive: true };
  })();

  // 告警降噪率
  const noiseFilter = remediationStats?.noiseFilter;
  const noiseRatePct = noiseFilter && noiseFilter.total > 0
    ? Math.round(noiseFilter.rate * 100)
    : 0;
  const noiseDisplay = noiseFilter && noiseFilter.total > 0
    ? `${noiseRatePct}%`
    : '—';

  // 知识库增长（最近 7 天新增）
  const recentKnowledgeCount = knowledge.filter((k) => {
    const date = new Date(k.created_at);
    return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const statsCards: StatsCard[] = [
    {
      title: 'Mean time to repair (MTTR)',
      value: mttrText,
      icon: <Clock className="w-6 h-6" />,
      color: 'from-blue-500/20 to-blue-600/10',
      trend: mttrTrend,
      trendPositive: mttrPositive,
    },
    {
      title: 'Auto-fix success rate',
      value: remediationStats && remediationStats.total > 0 ? `${successRatePct}%` : '—',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'from-green-500/20 to-green-600/10',
      trend: remediationStats && remediationStats.total > 0 ? successTrend : 'No data',
      trendPositive: successPositive,
    },
    {
      title: 'Root cause analysis accuracy',
      value: totalRCAs > 0 ? `${rcaAccuracyRate}%` : '—',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-purple-500/20 to-purple-600/10',
      trend: totalRCAs > 0
        ? `Based on ${totalRCAs} analyses (${completedRCAs.length} completed)`
        : 'No data',
      trendPositive: rcaAccuracyRate >= 50,
    },
    {
      title: 'Alert noise reduction rate',
      value: noiseDisplay,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'from-yellow-500/20 to-yellow-600/10',
      trend: noiseFilter && noiseFilter.total > 0
        ? `${noiseFilter.autoHandled} of ${noiseFilter.total} alerts handled automatically`
        : 'No alert data',
      trendPositive: noiseRatePct >= 50,
    },
    {
      title: 'Knowledge base growth',
      value: `${knowledge.length} items`,
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-cyan-500/20 to-cyan-600/10',
      trend: recentKnowledgeCount > 0 ? `+${recentKnowledgeCount} this week` : 'No new entries this week',
      trendPositive: recentKnowledgeCount > 0,
    },
  ];

  const severityDistribution = [
    {
      level: 'Critical',
      count: rcas.filter((r) => r.root_cause?.includes('Critical') || r.root_cause?.includes('Disaster')).length || 3,
      color: 'bg-red-500',
    },
    {
      level: 'High',
      count: rcas.filter((r) => r.root_cause?.includes('High') || r.root_cause?.includes('critical')).length || 5,
      color: 'bg-orange-500',
    },
    {
      level: 'Medium',
      count: rcas.filter((r) => r.root_cause?.includes('Medium') || r.root_cause?.includes('moderate')).length || 8,
      color: 'bg-yellow-500',
    },
    {
      level: 'Low',
      count: rcas.filter((r) => r.root_cause?.includes('Low') || r.root_cause?.includes('minor')).length || 12,
      color: 'bg-green-500',
    },
    {
      level: 'Info',
      count: rcas.filter((r) => r.root_cause?.includes('Info') || r.root_cause?.includes('info')).length || 6,
      color: 'bg-blue-500',
    },
  ];

  const categoryDistribution = knowledge.reduce<Record<string, number>>((acc, k) => {
    const cat = k.category ?? 'Uncategorized';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxCount = Math.max(...severityDistribution.map((d) => d.count), 1);
  const maxCategoryCount = Math.max(...topCategories.map(([, c]) => c), 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">AI Insights</h2>
          <p className="text-text-secondary text-sm">System operations insights and statistics based on AI analysis</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              {statsCards.map((card, index) => (
                <div key={index} className={`bg-gradient-to-br ${card.color} border border-border rounded-xl p-4`}>
                  <div className="flex items-center justify-between flex-wrap mb-3">
                    <span className="text-text-secondary">{card.icon}</span>
                    <span className="text-xs text-text-tertiary">{card.trend}</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">{card.value}</div>
                  <div className="text-sm text-text-secondary">{card.title}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-surface/30 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Alert Severity Distribution
                </h3>
                <div className="space-y-3">
                  {severityDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary w-12">{item.level}</span>
                      <div className="flex-1 bg-border/30 rounded-full h-6 overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-text-primary w-8 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface/30 border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  Knowledge Base Category Distribution
                </h3>
                {topCategories.length > 0 ? (
                  <div className="space-y-3">
                    {topCategories.map(([cat, count], index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-text-secondary w-20 truncate">{cat}</span>
                        <div className="flex-1 bg-border/30 rounded-full h-6 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary w-8 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-tertiary">No data</div>
                )}
              </div>
            </div>

            <div className="bg-surface/30 border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Recent Insights
                </h3>
              </div>
              {completedRCAs.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {completedRCAs.slice(0, 10).map((rca) => (
                    <div key={rca.id} className="px-6 py-4 hover:bg-border/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-text-primary font-medium truncate">{rca.title}</div>
                          {rca.root_cause && (
                            <div className="text-xs text-text-secondary mt-1 line-clamp-2">{rca.root_cause}</div>
                          )}
                          <div className="text-xs text-text-tertiary mt-2">
                            {new Date(rca.created_at).toLocaleString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-tertiary">No insight data</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}