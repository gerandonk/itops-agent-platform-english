import { Modal } from 'antd';
import { RefreshCw } from 'lucide-react';
import type { TaskDisplay, WorkflowDisplay } from '../types';

interface RetryConfirmModalProps {
  task: TaskDisplay | null;
  workflow: WorkflowDisplay | undefined;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 失败重投确认 Modal（2026-07-21 拆分）
 * 把 653 行的 Tasks.tsx 中 L613-649 的 Modal 抽离
 */
export function RetryConfirmModal({
  task,
  workflow,
  isPending,
  onCancel,
  onConfirm,
}: RetryConfirmModalProps) {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          <span>Confirm Failed Retry</span>
        </div>
      }
      open={!!task}
      onCancel={() => !isPending && onCancel()}
      confirmLoading={isPending}
      onOk={onConfirm}
      okText="Retry immediately"
      cancelText="Cancel"
    >
      <div className="py-2 space-y-3">
        <p>
          Will be based on task <span className="font-mono font-semibold text-text-primary">{task?.name}</span> Create a new task and re-execute immediately.
        </p>
        <div className="bg-surface border border-border rounded-lg p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-text-secondary">Workflow:</span>
            <span className="font-medium">{workflow?.name || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Original Task Status:</span>
            <span className="font-medium text-status-failed">{task?.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Original Task ID:</span>
            <span className="font-mono text-xs">{task?.id.slice(0, 8)}...</span>
          </div>
        </div>
        <p className="text-xs text-text-secondary">
          ℹ️ Retry will inherit the context of the original task, but execute independently as a new task without modifying the original task status.
        </p>
      </div>
    </Modal>
  );
}