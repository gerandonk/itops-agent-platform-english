import { Terminal, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { CommandResult, Server } from './types';

interface CommandSectionProps {
  selectedServer: Server | null;
  command: string;
  onCommandChange: (v: string) => void;
  commandResult: CommandResult | null;
  onClearResult: () => void;
  isExecuting: boolean;
  onExecute: () => void;
}

export function CommandSection({
  selectedServer,
  command,
  onCommandChange,
  commandResult,
  onClearResult,
  isExecuting,
  onExecute,
}: CommandSectionProps) {
  if (!selectedServer) return null;

  return (
    <>
      {/* Command Execution Result */}
      {commandResult !== null && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Command Execution Result</h3>
            <button onClick={onClearResult} className="p-1 hover:bg-background rounded transition-colors">
              <Trash2 className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Executed command:</p>
              <code className="font-mono text-sm bg-background px-2 py-1 rounded text-text-primary">
                {commandResult.command}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Status:</span>
              <span
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  commandResult.success
                    ? 'bg-status-success/10 text-status-success'
                    : 'bg-status-failed/10 text-status-failed',
                )}
              >
                {commandResult.success ? 'Success' : 'Failed'}
              </span>
              <span className="text-xs text-text-secondary ml-4">Duration:  {commandResult.duration}ms</span>
            </div>
            {commandResult.stdout && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Output:</p>
                <pre className="bg-background p-3 rounded text-xs overflow-x-auto text-text-primary font-mono max-h-60 overflow-y-auto">
                  {commandResult.stdout}
                </pre>
              </div>
            )}
            {commandResult.stderr && (
              <div>
                <p className="text-xs text-status-warning mb-1">Error:</p>
                <pre className="bg-status-failed/5 p-3 rounded text-xs overflow-x-auto text-status-failed font-mono max-h-60 overflow-y-auto">
                  {commandResult.stderr}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Command Execution Area */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Execute on {selectedServer.name} 
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Command</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => onCommandChange(e.target.value)}
                placeholder="Enter the command to execute..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
                disabled={isExecuting}
              />
              <button
                onClick={onExecute}
                disabled={!command || isExecuting}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Terminal className="w-4 h-4" />
                    Execute
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-secondary">Common Commands:</span>
            {['uname -a', 'df -h', 'free -h', 'uptime', 'whoami', 'ps aux'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => onCommandChange(cmd)}
                className="px-2 py-1 bg-background border border-border rounded text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
