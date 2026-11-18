const Database = require('better-sqlite3');
const db = new Database('/app/data/app.db', { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
for (const t of tables) {
  if (t.name.includes('alert') || t.name.includes('mapping') || t.name.includes('provider')) console.log('TABLE:', t.name);
}

// find alert mapping table
for (const t of tables) {
  if (t.name.includes('mapping')) {
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all().map(c => c.name);
    console.log(t.name, ':', cols.join(', '));
    const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 5`).all();
    console.log('sample:', JSON.stringify(rows, null, 1).slice(0, 500));
  }
}

// find alert provider config table
for (const t of tables) {
  if (t.name.includes('provider')) {
    const cols = db.prepare(`PRAGMA table_info(${t.name})`).all().map(c => c.name);
    console.log(t.name, ':', cols.join(', '));
    const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 3`).all();
    console.log('sample:', JSON.stringify(rows, null, 1).slice(0, 500));
  }
}
