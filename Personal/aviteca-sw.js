const CACHE = 'aviteca-field-v1';
const OFFLINE_REVISION = 'camp-7';
const root = new URL('./', self.location.href);
const url = path => new URL(path, root).href;
const marker = url('./aviteca-offline-ready');
const core = [
    './aviteca.html', './aviteca.css?v=18', './aviteca-catalog.json?v=14',
    './aviteca-location.js?v=1', './aviteca-offline.js?v=1', './aviteca-compare.js?v=6', './aviteca-offline-assets.json',
    './aviteca-travel.js?v=4', './aviteca-world.json?v=1', './aviteca-outings.js?v=2',
    './aviteca-marca/telescopi.svg?v=3', './aviteca-marca/telescopi-180.png?v=3',
    './aviteca-marca/cataleg-alat.png', './aviteca-marca/inicial.woff2', './aviteca-marca/pit-roig.png',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js',
    'https://cdn.tailwindcss.com', 'https://unpkg.com/lucide@latest',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
].map(url);
const isAsset = target => target.origin === root.origin &&
    (target.pathname === url('./aviteca.html').slice(root.origin.length) ||
     /^aviteca(?:(?:-location|-compare|-offline|-travel|-outings)\.js|(?:-catalog|-offline-assets|-world)\.json|\.css)$/.test(target.pathname.slice(root.pathname.length)) ||
     /^aviteca-(?:marca|sprites|fotos)\//.test(target.pathname.slice(root.pathname.length)));
const isExternal = target =>
    (target.origin === 'https://www.gstatic.com' && target.pathname.startsWith('/firebasejs/11.6.1/')) ||
    target.origin === 'https://fonts.googleapis.com' || target.origin === 'https://fonts.gstatic.com' ||
    target.href === 'https://cdn.tailwindcss.com/' || target.href === 'https://unpkg.com/lucide@latest' ||
    target.href.startsWith('https://unpkg.com/leaflet@1.9.4/');
async function storeAsset(cache, address, visited = new Set()) {
    if (visited.has(address)) return;
    visited.add(address);
    let response = await cache.match(address);
    if (!response) {
        const classic = /^https:\/\/(?:cdn\.tailwindcss\.com|unpkg\.com)\//.test(address);
        response = await fetch(address, {cache:'reload', mode:classic ? 'no-cors' : 'cors'});
        if (!response.ok && response.type !== 'opaque') throw new Error('No s’ha pogut descarregar un recurs (' + new URL(address).pathname + '). Reintenta-ho amb cobertura.');
        await cache.put(address, response.clone());
    }
    // Cache imported Firebase modules and font files needed when reopening the app.
    if (address.startsWith('https://www.gstatic.com/firebasejs/11.6.1/')) {
        const body = await response.clone().text();
        const imports = [...body.matchAll(/from\s*["'](https:\/\/www\.gstatic\.com\/firebasejs\/11\.6\.1\/[^"']+\.js)["']/g)].map(m => m[1]);
        for (const dependency of imports) await storeAsset(cache, dependency, visited);
    }
}
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        for (const asset of core) { try { await storeAsset(cache, asset); } catch (error) { console.error('Aviteca: error preparant', asset, error); throw error; } }
        await self.skipWaiting();
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) if (key.startsWith('aviteca-field-') && key !== CACHE) await caches.delete(key);
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const target = new URL(event.request.url);
    if (!isAsset(target) && !isExternal(target)) return;
    const navigation = target.origin === root.origin && target.pathname === new URL('./aviteca.html', root).pathname;
    const key = navigation ? url('./aviteca.html') : event.request.url;
    const networkFirst = navigation || /aviteca(?:\.css|-catalog\.json|-location\.js|-compare\.js|-offline\.js|-offline-assets\.json)$/.test(target.pathname);
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(key);
        if (cached && !networkFirst) return cached;
        try {
            const controller = new AbortController();
            const timer = cached && networkFirst ? setTimeout(() => controller.abort(), 4000) : null;
            let response;
            try { response = await fetch(event.request, {signal:controller.signal}); }
            finally { clearTimeout(timer); }
            if (response.ok || response.type === 'opaque') await cache.put(key, response.clone()).catch(() => {});
            return response;
        } catch (error) {
            if (cached) return cached;
            throw error;
        }
    })());
});
let preparation;
self.addEventListener('message', event => {
    const port = event.ports[0];
    if (!port || !['STATUS','PREPARE'].includes(event.data?.type)) return;
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        if (event.data.type === 'STATUS') {
            const downloaded = await cache.match(marker);
            const status = await downloaded?.json().catch(() => null);
            port.postMessage({type:'STATUS', ready:status?.revision === OFFLINE_REVISION});
            return;
        }
        try {
            if (!preparation) {
                preparation = (async () => {
                    await cache.delete(marker);
                    const response = await fetch(url('./aviteca-offline-assets.json'), {cache:'reload'});
                    if (!response.ok && response.type !== 'opaque') throw new Error('No s’ha pogut carregar la llista de fitxes.');
                    const manifest = await response.json();
                    const assets = manifest.assets.map(url);
                    const visited = new Set();
                    let next = 0, done = 0;
                    async function download() {
                        while (next < assets.length) {
                            const address = assets[next++];
                            await storeAsset(cache, address, visited);
                            done++;
                            port.postMessage({type:'PROGRESS', done, total:assets.length});
                        }
                    }
                    await Promise.all(Array.from({length:6}, download));
                    // Fonts are optional. System fonts keep the app readable if the provider is unavailable.
                    try {
                        const styles = url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
                        await storeAsset(cache, styles);
                        const css = await (await cache.match(styles)).text();
                        for (const match of css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) await storeAsset(cache, match[1]);
                    } catch {}
                    await cache.put(marker, new Response(JSON.stringify({revision:manifest.revision, savedAt:new Date().toISOString()})));
                })().finally(() => { preparation = null; });
            }
            await preparation;
            port.postMessage({type:'DONE'});
        } catch (error) {
            port.postMessage({type:'ERROR', message:error.name === 'QuotaExceededError' ? 'No hi ha prou espai al dispositiu.' : error.message});
        }
    })());
});
