import clsx from 'clsx';
import {
  GripVertical,
  Zap,
  Loader2,
  Power,
  CheckCircle2,
  Pencil,
  Trash2,
  Bot,
  AlertCircle,
} from 'lucide-react';
import type { AIModel } from './types';
import { getProviderColor, getProviderLabel } from './types';
import type { UseMutationResult } from '@tanstack/react-query';

type TestMutation = UseMutationResult<unknown, unknown, string, unknown>;
type ToggleMutation = UseMutationResult<unknown, unknown, { id: string; enabled: boolean }, unknown>;
type DefaultMutation = UseMutationResult<unknown, unknown, string, unknown>;
type DeleteMutation = UseMutationResult<unknown, unknown, string, unknown>;

interface ModelListProps {
  models: AIModel[];
  testResults: Record<string, { success: boolean; message: string }>;
  testingModel: string | null;
  draggedModel: string | null;
  testModelMutation: TestMutation;
  toggleModelMutation: ToggleMutation;
  setDefaultModelMutation: DefaultMutation;
  deleteModelMutation: DeleteMutation;
  handleDragStart: (id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (id: string) => void;
  openEditModal: (model: AIModel) => void;
  openAddModal: () => void;
}

export function ModelList({
  models,
  testResults,
  testingModel,
  draggedModel,
  testModelMutation,
  toggleModelMutation,
  setDefaultModelMutation,
  deleteModelMutation,
  handleDragStart,
  handleDragOver,
  handleDrop,
  openEditModal,
  openAddModal,
}: ModelListProps) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <p className="text-text-secondary mb-2">No AI models configured</p>
        <p className="text-sm text-text-tertiary mb-4">Click "Add model" to start configuring</p>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
        >
          Add your first model
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {models.map((model) => (
        <div
          key={model.id}
          draggable
          onDragStart={() => handleDragStart(model.id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(model.id)}
          className={clsx(
            'p-4 transition-all cursor-move',
            model.enabled ? 'bg-surface' : 'bg-surface/50 opacity-60',
            draggedModel === model.id && 'opacity-40'
          )}
        >
          <div className="flex items-start gap-4">
            <GripVertical className="w-5 h-5 text-text-secondary mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-text-primary">{model.name}</h3>
                {model.is_default === 1 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary">Default</span>
                )}
                {model.enabled === 1 ? (
                  <span className="px-2 py-0.5 rounded text-xs bg-status-success/10 text-status-success">Enabled</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs bg-status-failed/10 text-status-failed">Disabled</span>
                )}
                <span className={clsx('px-2 py-0.5 rounded text-xs', getProviderColor(model.provider_type))}>
                  {getProviderLabel(model.provider_type)}
                </span>
              </div>
              <div className="text-sm text-text-secondary">
                <span>Model ID:  {model.model_id}</span>
                {model.tags && model.tags.length > 0 && (
                  <span className="ml-4">
                    Tags:  {model.tags.join(', ')}
                  </span>
                )}
              </div>
              {model.last_test_time && (
                <div className="text-xs text-text-tertiary mt-1">
                  Last tested:  {new Date(model.last_test_time).toLocaleString()} - {model.last_test_status === 'success' ? 'Success' : 'Failed'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => testModelMutation.mutate(model.id)}
                disabled={testingModel === model.id}
                className="px-3 py-1.5 rounded-lg hover:bg-background transition-colors flex items-center gap-1.5 text-sm"
                title="Test connectivity"
              >
                {testingModel === model.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <Zap className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-text-secondary">Test</span>
              </button>
              <button
                onClick={() => toggleModelMutation.mutate({ id: model.id, enabled: model.enabled === 0 })}
                className={clsx(
                  'px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm',
                  model.enabled === 1
                    ? 'bg-status-success/10 text-status-success hover:bg-status-success/20'
                    : 'bg-status-failed/10 text-status-failed hover:bg-status-failed/20'
                )}
                title={model.enabled === 1 ? 'Disable' : 'Enable'}
              >
                <Power className="w-4 h-4" />
                <span>{model.enabled === 1 ? 'Disable' : 'Enable'}</span>
              </button>
              {model.is_default !== 1 && (
                <button
                  onClick={() => setDefaultModelMutation.mutate(model.id)}
                  className="px-3 py-1.5 rounded-lg hover:bg-background transition-colors flex items-center gap-1.5 text-sm"
                  title="Set as default"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-text-secondary">Default</span>
                </button>
              )}
              <button
                onClick={() => openEditModal(model)}
                className="px-3 py-1.5 rounded-lg hover:bg-background transition-colors flex items-center gap-1.5 text-sm"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
                <span className="text-text-secondary">Edit</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this model?')) {
                    deleteModelMutation.mutate(model.id);
                  }
                }}
                className="px-3 py-1.5 rounded-lg hover:bg-status-failed/10 transition-colors flex items-center gap-1.5 text-sm"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-status-failed" />
                <span className="text-status-failed">Delete</span>
              </button>
            </div>
          </div>
          {testResults[model.id] && (
            <div className={clsx(
              'mt-3 p-2 rounded text-sm flex items-center gap-2',
              testResults[model.id].success ? 'bg-status-success/10 text-status-success' : 'bg-status-failed/10 text-status-failed'
            )}>
              {testResults[model.id].success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testResults[model.id].message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ModelList;
