/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Migration } from './migrationFramework';

/**
 * v016: Create tool_links table for configurable ops tool navigation
 *
 * Allows users to configure navigation links to external tools
 * (Zabbix, JumpServer, Prometheus, Grafana, Loki, etc.)
 */
const migration: Migration = {
  version: 16,
  id: '20250612000016',
  name: 'Create tool_links table',
  description: 'Creates tool_links table for configurable operations tool navigation',
  up: async (db: any) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tool_links (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT DEFAULT 'ExternalLink',
        category TEXT DEFAULT 'Uncategorized',
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_external INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        updated_at DATETIME DEFAULT (datetime('now','localtime'))
      );
    `);

    // Insert preset tools with realistic internal URLs
    const presets = [
      { name: 'Zabbix', url: 'http://zabbix.ops.local/zabbix', icon: 'Activity', category: 'Monitoring', description: 'Enterprise-grade IT infrastructure monitoring with multi-platform alerting and visualization', sort_order: 1 },
      { name: 'Grafana', url: 'http://grafana.ops.local:3000', icon: 'BarChart3', category: 'Monitoring', description: 'Unified observability dashboard aggregating Prometheus/Loki/ClickHouse data sources', sort_order: 2 },
      { name: 'Prometheus', url: 'http://prometheus.ops.local:9090', icon: 'LineChart', category: 'Monitoring', description: 'Cloud-native monitoring and alerting system with PromQL multi-dimensional queries', sort_order: 3 },
      { name: 'Kibana', url: 'http://kibana.ops.local:5601', icon: 'FileSearch', category: 'Logging', description: 'ELK log analysis platform frontend with full-text search and visualization', sort_order: 1 },
      { name: 'JumpServer', url: 'http://jumpserver.ops.local:8080', icon: 'Shield', category: 'Bastion', description: 'Open-source bastion host - account management, permission control, operation audit', sort_order: 1 },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO tool_links (id, name, url, icon, category, description, sort_order, is_external)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomUUID } = require('crypto');
    for (const tool of presets) {
      insertStmt.run(randomUUID(), tool.name, tool.url, tool.icon, tool.category, tool.description, tool.sort_order);
    }
  },
  down: async (db: any) => {
    db.exec('DROP TABLE IF EXISTS tool_links;');
  }
};

export default migration;
