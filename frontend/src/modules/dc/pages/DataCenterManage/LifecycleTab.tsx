import { Tag, Space, Table, Select, Button } from 'antd';
import { Search, Clock as _Clock } from 'lucide-react';
import type useDataCenter from './useDataCenter';
import { actionColors } from './types';
import type { LifecycleRecord } from './types';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function LifecycleTab({ dc }: Props) {
  const lifecycleColumns = [
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: 'Action', dataIndex: 'action', key: 'action', render: (v: string) => (
        <Tag color={actionColors[v] || 'default'}>
          {v === 'mounted' ? 'Install' : v === 'unmounted' ? 'Uninstall' : v === 'moved' ? 'Migrate' : v === 'maintenance' ? 'Maintain' : v}
        </Tag>
      )
    },
    { title: 'Device type', dataIndex: 'device_type', key: 'device_type', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Source location', dataIndex: 'from_location', key: 'from_location', render: (v: string) => v !== 'N/A' ? v : '-' },
    { title: 'Target location', dataIndex: 'to_location', key: 'to_location', render: (v: string) => v !== 'N/A' ? v : '-' },
    { title: 'Operator', dataIndex: 'performed_by', key: 'performed_by' },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <Space className="mb-4">
        <Select
          placeholder="Action filter"
          allowClear
          style={{ width: 130 }}
          value={dc.lifecycleFilter || undefined}
          onChange={(v: string) => dc.setLifecycleFilter(v || '')}
        >
          <Select.Option value="mounted">Install</Select.Option>
          <Select.Option value="unmounted">Uninstall</Select.Option>
          <Select.Option value="moved">Migrate</Select.Option>
          <Select.Option value="maintenance">Maintain</Select.Option>
        </Select>
        <Button icon={<Search size={14} />} onClick={dc.loadLifecycles}>Refresh</Button>
      </Space>
      <Table columns={lifecycleColumns} dataSource={dc.lifecycles.map((l: LifecycleRecord) => ({ ...l, key: l.id }))}
        pagination={{ pageSize: 50 }} scroll={{ x: 800 }} loading={dc.lifecyclesLoading} />
    </div>
  );
}