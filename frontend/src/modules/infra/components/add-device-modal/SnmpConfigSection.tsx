/**
 * SNMP 配置 Tab section（2026-07-21 拆分）
 *
 * 从原 AddDeviceModal.tsx L473-531 抽出
 * 包含：启用 toggle / SNMP 凭证 / 端口 / 测试连接按钮
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 5 + lessons-learned §3.5
 */
import { Radio, Loader2 } from 'lucide-react';
import type { AddDeviceFormData, SnmpCredential } from './types';

export interface SnmpConfigSectionProps {
  form: AddDeviceFormData;
  setForm: React.Dispatch<React.SetStateAction<AddDeviceFormData>>;
  snmpCredentials: SnmpCredential[];
  isTesting: boolean;
  onSnmpTest: () => void;
}

export function SnmpConfigSection({
  form,
  setForm,
  snmpCredentials,
  isTesting,
  onSnmpTest,
}: SnmpConfigSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-text-primary">SNMP Monitoring Configuration</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={form.snmp_enabled === 1}
            onChange={(e) =>
              setForm({ ...form, snmp_enabled: e.target.checked ? 1 : 0 })
            }
          />
          <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
        </label>
      </div>

      {form.snmp_enabled === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1">SNMP Credentials</label>
            <select
              value={form.snmp_credential_id}
              onChange={(e) =>
                setForm({ ...form, snmp_credential_id: e.target.value })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
              <option value="">None (Skip SNMP monitoring)</option>
              {snmpCredentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name} ({cred.snmp_version.toUpperCase()})
                </option>
              ))}
            </select>
            {snmpCredentials.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">
                No SNMP credentials yet. Create one on the SNMP page first.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">SNMP Port</label>
            <input
              type="number"
              min="1"
              max="65535"
              value={form.snmp_port}
              onChange={(e) =>
                setForm({ ...form, snmp_port: parseInt(e.target.value, 10) || 161 })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onSnmpTest}
              disabled={isTesting || !form.snmp_credential_id}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Radio className="w-4 h-4" />
              )}
              Test SNMP Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
