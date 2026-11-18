import { useRef } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { Server } from './types';
import { SshKeySection } from './SshKeySection';

interface FormData {
  name: string;
  hostname: string;
  port: number;
  username: string;
  password: string;
  private_key: string;
  use_ssh_key: boolean;
  description: string;
  tags: string;
  os_type: 'linux' | 'windows';
  vnc_port: number;
  vnc_password: string;
}

interface ServerFormModalProps {
  isOpen: boolean;
  selectedServer: Server | null;
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  resetForm: () => void;
  // Tag props
  parseCurrentTags: () => string[];
  getLastTagFragment: () => string;
  addTagToInput: (tag: string) => void;
  removeTag: (tag: string) => void;
  tagDropdownOpen: boolean;
  setTagDropdownOpen: (v: boolean) => void;
  tagInputRef: React.RefObject<HTMLInputElement>;
  tagDropdownRef: React.RefObject<HTMLDivElement>;
  filteredTagSuggestions: () => string[];
  allTags: string[];
  // SSH key props
  sshKeys: Array<{ id: string; name: string; key_type: string; fingerprint: string | null; usage_count: number }> | undefined;
  sshKeySearchQuery: string;
  onSshKeySearchQueryChange: (v: string) => void;
  showSshKeyDropdown: boolean;
  onShowSshKeyDropdownChange: (v: boolean) => void;
  selectedSshKeyId: string;
  onSelectedSshKeyIdChange: (v: string) => void;
  navigate: (path: string) => void;
}

export function ServerFormModal({
  isOpen,
  selectedServer,
  formData,
  onFormDataChange,
  onSubmit,
  onClose,
  resetForm,
  parseCurrentTags,
  addTagToInput,
  removeTag,
  tagDropdownOpen,
  setTagDropdownOpen,
  tagInputRef,
  tagDropdownRef,
  filteredTagSuggestions,
  allTags,
  sshKeys,
  sshKeySearchQuery,
  onSshKeySearchQueryChange,
  showSshKeyDropdown,
  onShowSshKeyDropdownChange,
  selectedSshKeyId,
  onSelectedSshKeyIdChange,
  navigate,
}: ServerFormModalProps) {
  if (!isOpen) return null;

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    onFormDataChange({ ...formData, [key]: value });
  };

  const suggestions = filteredTagSuggestions();
  const currentTags = parseCurrentTags();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-text-primary mb-6">
          {selectedServer ? 'Edit Server' : 'Add Server'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g.: Production server"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Hostname/IP *</label>
              <input
                type="text"
                value={formData.hostname}
                onChange={(e) => updateField('hostname', e.target.value)}
                placeholder="e.g.: 192.168.1.100"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Port</label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => updateField('port', parseInt(e.target.value) || 22)}
                placeholder="22"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">OS Type</label>
              <select
                value={formData.os_type}
                onChange={(e) => updateField('os_type', e.target.value as 'linux' | 'windows')}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              >
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="e.g.: root"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use_ssh_key"
              checked={formData.use_ssh_key}
              onChange={(e) => updateField('use_ssh_key', e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="use_ssh_key" className="text-sm text-text-secondary">Use Credentials</label>
          </div>

          {!formData.use_ssh_key ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder={selectedServer ? 'Leave blank to keep unchanged' : 'Enter password'}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">SSH Private Key</label>
              <SshKeySection
                sshKeys={sshKeys}
                sshKeySearchQuery={sshKeySearchQuery}
                onSshKeySearchQueryChange={onSshKeySearchQueryChange}
                showSshKeyDropdown={showSshKeyDropdown}
                onShowSshKeyDropdownChange={onShowSshKeyDropdownChange}
                selectedSshKeyId={selectedSshKeyId}
                onSelectedSshKeyIdChange={onSelectedSshKeyIdChange}
                privateKey={formData.private_key}
                onPrivateKeyChange={(v) => updateField('private_key', v)}
                isEditing={!!selectedServer}
                navigate={navigate}
                resetForm={resetForm}
                closeModal={onClose}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Server description..."
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-2">Tags</label>
            {/* Selected Tags Display */}
            {currentTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentTags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Tag Input + Dropdown Suggestions */}
            <div className="relative">
              <input
                ref={tagInputRef}
                type="text"
                value={formData.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                onFocus={() => setTagDropdownOpen(true)}
                onBlur={() => {
                  setTimeout(() => setTagDropdownOpen(false), 200);
                }}
                placeholder="Enter tag name, select from below or type manually (comma-separated)"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              />
              {/* Dropdown Suggestion Box */}
              {tagDropdownOpen && suggestions.length > 0 && (
                <div
                  ref={tagDropdownRef}
                  className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto animate-fade-in"
                >
                  <div className="px-3 py-2 text-xs text-text-tertiary border-b border-border">Select Existing Tags</div>
                  {suggestions.map((tag: string) => (
                    <button
                      key={tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTagToInput(tag);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary/50 flex-shrink-0" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {allTags.length === 0 && (
              <p className="mt-1 text-xs text-text-tertiary">After adding servers, tags will appear here as selectable options</p>
            )}
          </div>

          {formData.os_type === 'windows' && (
            <div className="pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-text-primary mb-3">VNC Configuration (Remote Desktop)</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">VNC Port</label>
                  <input
                    type="number"
                    value={formData.vnc_port}
                    onChange={(e) => updateField('vnc_port', parseInt(e.target.value) || 5900)}
                    placeholder="5900"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">VNC password</label>
                  <input
                    type="password"
                    value={formData.vnc_password}
                    onChange={(e) => updateField('vnc_password', e.target.value)}
                    placeholder={selectedServer ? 'Leave blank to keep unchanged' : 'VNC password'}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                  />
                </div>
              </div>
            </div>
          )}

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
              {selectedServer ? 'Save changes' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
