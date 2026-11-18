import { AlertTriangle, ClipboardCheck, Loader2, X } from 'lucide-react';

interface BatchInspectModalProps {
  count: number;
  isInspecting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BatchInspectModal({ count, isInspecting, onClose, onConfirm }: BatchInspectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-medium text-text-primary">Batch Inspection ({count} devices)</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-300">
              <p className="font-medium mb-1">Confirm Batch Inspection</p>
              <p>Will execute standard inspection on {count} devices. This operation may take a while.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-background/50 rounded-b-xl border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-md"
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isInspecting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600/90 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none"
          >
            {isInspecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Inspecting...</>
            ) : (
              <><ClipboardCheck className="w-4 h-4" />Confirm Inspection</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}