/**
 * HttpConfig — HTTP 请求节点配置面板
 *
 * 节点类型：http
 * 用法：直接发起 HTTP 请求（与 provider 节点不同：无需注册 Provider，直接配置）
 *
 * 配置项：
 * - url / method / headers / body / timeoutMs
 */

import type { Node } from '@xyflow/react';
import { Globe } from 'lucide-react';

interface HttpConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

interface HttpNodeData {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: string;
  body?: string;
  timeoutMs?: number;
  description?: string;
  allowFailure?: boolean;
}

export function HttpConfig({ selectedNode, onUpdate }: HttpConfigProps) {
  const config = (selectedNode.data || {}) as HttpNodeData;

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4 text-blue-500" />
        HTTP Request Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">URL</label>
          <input
            type="text"
            value={config.url || ''}
            onChange={(e) => onUpdate(selectedNode.id, { url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm font-mono"
          />
          <p className="text-xs text-text-secondary mt-1">
            Supports variable replacement {`{{var}}`}
          </p>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Method</label>
          <select
            value={config.method || 'GET'}
            onChange={(e) => onUpdate(selectedNode.id, { method: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Request Headers (JSON string)</label>
          <textarea
            value={config.headers || ''}
            onChange={(e) => onUpdate(selectedNode.id, { headers: e.target.value })}
            placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {{token}}"}'
            rows={3}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none resize-none font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Request Body (JSON string, non-GET only)</label>
          <textarea
            value={config.body || ''}
            onChange={(e) => onUpdate(selectedNode.id, { body: e.target.value })}
            placeholder='{"key": "{{value}}"}'
            rows={4}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none resize-none font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Timeout (ms)</label>
          <input
            type="number"
            value={config.timeoutMs || 30000}
            onChange={(e) => onUpdate(selectedNode.id, { timeoutMs: parseInt(e.target.value) || 30000 })}
            min={1000}
            step={1000}
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
            Allow continuing on 4xx/5xx failure (instead of overall failure)
          </label>
        </div>
      </div>
    </div>
  );
}