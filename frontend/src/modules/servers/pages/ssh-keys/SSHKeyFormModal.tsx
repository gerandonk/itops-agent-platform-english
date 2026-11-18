/**
 * SSHKey 表单 Modal（2026-07-21 拆分）
 *
 * 从原 SSHKeys.tsx L432-566 抽出
 * 新增/编辑凭证表单（name / auth_type / private_key / username / password / description）
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 3 + lessons-learned §3.5
 */
import clsx from 'clsx';
import { CheckCircle2, Key, Lock, User } from 'lucide-react';
import type { SSHKeyFormData } from './types';

export interface SSHKeyFormModalProps {
  isOpen: boolean;
  selectedKeyId: string | null;
  formData: SSHKeyFormData;
  setFormData: React.Dispatch<React.SetStateAction<SSHKeyFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SSHKeyFormModal({
  isOpen,
  selectedKeyId,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: SSHKeyFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-text-primary mb-6">
          {selectedKeyId ? 'Edit credential' : 'Add credential'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Credential Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g.: production-key, switch-admin"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Authentication Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, auth_type: 'key' })}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  formData.auth_type === 'key'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-background border-border text-text-secondary hover:border-primary/50',
                )}
              >
                <Key className="w-4 h-4" />
                SSH Key
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, auth_type: 'password' })}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                  formData.auth_type === 'password'
                    ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                    : 'bg-background border-border text-text-secondary hover:border-orange-500/50',
                )}
              >
                <Lock className="w-4 h-4" />
                Username/Password
              </button>
            </div>
          </div>

          {formData.auth_type === 'key' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Private Key {selectedKeyId && '(leave blank to keep unchanged)'}
              </label>
              <textarea
                value={formData.private_key}
                onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                placeholder={selectedKeyId ? 'Leave blank to keep current private key unchanged' : 'Paste your SSH private key content...'}
                rows={8}
                className="w-full px-4 py-2 bg-black/60 border border-border rounded-lg focus:outline-none focus:border-primary font-mono text-sm text-green-400 resize-none"
                required={!selectedKeyId}
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Supports OpenSSH, RSA, EC, DSA and other private key formats
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g.: admin, root"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={selectedKeyId ? 'Leave blank to keep current password unchanged' : 'Enter password...'}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                  required={!selectedKeyId}
                />
                <p className="mt-1 text-xs text-text-tertiary">
                  Passwords will be encrypted and stored using AES-256-GCM
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Credential purpose description..."
              rows={2}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {selectedKeyId ? 'Save changes' : 'Add credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
