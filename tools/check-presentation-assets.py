"""Check resources referenced by compiled presentation HTML, CSS and JS.

HTML-Proofer cannot see slide markup injected by the JavaScript bundles.
Run this against the production output to catch missing media and bad bases.
"""
import re
import shutil
import subprocess
import sys
from collections import deque
from pathlib import Path
from urllib.parse import unquote, urlsplit

site = Path(sys.argv[1] if len(sys.argv) > 1 else '_site').resolve()
extensions = r'(?:html|css|js|png|jpe?g|svg|webp|jfif|mp4|glb|obj|woff2?|ttf|eot)'
literal = re.compile(
    rf'''["'`]([^"'`<>\n;{{}}=()]+?\.{extensions}(?:[?#][^"'`<>\n]*)?)["'`]''',
    re.IGNORECASE,
)
css_url = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''')
failures = []
checked = set()
visited = set()
directory_names = {}

def has_exact_case(target):
    """Windows is case-insensitive; GitHub Pages/Linux is not."""
    parent = site
    for part in target.relative_to(site).parts:
        if parent not in directory_names:
            directory_names[parent] = {child.name for child in parent.iterdir()}
        if part not in directory_names[parent]:
            return False
        parent /= part
    return True

for deck in ['RollyPoly', 'MSc_pres']:
    folder = site / deck
    if not (folder / 'index.html').is_file():
        failures.append(f'Missing presentation entry point: {deck}/index.html')
        continue
    pending = deque([folder / 'index.html'])
    if deck == 'RollyPoly':
        viewer = folder / 'Robot3D' / 'index.html'
        if viewer.is_file():
            pending.append(viewer)
        else:
            failures.append('Missing standalone 3D viewer: RollyPoly/Robot3D/index.html')
    while pending:
        file = pending.popleft()
        if file in visited or file.suffix not in ['.html', '.css', '.js']:
            continue
        visited.add(file)
        content = re.sub(r'<!--[\s\S]*?-->', '', file.read_text('utf-8'))
        # This is a postMessage source label, not a resource request.
        content = re.sub(r'source\s*:\s*["\'`]dodecahedron_fsm\.js["\'`]', '', content)
        urls = literal.findall(content)
        if file.suffix == '.css':
            urls += css_url.findall(content)
        # Loader strings in the bundles resolve relative to their document.
        base = folder if file.parent == folder / 'assets' and file.suffix == '.js' else file.parent
        if file.parent == folder / 'Robot3D' / 'threejs':
            base = folder / 'Robot3D'
        imports = set(re.findall(r'''(?:from\s*|import\s*)["']([^"']+)["']''', content))
        for url in urls:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or '${' in url or url.startswith('#'):
                continue
            # Import-map modules and external Draco decoder names are resolved
            # by the browser. The browser check verifies the actual requests.
            if url.startswith('three/') and url in imports:
                continue
            if url in ['draco_decoder.js', 'draco_wasm_wrapper.js'] and re.search(
                r'setDecoderPath\(["\'`]https://', content
            ):
                continue
            path = unquote(parsed.path)
            if not path or not re.search(rf'\.{extensions}$', path, re.IGNORECASE):
                continue
            relative_base = file.parent if url in imports else base
            target = site / path.lstrip('/') if path.startswith('/') else relative_base / path
            target = target.resolve()
            key = (str(file.relative_to(site)), url)
            if key in checked:
                continue
            checked.add(key)
            if not target.is_file():
                failures.append(f'{file.relative_to(site)}: missing {url}')
            elif not has_exact_case(target):
                failures.append(f'{file.relative_to(site)}: wrong filename case in {url}')
            else:
                pending.append(target)

for failure in failures:
    print(failure)
node = shutil.which('node')
scripts = sorted(file for file in visited if file.suffix == '.js')
if node:
    for script in scripts:
        result = subprocess.run([node, '--check', str(script)], capture_output=True, text=True)
        if result.returncode:
            failures.append(f'JavaScript syntax error: {script.relative_to(site)}')
            print(failures[-1])
            print(result.stderr)
    print(f'JavaScript syntax: {len(scripts)} files checked')
else:
    print('JavaScript syntax check skipped: install Node.js to enable it')
print(f'Presentation resources: {len(checked)} checked, {len(failures)} failures')
sys.exit(bool(failures))
