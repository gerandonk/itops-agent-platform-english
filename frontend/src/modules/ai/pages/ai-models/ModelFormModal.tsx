import clsx from 'clsx';
import {
  ArrowRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import type { AIModelFormData } from './types';
import { PROVIDER_PRESETS, getProviderLabel, getProviderPreset } from './types';
import type { ProviderPreset } from './types';

interface ModelFormModalProps {
  editingModel: boolean;
  addStep: 'select' | 'form';
  showProviderDropdown: boolean;
  setShowProviderDropdown: (v: boolean) => void;
  formData: AIModelFormData;
  setFormData: React.Dispatch<React.SetStateAction<AIModelFormData>>;
  setAddStep: (step: 'select' | 'form') => void;
  closeModal: () => void;
  handleProviderSelect: (
    providerValue: string,
    defaultBase: string,
    defaultModels: string[],
    label: string
  ) => void;
  handleSubmit: () => void;
  isPending: boolean;
}

export function ModelFormModal({
  editingModel,
  addStep,
  showProviderDropdown,
  setShowProviderDropdown,
  formData,
  setFormData,
  setAddStep,
  closeModal,
  handleProviderSelect,
  handleSubmit,
  isPending,
}: ModelFormModalProps) {
  if (addStep === 'select') {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h4 className="font-medium text-text-primary mb-2">Select AI Platform</h4>
        <p className="text-sm text-text-secondary mb-6">Select the AI service provider to add</p>

        <div className="space-y-3">
          {PROVIDER_PRESETS.map((provider: ProviderPreset) => (
            <button
              key={provider.value}
              onClick={() =>
                handleProviderSelect(
                  provider.value,
                  provider.defaultBase,
                  provider.defaultModels,
                  provider.label
                )
              }
              className="w-full flex items-center gap-4 p-4 bg-background border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <span className="text-2xl">{provider.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-text-primary">{provider.label}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {provider.needApiKey ? 'API Key required' : 'No API Key needed'} · Default model:  {provider.defaultModels.join(', ')}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary" />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t border-border">
          <button
            onClick={() => {
              setAddStep('select');
              closeModal();
            }}
            className="px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const providerPreset = getProviderPreset(formData.provider_type);

  return (
    <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <h4 className="font-medium text-text-primary mb-4">
        {editingModel ? 'Edit AI model' : 'Configure AI model'}
      </h4>

      <div className="space-y-4">
        {/* Platform selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-text-secondary mb-2">AI Platform *</label>
          <button
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className="w-full flex items-center justify-between flex-wrap px-4 py-2 bg-background border border-border rounded-lg text-text-primary hover:border-primary/50 transition-all"
          >
            <span className="flex items-center gap-2">
              <span>{providerPreset?.icon}</span>
              <span>{getProviderLabel(formData.provider_type)}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </button>

          {showProviderDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10">
              {PROVIDER_PRESETS.map((provider) => (
                <button
                  key={provider.value}
                  onClick={() =>
                    handleProviderSelect(
                      provider.value,
                      provider.defaultBase,
                      provider.defaultModels,
                      provider.label
                    )
                  }
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-all',
                    formData.provider_type === provider.value && 'bg-primary/10'
                  )}
                >
                  <span>{provider.icon}</span>
                  <span className="text-text-primary">{provider.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Display Name *</label>
          <input
            type="text"
            placeholder="e.g.: Doubao-DeepSeek-V4-Pro"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Model ID */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Model ID *</label>
          <input
            type="text"
            placeholder="e.g.: deepseek-v4-pro-260425"
            value={formData.model_id}
            onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />
          {/* Quick-select common models */}
          <div className="flex flex-wrap gap-2 mt-2">
            {providerPreset?.defaultModels.map((model) => (
              <button
                key={model}
                onClick={() => setFormData({ ...formData, model_id: model })}
                className={clsx(
                  'px-2 py-1 rounded text-xs transition-all',
                  formData.model_id === model
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-background border border-border text-text-secondary hover:border-primary/30'
                )}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        {providerPreset?.needApiKey && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">API Key *</label>
            <input
              type="password"
              placeholder="sk-xxxxxxxxxxxx"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* API Base URL */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">API Endpoint</label>
          <input
            type="text"
            placeholder={providerPreset?.defaultBase}
            value={formData.api_base}
            onChange={(e) => setFormData({ ...formData, api_base: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-text-tertiary mt-1">
            Default:  {providerPreset?.defaultBase}
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Tags (comma-separated, optional)</label>
          <input
            type="text"
            placeholder="Code generation, high cost-performance"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          onClick={() => {
            closeModal();
            setAddStep('select');
          }}
          className="px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {editingModel ? 'Save' : 'Add and test'}
        </button>
      </div>
    </div>
  );
}

export default ModelFormModal;
