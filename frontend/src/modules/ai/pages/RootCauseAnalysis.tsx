import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Play, Eye, Trash2, AlertTriangle, CheckCircle, Clock, Zap, Lightbulb } from 'lucide-react';
import api from '../../../lib/api';
import RecommendationCard from '../components/RecommendationCard';
import { useNavigate } from 'react-router-dom';

interface RootCauseAnalysis {
  id: string;
  alert_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  root_cause?: string;
  symptoms: string[];
  timeline: Array<{ time: string; event: string }>;
  evidence: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default function RootCauseAnalysisPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRca, setSelectedRca] = useState<RootCauseAnalysis | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    alert_id: ''
  });

  const { data: rcas, isLoading } = useQuery({
    queryKey: ['rootCauseAnalyses'],
    queryFn: async () => {
      const { data } = await api.get('/root-cause-analysis');
      return data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (rca: Record<string, unknown>) => {
      const { data } = await api.post('/root-cause-analysis', rca);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rootCauseAnalyses'] });
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', alert_id: '' });
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/root-cause-analysis/${id}/analyze`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rootCauseAnalyses'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/root-cause-analysis/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rootCauseAnalyses'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'analyzing': return <Zap className="w-4 h-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending analysis';
      case 'analyzing': return 'Analyzing';
      case 'completed': return 'Completed';
      case 'failed': return 'Analysis failed';
      default: return status;
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Fault Root Cause Analysis</h1>
            <p className="text-text-secondary mt-1">Automatically analyze the root cause of alerts and provide solutions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {rcas?.map((rca: RootCauseAnalysis) => (
              <div key={rca.id} className="bg-surface rounded-xl border border-border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary">{rca.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(rca.status)}`}>
                        {getStatusIcon(rca.status)}
                        {getStatusText(rca.status)}
                      </span>
                    </div>
                    {rca.description && (
                      <p className="text-text-secondary text-sm mb-3">{rca.description}</p>
                    )}
                    {rca.status === 'completed' && rca.root_cause && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          Root Cause
                        </div>
                        <p className="text-text-secondary text-sm bg-background p-3 rounded-lg">
                          {rca.root_cause}
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-text-secondary">
                      Created at {new Date(rca.created_at).toLocaleString('en-US')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRca(rca);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {rca.status === 'pending' && (
                      <button
                        onClick={() => analyzeMutation.mutate(rca.id)}
                        disabled={analyzeMutation.isPending}
                        className="p-2 text-text-secondary hover:text-primary hover:bg-background rounded-lg disabled:opacity-50"
                        title="Start analysis"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(rca.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rcas?.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No root cause analyses</h3>
                <p className="text-text-secondary mb-6">Create a new root cause analysis to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Create your first analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create analysis modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Create Root Cause Analysis</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  placeholder="Enter analysis title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description (Optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
                  rows={3}
                  placeholder="Describe the problem to analyze"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate(createForm)}
                  disabled={!createForm.title || createMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetailModal && selectedRca && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between flex-wrap mb-4">
              <h2 className="text-xl font-bold text-text-primary">Root Cause Analysis Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{selectedRca.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(selectedRca.status)}`}>
                  {getStatusIcon(selectedRca.status)}
                  {getStatusText(selectedRca.status)}
                </span>
              </div>

              {selectedRca.description && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">Problem Description</h4>
                  <p className="text-text-secondary">{selectedRca.description}</p>
                </div>
              )}

              {selectedRca.status === 'completed' && (
                <>
                  {selectedRca.root_cause && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Root Cause
                      </h4>
                      <p className="text-text-secondary bg-background p-4 rounded-lg">{selectedRca.root_cause}</p>
                    </div>
                  )}

                  {selectedRca.symptoms?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">Observed Symptoms</h4>
                      <ul className="list-disc list-inside text-text-secondary space-y-1">
                        {selectedRca.symptoms.map((symptom, idx) => (
                          <li key={idx}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRca.timeline?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">Timeline</h4>
                      <div className="space-y-2">
                        {selectedRca.timeline.map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <span className="text-text-secondary text-sm whitespace-nowrap">{item.time}</span>
                            <span className="text-text-primary">{item.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRca.evidence?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">Analysis Evidence</h4>
                      <ul className="list-disc list-inside text-text-secondary space-y-1">
                        {selectedRca.evidence.map((evidence, idx) => (
                          <li key={idx}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedRca.recommendations?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-text-primary mb-3">Remediation Suggestions</h4>
                      <div className="grid gap-3">
                        {selectedRca.recommendations.map((rec, idx) => (
                          <RecommendationCard
                            key={idx}
                            recommendation={{
                              id: `${selectedRca.id}-rec-${idx}`,
                              // 风险等级简单推断：含「重启/删除/修改/格式」等关键词视为高风险
                              risk: /重启|删除|rm\s|reboot|shutdown|format/i.test(rec) ? 'high' : 'low',
                              title: `Suggestion ${idx + 1}`,
                              // 每个建议作为单一步骤
                              steps: [{ title: rec }],
                              auto_executable: !/重启|删除|rm\s|reboot|shutdown|format|delete/i.test(rec),
                            }}
                            onExecute={(id) => {
                              // 低风险建议：跳转到 AI 修复页，让用户在那里触发自动化执行
                              navigate('/ai-remediations');
                            }}
                            onCreateTicket={(id) => {
                              // 高风险建议：跳转到 AI 修复页，让用户走审批流程
                              navigate('/ai-remediations');
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedRca.status === 'pending' && (
                <div className="text-center py-6">
                  <button
                    onClick={() => {
                      analyzeMutation.mutate(selectedRca.id);
                    }}
                    disabled={analyzeMutation.isPending}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {analyzeMutation.isPending ? 'Analyzing...' : 'Start analysis'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
