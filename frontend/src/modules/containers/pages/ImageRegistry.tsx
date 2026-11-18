/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, Button, Modal, Tag, Space as _Space, message, Form, Input, Select, Popconfirm, Row, Col, Table, Typography, Empty } from 'antd';
import { Plus, Trash2, RefreshCw, Wifi, Package, ExternalLink } from 'lucide-react';
import api from '../../../lib/api';

const registryTypeLabels: Record<string, { label: string; color: string }> = {
  harbor: { label: 'Harbor', color: 'blue' },
  dockerhub: { label: 'DockerHub', color: 'volcano' },
  acr: { label: 'ACR', color: 'purple' },
  generic: { label: 'Generic', color: 'default' },
};

interface Registry {
  id: string;
  name: string;
  type: string;
  url?: string;
  username?: string;
  status?: string;
}

interface RegistryImage {
  project?: string;
  repository?: string;
  tag?: string;
  size?: string;
  pushed_at?: string;
  pull_count?: number;
  vulnerabilities?: number;
}

export default function ImageRegistry() {
  const [registries, setRegistries] = useState<Registry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Registry | null>(null);
  const [form] = Form.useForm();
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRegistry, setCurrentRegistry] = useState<Registry | null>(null);
  const [images, setImages] = useState<RegistryImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/registries');
      setRegistries(data || []);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/registries/${editing.id}`, values);
        message.success('Updated successfully');
      } else {
        await api.post('/registries', values);
        message.success('Added successfully');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch { message.error('Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/registries/${id}`); message.success('Deleted successfully'); fetchData(); } catch { message.error('Failed to delete'); }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      await api.post(`/registries/${id}/test`);
      message.success('Connection test succeeded');
    } catch { message.error('Connection test failed'); }
    finally { setTestingId(null); }
  };

  const openDetail = async (registry: Registry) => {
    setCurrentRegistry(registry);
    setDetailVisible(true);
    setImagesLoading(true);
    try {
      const { data } = await api.get(`/registries/${registry.id}/images`);
      setImages(data || []);
    } catch { message.error('Failed to get image list'); setImages([]); }
    finally { setImagesLoading(false); }
  };

  const imageColumns = [
    { title: 'Project', dataIndex: 'project', key: 'project' },
    { title: 'Repository', dataIndex: 'repository', key: 'repository', ellipsis: true },
    { title: 'Tags', dataIndex: 'tag', key: 'tag', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Push time', dataIndex: 'pushed_at', key: 'pushed_at' },
    { title: 'Pull count', dataIndex: 'pull_count', key: 'pull_count' },
    {
      title: 'Vulnerability count', dataIndex: 'vulnerabilities', key: 'vulnerabilities',
      render: (v: number) => {
        if (v === undefined || v === null) return <Tag>Not scanned</Tag>;
        if (v === 0) return <Tag color="green">0</Tag>;
        if (v <= 3) return <Tag color="orange">{v}</Tag>;
        return <Tag color="red">{v}</Tag>;
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Button icon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>Add repository</Button>
      </div>

      {registries.length === 0 && !loading ? (
        <Empty description="No image repositories" />
      ) : (
        <Row gutter={[16, 16]}>
          {registries.map((reg) => {
            const typeInfo = registryTypeLabels[reg.type] || { label: reg.type, color: 'default' };
            return (
              <Col key={reg.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  className="cursor-pointer"
                  onClick={() => openDetail(reg)}
                  actions={[
                    <Button type="link" size="small" icon={<Wifi size={14} />} loading={testingId === reg.id} onClick={(e) => { e.stopPropagation(); handleTestConnection(reg.id); }}>Test Connection</Button>,
                    <Popconfirm key="del" title="Confirm delete?" onConfirm={(e) => { e?.stopPropagation(); handleDelete(reg.id); }} onCancel={(e) => { e?.stopPropagation(); }}>
                      <Button type="link" size="small" danger icon={<Trash2 size={14} />} onClick={(e) => e.stopPropagation()}>Delete</Button>
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    avatar={<Package size={28} className="text-blue-500" />}
                    title={<span className="text-base">{reg.name}</span>}
                    description={
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-2">
                          <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          <Tag color={reg.status === 'active' ? 'green' : 'default'}>{reg.status || 'unknown'}</Tag>
                        </div>
                        {reg.url && (
                          <Typography.Text type="secondary" ellipsis className="text-xs">
                            <ExternalLink size={10} className="inline mr-1" />{reg.url}
                          </Typography.Text>
                        )}
                      </div>
                    }
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal title="Add repository" open={modalOpen} onOk={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); }} width={480}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Select repository type">
              <Select.Option value="harbor">Harbor</Select.Option>
              <Select.Option value="dockerhub">DockerHub</Select.Option>
              <Select.Option value="acr">ACR</Select.Option>
              <Select.Option value="generic">Generic</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="url" label="URL"><Input placeholder="https://registry.example.com" /></Form.Item>
          <Form.Item name="username" label="Username"><Input /></Form.Item>
          <Form.Item name="password" label="Password"><Input.Password /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${currentRegistry?.name || ''} - Image List`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {currentRegistry && (
          <div className="mb-3 flex items-center gap-2">
            <Tag color={registryTypeLabels[currentRegistry.type]?.color}>{registryTypeLabels[currentRegistry.type]?.label || currentRegistry.type}</Tag>
            {currentRegistry.url && <Typography.Text type="secondary" className="text-sm">{currentRegistry.url}</Typography.Text>}
          </div>
        )}
        <Table columns={imageColumns} dataSource={images} rowKey={(r: RegistryImage) => `${r.project}-${r.repository}-${r.tag}`} loading={imagesLoading} pagination={false} size="small" />
      </Modal>
    </div>
  );
}
