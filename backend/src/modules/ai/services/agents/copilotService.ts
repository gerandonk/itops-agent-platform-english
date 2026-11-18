import { serversRepo, copilotConversationRepository, alertRepository, tasksRepo } from '../../../../repositories';
import { logger } from '../../../../utils/logger';
import { generateCompletion } from '../llm/llmService';
import { randomUUID } from 'crypto';

interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  user_id: string;
  messages: CopilotMessage[];
  created_at: Date;
  updated_at: Date;
}

const COPILOT_SYSTEM_PROMPT = `你是一个专业的 IT 运维助手（ITOps Copilot），帮助运维人员监控系统、处理告警、执行任务。

你的能力范围：
1. **告警管理**：查看告警状态、告警统计、告警处理建议
2. **服务器管理**：服务器状态查询、健康检查、服务器信息
3. **任务管理**：任务执行状态、任务进度、任务历史
4. **系统巡检**：巡检建议、巡检模板使用指导
5. **报告生成**：运维报告生成、报告模板使用
6. **工作流编排**：自动化任务编排、定时任务设置

回答要求：
- 使用中文回答
- 回答要简洁明了，重点突出
- 使用 Markdown 格式组织内容
- 如果用户的问题超出你的能力范围，引导用户前往相应页面操作
- 在回答中可以适当提供相关的运维建议`;

class CopilotService {
  private conversations: Map<string, Conversation> = new Map();
  private initialized = false;
  private readonly MAX_CONVERSATIONS = 1000;
  private readonly CONVERSATION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 延迟初始化，等待数据库准备好
  }

  init() {
    if (this.initialized) return;
    this.loadConversations();
    this.initialized = true;
    this.startCleanupTimer();
  }

  private startCleanupTimer() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredConversations();
    }, 60 * 60 * 1000); // 每小时清理一次
    
    this.cleanupInterval.unref();
  }

  private cleanupExpiredConversations() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, conversation] of this.conversations.entries()) {
      const updatedAt = new Date(conversation.updated_at);
      const isExpired = (now.getTime() - updatedAt.getTime()) > this.CONVERSATION_TTL;
      
      if (isExpired) {
        this.conversations.delete(id);
        try {
          copilotConversationRepository.deleteById(id);
        } catch (error) {
          logger.error('Failed to delete expired conversation from DB:', error);
        }
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired copilot conversations`);
    }
  }

  private enforceConversationLimit() {
    if (this.conversations.size > this.MAX_CONVERSATIONS) {
      const entries = Array.from(this.conversations.entries())
        .sort((a, b) => new Date(b[1].updated_at).getTime() - new Date(a[1].updated_at).getTime());
      
      const toRemove = entries.slice(this.MAX_CONVERSATIONS);
      toRemove.forEach(([id]) => {
        this.conversations.delete(id);
        try {
          copilotConversationRepository.deleteById(id);
        } catch (error) {
          logger.error('Failed to remove excess conversation from DB:', error);
        }
      });
      
      logger.info(`Enforced conversation limit, removed ${toRemove.length} old conversations`);
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      this.init();
    }
  }

  private loadConversations() {
    try {
      const saved = copilotConversationRepository.listAll();
      saved.forEach(c => {
        try {
          this.conversations.set(c.id, {
            id: c.id,
            user_id: c.user_id,
            messages: JSON.parse(c.messages || '[]'),
            created_at: new Date(c.created_at),
            updated_at: new Date(c.updated_at)
          });
        } catch {
          // 忽略解析错误
        }
      });
    } catch {
      logger.info('No existing copilot conversations found');
    }
  }

  private saveConversation(conversation: Conversation) {
    copilotConversationRepository.save(
      conversation.id,
      conversation.user_id,
      JSON.stringify(conversation.messages),
      conversation.created_at.toISOString(),
      conversation.updated_at.toISOString()
    );
  }

  createConversation(userId = 'default'): Conversation {
    this.ensureInitialized();
    this.enforceConversationLimit();
    const id = randomUUID();
    const now = new Date();
    const conversation: Conversation = {
      id,
      user_id: userId,
      messages: [],
      created_at: now,
      updated_at: now
    };
    this.conversations.set(id, conversation);
    this.saveConversation(conversation);
    return conversation;
  }

  getConversation(id: string): Conversation | null {
    this.ensureInitialized();
    // v4 修复：内存 map 优先，未命中则从 DB 兜底
    // 解决多实例部署 / 进程重启后内存丢失的场景
    const cached = this.conversations.get(id);
    if (cached) return cached;

    try {
      const row = copilotConversationRepository.getById(id);
      if (row) {
        const conv: Conversation = {
          id: row.id,
          user_id: row.user_id,
          messages: JSON.parse(row.messages || '[]'),
          created_at: new Date(row.created_at),
          updated_at: new Date(row.updated_at),
        };
        // 回填内存缓存
        this.conversations.set(conv.id, conv);
        return conv;
      }
    } catch (error) {
      logger.warn(`Failed to load conversation ${id} from DB:`, error);
    }
    return null;
  }

  getUserConversations(userId = 'default'): Conversation[] {
    this.ensureInitialized();
    return Array.from(this.conversations.values())
      .filter(c => c.user_id === userId)
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
  }

  deleteConversation(id: string): boolean {
    this.ensureInitialized();
    const deleted = this.conversations.delete(id);
    if (deleted) {
      copilotConversationRepository.deleteById(id);
    }
    return deleted;
  }

  async processNaturalLanguage(
    conversationId: string,
    userInput: string,
    userId = 'default'
  ): Promise<string> {
    this.ensureInitialized();
    let conversation = this.getConversation(conversationId);
    if (!conversation) {
      conversation = this.createConversation(userId);
    }

    // 添加用户消息
    conversation.messages.push({
      role: 'user',
      content: userInput,
      timestamp: new Date()
    });

    // 调用 LLM 生成响应
    const response = await this.generateResponse(userInput, conversation.messages);

    // 添加助手消息
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });
    conversation.updated_at = new Date();
    this.saveConversation(conversation);

    return response;
  }

  private buildContextForLLM(input: string): string {
    const lowerInput = input.toLowerCase();
    let context = '';

    // 根据用户输入自动注入相关数据到上下文中
    if (lowerInput.includes('Alert') || lowerInput.includes('alert')) {
      try {
        const alerts = alertRepository.getAll({ limit: 10 });
        const severityCounts: Record<string, number> = {};
        const statusCounts: Record<string, number> = {};
        alerts.forEach((a) => {
          severityCounts[a.severity] = (severityCounts[a.severity] || 0) + 1;
          statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });
        context += `Current alert data: ${alerts.length} total alerts, severity distribution: ${JSON.stringify(severityCounts)}, status distribution: ${JSON.stringify(statusCounts)}.\\n`;
        if (alerts.length > 0) {
          context += `Recent alerts: ${alerts.slice(0, 5).map((a) => `[${a.severity}] ${a.title}`).join('；')}。\n`;
        }
      } catch {
        context += 'Unable to retrieve alert data.\\n';
      }
    }

    if (lowerInput.includes('Server') || lowerInput.includes('server')) {
      try {
        const servers = serversRepo.listEnabled() as Array<{
          id: string;
          name: string;
          hostname: string;
          port: number;
          enabled: number;
        }>;
        const enabledCount = servers.filter((s) => s.enabled).length;
        context += `Server data: ${servers.length} servers total, ${enabledCount} enabled.\\n`;
        if (servers.length > 0) {
          context += `Server list: ${servers.slice(0, 8).map((s) => `${s.name} (${s.hostname}:${s.port})[${s.enabled ? 'Enabled' : 'Disabled'}]`).join('；')}。\n`;
        }
      } catch {
        context += 'Unable to retrieve server data.\\n';
      }
    }

    if (lowerInput.includes('Task') || lowerInput.includes('task')) {
      try {
        const tasks = tasksRepo.listRecent(15);
        const statusCounts: Record<string, number> = {};
        tasks.forEach((t) => {
          statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });
        context += `Task data: ${tasks.length} task records total, status distribution: ${JSON.stringify(statusCounts)}.\\n`;
        if (tasks.length > 0) {
          context += `Recent tasks: ${tasks.slice(0, 5).map((t) => `${t.name} (${t.status})`).join('；')}。\n`;
        }
      } catch {
        context += 'Unable to retrieve task data.\\n';
      }
    }

    if (lowerInput.includes('Inspection') || lowerInput.includes('Check')) {
      context += `The system supports the following inspections: server health check, disk space check, service status check, security compliance check. Users can use the "Workflow" module to create and execute inspection tasks.\\n`;
    }

    return context;
  }

  private async generateResponse(input: string, conversationHistory: CopilotMessage[]): Promise<string> {
    try {
      logger.info(`🤖 [Copilot] Starting response generation, input length: ${input.length}`);
      
      // 构建对话历史（最近 10 条）
      const recentMessages = conversationHistory.slice(-10);
      const historyText = recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

      // 注入相关上下文数据
      const context = this.buildContextForLLM(input);

      const enrichedPrompt = context
        ? `Current system data:\\n${context}\\nUser input: ${input}\\nChat history:\\n${historyText}`
        : `User input: ${input}\\nChat history:\\n${historyText}`;

      // 优先使用 AI 模型池的默认模型（已在 generateCompletion 中实现）
      logger.info(`🤖 [Copilot] Calling generateCompletion to generate response`);
      const llmResponse = await generateCompletion(enrichedPrompt, COPILOT_SYSTEM_PROMPT, 0.7, undefined, 'copilot');
      
      // 截断超长响应，防止前端渲染问题
      const truncatedResponse = llmResponse.length > 4000 
        ? llmResponse.substring(0, 4000) + '...\\n\\n(Response too long, truncated)' 
        : llmResponse;
      
      logger.info(`🤖 [Copilot] Response generated successfully, length: ${truncatedResponse.length}`);
      return truncatedResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`🤖 [Copilot] LLM call failed, falling back to rule-based response: ${errorMessage}`);
      return this.getRuleBasedResponse(input);
    }
  }

  private getRuleBasedResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('Alert') || lowerInput.includes('alert')) {
      return this.handleAlertQuery();
    }
    if (lowerInput.includes('Server') || lowerInput.includes('server')) {
      return this.handleServerQuery();
    }
    if (lowerInput.includes('Task') || lowerInput.includes('task')) {
      return this.handleTaskQuery();
    }
    if (lowerInput.includes('Inspection') || lowerInput.includes('Check')) {
      return this.handleCheckQuery();
    }
    if (lowerInput.includes('Help') || lowerInput.includes('help')) {
      return this.handleHelpQuery();
    }
    return this.handleGeneralQuery(input);
  }

  private handleAlertQuery(): string {
    const alerts = alertRepository.getAll({ limit: 10 });
    const severityCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    alerts.forEach((a) => {
      severityCounts[a.severity] = (severityCounts[a.severity] || 0) + 1;
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    const criticalCount = severityCounts['critical'] || 0;
    const highCount = severityCounts['high'] || 0;
    const newCount = statusCounts['new'] || 0;

    let response = `📊 **Current Alert Status Overview**\\n\\n`;
    response += `There are currently **${alerts.length}** alert records\\n`;
    response += `- 🔴 Critical alerts: **${criticalCount}**\\n`;
    response += `- 🟠 High-severity alerts: **${highCount}**\\n`;
    response += `- 📌 Pending alerts: **${newCount}**\\n\\n`;

    if (alerts.length > 0) {
      response += `**Recent Alerts**:\\n`;
      alerts.slice(0, 5).forEach((a, i) => {
        const emoji = a.severity === 'critical' ? '🔴' : a.severity === 'high' ? '🟠' : '🟡';
        response += `${i + 1}. ${emoji} [${a.severity?.toUpperCase()}] ${a.title}\n`;
      });
      response += `\\n👉 Recommendation: Go to the "Alert Center" to view details and handle pending alerts`;
    }

    return response;
  }

  private handleServerQuery(): string {
    const servers = serversRepo.listEnabled() as Array<{
      id: string;
      name: string;
      hostname: string;
      port: number;
      enabled: number;
    }>;
    const enabledCount = servers.filter((s) => s.enabled).length;

    let response = `🖥️ **Server Management Overview**\\n\\n`;
    response += `There are currently **${servers.length}** server configurations\\n`;
    response += `- ✅ Enabled: **${enabledCount}**\\n`;
    response += `- ❌ Disabled: **${servers.length - enabledCount}**\\n\\n`;

    if (servers.length > 0) {
      response += `**Server List**:\\n`;
      servers.slice(0, 8).forEach((s, i) => {
        const status = s.enabled ? '✅' : '❌';
        response += `${i + 1}. ${status} ${s.name} (${s.hostname}:${s.port})\n`;
      });
      response += `\\n👉 To perform operations on servers, please go to the "Server Management" page`;
    }

    return response;
  }

  private handleTaskQuery(): string {
    const tasks = tasksRepo.listRecent(15);
    const statusCounts: Record<string, number> = {};

    tasks.forEach((t) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    let response = `📋 **Task Execution Overview**\\n\\n`;
    response += `There are currently **${tasks.length}** task records\\n`;
    response += `- ▶️ Running: **${statusCounts['running'] || 0}**\\n`;
    response += `- ✅ Completed: **${statusCounts['completed'] || 0}**\\n`;
    response += `- ❌ Failed: **${statusCounts['failed'] || 0}**\\n`;
    response += `- ⏳ Pending: **${statusCounts['pending'] || 0}**\\n\\n`;

    if (tasks.length > 0) {
      response += `**Recent Tasks**:\\n`;
      tasks.slice(0, 5).forEach((t, i) => {
        const emoji = t.status === 'completed' ? '✅' : t.status === 'failed' ? '❌' : '⏳';
        response += `${i + 1}. ${emoji} ${t.name} - ${t.status}\n`;
      });
    }

    return response;
  }

  private handleCheckQuery(): string {
    return `🔍 **System Inspection Recommendations**\\n\\n` +
      `I can help you perform the following inspection operations:\\n\\n` +
      `1. **Server Health Check** - Check basic server status\\n` +
      `2. **Disk Space Check** - Check disk usage\\n` +
      `3. **Service Status Check** - Check critical service running status\\n` +
      `4. **Security Compliance Check** - Check system security configuration\\n\\n` +
      `👉 You can:\\n` +
      `- Go to "Workflow" to use preset inspection templates\\n` +
      `- Create custom inspection workflows\\n` +
      `- Set up scheduled inspection tasks\\n\\n` +
      `Would you like me to recommend a suitable inspection workflow for you?`;
  }

  private handleHelpQuery(): string {
    return `👋 **Welcome to ITOps Copilot!**\\n\\n` +
      `I am your intelligent IT Ops assistant, and I can help you:\\n\\n` +
      `**Query Category:**\\n` +
      `- "View current alert status"\\n` +
      `- "How is the server status?"\\n` +
      `- "What tasks were executed recently?"\\n\\n` +
      `**Operation Category:**\\n` +
      `- "Help me execute system inspection"\\n` +
      `- "Check disk space"\\n` +
      `- "Generate an IT Ops report"\\n\\n` +
      `**System Functions:**\\n` +
      `- Alert Center: View and handle alerts\\n` +
      `- Workflow: Orchestrate automated tasks\\n` +
      `- Server Management: Operate remote servers\\n` +
      `- Report System: Generate IT Ops reports\\n\\n` +
      `Is there anything I can help you with?`;
  }

  private handleGeneralQuery(input: string): string {
    return `🤔 I understand you want to know about: **"${input}"**\\n\\n` +
      `Let me give you some suggestions:\\n\\n` +
      `**You can try:**\\n` +
      `1. Check "Alert Center" - Understand current system status\\n` +
      `2. Check "Workflow" - Run automated tasks\\n` +
      `3. Use "Server Management" - Perform operations on servers\\n` +
      `4. Generate "Report" - View IT Ops statistics\\n\\n` +
      `**FAQ:**\\n` +
      `- Q: How to handle alerts? A: Go to the alert center and click on an alert to handle it\\n` +
      `- Q: How to create automated workflows? A: Use the workflow orchestration feature\\n` +
      `- Q: How to connect to a server? A: Add server configuration in Server Management\\n\\n` +
      `Need more specific help? Ask me "Help"!`;
  }

  // 获取快速建议
  getQuickSuggestions(): string[] {
    return [
      'View current alert status',
      'How is the server status',
      'What tasks were executed recently',
      'Help me generate IT Ops report',
      'Check system health status',
      'Which servers need inspection'
    ];
  }
}

export const copilotService = new CopilotService();
