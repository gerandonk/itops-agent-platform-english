/**
 * WorkflowProviders Provider Meta 数据（2026-07-21 拆分）
 *
 * 把原 WorkflowProviders.tsx L195-357 的 getProviderMeta 函数抽出
 * 内含 8 个 provider 的 description / scenarios / example.input / example.output
 *
 * 拆分原则遵循 architecture.md §3.4.1 + 第 3 条「向后兼容的 import 路径」
 */

export interface ProviderMetaEntry {
  description: string;
  scenarios: string[];
  example: { input: string; output: string };
}

const META: Record<string, ProviderMetaEntry> = {
  'send-notification': {
    description:
      'Send notification messages through specified channels, supporting Email, WeCom, DingTalk, Webhook, etc. Can be used for workflow execution result notifications, alert pushes, approval reminders, etc.',
    scenarios: [
      'Send result notification when workflow execution completes',
      'Push message to on-call group when alert triggers',
      'Notify relevant handlers on approval nodes',
    ],
    example: {
      input: JSON.stringify(
        {
          message: 'Workflow execution successful',
          channel: 'wechat',
          targets: ['user1', 'user2'],
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          message: 'Notification sent: Workflow execution successful',
          channel: 'wechat',
          sentCount: 2,
        },
        null,
        2,
      ),
    },
  },
  'ssh-exec': {
    description:
      'Execute SSH commands on the specified server, returning execution results including stdout, stderr, and execution duration. Supports setting timeout to prevent command hangs.',
    scenarios: [
      'Execute remote server ops commands',
      'Batch execute scripts to collect server info',
      'Daily operations such as service restart and log cleanup',
    ],
    example: {
      input: JSON.stringify(
        {
          serverId: 'server-001',
          command: 'df -h /',
          timeout: 30000,
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          stdout:
            'Filesystem      Size  Used Avail Use% Mounted on\n/dev/vda1        40G   15G   23G  40% /',
          stderr: '',
          duration: 520,
        },
        null,
        2,
      ),
    },
  },
  'docker-operation': {
    description:
      'Perform operations on Docker containers, including start, stop, restart, delete, and view logs. Connects to target server via SSH to execute docker commands.',
    scenarios: [
      'Batch container restart to resolve zombie state',
      'Export container logs for troubleshooting',
      'Blue-green deployment version switch',
    ],
    example: {
      input: JSON.stringify(
        {
          serverId: 'server-001',
          containerId: 'app-api',
          operation: 'restart',
          tailLines: 200,
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          stdout: 'app-api\nRestarted successfully',
          stderr: '',
          duration: 2400,
        },
        null,
        2,
      ),
    },
  },
  'http-request': {
    description:
      'Call external HTTP/HTTPS APIs, supporting GET, POST, PUT, DELETE methods, custom headers / body / auth. Can be used for integrating third-party systems, Webhook triggers, etc.',
    scenarios: [
      'Call third-party service API to complete business integration',
      'Trigger external system linkage via Webhook',
      'Query external system data as workflow input',
    ],
    example: {
      input: JSON.stringify(
        {
          url: 'https://api.example.com/v1/alerts',
          method: 'POST',
          headers: { Authorization: 'Bearer xxx' },
          body: { severity: 'critical', message: 'System Error' },
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          status: 200,
          response: { alertId: 'A-12345', status: 'queued' },
          duration: 320,
        },
        null,
        2,
      ),
    },
  },
  'sql-query': {
    description:
      'Execute SQL queries or updates against a specified database (MySQL/PostgreSQL/SQL Server), with parameterized queries to prevent injection.',
    scenarios: [
      'Automated data cleanup',
      'Generate report data snapshots',
      'Database metrics collection',
    ],
    example: {
      input: JSON.stringify(
        {
          dbType: 'mysql',
          connectionId: 'mysql-main',
          sql: 'SELECT COUNT(*) AS active FROM users WHERE last_login > DATE_SUB(NOW(), INTERVAL 7 DAY)',
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          rows: [{ active: 1234 }],
          duration: 85,
        },
        null,
        2,
      ),
    },
  },
  'k8s-operation': {
    description:
      'Operate on a Kubernetes cluster, including Pod restarts, Deployment scaling, log queries, etc.',
    scenarios: [
      'Deployment rolling update',
      'Automatic restart of failed Pods',
      'Node autoscaling',
    ],
    example: {
      input: JSON.stringify(
        {
          cluster: 'prod-east-1',
          namespace: 'default',
          deployment: 'api-gateway',
          operation: 'restart',
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          message: 'Deployment api-gateway restarted',
          duration: 1800,
        },
        null,
        2,
      ),
    },
  },
  'script-execution': {
    description: 'Execute predefined Python/JavaScript/Bash script nodes in workflows.',
    scenarios: [
      'Custom data processing',
      'Business rule computation',
      'Complex data transformation',
    ],
    example: {
      input: JSON.stringify(
        {
          scriptId: 'data-enrich-001',
          context: { userId: 'U-12345' },
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          output: { enriched: true, fields: ['email', 'department'] },
          duration: 120,
        },
        null,
        2,
      ),
    },
  },
  'approval': {
    description:
      'Initiate manual approval at key decision points; supports single, multi-person, countersign, and voting modes.',
    scenarios: [
      'Manual confirmation for production changes',
      'Dual review for high-risk operations',
      'Escalation approval for critical incidents',
    ],
    example: {
      input: JSON.stringify(
        {
          title: 'Production database change approval',
          applicant: 'user-001',
          timeout: 7200,
        },
        null,
        2,
      ),
      output: JSON.stringify(
        {
          success: true,
          approvalId: 'AP-20260721-001',
          approvers: ['ops-lead', 'dba'],
          mode: 'concurrent',
        },
        null,
        2,
      ),
    },
  },
};

/** 获取 provider 的元数据（description / scenarios / example） */
export function getProviderMeta(id: string): ProviderMetaEntry {
  return (
    META[id] || {
      description: 'Workflow action provider, invocable within workflows.',
      scenarios: ['Used as an execution node in workflows', 'Different execution logic via parameter configuration'],
      example: {
        input: '{}',
        output: '{}',
      },
    }
  );
}
