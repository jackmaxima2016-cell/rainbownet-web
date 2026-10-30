#!/usr/bin/env python3
"""Build a lightweight Europe SVG map (Mercator, clipped) from public GeoJSON."""
import json, math

SRC = '/tmp/europe.geojson'
OUT = '/home/hermes/migration/rainbownet-web/src/content/europe-map.json'
W, H = 1000, 900
LON0, LON1 = -11.0, 31.0
LAT0, LAT1 = 35.0, 61.5

def merc(lat):
    lat = max(-85, min(85, lat))
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

Y0, Y1 = merc(LAT0), merc(LAT1)

def project(lon, lat):
    x = (lon - LON0) / (LON1 - LON0) * W
    y = (Y1 - merc(lat)) / (Y1 - Y0) * H
    return x, y

def rdp(points, eps):
    if len(points) < 3:
        return points
    x1, y1 = points[0]; x2, y2 = points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(points[:idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]

data = json.load(open(SRC))
countries = []
for f in data['features']:
    name = f['properties'].get('NAME') or f['properties'].get('name') or ''
    geom = f['geometry']
    if not geom:
        continue
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    d = []
    for poly in polys:
        for ring_i, ring in enumerate(poly):
            pts = []
            for lon, lat, *_ in ring:
                if lon < LON0 - 1 or lon > LON1 + 1 or lat < LAT0 - 1 or lat > LAT1 + 1:
                    continue
                pts.append(project(lon, lat))
            if len(pts) >= 2 and abs(pts[0][0] - pts[-1][0]) < 0.01 and abs(pts[0][1] - pts[-1][1]) < 0.01:
                pts = pts[:-1]
            if len(pts) < 4:
                continue
            pts = rdp(pts, 0.45)
            if len(pts) < 3:
                continue
            d.append('M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z')
    if d:
        countries.append({'name': name, 'd': ''.join(d)})

json.dump({
    'width': W, 'height': H,
    'bbox': {'lon0': LON0, 'lon1': LON1, 'lat0': LAT0, 'lat1': LAT1},
    'projection': 'mercator',
    'countries': countries,
}, open(OUT, 'w'), separators=(',', ':'))
print('countries', len(countries), 'bytes', len(open(OUT).read()) // 1024, 'KB')
print([c['name'] for c in countries][:12])
