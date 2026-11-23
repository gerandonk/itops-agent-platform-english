/**
 * AlertProviders 可用告警源 grid（2026-07-21 拆分）
 *
 * 从原 AlertProviders.tsx L400-484 抽出可用 provider grid（卡片）
 * 拆分原则遵循 architecture.md §3.4.1 + 第 3 条「向后兼容的 import 路径」
 */
import { clsx } from 'clsx';
import { Plus, Globe, Link, Info, Copy, CheckCircle } from 'lucide-react';
import type { AlertProvider, AlertProviderConfig, FormField } from './types';
import type { ProviderGuide } from './providerGuides';

export interface AvailableProviderGridProps {
  providers: AlertProvider[];
  relatedConfigsMap: Record<string, AlertProviderConfig[]>;
  copied: string;
  getWebhookUrl: (providerId: string) => string;
  onCopy: (text: string, id: string) => void;
  onCreateConfig: (provider: AlertProvider) => void;
  getFormFields: (provider: AlertProvider) => FormField[];
  getProviderGuide: (provider: AlertProvider) => ProviderGuide | null;
}

export function AvailableProviderGrid({
  providers,
  copied,
  getWebhookUrl,
  onCopy,
  onCreateConfig,
  getFormFields,
  getProviderGuide,
}: AvailableProviderGridProps) {
  if (providers.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No matching alert sources found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => {
        const formFields = getFormFields(provider);
        const guide = getProviderGuide(provider);
        const webhookUrl = getWebhookUrl(provider.id);

        return (
          <div
            key={provider.id}
            className="bg-surface border border-border rounded-xl p-5 hover:border-border/60 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{provider.name}</h3>
                  <span className="text-xs text-text-secondary uppercase">{provider.type}</span>
                </div>
              </div>
            </div>

            {/* Configuration Fields Preview */}
            {formFields.length > 0 && (
              <div className="mb-4 p-3 bg-surface/50 rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-2">Fields to configure:</p>
                <div className="space-y-1.5">
                  {formFields.map((f) => (
                    <div key={f.key} className="flex items-center gap-2 text-xs">
                      <span
                        className={clsx(
                          'w-1.5 h-1.5 rounded-full',
                          f.required ? 'bg-red-400' : 'bg-surface',
                        )}
                      ></span>
                      <code className="text-blue-300">{f.key}</code>
                      <span className="text-xs text-text-tertiary">— {f.description}</span>
                      {f.required && <span className="text-red-400 text-xs">Required</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Guide Summary */}
            {guide && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-blue-300">{guide.title}</span>
                </div>
                {guide.note && <p className="text-xs text-blue-400/70 mt-1">{guide.note}</p>}
              </div>
            )}

            {/* Webhook URL */}
            <div className="mb-4 p-3 bg-surface/50 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Link className="w-3 h-3 text-green-400" />
                <span className="text-xs text-text-secondary">Webhook URL:</span>
              </div>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-background px-2 py-1.5 rounded text-xs text-text-primary overflow-x-auto whitespace-nowrap select-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={() => onCopy(webhookUrl, `url-${provider.id}`)}
                  className="p-1.5 bg-surface rounded hover:bg-surface/80 transition-all flex-shrink-0"
                  title="Copy"
                >
                  {copied === `url-${provider.id}` ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-tertiary" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => onCreateConfig(provider)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full justify-center transition-all font-medium"
            >
              <Plus className="w-4 h-4" />
              New Config
            </button>
          </div>
        );
      })}
    </div>
  );
}
