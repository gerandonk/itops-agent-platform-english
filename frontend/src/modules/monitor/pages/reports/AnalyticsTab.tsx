interface AlertTrendItem {
  date: string;
  severity: string;
  count: number;
}

interface DiagnosisItem {
  summary: string;
  count: number;
}

interface ReportAnalytics {
  analysisStats?: { total?: number; completed?: number; failed?: number };
  remediationStats?: { total?: number; success_count?: number; failed_count?: number; rolled_back?: number };
  alertTrends?: AlertTrendItem[];
  topDiagnoses?: DiagnosisItem[];
}

interface AnalyticsTabProps {
  analytics?: ReportAnalytics;
}

export function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">AI Analytics & Statistics</h3>
          <p className="text-2xl font-bold text-text-primary">{analytics?.analysisStats?.total ?? '-'}</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-400">Success {analytics?.analysisStats?.completed ?? 0}</span>
            <span className="text-red-400">failed {analytics?.analysisStats?.failed ?? 0}</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Remediation Executions (Last 30 Days)</h3>
          <p className="text-2xl font-bold text-text-primary">{analytics?.remediationStats?.total ?? '-'}</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-400">Success {analytics?.remediationStats?.success_count ?? 0}</span>
            <span className="text-red-400">failed {analytics?.remediationStats?.failed_count ?? 0}</span>
            <span className="text-yellow-400">Rollback {analytics?.remediationStats?.rolled_back ?? 0}</span>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-1">Alert Trend (7 Days)</h3>
          <p className="text-2xl font-bold text-text-primary">
            {analytics?.alertTrends?.reduce?.((s: number, r: AlertTrendItem) => s + r.count, 0) ?? '-'}
          </p>
          <div className="text-xs text-text-secondary mt-2">Total Alerts</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Alert Trend</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-text-secondary">Date</th>
                <th className="text-left py-2 text-text-secondary">Severity Level</th>
                <th className="text-right py-2 text-text-secondary">Count</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.alertTrends?.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 text-text-primary">{row.date}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      row.severity === 'critical' ? 'bg-red-900/30 text-red-400' :
                      row.severity === 'high' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-blue-900/30 text-blue-400'
                    }`}>{row.severity}</span>
                  </td>
                  <td className="py-2 text-right text-text-primary">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Hotspot Analysis Summary</h3>
        <div className="flex flex-wrap gap-2">
          {analytics?.topDiagnoses?.length ? (
            analytics.topDiagnoses.map((d, i) => (
              <span key={i} className="px-3 py-1 bg-background border border-border rounded-full text-sm text-text-primary">
                {d.summary} ({d.count}times)
              </span>
            ))
          ) : (
            <p className="text-text-secondary">No analysis records available</p>
          )}
        </div>
      </div>
    </div>
  );
}
