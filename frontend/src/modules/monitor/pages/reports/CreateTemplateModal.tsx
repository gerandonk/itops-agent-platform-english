import { X } from 'lucide-react';

export interface CreateTemplateFormState {
  name: string;
  description: string;
  type: 'incident' | 'inspection' | 'change';
  content: string;
  variables: string[];
}

interface CreateTemplateModalProps {
  open: boolean;
  form: CreateTemplateFormState;
  onChange: (next: CreateTemplateFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function CreateTemplateModal({ open, form, onChange, onClose, onSubmit, submitting }: CreateTemplateModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap mb-4">
            <h2 className="text-xl font-bold text-text-primary">Create Report Template</h2>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-lg text-text-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-primary mb-1">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg p-2 text-text-primary"
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm text-text-primary mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => onChange({ ...form, description: e.target.value })}
                className="w-full bg-background border border-border rounded-lg p-2 text-text-primary"
                placeholder="Enter template description"
              />
            </div>
            <div>
              <label className="block text-sm text-text-primary mb-1">Report Type</label>
              <select
                value={form.type}
                onChange={(e) => onChange({ ...form, type: e.target.value as 'incident' | 'inspection' | 'change' })}
                className="w-full bg-background border border-border rounded-lg p-2 text-text-primary"
              >
                <option value="incident">Fault report</option>
                <option value="inspection">Inspection report</option>
                <option value="change">Change log</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-primary mb-1">
                Template Content (Use {'{{variable}}'} to define variables)
              </label>
              <textarea
                value={form.content}
                onChange={(e) => onChange({ ...form, content: e.target.value })}
                className="w-full bg-background border border-border rounded-lg p-2 text-text-primary font-mono text-sm"
                rows={10}
                placeholder="Enter template content..."
              />
            </div>
            <div>
              <label className="block text-sm text-text-primary mb-1">
                Variable List (one per line)
              </label>
              <textarea
                value={form.variables?.join('\n') || ''}
                onChange={(e) => onChange({
                  ...form,
                  variables: e.target.value.split('\n').filter((v) => v.trim()),
                })}
                className="w-full bg-background border border-border rounded-lg p-2 text-text-primary font-mono text-sm"
                rows={4}
                placeholder="variable1&#10;variable2&#10;..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-background hover:bg-surface text-text-primary py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2 rounded-lg"
            >
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
