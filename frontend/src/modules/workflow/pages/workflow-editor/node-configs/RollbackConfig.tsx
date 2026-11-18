import type { Node } from '@xyflow/react';
import { Undo2 } from 'lucide-react';
import type { RollbackNodeData } from '../types';

interface RollbackConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

export function RollbackConfig({ selectedNode, onUpdate }: RollbackConfigProps) {
  const data = (selectedNode.data as RollbackNodeData) || {};

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Undo2 className="w-4 h-4 text-rose-500" />
        Rollback Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Rollback Command Source Node ID</label>
          <input
            type="text"
            value={data.commandSourceNodeId ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { commandSourceNodeId: e.target.value })}
            placeholder="Leave blank to read from previous node"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Extract the rollback command from this node's output</p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Target Server ID</label>
          <input
            type="text"
            value={data.serverId ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { serverId: e.target.value })}
            placeholder="Can be left blank, uses server_id from context"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Command Timeout (ms)</label>
          <input
            type="number"
            value={data.commandTimeout ?? 30000}
            onChange={(e) =>
              onUpdate(selectedNode.id, { commandTimeout: parseInt(e.target.value) || 30000 })
            }
            min={1000}
            step={1000}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Default 30000 (30 seconds)</p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={data.verifyAfterRollback !== false}
            onChange={(e) => onUpdate(selectedNode.id, { verifyAfterRollback: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Auto-verify after rollback</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Allow rollback failure (log only, don't block workflow)</span>
        </label>
      </div>
    </div>
  );
}

export default RollbackConfig;