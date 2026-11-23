import { Plus } from 'lucide-react';
import { ModelList } from './ModelList';
import { ModelFormModal } from './ModelFormModal';
import { useAIModels } from './useAIModels';

export default function AIModelsPage() {
  const {
    showAddModal,
    editingModel,
    addStep,
    showProviderDropdown,
    formData,
    setFormData,
    modelsData,
    testResults,
    testingModel,
    draggedModel,
    testModelMutation,
    toggleModelMutation,
    setDefaultModelMutation,
    deleteModelMutation,
    createModelMutation,
    updateModelMutation,
    setShowProviderDropdown,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleProviderSelect,
    handleSubmit,
    openAddModal,
    openEditModal,
    closeModal,
    setAddStep,
  } = useAIModels();

  const isPending = createModelMutation.isPending || updateModelMutation.isPending;

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">AI Model Management</h1>
            <p className="text-text-secondary">Add and manage all AI models, with multi-platform configuration support</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Model
          </button>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <ModelList
            models={modelsData || []}
            testResults={testResults}
            testingModel={testingModel}
            draggedModel={draggedModel}
            testModelMutation={testModelMutation}
            toggleModelMutation={toggleModelMutation}
            setDefaultModelMutation={setDefaultModelMutation}
            deleteModelMutation={deleteModelMutation}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            openEditModal={openEditModal}
            openAddModal={openAddModal}
          />
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <ModelFormModal
              editingModel={!!editingModel}
              addStep={addStep}
              showProviderDropdown={showProviderDropdown}
              setShowProviderDropdown={setShowProviderDropdown}
              formData={formData}
              setFormData={setFormData}
              setAddStep={setAddStep}
              closeModal={closeModal}
              handleProviderSelect={handleProviderSelect}
              handleSubmit={handleSubmit}
              isPending={isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
