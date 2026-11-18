const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('/app/data/app.db');
const rows = JSON.parse(fs.readFileSync('/app/db-cjk.json', 'utf8'));
const dict = JSON.parse(fs.readFileSync('/app/db-translated.json', 'utf8'));

let updated = 0;
const stmts = new Map();
for (const r of rows) {
  const val = dict[r.value];
  if (val === undefined) continue;
  const key = `${r.table}|${r.col}`;
  if (!stmts.has(key)) {
    stmts.set(key, db.prepare(`UPDATE ${r.table} SET ${r.col} = ? WHERE rowid = ?`));
  }
  stmts.get(key).run(val, r.rowid);
  updated++;
}
console.log('rows updated:', updated, 'of', rows.length);
