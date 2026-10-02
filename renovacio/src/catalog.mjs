export const STORAGE_KEY = 'marcbook-content-v1';
export const SUBJECTS = { science: 'Ciències físiques i de la natura', teacher: 'Eines docents', other: 'Altres recursos', personal: 'Personal' };
const PI_IDS = new Set(['avaluador-de-pi', 'planificador-de-pi', 'metacognicio-final-de-pi']);
export const isPIResource = resource => resource?.subject === 'pi' || resource?.category === 'projectes'
  || PI_IDS.has(resource?.id) || (Array.isArray(resource?.links) && resource.links.some(link => {
    try { return /\/PI\//i.test(new URL(link.url).pathname); } catch { return false; }
  }));
export const KINDS = ['Activitat', 'Simulació', 'Joc', 'Guia', 'Lectura', 'Eina'];
export const LANGUAGES = ['Català', 'Castellà', 'Francès', 'Anglès'];
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const slugify = value => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'recurs';
export const asset = path => `${import.meta.env?.BASE_URL || '/'}${path}`;
export function filterResources(resources, filters = {}) {
  const words = normalize(filters.q).split(/\s+/).filter(Boolean);
  return resources.filter(r => !isPIResource(r) && r.visible !== false && r.subject !== 'personal'
    && (!filters.subject || r.subject === filters.subject)
    && (!filters.course || r.course === filters.course)
    && (!filters.unit || r.unit === filters.unit)
    && (!filters.language || r.languages.includes(filters.language))
    && (!filters.kind || r.kind === filters.kind)
    && (!filters.topic || r.topic === filters.topic)
    && (!filters.status || r.status === filters.status)
    && words.every(word => normalize([r.title, r.description, r.detail, r.tags, r.topic, r.unit, r.course, ...r.languages].join(' ')).includes(word))).sort((a,b)=>(a.order || 0)-(b.order || 0));
}
export function validLink(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password; }
  catch { return false; }
}
export function validImage(value) { return /^assets\/[a-z0-9-]+\.(png|webp|jpg)$/.test(value) || validLink(value); }
const text = (value, max = 10000) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const lines = value => Array.isArray(value) ? value.map(v => text(v, 2000)).filter(Boolean).slice(0, 30) : [];
export function validateResource(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Cada recurs ha de ser una fitxa.');
  if (isPIResource(raw)) throw new Error('Els artefactes de PI no formen part d’aquest catàleg.');
  const title = text(raw.title, 160), id = text(raw.id, 180), description = text(raw.description, 600);
  if (!title || !description) throw new Error('El títol i el resum són obligatoris.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('L’identificador només pot contenir lletres minúscules, nombres i guions.');
  if (!Object.hasOwn(SUBJECTS, raw.subject)) throw new Error('Tria un àmbit vàlid.');
  if (!['ready', 'soon'].includes(raw.status)) throw new Error('L’estat del recurs no és vàlid.');
  if (!KINDS.includes(raw.kind)) throw new Error('Tria un tipus de recurs vàlid.');
  const links = Array.isArray(raw.links) ? raw.links.map(l => ({ label: text(l?.label, 100), url: text(l?.url, 2000) })).filter(l => l.label || l.url) : [];
  if (links.length > 12 || links.some(l => !l.label || !validLink(l.url))) throw new Error('Cada accés necessita un nom i una adreça web completa (https://…).');
  if (raw.status === 'ready' && !links.length) throw new Error('Un recurs disponible necessita almenys un accés.');
  if (!validImage(raw.image)) throw new Error('Tria una il·lustració o introdueix una adreça d’imatge vàlida.');
  const languages = lines(raw.languages);
  if (languages.some(l => !LANGUAGES.includes(l))) throw new Error('Hi ha una llengua que no és vàlida.');
  if (raw.status === 'ready' && !languages.length) throw new Error('Indica la llengua del recurs.');
  if (raw.course && !['1r','2n','3r','4t'].includes(raw.course)) throw new Error('El curs no és vàlid.');
  return { id, title, description, subject: raw.subject, course: text(raw.course, 10), unit: text(raw.unit, 30),
    topic: text(raw.topic, 100), kind: raw.kind, status: raw.status, languages: [...new Set(languages)], links,
    image: raw.image, detail: text(raw.detail), objectives: lines(raw.objectives), steps: lines(raw.steps),
    evidence: lines(raw.evidence), materials: lines(raw.materials), tags: text(raw.tags, 600), badge: text(raw.badge, 80),
    visible: raw.visible !== false, order: Number.isFinite(raw.order) ? raw.order : 999 };
}
export function importCatalog(content) {
  let data; try { data = JSON.parse(content); } catch { throw new Error('El fitxer no és un JSON vàlid.'); }
  if (!data || typeof data !== 'object' || data.schemaVersion !== 1 || !Array.isArray(data.resources)) throw new Error('Cal un catàleg MarcBook exportat amb la versió 1.');
  if (!data.resources.length || data.resources.length > 500) throw new Error('El catàleg ha de contenir entre 1 i 500 recursos.');
  // Older local drafts and backups may include PI. Keep their other edits.
  const resources = data.resources.filter(r => !isPIResource(r)).map(validateResource);
  if (!resources.length) throw new Error('Aquest fitxer no conté cap recurs dels àmbits de MarcBook.');
  if (new Set(resources.map(r => r.id)).size !== resources.length) throw new Error('Hi ha identificadors duplicats. La importació no s’ha aplicat.');
  return resources;
}
export const exportCatalog = resources => JSON.stringify({ schemaVersion: 1, resources: resources.filter(r => !isPIResource(r)) }, null, 2);
export function uniqueId(title, resources) {
  const base = slugify(title); let id = base, i = 2;
  while (resources.some(r => r.id === id)) id = `${base}-${i++}`;
  return id;
}
export function parseRoute(hash) {
  const [path, query = ''] = (hash || '#/inici').replace(/^#\/?/, '').split('?');
  const [page = 'inici', id] = path.split('/');
  return { page, id, filters: Object.fromEntries(new URLSearchParams(query)) };
}
export function route(page, filters = {}) {
  const params = new URLSearchParams(Object.entries(filters).filter(([,value]) => value));
  return `#/${page}${params.size ? `?${params}` : ''}`;
}
