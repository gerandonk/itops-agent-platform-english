const d = require('/out/all-pending-translated.json');
for (const [k, v] of Object.entries(d)) {
  if (k.includes('通用格式')) {
    console.log('KEY:', JSON.stringify(k));
    console.log('VAL:', JSON.stringify(v));
  }
}
