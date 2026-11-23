import { Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, Table, InputNumber } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import type { useNetboxResources } from './useNetboxResources';
import type { Manufacturer, DeviceTypeInfo, PowerPanel, PowerFeed, Cable } from './types';

type DC = ReturnType<typeof useNetboxResources>;

export function ManufacturersTab({ dc }: { dc: DC }) {
  return (
    <>
      <Table
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Description', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
          { title: 'Model count', dataIndex: 'type_count', key: 'type_count' },
          {
            title: 'Actions', key: 'action', render: (_: unknown, rec: Manufacturer) => (
              <Space>
                <Button type="link" size="small" icon={<Edit size={14} />}
                  onClick={() => { dc.setEditingMfg(rec); dc.mfgForm.setFieldsValue(rec); dc.setMfgModalOpen(true); }}>Edit</Button>
                <Popconfirm title="Confirm delete?" onConfirm={() => dc.deleteMfg(rec.id)}>
                  <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
                </Popconfirm>
              </Space>
            )
          },
        ]}
        dataSource={(dc.manufacturers || []).map((m: Manufacturer) => ({ ...m, key: m.id }))}
        loading={dc.loading}
        pagination={false}
      />

      <Modal
        title={dc.editingMfg ? 'Edit manufacturer' : 'Add manufacturer'}
        open={dc.mfgModalOpen}
        onOk={dc.saveMfg}
        onCancel={() => { dc.setMfgModalOpen(false); dc.setEditingMfg(null); dc.mfgForm.resetFields(); }}
        okText="Save" cancelText="Cancel"
      >
        <Form form={dc.mfgForm} layout="vertical" size="small">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter manufacturer name' }]}>
            <Input placeholder="e.g.: Huawei, Cisco, Dell" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export function DeviceTypesTab({ dc }: { dc: DC }) {
  return (
    <>
      <Table
        columns={[
          { title: 'Model', dataIndex: 'model', key: 'model' },
          { title: 'Manufacturer', dataIndex: 'manufacturer_name', key: 'manufacturer_name' },
          { title: 'Type', dataIndex: 'device_type', key: 'device_type', render: (v: string) => <Tag>{v}</Tag> },
          { title: 'Height (U)', dataIndex: 'u_height', key: 'u_height' },
          { title: 'Instance count', dataIndex: 'instance_count', key: 'instance_count' },
          {
            title: 'Actions', key: 'action', render: (_: unknown, rec: DeviceTypeInfo) => (
              <Space>
                <Button type="link" size="small" icon={<Edit size={14} />}
                  onClick={() => { dc.setEditingDt(rec); dc.dtForm.setFieldsValue(rec as unknown as Parameters<typeof dc.dtForm.setFieldsValue>[0]); dc.setDtModalOpen(true); }}>Edit</Button>
                <Popconfirm title="Confirm delete?" onConfirm={() => dc.deleteDt(rec.id)}>
                  <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
                </Popconfirm>
              </Space>
            )
          },
        ]}
        dataSource={(dc.deviceTypes || []).map((t: DeviceTypeInfo) => ({ ...t, key: t.id }))}
        loading={dc.loading}
        pagination={false}
      />

      <Modal
        title={dc.editingDt ? 'Edit device model' : 'Add device model'}
        open={dc.dtModalOpen}
        onOk={dc.saveDt}
        onCancel={() => { dc.setDtModalOpen(false); dc.setEditingDt(null); dc.dtForm.resetFields(); }}
        okText="Save" cancelText="Cancel"
      >
        <Form form={dc.dtForm} layout="vertical" size="small">
          <Form.Item name="model" label="Model name" rules={[{ required: true, message: 'Please enter model' }]}>
            <Input placeholder="e.g.: USG6320, S5720-36C-EI" />
          </Form.Item>
          <Form.Item name="manufacturer_id" label="Manufacturer" rules={[{ required: true, message: 'Please select manufacturer' }]}>
            <Select placeholder="Select manufacturer...">
              {(dc.manufacturers || []).map((m: Manufacturer) => (
                <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="device_type" label="Device type" rules={[{ required: true }]}>
            <Select placeholder="Select type...">
              <Select.Option value="server">Server</Select.Option>
              <Select.Option value="network_device">Network device</Select.Option>
              <Select.Option value="storage">Storage Devices</Select.Option>
              <Select.Option value="pdu">PDU</Select.Option>
              <Select.Option value="ups">UPS</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="u_height" label="U height" rules={[{ required: true }]}>
            <InputNumber min={1} max={48} step={1} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export function PowerPanelsTab({ dc }: { dc: DC }) {
  return (
    <>
      <Table
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Data center', dataIndex: 'room_name', key: 'room_name' },
          { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
          { title: 'Phase', dataIndex: 'phase', key: 'phase' },
          { title: 'Voltage (V)', dataIndex: 'voltage', key: 'voltage' },
          { title: 'Feeder count', dataIndex: 'feed_count', key: 'feed_count' },
          {
            title: 'Actions', key: 'action', render: (_: unknown, rec: PowerPanel) => (
              <Space>
                <Button type="link" size="small" icon={<Edit size={14} />}
                  onClick={() => { dc.setEditingPp(rec); dc.ppForm.setFieldsValue(rec); dc.setPpModalOpen(true); }}>Edit</Button>
                <Popconfirm title="Confirm delete?" onConfirm={() => dc.deletePp(rec.id)}>
                  <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
                </Popconfirm>
              </Space>
            )
          },
        ]}
        dataSource={(dc.powerPanels || []).map((p: PowerPanel) => ({ ...p, key: p.id }))}
        loading={dc.loading}
        pagination={false}
      />

      <Modal
        title={dc.editingPp ? 'Edit power distribution cabinet' : 'Add power distribution cabinet'}
        open={dc.ppModalOpen}
        onOk={dc.savePp}
        onCancel={() => { dc.setPpModalOpen(false); dc.setEditingPp(null); dc.ppForm.resetFields(); }}
        okText="Save" cancelText="Cancel"
      >
        <Form form={dc.ppForm} layout="vertical" size="small">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g.: Bldg-A-2F-PDU-01" />
          </Form.Item>
          <Form.Item name="room_id" label="Data center">
            <Select placeholder="Select data center (optional)..." allowClear>
              {(dc.rooms || []).map(r => <Select.Option key={r.id} value={r.id}>{r.name || r.label}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select placeholder="Select type...">
              <Select.Option value="main">Main Power Distribution Cabinet</Select.Option>
              <Select.Option value="distribution">Distribution Cabinet</Select.Option>
              <Select.Option value="row">End-of-Row Cabinet</Select.Option>
            </Select>
          </Form.Item>
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="phase" label="Phase"><Select><Select.Option value="single">Single-phase</Select.Option><Select.Option value="three">Three-phase</Select.Option></Select></Form.Item>
            <Form.Item name="voltage" label="Voltage (V)"><InputNumber min={0} step={10} className="w-full" /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}

export function PowerFeedsTab({ dc }: { dc: DC }) {
  return (
    <>
      <Table
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Power distribution cabinet', dataIndex: 'panel_name', key: 'panel_name' },
          { title: 'Cabinet/Rack', dataIndex: 'rack_name', key: 'rack_name', render: (v: string) => v || 'Unassigned' },
          { title: 'Phase', dataIndex: 'phase', key: 'phase' },
          { title: 'Voltage (V)', dataIndex: 'voltage', key: 'voltage' },
          { title: 'Current (A)', dataIndex: 'amperage', key: 'amperage' },
          { title: 'Power (W)', dataIndex: 'max_power', key: 'max_power', render: (v: number) => v ? `${v}W` : '-' },
          {
            title: 'Actions', key: 'action', render: (_: unknown, rec: PowerFeed) => (
              <Space>
                <Button type="link" size="small" icon={<Edit size={14} />}
                  onClick={() => { dc.setEditingPf(rec); dc.pfForm.setFieldsValue(rec); dc.setPfModalOpen(true); }}>Edit</Button>
                <Popconfirm title="Confirm delete?" onConfirm={() => dc.deletePf(rec.id)}>
                  <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
                </Popconfirm>
              </Space>
            )
          },
        ]}
        dataSource={(dc.powerFeeds || []).map((f: PowerFeed) => ({ ...f, key: f.id }))}
        loading={dc.loading}
        pagination={false}
      />

      <Modal
        title={dc.editingPf ? 'Edit power feed' : 'Add power feed'}
        open={dc.pfModalOpen}
        onOk={dc.savePf}
        onCancel={() => { dc.setPfModalOpen(false); dc.setEditingPf(null); dc.pfForm.resetFields(); }}
        okText="Save" cancelText="Cancel"
      >
        <Form form={dc.pfForm} layout="vertical" size="small">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="e.g.: A-01 power feed" />
          </Form.Item>
          <Form.Item name="power_panel_id" label="Power distribution cabinet" rules={[{ required: true, message: 'Please select power distribution cabinet' }]}>
            <Select placeholder="Select power distribution cabinet...">
              {(dc.powerPanels || []).map((p: PowerPanel) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="rack_id" label="Target cabinet">
            <Select placeholder="Select cabinet (optional)..." allowClear>
              {(dc.racks || []).map(r => <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="feed_type" label="Type">
              <Select>
                <Select.Option value="primary">Main Path</Select.Option>
                <Select.Option value="redundant">Redundant</Select.Option>
                <Select.Option value="single">Single Path</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="supply" label="Power feed type">
              <Select>
                <Select.Option value="ac">AC</Select.Option>
                <Select.Option value="dc">DC</Select.Option>
              </Select>
            </Form.Item>
          </Space>
          <Space className="w-full" style={{ display: 'flex' }}>
            <Form.Item name="voltage" label="Voltage (V)"><InputNumber min={0} step={10} className="w-full" /></Form.Item>
            <Form.Item name="amperage" label="Current (A)"><InputNumber min={0} step={1} className="w-full" /></Form.Item>
            <Form.Item name="max_utilization_pct" label="Max utilization (%)"><InputNumber min={0} max={100} step={5} className="w-full" /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}

export function CablesTab({ dc }: { dc: DC }) {
  return (
    <>
      <Table
        columns={[
          { title: 'Tags', dataIndex: 'label', key: 'label' },
          { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => {
            const c = v === 'connected' ? 'green' : v === 'planned' ? 'blue' : 'default';
            return <Tag color={c}>{v}</Tag>;
          }},
          { title: 'Device A', dataIndex: 'a_device_name', key: 'a_device_name' },
          { title: 'Device B', dataIndex: 'b_device_name', key: 'b_device_name' },
          { title: 'Length (m)', dataIndex: 'length_m', key: 'length_m', render: (v: number) => v ? `${v}m` : '-' },
          {
            title: 'Actions', key: 'action', render: (_: unknown, rec: Cable) => (
              <Space>
                <Button type="link" size="small" icon={<Edit size={14} />}
                  onClick={() => { dc.setEditingCable(rec); dc.cableForm.setFieldsValue(rec as unknown as Parameters<typeof dc.cableForm.setFieldsValue>[0]); dc.setCableModalOpen(true); }}>Edit</Button>
                <Popconfirm title="Confirm delete?" onConfirm={() => dc.deleteCable(rec.id)}>
                  <Button type="link" size="small" danger icon={<Trash2 size={14} />}>Delete</Button>
                </Popconfirm>
              </Space>
            )
          },
        ]}
        dataSource={(dc.cables || []).map((c: Cable) => ({ ...c, key: c.id }))}
        loading={dc.loading}
        pagination={false}
      />

      <Modal
        title={dc.editingCable ? 'Edit cable' : 'Add cable'}
        open={dc.cableModalOpen}
        onOk={dc.saveCable}
        onCancel={() => { dc.setCableModalOpen(false); dc.setEditingCable(null); dc.cableForm.resetFields(); }}
        okText="Save" cancelText="Cancel"
      >
        <Form form={dc.cableForm} layout="vertical" size="small">
          <Form.Item name="label" label="Tags" rules={[{ required: true, message: 'Please enter label' }]}>
            <Input placeholder="e.g.: A01-U12→B03-U05" />
          </Form.Item>
          <Form.Item name="type" label="Type">
            <Select placeholder="Select type...">
              <Select.Option value="power">Power Cable</Select.Option>
              <Select.Option value="network">Network Cable</Select.Option>
              <Select.Option value="fiber">Fiber Optic</Select.Option>
              <Select.Option value="console">Serial Cable</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="planned">
            <Select>
              <Select.Option value="planned">Planned</Select.Option>
              <Select.Option value="connected">Connected</Select.Option>
              <Select.Option value="disconnected">Disconnected</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="a_device_id" label="Device A ID">
            <Input placeholder="Device ID (optional)" />
          </Form.Item>
          <Form.Item name="b_device_id" label="Device B ID">
            <Input placeholder="Device ID (optional)" />
          </Form.Item>
          <Form.Item name="length_m" label="Length (m)"><InputNumber min={0} step={0.5} className="w-full" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}