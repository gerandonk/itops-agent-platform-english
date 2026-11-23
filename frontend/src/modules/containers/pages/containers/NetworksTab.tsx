import { Globe, RefreshCw, Plus, Eye, Trash2, X, Box } from 'lucide-react';
import type { useContainers } from './useContainers';

type Ctx = ReturnType<typeof useContainers>;

export function NetworksTab({ ctx }: { ctx: Ctx }) {
  const {
    queryClient,
    networksQueryKey,
    networks, networksLoading, networksError,
    showNetCreateModal, setShowNetCreateModal,
    showNetDetailDrawer, setShowNetDetailDrawer,
    netDetailData: _netDetailData, setNetDetailData,
    netName, setNetName,
    netDriver, setNetDriver,
    netSubnet, setNetSubnet,
    netGateway, setNetGateway,
    netInternal, setNetInternal,
    netAttachable, setNetAttachable,
    createNetworkMutation,
    deleteNetworkMutation,
    displayNetDetail,
    resetNetForm,
  } = ctx;

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: networksQueryKey })}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <button
          onClick={() => setShowNetCreateModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Network
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between flex-wrap">
            <div>
              <p className="text-text-secondary text-sm">Total Networks</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{networks.length}</p>
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between flex-wrap">
            <div>
              <p className="text-text-secondary text-sm">Bridge Network</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {networks.filter((n) => (n.Driver || n.driver) === 'bridge').length}
              </p>
            </div>
            <Globe className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between flex-wrap">
            <div>
              <p className="text-text-secondary text-sm">Connected Containers</p>
              <p className="text-2xl font-bold text-text-primary mt-1">
                {networks.reduce((sum, n) => {
                  const containers = n.Containers || n.containers || {};
                  return sum + Object.keys(containers).length;
                }, 0)}
              </p>
            </div>
            <Box className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {networksError && (
        <div className="flex flex-col items-center justify-center py-20">
          <Globe className="w-16 h-16 text-text-tertiary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Network service unavailable</h3>
          <p className="text-text-secondary text-sm mb-4">Failed to connect to Docker engine.</p>
          <button onClick={() => queryClient.invalidateQueries({ queryKey: networksQueryKey })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {!networksError && (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">Subnet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">Gateway</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Container</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {networksLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">Loading...</td></tr>
                ) : networks.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">No networks</td></tr>
                ) : (
                  networks.map((net) => {
                    const containers = net.Containers || net.containers || {};
                    const containerCount = Object.keys(containers).length;
                    const ipam = net.IPAM || net.ipam;
                    const ipamConfig = ipam?.Config || ipam?.config || [];
                    const subnet = ipamConfig[0]?.Subnet || ipamConfig[0]?.subnet || '-';
                    const gateway = ipamConfig[0]?.Gateway || ipamConfig[0]?.gateway || '-';
                    return (
                      <tr key={net.Id || net.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">{net.Name || net.name}</div>
                          <div className="text-xs text-text-tertiary font-mono">{(net.Id || net.id || '').substring(0, 12)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-primary">{net.Driver || net.driver}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-secondary">{net.Scope || net.scope}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs text-text-secondary font-mono">{subnet}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="text-xs text-text-secondary font-mono">{gateway}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-text-primary">{containerCount}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setNetDetailData(net); setShowNetDetailDrawer(true); }}
                              className="p-1.5 rounded hover:bg-blue-500/10 text-text-secondary hover:text-blue-400 transition-colors"
                              title="Details"
                            ><Eye className="w-3.5 h-3.5" /></button>
                            <button
                              onClick={() => { if (confirm('Delete this network?')) deleteNetworkMutation.mutate(net.Id || net.id || ''); }}
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
        </div>
      )}

      {/* ── Create Network Modal ── */}
      {showNetCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowNetCreateModal(false); resetNetForm(); }}>
          <div className="bg-surface rounded-lg border border-border w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between flex-wrap p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Create Network</h3>
              <button onClick={() => { setShowNetCreateModal(false); resetNetForm(); }} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name <span className="text-red-400">*</span></label>
                <input type="text" value={netName} onChange={(e) => setNetName(e.target.value)} placeholder="Network name" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Driver</label>
                <select value={netDriver} onChange={(e) => setNetDriver(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-blue-500 text-sm">
                  <option value="bridge">bridge</option>
                  <option value="host">host</option>
                  <option value="overlay">overlay</option>
                  <option value="macvlan">macvlan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Subnet</label>
                  <input type="text" value={netSubnet} onChange={(e) => setNetSubnet(e.target.value)} placeholder="172.20.0.0/16" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Gateway</label>
                  <input type="text" value={netGateway} onChange={(e) => setNetGateway(e.target.value)} placeholder="172.20.0.1" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={netInternal} onChange={(e) => setNetInternal(e.target.checked)} className="rounded bg-background border-border" />
                  <span className="text-sm text-text-primary">Internal Network</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={netAttachable} onChange={(e) => setNetAttachable(e.target.checked)} className="rounded bg-background border-border" />
                  <span className="text-sm text-text-primary">Allow Connections</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowNetCreateModal(false); resetNetForm(); }} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-text-primary rounded-lg transition-colors text-sm">Cancel</button>
                <button onClick={() => createNetworkMutation.mutate()} disabled={!netName.trim() || createNetworkMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {createNetworkMutation.isPending ? 'Creating...' : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Network Detail Drawer ── */}
      {showNetDetailDrawer && displayNetDetail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNetDetailDrawer(false)} />
          <div className="relative ml-auto w-full max-w-lg bg-surface border-l border-border h-full overflow-hidden flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between flex-wrap px-4 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-text-secondary" />
                <h3 className="font-semibold text-text-primary">Network Details: {displayNetDetail.Name || displayNetDetail.name}</h3>
              </div>
              <button onClick={() => setShowNetDetailDrawer(false)} className="text-text-secondary hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="bg-background rounded-lg p-4 border border-border">
                <h4 className="text-sm font-medium text-text-secondary mb-3">Basic info</h4>
                <div className="space-y-2">
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">Name</span><span className="text-sm text-text-primary">{displayNetDetail.Name || displayNetDetail.name || '-'}</span></div>
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">ID</span><span className="text-sm text-text-primary font-mono">{(displayNetDetail.Id || displayNetDetail.id || '').substring(0, 16)}</span></div>
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">Driver</span><span className="text-sm text-text-primary">{displayNetDetail.Driver || displayNetDetail.driver || '-'}</span></div>
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">Scope</span><span className="text-sm text-text-primary">{displayNetDetail.Scope || displayNetDetail.scope || '-'}</span></div>
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">Subnet</span><span className="text-sm text-text-primary font-mono">{(() => { const i = displayNetDetail.IPAM || displayNetDetail.ipam; const c = i?.Config || i?.config || []; return c[0]?.Subnet || c[0]?.subnet || '-'; })()}</span></div>
                  <div className="flex"><span className="text-xs text-text-tertiary w-16">Gateway</span><span className="text-sm text-text-primary font-mono">{(() => { const i = displayNetDetail.IPAM || displayNetDetail.ipam; const c = i?.Config || i?.config || []; return c[0]?.Gateway || c[0]?.gateway || '-'; })()}</span></div>
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-border">
                <h4 className="text-sm font-medium text-text-secondary mb-3">Connected Containers</h4>
                {(() => {
                  const containers = displayNetDetail.Containers || displayNetDetail.containers || {};
                  const entries = Object.entries(containers);
                  if (entries.length === 0) return <p className="text-xs text-text-tertiary">No container connections</p>;
                  return entries.map(([cid, info]) => (
                    <div key={cid} className="flex items-center justify-between flex-wrap py-2 border-b border-border last:border-0">
                      <span className="text-sm text-text-primary">{info.Name}</span>
                      <span className="text-xs text-text-tertiary font-mono">{info.IPv4Address || '-'}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}