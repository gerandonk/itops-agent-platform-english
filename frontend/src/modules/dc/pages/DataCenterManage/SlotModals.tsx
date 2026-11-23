import { Button, Modal, Form, Input as _Input, Select, Tag, Popconfirm, InputNumber } from 'antd';
import { ArrowUpDown, Trash2 } from 'lucide-react';
import type useDataCenter from './useDataCenter';
import { deviceTypeColors } from './types';
import type { DeviceSummary } from './types';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function SlotModals({ dc }: Props) {
  return (
    <>
      {/* 分配 U 位 Modal */}
      <Modal
        title={`Assign Device - ${dc.selectedRack?.name || ''}`}
        open={dc.slotModalOpen}
        onOk={dc.assignSlot}
        onCancel={() => { dc.setSlotModalOpen(false); dc.slotForm.resetFields(); }}
        okText="Assign"
        cancelText="Cancel"
        afterOpenChange={(open) => { if (open) dc.fetchAvailDevices(); }}
      >
        <Form form={dc.slotForm} layout="vertical" size="small">
          <Form.Item name="device_id" label="Select device" rules={[{ required: true, message: 'Please select device' }]}>
            <Select placeholder="Select a device to assign to this cabinet..." showSearch filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            } onChange={(value) => {
              const selected = dc.availDevices.find(d => d.id === value);
              if (selected) {
                dc.slotForm.setFieldsValue({ device_type: selected.device_type });
              }
            }}>
              {dc.availDevices.map((d: DeviceSummary) => (
                <Select.Option key={d.id} value={d.id}
                  label={`${d.name || d.device_name || 'Unnamed'} (${d.device_type || '?'})`}>
                  <div className="flex justify-between">
                    <span>{d.name || d.device_name || 'Unnamed'}</span>
                    <Tag color={deviceTypeColors[d.device_type || ''] || 'default'} className="text-[10px]">
                      {d.device_type}
                    </Tag>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="device_type" noStyle>
            <input type="hidden" />
          </Form.Item>
          <Form.Item name="start_u" label="Starting U position" rules={[{ required: true, message: 'Please enter starting U position' }]}>
            <InputNumber min={1} max={dc.selectedRack?.total_u || 42} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="end_u" label="Ending U position" rules={[{ required: true, message: 'Please enter ending U position' }]}>
            <InputNumber min={1} max={dc.selectedRack?.total_u || 42} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="position_face" label="Orientation" initialValue="front">
            <Select>
              <Select.Option value="front">Front</Select.Option>
              <Select.Option value="rear">Rear</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设备操作 Modal（下架/移位） */}
      <Modal
        title="Device operations"
        open={dc.deviceActionModal}
        onCancel={() => { dc.setDeviceActionModal(false); dc.setSelectedSlot(null); }}
        footer={[
          <Button key="move" icon={<ArrowUpDown size={14} />} onClick={() => {
            dc.setDeviceActionModal(false);
            dc.moveForm.resetFields();
            dc.moveForm.setFieldsValue({
              rack_id: dc.selectedSlot?.rack_id,
              start_u: dc.selectedSlot?.start_u,
              end_u: dc.selectedSlot?.end_u,
              position_face: dc.selectedSlot?.position_face || 'front',
            });
            dc.setMoveModalOpen(true);
          }}>
            Relocate
          </Button>,
          <Popconfirm key="remove" title="Uninstall this device?" onConfirm={dc.confirmRemoveSlot}>
            <Button danger icon={<Trash2 size={14} />}>Uninstall</Button>
          </Popconfirm>,
          <Button key="cancel" onClick={() => { dc.setDeviceActionModal(false); dc.setSelectedSlot(null); }}>Cancel</Button>,
        ]}
      >
        {dc.selectedSlot && (
          <div className="text-sm space-y-2">
            <p><span className="text-text-secondary">Device:</span> {dc.selectedSlot.device_name || '(unnamed)'}</p>
            <p><span className="text-text-secondary">Type:</span> {dc.selectedSlot.device_type}</p>
            <p><span className="text-text-secondary">U Position:</span> U{dc.selectedSlot.start_u}-U{dc.selectedSlot.end_u}</p>
            {dc.selectedSlot.ip_address && (
              <p><span className="text-text-secondary">IP:</span> {dc.selectedSlot.ip_address}</p>
            )}
          </div>
        )}
      </Modal>

      {/* 移位 Modal */}
      <Modal
        title="Move device"
        open={dc.moveModalOpen}
        onOk={dc.handleMove}
        onCancel={() => { dc.setMoveModalOpen(false); dc.moveForm.resetFields(); dc.setSelectedSlot(null); }}
        okText="Confirm move"
        cancelText="Cancel"
      >
        <Form form={dc.moveForm} layout="vertical" size="small">
          <Form.Item name="rack_id" label="Target cabinet" rules={[{ required: true, message: 'Please select cabinet' }]}>
            <Select placeholder="Select target cabinet..." showSearch filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }>
              {dc.racks.map(r => (
                <Select.Option key={r.id} value={r.id}
                  label={`${r.room_label || r.room_name || ''} - ${r.name}`}>
                  {r.room_label || r.room_name || ''} - {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="start_u" label="Starting U position" rules={[{ required: true, message: 'Please enter starting U position' }]}>
            <InputNumber min={1} max={100} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="end_u" label="Ending U position" rules={[{ required: true, message: 'Please enter ending U position' }]}>
            <InputNumber min={1} max={100} step={1} className="w-full" />
          </Form.Item>
          <Form.Item name="position_face" label="Orientation" initialValue="front">
            <Select><Select.Option value="front">Front</Select.Option><Select.Option value="rear">Rear</Select.Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}