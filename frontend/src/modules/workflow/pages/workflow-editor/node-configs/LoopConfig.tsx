/**
 * LoopConfig — 循环节点配置面板
 *
 * 节点类型：loop
 * 用法：对一个数组中的每个元素执行下游节点（直到最大次数限制）
 *
 * 配置项：
 * - sourceKey：要遍历的数组在 context 中的键名
 * - maxIterations：最大循环次数（防失控）
 * - currentItemKey：当前元素注入到 context 的键名
 */

import type { Node } from '@xyflow/react';
import { Repeat } from 'lucide-react';

interface LoopConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

interface LoopNodeData {
  sourceKey?: string;
  maxIterations?: number;
  currentItemKey?: string;
  currentIndexKey?: string;
  description?: string;
  allowFailure?: boolean;
}

export function LoopConfig({ selectedNode, onUpdate }: LoopConfigProps) {
  const config = (selectedNode.data || {}) as LoopNodeData;

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Repeat className="w-4 h-4 text-purple-500" />
        Loop Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Array Source Key</label>
          <input
            type="text"
            value={config.sourceKey || ''}
            onChange={(e) => onUpdate(selectedNode.id, { sourceKey: e.target.value })}
            placeholder="e.g.: items, servers, alerts"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Read array from execution context, iterate over each element
          </p>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Max Loop Count</label>
          <input
            type="number"
            value={config.maxIterations || 100}
            onChange={(e) => onUpdate(selectedNode.id, { maxIterations: parseInt(e.target.value) || 100 })}
            min={1}
            max={10000}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Prevent runaway execution caused by oversized arrays
          </p>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Current Element Key Name</label>
          <input
            type="text"
            value={config.currentItemKey || 'item'}
            onChange={(e) => onUpdate(selectedNode.id, { currentItemKey: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Current Index Key Name</label>
          <input
            type="text"
            value={config.currentIndexKey || 'index'}
            onChange={(e) => onUpdate(selectedNode.id, { currentIndexKey: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={!!config.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label className="text-sm text-text-secondary">
            Continue on single loop failure (does not interrupt overall loop)
          </label>
        </div>
      </div>
    </div>
  );
}