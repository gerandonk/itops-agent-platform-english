import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, XCircle, CheckCircle, Trash2, RefreshCw, Clock } from 'lucide-react';
import api from '../../../lib/api';

interface NoiseAlert {
  id: string;
  alert_fingerprint: string;
  alert_source: string;
  alert_title: string;
  occurrence_count: number;
  first_occurrence: string;
  last_occurrence: string;
  is_suppressed: boolean;
  suppression_reason?: string;
  suppression_until?: string;
}

interface Stats {
  totalAlerts: number;
  suppressedAlerts: number;
  duplicateCount: number;
  noiseReductionRate: number;
}

export default function AlertNoiseManagement() {
  const queryClient = useQueryClient();
  const [selectedFingerprint] = useState<string | null>(null);
  const [showSuppressModal, setShowSuppressModal] = useState(false);
  const [suppressReason, setSuppressReason] = useState('');
  const [suppressDuration, setSuppressDuration] = useState(60);

  const { data: stats } = useQuery<Stats>({
    queryKey: ['alert-noise-stats'],
    queryFn: async () => {
      const { data } = await api.get('/alert-noise/stats');
      return data;
    }
  });

  const { data: suppressedAlerts } = useQuery<NoiseAlert[]>({
    queryKey: ['suppressed-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alert-noise/suppressed');
      return data || [];
    }
  });

  const unsuppressMutation = useMutation({
    mutationFn: async (fingerprint: string) => {
      const { data } = await api.post('/alert-noise/unsuppress', { fingerprint });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-noise-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppressed-alerts'] });
    }
  });

  const suppressMutation = useMutation({
    mutationFn: async ({ fingerprint, reason, duration }: { fingerprint: string; reason: string; duration: number }) => {
      const { data } = await api.post('/alert-noise/suppress', { fingerprint, reason, durationMinutes: duration });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-noise-stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppressed-alerts'] });
      setShowSuppressModal(false);
      setSuppressReason('');
    }
  });

  const cleanupMutation = useMutation({
    mutationFn: async (days: number) => {
      const { data } = await api.post('/alert-noise/cleanup', { daysToKeep: days });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-noise-stats'] });
    }
  });

  const statsCards = stats ? [
    { label: 'Total alert types', value: stats.totalAlerts, color: 'blue' },
    { label: 'Suppressed alerts', value: stats.suppressedAlerts, color: 'yellow' },
    { label: 'Dedup count', value: stats.duplicateCount, color: 'green' },
    { label: 'Noise reduction efficiency', value: `${stats.noiseReductionRate}%`, color: 'purple' }
  ] : [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Alert Noise Reduction
            </h1>
            <p className="text-text-secondary mt-1">
              Intelligently suppress duplicate alerts to reduce alert noise
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['alert-noise-stats', 'suppressed-alerts'] })}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-surface border border-border p-6 rounded-xl">
              <p className="text-sm text-text-secondary">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${
                stat.color === 'blue' ? 'text-blue-400' :
                stat.color === 'yellow' ? 'text-yellow-400' :
                stat.color === 'green' ? 'text-green-400' :
                'text-purple-400'
              }`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="bg-surface border border-border p-4 rounded-xl flex gap-3 flex-wrap">
          <button
            onClick={() => cleanupMutation.mutate(30)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clean up records older than 30 days
          </button>
        </div>

        {/* Suppressed Alerts */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <XCircle className="w-5 h-5 text-yellow-500" />
              Suppressed Alerts
            </h2>
          </div>
          <div className="divide-y divide-border">
            {suppressedAlerts?.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                No suppressed alerts
              </div>
            ) : (
              suppressedAlerts?.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-background/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                          Suppressed
                        </span>
                        <span className="text-sm text-text-secondary">{alert.alert_source}</span>
                      </div>
                      <h3 className="text-text-primary font-medium mb-1">{alert.alert_title}</h3>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          Occurred  {alert.occurrence_count}  times
                        </span>
                        {alert.suppression_until && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Suppressed until  {new Date(alert.suppression_until).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {alert.suppression_reason && (
                        <p className="text-sm text-text-secondary mt-2">
                          Reason:  {alert.suppression_reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => unsuppressMutation.mutate(alert.alert_fingerprint)}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Restore
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suppress Modal */}
        {showSuppressModal && selectedFingerprint && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-surface border border-border p-6 rounded-xl w-full max-w-md">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Manual Alert Suppression</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-text-primary mb-1">Suppression Reason</label>
                  <textarea
                    value={suppressReason}
                    onChange={(e) => setSuppressReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-text-primary"
                    rows={3}
                    placeholder="Enter suppression reason..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-primary mb-1">Suppression Duration (minutes)</label>
                  <input
                    type="number"
                    value={suppressDuration}
                    onChange={(e) => setSuppressDuration(parseInt(e.target.value) || 60)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-text-primary"
                    min={1}
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSuppressModal(false)}
                    className="flex-1 bg-background hover:bg-surface text-text-primary py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (suppressReason.trim()) {
                        suppressMutation.mutate({
                          fingerprint: selectedFingerprint,
                          reason: suppressReason,
                          duration: suppressDuration
                        });
                      }
                    }}
                    disabled={!suppressReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                  >
                    Confirm suppression
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
