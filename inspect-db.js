const Database = require('better-sqlite3');
const db = new Database('./app.db.tmp', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('TABLES:', tables.map(t => t.name).join(', '));
for (const t of ['agents','workflows','alert_mappings','scripts','tool_links','scheduled_tasks','remediation_policies','config_templates','reports','alerts']) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
    console.log(t + ':', cols.join(', '));
  } catch (e) { console.log(t + ': ERR', e.message); }
}
// sample current Chinese data
console.log('--- agents names:');
for (const r of db.prepare('SELECT name, category FROM agents LIMIT 15').all()) console.log(' ', JSON.stringify(r.name), '|', JSON.stringify(r.category));
console.log('--- workflows names:');
for (const r of db.prepare('SELECT name FROM workflows LIMIT 15').all()) console.log(' ', JSON.stringify(r.name));
console.log('--- remediation_policies names:');
try { for (const r of db.prepare('SELECT name FROM remediation_policies LIMIT 15').all()) console.log(' ', JSON.stringify(r.name)); } catch(e){ console.log(' ERR', e.message); }
console.log('--- alerts titles:');
try { for (const r of db.prepare('SELECT title FROM alerts LIMIT 10').all()) console.log(' ', JSON.stringify(r.title)); } catch(e){ console.log(' ERR', e.message); }
