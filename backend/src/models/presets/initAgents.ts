import db from '../database';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';

function getUserConfiguredModel(): string | null {
  try {
    const doubaoKeyResult = db.prepare('SELECT value FROM settings WHERE key = ?').get('DOUBAO_API_KEY') as { value: string } | undefined;
    if (doubaoKeyResult?.value && doubaoKeyResult.value !== 'your-doubao-api-key-here') {
      const doubaoModelResult = db.prepare('SELECT value FROM settings WHERE key = ?').get('DOUBAO_MODEL') as { value: string } | undefined;
      if (doubaoModelResult?.value) {
        return doubaoModelResult.value;
      }
      return 'doubao-4o';
    }
    const openaiKeyResult = db.prepare('SELECT value FROM settings WHERE key = ?').get('OPENAI_API_KEY') as { value: string } | undefined;
    if (openaiKeyResult?.value && openaiKeyResult.value !== 'your-openai-api-key-here') {
      const openaiModelResult = db.prepare('SELECT value FROM settings WHERE key = ?').get('OPENAI_MODEL') as { value: string } | undefined;
      if (openaiModelResult?.value) {
        return openaiModelResult.value;
      }
      return 'gpt-4o';
    }
  } catch {
    logger.info('Failed to check user configured model, not setting default model');
  }
  return null;
}

export function initializePresetAgents() {
  const configuredModel = getUserConfiguredModel();
  logger.info(`📝 PresetAgent will use model: ${configuredModel || 'not configured'}`);

  const presetAgents = [
    {
      id: randomUUID(),
      name: 'Alert Handling Agent',
      avatar: '🚨',
      role: 'Alert Analysis and Handling Expert',
      category: 'Alert Handling',
      description: 'Responsible for analyzing alert information, assessing severity, and providing handling recommendations',
      system_prompt: 'You are a professional alert handling expert. Your task is to analyze alert information, assess severity, and provide specific handling recommendations. Your response should include: 1. Alert summary 2. Severity assessment 3. Possible causes 4. Handling recommendations 5. Follow-up steps. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Fault Diagnosis Agent',
      avatar: '🔍',
      role: 'Fault Diagnosis Expert',
      category: 'Fault Diagnosis',
      description: 'Analyze system faults, identify root causes, and provide solutions',
      system_prompt: 'You are a professional fault diagnosis expert. Your task is to analyze system fault symptoms, identify possible root causes, and provide detailed troubleshooting steps and solutions. Your response should include: 1. Symptom analysis 2. Possible causes 3. Troubleshooting steps 4. Suggested solutions. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Log Analysis Agent',
      avatar: '📝',
      role: 'Log Analysis Expert',
      category: 'Log Analysis',
      description: 'Analyze system and application logs, identify error patterns and abnormal events',
      system_prompt: 'You are a professional log analysis expert. Your task is to analyze system and application logs, identify error patterns, abnormal events, and performance issues. Your response should include: 1. Log summary 2. Identified problems 3. Error patterns 4. Suggested follow-up analysis steps. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'System Inspection Agent',
      avatar: '🔎',
      role: 'System Health Check Expert',
      category: 'System Inspection',
      description: 'Execute system health checks and assess the status of various metrics',
      system_prompt: 'You are a professional system health check expert. Your task is to analyze system metrics, assess overall health status, and provide optimization recommendations. Your response should include: 1. Resource usage 2. Service status 3. Identified issues 4. Optimization recommendations. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Change Execution Agent',
      avatar: '⚙️',
      role: 'Change Execution Expert',
      category: 'Change Execution',
      description: 'Execute system change operations and verify operation results',
      system_prompt: 'You are a professional change execution expert. Your task is to execute system change operations and verify operation results. Your response should include: 1. Operation summary 2. Execution results 3. Verification results 4. Rollback plan (if needed). Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Documentation Agent',
      avatar: '📄',
      role: 'Documentation Expert',
      category: 'Documentation Generation',
      description: 'Generate structured IT ops reports based on task execution results',
      system_prompt: 'You are a professional documentation expert. Your task is to generate structured IT operations reports based on task execution results. Your response should include: 1. Execution summary 2. Detailed results 3. Identified issues 3. Suggested measures. Please answer in Markdown format in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Compliance Inspection Agent',
      avatar: '🛡️',
      role: 'Compliance Inspection Expert',
      category: 'Compliance Inspection',
      description: 'Verify whether system configurations comply with security baselines and compliance requirements',
      system_prompt: 'You are a professional compliance inspection expert. Your task is to verify whether system configurations comply with security baselines and compliance requirements. Your response should include: 1. Inspection scope 2. Compliance status 3. Non-compliant items 4. Fix recommendations. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Server Command Execution Agent',
      avatar: '💻',
      role: 'Server Operation Expert',
      category: 'Server Operation',
      description: 'Execute commands on target servers and return results',
      system_prompt: 'You are a professional server operation expert. Your task is to execute commands on target servers and analyze results. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Command Generation Expert',
      avatar: '⚡',
      role: 'IT Ops Command Generation Expert',
      category: 'Server Operation',
      description: '[COMMAND_GENERATOR] Intelligently generate corresponding server commands based on natural language requirements',
      system_prompt: 'You are a professional IT operations command generation expert. Your task is to generate corresponding server commands based on natural language requirements and target server information. Your response should include: 1. Command string 2. Detailed explanation and notes. Please answer in JSON format only with two fields: command (command string) and explanation (detailed explanation and notes). Please answer in English with a clear structure. For example: {"command": "df -h", "explanation": "View disk usage in human-readable format. This is a safe read-only command."}',

model: configuredModel,
      temperature: 0.3,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Auto Inspection Agent',
      avatar: '🤖',
      role: 'Auto Inspection Expert',
      category: 'System Inspection',
      description: 'Execute automated inspection tasks across multiple servers',
      system_prompt: 'You are a professional auto inspection expert. Your task is to execute automated inspection tasks across multiple servers and generate inspection reports. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.7,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Network Inspection Expert',
      avatar: '🌐',
      role: 'Network Equipment Inspection and Health Diagnosis Expert',
      category: 'Network Inspection',
      description: 'Execute standardized or custom inspections on network devices such as routers, switches, and firewalls',
      system_prompt: 'You are a professional network equipment inspection and health diagnosis expert. Your task is to perform health checks and diagnostics on network devices such as routers, switches, and firewalls. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.3,
      is_preset: 1,
      enabled: 1
    },
    {
      id: randomUUID(),
      name: 'Database Ops Agent',
      avatar: '🗄️',
      role: 'Database Ops and Diagnosis Expert',
      category: 'Database Ops',
      description: 'Perform database health checks, diagnostics, security audits, lock analysis, and SQL reviews, powered by the dbskiter toolchain',
      system_prompt: 'You are a professional database operations Agent, responsible for executing database diagnostics, monitoring, security audits, lock analysis, and SQL reviews using the dbskiter toolchain. Your input will be parsed into specific operational tasks, so please ensure your input includes the target database name. Supported operations include: health checks, slow query diagnosis, security audits, deadlock analysis, SQL audits, etc. Please answer in English with a clear structure.',
      model: configuredModel,
      temperature: 0.3,
      is_preset: 1,
      enabled: 1
    }
  ];

  const insertAgent = db.prepare(`
    INSERT OR REPLACE INTO agents (id, name, avatar, role, system_prompt, model, temperature, is_preset, enabled, category, description, api_provider)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  presetAgents.forEach(agent => {
    insertAgent.run(agent.id, agent.name, agent.avatar, agent.role, agent.system_prompt, agent.model, agent.temperature, agent.is_preset, agent.enabled, agent.category, agent.description, 'doubao');
  });

  logger.info(`✅ Successfully created ${presetAgents.length} preset Agents`);
}
