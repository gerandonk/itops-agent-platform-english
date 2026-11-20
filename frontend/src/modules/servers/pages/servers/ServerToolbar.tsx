import { Plus, RefreshCw, Terminal } from 'lucide-react';
import clsx from 'clsx';
import { ImportExport } from '../../../../modules/import-export/components/ImportExport';
import type { Server as ServerType } from '../types';

interface ServerToolbarProps {
  queryClient: { invalidateQueries: (opts: { queryKey: string[] }) => void };
  resetForm: () => void;
  setSelectedServer: (s: ServerType | null) => void;
  setIsModalOpen: (v: boolean) => void;
  selectedServer: ServerType | null;
  activeTab: string;
  setActiveTab: (tab: 'servers' | 'compliance' | 'command-history' | 'compliance-history') => void;
}

export function ServerToolbar({
  queryClient,
  resetForm,
  setSelectedServer,
  setIsModalOpen,
  selectedServer,
  activeTab,
  setActiveTab,
}: ServerToolbarProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text-primary mb-2">Server management</h1>
          <p className="text-text-secondary">Manage and monitor your servers</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ImportExport
            resourceType="servers"
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['servers'] })}
          />
          <button
            onClick={() => {
              resetForm();
              setSelectedServer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Server
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-primary mb-2">Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-b from-yellow-500 to-orange-500 flex-shrink-0" />
                <span>
                  <strong>Linux Servers</strong>: Left yellow-orange gradient, supports SSH command execution
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-b from-blue-500 to-cyan-500 flex-shrink-0" />
                <span>
                  <strong>Windows Servers</strong>: Left blue-cyan gradient, supports remote desktop
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Collect Info</strong>: Get server OS, CPU, memory, disk info
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 flex-shrink-0" />
                <span>
                  <strong>Run Command</strong>: Execute remote commands via SSH, view history
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col lg:flex-row gap-2 border-b border-border">
        <button
          onClick={() => {
            setActiveTab('servers');
            setSelectedServer(null);
          }}
          className={clsx(
            'px-4 py-2 border-b-2 text-sm transition-colors',
            activeTab === 'servers'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          )}
        >
          Server List
        </button>
        {selectedServer && (
          <>
            <button
              onClick={() => setActiveTab('compliance')}
              className={clsx(
                'px-4 py-2 border-b-2 text-sm transition-colors',
                activeTab === 'compliance'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              Compliance Check
            </button>
            <button
              onClick={() => setActiveTab('command-history')}
              className={clsx(
                'px-4 py-2 border-b-2 text-sm transition-colors',
                activeTab === 'command-history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              Command History
            </button>
            <button
              onClick={() => setActiveTab('compliance-history')}
              className={clsx(
                'px-4 py-2 border-b-2 text-sm transition-colors',
                activeTab === 'compliance-history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              Check History
            </button>
          </>
        )}
      </div>
    </>
  );
}