/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Filter, Bell, Zap, Workflow, Database, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../lib/api';
import { sanitizeText } from '../../../lib/xss';
import { useTheme } from '../../../contexts/ThemeContext';

interface AlertMapping {
  id: string;
  alert_source: string | null;
  alert_severity: string | null;
  alert_title_pattern: string | null;
  workflow_id: string;
  enabled: number;
  created_at: string;
  workflow_name: string;
}

interface Workflow {
  id: string;
  name: string;
}

// 预设模板
const presetTemplates = [
  {
    name: 'Prometheus CPU alert auto-handling',
    description: 'Handles Prometheus CPU usage alerts',
    alert_source: 'prometheus',
    alert_severity: 'critical',
    alert_title_pattern: 'CPU'
  },
  {
    name: 'Zabbix memory alert auto-handling',
    description: 'Handles Zabbix memory alerts',
    alert_source: 'zabbix',
    alert_severity: 'high',
    alert_title_pattern: 'Memory'
  },
  {
    name: 'Handle alerts from any source',
    description: 'Handles all alerts from all sources',
    alert_source: '',
    alert_severity: '',
    alert_title_pattern: ''
  }
];

// 获取级别图标
const getSeverityIcon = (severity: string | null) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    case 'medium':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'low':
      return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

export default function AlertMappings() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AlertMapping | null>(null);
  const [formData, setFormData] = useState({
    alert_source: '',
    alert_severity: '',
    alert_title_pattern: '',
    workflow_id: '',
    enabled: true,
  });
  const queryClient = useQueryClient();

  const { data: mappingsData, isLoading: mappingsLoading } = useQuery({
    queryKey: ['alertMappings'],
    queryFn: async () => {
      const { data } = await api.get('/alert-mappings');
      return data as AlertMapping[];
    },
  });

  const { data: workflowsData } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await api.get('/workflows');
      return data as Workflow[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: result } = await api.post('/alert-mappings', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertMappings'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { data: result } = await api.put(`/alert-mappings/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertMappings'] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/alert-mappings/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertMappings'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMapping) {
      updateMutation.mutate({ id: editingMapping.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (mapping: AlertMapping) => {
    setEditingMapping(mapping);
    setFormData({
      alert_source: mapping.alert_source || '',
      alert_severity: mapping.alert_severity || '',
      alert_title_pattern: mapping.alert_title_pattern || '',
      workflow_id: mapping.workflow_id,
      enabled: !!mapping.enabled,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingMapping(null);
    setFormData({
      alert_source: '',
      alert_severity: '',
      alert_title_pattern: '',
      workflow_id: '',
      enabled: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              Automated Alert Handling
            </h1>
            <p className="text-text-secondary mt-1">Configure alerts to automatically trigger workflows for automated operations</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Mapping
          </button>
        </div>

        {/* Preset templates */}
        <div className={`${
          isDark 
            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20' 
            : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
        } rounded-xl border p-4`}>
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${
            isDark ? 'text-blue-300' : 'text-blue-800'
          }`}>
            <Database className="w-4 h-4" />
            Quick templates
          </h3>
          <div className="flex flex-wrap gap-2">
            {presetTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFormData({
                    alert_source: template.alert_source,
                    alert_severity: template.alert_severity,
                    alert_title_pattern: template.alert_title_pattern,
                    workflow_id: '',
                    enabled: true,
                  });
                  setShowModal(true);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-surface hover:border-primary/50 hover:shadow-sm transition-all text-sm flex items-center gap-2"
              >
                <Bell className="w-4 h-4 text-blue-500" />
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mapping list - card layout */}
        {mappingsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : mappingsData?.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-xl border border-border">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No alert mappings</h3>
            <p className="text-text-secondary mb-4">Start configuring your first alert auto-handling rule</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first mapping
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mappingsData?.map((mapping) => (
              <div key={mapping.id} className="bg-surface rounded-xl border border-border hover:shadow-md transition-all p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${
                      isDark 
                        ? (mapping.enabled ? 'bg-green-500/20' : 'bg-gray-500/20') 
                        : (mapping.enabled ? 'bg-green-100' : 'bg-gray-100')
                    }`}>
                      {mapping.enabled ? 
                        <CheckCircle className={`w-5 h-5 ${
                          isDark ? 'text-green-400' : 'text-green-600'
                        }`} /> : 
                        <XCircle className={`w-5 h-5 ${
                          isDark ? 'text-gray-400' : 'text-gray-400'
                        }`} />
                      }
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isDark 
                        ? (mapping.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300') 
                        : (mapping.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {mapping.enabled ? 'Enable' : 'Disable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(mapping)}
                      className="p-1.5 hover:bg-background rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(mapping.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-primary">
                      Source:  <span className="font-medium">{sanitizeText(mapping.alert_source) || 'Any'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(mapping.alert_severity)}
                    <span className="text-sm text-text-primary">
                      Severity:  <span className="font-medium">{sanitizeText(mapping.alert_severity) || 'Any'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm text-text-primary">
                      Match:  <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">{sanitizeText(mapping.alert_title_pattern) || 'Any'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                    <Workflow className="w-4 h-4 text-primary" />
                    <span className="text-sm text-text-primary font-medium">
                      {sanitizeText(mapping.workflow_name)}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-text-secondary mt-3 pt-2 border-t border-border">
                  Created at {formatDate(mapping.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-border max-w-lg w-full shadow-2xl">
            <div className={`p-4 border-b border-border flex items-center justify-between rounded-t-xl ${
              isDark 
                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }`}>
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {editingMapping ? 'Edit alert mapping' : 'New alert mapping'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg hover:bg-background transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Alert source */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  Alert Source
                </label>
                <input
                  type="text"
                  value={formData.alert_source}
                  onChange={(e) => setFormData({ ...formData, alert_source: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g.: prometheus, zabbix (leave blank for any source)"
                />
              </div>

              {/* Alert severity */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Alert Severity
                </label>
                <select
                  value={formData.alert_severity}
                  onChange={(e) => setFormData({ ...formData, alert_severity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">✨ Any Severity</option>
                  <option value="disaster">💥 Disaster (Zabbix Disaster)</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="warning">🟨 Warning (Zabbix Warning)</option>
                  <option value="low">🔵 Low</option>
                  <option value="info">ℹ️ Info</option>
                </select>
              </div>

              {/* Title matching */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-500" />
                  Title match pattern
                </label>
                <input
                  type="text"
                  value={formData.alert_title_pattern}
                  onChange={(e) => setFormData({ ...formData, alert_title_pattern: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  placeholder="Match if text is contained (leave blank for any title)"
                />
              </div>

              {/* Trigger workflow */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-green-500" />
                  Trigger Workflow
                </label>
                <select
                  required
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">Select workflow to trigger...</option>
                  {workflowsData?.map((wf) => (
                    <option key={wf.id} value={wf.id}>{wf.name}</option>
                  ))}
                </select>
              </div>

              {/* Enable toggle */}
              <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-5 h-5 text-primary focus:ring-primary rounded"
                />
                <label htmlFor="enabled" className="text-sm text-text-primary font-medium">Enable this mapping now</label>
              </div>

              {/* Hint messages */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Configuration Instructions</p>
                    <p>Empty conditions match any value. Zabbix can use raw levels such as disaster, warning, info, or normalized levels such as critical, medium, low.</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 bg-background border border-border rounded-lg text-text-primary hover:bg-surface transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingMapping ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
