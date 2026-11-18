/**
 * AlertProviders Provider Guides + 工具（2026-07-21 拆分）
 *
 * 把原 AlertProviders.tsx L34-106 的：
 * - PROVIDER_GUIDES 常量（prometheus / zabbix / grafana / webhook）
 * - getFormFields 函数
 * 全部抽出
 *
 * 拆分原则遵循 architecture.md §3.4.1 + 第 3 条「向后兼容的 import 路径」
 */

import type { AlertProvider, FormField } from './types';

export interface ProviderGuide {
  title: string;
  steps: string[];
  webhookFormat?: string;
  note?: string;
}

export const PROVIDER_GUIDES: Record<string, ProviderGuide> = {
  prometheus: {
    title: 'Prometheus Alertmanager Integration Guide',
    steps: [
      '1. Add a webhook receiver in the Alertmanager config file: ',
      '2. Fill the Webhook URL below into the url field',
      '3. Restart Alertmanager to apply the config',
      '4. Alerts are pushed to this address automatically; the system creates alert records automatically',
    ],
    webhookFormat: 'alertmanager',
    note: '⚠️ This system automatically parses Alertmanager JSON alerts, extracting key fields from labels and annotations.',
  },
  zabbix: {
    title: 'Zabbix Webhook Integration Guide',
    steps: [
      '1. In Zabbix admin console → Alert media types → Create Webhook type',
      '2. Fill the Webhook URL below into the URL field',
      '3. Configure macros like {ALERT.SUBJECT}, {ALERT.MESSAGE} in parameters',
      '4. Link this alert media in Actions',
    ],
    note: '⚠️ Zabbix alert pushes use JSON format; the system parses the subject and message fields automatically.',
  },
  grafana: {
    title: 'Grafana Alerting Integration Guide',
    steps: [
      '1. In Grafana → Alerting → Contact points → New Webhook',
      '2. Fill the Webhook URL below into the URL field',
      '3. Link this contact point in Notification policies',
      '4. After an alert fires, Grafana automatically POSTs JSON to this address',
    ],
    note: '⚠️ This system automatically parses Grafana alert format, including alert name, status, labels, and values.',
  },
  webhook: {
    title: 'Generic Webhook Integration Guide',
    steps: [
      '1. Configure the Webhook URL below into any system that supports Webhooks',
      '2. POST JSON data to this address',
      '3. Supported fields: title, severity, content, source',
    ],
    webhookFormat: 'generic',
    note: '💡 Generic format, works with custom systems or third-party tools. Minimal JSON example: {"title":"Alert Title","severity":"warning","content":"Alert Details"}',
  },
};

/** 从 provider schema 提取表单字段 */
export function getFormFields(provider: AlertProvider): FormField[] {
  if (!provider?.configSchema?.properties) return [];
  const required = provider.configSchema.required || [];
  return Object.entries(provider.configSchema.properties).map(([key, prop]) => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    type: prop.type,
    description: prop.description || '',
    required: required.includes(key),
    default: prop.default,
    enum: prop.enum,
  }));
}
