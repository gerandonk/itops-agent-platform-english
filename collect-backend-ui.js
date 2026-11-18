// Collect CJK string literals from backend UI-visible sources
const fs = require('fs');
const path = require('path');

const targets = [
  '/src/modules/mcp/services/toolDefinitions',
  '/src/modules/mcp/services',
  '/src/modules/workflow/services',
  '/src/modules/ai/services/providers',
  '/src/modules/ai/services/agents/agentTools',
  '/src/modules/ai/services/agents',
  '/src/modules/monitor/services/selfMonitorService',
];

const literalRe = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const items = new Map();

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return; }
  for (const f of entries) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(ts|js)$/.test(f) && !f.includes('.test.')) {
      const src = fs.readFileSync(full, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, i) => {
        // skip comment-only lines
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const m of line.matchAll(literalRe)) {
          const body = m[2];
          if (/[\u4e00-\u9fff]/.test(body)) {
            const k = body;
            if (!items.has(k)) items.set(k, { file: full.replace('/src/', ''), line: i + 1 });
          }
        }
      });
    }
  }
}
for (const t of targets) walk(t);
const arr = [...items.entries()].map(([text, loc]) => ({ text, file: loc.file, line: loc.line }));
arr.sort((a, b) => a.file.localeCompare(b.file));
fs.writeFileSync('/out/backend-ui.json', JSON.stringify(arr, null, 1), 'utf8');
console.log('backend UI CJK strings:', arr.length);
const byFile = {};
for (const a of arr) byFile[a.file] = (byFile[a.file] || 0) + 1;
console.log(JSON.stringify(Object.entries(byFile).sort((a,b)=>b[1]-a[1]).slice(0,20), null, 1));
