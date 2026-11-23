import { Cpu, HardDrive, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { VM, VMStats } from './types';
import { formatMem, powerLabels } from './vmDisplay';

interface VMStatsDrawerProps {
  vm: VM;
  stats?: VMStats;
  onClose: () => void;
}

export function VMStatsDrawer({ vm, stats, onClose }: VMStatsDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border-l border-border h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between flex-wrap mb-6">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Performance Monitor</h3>
            <p className="text-sm text-text-secondary">{vm.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-lg transition-colors">
            <Trash2 className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap mb-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </div>
              <span className="text-lg font-bold text-text-primary">
                {stats?.cpuUsagePercent !== null && stats?.cpuUsagePercent !== undefined ? `${stats.cpuUsagePercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats?.cpuUsagePercent ?? 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap mb-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <HardDrive className="w-4 h-4" />
                Memory Usage
              </div>
              <span className="text-lg font-bold text-text-primary">
                {stats?.memoryUsagePercent !== null && stats?.memoryUsagePercent !== undefined ? `${stats.memoryUsagePercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  (stats?.memoryUsagePercent ?? 0) > 80 ? 'bg-red-500' :
                    (stats?.memoryUsagePercent ?? 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(stats?.memoryUsagePercent ?? 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Basic info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Status</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  vm.powerState === 'poweredOn' ? 'bg-green-500/20 text-green-400' :
                    vm.powerState === 'poweredOff' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                )}>
                  {powerLabels[vm.powerState] || vm.powerState}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Operating System</span>
                <span className="text-text-primary">{vm.guestOs || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">CPU</span>
                <span className="text-text-primary">{vm.numCPUs || 0} vCPUs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Memory</span>
                <span className="text-text-primary">{formatMem(vm.memoryMB || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Disk</span>
                <span className="text-text-primary">
                  {vm.disks?.length ? `${vm.disks.reduce((sum, disk) => sum + (disk.sizeGB || 0), 0)} GB` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">IP Address</span>
                <span className="text-text-primary font-mono text-xs">{vm.ipAddress || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform</span>
                <span className="text-text-primary">{vm.hypervisorType || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
