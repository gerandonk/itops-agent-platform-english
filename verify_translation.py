import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('i18n-out/be-batch2-translated.json', 'r', encoding='utf-8') as f:
    result = json.load(f)

bad = []
for k, v in result.items():
    # allow technical/structural terms; flag any CJK ideographs in the English value
    if re.search(r'[\u4e00-\u9fff]', v):
        bad.append((k, v))

print(f"Total entries: {len(result)}")
print(f"Entries with CJK in value: {len(bad)}")
for k, v in bad:
    print(f"  KEY: {k!r}")
    print(f"  VAL: {v!r}")

# Also verify every input text is present as a key
with open('i18n-out/be-batch2.json', 'r', encoding='utf-8') as f:
    items = json.load(f)
input_texts = set(i['text'] for i in items)
missing = input_texts - set(result.keys())
print(f"Missing keys: {len(missing)}")
for m in missing:
    print(f"  MISSING: {m!r}")
