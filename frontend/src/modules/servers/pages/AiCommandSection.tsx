import {
  Bot, Server, AlertCircle, Sparkles, RefreshCw, Terminal, X,
} from 'lucide-react';
import clsx from 'clsx';
import type { Server as ServerType } from './types';

interface AiCommandSectionProps {
  isOpen: boolean;
  aiCommandServer: ServerType | null;
  aiPrompt: string;
  onAiPromptChange: (v: string) => void;
  aiGeneratedCommand: string;
  onAiGeneratedCommandChange: (v: string) => void;
  aiCommandExplanation: string;
  aiGenerationError: string;
  isAiGenerating: boolean;
  selectedAiAgent: { id: string; name: string } | null;
  showAiCommandConfirm: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onExecute: () => void;
  onConfirmExecute: () => void;
  onCancelConfirm: () => void;
}

export function AiCommandSection({
  isOpen,
  aiCommandServer,
  aiPrompt,
  onAiPromptChange,
  aiGeneratedCommand,
  onAiGeneratedCommandChange,
  aiCommandExplanation,
  aiGenerationError,
  isAiGenerating,
  selectedAiAgent,
  showAiCommandConfirm,
  onClose,
  onGenerate,
  onExecute,
  onConfirmExecute,
  onCancelConfirm,
}: AiCommandSectionProps) {
  if (!isOpen || !aiCommandServer) return null;

  return (
    <>
      {/* AI Command Generation Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between flex-wrap mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center">
                <Bot className="w-5 h-5 text-text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">AI Command Generation</h3>
                <p className="text-sm text-text-secondary mt-1.5">
                  {aiCommandServer.name} ({aiCommandServer.hostname})
                  {selectedAiAgent && (
                    <span className="ml-2 text-text-tertiary">
                      · Default Call{' '}
                      <span className="font-medium text-text-secondary">{selectedAiAgent.name} Agent</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-lg transition-colors">
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* No Agent Notice */}
          {!selectedAiAgent && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300 font-medium">
                No available AI Agent. Please go to the 'Agent Management' page to create and enable an Agent first.
              </p>
            </div>
          )}

          {/* Generation Error Notice */}
          {aiGenerationError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300 font-medium">{aiGenerationError}</p>
            </div>
          )}

          {/* OS Information Display */}
          <div className="mb-6 p-3 bg-background border border-border rounded-lg">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary">Target OS:</span>
                <span className="text-text-primary font-medium">
                  {aiCommandServer?.os || aiCommandServer?.os_type || 'linux (default, no info collected)'}
                </span>
              </div>
              {!aiCommandServer?.os && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  It is recommended to collect server information first for more accurate command generation
                </span>
              )}
            </div>
          </div>

          {/* Input Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">Describe the operation you want to perform</label>
            <div className="relative">
              <textarea
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                placeholder="e.g.: Check disk usage / Check top 10 processes by memory usage / Check if Nginx is running..."
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-purple-500 text-text-primary resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
              />
              <button
                onClick={onGenerate}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-text-primary text-surface rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Command
                  </>
                )}
              </button>
            </div>
            {/* Quick Tips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(aiCommandServer?.os_type === 'windows'
                ? [
                    'View disk usage',
                    'Check top 10 processes by memory usage',
                    'View port listening status',
                    'Check IIS service status',
                    'View system load',
                    'View system event log',
                    'View currently logged-in users',
                    'Clean temporary files',
                    'Check Windows service status',
                  ]
                : [
                    'View disk usage rate',
                    'Check top 10 processes by memory usage',
                    'View port listening status',
                    'Check Nginx service status',
                    'View system load',
                    'View last 20 lines of system log',
                    'View currently logged-in users',
                    'Clean temporary files',
                    'Check Docker container status',
                  ]
              ).map((tip) => (
                <button
                  key={tip}
                  onClick={() => onAiPromptChange(tip)}
                  className="px-4 py-1.5 bg-surface/80 border border-border/50 text-text-primary rounded-full text-sm hover:bg-surface hover:border-purple-500/40 transition-colors"
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Command */}
          {aiGeneratedCommand && (
            <div className="mb-6">
              <div className="flex items-center justify-between flex-wrap mb-2">
                <label className="block text-sm font-medium text-text-secondary">AI-generated command (editable)</label>
                <button
                  onClick={() => navigator.clipboard.writeText(aiGeneratedCommand)}
                  className="text-xs text-text-tertiary hover:text-text-secondary"
                >
                  Copy Command
                </button>
              </div>
              <textarea
                value={aiGeneratedCommand}
                onChange={(e) => onAiGeneratedCommandChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-black/80 border border-border rounded-lg font-mono text-sm text-green-400 focus:outline-none focus:border-purple-500 resize-y"
              />
              {aiCommandExplanation && (
                <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
                  <p className="text-sm text-yellow-300 dark:text-yellow-200 font-medium">
                    <strong>💡 Note:</strong>
                    {aiCommandExplanation}
                  </p>
                </div>
              )}
              <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                <p className="text-sm text-red-300 dark:text-red-200 font-medium">
                  <strong>⚠️ Warning:</strong>
                  Please carefully verify the safety and correctness of the command before execution! Incorrect commands may lead to data loss or system failure.
                </p>
              </div>
            </div>
          )}

          {/* Button Group */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-colors"
            >
              Cancel
            </button>
            {aiGeneratedCommand && (
              <>
                <button
                  onClick={() => {
                    onAiGeneratedCommandChange('');
                    onGenerate();
                  }}
                  disabled={isAiGenerating}
                  className="flex-1 px-4 py-2 bg-surface border border-border text-text-secondary rounded-lg hover:bg-background transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={clsx('w-4 h-4', isAiGenerating && 'animate-spin')} />
                  Regenerate
                </button>
                <button
                  onClick={onExecute}
                  className="flex-1 px-4 py-2 bg-text-primary text-surface rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  Confirm and Execute
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Command Execution Confirmation Dialog */}
      {showAiCommandConfirm && aiCommandServer && aiGeneratedCommand && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-bold text-text-primary mb-4">Confirm Command Execution</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Server className="w-4 h-4 text-text-secondary" />
                <span className="text-text-secondary">Target Server:</span>
                <span className="text-text-primary font-medium">
                  {aiCommandServer.name} ({aiCommandServer.hostname})
                </span>
              </div>
              <div>
                <span className="text-sm text-text-secondary">Command:</span>
                <div className="mt-1 bg-black/80 rounded-lg p-3">
                  <code className="text-green-400 font-mono text-sm break-all">{aiGeneratedCommand}</code>
                </div>
              </div>
              {aiCommandExplanation && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    <strong>💡 Note:</strong>
                    {aiCommandExplanation}
                  </p>
                </div>
              )}
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300 font-medium">
                  ⚠️ This operation will execute commands on the target server. Please confirm the safety of the commands!
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancelConfirm}
                className="flex-1 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmExecute}
                className="flex-1 px-4 py-2 bg-text-primary text-surface rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                Confirm Execution
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
