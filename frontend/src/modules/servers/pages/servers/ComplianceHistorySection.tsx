import { ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { logger } from '@/lib/logger';
import api from '../../../../lib/api';
import type { Server as ServerType, ComplianceCheck } from '../types';

interface ComplianceHistorySectionProps {
  selectedServer: ServerType;
  complianceHistory: ComplianceCheck[] | undefined;
}

export function ComplianceHistorySection({
  selectedServer,
  complianceHistory,
}: ComplianceHistorySectionProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between flex-wrap mb-6">
        <h2 className="text-lg font-bold text-text-primary">
          Compliance Check History - {selectedServer.name}
        </h2>
        <button
          onClick={async () => {
            try {
              const response = await api.get(
                `/api/servers/${selectedServer.id}/compliance-history/export`,
                { responseType: 'blob' },
              );
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute(
                'download',
                `compliance-history-${selectedServer.id}-${Date.now()}.json`,
              );
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch (error) {
              logger.error('Export failed: ', error);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span>📥</span>
          Export History
        </button>
      </div>
      <div className="space-y-4">
        {complianceHistory?.map((check) => (
          <div key={check.id} className="bg-background rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap mb-2">
              <h4 className="font-medium text-text-primary">{check.check_name}</h4>
              <span
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  check.status === 'completed'
                    ? 'bg-status-success/10 text-status-success'
                    : check.status === 'running'
                      ? 'bg-status-running/10 text-status-running'
                      : 'bg-status-failed/10 text-status-failed',
                )}
              >
                {check.status === 'completed'
                  ? 'Completed'
                  : check.status === 'running'
                    ? 'Running'
                    : 'Failed'}
              </span>
            </div>
            <div className="text-xs text-text-secondary space-y-1">
              <p>Start: {check.started_at ? new Date(check.started_at).toLocaleString() : '-'}</p>
              <p>Complete: {check.completed_at ? new Date(check.completed_at).toLocaleString() : '-'}</p>
            </div>
            {check.check_results && (
              <details className="mt-3">
                <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                  View Results
                </summary>
                <pre className="mt-2 bg-surface p-3 rounded text-xs overflow-x-auto text-text-primary font-mono max-h-60 overflow-y-auto">
                  {check.check_results}
                </pre>
              </details>
            )}
          </div>
        ))}
        {(!complianceHistory || complianceHistory.length === 0) && (
          <div className="text-center py-12 text-text-secondary">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No compliance check history</p>
          </div>
        )}
      </div>
    </div>
  );
}