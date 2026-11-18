/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Tag, message, Form, Input, InputNumber, Switch, Popconfirm, Empty } from 'antd';
import { Plus, Edit, Trash2, Search, RefreshCw, Camera } from 'lucide-react';
import api from '../../../lib/api';

interface SnapshotPolicy {
  id: string;
  name: string;
  platformId?: string;
  vmId?: string;
  cronExpression?: string;
  retention?: number;
  snapshotMemory?: boolean | number;
  enabled?: boolean | number;
  lastRunAt?: string;
}

const cronExamples = [
  { label: 'Run hourly', value: '0 * * * *' },
  { label: 'Daily at 2:00', value: '0 2 * * *' },
  { label: 'Every Sunday at 2:00', value: '0 2 * * 0' },
];

export default function SnapshotPolicies() {
  const [data, setData] = useState<SnapshotPolicy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SnapshotPolicy | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      // 后端返回 { success, data: { items, total } }；axios 拦截器已解包
      const { data } = await api.get('/snapshot-policies', { params: { page, pageSize, search } });
      setData(data?.items || []);
      setTotal(data?.total || 0);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search]);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/snapshot-policies/${editing.id}`, values);
        message.success('Updated successfully');
      } else {
        await api.post('/snapshot-policies', values);
        message.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch { message.error('Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/snapshot-policies/${id}`); message.success('Deleted successfully'); fetchData(); } catch { message.error('Failed to delete'); }
  };

  const openEdit = (record: SnapshotPolicy) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      snapshotMemory: !!record.snapshotMemory,
      enabled: !!record.enabled,
    });
    setModalOpen(true);
  };

  // ── 派生 ──
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter(p => {
      const e = !!p.enabled;
      return statusFilter === 'enabled' ? e : !e;
    });
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    let enabled = 0;
    let memSnap = 0;
    let totalRetention = 0;
    for (const p of data) {
      if (p.enabled) enabled++;
      if (p.snapshotMemory) memSnap++;
      totalRetention += p.retention || 0;
    }
    return { total: data.length, enabled, memSnap, totalRetention };
  }, [data]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <span className="font-medium text-text-primary">{n}</span>,
    },
    {
      title: 'Platform ID',
      dataIndex: 'platformId',
      key: 'platformId',
      width: 140,
      render: (p: string) => <Tag className="m-0">{p || '—'}</Tag>,
    },
    {
      title: 'VM ID',
      dataIndex: 'vmId',
      key: 'vmId',
      width: 140,
      render: (v: string) => v ? <code className="text-xs text-text-secondary">{v}</code> : <span className="text-text-secondary/60">—</span>,
    },
    {
      title: 'Cron expression',
      dataIndex: 'cronExpression',
      key: 'cronExpression',
      ellipsis: true,
      render: (c: string) => c ? <code className="text-xs text-text-secondary bg-background px-2 py-0.5 rounded border border-border">{c}</code> : '—',
    },
    {
      title: 'Keep / memory snapshot',
      key: 'retain',
      width: 180,
      render: (_: unknown, r: SnapshotPolicy) => (
        <div className="flex items-center gap-2">
          <span className="text-text-secondary tabular-nums">{r.retention ?? '—'}</span>
          {r.snapshotMemory ? <Tag color="purple" className="m-0">Memory</Tag> : null}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (v: boolean | number) => (
        v
          ? <Tag color="green" className="m-0">Enable</Tag>
          : <Tag color="red" className="m-0">Disable</Tag>
      ),
    },
    {
      title: 'Last execution',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (t?: string) => (
        <span className="text-xs text-text-secondary tabular-nums">{t || '—'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 140,
      align: 'center' as const,
      render: (_: unknown, record: SnapshotPolicy) => (
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

  const cronHelpContent = (
    <div className="space-y-1.5 py-1">
      {cronExamples.map((ex) => (
        <div key={ex.value} className="flex items-center gap-2 text-xs">
          <Tag color="blue" className="m-0">{ex.value}</Tag>
          <span className="text-text-secondary">{ex.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Snapshot Policy</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage VM automatic snapshot policies — Cron schedule, retention count, memory snapshot, enable control
          </p>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Total Policies</div>
            <div className="text-xl font-semibold text-text-primary">{stats.total}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Enabled</div>
            <div className="text-xl font-semibold text-text-primary">{stats.enabled}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Memory Snapshot</div>
            <div className="text-xl font-semibold text-text-primary">{stats.memSnap}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Total Retention / Policy</div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">{stats.totalRetention}</div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search name..."
            prefix={<Search size={14} className="text-text-secondary" />}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
            allowClear
            style={{ width: 240 }}
          />

          <div className="flex items-center gap-1 p-1 rounded-md bg-background border border-border">
            {(['all', 'enabled', 'disabled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={
                  statusFilter === s
                    ? 'px-3 py-1 text-xs rounded bg-surface text-text-primary font-medium border border-border'
                    : 'px-3 py-1 text-xs rounded text-text-secondary hover:text-text-primary'
                }
              >
                {s === 'all' ? 'All' : s === 'enabled' ? 'Enabled' : 'Disabled'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button icon={<RefreshCw size={14} />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>New policy</Button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <Table<SnapshotPolicy>
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
            showTotal: (t) => `Total \${t} policies`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{
            emptyText: (
              <Empty
                description={search ? `No policies found matching "${search}"` : 'No snapshot policies'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>

      <Modal
        title={editing ? 'Edit policy' : 'New policy'}
        open={modalOpen}
        onOk={handleSave}
        okText={editing ? 'Save' : 'Create'}
        cancelText="Cancel"
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ retention: 7, snapshotMemory: false, enabled: true }}
          className="mt-2"
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g.: nightly-backup" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="platformId" label="Platform ID">
              <Input placeholder="e.g.: proxmox-cluster-1" />
            </Form.Item>
            <Form.Item name="vmId" label="VM ID">
              <Input placeholder="e.g.: vm-100" />
            </Form.Item>
          </div>
          <Form.Item
            label={
              <span className="flex items-center gap-1.5">
                Cron Expression
                <span className="text-text-secondary text-xs">(Hover for details)</span>
              </span>
            }
            name="cronExpression"
            tooltip={{
              title: cronHelpContent,
              color: '#1e293b',
              overlayInnerStyle: { maxWidth: 320 },
            }}
          >
            <Input placeholder="0 2 * * *" />
          </Form.Item>
          <Form.Item name="retention" label="Keep last N snapshots">
            <InputNumber min={1} max={30} className="w-full" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="snapshotMemory" label="Include memory snapshot" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="enabled" label="Enable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
