import db from '../database';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';

export function initializePresetScheduledTasks() {
  const workflows = db.prepare('SELECT id, name FROM workflows WHERE is_template = 1').all() as Array<{ id: string; name: string }>;
  const workflowMap = new Map(workflows.map(w => [w.name, w.id]));
  
  const scheduledTasks = [
    {
      id: randomUUID(),
      name: 'Daily Health Check',
      description: 'Execute system health check workflow at 8:00 AM every day',
      schedule: '0 8 * * *',
      enabled: 1,
      workflowName: 'Daily Health Check'
    },
    {
      id: randomUUID(),
      name: 'Weekly Compliance Inspection',
      description: 'Execute compliance inspection workflow at 2:00 AM every Sunday',
      schedule: '0 2 * * 0',
      enabled: 1,
      workflowName: 'Compliance Inspection'
    },
    {
      id: randomUUID(),
      name: 'Regular Log Analysis',
      description: 'Execute log analysis workflow at 3:00 AM every day',
      schedule: '0 3 * * *',
      enabled: 1,
      workflowName: 'Log Analysis'
    },
    {
      id: randomUUID(),
      name: 'Database Backup',
      description: 'Automatically execute database backup workflow at 1:00 AM every day',
      schedule: '0 1 * * *',
      enabled: 1,
      workflowName: 'Change Execution'
    }
  ];

  const insertScheduledTask = db.prepare(`
    INSERT OR IGNORE INTO scheduled_tasks (id, name, description, schedule, enabled, workflow_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  scheduledTasks.forEach(task => {
    const workflowId = workflowMap.get(task.workflowName) || workflows[0]?.id;
    insertScheduledTask.run(task.id, task.name, task.description, task.schedule, task.enabled, workflowId);
  });

  logger.info(`✅ 成功创建 ${scheduledTasks.length} 个预设定时任务`);
}
