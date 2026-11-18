import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tabs, Row, Col, Tag, Button, Modal, Input, Select, InputNumber, Switch, Space, message, Spin, Empty, DatePicker, Statistic } from 'antd';
import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Server, Zap } from 'lucide-react';
import api from '../../../lib/api';
import type { ScaleRule, ScaleHistory, ScaleSummary } from '../api';

interface ScaleTarget {
  id: string;
  name: string;
  // 容器：仅 id/name
  // VM：额外有 platformId / platformName
  platformId?: string;
  platformName?: string;
  // k8s_deployment：额外有 namespace / contextId / contextName
  namespace?: string;
  contextId?: string;
  contextName?: string;
}

// ==================== 主组件 ====================
export default function AutoScale() {
  const [activeTab, setActiveTab] = useState('rules');
  const [loading, setLoading] = useState(false);

  // 规则
  const [rules, setRules] = useState<ScaleRule[]>([]);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<ScaleRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Partial<ScaleRule>>({});

  // 可选目标列表（依赖 targetType）
  const { data: targets = [], isLoading: targetsLoading } = useQuery<ScaleTarget[]>({
    queryKey: ['scale-targets', ruleForm.targetType],
    queryFn: async () => {
      if (!ruleForm.targetType) return [];
      const { data } = await api.get('/auto-scale/targets', { params: { type: ruleForm.targetType } });
      return (data?.data || data || []) as ScaleTarget[];
    },
    enabled: !!ruleForm.targetType,
  });

  const targetLabel = (t: ScaleTarget): string => {
    if (t.platformName) return `${t.platformName} / ${t.name}`;
    if (t.contextName) return `${t.contextName} / ${t.namespace} / ${t.name}`;
    return t.name;
  };

  // 历史
  const [history, setHistory] = useState<ScaleHistory[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(20);
  const [timeRange, setTimeRange] = useState<[string, string] | null>(null);

  // 统计
  const [summary, setSummary] = useState<ScaleSummary>({
    activeRules: 0, todayScaleUp: 0, todayScaleDown: 0, totalManagedInstances: 0,
  });

  // ==================== 数据获取 ====================
  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auto-scale/rules');
      setRules(data || []);
    } catch { message.error('Failed to get rule list'); }
    finally { setLoading(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: historyPage, pageSize: historyPageSize };
      if (timeRange) {
        params.startTime = timeRange[0];
        params.endTime = timeRange[1];
      }
      const { data } = await api.get('/auto-scale/history', { params });
      setHistory(data || []);
      setHistoryTotal(data.total || 0);
    } catch { message.error('Failed to get scaling history'); }
    finally { setLoading(false); }
  }, [historyPage, historyPageSize, timeRange]);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/auto-scale/summary');
      setSummary(data || { activeRules: 0, todayScaleUp: 0, todayScaleDown: 0, totalManagedInstances: 0 });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchRules(); fetchSummary(); }, []);
  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, historyPage, historyPageSize, timeRange]);

  // ==================== 规则表单操作 ====================
  const openCreateModal = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      targetType: 'container',
      targetId: '',
      targetName: '',
      metricType: 'cpu',
      threshold: 80,
      targetValue: 70,
      minInstances: 1,
      maxInstances: 10,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600,
      enabled: true,
    });
    setRuleModalVisible(true);
  };

  const openEditModal = (rule: ScaleRule) => {
    setEditingRule(rule);
    setRuleForm({ ...rule });
    setRuleModalVisible(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name || !ruleForm.threshold) {
      message.warning('Please fill in required fields');
      return;
    }
    try {
      if (editingRule) {
        await api.put(`/auto-scale/rules/${editingRule.id}`, ruleForm);
        message.success('Rule updated');
      } else {
        await api.post('/auto-scale/rules', ruleForm);
        message.success('Rule created');
      }
      setRuleModalVisible(false);
      fetchRules();
      fetchSummary();
    } catch { message.error('Failed to save'); }
  };

  const deleteRule = (rule: ScaleRule) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete rule "${rule.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await api.delete(`/auto-scale/rules/${rule.id}`);
          message.success('Rule deleted');
          fetchRules();
          fetchSummary();
        } catch { message.error('Failed to delete'); }
      },
    });
  };

  const toggleRule = async (rule: ScaleRule, checked: boolean) => {
    try {
      await api.put(`/auto-scale/rules/${rule.id}`, { ...rule, enabled: checked });
      message.success(checked ? 'Rule enabled' : 'Rule disabled');
      fetchRules();
    } catch { message.error('Operation failed'); }
  };

  // ==================== 表格列 ====================
  const ruleColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Target type', dataIndex: 'targetType', key: 'targetType', width: 110,
      render: (t: string) => {
        const cfg: Record<string, { color: string; label: string }> = {
          container: { color: 'blue', label: 'Container' },
          vm: { color: 'purple', label: 'VM' },
          k8s_deployment: { color: 'cyan', label: 'K8s Deployment' },
        };
        const c = cfg[t] || { color: 'default', label: t };
        return <Tag color={c.color}>{c.label}</Tag>;
      } },
    { title: 'Target identifier', dataIndex: 'targetName', key: 'targetName', width: 120, ellipsis: true },
    { title: 'Metric type', dataIndex: 'metricType', key: 'metricType', width: 110,
      render: (t: string) => ({
        cpu: 'CPU', memory: 'Memory', pod_count: 'Pod count', request_count: 'Request count',
      }[t] || t) },
    { title: 'Threshold', dataIndex: 'threshold', key: 'threshold', width: 70,
      render: (v: number) => `${v}%` },
    { title: 'Target value', dataIndex: 'targetValue', key: 'targetValue', width: 70,
      render: (v: number) => `${v}%` },
    { title: 'Min/Max', key: 'range', width: 100,
      render: (_: unknown, r: ScaleRule) => `${r.minInstances} / ${r.maxInstances}` },
    { title: 'Cooldown (s)', key: 'cooldown', width: 110,
      render: (_: unknown, r: ScaleRule) => `${r.scaleUpCooldown}s / ${r.scaleDownCooldown}s` },
    { title: 'Enable', dataIndex: 'enabled', key: 'enabled', width: 70,
      render: (v: boolean, record: ScaleRule) => (
        <Switch checked={v} size="small" onChange={(checked) => toggleRule(record, checked)} />
      )},
    { title: 'Actions', key: 'actions', width: 150, render: (_: unknown, record: ScaleRule) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>Edit</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteRule(record)}>Delete</Button>
      </Space>
    )},
  ];

  const historyColumns = [
    { title: 'Time', dataIndex: 'time', key: 'time', width: 170 },
    { title: 'Rule name', dataIndex: 'ruleName', key: 'ruleName', ellipsis: true },
    { title: 'Target', dataIndex: 'target', key: 'target', width: 140, ellipsis: true },
    { title: 'Actions', dataIndex: 'action', key: 'action', width: 80,
      render: (a: string) => (
        <Tag color={a === 'scale_up' ? 'green' : 'orange'} icon={a === 'scale_up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}>
          {a === 'scale_up' ? 'Scale out' : 'Scale in'}
        </Tag>
      )},
    { title: 'Before change', dataIndex: 'beforeCount', key: 'beforeCount', width: 70 },
    { title: 'After change', dataIndex: 'afterCount', key: 'afterCount', width: 70 },
    { title: 'Triggering metric value', dataIndex: 'metricValue', key: 'metricValue', width: 100,
      render: (v: number) => v?.toFixed(1) },
    { title: 'Result', dataIndex: 'result', key: 'result', width: 80,
      render: (r: string) => <Tag color={r === 'success' ? 'green' : 'red'}>{r === 'success' ? 'Success' : 'Failed'}</Tag> },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true },
  ];

  // ==================== 渲染 ====================
  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp size={28} className="text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Auto Scaling</h1>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => { if (activeTab === 'rules') fetchRules(); else fetchHistory(); }}>
          Refresh
        </Button>
      </div>

      {/* Stat card row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Active Rules</span>}
              value={summary.activeRules}
              prefix={<Zap size={16} className="text-yellow-400 inline-block mr-1" />}
              valueStyle={{ color: '#facc15', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Scale-outs Today</span>}
              value={summary.todayScaleUp}
              prefix={<ArrowUpRight size={16} className="text-green-400 inline-block mr-1" />}
              valueStyle={{ color: '#34d399', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Scale-ins Today</span>}
              value={summary.todayScaleDown}
              prefix={<ArrowDownRight size={16} className="text-orange-400 inline-block mr-1" />}
              valueStyle={{ color: '#fb923c', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Total Managed Instances</span>}
              value={summary.totalManagedInstances}
              prefix={<Server size={16} className="text-blue-400 inline-block mr-1" />}
              valueStyle={{ color: '#60a5fa', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tab panels */}
      <Card className="bg-slate-800/50 border-slate-700">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'rules',
            label: 'Scaling rule',
            children: (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Create Rule
                  </Button>
                </div>
                <Spin spinning={loading}>
                  {rules.length === 0 && !loading ? (
                    <Empty description="No scaling rules" />
                  ) : (
                    <Table
                      dataSource={rules}
                      columns={ruleColumns}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 1200 }}
                      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `\${t} rules total` }}
                    />
                  )}
                </Spin>
              </div>
            ),
          },
          {
            key: 'history',
            label: 'Scaling history',
            children: (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">Time Range:</span>
                  <DatePicker.RangePicker
                    showTime
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) {
                        setTimeRange([dates[0].toISOString(), dates[1].toISOString()]);
                      } else {
                        setTimeRange(null);
                      }
                    }}
                  />
                  {timeRange && (
                    <Button size="small" onClick={() => setTimeRange(null)}>Clear</Button>
                  )}
                </div>
                <Spin spinning={loading}>
                  {history.length === 0 && !loading ? (
                    <Empty description="No scaling history" />
                  ) : (
                    <Table
                      dataSource={history}
                      columns={historyColumns}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 1100 }}
                      pagination={{
                        current: historyPage,
                        pageSize: historyPageSize,
                        total: historyTotal,
                        showSizeChanger: true,
                        showTotal: (t) => `\${t} records total`,
                        onChange: (p, ps) => {
                          setHistoryPage(p);
                          setHistoryPageSize(ps);
                        },
                      }}
                    />
                  )}
                </Spin>
              </div>
            ),
          },
        ]} />
      </Card>

      {/* Create/edit rule modal */}
      <Modal
        title={editingRule ? 'Edit scaling rule' : 'Create scaling rule'}
        open={ruleModalVisible}
        onOk={saveRule}
        onCancel={() => setRuleModalVisible(false)}
        width={560}
        okText="Save"
        cancelText="Cancel"
      >
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Name:</span>
            <Input
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="Enter rule name"
              style={{ flex: 1 }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Target Type:</span>
            <Select
              value={ruleForm.targetType}
              onChange={(v) => setRuleForm({ ...ruleForm, targetType: v, targetId: '', targetName: '' })}
              options={[
                { label: 'Container', value: 'container' },
                { label: 'VM', value: 'vm' },
                { label: 'K8s Deployment', value: 'k8s_deployment' },
              ]}
              style={{ width: 200 }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Target:</span>
            <Select
              value={ruleForm.targetId || undefined}
              loading={targetsLoading}
              placeholder={
                !ruleForm.targetType
                  ? 'Please select target type first'
                  : targetsLoading
                  ? 'Loading...'
                  : targets.length === 0
                  ? 'No available targets'
                  : 'Select scaling target'
              }
              showSearch
              optionFilterProp="label"
              disabled={!ruleForm.targetType || targetsLoading || targets.length === 0}
              onChange={(v, option) => {
                const o = option as { id: string; name: string; label: string };
                setRuleForm({ ...ruleForm, targetId: o.id, targetName: o.name });
              }}
              options={targets.map(t => ({ value: t.id, label: targetLabel(t), ...t }))}
              style={{ flex: 1 }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Metric Type:</span>
            <Select
              value={ruleForm.metricType}
              onChange={(v) => setRuleForm({ ...ruleForm, metricType: v })}
              options={[
                { label: 'CPU', value: 'cpu' },
                { label: 'Memory', value: 'memory' },
                { label: 'Pod count', value: 'pod_count' },
                { label: 'Requests (QPS)', value: 'request_count' },
              ]}
              style={{ width: 200 }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Threshold (%):</span>
            <InputNumber
              value={ruleForm.threshold}
              onChange={(v) => setRuleForm({ ...ruleForm, threshold: v || 0 })}
              min={1}
              max={100}
              style={{ width: 120 }}
              addonAfter="%"
            />
            <span className="text-slate-500 text-xs">Metric percentage that triggers scaling</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Target Value (%):</span>
            <InputNumber
              value={ruleForm.targetValue}
              onChange={(v) => setRuleForm({ ...ruleForm, targetValue: v || 0 })}
              min={1}
              max={100}
              style={{ width: 120 }}
              addonAfter="%"
            />
            <span className="text-slate-500 text-xs">Target value after scaling</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Min Instances:</span>
            <InputNumber
              value={ruleForm.minInstances}
              onChange={(v) => setRuleForm({ ...ruleForm, minInstances: v || 1 })}
              min={1}
              max={100}
              style={{ width: 120 }}
            />
            <span className="text-slate-300 w-16 text-right text-sm">Max:</span>
            <InputNumber
              value={ruleForm.maxInstances}
              onChange={(v) => setRuleForm({ ...ruleForm, maxInstances: v || 1 })}
              min={1}
              max={100}
              style={{ width: 120 }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Scale-out Cooldown (s):</span>
            <InputNumber
              value={ruleForm.scaleUpCooldown}
              onChange={(v) => setRuleForm({ ...ruleForm, scaleUpCooldown: v || 300 })}
              min={0}
              max={3600}
              style={{ width: 120 }}
              addonAfter="s"
            />
            <span className="text-slate-300 w-16 text-right text-sm">Scale-in:</span>
            <InputNumber
              value={ruleForm.scaleDownCooldown}
              onChange={(v) => setRuleForm({ ...ruleForm, scaleDownCooldown: v || 600 })}
              min={0}
              max={3600}
              style={{ width: 120 }}
              addonAfter="s"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300 w-24 text-right text-sm">Enabled:</span>
            <Switch
              checked={ruleForm.enabled}
              onChange={(v) => setRuleForm({ ...ruleForm, enabled: v })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
