import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Row, Col, Select, Divider } from 'antd';
import { Group } from 'lucide-react';
import api from '../../../lib/api';

const { Title, Text } = Typography;

interface ClusterConfig {
  id: string;
  name: string;
  mode: 'disabled' | 'merge' | 'split';
}

export default function Grouping() {
  const [form] = Form.useForm();
  const [clusters, setClusters] = useState<ClusterConfig[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch current configuration
  const fetchConfig = async () => {
    try {
      const response = await api.get('/settings/grouping');
      if (response.data?.config) {
        setClusters(response.data.config);
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to fetch grouping config');
    }
  };

  React.useEffect(() => {
    fetchConfig();
  }, []);

  const handleAddCluster = () => {
    const newCluster: ClusterConfig = {
      id: `cluster-${Date.now()}`,
      name: '',
      mode: 'disabled',
    };
    setClusters([...clusters, newCluster]);
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.post('/settings/grouping', { config: clusters });
      message.success('Grouping configuration saved successfully');
    } catch (err: any) {
      message.error(err.message || 'Failed to save grouping config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={2}>
        <Group /> Agent Grouping &amp; Federation
      </Title>
      <Text type="secondary">
        Configure agents into clusters and define whether to merge members from multiple sources or split them.
      </Text>

      <Divider />

      <Card title="Cluster Configuration" size="small">
        <Form labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
          {clusters.map((cluster, idx) => (
            <Form.Item
              key={cluster.id}
              label={`Cluster ${idx + 1}`}
              name={`cluster_${idx}`}
              required
              style={{ marginBottom: 12 }}
            >
              <Space wrap style={{ width: '100%' }} align="start" className="flex-wrap">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Input
                    placeholder="Cluster name"
                    style={{ width: '100%', maxWidth: 200 }}
                    value={cluster.name}
                    onChange={(e) => {
                      const updated = [...clusters];
                      updated[idx].name = e.target.value;
                      setClusters(updated);
                    }}
                  />
                </div>

                <Select
                  value={cluster.mode}
                  style={{ width: '100%', maxWidth: 150 }}
                  onChange={(val) => {
                    const updated = [...clusters];
                    updated[idx].mode = val;
                    setClusters(updated);
                  }}
                >
                  <Select.Option value="disabled">Disabled</Select.Option>
                  <Select.Option value="merge">Use First (merge)</Select.Option>
                  <Select.Option value="split">Auto-split</Select.Option>
                </Select>
              </Space>
            </Form.Item>
          ))}

              <Form.Item wrapperCol={{ span: 24 }}>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddCluster} type="dashed">
                + Add Another Cluster
              </Button>
              <Button onClick={fetchConfig} disabled={saving}>
                Reset
              </Button>
              <Button type="primary" onClick={handleUpdate} loading={saving}>
                Save Configuration
              </Button>
            </div>
          </Form.Item>
        </Form>

        <Divider orientation="left" style={{ fontSize: 12, marginTop: 24 }}>
          How It Works
        </Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Disabled</Text> — groups are ignored, all agents appear in the default list.
          </div>
          <div>
            <Text strong>Use First (merge)</Text> — the first cluster in the order that contains an agent is used.
          </div>
          <div>
            <Text strong>Auto-split</Text> — agents are distributed based on their initial group.
          </div>
        </Space>
      </Card>
    </div>
  );
}
