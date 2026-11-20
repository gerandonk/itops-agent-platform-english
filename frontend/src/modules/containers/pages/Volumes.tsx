import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Popconfirm, Progress, Empty } from 'antd';
import { Plus, Edit, Trash2, Search, RefreshCw, HardDrive, Database } from 'lucide-react';
import api from '../../../lib/api';

interface Volume {
  id: string;
  name: string;
  driver: string;
  mount_point: string;
  size_gb: number;
  used_gb: number;
  status: string;
  host: string;
  type: string;
  tags?: string | string[];
}

const statusColors: Record<string, string> = {
  available: 'green', 'in-use': 'blue', error: 'red',
};

const statusLabel: Record<string, string> = {
  available: 'Available', 'in-use': 'In use', error: 'Error',
};

const typeColor: Record<string, string> = {
  docker: 'blue', nfs: 'cyan', local: 'green', ceph: 'purple',
};
const typeLabel: Record<string, string> = {
  docker: 'Docker', nfs: 'NFS', local: 'Local', ceph: 'Ceph',
};

const usagePercent = (v: Volume): number => {
  if (!v.size_gb || !v.used_gb) return 0;
  return Math.round((v.used_gb / v.size_gb) * 100);
};

export default function Volumes() {
  const [data, setData] = useState<Volume[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Volume | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/volumes', { params: { page, pageSize, search } });
      const items = data?.items || data?.rows || [];
      // 如果存储卷为空，自动从 Docker 同步卷列表
      if (items.length === 0) {
        try {
          await api.post('/volumes/sync', { type: 'docker' });
          const { data: syncedData } = await api.get('/volumes', { params: { page, pageSize, search } });
          setData(syncedData?.items || syncedData?.rows || []);
          setTotal(syncedData?.total || 0);
          return;
        } catch { /* ignore sync errors */ }
      }
      setData(items);
      setTotal(data?.total || 0);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search]);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/volumes/${editing.id}`, values);
        message.success('Updated successfully');
      } else {
        await api.post('/volumes', values);
        message.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch { message.error('Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/volumes/${id}`); message.success('Deleted successfully'); fetchData(); } catch { message.error('Failed to delete'); }
  };

  const handleSync = async () => {
    try {
      const { data } = await api.post('/volumes/sync', { type: 'docker' });
      message.success(`Sync completed: \${data?.synced || 0} volumes`);
      fetchData();
    } catch { message.error('Sync failed'); }
  };

  const openEdit = (record: Volume) => {
    setEditing(record);
    const vals = { ...record, tags: typeof record.tags === 'string' ? JSON.parse(record.tags || '[]') : (record.tags || []) };
    form.setFieldsValue(vals);
    setModalOpen(true);
  };

  // ── 派生：过滤 + 统计 ──
  const filteredData = useMemo(() => {
    if (typeFilter === 'all') return data;
    return data.filter(v => v.type === typeFilter);
  }, [data, typeFilter]);

  const stats = useMemo(() => {
    let totalSize = 0;
    let inUse = 0;
    let highUsage = 0;
    for (const v of data) {
      totalSize += v.size_gb || 0;
      if (v.status === 'in-use') inUse++;
      const p = usagePercent(v);
      if (p >= 80) highUsage++;
    }
    return { total: data.length, totalSize, inUse, highUsage };
  }, [data]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <span className="font-medium text-text-primary">{n}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => <Tag color={typeColor[t] || 'default'} className="m-0">{typeLabel[t] || t}</Tag>,
    },
    {
      title: 'Driver',
      dataIndex: 'driver',
      key: 'driver',
      width: 110,
      render: (d: string) => <Tag className="m-0">{d || 'local'}</Tag>,
    },
    {
      title: 'Mount point',
      dataIndex: 'mount_point',
      key: 'mount_point',
      ellipsis: true,
    },
    {
      title: 'Usage',
      key: 'usage',
      width: 200,
      render: (_: unknown, r: Volume) => {
        const p = usagePercent(r);
        return (
          <div className="flex items-center gap-2">
            <Progress
              percent={p}
              size="small"
              className="flex-1 min-w-[80px]"
              strokeColor={p > 80 ? '#ef4444' : p > 60 ? '#f59e0b' : '#10b981'}
            />
            <span className="text-xs text-text-secondary tabular-nums whitespace-nowrap">
              {r.used_gb || 0}/{r.size_gb || 0} GB
            </span>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={statusColors[s] || 'default'} className="m-0">{statusLabel[s] || s}</Tag>,
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
      width: 140,
      render: (h: string) => <span className="text-text-secondary">{h || '—'}</span>,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 140,
      align: 'center' as const,
      render: (_: unknown, record: Volume) => (
        <div className="flex items-center justify-center gap-1">
          <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm
            title="Confirm delete?"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Volume Management</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage Docker / NFS / Local / Ceph storage volumes — sync, create, delete, capacity monitoring
          </p>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Total Volumes</div>
            <div className="text-xl font-semibold text-text-primary">{stats.total}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Total capacity (GB)</div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">{stats.totalSize}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">In use</div>
            <div className="text-xl font-semibold text-text-primary">{stats.inUse}</div>
          </div>
        </div>
        <div className={`rounded-xl p-4 flex items-center gap-3 transition-all border ${
          stats.highUsage > 0
            ? 'bg-red-500/5 border-red-500/30'
            : 'bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm'
        }`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stats.highUsage > 0
              ? 'bg-red-500/15 text-red-500'
              : 'bg-slate-500/10 text-slate-500'
          }`}>
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">High Usage (≥80%)</div>
            <div className={`text-xl font-semibold ${
              stats.highUsage > 0
                ? 'text-red-500'
                : 'text-text-primary'
            }`}>{stats.highUsage}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search volume name / driver..."
            prefix={<Search size={14} className="text-text-secondary" />}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            allowClear
            style={{ width: 240 }}
          />
          <Select
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            style={{ width: 140 }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'docker', label: 'Docker' },
              { value: 'nfs', label: 'NFS' },
              { value: 'local', label: 'Local' },
              { value: 'ceph', label: 'Ceph' },
            ]}
          />

          <div className="flex items-center gap-2 ml-auto">
            <Button icon={<RefreshCw size={14} />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Button icon={<RefreshCw size={14} />} onClick={handleSync}>Sync Volumes</Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Create Volume</Button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <Table<Volume>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `Total \${t} volumes`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{
            emptyText: (
              <Empty
                description={search ? `No volumes found matching "${search}"` : 'No storage volumes'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>

      <Modal
        title={editing ? 'Edit storage volume' : 'New storage volume'}
        open={modalOpen}
        onOk={handleSave}
        okText={editing ? 'Save' : 'Create'}
        cancelText="Cancel"
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g.: app-data" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="driver" label="Driver">
              <Input placeholder="local / nfs ..." />
            </Form.Item>
            <Form.Item name="type" label="Type" initialValue="docker">
              <Select
                options={[
                  { value: 'docker', label: 'Docker' },
                  { value: 'nfs', label: 'NFS' },
                  { value: 'local', label: 'Local' },
                  { value: 'ceph', label: 'Ceph' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="mount_point" label="Mount point">
            <Input placeholder="/var/lib/..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="size_gb" label="Total capacity (GB)">
              <Input type="number" min={0} placeholder="100" />
            </Form.Item>
            <Form.Item name="used_gb" label="Used (GB)">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
          </div>
          <Form.Item name="host" label="Host">
            <Input placeholder="server-1" />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Press Enter after typing a tag" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
