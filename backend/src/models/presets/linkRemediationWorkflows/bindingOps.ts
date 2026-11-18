/**
 * linkRemediationWorkflows 绑定逻辑 + 插入执行（2026-07-21 拆分）
 *
 * 把原 linkRemediationWorkflows.ts L1-89 (bind 阶段) + L94-660 (insert 阶段) 的核心逻辑抽出
 * 提供纯函数：
 * - linkExistingPolicies：把已有 remediation_policies 按 name 绑定到 workflows
 * - insertExtraPolicies：批量插入额外的高级 preset
 *
 * 拆分原则遵循 architecture.md §3.3.1 + 第 3 条「向后兼容的 import 路径」
 */

import type Database from 'better-sqlite3';
import { logger } from '../../../utils/logger';

export interface PolicyRecord {
  id: string;
  name: string;
  workflow_id: string | null;
}

export interface WorkflowBindingResult {
  linked: number;
  inspected: number;
}

/** 步骤 1：把预设 remediation_policies 按 name 绑定到 workflows */
export function linkExistingPolicies(
  db: Database.Database,
  workflows: Array<{ id: string; name: string }>,
  existingPolicies: PolicyRecord[],
): WorkflowBindingResult {
  const wfMap = new Map<string, string>();
  for (const w of workflows) {
    wfMap.set(w.name, w.id);
  }

  const faultDiagId = wfMap.get('Fault Diagnosis');
  const alertHandleId = wfMap.get('Alert Handling');
  const changeExecId = wfMap.get('Change Execution');
  const healthCheckId = wfMap.get('Daily Health Check');
  const logAnalysisId = wfMap.get('Log Analysis');
  const fullFlowId = wfMap.get('AARS Full Closed-Loop Workflow');

  logger.info(
    `Found workflows: ${workflows.map((w) => `${w.name}(${w.id.slice(0, 8)})`).join(', ')}`,
  );

  const updateStmt = db.prepare(`
    UPDATE remediation_policies
    SET workflow_id = ?,
        verification_workflow_id = ?,
        rollback_workflow_id = ?,
        updated_at = datetime('now','localtime')
    WHERE id = ?
  `);

  const link = db.transaction(() => {
    for (const p of existingPolicies) {
      let wf: string | null = null;
      let vf: string | null = null;
      let rf: string | null = null;

      switch (p.name) {
        case 'Automatic Disk Space Cleanup':
          wf = faultDiagId ?? null;
          vf = healthCheckId ?? null;
          break;
        case 'Automatic Service Restart on Crash':
          wf = faultDiagId ?? null;
          vf = healthCheckId ?? null;
          break;
        case '高CPU使用率处理':
          wf = alertHandleId ?? null;
          vf = healthCheckId ?? null;
          break;
        case 'High Memory Usage Handling':
          wf = alertHandleId ?? null;
          vf = healthCheckId ?? null;
          break;
        case '网络设备CPU告警检查':
          wf = changeExecId ?? null;
          vf = logAnalysisId ?? null;
          rf = fullFlowId ?? null;
          break;
        default:
          // 未识别的策略保持原状
          break;
      }

      if (wf || vf || rf) {
        updateStmt.run(wf, vf, rf, p.id);
      }
    }
  });

  link();
  return { linked: existingPolicies.length, inspected: existingPolicies.length };
}

/** 步骤 2：批量插入额外的高级 preset（17 条） */
export function insertExtraPolicies(
  db: Database.Database,
  extraPolicies: ReadonlyArray<Record<string, unknown>>,
): number {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO remediation_policies (
      id, name, description, alert_source, alert_severity,
      alert_keywords, alert_tags, execution_mode, workflow_id,
      workflow_params, max_executions_per_hour, cooldown_seconds,
      enable_verification, verification_workflow_id, verification_params,
      verification_timeout_seconds, enable_rollback, rollback_workflow_id,
      rollback_on_failure, enabled, created_by, created_at, updated_at
    ) VALUES (
      @id, @name, @description, @alert_source, @alert_severity,
      @alert_keywords, @alert_tags, @execution_mode, @workflow_id,
      @workflow_params, @max_executions_per_hour, @cooldown_seconds,
      @enable_verification, @verification_workflow_id, @verification_params,
      @verification_timeout_seconds, @enable_rollback, @rollback_workflow_id,
      @rollback_on_failure, @enabled, @created_by, @created_at, @updated_at
    )
  `);

  const insertMany = db.transaction((policies: ReadonlyArray<Record<string, unknown>>) => {
    for (const policy of policies) {
      insertStmt.run(policy);
    }
  });

  insertMany(extraPolicies);
  return extraPolicies.length;
}
