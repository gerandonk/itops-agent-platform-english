/**
 * agents/agentThinking.ts — Agent 思考步骤展示
 *
 * 根据 Agent 名称返回对应的思考步骤列表，用于前端展示执行进度
 */

export function getThinkingSteps(agentName: string): string[] {
  const steps: Record<string, string[]> = {
    'Alert Handling': [
      'Parsing alert content...',
      'Extracted key alert information: hostname, alert type, alert value',
      'Evaluating alert severity and urgency',
      'Preparing alert summary for subsequent handling'
    ],
    'Fault Diagnosis': [
      'Analyzing alert patterns and historical data...',
      'Checking relevant system and application logs',
      'Identifying potential root causes',
      'Generating troubleshooting checklist'
    ],
    'Log Analysis': [
      'Parsing log format and timestamps...',
      'Identifying error patterns and anomalous events',
      'Extracting key log entries',
      'Generating log analysis summary'
    ],
    'System Inspection': [
      'Collecting system resource usage info...',
      'Checking service process status',
      'Verifying system configuration and security settings',
      'Generating health check report'
    ],
    'Change Execution': [
      'Verifying command safety...',
      'Preparing execution environment and parameters',
      'Executing system change operations',
      'Verifying operation results'
    ],
    'Documentation Generation': [
      'Collecting task execution data...',
      'Organizing analysis results and outputs',
      'Formatting according to report template',
      'Generating final documentation'
    ],
    'Compliance Check': [
      'Checking against security baseline...',
      'Verifying configuration item compliance',
      'Identifying non-compliant items',
      'Generating compliance report'
    ],
    'Server Command Execution': [
      'Connecting to target server...',
      'Verifying authentication...',
      'Preparing to execute command...',
      'Executing command and collecting output...'
    ],
    'Automatic Inspection': [
      'Connecting to target server...',
      'Starting system health check...',
      'Collecting metrics data...',
      'Organizing inspection results...'
    ],
    'Database Ops': [
      'Parsing database ops intent...',
      'Identifying target database and operations...',
      'Calling dbskiter to execute diagnosis/monitoring/security/lock analysis...',
      'Formatting execution results...'
    ]
  };
  
  return steps[agentName] || ['Analyzing...', 'Processing...', 'Completed'];
}