/**
 * ConditionConfig — 条件分支节点配置面板
 *
 * 节点类型：condition
 * 用法：根据表达式求值结果选择 true/false 分支执行
 *
 * 配置项：
 * - expression：条件表达式（如 {{risk_score}} > 0.6）
 * - defaultBranch：默认分支（true / false）
 */

import type { Node } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

interface ConditionConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

interface ConditionNodeData {
  expression?: string;
  defaultBranch?: 'true' | 'false';
  description?: string;
  allowFailure?: boolean;
}

export function ConditionConfig({ selectedNode, onUpdate }: ConditionConfigProps) {
  const data = (selectedNode.data || {}) as ConditionNodeData;
  const config = data as ConditionNodeData;

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-cyan-500" />
        Conditional Branch Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Condition Expression</label>
          <textarea
            value={config.expression || ''}
            onChange={(e) => onUpdate(selectedNode.id, { expression: e.target.value })}
            placeholder="e.g. {{risk_score}} > 0.6 or {{status}} == 'failed'"
            rows={3}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none resize-none font-mono text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Supports variable replacement {`{{var}}`}, supports ==/!=/&gt;/&lt; comparison operators
          </p>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Default Branch</label>
          <select
            value={config.defaultBranch || 'false'}
            onChange={(e) => onUpdate(selectedNode.id, { defaultBranch: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            <option value="true">true (executes when condition is true)</option>
            <option value="false">false (executes when condition is false)</option>
          </select>
          <p className="text-xs text-text-secondary mt-1">
            Fallback branch when actual condition evaluation fails
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={!!config.allowFailure}
            onChange={(e) => onUpdate(selectedNode.id, { allowFailure: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label className="text-sm text-text-secondary">
            Allow skipping the node when condition evaluation fails (instead of overall failure)
          </label>
        </div>
      </div>
    </div>
  );
}