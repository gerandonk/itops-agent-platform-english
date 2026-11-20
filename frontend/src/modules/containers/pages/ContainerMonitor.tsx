import { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Button, Tag, Card, Row, Col, Drawer, Descriptions, Progress, message, Switch as _Switch, Space, Tooltip } from 'antd';
import { Play, Square, Eye, Activity, RefreshCw } from 'lucide-react';
import api from '../../../lib/api';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuth } from '../../../contexts/AuthContext';

interface ContainerStats {
  containerId: string;
  name: string;
  cpuPercent: string;
  memory: { usage: number; limit: number; percent: string };
  network?: { rx_bytes: number; tx_bytes: number };
  pids: number;
  timestamp: string;
}

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  state?: string;
  host?: string;
  container_id?: string;
  ports?: any[];
}

interface ClusterSnapshot {
  totalContainers: number;
  runningContainers: number;
  totalCpuPercent: string;
  totalMemoryUsage: number;
  totalMemoryLimit: number;
  totalMemoryPercent: string;
}

const statusColors: Record<string, string> = {
  running: 'green', stopped: 'red', paused: 'orange', exited: 'default', restarting: 'blue',
};

export default function ContainerMonitor() {
  const { token } = useAuth();
  const [data, setData] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [clusterStats, setClusterStats] = useState<ClusterSnapshot>({
    totalContainers: 0, runningContainers: 0, totalCpuPercent: '0',
    totalMemoryUsage: 0, totalMemoryLimit: 0, totalMemoryPercent: '0',
  });
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<Container | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detailInspect, setDetailInspect] = useState<any>(null);
  const [monitoredIds, setMonitoredIds] = useState<Set<string>>(new Set());
  const [containerStatsMap, setContainerStatsMap] = useState<Map<string, ContainerStats>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.io
  useEffect(() => {
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('container:stats', (stats: ContainerStats) => {
      setContainerStatsMap(prev => new Map(prev).set(stats.containerId, stats));
    });

    return () => { socket.disconnect(); };
  }, [token]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [containerRes, snapRes] = await Promise.all([
        api.get('/containers'),
        api.get('/docker-monitor/cluster-snapshot'),
      ]);
      const containerList = containerRes.data?.items ?? containerRes.data;
      setData(Array.isArray(containerList) ? containerList : []);
      setClusterStats(snapRes.data || {
        totalContainers: 0, runningContainers: 0, totalCpuPercent: '0',
        totalMemoryUsage: 0, totalMemoryLimit: 0, totalMemoryPercent: '0',
      });
    } catch {
      message.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Toggle monitoring
  const toggleMonitor = async (containerId: string, start: boolean) => {
    try {
      await api.post(`/docker-monitor/${start ? 'start' : 'stop'}/${containerId}`);
      if (start) {
        socketRef.current?.emit('container:subscribe', { containerId });
        setMonitoredIds(prev => new Set(prev).add(containerId));
      } else {
        socketRef.current?.emit('container:unsubscribe', { containerId });
        setMonitoredIds(prev => { const next = new Set(prev); next.delete(containerId); return next; });
      }
      message.success(start ? 'Monitoring started' : 'Monitoring stopped');
    } catch {
      message.error('Operation failed');
    }
  };

  // View detail
  const viewDetail = async (item: Container) => {
    setDetailItem(item);
    setDetailInspect(null);
    setDetailVisible(true);
    try {
      const { data } = await api.get(`/containers/${item.id}`);
      setDetailInspect(data ||data);
    } catch {
      // inspect may not be available
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatNetworkBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const columns = [
    {
      title: 'Container name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: Container) => (
        <Tooltip title={record.container_id}>
          <span className="font-medium break-all">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 280,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="break-all text-xs">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Port',
      key: 'ports',
      width: 140,
      render: (_: unknown, record: Container) => {
        const rawPorts = record.ports || [];
        const mapped = rawPorts.filter((p: any) => p.PublicPort).map((p: any) => `${p.PublicPort}→${p.PrivatePort}`);
        return mapped.length > 0 ? <span className="text-xs">{mapped.join(', ')}</span> : <span className="text-text-tertiary text-xs">-</span>;
      },
    },
    {
      title: 'CPU',
      key: 'cpu',
      width: 180,
      render: (_: unknown, record: Container) => {
        const stats = containerStatsMap.get(record.id);
        const cpu = parseFloat(stats?.cpuPercent || '0');
        return (
          <Progress
            percent={Math.min(cpu, 100)}
            size="small"
            format={(p) => `${(p || 0).toFixed(1)}%`}
            status={cpu > 90 ? 'exception' : cpu > 70 ? 'active' : 'normal'}
          />
        );
      },
    },
    {
      title: 'Memory',
      key: 'memory',
      width: 200,
      render: (_: unknown, record: Container) => {
        const stats = containerStatsMap.get(record.id);
        const mem = stats?.memory;
        const percent = parseFloat(mem?.percent || '0');
        return (
          <Progress
            percent={Math.min(percent, 100)}
            size="small"
            format={() => {
              if (!mem) return '-';
              return `${formatBytes(mem.usage)} / ${formatBytes(mem.limit)} (${percent.toFixed(1)}%)`;
            }}
            status={percent > 90 ? 'exception' : percent > 70 ? 'active' : 'normal'}
          />
        );
      },
    },
    {
      title: 'Network I/O',
      key: 'network',
      width: 160,
      render: (_: unknown, record: Container) => {
        const stats = containerStatsMap.get(record.id);
        const net = stats?.network;
        if (!net) return <span className="text-gray-400">-</span>;
        return (
          <span className="text-xs">
            <span className="text-blue-400">↓ {formatNetworkBytes(net.rx_bytes)}</span>
            {' / '}
            <span className="text-green-400">↑ {formatNetworkBytes(net.tx_bytes)}</span>
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: Container) => {
        const isMonitoring = monitoredIds.has(record.id);
        return (
          <Space size="small">
            {isMonitoring ? (
              <Button
                size="small"
                danger
                icon={<Square className="w-3 h-3" />}
                onClick={() => toggleMonitor(record.id, false)}
              >
                Stop monitoring
              </Button>
            ) : (
              <Button
                size="small"
                type="primary"
                ghost
                icon={<Play className="w-3 h-3" />}
                onClick={() => toggleMonitor(record.id, true)}
                disabled={record.state !== 'running'}
              >
                Start monitoring
              </Button>
            )}
            <Button
              size="small"
              icon={<Eye className="w-3 h-3" />}
              onClick={() => viewDetail(record)}
            >
              Details
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Real-Time Container Monitoring</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor container runtime status, CPU, memory, and network resources in real time</p>
        </div>
        <Button icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Total Containers</div>
            <div className="text-xl font-semibold text-text-primary leading-tight">{clusterStats.totalContainers}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
            <Play className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Running</div>
            <div className="text-xl font-semibold text-text-primary leading-tight">{clusterStats.runningContainers}</div>
          </div>
        </div>
        <div className={`rounded-xl p-4 flex items-center gap-3 transition-all border ${
          parseFloat(clusterStats.totalCpuPercent) > 90
            ? 'bg-red-500/5 border-red-500/30'
            : parseFloat(clusterStats.totalCpuPercent) > 70
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            parseFloat(clusterStats.totalCpuPercent) > 90
              ? 'bg-red-500/15 text-red-500'
              : parseFloat(clusterStats.totalCpuPercent) > 70
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-primary/10 text-primary'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Total CPU Usage</div>
            <div className={`text-xl font-semibold leading-tight ${
              parseFloat(clusterStats.totalCpuPercent) > 90
                ? 'text-red-500'
                : parseFloat(clusterStats.totalCpuPercent) > 70
                  ? 'text-amber-500'
                  : 'text-text-primary'
            }`}>{parseFloat(clusterStats.totalCpuPercent).toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Square className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Total Memory Usage</div>
            <div className="text-xl font-semibold text-text-primary leading-tight">{formatBytes(clusterStats.totalMemoryUsage)}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
            <Square className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Total Memory Limit</div>
            <div className="text-xl font-semibold text-text-primary leading-tight">{formatBytes(clusterStats.totalMemoryLimit)}</div>
          </div>
        </div>
        <div className={`rounded-xl p-4 flex items-center gap-3 transition-all border ${
          parseFloat(clusterStats.totalMemoryPercent) > 90
            ? 'bg-red-500/5 border-red-500/30'
            : parseFloat(clusterStats.totalMemoryPercent) > 70
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            parseFloat(clusterStats.totalMemoryPercent) > 90
              ? 'bg-red-500/15 text-red-500'
              : parseFloat(clusterStats.totalMemoryPercent) > 70
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-primary/10 text-primary'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-text-secondary">Total Memory Usage Rate</div>
            <div className={`text-xl font-semibold leading-tight ${
              parseFloat(clusterStats.totalMemoryPercent) > 90
                ? 'text-red-500'
                : parseFloat(clusterStats.totalMemoryPercent) > 70
                  ? 'text-amber-500'
                  : 'text-text-primary'
            }`}>{parseFloat(clusterStats.totalMemoryPercent).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Container Table */}
      <Card title="Container list" className="shadow-sm" bodyStyle={{ padding: '12px' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} containers total` }}
          scroll={{ x: '100%' }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Container details"
        open={detailVisible}
        onClose={() => { setDetailVisible(false); setDetailInspect(null); }}
        width="min(640px, 100vw)"
        destroyOnClose
      >
        {detailItem && (
          <div className="space-y-4">
            <Descriptions title="Basic info" column={2} bordered size="small">
              <Descriptions.Item label="Container name">{detailItem.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[detailItem.status] || 'default'}>{detailItem.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Image" span={2}>{detailItem.image}</Descriptions.Item>
              <Descriptions.Item label="Container ID" span={2}>
                <code className="text-xs">{detailItem.container_id}</code>
              </Descriptions.Item>
              {detailItem.host && (
                <Descriptions.Item label="Host machine">{detailItem.host}</Descriptions.Item>
              )}
            </Descriptions>

            {/* Real-time stats */}
            {containerStatsMap.has(detailItem.id) && (
              <Descriptions title="Real-time stats" column={2} bordered size="small">
                <Descriptions.Item label="CPU usage">
                  {containerStatsMap.get(detailItem.id)?.cpuPercent}%
                </Descriptions.Item>
                <Descriptions.Item label="PID count">
                  {containerStatsMap.get(detailItem.id)?.pids}
                </Descriptions.Item>
                <Descriptions.Item label="Memory usage">
                  {(() => {
                    const m = containerStatsMap.get(detailItem.id)?.memory;
                    return m ? `${formatBytes(m.usage)} / ${formatBytes(m.limit)}` : '-';
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="Memory usage">
                  {containerStatsMap.get(detailItem.id)?.memory?.percent}%
                </Descriptions.Item>
                <Descriptions.Item label="Network receive">
                  {formatNetworkBytes(containerStatsMap.get(detailItem.id)?.network?.rx_bytes || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Network send">
                  {formatNetworkBytes(containerStatsMap.get(detailItem.id)?.network?.tx_bytes || 0)}
                </Descriptions.Item>
              </Descriptions>
            )}

            {/* Inspect data */}
            {detailInspect && (
              <Descriptions title="Detailed inspection (Inspect)" column={1} bordered size="small">
                {Object.entries(detailInspect).slice(0, 20).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {typeof value === 'object' ? (
                      <pre className="text-xs max-h-40 overflow-auto bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
