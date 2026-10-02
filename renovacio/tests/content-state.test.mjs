import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exportCatalog, importCatalog } from '../src/catalog.mjs';
import { readLocalDraft, serializeLocalDraft, readEditorDraft, serializeEditorDraft, combineDraftBases, catalogChanges } from '../src/content-state.mjs';
import { publishCatalog } from '../src/publishing.mjs';

const catalog = importCatalog(fs.readFileSync(new URL('../../marcbook-catalog.json', import.meta.url), 'utf8'));

test('An edited draft retains its original publication baseline across reloads', () => {
  const baseline = exportCatalog(catalog);
  const edited = catalog.map((r,i) => i ? r : {...r, description:'Canvi pendent de publicar.'});
  const loaded = readLocalDraft(serializeLocalDraft(edited, baseline));
  assert.equal(loaded.baseCatalog, baseline);
  assert.equal(loaded.resources[0].description, edited[0].description);
  assert.deepEqual(catalogChanges(catalog, loaded.resources), [{id:catalog[0].id,title:catalog[0].title,action:'Actualitzar'}]);
});

test('Older drafts are preserved without silently claiming a known baseline', () => {
  const loaded = readLocalDraft(exportCatalog(catalog));
  assert.equal(loaded.baseCatalog, null);
  assert.deepEqual(loaded.resources, catalog);
  assert.equal(readLocalDraft(serializeLocalDraft(catalog, null)).baseCatalog, null);
  assert.equal(readLocalDraft(JSON.stringify({...JSON.parse(exportCatalog(catalog)),baseCatalog:'invalid'})).baseCatalog, null);
});

test('Educational value survives saved and unsaved drafts while older forms remain editable', () => {
  const baseline=exportCatalog(catalog);
  const form={...catalog[0],teachingValue:'Ajuda a connectar les observacions amb una explicació pròpia.'};
  const loaded=readLocalDraft(serializeLocalDraft([form,...catalog.slice(1)],baseline));
  assert.equal(loaded.resources[0].teachingValue,form.teachingValue);
  const recovered=readEditorDraft(serializeEditorDraft(form.id,form,baseline));
  assert.equal(recovered.form.teachingValue,form.teachingValue);
  const {teachingValue:_,...legacy}=form;
  assert.equal(readEditorDraft(JSON.stringify({selected:legacy.id,form:legacy})).form.teachingValue,'');
  assert.deepEqual(catalogChanges(catalog,loaded.resources),[{id:form.id,title:form.title,action:'Actualitzar'}]);
});

test('The publication review identifies additions, hidden cards and removals', () => {
  const next = [...catalog.slice(1).map((r,i)=>i ? r : {...r,visible:false}), {...catalog[0],id:'recurs-nou',title:'Nou recurs'}];
  const changes = catalogChanges(catalog,next);
  assert.ok(changes.some(c=>c.id===catalog[1].id && c.action==='Ocultar'));
  assert.ok(changes.some(c=>c.id==='recurs-nou' && c.action==='Afegir'));
  assert.ok(changes.some(c=>c.id===catalog[0].id && c.action==='Retirar'));
});

test('Recovering an unsaved form after another device publishes cannot adopt the new baseline', async () => {
  const form = {...catalog[0],detail:'La meva explicació pendent de guardar.'};
  const recovered = readEditorDraft(serializeEditorDraft(form.id, form, exportCatalog(catalog)));
  const remote = catalog.map((r,i) => i ? r : {...r,description:'Canvi publicat des d’un altre dispositiu.'});
  const next = remote.map(r => r.id===recovered.selected ? recovered.form : r);
  const methods=[];
  const fetchImpl=async (url,options)=>{
    methods.push(options.method);
    return new Response(JSON.stringify({type:'file',encoding:'base64',sha:'a'.repeat(40),content:Buffer.from(exportCatalog(remote),'utf8').toString('base64')}),{status:200});
  };
  await assert.rejects(publishCatalog({resources:next,expectedBaseCatalog:recovered.baseCatalog,token:'test-key',fetchImpl}),error=>error.code==='CONFLICT');
  assert.deepEqual(methods,['GET']);
  assert.equal(readEditorDraft(JSON.stringify({selected:form.id,form})).baseCatalog,null);
});

test('Two tabs with drafts of different ages preserve their edits and require a review before publication', async () => {
  const remote = catalog.map((r,i)=>i ? r : {...r,description:'Actualització publicada des de la segona pestanya.'});
  const local = readLocalDraft(serializeLocalDraft(remote.map((r,i)=>i===1 ? {...r,detail:'Un altre canvi local.'}:r),exportCatalog(remote)));
  const form = readEditorDraft(serializeEditorDraft(catalog[0].id,{...catalog[0],detail:'Fitxa antiga encara pendent.'},exportCatalog(catalog)));
  const combined = local.resources.map(r=>r.id===form.selected ? form.form:r);
  const base = combineDraftBases(local.baseCatalog,form.baseCatalog);
  assert.equal(base,null);
  assert.equal(combined[0].detail,'Fitxa antiga encara pendent.');
  assert.equal(combined[1].detail,'Un altre canvi local.');
  let requests=0;
  await assert.rejects(publishCatalog({resources:combined,expectedBaseCatalog:base,token:'test-key',fetchImpl:async()=>{requests++;}}),error=>error.code==='MISSING_BASE');
  assert.equal(requests,0);
});
