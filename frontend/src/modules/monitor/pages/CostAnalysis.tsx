import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tabs, Row, Col, Tag, Button, Spin, Empty, Statistic, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { AlertCircle, Zap, DollarSign, TrendingDown, TrendingUp, Package, Cpu } from 'lucide-react';
import api from '../../../lib/api';
import { getAxiosErrorMessage } from '../../../lib/errorHandler';

// ==================== 类型定义 ====================
interface ContainerCost {
  name: string;
  host: string;
  cpuCores: number;
  memoryMB: number;
  hourlyRate: number;
  dailyEstimate: number;
  monthlyEstimate: number;
}

interface VMCost {
  name: string;
  platform: string;
  cpuCores: number;
  memoryGB: number;
  diskGB: number;
  hourlyRate: number;
  monthlyEstimate: number;
}

interface Recommendation {
  id: string;
  type: 'idle' | 'downsize' | 'reserved';
  title: string;
  description: string;
  monthlySavings: number;
  resource: string;
}

interface CostSummary {
  containerMonthly: number;
  vmMonthly: number;
  totalMonthly: number;
  idleWaste: number;
}

// ==================== 费率常量 ====================
const RATE_CONTAINER_CPU = 0.05;    // ¥/核/小时
const RATE_CONTAINER_MEM = 0.005;   // ¥/MB/小时
const RATE_VM_CPU = 0.10;           // ¥/核/小时
const RATE_VM_MEM = 0.01;           // ¥/MB/小时
const RATE_VM_DISK = 0.0002;        // ¥/GB/小时

// ==================== 图标映射 ====================
const recommendationIcons: Record<string, React.ReactNode> = {
  idle: <AlertCircle size={28} className="text-orange-400" />,
  downsize: <Zap size={28} className="text-blue-400" />,
  reserved: <DollarSign size={28} className="text-green-400" />,
};

const recommendationColors: Record<string, string> = {
  idle: 'border-orange-500/30 bg-orange-500/5',
  downsize: 'border-blue-500/30 bg-blue-500/5',
  reserved: 'border-green-500/30 bg-green-500/5',
};

// ==================== 主组件 ====================
export default function CostAnalysis() {
  const [activeTab, setActiveTab] = useState('containers');
  const [loading, setLoading] = useState(false);

  const [containers, setContainers] = useState<ContainerCost[]>([]);
  const [vms, setVms] = useState<VMCost[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<CostSummary>({
    containerMonthly: 0, vmMonthly: 0, totalMonthly: 0, idleWaste: 0,
  });

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    try {
      // 后端返回 { success, data: { items, totalMonthly } }；axios 拦截器已解包
      const { data } = await api.get('/cost-analysis/containers');
      setContainers(data?.items || []);
    } catch (err: unknown) {
      message.error(`Failed to load container costs: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    } finally { setLoading(false); }
  }, []);

  const fetchVMs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cost-analysis/vms');
      setVms(data?.items || []);
    } catch (err: unknown) {
      message.error(`Failed to load VM costs: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    } finally { setLoading(false); }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cost-analysis/recommendations');
      setRecommendations(data?.items || []);
    } catch (err: unknown) {
      message.error(`Failed to load optimization recommendations: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    } finally { setLoading(false); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/cost-analysis/summary');
      setSummary(data || { containerMonthly: 0, vmMonthly: 0, totalMonthly: 0, idleWaste: 0 });
    } catch (err: unknown) {
      message.error(`Failed to load cost summary: ${getAxiosErrorMessage(err, 'Unknown error')}`);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, []);

  const refreshCurrentTab = () => {
    switch (activeTab) {
      case 'containers': fetchContainers(); break;
      case 'vms': fetchVMs(); break;
      case 'recommendations': fetchRecommendations(); break;
    }
  };

  useEffect(() => { refreshCurrentTab(); }, [activeTab]);

  // ==================== 表格列 ====================
  const containerColumns = [
    { title: 'Container name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Host', dataIndex: 'host', key: 'host', width: 140 },
    { title: 'CPU (cores)', dataIndex: 'cpuCores', key: 'cpuCores', width: 90, render: (v: number) => v?.toFixed(2) },
    { title: 'Memory (MB)', dataIndex: 'memoryMB', key: 'memoryMB', width: 100, render: (v: number) => v?.toFixed(0) },
    { title: 'Hourly rate', dataIndex: 'hourlyRate', key: 'hourlyRate', width: 110,
      render: (v: number) => `¥${(v || 0).toFixed(4)}` },
    { title: '24h estimate', dataIndex: 'dailyEstimate', key: 'dailyEstimate', width: 110,
      render: (v: number) => `¥${(v || 0).toFixed(2)}` },
    { title: '30-day estimate', dataIndex: 'monthlyEstimate', key: 'monthlyEstimate', width: 110,
      render: (v: number) => (
        <span className="font-medium text-blue-400">¥{(v || 0).toFixed(2)}</span>
      )},
    { title: 'Actions', key: 'actions', width: 80,
      render: () => <Button size="small" type="link">Details</Button> },
  ];

  const vmColumns = [
    { title: 'VM name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', width: 90 },
    { title: 'CPU (cores)', dataIndex: 'cpuCores', key: 'cpuCores', width: 90, render: (v: number) => v?.toFixed(2) },
    { title: 'Memory (GB)', dataIndex: 'memoryGB', key: 'memoryGB', width: 100, render: (v: number) => v?.toFixed(1) },
    { title: 'Disk (GB)', dataIndex: 'diskGB', key: 'diskGB', width: 100, render: (v: number) => v?.toFixed(0) },
    { title: 'Hourly rate', dataIndex: 'hourlyRate', key: 'hourlyRate', width: 110,
      render: (v: number) => `¥${(v || 0).toFixed(4)}` },
    { title: '30-day estimate', dataIndex: 'monthlyEstimate', key: 'monthlyEstimate', width: 110,
      render: (v: number) => (
        <span className="font-medium text-blue-400">¥{(v || 0).toFixed(2)}</span>
      )},
  ];

  // ==================== 汇总行 ====================
  const containerTotal = containers.reduce((sum, c) => sum + (c.monthlyEstimate || 0), 0);
  const vmTotal = vms.reduce((sum, v) => sum + (v.monthlyEstimate || 0), 0);
  const recommendationsTotalSavings = recommendations.reduce((sum, r) => sum + (r.monthlySavings || 0), 0);

  const containerFooter = () => (
    <div className="flex justify-end pr-4 py-1">
      <span className="text-slate-400 text-sm">Container Monthly Total:</span>
      <span className="font-bold text-blue-400 ml-2">¥{containerTotal.toFixed(2)}</span>
    </div>
  );

  const vmFooter = () => (
    <div className="flex justify-end pr-4 py-1">
      <span className="text-slate-400 text-sm">VM Monthly Total:</span>
      <span className="font-bold text-blue-400 ml-2">¥{vmTotal.toFixed(2)}</span>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <DollarSign size={28} className="text-green-400" />
          <h1 className="text-2xl font-bold text-white">Cost Analysis</h1>
        </div>
        <Button icon={<ReloadOutlined />} onClick={refreshCurrentTab}>Refresh</Button>
      </div>

      {/* 费率说明 */}
      <Card size="small" className="bg-slate-800/50 border-slate-700">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-400">
          <span>Container CPU:<span className="text-slate-300 font-mono">¥{RATE_CONTAINER_CPU}/core/h</span></span>
          <span>Container Memory:<span className="text-slate-300 font-mono">¥{RATE_CONTAINER_MEM}/MB/h</span></span>
          <span>VM CPU：<span className="text-slate-300 font-mono">¥{RATE_VM_CPU}/core/h</span></span>
          <span>VM Memory:<span className="text-slate-300 font-mono">¥{RATE_VM_MEM}/MB/h</span></span>
          <span>VM Disk:<span className="text-slate-300 font-mono">¥{RATE_VM_DISK}/GB/h</span></span>
        </div>
      </Card>

      {/* Stat card row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Estimated Container Monthly Cost</span>}
              value={summary.containerMonthly}
              precision={2}
              prefix={<Package size={16} className="text-blue-400 inline-block mr-1" />}
              suffix="¥"
              valueStyle={{ color: '#60a5fa', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Estimated VM Monthly Cost</span>}
              value={summary.vmMonthly}
              precision={2}
              prefix={<Cpu size={16} className="text-purple-400 inline-block mr-1" />}
              suffix="¥"
              valueStyle={{ color: '#a78bfa', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Total Monthly Cost</span>}
              value={summary.totalMonthly}
              precision={2}
              prefix={<TrendingUp size={16} className="text-green-400 inline-block mr-1" />}
              suffix="¥"
              valueStyle={{ color: '#34d399', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="bg-slate-800/50 border-slate-700">
            <Statistic
              title={<span className="text-slate-400 text-xs">Idle Resource Waste</span>}
              value={summary.idleWaste}
              precision={2}
              prefix={<TrendingDown size={16} className="text-orange-400 inline-block mr-1" />}
              suffix="¥"
              valueStyle={{ color: '#fb923c', fontSize: 24, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tab panels */}
      <Card className="bg-slate-800/50 border-slate-700">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'containers',
            label: 'Container cost',
            children: (
              <Spin spinning={loading}>
                {containers.length === 0 && !loading ? (
                  <Empty description="No container cost data" />
                ) : (
                  <Table
                    dataSource={containers}
                    columns={containerColumns}
                    rowKey="name"
                    size="small"
                    scroll={{ x: 1000 }}
                    footer={containerFooter}
                    pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total \${t} containers` }}
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'vms',
            label: 'VM cost',
            children: (
              <Spin spinning={loading}>
                {vms.length === 0 && !loading ? (
                  <Empty description="No VM cost data" />
                ) : (
                  <Table
                    dataSource={vms}
                    columns={vmColumns}
                    rowKey="name"
                    size="small"
                    scroll={{ x: 800 }}
                    footer={vmFooter}
                    pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total \${t} VMs` }}
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'recommendations',
            label: 'Optimization suggestions',
            children: (
              <Spin spinning={loading}>
                <div className="space-y-6">
                  {/* 优化建议列表 */}
                  {recommendations.length === 0 && !loading ? (
                    <Empty description="No optimization suggestions" />
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <Card
                          key={rec.id}
                          size="small"
                          className={`border ${recommendationColors[rec.type] || 'border-slate-700'} bg-slate-800/30`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {recommendationIcons[rec.type] || <AlertCircle size={28} className="text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between flex-wrap">
                                <h3 className="text-white font-medium text-sm">{rec.title}</h3>
                                <Tag color="green" className="text-xs">
                                  Monthly saving ¥{rec.monthlySavings?.toFixed(2)}
                                </Tag>
                              </div>
                              <p className="text-slate-400 text-xs mt-1">{rec.description}</p>
                              <div className="mt-2">
                                <Button size="small" type="link" className="p-0 h-auto text-xs">View details</Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* 汇总卡片 */}
                  <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
                    <div className="flex items-center justify-between flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <DollarSign size={20} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Total Potential Monthly Savings</p>
                          <p className="text-2xl font-bold text-green-400">
                            ¥{recommendationsTotalSavings.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Tag color="green" className="text-xs">
                        Total  {recommendations.length} optimization recommendations
                      </Tag>
                    </div>
                  </Card>
                </div>
              </Spin>
            ),
          },
        ]} />
      </Card>
    </div>
  );
}
