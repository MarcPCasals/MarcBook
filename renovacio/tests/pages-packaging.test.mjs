import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareGitHubPages } from '../scripts/prepare-github-pages.mjs';

const source = JSON.parse(readFileSync(new URL('../../marcbook-catalog.json', import.meta.url), 'utf8'));
const canonical = JSON.stringify({ schemaVersion: 1, resources: [source.resources[0]] }, null, 2) + '\n';
function fixture(t) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'marcbook-pages-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const repositoryRoot = path.join(directory, 'repository');
  const buildRoot = path.join(directory, 'build');
  const put = (root, relative, content) => {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  };
  put(repositoryRoot, 'index.html', '<html>Portada antiga<script src="marcbook-admin.js"></script></html>');
  put(repositoryRoot, 'marcbook-admin.js', '/* editor anterior */');
  put(repositoryRoot, 'marcbook-admin.css', '/* estils anteriors */');
  put(repositoryRoot, 'PI/planificador-pi.html', 'PI original');
  put(repositoryRoot, 'c2/esborrany.html', 'Feina independent');
  put(repositoryRoot, 'assets/imatge-anterior.png', 'Imatge anterior');
  put(repositoryRoot, 'marcbook-catalog.json', canonical);
  put(buildRoot, 'marcbook-catalog.json', canonical);
  put(buildRoot, 'index.html', '<html><script src="./marcbook-assets/index-new.js"></script><link href="./marcbook-assets/index-new.css"></html>');
  put(buildRoot, 'marcbook-assets/index-new.js', '/* nova aplicació */');
  put(buildRoot, 'marcbook-assets/index-new.css', '/* nous estils */');
  put(buildRoot, 'assets/hero-marc.webp', 'Il·lustració');
  put(buildRoot, 'src/secret.jsx', 'No publicable');
  put(buildRoot, 'qa/screenshot.jpg', 'No publicable');
  put(buildRoot, 'marcbook-assets/index-new.js.map', 'No publicable');
  return { repositoryRoot, buildRoot, put, options: { repositoryRoot, buildRoot } };
}

test('Packages the compiled shell while preserving all legacy tools, editor and unrelated work', t => {
  const f = fixture(t);
  const oldIndex = readFileSync(path.join(f.repositoryRoot, 'index.html'), 'utf8');
  const result = prepareGitHubPages(f.options);
  assert.equal(result.createBackup, true);
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'index-anterior.html'), 'utf8'), oldIndex);
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'index.html'), 'utf8'), readFileSync(path.join(f.buildRoot, 'index.html'), 'utf8'));
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'marcbook-catalog.json'), 'utf8'), canonical);
  for (const [file, content] of [['PI/planificador-pi.html', 'PI original'], ['c2/esborrany.html', 'Feina independent'], ['assets/imatge-anterior.png', 'Imatge anterior'], ['marcbook-admin.js', '/* editor anterior */'], ['marcbook-admin.css', '/* estils anteriors */']]) {
    assert.equal(readFileSync(path.join(f.repositoryRoot, file), 'utf8'), content);
  }
  for (const file of ['src/secret.jsx', 'qa/screenshot.jpg', 'marcbook-assets/index-new.js.map']) assert.equal(existsSync(path.join(f.repositoryRoot, file)), false);
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'assets/hero-marc.webp'), 'utf8'), 'Il·lustració');
});

test('Dry run verifies the package without replacing the old page or creating files', t => {
  const f = fixture(t);
  const result = prepareGitHubPages({ ...f.options, dryRun: true });
  assert.equal(result.dryRun, true);
  assert.match(readFileSync(path.join(f.repositoryRoot, 'index.html'), 'utf8'), /Portada antiga/);
  for (const file of ['index-anterior.html', '.marcbook-pages-manifest.json', 'marcbook-assets/index-new.js', 'assets/hero-marc.webp']) assert.equal(existsSync(path.join(f.repositoryRoot, file)), false);
});

test('Stale or PI-containing compiled catalogs fail before any replacement', t => {
  const f = fixture(t);
  f.put(f.buildRoot, 'marcbook-catalog.json', JSON.stringify({ schemaVersion: 1, resources: [{ ...source.resources[0], description: 'Canvi pendent de compilar.' }] }));
  assert.throws(() => prepareGitHubPages(f.options), /desactualitzat/);
  f.put(f.buildRoot, 'marcbook-catalog.json', JSON.stringify({ schemaVersion: 1, resources: [source.resources[0], { ...source.resources[0], id: 'planificador-de-pi', subject: 'pi' }] }));
  assert.throws(() => prepareGitHubPages(f.options), /PI/);
  assert.match(readFileSync(path.join(f.repositoryRoot, 'index.html'), 'utf8'), /Portada antiga/);
  assert.equal(existsSync(path.join(f.repositoryRoot, 'index-anterior.html')), false);
});

test('An asset collision stops the complete package before touching an existing file', t => {
  const f = fixture(t);
  f.put(f.repositoryRoot, 'assets/hero-marc.webp', 'Fitxer anterior independent');
  assert.throws(() => prepareGitHubPages(f.options), /No se sobreescriu/);
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'assets/hero-marc.webp'), 'utf8'), 'Fitxer anterior independent');
  assert.match(readFileSync(path.join(f.repositoryRoot, 'index.html'), 'utf8'), /Portada antiga/);
  assert.equal(existsSync(path.join(f.repositoryRoot, 'index-anterior.html')), false);
});

test('Repeated packages update owned assets but retain the original page backup', t => {
  const f = fixture(t);
  prepareGitHubPages(f.options);
  const backup = readFileSync(path.join(f.repositoryRoot, 'index-anterior.html'), 'utf8');
  f.put(f.buildRoot, 'assets/hero-marc.webp', 'Il·lustració revisada');
  f.put(f.buildRoot, 'marcbook-assets/index-new.js', '/* aplicació revisada */');
  prepareGitHubPages(f.options);
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'assets/hero-marc.webp'), 'utf8'), 'Il·lustració revisada');
  assert.equal(readFileSync(path.join(f.repositoryRoot, 'index-anterior.html'), 'utf8'), backup);
  f.put(f.repositoryRoot, 'assets/hero-marc.webp', 'Modificació independent posterior');
  assert.throws(() => prepareGitHubPages(f.options), /No se sobreescriu/);
});
