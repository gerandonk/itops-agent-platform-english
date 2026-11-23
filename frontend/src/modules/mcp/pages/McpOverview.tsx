import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, Statistic, Row, Col, Table, Tag, Space, Typography, Descriptions, Badge as _Badge, Spin, Input, Select, Tooltip } from 'antd';
import {
  ApiOutlined, ToolOutlined, SafetyOutlined, CloudServerOutlined,
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, ClockCircleOutlined,
  SearchOutlined, PlayCircleOutlined as _PlayCircleOutlined,
} from '@ant-design/icons';
import { fetchHealth, fetchManifest, fetchExternalStatus, callTool as _callTool } from '../api';
import type { McpHealth, McpTool, ExternalServer, ToolCallResult as _ToolCallResult } from '../api';

const { Title, Text, Paragraph: _Paragraph } = Typography;

const riskColorMap: Record<string, string> = {
  readonly: 'green',
  low: 'blue',
  medium: 'orange',
  high: 'red',
  destructive: '#ff4d4f',
};

const stateIconMap: Record<string, React.ReactNode> = {
  connected: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  connecting: <SyncOutlined spin style={{ color: '#1890ff' }} />,
  reconnecting: <SyncOutlined spin style={{ color: '#faad14' }} />,
  disconnected: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
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

const McpOverview: React.FC = () => {
  const [health, setHealth] = useState<McpHealth | null>(null);
  const [manifest, setManifest] = useState<McpTool[]>([]);
  const [servers, setServers] = useState<ExternalServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolSearch, setToolSearch] = useState('');
  const [toolDomainFilter, setToolDomainFilter] = useState<string | undefined>();
  const [toolRiskFilter, setToolRiskFilter] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [h, m, s] = await Promise.all([
        fetchHealth(),
        fetchManifest(),
        fetchExternalStatus(),
      ]);
      setHealth(h);
      setManifest(m.tools || []);
      setServers(s.servers || []);
    } catch (err) {
      logger.error('Failed to load MCP data', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const toolsByDomain = manifest.reduce((acc, t) => {
    const domain = (t.annotations)?.domain || 'other';
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const domains = Array.from(new Set(manifest.map(t => (t.annotations)?.domain).filter((d): d is string => !!d)));

  const filteredTools = manifest.filter(t => {
    if (toolSearch) {
      const s = toolSearch.toLowerCase();
      if (!t.name.toLowerCase().includes(s) && !t.description.toLowerCase().includes(s) && !(t.title || '').toLowerCase().includes(s)) return false;
    }
    if (toolDomainFilter && (t.annotations)?.domain !== toolDomainFilter) return false;
    if (toolRiskFilter && t.annotations?.riskLevel !== toolRiskFilter) return false;
    return true;
  });

  const externalConnected = servers.filter((s) => s.state === 'connected').length;
  const externalTools = servers.reduce((sum, s) => sum + s.tools, 0);

  const toolColumns = [
    {
      title: 'Tool name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => <Text code style={{ fontSize: 12 }}>{name}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (d: string) => <Tooltip title={d}><Text style={{ fontSize: 12 }}>{d}</Text></Tooltip>,
    },
    {
      title: 'Domain',
      key: 'domain',
      width: 110,
      render: (_: unknown, record: McpTool) => {
        const d = (record.annotations)?.domain;
        return d ? <Tag>{domainLabels[d] || d}</Tag> : '-';
      },
    },
    {
      title: 'Risk',
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
      width: 80,
      render: (_: unknown, record: McpTool) =>
        record.annotations?.readOnlyHint ? <Tag color="green">✓</Tag> : <Tag color="orange">✗</Tag>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <ApiOutlined /> MCP Service Overview
      </Title>

      {/* 状态卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="MCP service status"
              value={health?.status === 'healthy' ? 'Running' : 'Error'}
              prefix={health?.status === 'healthy'
                ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
              }
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {health?.protocol} · v{health?.server?.version}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={<><ToolOutlined /> Built-in tools</>}
              value={manifest.length}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Distributed across {domains.length} domains
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={<><CloudServerOutlined /> External Tools</>}
              value={externalTools}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {externalConnected}/{servers.length} external servers connected
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={<><SafetyOutlined /> Safe Mode</>}
              value="Read-only mode"
              valueStyle={{ color: '#52c41a', fontSize: 22 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              6 layers of security protection enabled
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 服务信息 */}
      <Card title="MCP Server info" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Server name">{health?.server?.name}</Descriptions.Item>
          <Descriptions.Item label="Protocol version">{health?.protocol}</Descriptions.Item>
          <Descriptions.Item label="Uptime">
            <ClockCircleOutlined /> {health?.uptime ? `${Math.floor(health.uptime / 60)} minutes` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Built-in tools">{manifest.length} available</Descriptions.Item>
          <Descriptions.Item label="External server">{servers.length} registered</Descriptions.Item>
          <Descriptions.Item label="Total tools">{manifest.length + externalTools}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 工具领域分布 + 外部服务器 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Tool domain distribution" size="small">
            <Space wrap>
              {Object.entries(toolsByDomain).map(([domain, count]) => (
                <Tag key={domain} color="blue">{domainLabels[domain] || domain}: {count}</Tag>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="External MCP servers" size="small">
            {servers.length === 0 ? (
              <Text type="secondary">No external MCP server connections — you can register stdio/sse type MCP servers on the "External server" page</Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {servers.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row items-center gap-2 sm:items-start sm:justify-between sm:gap-3">
                    <span className="flex items-center">
                      {stateIconMap[s.state]} <Text strong>{s.name}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>({s.namespace}.*)</Text>
                    </span>
                    <span className="flex items-center">
                      <Tag>{s.transport}</Tag>
                      <Tag color={s.state === 'connected' ? 'green' : 'default'}>
                        {s.tools} tools
                      </Tag>
                    </span>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* 内置工具列表 */}
      <Card
        title={<><ToolOutlined /> Built-in MCP Tools List ({filteredTools.length}/{manifest.length})</>}
        extra={
          <Space wrap className="!flex-wrap">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search tools..."
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              style={{ width: '100%', minWidth: 140 }}
              size="small"
              allowClear
            />
            <Select
              placeholder="Domain filter"
              value={toolDomainFilter}
              onChange={setToolDomainFilter}
              allowClear
              size="small"
              style={{ width: 130 }}
              options={domains.map(d => ({ label: domainLabels[d] || d, value: d }))}
            />
            <Select
              placeholder="Risk filter"
              value={toolRiskFilter}
              onChange={setToolRiskFilter}
              allowClear
              size="small"
              style={{ width: 100 }}
              options={[
                { label: 'Read-only', value: 'readonly' },
                { label: 'Low risk', value: 'low' },
                { label: 'Medium risk', value: 'medium' },
                { label: 'High risk', value: 'high' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={filteredTools}
          columns={toolColumns}
          rowKey="name"
          size="small"
          scroll={{ x: 'max-content', y: 400 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `Total ${total} tools` }}
        />
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
          <Text style={{ fontSize: 12, color: '#52c41a' }}>
            💡 <strong>How to call MCP tools:</strong>MCP tools are called via the JSON-RPC 2.0 protocol. Agents automatically select and call these tools during task execution. For detailed testing and invocation, please go to the
            <a href="/mcp/tools" style={{ marginLeft: 4 }}>"Tool browser"</a> or
            <a href="/mcp/tester" style={{ marginLeft: 4 }}>"Tool call test"</a> page.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default McpOverview;
