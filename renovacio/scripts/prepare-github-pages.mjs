import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importCatalog } from '../src/catalog.mjs';

const previewRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = 'marcbook-catalog.json';
const MANIFEST = '.marcbook-pages-manifest.json';
const hash = contents => createHash('sha256').update(contents).digest('hex');
const generatedPath = relative => /^(?:marcbook-assets\/[a-zA-Z0-9_.-]+\.(?:js|css)|assets\/[a-z0-9-]+\.(?:webp|png|jpg))$/.test(relative);

export function readCanonicalCatalog(filename) {
  const source = readFileSync(filename, 'utf8');
  const raw = JSON.parse(source);
  const resources = importCatalog(source);
  if (raw.resources.length !== resources.length) throw new Error('El catàleg publicat encara conté artefactes de PI.');
  return source;
}

function collectFiles(directory, prefix, filter) {
  if (!existsSync(directory)) throw new Error('Falta la carpeta compilada: ' + directory);
  return readdirSync(directory).filter(name => filter(name)).map(name => {
    const source = path.join(directory, name);
    if (!statSync(source).isFile()) throw new Error('El lliurable conté una entrada inesperada: ' + source);
    return { relative: `${prefix}/${name}`, source, contents: readFileSync(source) };
  });
}

// The compiled shell is the only root page replaced. Existing tools, PI and c2
// directories, legacy scripts and unrelated assets are never copied or removed.
export function prepareGitHubPages({ repositoryRoot = path.resolve(previewRoot, '..'), buildRoot = path.join(previewRoot, 'dist/client'), dryRun = false } = {}) {
  const canonicalFile = path.join(repositoryRoot, CATALOG);
  const canonical = readCanonicalCatalog(canonicalFile);
  const builtCanonical = readCanonicalCatalog(path.join(buildRoot, CATALOG));
  if (canonical !== builtCanonical) throw new Error('El catàleg compilat està desactualitzat. Torna a executar npm run build.');
  const indexSource = path.join(buildRoot, 'index.html');
  const indexContents = readFileSync(indexSource);
  if (!indexContents.toString().includes('marcbook-assets/')) throw new Error('La portada compilada no fa servir marcbook-assets/.');
  const files = [
    ...collectFiles(path.join(buildRoot, 'marcbook-assets'), 'marcbook-assets', name => /^[a-zA-Z0-9_.-]+\.(?:js|css)$/.test(name)),
    ...collectFiles(path.join(buildRoot, 'assets'), 'assets', name => /^[a-z0-9-]+\.(?:webp|png|jpg)$/.test(name)),
  ];
  if (!files.some(file => file.relative.endsWith('.js')) || !files.some(file => file.relative.endsWith('.css'))) throw new Error('La compilació necessita els fitxers JavaScript i CSS.');
  const manifestPath = path.join(repositoryRoot, MANIFEST);
  let previous = { files: {} };
  if (existsSync(manifestPath)) {
    previous = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (previous.version !== 1 || !previous.files || typeof previous.files !== 'object') throw new Error('El registre de fitxers publicats no és vàlid.');
  }
  const indexTarget = path.join(repositoryRoot, 'index.html');
  if (previous.indexHash && existsSync(indexTarget) && hash(readFileSync(indexTarget)) !== previous.indexHash) throw new Error('La portada publicada s’ha modificat fora del preparador; cal revisar-la abans de substituir-la.');
  for (const file of files) {
    if (!generatedPath(file.relative)) throw new Error('No es pot publicar aquest fitxer: ' + file.relative);
    const target = path.join(repositoryRoot, file.relative);
    if (!existsSync(target)) continue;
    const currentHash = hash(readFileSync(target));
    if (currentHash !== hash(file.contents) && currentHash !== previous.files[file.relative]) throw new Error('No se sobreescriu un fitxer anterior o modificat: ' + file.relative);
  }
  const backupTarget = path.join(repositoryRoot, 'index-anterior.html');
  const createBackup = existsSync(indexTarget) && !existsSync(backupTarget) && !previous.indexHash;
  if (createBackup && readFileSync(indexTarget, 'utf8').includes('marcbook-assets/')) throw new Error('Falta la còpia de la portada antiga; no es pot crear a partir de la portada renovada.');
  const manifest = {
    version: 1,
    indexHash: hash(indexContents),
    // Preserve ownership records so repeated releases can update their assets.
    files: { ...previous.files, ...Object.fromEntries(files.map(file => [file.relative, hash(file.contents)])) },
  };
  if (!dryRun) {
    // Finish all checks before the first mutation.
    if (createBackup) copyFileSync(indexTarget, backupTarget);
    for (const file of files) {
      const target = path.join(repositoryRoot, file.relative);
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(file.source, target);
    }
    copyFileSync(indexSource, indexTarget);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  }
  return { dryRun, files: ['index.html', ...files.map(file => file.relative), MANIFEST], catalog: CATALOG, createBackup };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = prepareGitHubPages({ dryRun: process.argv.includes('--dry-run') });
    console.log(`${result.dryRun ? 'Comprovat' : 'Preparat'} GitHub Pages: ${result.files.length} fitxers; catàleg canònic validat i conservat.${result.createBackup ? ' Còpia antiga: index-anterior.html.' : ''}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
