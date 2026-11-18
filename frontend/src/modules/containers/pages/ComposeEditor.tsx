/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Tag, message, Drawer, Form, Input, Popconfirm, Empty } from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Play,
  Square,
  RotateCcw,
  Eye,
  FileText,
  Boxes,
} from 'lucide-react';
import api from '../../../lib/api';
import { containersApi } from '../api';

const statusColors: Record<string, string> = {
  running: 'green',
  stopped: 'red',
  error: 'orange',
  deploying: 'blue',
  partial: 'gold',
};
const statusLabel: Record<string, string> = {
  running: 'Running',
  stopped: 'Stopped',
  error: 'Error',
  deploying: 'Deploying',
  partial: 'Partially Running',
};

interface ComposeProject {
  id: string;
  name: string;
  description?: string;
  yaml_content?: string;
  status: string;
  service_count?: number;
  running_count?: number;
  updated_at?: string;
}

interface ComposeService {
  name: string;
  command?: string;
  state?: string;
  ports?: string;
  status?: string;
}

export default function ComposeEditor() {
  const [data, setData] = useState<ComposeProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComposeProject | null>(null);
  const [form] = Form.useForm();
  const [servicesDrawer, setServicesDrawer] = useState(false);
  const [servicesData, setServicesData] = useState<ComposeService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<ComposeProject | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await containersApi.listCompose({ page, pageSize, search });
      // 后端返回 { success, data: { items, total } }；axios 拦截器已解包后 result = { items, total }
      setData(result?.items || []);
      setTotal(result?.total || 0);
    } catch {
      message.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search]);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/compose/${editing.id}`, values);
        message.success('Updated successfully');
      } else {
        await api.post('/compose', values);
        message.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/compose/${id}`);
      message.success('Deleted successfully');
      fetchData();
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleAction = async (id: string, action: string, label: string) => {
    try {
      await api.post(`/compose/${id}/${action}`);
      message.success(`\${label} successful`);
      fetchData();
    } catch {
      message.error('Operation failed');
    }
  };

  const handleValidate = async () => {
    const yaml = form.getFieldValue('yaml_content');
    if (!yaml) {
      message.warning('Please enter YAML content');
      return;
    }
    setValidating(true);
    try {
      const { data } = await api.post('/compose/validate', { content: yaml });
      if (data.valid) {
        message.success('YAML syntax validation passed');
      } else {
        message.error(data.error || 'YAML syntax error');
      }
    } catch {
      message.error('Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const showServices = async (record: ComposeProject) => {
    setCurrentProject(record);
    setServicesDrawer(true);
    setServicesLoading(true);
    try {
      const result = await containersApi.listComposeServices(record.id);
      setServicesData(result || []);
    } catch {
      message.error('Failed to get service list');
      setServicesData([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const showLogs = async (record: ComposeProject) => {
    setCurrentProject(record);
    setLogModalOpen(true);
    setLogsLoading(true);
    try {
      const result = await containersApi.getComposeLogs(record.id, { tail: 100 });
      setLogs(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch {
      message.error('Failed to get logs');
      setLogs('');
    } finally {
      setLogsLoading(false);
    }
  };

  const openEdit = (record: ComposeProject) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  // ── 派生 ──
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((p) => p.status === statusFilter);
  }, [data, statusFilter]);

  const stats = useMemo(() => {
    let totalServices = 0;
    let totalRunning = 0;
    let runningProjects = 0;
    let errorProjects = 0;
    for (const p of data) {
      totalServices += p.service_count || 0;
      totalRunning += p.running_count || 0;
      if (p.status === 'running') runningProjects++;
      if (p.status === 'error') errorProjects++;
    }
    return { projects: data.length, totalServices, totalRunning, runningProjects, errorProjects };
  }, [data]);

  const columns = [
    {
      title: 'Project name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string, r: ComposeProject) => (
        <div>
          <div className="font-medium text-text-primary">{n}</div>
          {r.description && (
            <div className="text-xs text-text-secondary mt-0.5">{r.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'} className="m-0">
          {statusLabel[s] || s}
        </Tag>
      ),
    },
    {
      title: 'Service count',
      dataIndex: 'service_count',
      key: 'service_count',
      width: 100,
      render: (v: number) => <span className="text-text-secondary tabular-nums">{v ?? 0}</span>,
    },
    {
      title: 'Running count',
      dataIndex: 'running_count',
      key: 'running_count',
      width: 100,
      render: (v: number, r: ComposeProject) => {
        const total = r.service_count || 0;
        const running = v || 0;
        const allUp = total > 0 && running === total;
        return (
          <div className="flex items-center gap-2">
            <Tag color={allUp ? 'green' : running > 0 ? 'blue' : 'default'} className="m-0">
              {running}
            </Tag>
            <span className="text-xs text-text-secondary">/ {total}</span>
          </div>
        );
      },
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (t?: string) => (
        <span className="text-xs text-text-secondary tabular-nums">{t || '—'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 360,
      render: (_: unknown, record: ComposeProject) => (
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="link"
            size="small"
            icon={<Play size={14} />}
            style={{ color: '#10b981' }}
            onClick={() => handleAction(record.id, 'up', 'Start')}
          >
            Start
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Square size={14} />}
            onClick={() => handleAction(record.id, 'down', 'Stop')}
          >
            Stop
          </Button>
          <Button
            type="link"
            size="small"
            icon={<RotateCcw size={14} />}
            onClick={() => handleAction(record.id, 'restart', 'Restart')}
          >
            Restart
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Edit size={14} />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            icon={<Eye size={14} />}
            onClick={() => showServices(record)}
          >
            Services
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileText size={14} />}
            onClick={() => showLogs(record)}
          >
            Logs
          </Button>
          <Popconfirm
            title="Confirm delete?"
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<Trash2 size={14} />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const serviceColumns = [
    { title: 'Service name', dataIndex: 'name', key: 'name' },
    { title: 'Command', dataIndex: 'command', key: 'command', ellipsis: true },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (s: string) => (
        <Tag color={s === 'running' ? 'green' : s === 'exited' ? 'red' : 'default'}>{s}</Tag>
      ),
    },
    { title: 'Port', dataIndex: 'ports', key: 'ports' },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Compose Orchestration</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage Docker Compose projects — start, stop, restart, and view services and logs
          </p>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Total Projects</div>
            <div className="text-xl font-semibold text-text-primary">{stats.projects}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Running Projects</div>
            <div className="text-xl font-semibold text-text-primary">{stats.runningProjects}</div>
          </div>
        </div>
        <div className="bg-surface border border-border/60 rounded-xl p-4 flex items-center gap-3 transition-all hover:border-primary/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Services Running / Total</div>
            <div className="text-xl font-semibold text-text-primary tabular-nums">
              {stats.totalRunning}
              <span className="text-sm text-text-secondary font-normal">
                {' '}
                / {stats.totalServices}
              </span>
            </div>
          </div>
        </div>
        <div
          className={`rounded-xl p-4 flex items-center gap-3 transition-all border ${
            stats.errorProjects > 0
              ? 'bg-red-500/5 border-red-500/30'
              : 'bg-surface border-border/60 hover:border-primary/40 hover:shadow-sm'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              stats.errorProjects > 0
                ? 'bg-red-500/15 text-red-500'
                : 'bg-slate-500/10 text-slate-500'
            }`}
          >
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-text-secondary">Abnormal Projects</div>
            <div
              className={`text-xl font-semibold ${
                stats.errorProjects > 0 ? 'text-red-500' : 'text-text-primary'
              }`}
            >
              {stats.errorProjects}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search project name..."
            prefix={<Search size={14} className="text-text-secondary" />}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            allowClear
            style={{ width: 240 }}
          />

          <div className="flex items-center gap-2 ml-auto">
            <Button icon={<RefreshCw size={14} />} onClick={fetchData} loading={loading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditing(null);
                form.resetFields();
                setModalOpen(true);
              }}
            >
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <Table<ComposeProject>
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `\${t} projects total`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description={search ? `No projects found containing "${search}"` : 'No Compose projects'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </div>

      <Modal
        title={editing ? 'Edit project' : 'New project'}
        open={modalOpen}
        onOk={handleSave}
        okText={editing ? 'Save' : 'Create'}
        cancelText="Cancel"
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        width={720}
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item
            name="name"
            label="Project name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="e.g.: web-stack" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional project description" />
          </Form.Item>
          <Form.Item label="YAML orchestration" required>
            <div className="flex flex-col gap-2">
              <Form.Item
                name="yaml_content"
                noStyle
                rules={[{ required: true, message: 'Please enter YAML content' }]}
              >
                <Input.TextArea
                  rows={14}
                  placeholder="version: '3.8'\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - '80:80'"
                  style={{
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    background: '#1e293b',
                    color: '#e2e8f0',
                  }}
                />
              </Form.Item>
              <Button
                onClick={handleValidate}
                loading={validating}
                size="small"
                style={{ alignSelf: 'flex-start' }}
              >
                Validate syntax
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`Service List - ${currentProject?.name || ''}`}
        open={servicesDrawer}
        onClose={() => setServicesDrawer(false)}
        width={600}
      >
        <Table
          columns={serviceColumns}
          dataSource={servicesData}
          rowKey="name"
          loading={servicesLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="No services" /> }}
        />
      </Drawer>

      <Modal
        title={`Logs - ${currentProject?.name || ''}`}
        open={logModalOpen}
        onCancel={() => setLogModalOpen(false)}
        footer={null}
        width={800}
      >
        <pre
          className="font-mono text-xs bg-slate-900 text-cyan-400 p-4 rounded-lg max-h-[500px] overflow-auto whitespace-pre-wrap break-all m-0"
          style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
        >
          {logsLoading ? 'Loading...' : logs || 'No logs'}
        </pre>
      </Modal>
    </div>
  );
}
