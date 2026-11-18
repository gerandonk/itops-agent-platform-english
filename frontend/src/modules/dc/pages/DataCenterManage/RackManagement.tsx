import { Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, Table, InputNumber, Badge } from 'antd';
import { Edit, Trash2, LayoutGrid, Search } from 'lucide-react';
import type useDataCenter from './useDataCenter';
import type { Rack, Room } from './types';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function RackManagement({ dc }: Props) {
  const filteredRacks = dc.racks.filter((r: Rack) =>
    (!dc.rackSearch || r.name?.toLowerCase().includes(dc.rackSearch.toLowerCase())) &&
    (!dc.rackStatusFilter || r.status === dc.rackStatusFilter)
  );

  const rackColumns = [
    {
      title: 'Number', dataIndex: 'name', key: 'name', render: (v: string, r: Rack) => (
        <Space>
          <span>{v}</span>
          {r.status === 'warning' && <Tag color="orange" style={{ fontSize: 10 }}>⚠️</Tag>}
        </Space>
      )
    },
    { title: 'Data center', dataIndex: 'room_name', key: 'room_name' },
    { title: 'Row number', dataIndex: 'row_number', key: 'row_number' },
    { title: 'U position', dataIndex: 'total_u', key: 'total_u' },
    {
      title: 'Used', key: 'used_u', render: (_: unknown, r: Rack) => {
        const pct = r.total_u > 0 ? Math.round(((r.used_u || 0) / r.total_u) * 100) : 0;
        const barColor = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-700 rounded-full">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs">{r.used_u || 0}/{r.total_u || 42}</span>
          </div>
        );
      }
    },
    { title: 'Device count', dataIndex: 'device_count', key: 'device_count' },
    {
      title: 'Alert', key: 'alerts', render: (_: unknown, r: Rack) => {
        const ac = dc.rackAlertMap[r.id] || 0;
        return ac > 0 ? <Badge count={ac} size="small"><span className="text-red-400">🚨</span></Badge> : <span className="text-text-tertiary">-</span>;
      }
    },
    {
      title: 'Actions', key: 'action', render: (_: unknown, rec: Rack) => (
        <Space>
          <Button type="link" size="small" icon={<LayoutGrid size={14} />}
            onClick={() => { dc.setActiveTab('slots'); setTimeout(() => dc.selectRack(rec), 100); }}>U position</Button>
          <Button type="link" size="small" icon={<Edit size={14} />}
            onClick={() => { dc.setEditingRack(rec); dc.rackForm.setFieldsValue(rec); dc.setRackModalOpen(true); }}>Edit</Button>
          <Popconfirm title="Confirm delete?" onConfirm={() => dc.deleteRack(rec.id)}>
            <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  const rackTableData = filteredRacks.map((r: Rack) => {
    const room = dc.rooms.find((rm: Room) => rm.id === r.room_id);
    return { ...r, key: r.id, room_name: room?.name || room?.label || r.room_id };
  });

  return (
    <>
      <div>
        <Space className="mb-4">
          <Input
            prefix={<Search size={14} className="text-text-tertiary" />}
            placeholder="Search cabinet number..."
            value={dc.rackSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => dc.setRackSearch(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <Select
            placeholder="Status filter"
            allowClear
            style={{ width: 120 }}
            value={dc.rackStatusFilter || undefined}
            onChange={(v: string) => dc.setRackStatusFilter(v || '')}
          >
            <Select.Option value="normal">Normal</Select.Option>
            <Select.Option value="warning">Warning</Select.Option>
            <Select.Option value="critical">Critical</Select.Option>
          </Select>
        </Space>
        <Table columns={rackColumns} dataSource={rackTableData} loading={dc.loading} pagination={false} scroll={{ x: 900 }} />
      </div>

      <Modal
        title={dc.editingRack ? 'Edit cabinet' : 'Add cabinet'}
        open={dc.rackModalOpen}
        onOk={dc.saveRack}
        onCancel={() => { dc.setRackModalOpen(false); dc.setEditingRack(null); dc.rackForm.resetFields(); }}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={dc.rackForm} layout="vertical" size="small">
          <Form.Item name="name" label="Cabinet number" rules={[{ required: true, message: 'Please enter cabinet number' }]}>
            <Input placeholder="e.g.: A01" />
          </Form.Item>
          <Form.Item name="room_id" label="Data center" rules={[{ required: true, message: 'Please select data center' }]}>
            <Select placeholder="Select data center...">
              {dc.rooms.map((r: Room) => (
                <Select.Option key={r.id} value={r.id}>{r.name || r.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="row_number" label="Row number">
            <InputNumber min={1} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="total_u" label="U count" rules={[{ required: true, message: 'Please enter U count' }]}>
            <InputNumber min={1} max={100} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="sort_order" label="Sort">
            <InputNumber min={0} step={1} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}