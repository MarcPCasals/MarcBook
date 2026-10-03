import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SUBJECTS, filterResources, importCatalog, exportCatalog, validateResource, validLink, uniqueId, parseRoute, route } from '../src/catalog.mjs';
const catalog=importCatalog(fs.readFileSync(new URL('../../marcbook-catalog.json',import.meta.url),'utf8'));
test('Preserves the 34 retained cards and two iodine activities and their original links',()=>{
  assert.equal(catalog.length,36);
  assert.equal(new Set(catalog.map(r=>r.id)).size,36);
  assert.equal(catalog.filter(r=>r.subject==='personal').length,3);
  for(const r of catalog){validateResource(r);for(const l of r.links){if(new URL(l.url).origin!=='https://marcpcasals.github.io')continue;const path=decodeURIComponent(new URL(l.url).pathname.replace(/^\/MarcBook\//,''));assert.ok(fs.existsSync(new URL('../../'+path,import.meta.url)),`Missing original tool: ${l.url}`);}}
});
test('Search combines words, accents and every filter; personal and hidden resources stay out',()=>{
  assert.deepEqual(filterResources(catalog,{q:'QUIMICA REACCIONS',course:'4t',unit:'4.4',language:'Francès',kind:'Simulació'}).map(r=>r.id),['la-balanca-quimica']);
  assert.equal(filterResources(catalog,{subject:'science',course:'4t',unit:'4.4'}).length,4);
  assert.equal(filterResources(catalog,{subject:'pi'}).length,0);
  assert.equal(filterResources(catalog,{q:'infuteca'}).length,0);
  assert.equal(filterResources([{...catalog[0],visible:false}]).length,0);
  assert.equal(filterResources(catalog,{q:'nonexistent term'}).length,0);
});
test('Round-trip export retains explanations, original links and hidden state',()=>{
  const resources=catalog.map((r,i)=>({...r,visible:i!==0}));
  const loaded=importCatalog(exportCatalog(resources));
  assert.equal(loaded.length,36);assert.equal(loaded[0].visible,false);
  assert.deepEqual(loaded.find(r=>r.id==='quimilab').links,resources.find(r=>r.id==='quimilab').links);
  assert.deepEqual(loaded.find(r=>r.id==='quimilab').steps,resources.find(r=>r.id==='quimilab').steps);
});
test('Optional educational value is normalized, retained in backups and searchable',()=>{
  const {teachingValue:_,...legacy}=catalog[0];
  assert.equal(validateResource(legacy).teachingValue,'');
  assert.equal(validateResource({...legacy,teachingValue:{unexpected:'object'}}).teachingValue,'');
  assert.equal(validateResource({...legacy,teachingValue:'x'.repeat(1001)}).teachingValue.length,1000);
  const source={...legacy,teachingValue:'  Contrasta hipòtesis amb evidències observables.  '};
  const loaded=importCatalog(exportCatalog([source]));
  assert.equal(loaded[0].teachingValue,'Contrasta hipòtesis amb evidències observables.');
  assert.equal(filterResources(loaded,{q:'hipotesis observables'}).length,1);
  assert.deepEqual(loaded[0].links,legacy.links);
});
test('PI cannot return through older local catalogs, imports, exports or a changed category',()=>{
  const legacyPI={...catalog[0],id:'planificador-de-pi',subject:'pi',links:[{label:'Català',url:'https://marcpcasals.github.io/MarcBook/PI/planificador-pi.html'}]};
  const edited={...catalog[0],description:'Canvi local que cal conservar.'};
  const oldLocal=JSON.stringify({schemaVersion:1,resources:[edited,...catalog.slice(1),legacyPI]});
  const imported=importCatalog(oldLocal);
  assert.equal(imported.length,36);
  assert.equal(imported[0].description,edited.description);
  assert.equal(imported.some(r=>r.id===legacyPI.id),false);
  assert.equal(Object.hasOwn(SUBJECTS,'pi'),false);
  assert.throws(()=>validateResource(legacyPI),/PI/);
  const recategorized={...legacyPI,id:'old-tool',subject:'teacher'};
  assert.equal(filterResources([recategorized]).length,0);
  assert.deepEqual(JSON.parse(exportCatalog([edited,recategorized])).resources,[edited]);
});
test('Reject malformed imports and unsafe links before applying any records',()=>{
  assert.throws(()=>importCatalog('{bad'),/JSON/);
  assert.throws(()=>importCatalog('null'),/versió/);
  assert.throws(()=>importCatalog(JSON.stringify({schemaVersion:2,resources:catalog})),/versió/);
  assert.throws(()=>importCatalog(exportCatalog([catalog[0],catalog[0]])),/duplicats/);
  for(const url of ['javascript:alert(1)','data:text/html,test','https://user:pass@example.com/','/relative']) assert.equal(validLink(url),false);
  assert.throws(()=>validateResource({...catalog[0],links:[{label:'Open',url:'javascript:alert(1)'}]}),/adreça/);
  assert.throws(()=>validateResource({...catalog[0],image:'javascript:alert(1)'}),/imatge/);
});
test('Shared routes keep filters and unique identifiers do not collide',()=>{
  const path=route('recursos',{q:'reaccions químiques',unit:'4.4',language:'Francès'});
  assert.deepEqual(parseRoute(path),{page:'recursos',id:undefined,filters:{q:'reaccions químiques',unit:'4.4',language:'Francès'}});
  assert.equal(uniqueId('QuimiLab',catalog),'quimilab-2');
  assert.equal(parseRoute('#/recurs/quimilab').id,'quimilab');
});
