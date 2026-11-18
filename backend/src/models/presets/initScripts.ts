import db from '../database';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';

export function initializePresetScripts() {
  const presetScripts = [
    {
      id: randomUUID(),
      name: 'System Health Check Script',
      description: 'Check CPU, memory, and disk usage',
      content: '#!/bin/bash\n\necho "=== 系统健康检查 ==="\necho "日期: $(date)"\necho ""\n\necho "--- CPU 使用情况 ---"\ntop -bn1 | head -5\n\necho ""\necho "--- 内存使用情况 ---"\nfree -h\n\necho ""\necho "--- 磁盘使用情况 ---"\ndf -h',
      language: 'bash',
      tags: JSON.stringify(['系统检查', '监控'])
    },
    {
      id: randomUUID(),
      name: 'Log Cleanup Script',
      description: 'Clean up old log files',
      content: '#!/bin/bash\n\n# 清理 30 天前的日志文件\nLOG_DIR="/var/log"\necho "正在清理 $LOG_DIR 目录下 30 天前的日志.."\nfind $LOG_DIR -name "*.log" -type f -mtime +30 -delete\necho "完成!"',
      language: 'bash',
      tags: JSON.stringify(['日志', '清理'])
    },
    {
      id: randomUUID(),
      name: 'Service Status Check',
      description: 'Check the running status of critical services',
      content: '#!/bin/bash\n\necho "=== 服务状态检查 ==="\necho ""\n\nservices=("nginx" "mysql" "redis" "docker")\n\nfor service in "${services[@]}"; do\n  if systemctl is-active --quiet $service; then\n    echo "✅ $service - 运行中"\n  else\n    echo "❌ $service - 未运行"\n  fi\ndone',
      language: 'bash',
      tags: JSON.stringify(['服务', '监控'])
    },
    {
      id: randomUUID(),
      name: 'Database Backup Script',
      description: 'Automatically back up MySQL databases',
      content: '#!/bin/bash\n\nBACKUP_DIR="/backup/mysql"\nDATE=$(date +"%Y%m%d_%H%M%S")\nMYSQL_USER="root"\nMYSQL_PASSWORD="password"\n\nmkdir -p $BACKUP_DIR\n\necho "开始备份数据库..."\nmysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD --all-databases | gzip > $BACKUP_DIR/backup_$DATE.sql.gz\n\nif [ $? -eq 0 ]; then\n  echo "✅ 备份成功: backup_$DATE.sql.gz"\n  # 只保留最近 7 天的备份\n  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete\nelse\n  echo "❌ 备份失败"\n  exit 1\nfi',
      language: 'bash',
      tags: JSON.stringify(['数据库', '备份', 'MySQL'])
    },
    {
      id: randomUUID(),
      name: 'System Resource Report',
      description: 'Generate detailed system resource usage reports',
      content: '#!/bin/bash\n\necho "=== 系统资源详细报告 ==="\necho "生成时间: $(date)"\necho ""\n\necho "1. 系统信息:"\nuname -a\necho ""\n\necho "2. CPU信息:"\nlscpu | grep "Model name\\|CPU(s)\\|Core(s)\\|Thread(s)"\necho ""\n\necho "3. 内存使用:"\nfree -h\necho ""\n\necho "4. 磁盘使用:"\ndf -h\necho ""\n\necho "5. 网络连接:"\nss -tuln | head -10\necho ""\n\necho "6. 系统负载:"\nuptime',
      language: 'bash',
      tags: JSON.stringify(['系统报告', '资源监控', '诊断'])
    },
    {
      id: randomUUID(),
      name: 'Docker Container Cleanup Script',
      description: 'Clean up stopped containers and unused images',
      content: '#!/bin/bash\n\necho "=== Docker 资源清理 ==="\n\n# 清理停止的容器\nSTOPPED=$(docker ps -aq -f status=exited | wc -l)\necho "清理停止的容器: $STOPPED 个"\ndocker container prune -f\n\n# 清理未使用的镜像\nUNUSED=$(docker images -f "dangling=true" -q | wc -l)\necho "清理未使用的镜像: $UNUSED 个"\ndocker image prune -f\n\n# 清理未使用的卷\nVOLUMES=$(docker volume ls -qf dangling=true | wc -l)\necho "清理未使用的卷: $VOLUMES 个"\ndocker volume prune -f\n\necho "清理完成!"',
      language: 'bash',
      tags: JSON.stringify(['Docker', '清理', '容器'])
    },
    {
      id: randomUUID(),
      name: 'Nginx Access Log Analysis',
      description: 'Analyze basic statistics of Nginx access logs',
      content: '#!/bin/bash\n\nLOG_FILE="/var/log/nginx/access.log"\n\nif [ ! -f "$LOG_FILE" ]; then\n  echo "日志文件不存在: $LOG_FILE"\n  exit 1\nfi\n\necho "=== Nginx 访问日志分析 ==="\n\n# 总请求数\necho "总请求数: $(wc -l < $LOG_FILE)"\n\n# 状态码统计\necho ""\necho "状态码分布:"\nawk \'{print $9}\' $LOG_FILE | sort | uniq -c | sort -rn\n\n# 访问量前10的IP\necho ""\necho "访问量前10的IP:"\nawk \'{print $1}\' $LOG_FILE | sort | uniq -c | sort -rn | head -10\n\n# 访问量前10的URL\necho ""\necho "访问量前10的URL:"\nawk \'{print $7}\' $LOG_FILE | sort | uniq -c | sort -rn | head -10',
      language: 'bash',
      tags: JSON.stringify(['Nginx', 'Log Analysis', '统计'])
    }
  ];

  const insertScript = db.prepare(`
    INSERT OR IGNORE INTO scripts (id, name, description, content, language, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  presetScripts.forEach(script => {
    insertScript.run(script.id, script.name, script.description, script.content, script.language, script.tags);
  });

  logger.info(`✅ 成功创建 ${presetScripts.length} 个预设脚本`);
}
