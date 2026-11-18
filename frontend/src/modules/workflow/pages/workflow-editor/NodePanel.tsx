import type { Node } from '@xyflow/react';
import { Shield, Layers, GitBranch, Repeat, GitFork, Globe, Bell, Timer, GitMerge, BookOpen, Undo } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Agent, Provider } from './types';
import type { WorkflowNodeTypeMeta } from '../../api';
import workflowApi from '../../api';
import { NodeConfigPanel } from './NodeConfigPanel';

// v6: 后端 registry icon 字符串 → 前端 lucide-react 图标映射
const ICON_MAP: Record<string, typeof Shield> = {
  'git-branch': GitBranch,
  'repeat': Repeat,
  'git-fork': GitFork,
  'globe': Globe,
  'bell': Bell,
  'timer': Timer,
  'play': Shield,
  'stop': Undo,
  'bot': Layers,
  'check-circle': Shield,
  'shield-check': Shield,
  'chart-bar': Shield,
  'lightbulb': Shield,
  'undo': Undo,
  'book-open': BookOpen,
  'git-merge': GitMerge,
};

// v6: category → 前端颜色映射
const CATEGORY_COLOR: Record<string, string> = {
  flow_control: 'text-cyan-400',
  integration: 'text-blue-400',
  core: 'text-green-400',
  execution: 'text-primary',
  verification: 'text-cyan-500',
  decision: 'text-amber-400',
  knowledge: 'text-emerald-400',
};

interface NodePanelProps {
  agents: Agent[];
  providers: Provider[];
  selectedNode: Node | null;
  onDeleteSelectedNode: () => void;
  onDuplicateSelectedNode: () => void;
  onUpdateNodeLabel: (nodeId: string, value: string) => void;
  onUpdateNodeDescription: (nodeId: string, value: string) => void;
  onUpdateNodeInputKey: (nodeId: string, value: string) => void;
  onUpdateNodeOutputKey: (nodeId: string, value: string) => void;
  onUpdateNodePrompt: (nodeId: string, value: string) => void;
  onUpdateApprovalConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateProviderId: (nodeId: string, pid: string) => void;
  onUpdateProviderConfig: (nodeId: string, key: string, value: unknown) => void;
  onUpdateVerificationConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateRiskAssessConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateDecisionConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateKnowledgeConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateRollbackConfig: (nodeId: string, partial: Record<string, unknown>) => void;
  onUpdateGenericConfig: (nodeId: string, partial: Record<string, unknown>) => void;
}

const NON_CORE_NODES: Array<{
  type: string;
  label: string;
  description: string;
  icon: typeof Shield;
  color: string;
  borderClass: string;
  bgClass: string;
}> = [
  {
    type: 'condition',
    label: 'Condition branch',
    description: 'Select true/false execution branch based on expression result',
    icon: GitBranch,
    color: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    bgClass: 'hover:bg-cyan-500/10',
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over each element in the array to execute downstream nodes',
    icon: Repeat,
    color: 'text-purple-400',
    borderClass: 'border-purple-500/40',
    bgClass: 'hover:bg-purple-500/10',
  },
  {
    type: 'parallel',
    label: 'Parallel branch',
    description: 'Trigger multiple branches in parallel',
    icon: GitFork,
    color: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    bgClass: 'hover:bg-cyan-500/10',
  },
  {
    type: 'http',
    label: 'HTTP request',
    description: 'Initiate an HTTP request directly (no Provider needed)',
    icon: Globe,
    color: 'text-blue-400',
    borderClass: 'border-blue-500/40',
    bgClass: 'hover:bg-blue-500/10',
  },
  {
    type: 'notify',
    label: 'Notification',
    description: 'Send instant notification (Feishu/DingTalk/WeCom/Email/Webhook)',
    icon: Bell,
    color: 'text-orange-400',
    borderClass: 'border-orange-500/40',
    bgClass: 'hover:bg-orange-500/10',
  },
  {
    type: 'delay',
    label: 'Delay/Wait',
    description: 'Pause execution for a period or wait for a condition to be met',
    icon: Timer,
    color: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'hover:bg-amber-500/10',
  },
];

export function NodePanel({
  agents,
  providers,
  selectedNode,
  onDeleteSelectedNode,
  onDuplicateSelectedNode,
  onUpdateNodeLabel,
  onUpdateNodeDescription,
  onUpdateNodeInputKey,
  onUpdateNodeOutputKey,
  onUpdateNodePrompt,
  onUpdateApprovalConfig,
  onUpdateProviderId,
  onUpdateProviderConfig,
  onUpdateVerificationConfig,
  onUpdateRiskAssessConfig,
  onUpdateDecisionConfig,
  onUpdateKnowledgeConfig,
  onUpdateRollbackConfig,
  onUpdateGenericConfig,
}: NodePanelProps) {
  // v6: 节点元数据从后端 registry 拉取（前后端共用源）
  const { data: nodeTypesData } = useQuery({
    queryKey: ['workflow-node-types'],
    queryFn: () => workflowApi.listNodeTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 把后端节点元数据映射为前端可拖拽格式（仅 flow_control + integration 两类需拖拽）
  const registryDrivenNodes = (nodeTypesData || [])
    .filter((n: WorkflowNodeTypeMeta) => n.category === 'flow_control' || n.category === 'integration')
    .filter((n: WorkflowNodeTypeMeta) => n.type !== 'start' && n.type !== 'end');
  return (
    <div className="w-80 border-r border-border bg-surface flex flex-col min-h-0">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Available Nodes
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          <div
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/reactflow/nodeType', 'approval');
              event.dataTransfer.effectAllowed = 'move';
            }}
            className="p-3 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:border-orange-500 hover:bg-orange-500/15 cursor-move transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-orange-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-text-primary text-sm">Approval node</div>
                <div className="text-xs text-text-secondary">Manual Confirmation</div>
              </div>
            </div>
            <div className="text-xs text-text-secondary line-clamp-2 mt-1">
              Pause workflow waiting for manual approval, supports automatic rejection on timeout
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="text-xs font-semibold text-text-secondary mb-2">Agent Node</div>
          </div>
          {agents.filter((agent) => agent.enabled === 1).map((agent) => (
            <div
              key={agent.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/nodeType', 'agent');
                event.dataTransfer.setData('application/reactflow/agentId', agent.id);
                event.dataTransfer.setData('application/reactflow/agentName', agent.name);
                event.dataTransfer.setData('application/reactflow/agentAvatar', agent.avatar || '🤖');
                event.dataTransfer.setData('application/reactflow/agentDescription', agent.description || '');
                event.dataTransfer.setData('application/reactflow/agentSystemPrompt', agent.system_prompt || '');
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 cursor-move transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{agent.avatar || '🤖'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary text-sm truncate">{agent.name}</div>
                  <div className="text-xs text-text-secondary truncate">{agent.role}</div>
                </div>
              </div>
              {agent.description && (
                <div className="text-xs text-text-secondary line-clamp-2 mt-1">{agent.description}</div>
              )}
            </div>
          ))}
          {agents.filter((agent) => agent.enabled === 1).length === 0 && (
            <div className="text-center py-4 text-text-secondary">
              <p className="text-xs">No available Agent</p>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <div className="text-xs font-semibold text-text-secondary mb-2">Provider Node (executes actions)</div>
          </div>
          {providers.map((provider) => (
            <div
              key={provider.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/nodeType', 'provider');
                event.dataTransfer.setData('application/reactflow/providerId', provider.id);
                event.dataTransfer.setData('application/reactflow/providerName', provider.name);
                event.dataTransfer.setData('application/reactflow/providerType', provider.type);
                event.dataTransfer.setData('application/reactflow/providerSchema', JSON.stringify(provider.configSchema));
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="p-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 cursor-move transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {provider.type === 'notification'
                    ? '🔔'
                    : provider.type === 'action'
                      ? '⚡'
                      : provider.type === 'script'
                        ? '📜'
                        : provider.type === 'alert'
                          ? '🚨'
                          : '🔧'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary text-sm truncate">{provider.name}</div>
                  <div className="text-xs text-text-secondary truncate">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        provider.type === 'notification'
                          ? 'bg-blue-500/20 text-blue-400'
                          : provider.type === 'action'
                            ? 'bg-green-500/20 text-green-400'
                            : provider.type === 'script'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {provider.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {providers.length === 0 && (
            <div className="text-center py-4 text-text-secondary">
              <p className="text-xs">No available Provider</p>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <div className="text-xs font-semibold text-text-secondary mb-2">Flow Control Node</div>
          </div>
          {/* v6: Prefer backend registry data, fallback to NON_CORE_NODES hardcoding on failure/unloaded */}
          {(registryDrivenNodes.length > 0 ? registryDrivenNodes : NON_CORE_NODES).map((n) => {
            const fromRegistry = registryDrivenNodes.length > 0;
            const regNode = n as WorkflowNodeTypeMeta;
            const hardNode = n as typeof NON_CORE_NODES[number];
            const Icon = fromRegistry ? ICON_MAP[regNode.icon as keyof typeof ICON_MAP] || GitBranch : hardNode.icon;
            const colorClass = fromRegistry ? CATEGORY_COLOR[regNode.category as keyof typeof CATEGORY_COLOR] || CATEGORY_COLOR.flow_control : hardNode.color;
            const borderClass = fromRegistry ? '' : hardNode.borderClass;
            const bgClass = fromRegistry ? 'hover:bg-primary/10' : hardNode.bgClass;
            const displayLabel = fromRegistry ? regNode.label : hardNode.label;
            const displayDesc = fromRegistry ? regNode.description : hardNode.description;
            return (
              <div
                key={n.type}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow/nodeType', n.type);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                className={`p-3 rounded-lg border bg-background ${borderClass} ${bgClass} cursor-move transition-all`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm">{displayLabel}</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary line-clamp-2 mt-1">
                  {displayDesc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          providers={providers}
          onDelete={onDeleteSelectedNode}
          onDuplicate={onDuplicateSelectedNode}
          onUpdateLabel={onUpdateNodeLabel}
          onUpdateDescription={onUpdateNodeDescription}
          onUpdateInputKey={onUpdateNodeInputKey}
          onUpdateOutputKey={onUpdateNodeOutputKey}
          onUpdatePrompt={onUpdateNodePrompt}
          onUpdateApprovalConfig={onUpdateApprovalConfig}
          onUpdateProviderId={onUpdateProviderId}
          onUpdateProviderConfig={onUpdateProviderConfig}
          onUpdateVerificationConfig={onUpdateVerificationConfig}
          onUpdateRiskAssessConfig={onUpdateRiskAssessConfig}
          onUpdateDecisionConfig={onUpdateDecisionConfig}
          onUpdateKnowledgeConfig={onUpdateKnowledgeConfig}
          onUpdateRollbackConfig={onUpdateRollbackConfig}
          onUpdateGenericConfig={onUpdateGenericConfig}
        />
      )}
    </div>
  );
}