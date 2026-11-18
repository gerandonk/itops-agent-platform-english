import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Typography, Input, Select, Tooltip as _Tooltip, Button, Modal, Descriptions } from 'antd';
import { SearchOutlined, ToolOutlined, SafetyOutlined as _SafetyOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { fetchManifest, callTool } from '../api';
import type { McpTool, ToolCallResult } from '../api';
import { getErrorMessage } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

const { Title, Text, Paragraph } = Typography;

const riskColorMap: Record<string, string> = {
  readonly: 'green',
  low: 'blue',
  medium: 'orange',
  high: 'red',
  destructive: 'red',
};

const domainLabels: Record<string, string> = {
  alert_handling: 'Alert handling',
  server_operation: 'Server operations',
  network_inspection: 'Network inspection',
  system_inspection: 'System Inspection',
  change_execution: 'Change execution',
  database_operation: 'Database operations',
  document_generation: 'Doc generation',
  compliance_check: 'Compliance check',
};

const ToolBrowser: React.FC = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | undefined>();
  const [riskFilter, setRiskFilter] = useState<string | undefined>();
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testArgs, setTestArgs] = useState('{}');
  const [testResult, setTestResult] = useState<ToolCallResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  async function loadTools() {
    setLoading(true);
    try {
      const m = await fetchManifest();
      setTools(m.tools || []);
    } catch (err) {
      logger.error('Failed to load tools', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTools = useMemo(() => {
    let result = tools;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(s) ||
          (t.title || '').toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s)
      );
    }
    if (domainFilter) {
      result = result.filter((t) => t.annotations?.domain === domainFilter);
    }
    if (riskFilter) {
      result = result.filter((t) => t.annotations?.riskLevel === riskFilter);
    }
    return result;
  }, [tools, search, domainFilter, riskFilter]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => {
      const d = t.annotations?.domain;
      if (d) set.add(d);
    });
    return Array.from(set);
  }, [tools]);

  async function handleTest() {
    if (!selectedTool) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const args = JSON.parse(testArgs);
      const result = await callTool(selectedTool.name, args);
      setTestResult(result);
    } catch (err: unknown) {
      setTestResult({
        content: [{ type: 'text', text: `Parameter parsing error: \${getErrorMessage(err)}` }],
        isError: true,
      });
    } finally {
      setTestLoading(false);
    }
  }

  const columns = [
    {
      title: 'Tool name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: McpTool) => (
        <a onClick={() => { setSelectedTool(record); setDetailOpen(true); }}>
          <ToolOutlined style={{ marginRight: 6 }} />
          {name}
        </a>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (t: string) => t || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 280,
    },
    {
      title: 'Domain',
      key: 'domain',
      width: 100,
      render: (_: unknown, record: McpTool) => {
        const d = record.annotations?.domain;
        return d ? <Tag>{domainLabels[d] || d}</Tag> : '-';
      },
    },
    {
      title: 'Risk level',
      key: 'risk',
      width: 80,
      render: (_: unknown, record: McpTool) => {
        const risk = record.annotations?.riskLevel || 'readonly';
        return <Tag color={riskColorMap[risk]}>{risk}</Tag>;
      },
    },
    {
      title: 'Read-only',
      key: 'readOnly',
      width: 60,
      render: (_: unknown, record: McpTool) =>
        record.annotations?.readOnlyHint ? <Tag color="green">✓</Tag> : <Tag color="orange">✗</Tag>,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 80,
      render: (_: unknown, record: McpTool) => (
        <Button
          type="link"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => { setSelectedTool(record); setTestArgs('{}'); setTestResult(null); setTestOpen(true); }}
        >
          Test
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}><ToolOutlined /> MCP Tool Browser</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search tool name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            placeholder="Filter by domain"
            value={domainFilter}
            onChange={setDomainFilter}
            allowClear
            style={{ width: 160 }}
            options={domains.map((d) => ({ label: domainLabels[d] || d, value: d }))}
          />
          <Select
            placeholder="Filter by risk"
            value={riskFilter}
            onChange={setRiskFilter}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: 'Read-only', value: 'readonly' },
              { label: 'Low risk', value: 'low' },
              { label: 'Medium risk', value: 'medium' },
              { label: 'High risk', value: 'high' },
            ]}
          />
          <Text type="secondary">Total  {filteredTools.length} tools</Text>
        </Space>
      </Card>

      <Table
        dataSource={filteredTools}
        columns={columns}
        rowKey="name"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false }}
        size="small"
      />

      {/* 工具详情 */}
      <Modal
        title={selectedTool?.name}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {selectedTool && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Title">{selectedTool.title || '-'}</Descriptions.Item>
            <Descriptions.Item label="Description">{selectedTool.description}</Descriptions.Item>
            <Descriptions.Item label="Risk level">
              <Tag color={riskColorMap[selectedTool.annotations?.riskLevel || 'readonly']}>
                {selectedTool.annotations?.riskLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Read-only">
              {selectedTool.annotations?.readOnlyHint ? 'Yes' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Parameter schema">
              <pre style={{ maxHeight: 300, overflow: 'auto', background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 6, fontSize: 12 }}>
                {JSON.stringify(selectedTool.inputSchema?.properties || {}, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 工具测试 */}
      <Modal
        title={`Test: \${selectedTool?.name}`}
        open={testOpen}
        onCancel={() => setTestOpen(false)}
        onOk={handleTest}
        confirmLoading={testLoading}
        okText="Invoke"
        width={700}
      >
        <Paragraph type="secondary">{selectedTool?.description}</Paragraph>
        <Text strong>Parameters (JSON):</Text>
        <Input.TextArea
          rows={6}
          value={testArgs}
          onChange={(e) => setTestArgs(e.target.value)}
          style={{ fontFamily: 'monospace', marginTop: 8, marginBottom: 16 }}
        />
        {testResult && (
          <div>
            <Text strong>Result:</Text>
            <pre style={{
              maxHeight: 300, overflow: 'auto', background: testResult.isError ? '#fff2f0' : '#f6ffed',
              padding: 12, borderRadius: 6, fontSize: 12, marginTop: 8,
              border: `1px solid ${testResult.isError ? '#ffccc7' : '#b7eb8f'}`,
            }}>
              {testResult.content?.map((c, _i) => c.text || JSON.stringify(c)).join('\n') || JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ToolBrowser;