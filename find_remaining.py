import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('i18n-out/be-batch2.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

with open('i18n-out/be-batch2-translated.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

for item in items:
    t = item['text']
    if res.get(t) == t and any(ord(c) > 127 for c in t if c not in '${}?.()[]+-*/:=✅❌📊🎯📚🔄ℹ️📄⚠️🔍 _'):
        print(repr(t))
