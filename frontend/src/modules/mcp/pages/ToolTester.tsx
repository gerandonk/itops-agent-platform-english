import React, { useState } from 'react';
import { Card, Input, Button, Typography, Select, Space, Tag, message, Table as _Table, Tabs as _Tabs } from 'antd';
import { SendOutlined, HistoryOutlined, CodeOutlined as _CodeOutlined } from '@ant-design/icons';
import { callTool, fetchManifest } from '../api';
import type { McpTool, ToolCallResult } from '../api';
import { getAxiosErrorMessage } from '@/lib/errorHandler';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ToolProperty {
  default?: unknown;
  type?: string;
  [key: string]: unknown;
}

const ToolTester: React.FC = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [allTools, setAllTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | undefined>();
  const [args, setArgs] = useState('{}');
  const [result, setResult] = useState<ToolCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ tool: string; args: string; result: ToolCallResult; time: number }>>([]);

  React.useEffect(() => {
    fetchManifest().then((m) => {
      setAllTools(m.tools || []);
      setTools(m.tools || []);
    }).catch((err: unknown) => {
      message.error(getAxiosErrorMessage(err, 'Failed to get tool list'));
    });
  }, []);

  function handleToolChange(name: string) {
    setSelectedTool(name);
    setResult(null);
    const tool = allTools.find((t) => t.name === name);
    if (tool) {
      const required: string[] = tool.inputSchema?.required || [];
      const props = tool.inputSchema?.properties || {};
      const defaultArgs: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(props)) {
        const p = prop as ToolProperty;
        if (p.default !== undefined) {
          defaultArgs[key] = p.default;
        } else if (required.includes(key)) {
          defaultArgs[key] = p.type === 'number' ? 0 : '';
        }
      }
      setArgs(JSON.stringify(defaultArgs, null, 2));
    }
  }

  async function handleCall() {
    if (!selectedTool) {
      message.warning('Please select a tool');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const parsedArgs = JSON.parse(args);
      const res = await callTool(selectedTool, parsedArgs);
      setResult(res);
      setHistory((prev) => [{
        tool: selectedTool!,
        args,
        result: res,
        time: Date.now(),
      }, ...prev].slice(0, 20));
    } catch (err: unknown) {
      setResult({
        content: [{ type: 'text', text: `Call failed: \${getAxiosErrorMessage(err)}` }],
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  const tool = allTools.find((t) => t.name === selectedTool);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}><SendOutlined /> Tool call test</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap style={{ gap: 8 }}>
            <Select
              showSearch
              placeholder="Select tool..."
              value={selectedTool}
              onChange={handleToolChange}
              style={{ width: '100%', maxWidth: 320, minWidth: 200 }}
              filterOption={(input, option) =>
                (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
              }
              options={tools.map((t) => ({
                label: t.name,
                value: t.name,
                search: `${t.name} ${t.title || ''} ${t.description}`,
              }))}
            />
            {tool && (
              <Tag color={tool.annotations?.readOnlyHint ? 'green' : 'orange'}>
                {tool.annotations?.readOnlyHint ? 'READONLY' : 'WRITE'}
              </Tag>
            )}
          </Space>

          {tool && (
            <Paragraph type="secondary">{tool.description}</Paragraph>
          )}

          <Text strong>Parameters (JSON):</Text>
          <TextArea
            rows={8}
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            style={{ fontFamily: 'monospace' }}
            placeholder='{"param": "value"}'
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleCall}
            loading={loading}
            disabled={!selectedTool}
            size="large"
            block
          >
            Invoke Tool
          </Button>
        </Space>
      </Card>

      {result && (
        <Card
          title={result.isError ? 'Call failed' : 'Call successful'}
          style={{ borderColor: result.isError ? '#ff4d4f' : '#52c41a' }}
        >
          <pre style={{
            maxHeight: 400, overflow: 'auto', background: result.isError ? '#fff2f0' : '#f6ffed',
            padding: 16, borderRadius: 8, fontSize: 13, margin: 0,
            border: `1px solid ${result.isError ? '#ffccc7' : '#b7eb8f'}`,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result.content?.map((c) => c.text).join('\n') || JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      {history.length > 0 && (
        <Card title={<><HistoryOutlined /> Invocation History</>} style={{ marginTop: 16 }}>
          {history.map((h, i) => (
            <div key={i} style={{
              padding: '8px 0', borderBottom: i < history.length - 1 ? '1px solid #f0f0f0' : 'none',
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 0 }}>
                <Text strong>{h.tool}</Text>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {new Date(h.time).toLocaleTimeString()}
                </Text>
                <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0' }}>
                  {h.args.substring(0, 80)}{h.args.length > 80 ? '...' : ''}
                </Paragraph>
              </div>
              <Tag color={h.result.isError ? 'red' : 'green'}>
                {h.result.isError ? 'Failed' : 'Success'}
              </Tag>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default ToolTester;