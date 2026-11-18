import { Button, Modal, Input } from 'antd';
import { Download, Upload, HardDrive } from 'lucide-react';
import type useDataCenter from './useDataCenter';

type DC = ReturnType<typeof useDataCenter>;

interface Props {
  dc: DC;
}

export default function ExportImportTab({ dc }: Props) {
  return (
    <>
      <div>
        <div className="mb-4 text-sm text-text-secondary">
          Export complete data center layout data to JSON format, including machine rooms, racks, U-slots, lifecycle, and power equipment information.
        </div>

        {/* 导出区域 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Download size={18} className="text-blue-400" />
            <span className="text-sm font-medium text-text-primary">Export Data</span>
          </div>
          {dc.exportData ? (
            <>
              <p className="text-xs text-text-tertiary mb-3">
                Contains {dc.exportData.summary?.rooms || 0} rooms, {dc.exportData.summary?.racks || 0} racks, {dc.exportData.summary?.devices || 0} devices
              </p>
              <div className="flex gap-2">
                <Button icon={<Download size={14} />} onClick={dc.handleExportDownload}>Download JSON File</Button>
                <Button icon={<HardDrive size={14} />} onClick={dc.handleExportCopy}>Copy to Clipboard</Button>
              </div>
            </>
          ) : (
            <Button icon={<Download size={14} />} onClick={dc.loadExport}>Load Export Data</Button>
          )}
        </div>

        {/* 导入区域 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Upload size={18} className="text-green-400" />
            <span className="text-sm font-medium text-text-primary">Import Data</span>
          </div>
          <Button icon={<Upload size={14} />} onClick={() => dc.setImportModalOpen(true)}>Open Import Window</Button>
        </div>
      </div>

      {/* 导入 Modal */}
      <Modal
        title="Import data center data"
        open={dc.importModalOpen}
        onOk={dc.handleImport}
        onCancel={() => { dc.setImportModalOpen(false); dc.setImportText(''); }}
        okText="Import"
        cancelText="Cancel"
        confirmLoading={dc.importLoading}
        width={700}
      >
        <div className="mb-2 text-xs text-text-tertiary">
          Paste JSON data. The format matches the exported data and may include fields such as rooms, racks, slots, pdus.
        </div>
        <Input.TextArea
          rows={12}
          value={dc.importText}
          onChange={(e) => dc.setImportText(e.target.value)}
          placeholder='{"rooms": [...], "racks": [...], "slots": [...], "pdus": [...]}'
          className="font-mono text-xs"
        />
      </Modal>
    </>
  );
}