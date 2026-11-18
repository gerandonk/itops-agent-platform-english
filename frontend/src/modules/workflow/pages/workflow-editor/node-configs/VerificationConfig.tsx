import type { Node } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import type { VerificationGate, VerificationNodeData } from '../types';

interface VerificationConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

const ALL_GATES: { value: VerificationGate; label: string; description: string }[] = [
  { value: 'command_success', label: 'Command successful', description: 'Command execution return code is 0' },
  { value: 'service_health', label: 'Service healthy', description: 'Target service alive/available' },
  { value: 'metric_recovery', label: 'Metric recovered', description: 'Key monitoring metrics returned within threshold' },
  { value: 'baseline_comparison', label: 'Baseline comparison', description: 'No anomaly compared with historical baseline' },
  { value: 'impact_assessment', label: 'Impact assessment', description: 'Business impact assessment passed' },
];

export function VerificationConfig({ selectedNode, onUpdate }: VerificationConfigProps) {
  const data = (selectedNode.data as VerificationNodeData) || {};
  const gates: VerificationGate[] = data.gates ?? ALL_GATES.map((g) => g.value);

  const toggleGate = (gate: VerificationGate, checked: boolean) => {
    const next = checked ? Array.from(new Set([...gates, gate])) : gates.filter((g) => g !== gate);
    onUpdate(selectedNode.id, { gates: next });
  };

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-500" />
        Verification Gate Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-2">Verification Gates (multi-select)</label>
          <div className="space-y-1.5">
            {ALL_GATES.map((g) => (
              <label key={g.value} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={gates.includes(g.value)}
                  onChange={(e) => toggleGate(g.value, e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="flex-1">
                  <span className="text-text-primary">{g.label}</span>
                  <span className="block text-xs text-text-secondary">{g.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-1">All enabled by default; executed in checkbox order</p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Target Server ID (optional)</label>
          <input
            type="text"
            value={data.serverId ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { serverId: e.target.value })}
            placeholder="Can be left blank, uses server_id from context"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Overall Timeout (ms)</label>
          <input
            type="number"
            value={data.timeout ?? 300000}
            onChange={(e) => onUpdate(selectedNode.id, { timeout: parseInt(e.target.value) || 300000 })}
            min={1000}
            step={1000}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Default 300000 (5 minutes)</p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Allow verification failure (log only, don't block workflow)</span>
        </label>
      </div>
    </div>
  );
}

export default VerificationConfig;