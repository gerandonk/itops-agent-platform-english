import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import {
  Card, Table, Tag, Button, Space, Typography, Modal, Form, Input, Select, InputNumber, Switch, message, Popconfirm, Descriptions as _Descriptions, Spin as _Spin,
} from 'antd';
import {
  PlusOutlined, CloudServerOutlined, PlayCircleOutlined, PauseCircleOutlined,
  ReloadOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import {
  fetchExternalStatus, registerExternalServer, startExternalServer,
  startAllExternalServers, stopExternalServer, unregisterExternalServer,
  type ExternalServer, type ExternalServerConfig,
} from '../api';

const { Title, Text } = Typography;

const stateIconMap: Record<string, React.ReactNode> = {
  connected: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  connecting: <SyncOutlined spin style={{ color: '#1890ff' }} />,
  reconnecting: <SyncOutlined spin style={{ color: '#faad14' }} />,
  disconnected: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const stateLabelMap: Record<string, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  error: 'Error',
};

const ExternalServers: React.FC = () => {
  const [servers, setServers] = useState<ExternalServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServers();
  }, []);

  async function loadServers() {
    setLoading(true);
    try {
      const s = await fetchExternalStatus();
      setServers(s.servers || []);
    } catch (err) {
      logger.error('Failed to load external servers', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(id: string) {
    try {
      await startExternalServer(id);
      message.success('Started');
      loadServers();
    } catch (err: unknown) {
      message.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Start failed');
    }
  }

  async function handleStartAll() {
    try {
      const result = await startAllExternalServers();
      const ok = result.results.filter((r) => r.success).length;
      message.success(`\${ok}/\${result.results.length} servers started successfully`);
      loadServers();
    } catch {
      message.error('Start failed');
    }
  }

  async function handleStop(id: string) {
    try {
      await stopExternalServer(id);
      message.success('Stopped');
      loadServers();
    } catch {
      message.error('Stop failed');
    }
  }

  async function handleDelete(id: string) {
    try {
      await unregisterExternalServer(id);
      message.success('Unregistered');
      loadServers();
    } catch {
      message.error('Unregistration failed');
    }
  }

  async function handleAdd() {
    try {
      const values = await form.validateFields();
      setAddLoading(true);
      const config: ExternalServerConfig = {
        id: values.id,
        name: values.name,
        transport: values.transport,
        namespace: values.namespace,
        description: values.description,
        autoReconnect: values.autoReconnect ?? true,
        maxReconnectAttempts: values.maxReconnectAttempts ?? 5,
        reconnectIntervalMs: values.reconnectIntervalMs ?? 3000,
      };
      if (values.transport === 'sse') {
        config.sse = { url: values.sseUrl };
        if (values.authHeader) {
          config.sse.headers = { Authorization: values.authHeader };
        }
      } else {
        config.stdio = {
          command: values.command,
          args: values.args ? values.args.split(' ').filter(Boolean) : [],
        };
      }
      await registerExternalServer(config);
      message.success('Registration successful');
      setAddOpen(false);
      form.resetFields();
      loadServers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('Registration failed');
    } finally {
      setAddLoading(false);
    }
  }

  const columns = [
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      width: 80,
      render: (state: string) => (
        <Space>
          {stateIconMap[state]}
          <Text>{stateLabelMap[state]}</Text>
        </Space>
      ),
    },
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: 'Namespaces',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 100,
      render: (ns: string) => <Tag>{ns}.*</Tag>,
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      key: 'transport',
      width: 70,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Tool count',
      dataIndex: 'tools',
      key: 'tools',
      width: 70,
      render: (n: number) => <Tag color="blue">{n}</Tag>,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 200,
      render: (_: unknown, record: ExternalServer) => (
        <Space size="small">
          {record.state === 'connected' ? (
            <Popconfirm title="Stop this server?" onConfirm={() => handleStop(record.id)}>
              <Button size="small" icon={<PauseCircleOutlined />}>Stop</Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)}>
              Start
            </Button>
          )}
          <Popconfirm title="Unregister this server? Its tools will be removed." onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}><CloudServerOutlined /> External MCP servers</Title>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Register Server
          </Button>
          <Button icon={<PlayCircleOutlined />} onClick={handleStartAll}>
            Start All
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadServers}>
            Refresh
          </Button>
        </div>
      </Card>

      <Table
        dataSource={servers}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No external MCP servers. Click "Register Server" to add one.' }}
      />

      <Modal
        title="Register external MCP server"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        confirmLoading={addLoading}
        okText="Register"
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ transport: 'sse', autoReconnect: true, maxReconnectAttempts: 5, reconnectIntervalMs: 3000 }}>
          <Form.Item name="id" label="Unique ID" rules={[{ required: true }]}>
            <Input placeholder="e.g. filesystem, keep, grafana" />
          </Form.Item>
          <Form.Item name="name" label="Display name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Filesystem MCP" />
          </Form.Item>
          <Form.Item name="namespace" label="Namespaces" rules={[{ required: true }]}>
            <Input placeholder="e.g. fs, keep, gfn" />
          </Form.Item>
          <Form.Item name="transport" label="Transport method" rules={[{ required: true }]}>
            <Select options={[
              { label: 'SSE (HTTP remote)', value: 'sse' },
              { label: 'stdio (local process)', value: 'stdio' },
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.transport !== cur.transport}>
            {({ getFieldValue }) =>
              getFieldValue('transport') === 'sse' ? (
                <>
                  <Form.Item name="sseUrl" label="SSE endpoint URL" rules={[{ required: true }]}>
                    <Input placeholder="http://localhost:8080/api/mcp/sse" />
                  </Form.Item>
                  <Form.Item name="authHeader" label="Authorization Header (Optional)">
                    <Input placeholder="Bearer YOUR_TOKEN" />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name="command" label="Command" rules={[{ required: true }]}>
                    <Input placeholder="npx" />
                  </Form.Item>
                  <Form.Item name="args" label="Arguments (space-separated)">
                    <Input placeholder="-y @modelcontextprotocol/server-filesystem /tmp" />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
          <Form.Item name="autoReconnect" label="Auto Reconnect" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="maxReconnectAttempts" label="Max Reconnect Attempts">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="reconnectIntervalMs" label="Reconnect Interval (ms)">
            <InputNumber min={1000} max={60000} step={1000} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExternalServers;