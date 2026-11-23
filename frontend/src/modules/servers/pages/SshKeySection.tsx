import { useMemo } from 'react';
import { Search, X, CheckCircle2, Key } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../lib/api';
import { useToast } from '../../../contexts/ToastContext';

interface SshKeyItem {
  id: string;
  name: string;
  key_type: string;
  fingerprint: string | null;
  usage_count: number;
}

interface SshKeySectionProps {
  sshKeys: SshKeyItem[] | undefined;
  sshKeySearchQuery: string;
  onSshKeySearchQueryChange: (v: string) => void;
  showSshKeyDropdown: boolean;
  onShowSshKeyDropdownChange: (v: boolean) => void;
  selectedSshKeyId: string;
  onSelectedSshKeyIdChange: (v: string) => void;
  privateKey: string;
  onPrivateKeyChange: (v: string) => void;
  isEditing: boolean;
  navigate: (path: string) => void;
  resetForm: () => void;
  closeModal: () => void;
}

export function SshKeySection({
  sshKeys,
  sshKeySearchQuery,
  onSshKeySearchQueryChange,
  showSshKeyDropdown,
  onShowSshKeyDropdownChange,
  selectedSshKeyId,
  onSelectedSshKeyIdChange,
  privateKey,
  onPrivateKeyChange,
  isEditing,
  navigate,
  resetForm,
  closeModal,
}: SshKeySectionProps) {
  const toast = useToast();

  const filteredSshKeys = useMemo(() => {
    if (!sshKeys) return [];
    if (!sshKeySearchQuery) return sshKeys;
    const query = sshKeySearchQuery.toLowerCase();
    return sshKeys.filter((key) => {
      return (
        key.name.toLowerCase().includes(query) ||
        (key.key_type || '').toLowerCase().includes(query) ||
        (key.fingerprint || '').toLowerCase().includes(query)
      );
    });
  }, [sshKeys, sshKeySearchQuery]);

  if (!sshKeys || sshKeys.length === 0) {
    return (
      <textarea
        value={privateKey}
        onChange={(e) => {
          onSelectedSshKeyIdChange('');
          onPrivateKeyChange(e.target.value);
        }}
        placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Paste your private key...'}
        rows={6}
        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary font-mono text-sm"
      />
    );
  }

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-xs text-text-tertiary">Select from existing keys</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={sshKeySearchQuery}
            onChange={(e) => onSshKeySearchQueryChange(e.target.value)}
            onFocus={() => onShowSshKeyDropdownChange(true)}
            onBlur={() => {
              setTimeout(() => onShowSshKeyDropdownChange(false), 200);
            }}
            placeholder="Search key name, type, or fingerprint..."
            className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary text-sm"
          />
          {selectedSshKeyId && sshKeys.find(k => k.id === selectedSshKeyId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectedSshKeyIdChange('');
                onSshKeySearchQueryChange('');
                onPrivateKeyChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showSshKeyDropdown && (
          <div className="mt-1 max-h-48 overflow-y-auto bg-surface border border-border rounded-lg shadow-lg z-10">
            {filteredSshKeys.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-tertiary text-center">No matching key found</div>
            ) : (
              filteredSshKeys.map((key) => (
                <button
                  key={key.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={async () => {
                    try {
                      const { data } = await api.get(`/ssh-keys/${key.id}`);
                      onSelectedSshKeyIdChange(key.id);
                      onSshKeySearchQueryChange(`${key.name} (${key.key_type})`);
                      onPrivateKeyChange(data.private_key);
                      onShowSshKeyDropdownChange(false);
                    } catch {
                      toast.error('Failed to get SSH private key');
                    }
                  }}
                  className={clsx(
                    'w-full px-4 py-2.5 text-left hover:bg-primary/5 transition-colors border-b border-border/50 last:border-b-0',
                    selectedSshKeyId === key.id && 'bg-primary/10',
                  )}
                >
                  <div className="flex items-center justify-between flex-wrap">
                    <span className="text-sm text-text-primary font-medium">{key.name}</span>
                    <span className="text-xs text-text-tertiary">{key.key_type}</span>
                  </div>
                  {key.fingerprint && (
                    <div className="text-xs text-text-tertiary mt-0.5 font-mono">
                      {key.fingerprint.slice(0, 30)}...
                    </div>
                  )}
                  {key.usage_count > 0 && (
                    <div className="text-xs text-status-success mt-0.5">Used by {key.usage_count} servers</div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {selectedSshKeyId && sshKeys.find(k => k.id === selectedSshKeyId) && !showSshKeyDropdown && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-status-success">
            <CheckCircle2 className="w-3 h-3" />
            <span>Currently Selected: {sshKeys.find((k) => k.id === selectedSshKeyId)?.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => { resetForm(); closeModal(); navigate('/ssh-keys'); }}
            className="text-xs text-primary hover:underline"
          >
            + Manage Credentials
          </button>
        </div>
      </div>
      <textarea
        value={privateKey}
        onChange={(e) => {
          onSelectedSshKeyIdChange('');
          onPrivateKeyChange(e.target.value);
        }}
        placeholder={
          isEditing && !selectedSshKeyId
            ? 'Leave blank to keep unchanged'
            : selectedSshKeyId
              ? 'Key selected above; manual editing overrides it'
              : 'Paste your private key, or select an existing key from above...'
        }
        rows={6}
        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary font-mono text-sm"
      />
    </div>
  );
}
