import { importCatalog, exportCatalog } from './catalog.mjs';

export const PUBLICATION_CONFIG = Object.freeze({
  owner: 'MarcPCasals', repo: 'MarcBook', branch: 'main', path: 'marcbook-catalog.json',
  apiUrl: 'https://api.github.com/repos/MarcPCasals/MarcBook/contents/marcbook-catalog.json',
  publicUrl: 'https://marcpcasals.github.io/MarcBook/marcbook-catalog.json',
});

export class PublishingError extends Error {
  constructor(code, message) { super(message); this.name = 'PublishingError'; this.code = code; }
}

const failure = (code, message) => new PublishingError(code, message);
const UNKNOWN = 'GitHub pot haver rebut el canvi, però no hem pogut confirmar-lo. Comprova el catàleg de GitHub abans de tornar a publicar; els canvis locals es conserven.';
const MAX_CONTENT_BYTES = 1000000;
const validSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/i.test(value);

function normalizeCatalog(value) {
  try {
    const content = typeof value === 'string' ? value : Array.isArray(value) ? exportCatalog(value) : JSON.stringify(value);
    if (typeof content !== 'string' || new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) throw new Error();
    const resources = importCatalog(content);
    const normalizedCatalog = exportCatalog(resources);
    if (new TextEncoder().encode(normalizedCatalog).length > MAX_CONTENT_BYTES) throw new Error();
    return { resources, content, normalizedCatalog };
  } catch { throw failure('INVALID_CATALOG', 'El catàleg no és vàlid o supera el límit d’1 MB. Revisa les fitxes abans de publicar.'); }
}

function runtimeToken(token, required = false) {
  if (token == null || token === '') {
    if (required) throw failure('INVALID_TOKEN', 'Introdueix la clau de publicació de GitHub.');
    return '';
  }
  if (typeof token !== 'string' || !/^[\x21-\x7e]{1,1000}$/.test(token.trim())) {
    throw failure('INVALID_TOKEN', 'La clau de publicació no té un format vàlid.');
  }
  return token.trim();
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}

function base64ToUtf8(value) {
  try {
    if (typeof value !== 'string' || value.length > MAX_CONTENT_BYTES * 1.5) throw new Error();
    const binary = atob(value.replace(/\s/g, ''));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
  } catch { throw failure('INVALID_RESPONSE', 'GitHub ha retornat un fitxer que no podem llegir. No s’ha publicat cap canvi.'); }
}

function httpFailure(status, write) {
  if (status === 401) return failure('INVALID_TOKEN', 'GitHub no reconeix la clau o ha caducat. Els canvis locals es conserven.');
  if (status === 403) return failure('ACCESS_DENIED', 'GitHub ha denegat l’accés. Revisa que la clau permeti editar els continguts de MarcBook. Els canvis locals es conserven.');
  if (status === 404) return failure('NOT_FOUND', 'No podem accedir al catàleg de GitHub. Comprova els permisos de MarcBook.');
  if (status === 409) return failure('CONFLICT', 'El catàleg ha canviat a GitHub. No s’ha sobreescrit: revisa la versió nova abans de publicar.');
  if (status === 422) return failure('REJECTED', 'GitHub ha rebutjat el canvi. Revisa els permisos i la configuració de publicació. Els canvis locals es conserven.');
  if (status === 429) return failure('RATE_LIMIT', 'GitHub demana esperar abans de tornar a provar. Els canvis locals es conserven.');
  return failure(write ? 'UNKNOWN_OUTCOME' : 'NETWORK', write ? UNKNOWN : 'No podem contactar amb GitHub ara mateix. Els canvis locals es conserven.');
}

async function request(url, { fetchImpl = globalThis.fetch, signal, timeoutMs = 15000, token = '', method = 'GET', body, responseType = 'json', api = true } = {}) {
  const write = method === 'PUT';
  if (typeof fetchImpl !== 'function') throw failure('NETWORK', 'Aquest navegador no pot connectar amb la publicació.');
  if (signal?.aborted) throw failure('CANCELLED', 'L’operació s’ha cancel·lat. Els canvis locals es conserven.');
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const wait = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs, 60000) : 15000;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, wait);
  try {
    const headers = api ? { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } : { Accept: 'application/json' };
    if (api && token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetchImpl(url, {
      method, headers, ...(body ? { body } : {}), signal: controller.signal,
      credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', cache: 'no-store',
    });
    if (!response.ok) throw httpFailure(response.status, write);
    return responseType === 'text' ? await response.text() : await response.json();
  } catch (error) {
    if (error instanceof PublishingError) throw error;
    // Never retry a PUT or expose a browser/server error that could contain a credential.
    if (write) throw failure('UNKNOWN_OUTCOME', UNKNOWN);
    if (timedOut) throw failure('TIMEOUT', 'La connexió ha trigat massa. Els canvis locals es conserven.');
    if (controller.signal.aborted) throw failure('CANCELLED', 'L’operació s’ha cancel·lat. Els canvis locals es conserven.');
    throw failure('NETWORK', api ? 'No podem contactar amb GitHub. Els canvis locals es conserven.' : 'No podem carregar el catàleg publicat ara mateix.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export async function readRepositoryCatalog({ token, fetchImpl, signal, timeoutMs } = {}) {
  const data = await request(`${PUBLICATION_CONFIG.apiUrl}?ref=${PUBLICATION_CONFIG.branch}`, {
    token: runtimeToken(token), fetchImpl, signal, timeoutMs,
  });
  if (data?.type !== 'file' || data.encoding !== 'base64' || !validSha(data.sha)) {
    throw failure('INVALID_RESPONSE', 'GitHub ha retornat una resposta que no podem validar. No s’ha publicat cap canvi.');
  }
  return { ...normalizeCatalog(base64ToUtf8(data.content)), sha: data.sha };
}

export async function publishCatalog({ resources, expectedBaseCatalog, token, fetchImpl, signal, timeoutMs } = {}) {
  if (expectedBaseCatalog == null) throw failure('MISSING_BASE', 'No coneixem la versió de partida d’aquests canvis. Revisa el catàleg publicat abans de publicar.');
  const expected = normalizeCatalog(expectedBaseCatalog);
  const next = normalizeCatalog(resources);
  const key = runtimeToken(token, true);
  const remote = await readRepositoryCatalog({ token: key, fetchImpl, signal, timeoutMs });
  if (remote.normalizedCatalog !== expected.normalizedCatalog) {
    throw failure('CONFLICT', 'El catàleg ha canviat a GitHub des que vas començar a editar. No s’ha sobreescrit: exporta els teus canvis i revisa la versió nova.');
  }
  const result = await request(PUBLICATION_CONFIG.apiUrl, {
    token: key, fetchImpl, signal, timeoutMs, method: 'PUT',
    body: JSON.stringify({
      message: 'Actualitza el catàleg de MarcBook', content: utf8ToBase64(next.normalizedCatalog),
      branch: PUBLICATION_CONFIG.branch, sha: remote.sha,
    }),
  });
  if (!validSha(result?.content?.sha) || !validSha(result?.commit?.sha)) {
    throw failure('UNKNOWN_OUTCOME', UNKNOWN);
  }
  return {
    resources: next.resources, normalizedCatalog: next.normalizedCatalog, sha: result.content.sha,
    commit: { sha: result.commit.sha, url: `https://github.com/${PUBLICATION_CONFIG.owner}/${PUBLICATION_CONFIG.repo}/commit/${result.commit.sha}` },
  };
}

export async function readPublicCatalog({ url = PUBLICATION_CONFIG.publicUrl, fetchImpl, signal, timeoutMs } = {}) {
  let target;
  try {
    target = new URL(url, globalThis.location?.href || PUBLICATION_CONFIG.publicUrl);
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.origin === 'https://api.github.com') throw new Error();
  } catch { throw failure('INVALID_PUBLIC_URL', 'L’adreça del catàleg publicat no és vàlida.'); }
  const content = await request(target.href, { fetchImpl, signal, timeoutMs, responseType: 'text', api: false });
  return normalizeCatalog(content);
}
