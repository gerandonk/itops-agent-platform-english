import { Server, Settings } from 'lucide-react';
import type { Platform } from './types';
import { platformStatusIcon } from './vmDisplay';

interface VMPlatformSelectorProps {
  platforms: Platform[];
  selectedPlatformId: string;
  selectedPlatform?: Platform;
  onSelectPlatform: (platformId: string) => void;
  onOpenPlatformModal: () => void;
}

export function VMPlatformSelector({
  platforms,
  selectedPlatformId,
  selectedPlatform,
  onSelectPlatform,
  onOpenPlatformModal,
}: VMPlatformSelectorProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Server className="w-5 h-5 text-text-secondary" />
        <span className="text-sm text-text-secondary whitespace-nowrap">Virtualization Platform:</span>
        <select
          value={selectedPlatformId}
          onChange={(event) => onSelectPlatform(event.target.value)}
          className="flex-1 max-w-xs px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="">All Platforms</option>
          {platforms.map(platform => (
            <option key={platform.id} value={platform.id}>
              {platform.name} ({platform.hypervisorType})
            </option>
          ))}
        </select>
        {selectedPlatform && (
          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
            {platformStatusIcon(selectedPlatform.status)}
            {selectedPlatform.status === 'active' ? 'Connected' : selectedPlatform.status === 'error' ? 'Error' : 'Disconnected'}
          </span>
        )}
        <button
          onClick={onOpenPlatformModal}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors ml-auto"
        >
          <Settings className="w-4 h-4" />
          Manage Platforms
        </button>
      </div>
    </div>
  );
}
