/**
 * ParallelConfig — 并行分支节点配置面板
 *
 * 节点类型：parallel
 * 用法：同时触发多条下游分支（最多 N 条），全部完成后汇聚
 *
 * 配置项：
 * - maxConcurrency：最大并发数
 * - waitAll：是否等待所有分支完成（默认 true）
 * - timeoutMs：整体超时时间
 */

import type { Node } from '@xyflow/react';
import { GitFork } from 'lucide-react';

interface ParallelConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

interface ParallelNodeData {
  maxConcurrency?: number;
  waitAll?: boolean;
  timeoutMs?: number;
  description?: string;
  allowFailure?: boolean;
}

export function ParallelConfig({ selectedNode, onUpdate }: ParallelConfigProps) {
  const config = (selectedNode.data || {}) as ParallelNodeData;

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <GitFork className="w-4 h-4 text-cyan-500" />
        Parallel Branch Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Max Concurrency</label>
          <input
            type="number"
            value={config.maxConcurrency || 5}
            onChange={(e) => onUpdate(selectedNode.id, { maxConcurrency: parseInt(e.target.value) || 5 })}
            min={1}
            max={50}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Maximum number of parallel branches executed at the same time
          </p>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Overall Timeout (ms)</label>
          <input
            type="number"
            value={config.timeoutMs || 300000}
            onChange={(e) => onUpdate(selectedNode.id, { timeoutMs: parseInt(e.target.value) || 300000 })}
            min={1000}
            step={1000}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.waitAll !== false}
            onChange={(e) => onUpdate(selectedNode.id, { waitAll: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label className="text-sm text-text-secondary">
            Wait for all branches to complete (continue when any completes if disabled)
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!config.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label className="text-sm text-text-secondary">
            Allow partial branch failures (does not affect overall continuation)
          </label>
        </div>
      </div>
    </div>
  );
}