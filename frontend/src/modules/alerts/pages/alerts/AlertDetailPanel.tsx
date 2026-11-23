import { Play, X as XIcon, ExternalLink, CheckCircle2, AlertCircle as AlertCircle2, ListChecks, Terminal } from 'lucide-react';
import type { ProcessResult } from './types';

function hasProcessRecords(result: ProcessResult) {
  return result.matchedPolicies.length > 0 || (result.mappingTasks?.length || 0) > 0;
}

interface AlertDetailPanelProps {
  processResult: ProcessResult;
  onClose: () => void;
  navigate: (path: string) => void;
}

export default function AlertDetailPanel({
  processResult,
  onClose,
  navigate,
}: AlertDetailPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-border max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b border-border flex items-center justify-between flex-wrap rounded-t-xl ${
          processResult.error
            ? 'bg-gradient-to-r from-amber-500/10 to-red-500/10'
            : hasProcessRecords(processResult)
              ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10'
              : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10'
        }`}>
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            {processResult.error ? (
              <AlertCircle2 className="w-5 h-5 text-red-500" />
            ) : hasProcessRecords(processResult) ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Play className="w-5 h-5 text-blue-500" />
            )}
            Alert Handling Result
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto flex-1">
          {/* Status */}
          <div className={`p-3 rounded-lg border ${
            processResult.error
              ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              : hasProcessRecords(processResult)
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}>
            <p className="text-sm font-medium">
              {processResult.error
                ? '⚠️ Execution encountered an error: ' + processResult.error
                : hasProcessRecords(processResult)
                  ? `Triggered \${processResult.matchedPolicies.length} remediation policies, \${processResult.mappingTasks?.length || 0} alert mapping tasks, \${processResult.executionIds.length} remediation execution records created`
                  : 'ℹ️ No repair policy matched (alert level/keywords do not meet existing policy conditions)'}
            </p>
          </div>

          {/* Policy list */}
          {processResult.matchedPolicies.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-primary" />
                Matched policies
              </h4>
              <div className="space-y-2">
                {processResult.matchedPolicies.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between flex-wrap p-2.5 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm text-text-primary">{p.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.execution_mode === 'auto' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                      p.execution_mode === 'approval' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {p.execution_mode === 'auto' ? 'Auto' : p.execution_mode === 'approval' ? 'Requires approval' : 'Suggestion only'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution ID */}
          {!!processResult.mappingTasks?.length && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-primary" />
                Alert-mapped workflow tasks
              </h4>
              <div className="space-y-2">
                {processResult.mappingTasks.map((task) => (
                  <div key={task.taskId} className="p-2.5 bg-background rounded-lg border border-border">
                    <div className="text-sm text-text-primary">{task.workflowName}</div>
                    <code className="block text-xs text-text-secondary truncate mt-1">{task.taskId}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processResult.executionIds.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">Execution Record ID</h4>
              <div className="space-y-1">
                {processResult.executionIds.map(eid => (
                  <code key={eid} className="block text-xs bg-background px-2 py-1 rounded border border-border text-text-secondary truncate">
                    {eid}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background border border-border rounded-lg text-text-primary hover:bg-surface transition-colors font-medium text-sm"
          >
            Close
          </button>
          {processResult.executionIds.length > 0 && (
            <button
              onClick={() => {
                onClose();
                navigate('/remediation-executions');
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View execution records
            </button>
          )}
          {!!processResult.mappingTasks?.length && (
            <button
              onClick={() => {
                onClose();
                const taskId = processResult.mappingTasks?.[0]?.taskId;
                navigate(taskId ? `/tasks?taskId=${encodeURIComponent(taskId)}` : '/tasks');
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View workflow tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}