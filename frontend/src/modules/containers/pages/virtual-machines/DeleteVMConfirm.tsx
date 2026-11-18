import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface DeleteVMConfirmProps {
  vmName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteVMConfirm({ vmName, deleting, onCancel, onConfirm }: DeleteVMConfirmProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-surface rounded-xl p-6 w-full max-w-sm mx-4 border border-red-500/20" onClick={event => event.stopPropagation()}>
        <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Delete Virtual Machine
        </h3>
        <p className="text-text-secondary mb-6">
          Are you sure you want to delete virtual machine <span className="text-text-primary font-medium">{vmName}</span> ? This action will remove it from both the virtualization platform and the local database.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
