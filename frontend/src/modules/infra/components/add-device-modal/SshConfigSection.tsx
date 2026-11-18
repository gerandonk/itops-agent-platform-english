/**
 * SSH 配置 Tab section（2026-07-21 拆分）
 *
 * 从原 AddDeviceModal.tsx L346-470 抽出
 * 包含：SSH 端口 / 设备型号 / 认证方式 toggle / 用户名密码 / Enable 密码
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 5 + lessons-learned §3.5
 */
import { Lock, Key, User } from 'lucide-react';
import type { AddDeviceFormData, Credential } from './types';

export interface SshConfigSectionProps {
  form: AddDeviceFormData;
  setForm: React.Dispatch<React.SetStateAction<AddDeviceFormData>>;
  isEditing: boolean;
  useCredential: boolean;
  setUseCredential: (b: boolean) => void;
  credentials: Credential[];
}

export function SshConfigSection({
  form,
  setForm,
  isEditing,
  useCredential,
  setUseCredential,
  credentials,
}: SshConfigSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-text-primary">SSH Connection Configuration</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">SSH Port</label>
          <input
            type="number"
            value={form.ssh_port}
            onChange={(e) => setForm({ ...form, ssh_port: parseInt(e.target.value, 10) || 22 })}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Device Model</label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="e.g.: S5735-L48T4X-A"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">Authentication Method</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setUseCredential(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                useCredential
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-text-secondary hover:border-primary/50'
              }`}
            >
              <Key className="w-4 h-4" />
              Select Credential
            </button>
            <button
              type="button"
              onClick={() => setUseCredential(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                !useCredential
                  ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                  : 'bg-background border-border text-text-secondary hover:border-orange-500/50'
              }`}
            >
              <User className="w-4 h-4" />
              Manual Input
            </button>
          </div>
        </div>

        {useCredential ? (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1">
              Authentication Credential <span className="text-red-500">*</span>
            </label>
            <select
              value={form.ssh_key_id}
              onChange={(e) => setForm({ ...form, ssh_key_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            >
              <option value="">(Do not set SSH credentials)</option>
              {credentials
                .filter((c) => c.auth_type === 'password')
                .map((cred) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.name} ({cred.username || 'No username'})
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-text-secondary/60">
              Existing account/password credentials can be selected; pure SNMP devices can skip this
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                required={!useCredential}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Device login password'}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                required={!isEditing && !useCredential}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Enable Password</label>
          <input
            type="password"
            value={form.enable_password}
            onChange={(e) => setForm({ ...form, enable_password: e.target.value })}
            placeholder="Privilege mode password (optional)"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-text-primary placeholder-text-secondary/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
