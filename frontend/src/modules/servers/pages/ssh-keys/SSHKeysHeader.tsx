/**
 * SSHKeys 顶部 Header + 安全说明 + 搜索框（2026-07-21 拆分）
 *
 * 从原 SSHKeys.tsx L215-265 抽出
 * 包含：title + 添加按钮 + 安全说明面板 + 搜索框
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 3 + lessons-learned §3.5
 */
import { Plus, Shield, Key, Info, Search } from 'lucide-react';

export interface SSHKeysHeaderProps {
  onAddNew: () => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}

export function SSHKeysHeader({
  onAddNew,
  searchQuery,
  setSearchQuery,
}: SSHKeysHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Credential Management</h1>
          <p className="text-text-secondary">
            Unified management of authentication credentials for servers and network devices (SSH Key / Username & Password)
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Credential
        </button>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-primary mb-1">Security Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 text-status-success" />
                <span>
                  <strong>AES-encrypted storage</strong>: All credentials are encrypted and stored in the database
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 flex-shrink-0 text-status-warning" />
                <span>
                  <strong>Dual authentication methods</strong>: Supports SSH keys and username/password
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 text-status-failed" />
                <span>
                  <strong>Decrypt on demand</strong>: Automatically decrypts credentials when connecting to devices
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search credential name, description, fingerprint..."
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
        />
      </div>
    </>
  );
}
