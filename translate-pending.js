// Auto-translate i18n-out/pending.json via Google Translate (no API key).
// Output: i18n-out/dict-extra.json  (zh -> en)
const fs = require('fs');

const pending = JSON.parse(fs.readFileSync('/out/pending.json', 'utf8'));
const dict = {};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  for (let i = 0; i < pending.length; i++) {
    const { text } = pending[i];
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=' + encodeURIComponent(text);
      const res = await fetch(url);
      const body = await res.text();
      const parsed = JSON.parse(body);
      const trans = parsed && parsed[0] && parsed[0][0] && parsed[0][0][0];
      dict[text] = trans || text;
    } catch (e) {
      dict[text] = text;
    }
    if ((i + 1) % 50 === 0) console.log('done', i + 1, '/', pending.length);
    await sleep(80);
  }
  fs.writeFileSync('/out/dict-extra.json', JSON.stringify(dict, null, 1));
  console.log('wrote', Object.keys(dict).length, 'entries');
})();
