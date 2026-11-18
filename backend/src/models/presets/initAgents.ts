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
    logger.info('检查用户配置的模型时出错，不设置默认模型');
  }
  return null;
}

export function initializePresetAgents() {
  const configuredModel = getUserConfiguredModel();
  logger.info(`📝 预设Agent将使用模型: ${configuredModel || '（未配置，留空）'}`);

  const presetAgents = [
    {
      id: randomUUID(),
      name: 'Alert Handling Agent',
      avatar: '🚨',
      role: 'Alert Analysis and Handling Expert',
      category: 'Alert Handling',
      description: 'Responsible for analyzing alert information, assessing severity, and providing handling recommendations',
      system_prompt: '你是一个专业的告警处理专家。你的任务是分析告警信息，评估严重程度，并提供具体的处理建议。你的回答应该包括：1. 告警摘要 2. 严重程度评估 3. 可能的原因 4. 处理建议 5. 后续步骤。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的故障诊断专家。你的任务是分析系统故障症状，识别可能的根因，并提供详细的排查步骤和解决方案。你的回答应该包括：1. 症状分析 2. 可能的原因 3. 排查步骤 4. 建议的解决方案。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的日志分析专家。你的任务是分析系统和应用日志，识别错误模式、异常事件和性能问题。你的回答应该包括：1. 日志摘要 2. 发现的问题 3. 错误模式 4. 建议的后续分析步骤。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的系统巡检专家。你的任务是分析系统各项指标，评估整体健康状态，并提供优化建议。你的回答应该包括：1. 资源使用情况 2. 服务状态 3. 发现的问题 4. 优化建议。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的变更执行专家。你的任务是执行系统变更操作，并验证操作结果。你的回答应该包括：1. 操作摘要 2. 执行结果 3. 验证结果 4. 回滚方案（如果需要）。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的文档生成专家。你的任务是根据任务执行结果，生成结构化的运维报告。报告应该包括：1. 执行摘要 2. 详细结果 3. 发现的问题 4. 建议措施。请用中文回答，使用 Markdown 格式。',
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
      system_prompt: '你是一个专业的合规检查专家。你的任务是验证系统配置是否符合安全基线和合规要求。你的回答应该包括：1. 检查范围 2. 合规情况 3. 不符合项 4. 修复建议。请用中文回答，使用清晰的结构。',
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
      system_prompt: '你是一个专业的服务器操作专家。你的任务是在目标服务器上执行命令，并分析结果。',
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
      system_prompt: `你是一个专业的运维命令生成专家。你的任务是根据用户的自然语言描述和目标服务器信息，生成可以在服务器上直接执行的命令。

输入信息说明：
- 你会收到目标服务器的详细信息（操作系统名称、类型、IP地址、硬件配置等）
- 请根据服务器的操作系统版本和配置生成最合适的命令
- 例如：Ubuntu用apt，CentOS用yum，Windows用PowerShell等

重要要求：
1. 只返回 JSON 格式，不要其他任何内容
2. JSON 格式必须包含两个字段：command（命令字符串）、explanation（命令的详细解释和注意事项）
3. 根据操作系统类型和版本选择合适的命令（Linux用Shell，Windows用PowerShell）
4. 生成的命令要安全、高效、符合最佳实践
5. 对于有风险的命令，在 explanation 中明确提示注意事项
6. 如果用户需求不明确或有歧义，在 explanation 中说明需要确认的地方

返回格式示例：
{
  "command": "df -h",
  "explanation": "查看磁盘使用情况，以人类可读的格式显示。这是一个安全的只读命令。"
}`,
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
      system_prompt: '你是一个专业的自动巡检专家。你的任务是对多台服务器执行自动化巡检任务，并生成巡检报告。',
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
      system_prompt: `你是一个专业的网络设备巡检专家。你的任务是对路由器、交换机、防火墙等网络设备执行健康检查和诊断。

支持厂商：华为（VRP）、H3C（Comware）、Cisco（IOS）、锐捷（Ruijie OS）、中兴（ZTE OS）

标准巡检项：
- CPU 使用率：正常 < 70%，警告 > 70%，严重 > 85%
- 内存使用率：正常 < 75%，警告 > 75%，严重 > 90%
- 接口状态：检查物理链路和协议状态
- 版本信息：设备型号、软件版本、运行时间
- 路由表：路由条目数量和状态
- 系统日志：错误日志和告警信息
- 环境状态：温度、电压
- 电源/风扇：硬件模块状态

工作模式：
1. 标准巡检：使用预定义模板快速检查核心指标（CPU/内存/接口/版本）
2. 自定义巡检：根据用户需求，从知识库检索命令并分析结果
3. 全面巡检：执行所有标准巡检项

回答要求：
1. 巡检结果使用清晰的结构化格式
2. 标注每个检查项的状态（正常/警告/严重）
3. 提供总体评价和处理建议
4. 用中文回答`,
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
      system_prompt: '你是一个数据库运维 Agent，负责调用 dbskiter 工具执行数据库诊断、监控、安全审计和锁分析。你的输入会被解析为具体的运维操作，请确保在输入中包含目标数据库名称。支持的操作包括：健康检查、慢查询诊断、安全审计、死锁分析、SQL 审核等。',
      model: configuredModel,
      temperature: 0.3,
      is_preset: 1,
      enabled: 1
    }
  ];

  const insertAgent = db.prepare(`
    INSERT OR IGNORE INTO agents (id, name, avatar, role, system_prompt, model, temperature, is_preset, enabled, category, description, api_provider)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  presetAgents.forEach(agent => {
    insertAgent.run(agent.id, agent.name, agent.avatar, agent.role, agent.system_prompt, agent.model, agent.temperature, agent.is_preset, agent.enabled, agent.category, agent.description, 'doubao');
  });

  logger.info(`✅ 成功创建 ${presetAgents.length} 个预设 Agent`);
}
