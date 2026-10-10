// Exercise the actual production output in Edge/Chrome using Node 22+.
// No URL rewriting or npm dependencies are used.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile, mkdtemp, readdir } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(process.argv[2] || '_site');
const output = resolve('.test-results/browser');
await mkdir(output, { recursive: true });
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) throw Error('Outside site');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const bytes = await readFile(file);
    const headers = { 'Content-Type': mime[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end) { res.writeHead(416); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
        'Content-Length': end - start + 1 });
      res.end(bytes.subarray(start, end + 1));
    } else { res.writeHead(200, headers); res.end(bytes); }
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), 'mahdi-site-test-'));
const browserPath = process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let ws;
const results = [];
try {
  const browserUrl = await new Promise((res, rej) => {
    const timer = setTimeout(() => rej(Error('Browser startup timeout')), 20000);
    browser.stderr.on('data', b => {
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(b.toString());
      if (match) { clearTimeout(timer); res(match[1]); }
    });
    browser.on('error', error => { clearTimeout(timer); rej(error); });
  });
  ws = new WebSocket(browserUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let serial = 0;
  const pending = new Map(), events = [];
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) {
        pending.delete(message.id); clearTimeout(request.timer);
        message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
      }
    } else events.push(message);
  };
  function cdp(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++serial;
      const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timeout: ${method}`)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  async function run(path, label, width = 1440, height = 900, deck = false) {
    if (process.env.BROWSER_TEST_PORTFOLIO && (deck || path.includes('Robot3D'))) return;
    if (process.env.BROWSER_TEST_FILTER && !label.includes(process.env.BROWSER_TEST_FILTER)) return;
    console.log(`Checking ${label} ...`);
    const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => cdp(method, params, sessionId);
    const evaluate = async expression => {
      const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (value.exceptionDetails) throw Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text);
      return value.result.value;
    };
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await send('Emulation.setTouchEmulationEnabled', { enabled: width < 600 });
    const start = events.length;
    await send('Page.navigate', { url: base + path });
    await sleep(7000);
    const initial = await evaluate(`({title:document.title, hash:location.hash,
      frontMatter:document.body.innerText.startsWith('---'),
      sections:document.querySelectorAll('.reveal .slides section').length,
      ready:document.querySelector('.reveal')?.classList.contains('ready'),
      scrollMode:document.querySelector('.reveal')?.classList.contains('reveal-scroll'),
      width:innerWidth, scrollWidth:document.documentElement.scrollWidth,
      viewport:document.querySelector('meta[name=viewport]')?.content,
      slide:window.Reveal?.getIndices().h,
      theme:!!document.querySelector('#sidebar'),
      brokenImages:[...document.images].filter(i=>i.complete && !i.naturalWidth).map(i=>i.src),
      customLayout:!!document.querySelector('.site-header') && !!document.querySelector('.site-footer'),
      videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||v.src,error:v.error?.code,readyState:v.readyState})),
      canvases:[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height}))})`);
    const checks = [];
    const check = (name, passed) => checks.push({ name, passed: !!passed });
    check('HTML rendered', !initial.frontMatter);
    check('No horizontal overflow', initial.scrollWidth <= initial.width + 1);
    check('Browser zoom allowed', !/user-scalable=no|maximum-scale=1(?:\.0)?(?:,|$)/.test(initial.viewport || ''));
    check('Images load', !initial.brokenImages.length);
    if (!deck && !path.includes('Robot3D')) check('Custom portfolio layout renders', initial.customLayout && !initial.theme);
    if (!deck && !path.includes('Robot3D')) {
      await evaluate("document.querySelectorAll('img[loading=lazy]').forEach(img=>img.loading='eager')");
      await sleep(2500);
      check('All page images load', await evaluate('[...document.images].every(img=>img.complete && img.naturalWidth>0)'));
      if (path === '/') {
        check('Three featured research projects', await evaluate("document.querySelectorAll('.selected-research .research-card').length === 3"));
        check('Only owner images used', await evaluate("[...document.images].every(img => new URL(img.src).origin === location.origin && !img.src.includes('design-concepts'))"));
        check('Short homepage introduction', await evaluate("document.querySelector('.hero-intro').innerText.split(/\\s+/).length < 25"));
        await evaluate("document.querySelector('.selected-research').scrollIntoView()");
        await sleep(250);
        const gallery = await send('Page.captureScreenshot', { format: 'png' });
        await writeFile(join(output, label + '-gallery.png'), Buffer.from(gallery.data, 'base64'));
        await evaluate('scrollTo(0,0)');
      }
      if (width < 761) {
        check('Mobile menu initially collapsed', await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false' && getComputedStyle(document.querySelector('#primary-nav')).display === 'none'"));
        await evaluate("document.querySelector('.menu-toggle').click()");
        check('Mobile menu opens', await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true' && getComputedStyle(document.querySelector('#primary-nav')).display !== 'none'"));
        await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
        check('Escape closes menu', await evaluate("document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'false'"));
      }
      if (path === '/My-Projects/') {
        const total = await evaluate("document.querySelectorAll('.project-collection .research-card').length");
        check('Published project count matches listing', total > 0 && total === await evaluate("parseInt(document.querySelector('.project-count').textContent, 10)"));
        for (const field of ['Soft robotics', 'Biomedical systems', 'Control', 'Fabrication']) {
          await evaluate(`[...document.querySelectorAll('.filter-button')].find(button=>button.dataset.filter===${JSON.stringify(field)}).click()`);
          check('Filter ' + field, await evaluate(`[...document.querySelectorAll('.project-collection .research-card:not([hidden])')].every(card=>card.dataset.area===${JSON.stringify(field)}) && document.querySelectorAll('.project-collection .research-card:not([hidden])').length > 0`));
        }
        await evaluate("document.querySelector('[data-filter=All]').click()");
        check('All filter restores projects', await evaluate("document.querySelectorAll('.project-collection .research-card:not([hidden])').length") === total);
      }
    }
    if (deck) {
      check('Reveal initialized', initial.ready);
      check('All slides rendered', initial.sections === (path.includes('MSc_pres') ? 50 : 55));
      check('Mobile deep links preserved', initial.slide === 2 && !initial.scrollMode);
    }
    if (deck && initial.ready && initial.slide !== undefined) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
      await sleep(250);
      check('Keyboard navigation', (await evaluate('window.Reveal.getIndices().h')) !== initial.slide);
      const buttonBefore = await evaluate('window.Reveal.getIndices().h');
      await evaluate("document.querySelector('.top-nav button').click()");
      await sleep(250);
      check('Section navigation buttons', (await evaluate('window.Reveal.getIndices().h')) !== buttonBefore);
      const visited = [];
      let fragments = 0;
      for (let i = 0; i < initial.sections; i++) {
        if (i % 10 === 0 || process.env.BROWSER_TEST_VERBOSE) console.log(`${label}: slide ${i + 1}/${initial.sections}`);
        await evaluate(`window.Reveal.slide(${i})`);
        await sleep(120);
        visited.push(await evaluate('window.Reveal.getIndices().h'));
        const count = await evaluate("window.Reveal.getCurrentSlide().querySelectorAll('.fragment').length");
        for (let f = 0; f < count; f++) {
          await evaluate('window.Reveal.nextFragment()');
          await sleep(70);
          fragments++;
        }
      }
      check('Every slide reachable', visited.every((slide, index) => slide === index));
      check('Videos report no playback errors', await evaluate("[...document.querySelectorAll('video')].every(v=>!v.error)"));
      check('Hidden videos pause', await evaluate("[...document.querySelectorAll('video')].every(v=>v.paused || window.Reveal.getCurrentSlide().contains(v))"));
      check('Slide images load', await evaluate('[...document.images].every(img=>img.complete && img.naturalWidth>0)'));
      // A temporarily hidden geometry card must not keep queuing work after
      // navigation. This reproduces the retry storm seen in the original code.
      const geometry = await evaluate(`(() => {
        const slides=[...document.querySelectorAll('.reveal .slides > section')];
        return slides.findIndex(slide=>slide.querySelector('.poly-card-view'));
      })()`);
      if (geometry >= 0) {
        await evaluate(`(() => {
          const slide=document.querySelectorAll('.reveal .slides > section')[${geometry}];
          slide.querySelector('.poly-card-view').style.display='none';
          window.Reveal.slide(${geometry});
        })()`);
        await sleep(120);
        await evaluate(`window.Reveal.slide(${geometry + 1})`);
        await sleep(250);
        check('Hidden geometry retries stop', await evaluate(`(() => {
          const slide=document.querySelectorAll('.reveal .slides > section')[${geometry}];
          slide.querySelector('.poly-card-view').style.display='';
          return !slide.__polyhedraRetry;
        })()`));
      }
      initial.visitedSlides = visited.length;
      initial.visitedFragments = fragments;
      await evaluate('window.Reveal.slide(2)');
      await sleep(250);
      if (width < 600) {
        await evaluate('window.Reveal.slide(3)');
        const before = await evaluate('window.Reveal.getIndices().h');
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 70, y: 450 }] });
        await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 310, y: 450 }] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(300);
        check('Touch navigation', (await evaluate('window.Reveal.getIndices().h')) !== before);
        await evaluate('window.Reveal.slide(2)');
      }
    }
    await sleep(1500);
    const relevant = events.slice(start).filter(event => event.sessionId === sessionId);
    const responses = relevant.filter(event => event.method === 'Network.responseReceived').map(event => event.params.response);
    const httpErrors = responses.filter(response => response.status >= 400).map(response => ({ url: response.url, status: response.status }));
    const exceptions = relevant.filter(event => event.method === 'Runtime.exceptionThrown').map(event => event.params.exceptionDetails.exception?.description || event.params.exceptionDetails.text);
    const failures = relevant.filter(event => event.method === 'Network.loadingFailed' && !event.params.canceled).map(event => ({ type: event.params.type, error: event.params.errorText }));
    const consoleErrors = relevant.filter(event => event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error').map(event => event.params.args.map(arg => arg.value || arg.description).join(' '));
    check('No HTTP errors', !httpErrors.length);
    check('No JavaScript exceptions', !exceptions.length);
    check('No failed network requests', !failures.length);
    check('No console errors', !consoleErrors.length);
    if (deck || path.includes('Robot3D')) {
      check('3D model downloads', responses.some(response => /\.glb(?:$|\?)/.test(response.url) && response.status === 200));
      check('3D canvas exists', initial.canvases.some(canvas => canvas.width > 0 && canvas.height > 0));
    }
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(output, label + '.png'), Buffer.from(shot.data, 'base64'));
    const result = { label, initial, checks, httpErrors, exceptions, failures, consoleErrors };
    results.push(result);
    await writeFile(join(output, label + '.json'), JSON.stringify(result, null, 2));
    console.log(`${label}: ${checks.filter(check => check.passed).length}/${checks.length} checks passed`);
    if (checks.some(check => !check.passed)) console.log(JSON.stringify(result, null, 2));
    await cdp('Target.closeTarget', { targetId });
  }
  await run('/', 'home-desktop');
  await run('/', 'home-mobile', 390, 844);
  await run('/', 'home-small-phone', 320, 740);
  await run('/', 'home-tablet', 768, 1024);
  await run('/My-Projects/', 'projects-desktop');
  await run('/My-Projects/', 'projects-mobile', 390, 844);
  await run('/posts/MSc/', 'masters-project');
  if (process.env.BROWSER_TEST_ALL_PROJECTS) {
    for (const slug of await readdir(join(root, 'posts'))) {
      await run('/posts/' + slug + '/', 'project-' + slug + '-mobile', 390, 844);
    }
  }
  for (const deck of ['RollyPoly', 'MSc_pres']) {
    await run(`/${deck}/#/2`, deck + '-desktop', 1440, 900, true);
    await run(`/${deck}/#/2`, deck + '-mobile', 390, 844, true);
  }
  await run('/RollyPoly/Robot3D/', 'robot-viewer');
  for (const path of ['Biography', 'Publications', 'Contact-Info', 'Teams', 'Sunshine']) {
    await run(`/${path}/`, `tabs-${path}-mobile`, 390, 844);
  }
  await run('/about/', 'about-desktop');
  await run('/about/', 'about-mobile', 390, 844);
  const report = process.env.BROWSER_TEST_FILTER
    ? `results-${process.env.BROWSER_TEST_FILTER.replace(/[^\w-]/g, '')}.json` : 'results.json';
  await writeFile(join(output, report), JSON.stringify(results, null, 2));
  const failed = results.flatMap(result => result.checks.filter(check => !check.passed));
  console.log(`Browser checks: ${results.length} pages, ${failed.length} failures. Artifacts: ${output}`);
  process.exitCode = failed.length ? 1 : 0;
  await cdp('Browser.close').catch(() => {});
} finally {
  ws?.close(); server.closeAllConnections(); server.close(); browser.kill();
}
