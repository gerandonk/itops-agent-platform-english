/**
 * Agent 名称常量
 * 统一管理 agent 名称，避免硬编码字符串散落在各处
 */
export const AGENT_NAMES = {
  SERVER_COMMAND: 'Server Command Execution',
  SYSTEM_INSPECTION: 'System Inspection',
  AUTO_INSPECTION: 'Automatic Inspection',
  COMPLIANCE_CHECK: 'Compliance Inspection',
  ALERT_HANDLER: 'Alert Handling',
  FAULT_DIAGNOSIS: 'Fault Diagnosis',
  LOG_ANALYSIS: 'Log Analysis',
  CHANGE_EXECUTION: 'Change Execution',
  DOC_GENERATION: 'Documentation Generation',
  DATABASE_ADMIN: 'Database Ops',
} as const;

export type AgentName = (typeof AGENT_NAMES)[keyof typeof AGENT_NAMES];
