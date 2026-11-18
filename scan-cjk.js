const fs = require('fs');
const path = require('path');
let files = 0, hits = 0;
const samples = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const full = path.join(d, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(f)) {
      const s = fs.readFileSync(full, 'utf8');
      const m = s.match(/[一-鿿]/g);
      if (m) { files++; hits += m.length; if (samples.length < 20) samples.push(full + ' :: ' + m.slice(0,5).join('')); }
    }
  }
})('/src');
console.log('files with CJK:', files, 'total CJK chars:', hits);
samples.forEach(s => console.log('  ', s));
