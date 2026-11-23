/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Network, RefreshCw, Plus, ArrowDown, X } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../lib/api';
import TopologyGraph from '../../../modules/network/components/TopologyGraph';
import type { TopologyNode, TopologyEdge } from '../../../modules/network/components/TopologyGraph';
import { useToast } from '../../../contexts/ToastContext';
import { getAxiosErrorMessage } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

interface Dependency {
  id?: string;
  source: string;
  target: string;
  type: string;
  protocol: string;
  status: 'active' | 'inactive' | 'degraded';
  call_count?: number;
  avg_latency?: number;
}

interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

interface Server {
  id: string;
  name: string;
  hostname: string;
}

const protocolColors: Record<string, string> = {
  http: 'bg-blue-100 text-blue-700',
  https: 'bg-blue-100 text-blue-700',
  grpc: 'bg-purple-100 text-purple-700',
  tcp: 'bg-gray-100 text-gray-700',
  mysql: 'bg-orange-100 text-orange-700',
  redis: 'bg-red-100 text-red-700',
  kafka: 'bg-green-100 text-green-700',
  amqp: 'bg-yellow-100 text-yellow-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  degraded: 'bg-yellow-100 text-yellow-700',
};

const statusLabels: Record<string, string> = {
  active: 'Normal',
  inactive: 'Disconnected',
  degraded: 'Degraded',
};

function DeleteDependencyButton({ dependencyId }: { dependencyId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/topology/dependency/${dependencyId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topology'] });
      toast.success('Dependency deleted');
    },
    onError: (err: unknown) => {
      toast.error(getAxiosErrorMessage(err, 'Failed to delete'));
    },
  });

  return (
    <button
      onClick={() => deleteMutation.mutate()}
      disabled={deleteMutation.isPending}
      className="px-3 py-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
    >
      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}

export default function Topology() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    source_server_id: '',
    target_server_id: '',
    dependency_type: '',
    protocol: 'http',
    port: 80,
  });
  const [isDiscovering, setIsDiscovering] = useState(false);

  const {
    data: topologyData,
    isLoading: topologyLoading,
    refetch: refetchTopology,
  } = useQuery({
    queryKey: ['topology', 'global'],
    queryFn: async () => {
      const { data } = await api.get('/topology/global');
      return data as TopologyData;
    },
  });

  const { data: dependencies, isLoading: depsLoading } = useQuery({
    queryKey: ['topology', 'dependencies'],
    queryFn: async () => {
      const { data } = await api.get('/topology/dependency');
      return data as Dependency[];
    },
  });

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await api.get('/servers');
      return data as Server[];
    },
  });

  const addDependencyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result } = await api.post('/topology/dependency', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topology'] });
      toast.success('Dependency added');
      setIsAddModalOpen(false);
      setFormData({
        source_server_id: '',
        target_server_id: '',
        dependency_type: '',
        protocol: 'http',
        port: 80,
      });
    },
    onError: (err: unknown) => {
      toast.error(getAxiosErrorMessage(err, 'Failed to add'));
    },
  });

  const handleDiscoverDependencies = async () => {
    if (!servers || servers.length === 0) {
      toast.warning('No servers available for dependency discovery');
      return;
    }

    setIsDiscovering(true);
    try {
      let failedCount = 0;
      for (const server of servers) {
        try {
          await api.post(`/topology/discover/${server.id}`);
        } catch (err: unknown) {
          failedCount++;
          // 单个服务器失败不影响其他服务器，但记录以便定位
          logger.warn(`[topology] discover failed for server ${server.id}`, err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['topology'] });
      toast.success(
        failedCount > 0 ? `Dependency discovery complete (\${failedCount} failed, check logs)` : 'Dependency discovery completed',
      );
    } catch (err: unknown) {
      toast.error(getAxiosErrorMessage(err, 'Dependency discovery failed'));
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <Network className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Service Topology</h1>
            <p className="text-text-secondary text-sm mt-0.5">View inter-service dependencies and call chains</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchTopology()}
            disabled={topologyLoading}
            className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', topologyLoading && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleDiscoverDependencies}
            disabled={isDiscovering}
            className="px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 transition-colors"
          >
            <ArrowDown className={clsx('w-4 h-4', isDiscovering && 'animate-spin')} />
            Discover Dependencies
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* 添加依赖模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between flex-wrap mb-6">
              <h3 className="text-lg font-semibold text-text-primary">Add Service Dependency</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Source Server
                </label>
                <select
                  value={formData.source_server_id}
                  onChange={(e) => setFormData({ ...formData, source_server_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Please select the source server</option>
                  {servers?.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Target Server
                </label>
                <select
                  value={formData.target_server_id}
                  onChange={(e) => setFormData({ ...formData, target_server_id: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Please select the target server</option>
                  {servers?.map((server) => (
                    <option key={server.id} value={server.id}>
                      {server.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Dependency Type
                </label>
                <input
                  type="text"
                  value={formData.dependency_type}
                  onChange={(e) => setFormData({ ...formData, dependency_type: e.target.value })}
                  placeholder="e.g.: network, database, api"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Protocol</label>
                  <select
                    value={formData.protocol}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="tcp">TCP</option>
                    <option value="mysql">MySQL</option>
                    <option value="redis">Redis</option>
                    <option value="kafka">Kafka</option>
                    <option value="grpc">gRPC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addDependencyMutation.mutate(formData)}
                  disabled={
                    addDependencyMutation.isPending ||
                    !formData.source_server_id ||
                    !formData.target_server_id ||
                    !formData.dependency_type
                  }
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {addDependencyMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Topology View</h2>
          {topologyLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TopologyGraph
              nodes={topologyData?.nodes || []}
              edges={topologyData?.edges || []}
              height={500}
            />
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Dependency List</h2>
          </div>
          {depsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Source Service</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">
                      Target Service
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Protocol</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencies?.map((dep, idx) => {
                    const sourceServer = servers?.find((s) => s.id === dep.source);
                    const targetServer = servers?.find((s) => s.id === dep.target);
                    return (
                      <tr
                        key={dep.id || idx}
                        className="border-b border-border/50 hover:bg-background/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-text-primary font-medium">
                          {sourceServer?.name || dep.source}
                        </td>
                        <td className="px-4 py-3 text-text-primary">
                          {targetServer?.name || dep.target}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{dep.type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              protocolColors[dep.protocol?.toLowerCase()] ||
                                'bg-gray-100 text-gray-700',
                            )}
                          >
                            {(dep.protocol || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              statusColors[dep.status] || 'bg-gray-100 text-gray-700',
                            )}
                          >
                            {statusLabels[dep.status] || dep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {dep.id && <DeleteDependencyButton dependencyId={dep.id} />}
                        </td>
                      </tr>
                    );
                  })}
                  {dependencies?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-secondary">
                        No dependency data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
