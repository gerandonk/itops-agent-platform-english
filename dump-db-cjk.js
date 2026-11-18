const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('/app/data/app.db', { readonly: true });

const targets = [
  ['agents', ['name', 'role', 'category', 'description']],
  ['workflows', ['name', 'description']],
  ['remediation_policies', ['name', 'description']],
  ['scripts', ['name', 'description']],
  ['tool_links', ['name', 'description', 'category']],
  ['scheduled_tasks', ['name', 'description']],
  ['config_templates', ['name', 'description', 'category', 'service_name']],
  ['reports', ['name']],
  ['alerts', ['title', 'content']],
  ['knowledge_base', ['title', 'content', 'category']],
  ['ai_remediations', ['title', 'description']],
  ['notifications', ['title', 'content']],
  ['servers', ['name', 'description']],
  ['network_devices', ['name', 'description']],
  ['server_groups', ['name', 'description']],
  ['container_images', ['name']],
  ['containers', ['name']],
  ['tasks', ['name', 'description']],
  ['approval_requests', ['title', 'description']],
  ['service_topologies', ['name', 'description']],
  ['network_subnets', ['name', 'description']],
  ['snmp_credentials', ['name', 'description']],
  ['ssh_keys', ['name', 'description']],
  ['credentials', ['name', 'description']],
  ['database_connections', ['name', 'description']],
  ['vm_platforms', ['name']],
  ['virtual_machines', ['name', 'description']],
  ['dc_rooms', ['name', 'description']],
  ['dc_racks', ['name', 'description']],
  ['dc_pdus', ['name']],
  ['dc_power_panels', ['name']],
  ['dc_power_feeds', ['name']],
  ['dc_cables', ['name']],
  ['network_discovery_jobs', ['name']],
  ['image_registries', ['name']],
  ['compose_projects', ['name']],
  ['storage_volumes', ['name']],
  ['auto_scale_rules', ['name', 'description']],
  ['vm_snapshot_policies', ['name']],
  ['alert_configs', ['name', 'description']],
  ['alert_workflow_mappings', ['label']],
  ['report_schedules', ['name']],
];

const cjk = /[\u4e00-\u9fff]/;
const out = [];

for (const [table, cols] of targets) {
  let rows;
  try {
    rows = db.prepare(`SELECT rowid AS __rowid, * FROM ${table}`).all();
  } catch (e) {
    continue;
  }
  for (const row of rows) {
    for (const col of cols) {
      const v = row[col];
      if (typeof v === 'string' && cjk.test(v)) {
        out.push({ table, col, rowid: row.__rowid, id: row.id, value: v });
      }
    }
  }
}

fs.writeFileSync('/app/db-cjk.json', JSON.stringify(out, null, 1), 'utf8');
const unique = [...new Set(out.map(o => o.value))];
console.log('rows with CJK:', out.length, 'unique values:', unique.length);
const byTable = {};
for (const o of out) byTable[o.table] = (byTable[o.table] || 0) + 1;
console.log(JSON.stringify(byTable, null, 1));
