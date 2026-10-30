#!/usr/bin/env python3
"""Fetch licensed stock photography from Pexels, render responsive WebP + credits."""
import io, json, os, re, sys, urllib.parse, urllib.request
from PIL import Image, ImageOps

KEY = re.search(r'^PEXELS_API_KEY=(.+)$', open('/home/hermes/migration/secrets.env').read(), re.M).group(1).strip()
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
os.makedirs(OUT, exist_ok=True)
CRED = os.path.join(os.path.dirname(__file__), '..', '..', 'rainbownet-web', 'src', 'content', 'image-credits.json')

# name: (query, orientation, widths)
JOBS = {
    'hero-geneva':            ('geneva lake jet d eau switzerland', 'landscape', [2400, 1200]),
    'geneva-city':            ('geneva switzerland old town', 'landscape', [2000, 1000]),
    'confidentiality':        ('modern meeting room interior', 'landscape', [2000, 1000]),
    'corporate-investigations': ('business district skyscrapers', 'landscape', [2000, 1000]),
    'private-investigations': ('european old town street architecture', 'landscape', [2000, 1000]),
    'europe-coverage':        ('la defense paris business district', 'landscape', [2000, 1000]),
    'contact-office':         ('minimalist office interior window', 'landscape', [2000, 1000]),
    'about-geneva':           ('geneva switzerland architecture', 'landscape', [2000, 1000]),
    'approach-desk':          ('documents desk notebook workspace', 'landscape', [2000, 1000]),
    'service-individuals':    ('geneva city street switzerland', 'landscape', [1600, 800]),
    'service-corporate':      ('corporate office meeting business', 'landscape', [1600, 800]),
    'service-legal':          ('law office books documents', 'landscape', [1600, 800]),
    'service-international':  ('airport business travel europe', 'landscape', [1600, 800]),
    'city-paris':             ('paris la defense skyline', 'landscape', [1600, 800]),
    'city-london':            ('city of london skyline', 'landscape', [1600, 800]),
    'city-brussels':          ('brussels european quarter architecture', 'landscape', [1600, 800]),
    'city-berlin':            ('berlin modern architecture', 'landscape', [1600, 800]),
    'city-rome':              ('rome eur business district', 'landscape', [1600, 800]),
    'city-madrid':            ('madrid skyline financial district', 'landscape', [1600, 800]),
    'city-luxembourg':        ('luxembourg city kirchberg', 'landscape', [1600, 800]),
    'city-amsterdam':         ('amsterdam zuidas business district', 'landscape', [1600, 800]),
    'city-vienna':            ('vienna architecture city', 'landscape', [1600, 800]),
    'city-lisbon':            ('lisbon city architecture', 'landscape', [1600, 800]),
    'insight-choosing':       ('geneva city lake switzerland', 'landscape', [1600, 800]),
    'insight-when':           ('business professional office desk', 'landscape', [1600, 800]),
    'insight-due-diligence':  ('financial documents analysis', 'landscape', [1600, 800]),
    'insight-international':  ('european union building brussels', 'landscape', [1600, 800]),
    'insight-confidentiality': ('confidential documents folder', 'landscape', [1600, 800]),
    'insight-corporate':      ('corporate meeting boardroom', 'landscape', [1600, 800]),
    'insight-consultation':   ('lawyer consultation client office', 'landscape', [1600, 800]),
}

def search(q, orient):
    url = ('https://api.pexels.com/v1/search?query=%s&per_page=12&orientation=%s'
           % (urllib.parse.quote(q), orient))
    req = urllib.request.Request(url, headers={'Authorization': KEY, 'User-Agent': 'Mozilla/5.0'})
    return json.loads(urllib.request.urlopen(req, timeout=40).read())['photos']

def pick(photos, used):
    for p in photos:
        if p['id'] in used:
            continue
        if p['width'] < p['height']:
            continue
        return p
    return photos[0] if photos else None

only = sys.argv[1:] or list(JOBS)
credits = json.load(open(CRED)) if os.path.exists(CRED) else {}
used = {v['id'] for v in credits.values()}

for name in only:
    q, orient, widths = JOBS[name]
    photos = search(q, orient)
    p = pick(photos, used)
    if not p:
        print('NO RESULT', name); continue
    used.add(p['id'])
    raw = urllib.request.urlopen(urllib.request.Request(p['src']['original'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=120).read()
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    im = ImageOps.exif_transpose(im)
    for w in widths:
        out = im.copy()
        if out.width > w:
            out = out.resize((w, round(out.height * w / out.width)), Image.LANCZOS)
        path = os.path.join(OUT, f'{name}-{w}.webp')
        out.save(path, 'WEBP', quality=82, method=6)
        print(name, w, os.path.getsize(path) // 1024, 'KB')
    credits[name] = {'id': p['id'], 'photographer': p['photographer'],
                     'url': p['url'], 'alt': p.get('alt', ''), 'source': 'Pexels'}
    json.dump(credits, open(CRED, 'w'), ensure_ascii=False, indent=1)
print('done', len(credits))
