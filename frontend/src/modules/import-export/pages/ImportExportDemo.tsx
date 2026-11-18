/**
 * 导入导出演示页
 *
 * 从原 infra/ 抽离（2026-07-08 增量-12）。
 * 展示 4 类资源（servers / alerts / audit-logs / reports）的导入导出功能。
 */

import { ImportExport } from '../components/ImportExport';

export default function ImportExportDemo() {
  const resources: Array<'servers' | 'alerts' | 'audit-logs' | 'reports'> = [
    'servers',
    'alerts',
    'audit-logs',
    'reports',
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Import/Export</h1>
          <p className="text-text-secondary">Batch import or export system resources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => (
            <div
              key={resource}
              className="bg-surface border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-text-primary mb-3 capitalize">
                {resource.replace('-', ' ')}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Supports CSV / JSON format import and export
              </p>
              <ImportExport resourceType={resource} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
