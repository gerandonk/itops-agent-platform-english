import db from '../database';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';

export function initializePresetScripts() {
  const presetScripts = [
    {
      id: randomUUID(),
      name: 'System Health Check Script',
      description: 'Check CPU, memory, and disk usage',
      content: '#!/bin/bash\n\necho "=== System Health Check ==="\necho "Date: $(date)"\necho ""\n\necho "--- CPU Usage ---"\ntop -bn1 | head -5\n\necho ""\necho "--- Memory Usage ---"\nfree -h\n\necho ""\necho "--- Disk Usage ---"\ndf -h',
      language: 'bash',
      tags: JSON.stringify(['system-check', 'monitoring'])
    },
    {
      id: randomUUID(),
      name: 'Log Cleanup Script',
      description: 'Clean up old log files',
      content: '#!/bin/bash\n\n# Clean up log files older than 30 days\nLOG_DIR="/var/log"\necho "Cleaning log files older than 30 days in $LOG_DIR..."\nfind $LOG_DIR -name "*.log" -type f -mtime +30 -delete\necho "Done!"',
      language: 'bash',
      tags: JSON.stringify(['logs', 'cleanup'])
    },
    {
      id: randomUUID(),
      name: 'Service Status Check',
      description: 'Check the running status of critical services',
      content: '#!/bin/bash\n\necho "=== Service Status Check ==="\necho ""\n\nservices=("nginx" "mysql" "redis" "docker")\n\nfor service in "${services[@]}"; do\n  if systemctl is-active --quiet $service; then\n    echo "✅ $service - Running"\n  else\n    echo "❌ $service - Not Running"\n  fi\ndone',
      language: 'bash',
      tags: JSON.stringify(['services', 'monitoring'])
    },
    {
      id: randomUUID(),
      name: 'Database Backup Script',
      description: 'Automatically back up MySQL databases',
      content: '#!/bin/bash\n\nBACKUP_DIR="/backup/mysql"\nDATE=$(date +"%Y%m%d_%H%M%S")\nMYSQL_USER="root"\nMYSQL_PASSWORD="password"\n\nmkdir -p $BACKUP_DIR\n\necho "Starting database backup..."\nmysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD --all-databases | gzip > $BACKUP_DIR/backup_$DATE.sql.gz\n\nif [ $? -eq 0 ]; then\n  echo "✅ Backup successful: backup_$DATE.sql.gz"\n  # Keep only last 7 days of backups\n  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete\nelse\n  echo "❌ Backup failed"\n  exit 1\nfi',
      language: 'bash',
      tags: JSON.stringify(['database', 'backup', 'MySQL'])
    },
    {
      id: randomUUID(),
      name: 'System Resource Report',
      description: 'Generate detailed system resource usage reports',
      content: '#!/bin/bash\n\necho "=== System Resource Detailed Report ==="\necho "Generated: $(date)"\necho ""\n\necho "1. System Info:"\nuname -a\necho ""\n\necho "2. CPU Info:"\nlscpu | grep "Model name\\|CPU(s)\\|Core(s)\\|Thread(s)"\necho ""\n\necho "3. Memory Usage:"\nfree -h\necho ""\n\necho "4. Disk Usage:"\ndf -h\necho ""\n\necho "5. Network Connections:"\nss -tuln | head -10\necho ""\n\necho "6. System Load:"\nuptime',
      language: 'bash',
      tags: JSON.stringify(['system-report', 'resource-monitoring', 'diagnostics'])
    },
    {
      id: randomUUID(),
      name: 'Docker Container Cleanup Script',
      description: 'Clean up stopped containers and unused images',
      content: '#!/bin/bash\n\necho "=== Docker Resource Cleanup ==="\n\n# Clean up stopped containers\nSTOPPED=$(docker ps -aq -f status=exited | wc -l)\necho "Cleaning stopped containers: $STOPPED"\ndocker container prune -f\n\n# Clean up unused images\nUNUSED=$(docker images -f "dangling=true" -q | wc -l)\necho "Cleaning unused images: $UNUSED"\ndocker image prune -f\n\n# Clean up unused volumes\nVOLUMES=$(docker volume ls -qf dangling=true | wc -l)\necho "Cleaning unused volumes: $VOLUMES"\ndocker volume prune -f\n\necho "Cleanup complete!"',
      language: 'bash',
      tags: JSON.stringify(['Docker', 'cleanup', 'containers'])
    },
    {
      id: randomUUID(),
      name: 'Nginx Access Log Analysis',
      description: 'Analyze basic statistics of Nginx access logs',
      content: '#!/bin/bash\n\nLOG_FILE="/var/log/nginx/access.log"\n\nif [ ! -f "$LOG_FILE" ]; then\n  echo "Log file not found: $LOG_FILE"\n  exit 1\nfi\n\necho "=== Nginx Access Log Analysis ==="\n\n# Total requests\necho "Total requests: $(wc -l < $LOG_FILE)"\n\n# Status code distribution\necho ""\necho "Status code distribution:"\nawk \'{print $9}\' $LOG_FILE | sort | uniq -c | sort -rn\n\n# Top 10 IPs by request count\necho ""\necho "Top 10 IPs by request count:"\nawk \'{print $1}\' $LOG_FILE | sort | uniq -c | sort -rn | head -10\n\n# Top 10 URLs by request count\necho ""\necho "Top 10 URLs by request count:"\nawk \'{print $7}\' $LOG_FILE | sort | uniq -c | sort -rn | head -10',
      language: 'bash',
      tags: JSON.stringify(['Nginx', 'Log Analysis', 'statistics'])
    }
  ];

  const insertScript = db.prepare(`
    INSERT OR REPLACE INTO scripts (id, name, description, content, language, tags)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  presetScripts.forEach(script => {
    insertScript.run(script.id, script.name, script.description, script.content, script.language, script.tags);
  });

  logger.info(`✅ Successfully created/updated ${presetScripts.length} preset scripts`);
}
