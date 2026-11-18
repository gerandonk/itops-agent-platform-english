import type { Node } from '@xyflow/react';
import { BookOpen } from 'lucide-react';
import type { KnowledgeNodeData } from '../types';

interface KnowledgeConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

export function KnowledgeConfig({ selectedNode, onUpdate }: KnowledgeConfigProps) {
  const data = (selectedNode.data as KnowledgeNodeData) || {};

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-emerald-500" />
        Knowledge Preservation Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Knowledge Category</label>
          <input
            type="text"
            value={data.category ?? 'Fault handling'}
            onChange={(e) => onUpdate(selectedNode.id, { category: e.target.value })}
            placeholder="e.g.: Fault handling / Ops experience / Runbook"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Default "Fault handling"</p>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Knowledge Title Template</label>
          <input
            type="text"
            value={data.titleTemplate ?? ''}
            onChange={(e) => onUpdate(selectedNode.id, { titleTemplate: e.target.value })}
            placeholder="e.g. [${'$'}{alert.severity}] ${'$'}{alert.title}"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">Supports ${'$'}{'{variable}'} injection, leave blank to use default</p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={data.deduplicate !== false}
            onChange={(e) => onUpdate(selectedNode.id, { deduplicate: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Enable similarity deduplication</span>
        </label>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Similarity Threshold (0~1)</label>
          <input
            type="number"
            value={data.similarityThreshold ?? 0.7}
            onChange={(e) =>
              onUpdate(selectedNode.id, { similarityThreshold: parseFloat(e.target.value) || 0 })
            }
            min={0}
            max={1}
            step={0.05}
            disabled={data.deduplicate === false}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm disabled:opacity-50"
          />
          <p className="text-xs text-text-secondary mt-1">Default 0.7; higher is stricter</p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>Allow capture failure (log only, don't block workflow)</span>
        </label>
      </div>
    </div>
  );
}

export default KnowledgeConfig;