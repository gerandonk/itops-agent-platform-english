import { Button, Form, Input, Select as _Select, Tag, Space, Popconfirm, Table, InputNumber } from 'antd';
import { Edit, Trash2, Search } from 'lucide-react';
import type useDataCenter from './useDataCenter';
import type { Room } from './types';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function RoomManagement({ dc }: Props) {
  const filteredRooms = dc.rooms.filter((r: Room) =>
    !dc.roomSearch ||
    r.name?.toLowerCase().includes(dc.roomSearch.toLowerCase()) ||
    r.label?.toLowerCase().includes(dc.roomSearch.toLowerCase())
  );

  const roomColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Tags', dataIndex: 'label', key: 'label', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Size', key: 'size', render: (_: unknown, r: Room) => `${r.width_m || 20}m × ${r.depth_m || 15}m` },
    { title: 'Sort', dataIndex: 'sort_order', key: 'sort_order' },
    {
      title: 'Actions', key: 'action', render: (_: unknown, rec: Room) => (
        <Space>
          <Button type="link" size="small" icon={<Edit size={14} />}
            onClick={() => { dc.setEditingRoom(rec); dc.roomForm.setFieldsValue(rec); dc.setRoomModalOpen(true); }}>Edit</Button>
          <Popconfirm title="Confirm delete?" onConfirm={() => dc.deleteRoom(rec.id)}>
            <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div>
      <Input
        prefix={<Search size={14} className="text-text-tertiary" />}
        placeholder="Search data center name/tag..."
        className="mb-4 max-w-xs"
        value={dc.roomSearch}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => dc.setRoomSearch(e.target.value)}
        allowClear
      />
      <Table columns={roomColumns} dataSource={filteredRooms.map((r: Room) => ({ ...r, key: r.id }))} loading={dc.loading} pagination={false} scroll={{ x: 800 }} />
    </div>
  );
}