import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export async function initRemediationPolicies(): Promise<void> {
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM remediation_policies').get() as { count: number };
  
  if (existingCount.count > 0) {
    return;
  }
  
  logger.info('Initializing default remediation policies...');

  // 查找合适的工作流ID — 优先找告警/故障诊断类工作流
  const targetWorkflow = db.prepare("SELECT id FROM workflows WHERE is_template = 1 AND (name LIKE '%告警%' OR name LIKE '%故障%' OR name LIKE '%诊断%') LIMIT 1").get() as { id: string } | undefined;
  const fallbackWorkflow = db.prepare('SELECT id FROM workflows WHERE is_template = 1 LIMIT 1').get() as { id: string } | undefined;
  const workflowId = targetWorkflow?.id || fallbackWorkflow?.id || null;
  
  const policies = [
    {
      id: uuidv4(),
      name: 'Automatic Disk Space Cleanup',
      description: 'Automatically clean up logs and temporary files when disk usage exceeds the threshold',
      alert_source: 'zabbix',
      alert_severity: 'high',
      alert_keywords: JSON.stringify(['disk', 'space', 'full', '磁盘', '存储']),
      alert_tags: JSON.stringify(['storage', 'disk']),
      execution_mode: 'auto',
      workflow_id: workflowId,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        cleanup_paths: ['/var/log', '/tmp'],
        threshold: 90
      }),
      max_executions_per_hour: 3,
      cooldown_seconds: 600,
      enable_verification: 1,
      verification_params: JSON.stringify({
        server_id: '{{alert.host}}',
        check_disk_usage: true
      }),
      verification_timeout_seconds: 120,
      enable_rollback: 0,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: 'Automatic Service Restart on Crash',
      description: 'Automatically attempt to restart the service when a crash is detected',
      alert_source: 'zabbix',
      alert_severity: 'disaster',
      alert_keywords: JSON.stringify(['down', 'stopped', 'unreachable', '宕机', '停止', '不可达']),
      alert_tags: JSON.stringify(['service', 'process']),
      execution_mode: 'auto',
      workflow_id: workflowId,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        service_name: '{{alert.service}}'
      }),
      max_executions_per_hour: 5,
      cooldown_seconds: 300,
      enable_verification: 1,
      verification_params: JSON.stringify({
        server_id: '{{alert.host}}',
        check_service_status: '{{alert.service}}'
      }),
      verification_timeout_seconds: 60,
      enable_rollback: 1,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: 'High CPU Usage Handling',
      description: 'Analyze causes and provide recommendations when CPU usage remains excessively high',
      alert_source: 'zabbix',
      alert_severity: 'warning',
      alert_keywords: JSON.stringify(['cpu', 'high', 'load', 'cpu使用率', '负载']),
      alert_tags: JSON.stringify(['performance', 'cpu']),
      execution_mode: 'auto',
      workflow_id: workflowId,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        collect_top_processes: true
      }),
      max_executions_per_hour: 2,
      cooldown_seconds: 1800,
      enable_verification: 0,
      verification_params: null,
      verification_timeout_seconds: 60,
      enable_rollback: 0,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: 'High Memory Usage Handling',
      description: 'Analyze and handle situations when system memory usage is excessively high',
      alert_source: 'zabbix',
      alert_severity: 'high',
      alert_keywords: JSON.stringify(['memory', '内存', 'mem']),
      alert_tags: JSON.stringify(['performance', 'memory']),
      execution_mode: 'auto',
      workflow_id: workflowId,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        collect_memory_processes: true
      }),
      max_executions_per_hour: 2,
      cooldown_seconds: 1800,
      enable_verification: 0,
      verification_params: null,
      verification_timeout_seconds: 60,
      enable_rollback: 0,
      rollback_on_failure: 0
    },
    {
      id: uuidv4(),
      name: 'Network Device CPU Alert Inspection',
      description: 'Automatically inspect network devices when their CPU is overloaded',
      alert_source: 'zabbix',
      alert_severity: 'high',
      alert_keywords: JSON.stringify(['cpu', '网络设备', 'network', '交换机', '路由器', '核心']),
      alert_tags: JSON.stringify(['network', 'device']),
      execution_mode: 'auto',
      workflow_id: workflowId,
      workflow_params: JSON.stringify({
        server_id: '{{alert.host}}',
        device_type: 'network',
        check_interfaces: true
      }),
      max_executions_per_hour: 3,
      cooldown_seconds: 600,
      enable_verification: 0,
      verification_params: null,
      verification_timeout_seconds: 120,
      enable_rollback: 0,
      rollback_on_failure: 0
    }
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO remediation_policies (
      id, name, description, alert_source, alert_severity,
      alert_keywords, alert_tags, execution_mode, workflow_id,
      workflow_params, max_executions_per_hour, cooldown_seconds,
      enable_verification, verification_params, verification_timeout_seconds,
      enable_rollback, rollback_on_failure
    ) VALUES (
      @id, @name, @description, @alert_source, @alert_severity,
      @alert_keywords, @alert_tags, @execution_mode, @workflow_id,
      @workflow_params, @max_executions_per_hour, @cooldown_seconds,
      @enable_verification, @verification_params, @verification_timeout_seconds,
      @enable_rollback, @rollback_on_failure
    )
  `);
  
  const insertMany = db.transaction((ps: typeof policies) => {
    for (const p of ps) {
      insertStmt.run(p);
    }
  });
  
  insertMany(policies);
  
  logger.info(`Created ${policies.length} default remediation policies`);
}
