#!/usr/bin/env python3
"""Download latin/latin-ext woff2 subsets for Manrope + Inter and build fonts.css."""
import re, os, urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'}
URL = ('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800'
       '&family=Inter:wght@300;400;500;600&display=swap')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')
os.makedirs(OUT, exist_ok=True)

css = urllib.request.urlopen(urllib.request.Request(URL, headers=UA), timeout=30).read().decode()
blocks = re.findall(r'/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S)
rules, seen = [], set()
for subset, body in blocks:
    if subset not in ('latin', 'latin-ext'):
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", body).group(1)
    wt = re.search(r'font-weight:\s*(\d+)', body).group(1)
    url = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
    fname = f"{fam.lower()}-{wt}-{subset}.woff2"
    path = os.path.join(OUT, fname)
    if fname not in seen:
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        open(path, 'wb').write(data)
        seen.add(fname)
        print(fname, len(data))
    ur = re.search(r'unicode-range:\s*([^;]+);', body)
    rules.append((fam, wt, fname, ur.group(1).strip() if ur else ''))

lines = []
for fam, wt, fname, ur in rules:
    lines.append(f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{wt};font-display:swap;"
                 f"src:url('/fonts/{fname}') format('woff2');unicode-range:{ur};}}")
open(os.path.join(OUT, 'fonts.css'), 'w').write('\n'.join(lines) + '\n')
print('rules', len(rules))
