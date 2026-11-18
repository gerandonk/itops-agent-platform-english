import type { Node } from '@xyflow/react';
import { AlertTriangle } from 'lucide-react';
import type { RiskAssessNodeData } from '../types';

interface RiskAssessConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

const SEVERITY_OPTIONS = [
  { value: '', label: 'Unspecified (read from context)' },
  { value: 'critical', label: 'critical' },
  { value: 'high', label: 'high' },
  { value: 'medium', label: 'medium' },
  { value: 'low', label: 'low' },
  { value: 'info', label: 'info' },
];

export function RiskAssessConfig({ selectedNode, onUpdate }: RiskAssessConfigProps) {
  const data = (selectedNode.data as RiskAssessNodeData) || {};
  const thresholds = data.thresholds || {};

  const updateThreshold = (key: 'auto' | 'approve' | 'manual', value: number) => {
    onUpdate(selectedNode.id, {
      thresholds: { ...thresholds, [key]: value },
    });
  };

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Risk Assessment Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Remediation Plan Source Node ID</label>
          <input
            type="text"
            value={data.planSourceNodeId ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { planSourceNodeId: e.target.value })}
            placeholder="Leave blank to read from previous node"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Alert Severity</label>
          <select
            value={data.alertSeverity ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { alertSeverity: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Alert Title</label>
          <input
            type="text"
            value={data.alertTitle ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { alertTitle: e.target.value })}
            placeholder="e.g. ${alert.title}"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Supports ${'$'}{'{variable}'} Injection</p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Risk Threshold (0~1)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Auto ≤</label>
              <input
                type="number"
                value={thresholds.auto ?? 0.35}
                onChange={(e) => updateThreshold('auto', parseFloat(e.target.value) || 0)}
                min={0}
                max={1}
                step={0.01}
                className="w-full px-2 py-1.5 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Approval ≤</label>
              <input
                type="number"
                value={thresholds.approve ?? 0.65}
                onChange={(e) => updateThreshold('approve', parseFloat(e.target.value) || 0)}
                min={0}
                max={1}
                step={0.01}
                className="w-full px-2 py-1.5 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Manual ≤</label>
              <input
                type="number"
                value={thresholds.manual ?? 0.85}
                onChange={(e) => updateThreshold('manual', parseFloat(e.target.value) || 0)}
                min={0}
                max={1}
                step={0.01}
                className="w-full px-2 py-1.5 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-1">Default 0.35 / 0.65 / 0.85</p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Allow assessment failure (log only, don't block workflow)</span>
        </label>
      </div>
    </div>
  );
}

export default RiskAssessConfig;