import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  FileText,
  CheckSquare,
  ArrowLeftRight
} from 'lucide-react';

export interface RemediationExecution {
  id: string;
  status: string;
  status_reason?: string;
  created_at: string;
  policy_id?: string;
  policy_name?: string;
  alert_id?: string;
  execution_duration_ms?: number;
  verification_status?: string;
  verification_completed_at?: string;
  verification_result?: string | unknown;
  rollback_triggered?: number;
  rollback_completed_at?: string;
  rollback_result?: string | unknown;
  approval_comment?: string;
  approved_at?: string;
  execution_result?: string | unknown;
  [key: string]: unknown;
}

export default function RemediationExecutions() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['remediation-executions', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const { data } = await api.get('/remediation-executions', { params });
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      await api.post(`/remediation-executions/${id}/approve`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-executions'] });
    }
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/remediation-executions/${id}/retry`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-executions'] });
    }
  });

  const { data: executionDetail } = useQuery({
    queryKey: ['remediation-execution-detail', selectedExecutionId],
    queryFn: async () => {
      if (!selectedExecutionId) return null;
      const { data } = await api.get(`/remediation-executions/${selectedExecutionId}`);
      return data;
    },
    enabled: !!selectedExecutionId
  });

  const handleViewDetail = useCallback((id: string) => {
    setSelectedExecutionId(id);
    setShowDetailModal(true);
    setExpandedLogs({});
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedExecutionId(null);
  }, []);

  const toggleLog = useCallback((key: string) => {
    setExpandedLogs(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDetailModal) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, handleCloseModal]);

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'success': <CheckCircle className="w-4 h-4 text-green-500" />,
      'failed': <XCircle className="w-4 h-4 text-red-500" />,
      'rolled_back': <RefreshCw className="w-4 h-4 text-yellow-500" />,
      'waiting_approval': <Clock className="w-4 h-4 text-blue-500" />,
      'running': <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />,
      'skipped': <AlertTriangle className="w-4 h-4 text-text-tertiary" />,
      'rejected': <XCircle className="w-4 h-4 text-orange-500" />
    };
    return iconMap[status] || <Clock className="w-4 h-4 text-text-tertiary" />;
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'Pending',
      'checking': 'Checking',
      'waiting_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'running': 'Running',
      'verifying': 'Verifying',
      'success': 'Success',
      'failed': 'Failed',
      'rolled_back': 'Rolled back',
      'skipped': 'Skipped'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      'success': 'bg-green-500/10 text-green-400 border-green-500/20',
      'failed': 'bg-red-500/10 text-red-400 border-red-500/20',
      'rolled_back': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'waiting_approval': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'running': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'skipped': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'rejected': 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };
    return map[status] || 'bg-slate-500/10 text-text-secondary border-slate-500/20';
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDuration = (ms?: number) => {
    if (ms == null) return '-';
    if (ms === 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-1">Remediation Execution Records</h2>
          <p className="text-text-secondary text-sm">View execution history and results for all auto-remediation policies</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="rolled_back">Rolled back</option>
              <option value="waiting_approval">Pending Approval</option>
              <option value="running">Running</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : !data?.executions?.length ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No execution records</p>
          </div>
        ) : (
          <div className="bg-surface/30 border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Policy</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Validation</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.executions.map((execution: RemediationExecution) => (
                  <tr key={execution.id} className="border-b border-border/30 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-sm text-text-primary">{formatTime(execution.created_at)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-text-primary">Policy ID:  {execution.policy_id?.slice(0, 8)}...</div>
                      <div className="text-xs text-text-tertiary">Alert ID:  {execution.alert_id?.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(execution.status)}`}>
                          {getStatusText(execution.status)}
                        </span>
                      </div>
                      {execution.status_reason && (
                        <div className="text-xs text-text-tertiary mt-1">{execution.status_reason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {formatDuration(execution.execution_duration_ms)}
                    </td>
                    <td className="py-3 px-4">
                      {execution.verification_status ? (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(execution.verification_status)}
                          <span className="text-xs text-text-primary">
                            {getStatusText(execution.verification_status)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-tertiary">Unverified</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {execution.status === 'waiting_approval' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate({ id: execution.id, action: 'approve' })}
                              className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => approveMutation.mutate({ id: execution.id, action: 'reject' })}
                              className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(execution.status === 'failed' || execution.status === 'rejected') && (
                          <button
                            onClick={() => retryMutation.mutate(execution.id)}
                            className="p-1.5 text-text-secondary hover:text-blue-400 transition-colors"
                            title="Retry"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                          title="View details"
                          onClick={() => handleViewDetail(execution.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > limit && (
          <div className="flex items-center justify-between flex-wrap mt-4">
            <div className="text-sm text-text-secondary">Total  {data.total}  records</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
              >
                Previous page
              </button>
              <span className="text-text-secondary text-sm">{page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary hover:bg-slate-700/50 transition-colors"
              >
                Next page
              </button>
            </div>
          </div>
        )}
      </div>

      {showDetailModal && executionDetail && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between flex-wrap px-6 py-4 border-b border-border/50">
              <h3 className="text-lg font-semibold text-text-primary">Execution details</h3>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic info
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-surface rounded-lg p-4">
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Policy Name</div>
                    <div className="text-sm text-text-primary">{executionDetail.policy_name || executionDetail.policy_id?.slice(0, 8) || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Execution Status</div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(executionDetail.status)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(executionDetail.status)}`}>
                        {getStatusText(executionDetail.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Execution Time</div>
                    <div className="text-sm text-text-primary">{formatTime(executionDetail.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-tertiary mb-1">Duration</div>
                    <div className="text-sm text-text-primary">{formatDuration(executionDetail.execution_duration_ms)}</div>
                  </div>
                  {executionDetail.status_reason && (
                    <div className="col-span-2">
                      <div className="text-xs text-text-tertiary mb-1">Status Reason</div>
                      <div className="text-sm text-text-primary">{executionDetail.status_reason}</div>
                    </div>
                  )}
                </div>
              </div>

              {executionDetail.execution_result && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Execution result
                  </h4>
                  <div className="bg-surface rounded-lg p-4">
                    <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                      {typeof executionDetail.execution_result === 'string' 
                        ? executionDetail.execution_result 
                        : JSON.stringify(executionDetail.execution_result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {executionDetail.verification_status && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Verification result
                  </h4>
                  <div className="bg-surface rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusIcon(executionDetail.verification_status)}
                      <span className="text-sm text-text-primary">
                        Verify {getStatusText(executionDetail.verification_status)}
                      </span>
                    </div>
                    {executionDetail.verification_completed_at && (
                      <div className="text-xs text-text-tertiary mb-2">
                        Verification completed at:  {formatTime(executionDetail.verification_completed_at)}
                      </div>
                    )}
                    {executionDetail.verification_result && (
                      <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto bg-surface/50 rounded p-3">
                        {typeof executionDetail.verification_result === 'string'
                          ? executionDetail.verification_result
                          : JSON.stringify(executionDetail.verification_result, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {executionDetail.rollback_triggered === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    Rollback info
                  </h4>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-yellow-300">Rollback Triggered</span>
                    </div>
                    {executionDetail.rollback_completed_at && (
                      <div className="text-xs text-text-secondary mb-2">
                        Rollback completed at:  {formatTime(executionDetail.rollback_completed_at)}
                      </div>
                    )}
                    {executionDetail.rollback_result && (
                      <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto bg-surface/50 rounded p-3">
                        {typeof executionDetail.rollback_result === 'string'
                          ? executionDetail.rollback_result
                          : JSON.stringify(executionDetail.rollback_result, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {executionDetail.approval_comment && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Approval info
                  </h4>
                  <div className="bg-surface rounded-lg p-4">
                    {executionDetail.approved_at && (
                      <div className="text-xs text-text-tertiary mb-2">
                        Approval time:  {formatTime(executionDetail.approved_at)}
                      </div>
                    )}
                    <div className="text-sm text-text-primary">{executionDetail.approval_comment}</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Full log
                </h4>
                <div className="bg-surface rounded-lg divide-y divide-slate-700/30">
                  {[
                    { key: 'execution', label: 'Execution log', content: executionDetail.execution_result },
                    { key: 'verification', label: 'Verification log', content: executionDetail.verification_result },
                    { key: 'rollback', label: 'Rollback log', content: executionDetail.rollback_result },
                    { key: 'status_reason', label: 'Status description', content: executionDetail.status_reason }
                  ].filter(item => item.content).map(item => (
                    <div key={item.key} className="py-2">
                      <button
                        onClick={() => toggleLog(item.key)}
                        className="flex items-center justify-between flex-wrap w-full px-4 text-sm text-text-primary hover:text-text-primary transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          {expandedLogs[item.key] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {item.label}
                        </span>
                      </button>
                      {expandedLogs[item.key] && (
                        <div className="px-4 py-2">
                          <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto bg-surface/30 rounded p-3">
                            {typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border/50 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-700/50 text-text-primary rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
