import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';

interface WorkflowOption {
  id: string;
  name: string;
  [key: string]: unknown;
}

const EXECUTION_MODES = [
  { value: 'auto', label: 'Auto-execute' },
  { value: 'approval', label: 'Execute after approval' },
  { value: 'suggestion', label: 'Suggestion only' }
];

const SEVERITY_OPTIONS = [
  { value: 'disaster', label: 'Disaster' },
  { value: 'high', label: 'High' },
  { value: 'average', label: 'Medium' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' }
];

const ALERT_SOURCES = ['zabbix', 'prometheus', 'custom'];

export default function RemediationPolicyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    alert_source: 'zabbix',
    alert_severity: '',
    alert_keywords: '',
    alert_tags: '',
    execution_mode: 'approval',
    workflow_id: '',
    workflow_params: '{}',
    max_executions_per_hour: 5,
    cooldown_seconds: 300,
    enable_verification: false,
    verification_workflow_id: '',
    verification_params: '{}',
    verification_timeout_seconds: 120,
    enable_rollback: false,
    rollback_workflow_id: '',
    rollback_on_failure: true
  });

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await api.get('/workflows');
      return data;
    }
  });

  const { data: policy, isLoading: isLoadingPolicy } = useQuery({
    queryKey: ['remediation-policy', id],
    queryFn: async () => {
      const { data } = await api.get(`/remediation-policies/${id}`);
      return data;
    },
    enabled: !isNew
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || '',
        description: policy.description || '',
        alert_source: policy.alert_source || 'zabbix',
        alert_severity: policy.alert_severity || '',
        alert_keywords: policy.alert_keywords ? JSON.parse(policy.alert_keywords).join(', ') : '',
        alert_tags: policy.alert_tags ? JSON.parse(policy.alert_tags).join(', ') : '',
        execution_mode: policy.execution_mode || 'approval',
        workflow_id: policy.workflow_id || '',
        workflow_params: policy.workflow_params || '{}',
        max_executions_per_hour: policy.max_executions_per_hour || 5,
        cooldown_seconds: policy.cooldown_seconds || 300,
        enable_verification: policy.enable_verification === 1,
        verification_workflow_id: policy.verification_workflow_id || '',
        verification_params: policy.verification_params || '{}',
        verification_timeout_seconds: policy.verification_timeout_seconds || 120,
        enable_rollback: policy.enable_rollback === 1,
        rollback_workflow_id: policy.rollback_workflow_id || '',
        rollback_on_failure: policy.rollback_on_failure === 1
      });
    }
  }, [policy]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        alert_keywords: formData.alert_keywords ? JSON.stringify(formData.alert_keywords.split(',').map(s => s.trim()).filter(Boolean)) : null,
        alert_tags: formData.alert_tags ? JSON.stringify(formData.alert_tags.split(',').map(s => s.trim()).filter(Boolean)) : null,
      };
      if (isNew) {
        await api.post('/remediation-policies', data);
      } else {
        await api.put(`/remediation-policies/${id}`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policies'] });
      navigate('/remediation-policies');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/remediation-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policies'] });
      navigate('/remediation-policies');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('Delete this policy?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoadingPolicy) {
    return <div className="flex-1 flex items-center justify-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 flex-shrink-0">
        <button
          onClick={() => navigate('/remediation-policies')}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">
            {isNew ? 'New repair policy' : 'Edit repair policy'}
          </h2>
        </div>
        {!isNew && (
          <button
            onClick={handleDelete}
            className="p-2 text-text-secondary hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/30"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="p-6 max-w-5xl">
          <div className="bg-slate-800/30 border border-border rounded-xl p-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Basic info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Policy Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  placeholder="e.g.: Auto-cleanup when disk space is low"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  placeholder="Policy description"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-border rounded-xl p-4 mt-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Trigger Conditions</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Alert Source *</label>
                <select
                  required
                  value={formData.alert_source}
                  onChange={(e) => setFormData({ ...formData, alert_source: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                >
                  {ALERT_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Alert Severity</label>
                <select
                  value={formData.alert_severity}
                  onChange={(e) => setFormData({ ...formData, alert_severity: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="">All</option>
                  {SEVERITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Keyword Matching</label>
                <input
                  type="text"
                  value={formData.alert_keywords}
                  onChange={(e) => setFormData({ ...formData, alert_keywords: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  placeholder="Separate multiple keywords with commas"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Tag Matching</label>
                <input
                  type="text"
                  value={formData.alert_tags}
                  onChange={(e) => setFormData({ ...formData, alert_tags: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  placeholder="Separate multiple tags with commas"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-border rounded-xl p-4 mt-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Execution Strategy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Execution Mode *</label>
                <select
                  required
                  value={formData.execution_mode}
                  onChange={(e) => setFormData({ ...formData, execution_mode: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                >
                  {EXECUTION_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Linked Workflow</label>
                <select
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Workflow</option>
                  {workflows?.map((w: WorkflowOption) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-text-secondary mb-1">Workflow Parameters (JSON)</label>
                <textarea
                  rows={2}
                  value={formData.workflow_params}
                  onChange={(e) => setFormData({ ...formData, workflow_params: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500 font-mono"
                  placeholder='{"server_id": "{{alert.host}}"}'
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-border rounded-xl p-4 mt-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Trigger Control</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Max Executions per Hour</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_executions_per_hour}
                  onChange={(e) => setFormData({ ...formData, max_executions_per_hour: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Cooldown Time (seconds)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cooldown_seconds}
                  onChange={(e) => setFormData({ ...formData, cooldown_seconds: parseInt(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-border rounded-xl p-4 mt-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Validation Config</h3>
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_verification}
                  onChange={(e) => setFormData({ ...formData, enable_verification: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-text-primary">Enable Post-Remediation Validation</span>
              </label>
            </div>
            {formData.enable_verification && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Validation Workflow</label>
                  <select
                    value={formData.verification_workflow_id}
                    onChange={(e) => setFormData({ ...formData, verification_workflow_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Workflow</option>
                    {workflows?.map((w: WorkflowOption) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Validation Timeout (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.verification_timeout_seconds}
                    onChange={(e) => setFormData({ ...formData, verification_timeout_seconds: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-text-secondary mb-1">Validation Parameters (JSON)</label>
                  <textarea
                    rows={2}
                    value={formData.verification_params}
                    onChange={(e) => setFormData({ ...formData, verification_params: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800/30 border border-border rounded-xl p-4 mt-4">
            <h3 className="text-base font-semibold text-text-primary mb-3">Rollback Config</h3>
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_rollback}
                  onChange={(e) => setFormData({ ...formData, enable_rollback: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-text-primary">Enable Auto Rollback</span>
              </label>
            </div>
            {formData.enable_rollback && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Rollback Workflow</label>
                  <select
                    value={formData.rollback_workflow_id}
                    onChange={(e) => setFormData({ ...formData, rollback_workflow_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-800/50 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Workflow</option>
                    {workflows?.map((w: WorkflowOption) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={formData.rollback_on_failure}
                      onChange={(e) => setFormData({ ...formData, rollback_on_failure: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-text-primary">Auto rollback on remediation failure</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
