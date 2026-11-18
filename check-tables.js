const Database = require('better-sqlite3');
const db = new Database('/app/data/app.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('TABLES:', tables.map(t => t.name).join(', '));
for (const t of ['agents','workflows','alert_mappings','scripts','tool_links','scheduled_tasks','remediation_policies','config_templates','reports','alerts']) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
    console.log(t + ':', cols.join(', '));
  } catch (e) { console.log(t + ': ERR', e.message); }
}
