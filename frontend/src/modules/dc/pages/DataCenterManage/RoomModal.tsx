import { Modal, Form, Input, Space, InputNumber } from 'antd';
import type useDataCenter from './useDataCenter';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

/**
 * Room add/edit modal — dirender di level halaman (index.tsx) agar tombol
 * "Add Room" berfungsi di semua tab, bukan hanya tab "Data center".
 */
export default function RoomModal({ dc }: Props) {
  return (
    <Modal
      title={dc.editingRoom ? 'Edit data center' : 'Add data center'}
      open={dc.roomModalOpen}
      onOk={dc.saveRoom}
      onCancel={() => { dc.setRoomModalOpen(false); dc.setEditingRoom(null); dc.roomForm.resetFields(); }}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={dc.roomForm} layout="vertical" size="small">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter data center name' }]}>
          <Input placeholder="e.g.: Bldg-A-2F" />
        </Form.Item>
        <Form.Item name="label" label="Tags">
          <Input placeholder="Optional alias" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Optional description" />
        </Form.Item>
        <Space className="w-full" style={{ display: 'flex' }}>
          <Form.Item name="width_m" label="Width (m)"><InputNumber min={1} step={1} /></Form.Item>
          <Form.Item name="depth_m" label="Depth (m)"><InputNumber min={1} step={1} /></Form.Item>
          <Form.Item name="sort_order" label="Sort"><InputNumber min={0} step={1} /></Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}