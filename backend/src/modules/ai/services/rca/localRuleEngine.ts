import { logger } from '../../../../utils/logger';

interface FailurePattern {
  id: string;
  name: string;
  keywords: string[];
  rootCause: string;
  symptoms: string[];
  recommendations: string[];
  scripts?: string[];
}

interface KnowledgeArticle {
  title: string;
  tags: string[];
  alertTypes: string[];
  summary: string;
}

interface WorkflowScriptTemplate {
  workflowType: string;
  keywords: string[];
  scriptTemplate: string;
  description: string;
}

interface RuleAnalysisResult {
  rootCause: string;
  symptoms: string[];
  timeline: Array<{ time: string; event: string }>;
  evidence: string[];
  recommendations: string[];
  matchedPatternId?: string;
  confidence: number;
}

class LocalRuleEngine {
  private readonly failurePatterns: FailurePattern[] = [
    {
      id: 'CPU_HIGH',
      name: 'CPU usage too high',
      keywords: ['cpu', 'Processor', 'Load', 'load', 'high cpu', 'cpu usage'],
      rootCause: 'System CPU usage persistently high, possibly due to abnormal processes, infinite loops, or resource contention',
      symptoms: ['CPU usage exceeds threshold', 'System response slows down', 'Processes queuing'],
      recommendations: [
        'Use top/htop to locate high CPU-consuming processes',
        'Check for infinite loops or recursive code',
        'Consider adding CPU resources or optimizing algorithms',
        'Check for zombie processes consuming resources'
      ],
      scripts: ['top -bn1 | head -20', 'ps aux --sort=-%cpu | head -10']
    },
    {
      id: 'MEMORY_LEAK',
      name: 'Memory leak/usage too high',
      keywords: ['memory', 'Memory', 'oom', 'out of memory', 'Memory leak', 'Out of memory'],
      rootCause: 'Application has memory leak or excessive memory allocation, causing insufficient available memory',
      symptoms: ['Memory usage continuously growing', 'System triggered OOM Killer', 'Application slows down or crashes'],
      recommendations: [
        'Use free -m and top to check memory usage',
        'Check application logs for memory-related errors',
        'Use memory analysis tools to locate leak points',
        'Consider restarting service to temporarily free memory',
        'Add physical memory or optimize memory usage'
      ],
      scripts: ['free -m', 'ps aux --sort=-%mem | head -10', 'dmesg | grep -i oom']
    },
    {
      id: 'DISK_FULL',
      name: 'Disk space insufficient',
      keywords: ['disk', 'Disk', 'Storage space', 'no space left', 'disk full', 'Storage full'],
      rootCause: 'Disk usage too high, possibly due to oversized log files, data accumulation, or uncleaned temp files',
      symptoms: ['Disk usage exceeds threshold', 'Cannot write new files', 'Application logs report insufficient space'],
      recommendations: [
        'Use df -h to check partition usage',
        'Use du -sh /* to locate large files/directories',
        'Clean expired logs and temp files',
        'Configure log rotation policy',
        'Consider expanding disk space'
      ],
      scripts: ['df -h', 'du -sh /var/log/* | sort -rh | head -10', 'find / -type f -size +100M 2>/dev/null | head -20']
    },
    {
      id: 'NETWORK_DOWN',
      name: 'Network outage/connection anomaly',
      keywords: ['network', 'Network', 'Connection', 'connection', 'timeout', 'Network down', 'Network outage', 'ping'],
      rootCause: 'Network connection anomaly, possibly due to NIC failure, routing issues, firewall rules, or unreachable external services',
      symptoms: ['Network connection timeout', 'Inter-service communication failed', 'ping test shows packet loss or unreachable'],
      recommendations: [
        'Use ping to test network connectivity',
        'Use traceroute to check routing path',
        'Check firewall and iptables rules',
        'Check NIC status and driver',
        'Contact network admin for troubleshooting'
      ],
      scripts: ['ping -c 4 8.8.8.8', 'netstat -tuln', 'ip addr show', 'traceroute 8.8.8.8']
    },
    {
      id: 'SERVICE_DOWN',
      name: 'Service down/unavailable',
      keywords: ['service', 'Service', 'down', 'Down', 'Unavailable', 'crash', 'stop', 'Process'],
      rootCause: 'Critical service process exited abnormally or failed to start, possibly due to config errors, missing dependencies, or insufficient resources',
      symptoms: ['Service port inaccessible', 'Process does not exist', 'Health check failed'],
      recommendations: [
        'Check service process status systemctl status <service>',
        'View service logs journalctl -u <service>',
        'Check if the configuration file is correct',
        'Check if dependent services are running normally',
        'Try restarting the service'
      ],
      scripts: ['systemctl status nginx', 'systemctl status sshd', 'journalctl -u nginx --no-pager -n 50']
    },
    {
      id: 'DATABASE_ISSUE',
      name: 'Database exception',
      keywords: ['database', 'Database', 'mysql', 'postgres', 'sql', 'db', 'Connection pool', 'deadlock'],
      rootCause: 'Database service error or connection issue, possibly due to exhausted connections, deadlocks, performance degradation, or misconfiguration',
      symptoms: ['Database connection failed', 'Query timeout', 'Connection pool exhausted', 'Lock wait'],
      recommendations: [
        'Check database service status',
        'View database error logs',
        'Check active connections and slow queries',
        'Check for long-running uncommitted transactions',
        'Optimize query statements or increase connection pool size'
      ],
      scripts: ['mysqladmin status -u root -p', 'SHOW PROCESSLIST;', 'SELECT * FROM information_schema.innodb_trx;']
    },
    {
      id: 'SSL_CERT_EXPIRED',
      name: 'SSL certificate expired',
      keywords: ['ssl', 'Certificate', 'certificate', 'expired', 'https', 'tls'],
      rootCause: 'SSL/TLS certificate has expired or is about to expire, causing HTTPS connection failure or alerts',
      symptoms: ['HTTPS access failed', 'Browser certificate warning', 'API call certificate verification failed'],
      recommendations: [
        'Check certificate validity using openssl x509 -dates',
        'Renew or reapply for the certificate',
        'Update server certificate configuration',
        'Configure automatic reminders for certificate expiration'
      ],
      scripts: ['echo | openssl s_client -connect localhost:443 2>/dev/null | openssl x509 -noout -dates']
    },
    {
      id: 'AUTH_FAILURE',
      name: 'Authentication/Authorization failed',
      keywords: ['auth', 'Authentication', 'Permission', 'permission', 'login', 'password', 'Password', 'token', '401', '403'],
      rootCause: 'User authentication or authorization failed, possibly due to wrong password, expired token, or improper permission configuration',
      symptoms: ['Login failed', '401 Unauthorized error', '403 Forbidden error'],
      recommendations: [
        'Check if user credentials are correct',
        'Check if token is expired',
        'View authentication service logs',
        'Check permission configuration and role assignment'
      ],
      scripts: ['journalctl -u sshd | grep -i "failed" | tail -20']
    },
    {
      id: 'HIGH_LATENCY',
      name: 'Response latency too high',
      keywords: ['latency', 'Latency', 'Slow', 'response time', 'Timeout', 'slow', 'performance'],
      rootCause: 'System response time is too long, possibly due to resource bottlenecks, slow queries, network latency, or application performance issues',
      symptoms: ['API response time exceeds threshold', 'User experience degraded', 'Request queuing'],
      recommendations: [
        'Use APM tools to locate slow APIs',
        'Check database slow query logs',
        'Analyze network latency',
        'Check cache hit rate',
        'Consider horizontal scaling or code optimization'
      ],
      scripts: ['curl -o /dev/null -s -w "Time: %{time_total}s\\n" http://localhost', 'mysqladmin processlist -u root -p']
    }
  ];

  private readonly knowledgeBase: KnowledgeArticle[] = [
    {
      title: 'High CPU utilization troubleshooting guide',
      tags: ['cpu', 'Performance', 'Troubleshoot'],
      alertTypes: ['CPU_HIGH', 'PERFORMANCE'],
      summary: 'This article describes how to systematically troubleshoot and resolve high CPU usage issues, including using tools like top and perf to locate problematic processes and code.'
    },
    {
      title: 'Memory leak analysis and resolution',
      tags: ['memory', 'oom', 'Troubleshoot'],
      alertTypes: ['MEMORY_LEAK', 'MEMORY'],
      summary: 'This article introduces common memory leak scenarios, analysis tools, and solutions to help quickly locate and fix memory issues.'
    },
    {
      title: 'Disk space management best practices',
      tags: ['disk', 'Storage', 'Operations'],
      alertTypes: ['DISK_FULL', 'STORAGE'],
      summary: 'This article introduces disk space monitoring, cleanup strategies, and scaling solutions to ensure sufficient system storage resources.'
    },
    {
      title: 'Network troubleshooting manual',
      tags: ['network', 'Network', 'Troubleshoot'],
      alertTypes: ['NETWORK_DOWN', 'NETWORK'],
      summary: 'This article provides a systematic troubleshooting process for network failures, including connectivity testing, traceroute, and packet capture analysis.'
    },
    {
      title: 'Service high availability assurance plan',
      tags: ['service', 'High Availability', 'Operations'],
      alertTypes: ['SERVICE_DOWN', 'AVAILABILITY'],
      summary: 'This article introduces service high availability architecture design and failover strategies, including load balancing, health checks, and automatic restarts.'
    },
    {
      title: 'Database performance optimization guide',
      tags: ['database', 'Performance', 'Optimization'],
      alertTypes: ['DATABASE_ISSUE', 'DATABASE'],
      summary: 'This article introduces database performance optimization methods, including index optimization, query optimization, and connection pool configuration.'
    },
    {
      title: 'SSL certificate management and renewal',
      tags: ['ssl', 'Certificate', 'Security'],
      alertTypes: ['SSL_CERT_EXPIRED', 'SECURITY'],
      summary: 'This article introduces the application, deployment, monitoring, and automatic renewal of SSL certificates.'
    }
  ];

  private readonly workflowScripts: WorkflowScriptTemplate[] = [
    {
      workflowType: 'restart_service',
      keywords: ['Restart', 'restart', 'Service'],
      scriptTemplate: 'systemctl restart {{service_name}} && systemctl status {{service_name}}',
      description: 'Restart the specified service and check its status'
    },
    {
      workflowType: 'check_disk',
      keywords: ['Disk', 'disk', 'Storage'],
      scriptTemplate: 'df -h && du -sh /var/log/* 2>/dev/null | sort -rh | head -10',
      description: 'Check disk usage and log files'
    },
    {
      workflowType: 'check_memory',
      keywords: ['Memory', 'memory', 'oom'],
      scriptTemplate: 'free -m && ps aux --sort=-%mem | head -10',
      description: 'Check memory usage and top memory-consuming processes'
    },
    {
      workflowType: 'check_network',
      keywords: ['Network', 'network', 'Connection'],
      scriptTemplate: 'ping -c 4 {{target_host}} && netstat -tuln',
      description: 'Check network connectivity and port status'
    },
    {
      workflowType: 'collect_logs',
      keywords: ['Log', 'log', 'Collect'],
      scriptTemplate: 'journalctl -u {{service_name}} --since "{{start_time}}" --until "{{end_time}}" --no-pager',
      description: 'Collect logs for the specified service during a time period'
    },
    {
      workflowType: 'health_check',
      keywords: ['Health check', 'health', 'Check'],
      scriptTemplate: 'curl -sf http://{{server_ip}}:{{port}}/health || echo "Health check failed"',
      description: 'Execute service health check'
    }
  ];

  analyzeByRules(alertTitle: string, alertContent: string): RuleAnalysisResult {
    const startTime = Date.now();
    const searchContent = `${alertTitle} ${alertContent}`.toLowerCase();

    logger.info(`🔍 [LocalRuleEngine] Starting rule-based analysis for: ${alertTitle}`);

    const matchedPatterns = this.matchPatterns(searchContent);

    if (matchedPatterns.length === 0) {
      logger.info(`📋 [LocalRuleEngine] No matching rules found, returning generic analysis`);
      return this.generateGenericAnalysis(alertTitle, alertContent);
    }

    const bestMatch = matchedPatterns[0];
    const confidence = this.calculateConfidence(bestMatch, searchContent);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const result: RuleAnalysisResult = {
      rootCause: bestMatch.rootCause,
      symptoms: bestMatch.symptoms,
      timeline: [
        { time: now, event: `检测到告警: ${alertTitle}` },
        { time: now, event: `匹配规则: ${bestMatch.name} (置信度: ${(confidence * 100).toFixed(1)}%)` },
        { time: now, event: 'Generate analysis results based on the rule base' }
      ],
      evidence: [
        `告警标题匹配关键词: ${bestMatch.keywords.filter(k => searchContent.includes(k)).join(', ')}`,
        `规则库匹配模式: ${bestMatch.name}`
      ],
      recommendations: bestMatch.recommendations,
      matchedPatternId: bestMatch.id,
      confidence
    };

    const executionTime = Date.now() - startTime;
    logger.info(`✅ [LocalRuleEngine] Rule-based analysis completed in ${executionTime}ms, matched: ${bestMatch.name}, confidence: ${(confidence * 100).toFixed(1)}%`);

    return result;
  }

  executeWorkflowFallback(workflowType: string, alert: { title?: string; content?: string; server_ip?: string; [key: string]: unknown }): string {
    logger.info(`🔧 [LocalRuleEngine] Executing workflow fallback for: ${workflowType}`);

    const matchedScript = this.workflowScripts.find(s =>
      workflowType.toLowerCase().includes(s.workflowType.toLowerCase()) ||
      s.keywords.some(k => workflowType.toLowerCase().includes(k.toLowerCase()))
    );

    if (!matchedScript) {
      logger.warn(`📋 [LocalRuleEngine] No matching workflow script for: ${workflowType}`);
      return `# 工作流降级执行\n\n未找到匹配的脚本模板: ${workflowType}\n\n建议人工介入处理。`;
    }

    let script = matchedScript.scriptTemplate;

    const context: Record<string, string> = {
      server_ip: alert.server_ip as string || 'unknown',
      alert_title: alert.title || 'Unknown Alert',
      service_name: this.extractServiceName(alert.title || '', alert.content || ''),
      target_host: alert.server_ip as string || 'localhost',
      port: String(alert.port || 80),
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date().toISOString()
    };

    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      while (script.includes(placeholder)) {
        script = script.split(placeholder).join(value);
      }
    }

    const result = `# 工作流降级执行 - ${matchedScript.description}\n\n## 匹配规则\n- 工作流类型: ${workflowType}\n- 脚本模板: ${matchedScript.workflowType}\n\n## 执行命令\n\`\`\`bash\n${script}\n\`\`\`\n\n## 注意事项\n1. 请在执行前确认环境参数正确\n2. 建议在测试环境先验证\n3. 记录执行结果用于后续分析`;

    logger.info(`✅ [LocalRuleEngine] Workflow fallback script generated for: ${workflowType}`);
    return result;
  }

  recommendKnowledge(alertType: string, alertTitle: string): Array<{ title: string; summary: string; relevance: number }> {
    logger.info(`📚 [LocalRuleEngine] Recommending knowledge for alert type: ${alertType}, title: ${alertTitle}`);

    const searchContent = `${alertType} ${alertTitle}`.toLowerCase();
    const recommendations: Array<{ title: string; summary: string; relevance: number }> = [];

    for (const article of this.knowledgeBase) {
      let score = 0;

      if (article.alertTypes.some(t => alertType.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(alertType.toLowerCase()))) {
        score += 0.5;
      }

      for (const tag of article.tags) {
        if (searchContent.includes(tag.toLowerCase())) {
          score += 0.2;
        }
      }

      for (const keyword of article.title.toLowerCase().split(/\s+/)) {
        if (searchContent.includes(keyword) && keyword.length > 1) {
          score += 0.1;
        }
      }

      if (score > 0) {
        recommendations.push({
          title: article.title,
          summary: article.summary,
          relevance: Math.min(score, 1.0)
        });
      }
    }

    recommendations.sort((a, b) => b.relevance - a.relevance);

    logger.info(`📚 [LocalRuleEngine] Found ${recommendations.length} knowledge recommendations`);
    return recommendations.slice(0, 5);
  }

  getRuleStats(): { totalPatterns: number; totalKnowledgeArticles: number; totalWorkflowScripts: number } {
    return {
      totalPatterns: this.failurePatterns.length,
      totalKnowledgeArticles: this.knowledgeBase.length,
      totalWorkflowScripts: this.workflowScripts.length
    };
  }

  private matchPatterns(content: string): FailurePattern[] {
    const scoredPatterns: Array<{ pattern: FailurePattern; score: number }> = [];

    for (const pattern of this.failurePatterns) {
      let score = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of pattern.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        scoredPatterns.push({ pattern, score });
      }
    }

    scoredPatterns.sort((a, b) => b.score - a.score);

    return scoredPatterns.map(s => s.pattern);
  }

  private calculateConfidence(pattern: FailurePattern, content: string): number {
    const matchedCount = pattern.keywords.filter(k => content.includes(k.toLowerCase())).length;
    const totalKeywords = pattern.keywords.length;

    if (matchedCount === 0) return 0;

    const keywordMatchRatio = matchedCount / totalKeywords;

    const lengthFactor = Math.min(content.length / 100, 1);

    return Math.min(0.95, keywordMatchRatio * 0.7 + lengthFactor * 0.3);
  }

  private generateGenericAnalysis(alertTitle: string, _alertContent: string): RuleAnalysisResult {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return {
      rootCause: `未匹配到预设规则库中的故障模式。告警 "${alertTitle}" 需要进一步人工分析。`,
      symptoms: ['System anomaly alert triggered', 'No known failure pattern matched'],
      timeline: [
        { time: now, event: `检测到告警: ${alertTitle}` },
        { time: now, event: 'Rule base match failed, returning general analysis' }
      ],
      evidence: [
        'No preset failure pattern keywords matched',
        'Recommended to collect more context before manual analysis'
      ],
      recommendations: [
        'Check system logs and application logs for more information',
        'Check if there were recent change deployments',
        'Contact relevant system owners for troubleshooting assistance',
        'Consider adding this failure pattern to the rule base'
      ],
      confidence: 0.3
    };
  }

  private extractServiceName(title: string, content: string): string {
    const combined = `${title} ${content}`.toLowerCase();

    const serviceKeywords = [
      'nginx', 'apache', 'mysql', 'redis', 'postgresql', 'mongo',
      'docker', 'kubernetes', 'jenkins', 'gitlab', 'grafana', 'prometheus'
    ];

    for (const service of serviceKeywords) {
      if (combined.includes(service)) {
        return service;
      }
    }

    const match = combined.match(/(\w+)(?:service|进程|应用|服务)/);
    if (match) {
      return match[1];
    }

    return 'unknown';
  }
}

export const localRuleEngine = new LocalRuleEngine();
export { LocalRuleEngine };
