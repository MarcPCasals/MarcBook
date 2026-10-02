import { importCatalog, exportCatalog, isPIResource } from './catalog.mjs';

export function readLocalDraft(content) {
  if (!content) return { resources: null, baseCatalog: null };
  const resources = importCatalog(content);
  const data = JSON.parse(content);
  let baseCatalog = null;
  if (typeof data.baseCatalog === 'string') {
    try { baseCatalog = exportCatalog(importCatalog(data.baseCatalog)); } catch { /* Keep the draft even when its old baseline is missing. */ }
  }
  return { resources, baseCatalog };
}

export function serializeLocalDraft(resources, baseCatalog) {
  const data = JSON.parse(exportCatalog(resources));
  data.baseCatalog = baseCatalog ? exportCatalog(importCatalog(baseCatalog)) : null;
  return JSON.stringify(data, null, 2);
}

export function readEditorDraft(content) {
  if (!content) return null;
  const data = JSON.parse(content);
  if (!data?.form || typeof data.form !== 'object' || !data.selected || isPIResource(data.form)) return null;
  let baseCatalog = null;
  if (typeof data.baseCatalog === 'string') {
    try { baseCatalog = exportCatalog(importCatalog(data.baseCatalog)); } catch { /* Require a review of older drafts with no known baseline. */ }
  }
  return { selected: data.selected, form: { ...data.form, teachingValue: typeof data.form.teachingValue === 'string' ? data.form.teachingValue : '' }, baseCatalog };
}

export function serializeEditorDraft(selected, form, baseCatalog) {
  return JSON.stringify({ selected, form, baseCatalog: baseCatalog ? exportCatalog(importCatalog(baseCatalog)) : null });
}

export function combineDraftBases(catalogBase, formBase) {
  // Separate tabs can create drafts of different ages. Neither baseline wins silently.
  return formBase !== undefined && formBase !== catalogBase ? null : catalogBase;
}

export function catalogChanges(before, after) {
  const old = new Map(importCatalog(exportCatalog(before)).map(r => [r.id, r]));
  const next = new Map(importCatalog(exportCatalog(after)).map(r => [r.id, r]));
  const changes = [];
  for (const [id, item] of next) {
    if (!old.has(id)) changes.push({ id, title: item.title, action: 'Afegir' });
    else if (JSON.stringify(old.get(id)) !== JSON.stringify(item)) changes.push({ id, title: item.title, action: item.visible === false && old.get(id).visible ? 'Ocultar' : 'Actualitzar' });
  }
  for (const [id, item] of old) if (!next.has(id)) changes.push({ id, title: item.title, action: 'Retirar' });
  return changes;
}
