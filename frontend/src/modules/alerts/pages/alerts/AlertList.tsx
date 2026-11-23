import { Bell, Play, Clock, Zap, Wrench, Search, Terminal, Wifi } from 'lucide-react';
import clsx from 'clsx';
import { safeFormatDistance } from '../../../../lib/date';
import { sanitizeText } from '../../../../lib/xss';
import type { Alert, AnalysisItem } from './types';

function getSeverityLabel(severity: string) {
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[severity] || severity;
}

interface AlertListProps {
  alerts: Alert[];
  analysisMap: Record<string, AnalysisItem>;
  onProcess: (alertId: string) => void;
  processPending: boolean;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  navigate: (path: string) => void;
  onViewAutomationLog: (alert: Alert) => void;
}

export default function AlertList({
  alerts,
  analysisMap,
  onProcess,
  processPending,
  onAcknowledge,
  onResolve,
  navigate,
  onViewAutomationLog,
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-xl bg-surface border border-border mb-3">
          <Bell className="w-8 h-8 text-text-secondary opacity-50" />
        </div>
        <p className="text-sm text-text-secondary mb-1">No alerts</p>
        <p className="text-xs text-text-tertiary">System is running normally, no alerts</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {alerts.map((alert) => (
        <div key={alert.id} className="p-4 sm:p-6 hover:bg-background/50 transition-all">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    alert.severity === 'critical' && 'bg-status-failed/10 text-status-failed',
                    alert.severity === 'high' && 'bg-status-warning/10 text-status-warning',
                    alert.severity === 'medium' && 'bg-primary/10 text-primary',
                    alert.severity === 'low' && 'bg-status-pending/10 text-status-pending'
                  )}
                >
                  {getSeverityLabel(alert.severity)}
                </span>
                <span
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    alert.status === 'new' && 'bg-status-failed/10 text-status-failed',
                    alert.status === 'acknowledged' && 'bg-status-warning/10 text-status-warning',
                    alert.status === 'resolved' && 'bg-status-success/10 text-status-success'
                  )}
                >
                  {alert.status === 'new' && 'New'}
                  {alert.status === 'acknowledged' && 'Confirmed'}
                  {alert.status === 'resolved' && 'Resolved'}
                </span>
              </div>
              <h3 className="font-semibold text-text-primary mb-1 truncate">{sanitizeText(alert.title)}</h3>
              <p className="text-sm text-text-secondary mb-2 line-clamp-2 break-words">{sanitizeText(alert.content)}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
                <span className="truncate max-w-xs sm:max-w-md">Source: {sanitizeText(alert.source)}</span>
                <span className="whitespace-nowrap">
                  {safeFormatDistance(alert.created_at)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:ml-4 w-full sm:w-auto">
              {alert.status !== 'resolved' && (
                <button
                  onClick={() => onProcess(alert.id)}
                  disabled={processPending}
                  className="px-3 py-1 text-sm bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-600/20 transition-colors flex items-center gap-1"
                  title="Manual trigger: match mapping + repair policy + root cause analysis"
                >
                  <Play className="w-3.5 h-3.5" />
                  Handle
                </button>
              )}
              {alert.status === 'new' && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="px-3 py-1 text-sm bg-status-warning/10 text-status-warning rounded-lg hover:bg-status-warning/20"
                >
                  Acknowledge
                </button>
              )}
              {alert.status !== 'resolved' && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="px-3 py-1 text-sm bg-status-success/10 text-status-success rounded-lg hover:bg-status-success/20"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>

          {/* ── Related actions ── */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
            {analysisMap[alert.id] && (
              <button
                onClick={() => navigate(`/alert-auto-analysis?alertId=${alert.id}`)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded bg-emerald-500/5 hover:bg-emerald-500/10 whitespace-nowrap"
              >
                <Zap className="w-3 h-3" />
                AI Analysis
              </button>
            )}
            <button
              onClick={() => navigate(`/remediation-executions?alertId=${alert.id}`)}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors px-2 py-1 rounded bg-orange-500/5 hover:bg-orange-500/10 whitespace-nowrap"
            >
              <Wrench className="w-3 h-3" />
              Remediation records
            </button>
            <button
              onClick={() => onViewAutomationLog(alert)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded bg-blue-500/5 hover:bg-blue-500/10 whitespace-nowrap"
            >
              <Terminal className="w-3 h-3" />
              Automation log
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}