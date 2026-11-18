/**
 * NotifyConfig — 通知节点配置面板
 *
 * 节点类型：notify
 * 用法：发送即时通知（飞书/钉钉/企微/Email/Webhook）
 *
 * 配置项：
 * - channel / message / recipients / severity
 */

import type { Node } from '@xyflow/react';
import { Bell } from 'lucide-react';

interface NotifyConfigProps {
  selectedNode: Node;
  onUpdate: (nodeId: string, partial: Record<string, unknown>) => void;
}

interface NotifyNodeData {
  channel?: 'wechat' | 'dingtalk' | 'feishu' | 'email' | 'webhook';
  message?: string;
  title?: string;
  recipients?: string;
  severity?: 'info' | 'warning' | 'critical';
  description?: string;
  allowFailure?: boolean;
}

const CHANNEL_LABELS: Record<string, string> = {
  wechat: 'WeCom',
  dingtalk: 'DingTalk',
  feishu: 'Feishu',
  email: 'Email',
  webhook: 'Webhook',
};

export function NotifyConfig({ selectedNode, onUpdate }: NotifyConfigProps) {
  const config = (selectedNode.data || {}) as NotifyNodeData;

  return (
    <div className="pt-3 border-t border-border">
      <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-500" />
        Notification Configuration
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Notification Channels</label>
          <select
            value={config.channel || 'wechat'}
            onChange={(e) => onUpdate(selectedNode.id, { channel: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            {Object.entries(CHANNEL_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Severity Level</label>
          <select
            value={config.severity || 'info'}
            onChange={(e) => onUpdate(selectedNode.id, { severity: e.target.value })}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => onUpdate(selectedNode.id, { title: e.target.value })}
            placeholder="Workflow notification: {{workflow_name}}"
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Message Content</label>
          <textarea
            value={config.message || ''}
            onChange={(e) => onUpdate(selectedNode.id, { message: e.target.value })}
            placeholder="Supports {{variable}} variable replacement and markdown"
            rows={4}
            className="w-full px-3 py-2 rounded bg-background border border-border focus:border-primary focus:outline-none resize-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Recipients (optional)</label>
          <input
            type="text"
            value={config.recipients || ''}
            onChange={(e) => onUpdate(selectedNode.id, { recipients: e.target.value })}
            placeholder="Separate multiple with commas, leave blank for default"
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
            Notification failure does not affect the main process
          </label>
        </div>
      </div>
    </div>
  );
}