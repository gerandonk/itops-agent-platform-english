import { ArrowLeft, Save, Play, Download, Upload, Undo, Redo, AlertCircle } from 'lucide-react';

interface EditorToolbarProps {
  isNew: boolean;
  showExecute: boolean;
  name: string;
  description: string;
  isTemplate: boolean;
  validationErrors: string[];
  historyIndex: number;
  historyLength: number;
  saving: boolean;
  onBack: () => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTemplateChange: (checked: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImport: React.ChangeEventHandler<HTMLInputElement>;
  onExport: () => void;
  onExecute: () => void;
  onSave: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function EditorToolbar({
  isNew,
  showExecute,
  name,
  description,
  isTemplate,
  validationErrors,
  historyIndex,
  historyLength,
  saving,
  onBack,
  onNameChange,
  onDescriptionChange,
  onTemplateChange,
  onUndo,
  onRedo,
  onImport,
  onExport,
  onExecute,
  onSave,
  fileInputRef,
}: EditorToolbarProps) {
  return (
    <div className="border-b border-border bg-surface p-4">
      <div className="flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold">
              {isNew ? 'New workflow' : 'Edit workflow'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={historyIndex >= historyLength - 1}
            className="p-2 rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-2" />

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors"
            title="Import workflow"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors"
            title="Export workflow"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <div className="w-px h-6 bg-border mx-2" />

          {showExecute && (
            <button
              onClick={onExecute}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Execute Immediately
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Workflow Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g.: Server CPU alert auto-troubleshooting"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Workflow Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe the purpose of this workflow"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => onTemplateChange(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-text-secondary">Set as Template</span>
          </label>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Issues Found</span>
          </div>
          <ul className="text-sm text-red-500 space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}