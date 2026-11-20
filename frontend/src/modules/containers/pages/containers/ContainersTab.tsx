import { Box, Search, RefreshCw, Plus, Play, Square, RotateCcw, Eye, FileText, Activity, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { containerName, statusBadge, formatDate } from '../types';
import type { useContainers } from './useContainers';

type Ctx = ReturnType<typeof useContainers>;

export function ContainersTab({ ctx }: { ctx: Ctx }) {
  const {
    queryClient,
    containersQueryKey,
    containerData, containersLoading, containersError,
    page, setPage, pageSize,
    search, setSearch,
    statusFilter, setStatusFilter,
    showCreateModal, setShowCreateModal,
    createImage, setCreateImage,
    createName, setCreateName,
    createPorts, setCreatePorts,
    createEnv, setCreateEnv,
    createVolumes, setCreateVolumes,
    createRestart, setCreateRestart,
    createMemory, setCreateMemory,
    createCpuShares, setCreateCpuShares,
    containerActionMutation,
    deleteContainerMutation,
    createContainerMutation,
    resetCreateForm,
    setSelectedContainerId,
    setSelectedContainerName,
    setShowDetailDrawer,
    setShowLogsDrawer,
    setShowStatsDrawer,
  } = ctx;

  return (
    <>
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search container name/image..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="running">Running</option>
          <option value="exited">Stopped</option>
          <option value="paused">Paused</option>
        </select>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: containersQueryKey })}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Container
        </button>
      </div>

      {/* Error state */}
      {containersError && (
        <div className="flex flex-col items-center justify-center py-20">
          <Box className="w-16 h-16 text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Container service unavailable</h3>
          <p className="text-text-secondary text-sm mb-6 text-center max-w-md">
            Docker engine connection failed, please check if Docker is running.
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: containersQueryKey })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Loading / Table */}
      {!containersError && (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Port</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">Created At</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {containersLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">Loading...</td></tr>
                ) : containerData?.data.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-text-tertiary">No containers</td></tr>
                ) : (
                  (containerData?.data || []).map((c) => {
                    const state = (c.State || c.state || '').toLowerCase();
                    const badge = statusBadge(state);
                    const rawPorts = (c as any).ports || c.Ports || [];
const ports = rawPorts.filter((p: any) => p.PublicPort).map((p: any) => `${p.PublicPort}→${p.PrivatePort}`);
                    return (
                      <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">{containerName(c)}</div>
                          <div className="text-xs text-text-tertiary font-mono">{c.id?.substring(0, 12)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-text-primary truncate max-w-[160px]">{c.Image || c.image || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {state || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-text-secondary font-mono">
                            {ports.length > 0 ? ports.join(', ') : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs text-text-secondary">{formatDate(c.Created || c.created)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              onClick={() => containerActionMutation.mutate({ id: c.id, action: 'start' })}
                              className="p-1.5 rounded hover:bg-green-500/10 text-text-secondary hover:text-green-400 transition-colors"
                              title="Start"
                            ><Play className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => containerActionMutation.mutate({ id: c.id, action: 'stop' })}
                              className="p-1.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                              title="Stop"
                            ><Square className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => containerActionMutation.mutate({ id: c.id, action: 'restart' })}
                              className="p-1.5 rounded hover:bg-yellow-500/10 text-text-secondary hover:text-yellow-400 transition-colors"
                              title="Restart"
                            ><RotateCcw className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => {
                                setSelectedContainerId(c.id);
                                setSelectedContainerName(containerName(c));
                                setShowDetailDrawer(true);
                              }}
                              className="p-1.5 rounded hover:bg-blue-500/10 text-text-secondary hover:text-blue-400 transition-colors"
                              title="Details"
                            ><Eye className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => {
                                setSelectedContainerId(c.id);
                                setSelectedContainerName(containerName(c));
                                setShowLogsDrawer(true);
                              }}
                              className="p-1.5 rounded hover:bg-slate-500/10 text-text-secondary hover:text-slate-300 transition-colors"
                              title="Logs"
                            ><FileText className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => {
                                setSelectedContainerId(c.id);
                                setSelectedContainerName(containerName(c));
                                setShowStatsDrawer(true);
                              }}
                              className="p-1.5 rounded hover:bg-purple-500/10 text-text-secondary hover:text-purple-400 transition-colors"
                              title="Status"
                            ><Activity className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => { if (confirm(`Are you sure you want to delete container \${containerName(c)}?`)) deleteContainerMutation.mutate(c.id); }}
                              className="p-1.5 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                              title="Delete"
                            ><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {containerData && containerData.total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-tertiary">
                Total  {containerData.total} items, page  {page} / {Math.ceil(containerData.total / pageSize)} 
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                ><ChevronLeft className="w-4 h-4" /></button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil((containerData?.total || 0) / pageSize)}
                  className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
                ><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Container Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
          <div className="bg-surface rounded-lg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Create Container</h3>
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Image <span className="text-red-400">*</span></label>
                <input type="text" value={createImage} onChange={(e) => setCreateImage(e.target.value)} placeholder="nginx:latest" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Container Name</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Port Mapping</label>
                <input type="text" value={createPorts} onChange={(e) => setCreatePorts(e.target.value)} placeholder="8080:80,443:443" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
                <p className="text-xs text-text-tertiary mt-1">Format: host port:container port, comma-separated</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Environment Variables</label>
                <input type="text" value={createEnv} onChange={(e) => setCreateEnv(e.target.value)} placeholder="KEY=VALUE,KEY2=VALUE2" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Volume Mounts</label>
                <input type="text" value={createVolumes} onChange={(e) => setCreateVolumes(e.target.value)} placeholder="/host/path:/container/path" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Restart Policy</label>
                  <select value={createRestart} onChange={(e) => setCreateRestart(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500 text-sm">
                    <option value="no">No</option>
                    <option value="always">Always</option>
                    <option value="on-failure">On Failure</option>
                    <option value="unless-stopped">Unless Stopped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Memory Limit (MB)</label>
                  <input type="number" value={createMemory} onChange={(e) => setCreateMemory(e.target.value)} placeholder="No limit" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">CPU Weight</label>
                <input type="number" value={createCpuShares} onChange={(e) => setCreateCpuShares(e.target.value)} placeholder="Default 1024" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-text-primary rounded-lg transition-colors text-sm">Cancel</button>
                <button onClick={() => createContainerMutation.mutate()} disabled={!createImage.trim() || createContainerMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {createContainerMutation.isPending ? 'Creating...' : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}