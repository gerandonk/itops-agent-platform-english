/**
 * 工作流节点注册表
 * 定义所有可用节点类型的元数据
 */
import { ENHANCED_NODE_TYPES } from './enhancedNodeTypes';

export interface WorkflowNodeTypeMeta {
  type: string;
  label: string;
  description: string;
  category: 'core' | 'execution' | 'verification' | 'decision' | 'knowledge';
  icon: string;
  defaultConfig: Record<string, string | number | boolean | string[] | object[] | object>;
}

const NODE_REGISTRY: WorkflowNodeTypeMeta[] = [
  // ── 核心节点 ──
  { type: 'start', label: 'Start', description: 'Workflow Start Node', category: 'core', icon: 'play', defaultConfig: {} },
  { type: 'end', label: 'End', description: 'Workflow End Node', category: 'core', icon: 'stop', defaultConfig: {} },

  // ── 执行节点 ──
  { type: 'agent', label: 'Agent Node', description: 'Call AI Agent to execute task', category: 'execution', icon: 'bot', defaultConfig: { agentId: '', input: '' } },
  { type: 'approval', label: 'Approval Node', description: 'Pause and wait for manual approval', category: 'execution', icon: 'check-circle', defaultConfig: { approvalConfig: { description: '', timeout: 3600, approvers: ['admin'] } } },

  // ── 验证节点（从 AARS 移植） ──
  { type: 'verification', label: 'Verification Node', description: '5-tier verification gate chain: Command Execution → Service Health → Metric Recovery → Baseline Comparison → Impact Assessment', category: 'verification', icon: 'shield-check', defaultConfig: { gates: ['command_success', 'service_health', 'metric_recovery', 'impact_assessment'], timeout: 300000 } },

  // ── 决策节点（从 AARS 移植） ──
  { type: 'risk_assess', label: 'Risk Assessment', description: 'Three-dimensional quantitative risk scoring: Operational Risk + Urgency + Confidence', category: 'decision', icon: 'chart-bar', defaultConfig: {} },
  { type: 'decision', label: 'Intelligent Decision', description: 'Automatic decision-making based on risk assessment results: Auto Execute / Require Approval / Escalate to Human / Block', category: 'decision', icon: 'lightbulb', defaultConfig: { rules: [{ condition: 'risk_score <= 0.35', action: 'auto_execute', description: 'Low risk auto execution' }, { condition: 'risk_score <= 0.65', action: 'request_approval', description: 'Medium risk requires approval' }, { condition: 'risk_score > 0.65', action: 'escalate_to_human', description: 'High risk escalate to human' }] } },

  // ── 知识与回滚节点 ──
  { type: 'rollback', label: 'Rollback Node', description: 'Execute rollback command to restore system to pre-repair state', category: 'verification', icon: 'undo', defaultConfig: { commandTimeout: 30000 } },
  { type: 'knowledge', label: 'Knowledge Precipitation', description: 'Automatically precipitate execution process to knowledge base, supporting deduplication', category: 'knowledge', icon: 'book-open', defaultConfig: { deduplicate: true } },
];

export function getNodeTypeMeta(type: string): WorkflowNodeTypeMeta | undefined {
  return NODE_REGISTRY.find(n => n.type === type);
}

export function getNodeTypesByCategory(category: WorkflowNodeTypeMeta['category']): WorkflowNodeTypeMeta[] {
  return NODE_REGISTRY.filter(n => n.category === category);
}

export function getAllNodeTypes(): WorkflowNodeTypeMeta[] {
  return [...NODE_REGISTRY];
}

export function getEnhancedNodeTypes(): string[] {
  return [...ENHANCED_NODE_TYPES];
}
