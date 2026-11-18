import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, FileText as _FileText } from 'lucide-react';
import api from '../../../lib/api';

interface ConfigTemplate {
  id: string;
  name: string;
  type: string;
  target_type: string;
  version: number;
  tags?: string | string[];
  content: string;
  variables?: string | string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

const typeColors: Record<string, string> = {
  generic: 'default', nginx: 'blue', apache: 'cyan', docker: 'teal', kubernetes: 'purple', database: 'orange', monitoring: 'green', system: 'volcano',
};

export default function ConfigTemplates() {
  const [data, setData] = useState<ConfigTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [editing, setEditing] = useState<ConfigTemplate | null>(null);
  const [form] = Form.useForm();
  const [variables, setVariables] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 后端返回 { success, data: { items, total } }；axios 拦截器已解包 → data = { items, total }
      const { data: result } = await api.get('/config-templates', { params: { page, pageSize, search, type: typeFilter } });
      setData(result?.items || []);
      setTotal(result?.total || 0);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, typeFilter]);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/config-templates/${editing.id}`, { ...values, variables });
        message.success('Updated successfully');
      } else {
        await api.post('/config-templates', { ...values, variables });
        message.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      setVariables([]);
      fetchData();
    } catch { message.error('Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/config-templates/${id}`); message.success('Deleted successfully'); fetchData(); } catch { message.error('Failed to delete'); }
  };

  const handlePreview = async (id: string) => {
    try {
      const vars: Record<string, string> = {};
      variables.forEach(v => { vars[v] = `{{${v}}}`; });
      const { data } = await api.post(`/config-templates/${id}/render`, { variables: vars });
      setPreviewContent(data?.rendered || '');
      setPreviewOpen(true);
    } catch { message.error('Preview failed'); }
  };

  const openEdit = (record: ConfigTemplate) => {
    setEditing(record);
    const vars = typeof record.variables === 'string' ? JSON.parse(record.variables || '[]') : (record.variables || []);
    setVariables(vars);
    form.setFieldsValue({ ...record, tags: typeof record.tags === 'string' ? JSON.parse(record.tags || '[]') : (record.tags || []) });
    setModalOpen(true);
  };

  const addVariable = () => { setVariables([...variables, '']); };
  const removeVariable = (idx: number) => { setVariables(variables.filter((_, i) => i !== idx)); };
  const updateVariable = (idx: number, val: string) => { const v = [...variables]; v[idx] = val; setVariables(v); };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={typeColors[t] || 'default'}>{t}</Tag> },
    { title: 'Target type', dataIndex: 'target_type', key: 'target_type' },
    { title: 'Version', dataIndex: 'version', key: 'version' },
    { title: 'Tags', dataIndex: 'tags', key: 'tags', render: (t: string) => {
      const tags = typeof t === 'string' ? JSON.parse(t || '[]') : (t || []);
      return tags.map((tag: string) => <Tag key={tag}>{tag}</Tag>);
    }},
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', width: 170 },
    { title: 'Actions', key: 'action', width: 200, render: (_: unknown, record: ConfigTemplate) => (
      <Space>
        <Button type="link" size="small" icon={<Eye size={14} />} onClick={() => handlePreview(record.id)}>Preview</Button>
        <Button type="link" size="small" icon={<Edit size={14} />} onClick={() => openEdit(record)}>Edit</Button>
        <Popconfirm title="Confirm delete?" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Input placeholder="Search templates..." prefix={<Search size={14} className="text-gray-400" />} className="w-64" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }} allowClear />
        <Select placeholder="Type filter" className="w-32" value={typeFilter || undefined} onChange={(v: string) => { setTypeFilter(v || ''); setPage(1); }} allowClear>
          <Select.Option value="generic">General</Select.Option>
          <Select.Option value="nginx">Nginx</Select.Option>
          <Select.Option value="docker">Docker</Select.Option>
          <Select.Option value="database">Database</Select.Option>
        </Select>
        <Button icon={<RefreshCw size={14} />} onClick={fetchData}>Refresh</Button>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); form.resetFields(); setVariables([]); setModalOpen(true); }}>New Template</Button>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps); } }}
      />

      <Modal title={editing ? 'Edit config template' : 'New config template'} open={modalOpen} onOk={handleSave} onCancel={() => { setModalOpen(false); setEditing(null); setVariables([]); }} width={700}>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="type" label="Type"><Select>
              <Select.Option value="generic">General</Select.Option>
              <Select.Option value="nginx">Nginx</Select.Option>
              <Select.Option value="docker">Docker</Select.Option>
              <Select.Option value="database">Database</Select.Option>
              <Select.Option value="monitoring">Monitoring</Select.Option>
            </Select></Form.Item>
          </div>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="content" label="Template content"><Input.TextArea rows={8} className="font-mono text-sm" placeholder="Use {{variable_name}} as variable placeholder" /></Form.Item>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-tertiary">Variable List</span>
              <Button size="small" icon={<Plus size={12} />} onClick={addVariable}>Add Variable</Button>
            </div>
            {variables.map((v, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <Input size="small" placeholder="Variable name" value={v} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariable(i, e.target.value)} className="w-48" />
                <Button size="small" danger icon={<Trash2 size={12} />} onClick={() => removeVariable(i)} />
              </div>
            ))}
          </div>
          <Form.Item name="tags" label="Tags"><Select mode="tags" placeholder="Press Enter after typing a tag" /></Form.Item>
          {editing && <Button icon={<Eye size={14} />} onClick={() => handlePreview(editing.id)}>Preview Current Template</Button>}
        </Form>
      </Modal>

      <Modal title="Template preview" open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={700}>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap">{previewContent}</pre>
      </Modal>
    </div>
  );
}
