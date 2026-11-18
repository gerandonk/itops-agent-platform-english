import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('i18n-out/be-batch2.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for item in items:
    t = item['text']
    if '\n' in t or '\\n' in t:
        print(repr(t))
