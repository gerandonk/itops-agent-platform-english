import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Settings,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';

export interface RemediationPolicy {
  id: string;
  name: string;
  description?: string;
  enabled: number;
  execution_mode: 'auto' | 'approval' | 'suggestion';
  alert_source: string;
  alert_severity?: string;
  max_executions_per_hour: number;
  cooldown_seconds: number;
  [key: string]: unknown;
}

export default function RemediationPolicies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['remediation-policies', enabledFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (enabledFilter !== 'all') {
        params.enabled = enabledFilter === 'enabled' ? 'true' : 'false';
      }
      const { data } = await api.get('/remediation-policies', { params });
      return data;
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/remediation-policies/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policies'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/remediation-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policies'] });
    }
  });

  const policies = (data?.policies || []).filter((p: RemediationPolicy) =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (enabled: number) => {
    return enabled ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-text-tertiary" />
    );
  };

  const getExecutionModeText = (mode: string) => {
    const map: Record<string, string> = {
      'auto': 'Auto-execute',
      'approval': 'Execute after approval',
      'suggestion': 'Suggestion only'
    };
    return map[mode] || mode;
  };

  const getExecutionModeColor = (mode: string) => {
    const map: Record<string, string> = {
      'auto': 'text-green-400',
      'approval': 'text-yellow-400',
      'suggestion': 'text-blue-400'
    };
    return map[mode] || 'text-gray-400';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Auto-Remediation Policies</h2>
            <p className="text-text-secondary text-sm">Configure alert auto-remediation rules and policies</p>
          </div>
          <button
            onClick={() => navigate('/remediation-policies/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-text-secondary">Loading...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No remediation policies</p>
            <button
              onClick={() => navigate('/remediation-policies/new')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
            >
              Create your first policy
            </button>
          </div>
        ) : (
          <div className="bg-surface/30 border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Policy Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Trigger Conditions</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Execution Mode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Rate Limit</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy: RemediationPolicy) => (
                  <tr key={policy.id} className="border-b border-border/30 hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(policy.enabled)}
                        <div>
                          <div className="text-text-primary font-medium">{policy.name}</div>
                          {policy.description && (
                            <div className="text-xs text-text-tertiary mt-0.5">{policy.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-text-primary">{policy.alert_source}</div>
                      {policy.alert_severity && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-text-tertiary">{policy.alert_severity}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getExecutionModeColor(policy.execution_mode)}`}>
                        {getExecutionModeText(policy.execution_mode)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-primary">
                      {policy.max_executions_per_hour} times/hour
                      <div className="text-xs text-text-tertiary mt-0.5">Cooldown:  {policy.cooldown_seconds}s</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        policy.enabled 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-slate-500/10 text-text-secondary border border-slate-500/20'
                      }`}>
                        {policy.enabled ? 'Enable' : 'Disable'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleMutation.mutate(policy.id)}
                          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                          title={policy.enabled ? 'Disable' : 'Enable'}
                        >
                          {policy.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => navigate(`/remediation-policies/${policy.id}`)}
                          className="p-1.5 text-text-secondary hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this policy?')) {
                              deleteMutation.mutate(policy.id);
                            }
                          }}
                          className="p-1.5 text-text-secondary hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <XCircle className="w-4 h-4" />
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-text-secondary">
              Total  {data.total}  policies
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
              >
                Previous page
              </button>
              <span className="text-text-secondary text-sm">
                {page} / {Math.ceil(data.total / limit)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(data.total / limit), p + 1))}
                disabled={page >= Math.ceil(data.total / limit)}
                className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 transition-colors"
              >
                Next page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
