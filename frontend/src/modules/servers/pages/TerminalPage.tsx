import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Server, Terminal, Search, X, Monitor, Key } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../lib/api';
import WebTerminal from '../../../modules/servers/components/WebTerminal';

interface ServerItem {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  use_ssh_key: number;
  description?: string;
  tags?: string[];
  enabled: number;
  last_connected?: string;
  created_at: string;
  kind?: 'server' | 'vm';
}

interface VMItem {
  id: string;
  name: string;
  ipAddress?: string;
  guestOs?: string;
  hypervisorType?: string;
  powerState?: string;
}

interface SshKeyItem {
  id: string;
  name: string;
  auth_type: string;
  key_type: string;
  username: string | null;
}

export default function TerminalPage() {
  const { token } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(null);
  const [vmCredModal, setVmCredModal] = useState<VMItem | null>(null);
  const [selectedCredId, setSelectedCredId] = useState<string>('');
  const [isCreatingServer, setIsCreatingServer] = useState(false);

  const { data: serversData, isLoading: serversLoading } = useQuery<ServerItem[]>({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then((r) => (Array.isArray(r.data) ? (r.data as ServerItem[]).map((s) => ({ ...s, kind: 'server' as const })) : [])),
  });

  const { data: vmsData, isLoading: vmsLoading } = useQuery<VMItem[]>({
    queryKey: ['virtual-machines'],
    queryFn: () => api.get('/virtual-machines', { params: { pageSize: 100 } }).then((r) => {
      const items = r.data?.items || r.data?.data || r.data || [];
      return Array.isArray(items) ? (items as VMItem[]) : [];
    }),
  });

  const { data: sshKeys = [] } = useQuery<SshKeyItem[]>({
    queryKey: ['ssh-keys'],
    queryFn: () => api.get('/ssh-keys').then((r) => (Array.isArray(r.data) ? (r.data as SshKeyItem[]) : [])),
  });

  const handleServerClick = useCallback((server: ServerItem) => {
    if (server.kind === 'vm') {
      const vm = (vmsData || []).find((v) => `vm-${v.id}` === server.id);
      if (vm) {
        setVmCredModal(vm);
        if (sshKeys && sshKeys.length > 0 && !selectedCredId) setSelectedCredId(sshKeys[0].id);
      }
      return;
    }
    setSelectedServer(server);
  }, [vmsData, sshKeys, selectedCredId]);

  const handleCloseTerminal = useCallback(() => {
    setSelectedServer(null);
  }, []);

  const handleConnectVm = async () => {
    if (!vmCredModal || !selectedCredId) return;
    const cred = (sshKeys || []).find((k) => k.id === selectedCredId);
    if (!cred) return;
    setIsCreatingServer(true);
    try {
      const existing = (serversData || []).find((s) => s.hostname === (vmCredModal.ipAddress || ''));
      if (existing) {
        setSelectedServer({ ...existing, kind: 'server' });
        queryClient.invalidateQueries({ queryKey: ['servers'] });
        setVmCredModal(null);
        return;
      }
      const res = await api.post('/servers', {
        name: vmCredModal.name,
        hostname: vmCredModal.ipAddress,
        port: 22,
        username: cred.username || '',
        ssh_key_id: cred.id,
        use_ssh_key: 1,
        os_type: 'linux',
      });
      const newId = (res.data as { id?: string })?.id;
      if (newId) {
        setSelectedServer({
          id: newId,
          name: vmCredModal.name,
          hostname: vmCredModal.ipAddress || '',
          port: 22,
          username: cred.username || '',
          use_ssh_key: 1,
          enabled: 1,
          created_at: new Date().toISOString(),
          kind: 'server',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setVmCredModal(null);
    } catch {
      toast.error('Gagal membuat koneksi terminal untuk VM ini');
    } finally {
      setIsCreatingServer(false);
    }
  };

  const servers = useMemo(() => {
    const serverIps = new Set((serversData || []).map((s) => s.hostname).filter(Boolean));
    const vmItems: ServerItem[] = (vmsData || [])
      .filter((vm) => !vm.ipAddress || !serverIps.has(vm.ipAddress))
      .map((vm) => ({
        id: `vm-${vm.id}`,
        name: vm.name,
        hostname: vm.ipAddress || '',
        port: 22,
        username: '',
        use_ssh_key: 0,
        enabled: vm.powerState === 'poweredOn' ? 1 : 0,
        created_at: new Date().toISOString(),
        kind: 'vm' as const,
        tags: [vm.guestOs || 'VM', vm.hypervisorType || ''].filter(Boolean),
      }));
    const all = [...(serversData || []), ...vmItems];
    if (!searchTerm) return all;
    const term = searchTerm.toLowerCase();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.hostname.toLowerCase().includes(term) ||
        (s.username || '').toLowerCase().includes(term) ||
        (s.tags || []).some((t) => t.toLowerCase().includes(term))
    );
  }, [serversData, vmsData, searchTerm]);

  const isLoading = serversLoading || vmsLoading;

  if (selectedServer && token) {
    return (
      <div className="h-full">
        <WebTerminal
          serverId={selectedServer.id}
          serverName={`${selectedServer.name} (${selectedServer.hostname})`}
          token={token}
          onClose={handleCloseTerminal}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Terminal className="w-6 h-6" />
          Web Terminal
        </h1>
        <p className="text-text-secondary mt-1">
          Select a server to open an interactive SSH terminal
        </p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Search server name, IP, username, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary/60">
          <Server className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">
            {searchTerm ? 'No matching servers found' : 'No available servers'}
          </p>
          <p className="text-sm mt-1">
            {searchTerm ? 'Please try other search keywords' : 'Please add servers on the server management page first'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => handleServerClick(server)}
              className="group flex flex-col items-start p-4 bg-surface border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    {server.kind === 'vm' ? <Monitor className="w-4 h-4 text-primary" /> : <Terminal className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                      {server.name}
                    </h3>
                    <p className="text-xs text-text-secondary">{server.hostname || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {server.kind === 'vm' && (
                    <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">VM</span>
                  )}
                  <div className={`w-2 h-2 rounded-full ${server.enabled ? 'bg-status-success' : 'bg-text-secondary/30'}`} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="px-2 py-0.5 text-xs bg-background text-text-secondary rounded">
                  {server.username}@{server.port}
                </span>
                {server.use_ssh_key ? (
                  <span className="px-2 py-0.5 text-xs bg-status-success/10 text-status-success rounded">
                    Key
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs bg-status-warning/10 text-status-warning rounded">
                    Password
                  </span>
                )}
              </div>
              {server.tags && server.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {server.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary group-hover:text-primary transition-colors">
                <Terminal className="w-3 h-3" />
                <span>{server.kind === 'vm' ? 'Click to connect via SSH' : 'Click to open terminal'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {vmCredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-medium text-text-primary mb-2">Open Terminal to VM</h3>
            <p className="text-sm text-text-secondary mb-4">
              {vmCredModal.name} ({vmCredModal.ipAddress}) — pilih SSH credential
            </p>
            {sshKeys.length === 0 ? (
              <p className="text-sm text-amber-400 mb-4">Belum ada SSH credential. Tambahkan di Server Management → SSH Keys.</p>
            ) : (
              <select
                value={selectedCredId}
                onChange={(e) => setSelectedCredId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary mb-4"
              >
                {sshKeys.map((k) => (
                  <option key={k.id} value={k.id}>{k.name} ({k.username || 'no user'})</option>
                ))}
              </select>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setVmCredModal(null); setSelectedCredId(''); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-md"
              >Cancel</button>
              <button
                onClick={handleConnectVm}
                disabled={isCreatingServer || !selectedCredId || sshKeys.length === 0}
                className="px-4 py-2 text-sm bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreatingServer ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
