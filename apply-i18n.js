const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '/src';
const dictPath = process.argv[3] || '/dict.json';
const dict = Object.assign(
  {},
  JSON.parse(fs.readFileSync(dictPath, 'utf8')),
  JSON.parse(fs.readFileSync('/out/translated.json', 'utf8')),
  JSON.parse(fs.readFileSync('/out/servers-translated.json', 'utf8')),
  JSON.parse(fs.readFileSync('/out/all-pending-translated.json', 'utf8')),
  JSON.parse(fs.readFileSync('/out/all-fragments-translated.json', 'utf8')),
);
// index trimmed keys for JSX matches
const dictT = {};
for (const [k, v] of Object.entries(dict)) {
  const t = k.trim();
  if (t && !(t in dictT)) dictT[t] = v;
}
function lookup(body) {
  if (body && dict[body] !== undefined) return dict[body];
  const t = body.trim();
  if (t && dictT[t] !== undefined) return dictT[t];
  // source may store \" \' \` escapes while dict keys hold real quotes
  const un = body.replace(/\\(['"`])/g, '$1');
  if (un !== body && dict[un] !== undefined) return dict[un];
  const ut = un.trim();
  if (ut !== t && ut && dictT[ut] !== undefined) return dictT[ut];
  return undefined;
}
function escLiteral(q, v) {
  let s = String(v);
  s = s.replace(/\\/g, '\\\\');
  if (q === "'") s = s.replace(/'/g, "\\'");
  if (q === '"') s = s.replace(/"/g, '\\"');
  if (q === '`') {
    s = s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }
  return s;
}
function escJsx(v) {
  return String(v)
    .replace(/</g, "{'<'}")
    .replace(/>/g, "{'>'}")
    .replace(/\{/g, "{'{'}")
    .replace(/\}/g, "{'}'}");
}
function escTemplate(v) {
  return String(v).replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) files.push(full);
  }
})(root);

let changedFiles = 0;
let replacements = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  // 1) single-quoted literals (body may contain " and `)
  src = src.replace(/'([^'\n]*)'/g, (m, body) => {
    const t = lookup(body);
    if (t !== undefined) {
      replacements++;
      return "'" + escLiteral("'", t) + "'";
    }
    return m;
  });
  // 2) double-quoted literals (body may contain ' and `)
  src = src.replace(/"([^"\n]*)"/g, (m, body) => {
    const t = lookup(body);
    if (t !== undefined) {
      replacements++;
      return '"' + escLiteral('"', t) + '"';
    }
    return m;
  });
  // 3) template literals (body may contain ' and " and ${...}; dict values preserve interpolations)
  src = src.replace(/`([^`]*)`/g, (m, body) => {
    const t = lookup(body);
    if (t !== undefined) {
      replacements++;
      return '`' + escTemplate(String(t)) + '`';
    }
    return m;
  });
  // 4) JSX text nodes
  src = src.replace(/>([^<>{}\n]+)</g, (m, body) => {
    const lead = body.match(/^\s*/)[0];
    const trail = body.match(/\s*$/)[0];
    const key = body.trim();
    const t = lookup(key);
    if (t !== undefined && key.length > 0) {
      replacements++;
      return '>' + lead + escJsx(t) + trail + '<';
    }
    return m;
  });

  if (src !== before) {
    changedFiles++;
    fs.writeFileSync(file, src, 'utf8');
  }
}

console.log('files changed:', changedFiles, 'replacements:', replacements);
