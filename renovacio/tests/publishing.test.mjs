import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLICATION_CONFIG, PublishingError, publishCatalog, readRepositoryCatalog, readPublicCatalog } from '../src/publishing.mjs';
import { exportCatalog } from '../src/catalog.mjs';

const TOKEN = 'github_pat_test_runtime_only';
const OLD_SHA = 'a'.repeat(40), NEW_SHA = 'b'.repeat(40), COMMIT_SHA = 'c'.repeat(40);
const original = [{
  id: 'quimilab', title: 'QuimiLab', description: 'Explora la química.', subject: 'science', course: '4t',
  unit: '4.4', topic: 'Química', kind: 'Simulació', status: 'ready', languages: ['Català'],
  links: [{ label: 'Català', url: 'https://marcpcasals.github.io/MarcBook/CFN/quimilab.html' }],
  image: 'assets/resource-chemistry.webp', detail: 'Molècules i reaccions.', objectives: ['Observa i explica.'],
  steps: [], evidence: [], materials: [], tags: 'química', visible: true, order: 1,
}];
const changed = [{ ...original[0], title: 'Química: àtoms, molècules i acció 🧪', description: 'L’alumnat observa i aprèn.', teachingValue:'Relaciona fórmules i observacions per construir una explicació pròpia.' }];
const repositoryResponse = resources => new Response(JSON.stringify({ type: 'file', encoding: 'base64', sha: OLD_SHA, content: Buffer.from(exportCatalog(resources), 'utf8').toString('base64') }), { status: 200 });
const successResponse = () => new Response(JSON.stringify({ content: { sha: NEW_SHA }, commit: { sha: COMMIT_SHA, html_url: 'https://untrusted.example/' } }), { status: 200 });
const rejectsCode = code => error => error instanceof PublishingError && error.code === code && !error.message.includes(TOKEN);

test('Publishes one canonical file after checking the original catalog; preserves Unicode and hides the key', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return calls.length === 1 ? repositoryResponse(original) : successResponse(); };
  const result = await publishCatalog({ resources: changed, expectedBaseCatalog: exportCatalog(original), token: TOKEN, fetchImpl });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${PUBLICATION_CONFIG.apiUrl}?ref=main`);
  assert.equal(calls[1].url, PUBLICATION_CONFIG.apiUrl);
  for (const call of calls) {
    assert.equal(call.init.credentials, 'omit'); assert.equal(call.init.redirect, 'error');
    assert.equal(call.init.referrerPolicy, 'no-referrer'); assert.equal(call.init.headers.Authorization, `Bearer ${TOKEN}`);
    assert.equal(call.url.includes(TOKEN), false);
  }
  const body = JSON.parse(calls[1].init.body);
  assert.equal(body.branch, 'main'); assert.equal(body.sha, OLD_SHA);
  const decoded = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
  assert.equal(decoded.resources[0].title, changed[0].title);
  assert.equal(decoded.resources[0].teachingValue, changed[0].teachingValue);
  assert.equal(body.content.includes(TOKEN), false);
  assert.equal(result.resources[0].description, changed[0].description);
  assert.equal(result.resources[0].teachingValue, changed[0].teachingValue);
  assert.equal(result.commit.url, `https://github.com/MarcPCasals/MarcBook/commit/${COMMIT_SHA}`);
  assert.equal(JSON.stringify(result).includes(TOKEN), false);
});

test('A recovered old draft cannot overwrite a newer remote catalog', async () => {
  let calls = 0;
  const remote = [{ ...original[0], description: 'Canvi d’un altre dispositiu que cal conservar.' }];
  await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: TOKEN, fetchImpl: async (_, init) => { calls++; assert.equal(init.method, 'GET'); return repositoryResponse(remote); } }), rejectsCode('CONFLICT'));
  assert.equal(calls, 1);
});

test('Missing baselines, invalid content and invalid credentials cause no request', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; throw new Error('Must not request'); };
  await assert.rejects(publishCatalog({ resources: changed, token: TOKEN, fetchImpl }), rejectsCode('MISSING_BASE'));
  await assert.rejects(publishCatalog({ resources: [{ ...changed[0], links: [{ label: 'X', url: 'javascript:alert(1)' }] }], expectedBaseCatalog: original, token: TOKEN, fetchImpl }), rejectsCode('INVALID_CATALOG'));
  await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: '', fetchImpl }), rejectsCode('INVALID_TOKEN'));
  await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: `${TOKEN}\nInjected`, fetchImpl }), rejectsCode('INVALID_TOKEN'));
  assert.equal(calls, 0);
});

test('GitHub denials use safe Catalan messages and never read raw error details', async () => {
  for (const [status, code] of [[401, 'INVALID_TOKEN'], [403, 'ACCESS_DENIED'], [409, 'CONFLICT'], [422, 'REJECTED']]) {
    let calls = 0;
    await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: TOKEN, fetchImpl: async () => { calls++; return calls === 1 ? repositoryResponse(original) : new Response(JSON.stringify({ message: TOKEN }), { status }); } }), rejectsCode(code));
    assert.equal(calls, 2);
  }
  let calls = 0;
  await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: TOKEN, fetchImpl: async () => { calls++; return new Response(TOKEN, { status: 403 }); } }), rejectsCode('ACCESS_DENIED'));
  assert.equal(calls, 1);
});

test('An unknown PUT outcome is never retried automatically', async () => {
  for (const lastResponse of [() => { throw new Error(`Network failed with ${TOKEN}`); }, () => new Response(TOKEN, { status: 502 }), () => new Response('{broken', { status: 200 })]) {
    let calls = 0;
    await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: TOKEN, fetchImpl: async () => { calls++; return calls === 1 ? repositoryResponse(original) : lastResponse(); } }), rejectsCode('UNKNOWN_OUTCOME'));
    assert.equal(calls, 2);
  }
});

test('Runtime keys are optional for reads and absent from public Pages requests', async () => {
  const remote = await readRepositoryCatalog({ fetchImpl: async (_, init) => { assert.equal(Object.hasOwn(init.headers, 'Authorization'), false); return repositoryResponse(original); } });
  assert.equal(remote.sha, OLD_SHA);
  const publicCatalog = await readPublicCatalog({ url: `${PUBLICATION_CONFIG.publicUrl}?revision=${COMMIT_SHA}`, fetchImpl: async (url, init) => { assert.equal(new URL(url).hostname, 'marcpcasals.github.io'); assert.equal(Object.hasOwn(init.headers, 'Authorization'), false); assert.equal(init.credentials, 'omit'); return new Response(exportCatalog(changed)); } });
  assert.equal(publicCatalog.resources[0].title, changed[0].title);
  await assert.rejects(readPublicCatalog({ url: PUBLICATION_CONFIG.apiUrl, fetchImpl: async () => { throw new Error('No API request'); } }), rejectsCode('INVALID_PUBLIC_URL'));
  await assert.rejects(readPublicCatalog({ url: 'https://person:secret@example.com/file.json' }), rejectsCode('INVALID_PUBLIC_URL'));
});

test('Public catalog validation excludes PI and rejects malformed wrappers', async () => {
  const pi = { ...original[0], id: 'planificador-de-pi', subject: 'pi' };
  const result = await readPublicCatalog({ fetchImpl: async () => new Response(JSON.stringify({ schemaVersion: 1, resources: [...original, pi] })) });
  assert.deepEqual(result.resources.map(resource => resource.id), ['quimilab']);
  await assert.rejects(readPublicCatalog({ fetchImpl: async () => new Response(JSON.stringify({ resources: original })) }), rejectsCode('INVALID_CATALOG'));
});

test('Cancellation and timeout stop reads; a timeout during PUT remains uncertain', async () => {
  const cancelled = new AbortController(); cancelled.abort();
  await assert.rejects(readRepositoryCatalog({ signal: cancelled.signal, fetchImpl: async () => { throw new Error('No request'); } }), rejectsCode('CANCELLED'));
  const pending = (_, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error(TOKEN)), { once: true }));
  await assert.rejects(readRepositoryCatalog({ fetchImpl: pending, timeoutMs: 5 }), rejectsCode('TIMEOUT'));
  let calls = 0;
  await assert.rejects(publishCatalog({ resources: changed, expectedBaseCatalog: original, token: TOKEN, timeoutMs: 5, fetchImpl: (url, init) => { calls++; return calls === 1 ? Promise.resolve(repositoryResponse(original)) : pending(url, init); } }), rejectsCode('UNKNOWN_OUTCOME'));
  assert.equal(calls, 2);
});
