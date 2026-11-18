import { Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, Table, InputNumber } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import type useDataCenter from './useDataCenter';
import { deviceTypeColors } from './types';
import type { PDU, Rack } from './types';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function PDUManagement({ dc }: Props) {
  const pduColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={deviceTypeColors[v] || 'default'}>{v === 'pdu' ? 'PDU' : v === 'ups' ? 'UPS' : v}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => {
      const c = v === 'active' ? 'green' : v === 'warning' ? 'orange' : v === 'error' ? 'red' : 'default';
      return <Tag color={c}>{v === 'active' ? 'Running normally' : v === 'warning' ? 'Alert' : v === 'error' ? 'Fault' : v}</Tag>;
    }},
    { title: 'Cabinet location', dataIndex: 'rack_name', key: 'rack_name', render: (v: string) => v || 'Unassigned' },
    { title: 'Rated power (W)', dataIndex: 'power_capacity_w', key: 'power_capacity_w', render: (v: number) => v ? `${v}W` : '-' },
    { title: 'Current load (W)', dataIndex: 'current_load_w', key: 'current_load_w', render: (v: number) => v !== null && v !== undefined ? `${v}W` : '-' },
    { title: 'Input voltage (V)', dataIndex: 'input_voltage', key: 'input_voltage', render: (v: number) => v ? `${v}V` : '-' },
    { title: 'IP address', dataIndex: 'ip_address', key: 'ip_address', render: (v: string) => v || '-' },
    {
      title: 'Actions', key: 'action', render: (_: unknown, rec: PDU) => (
        <Space>
          <Button type="link" size="small" icon={<Edit size={14} />}
            onClick={() => { dc.setEditingPdu(rec); dc.pduForm.setFieldsValue(rec); dc.setPduModalOpen(true); }}>Edit</Button>
          <Popconfirm title="Confirm delete?" onConfirm={() => dc.deletePdu(rec.id)}>
            <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <>
      <Table columns={pduColumns} dataSource={dc.pdus.map((p: PDU) => ({ ...p, key: p.id }))}
        pagination={false} scroll={{ x: 1000 }} loading={dc.pdusLoading} />

      <Modal
        title={dc.editingPdu ? 'Edit PDU/UPS' : 'Add PDU/UPS'}
        open={dc.pduModalOpen}
        onOk={dc.savePdu}
        onCancel={() => { dc.setPduModalOpen(false); dc.setEditingPdu(null); dc.pduForm.resetFields(); }}
        okText="Save"
        cancelText="Cancel"
        width={640}
      >
        <Form form={dc.pduForm} layout="vertical" size="small">
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}><Input /></Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select><Select.Option value="pdu">PDU</Select.Option><Select.Option value="ups">UPS</Select.Option></Select>
            </Form.Item>
          </Space>
          <Form.Item name="rack_id" label="Cabinet location">
            <Select placeholder="Select cabinet (optional)..." allowClear>
              {dc.racks.map((r: Rack) => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="active">
            <Select><Select.Option value="active">Running normally</Select.Option><Select.Option value="warning">Alert</Select.Option><Select.Option value="error">Fault</Select.Option></Select>
          </Form.Item>
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="power_capacity_w" label="Rated power (W)"><InputNumber min={0} step={100} className="w-full" /></Form.Item>
            <Form.Item name="current_load_w" label="Current load (W)"><InputNumber min={0} step={10} className="w-full" /></Form.Item>
            <Form.Item name="input_voltage" label="Input voltage (V)"><InputNumber min={0} step={10} className="w-full" /></Form.Item>
          </Space>
          <Form.Item name="output_sockets" label="Outlet count"><InputNumber min={0} step={1} className="w-full" /></Form.Item>
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="model" label="Model"><Input /></Form.Item>
            <Form.Item name="ip_address" label="IP address"><Input /></Form.Item>
            <Form.Item name="snmp_community" label="SNMP community"><Input /></Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}