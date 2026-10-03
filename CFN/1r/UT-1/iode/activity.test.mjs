import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {decryptPayload,normalizeAnswer,assessAnswers} from './crypto.mjs';
const encode = a => Buffer.from(a).toString('base64');
test('A valid code decrypts, wrong code and tampering fail authentication',async()=>{
 const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12)),code='test-only';
 const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
 const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:1000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
 const data=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify({html:'Protected classroom content'})));
 const payload={salt:encode(salt),iv:encode(iv),iterations:1000,data:encode(data)};
 assert.deepEqual(await decryptPayload(payload,code),{html:'Protected classroom content'});
 await assert.rejects(()=>decryptPayload(payload,'incorrect'));
 const changed=Buffer.from(data);changed[0]^=1;await assert.rejects(()=>decryptPayload({...payload,data:encode(changed)},code));
});
test('Each locale and role has a separate encrypted package; no solutions in public HTML',()=>{
 const salts=[];
 for(const lang of ['fr','es'])for(const role of ['student','teacher']){
  const raw=fs.readFileSync(new URL(`${role}-${lang}.json`,import.meta.url),'utf8');const payload=JSON.parse(raw);
  assert.equal(payload.version,1);assert.equal(payload.iterations,150000);salts.push(payload.salt);
  assert.ok(!raw.includes('sublimation')&&!raw.includes('sublimación')&&!raw.includes('data:image'));assert.equal(Buffer.from(payload.iv,'base64').length,12);
 }
 assert.equal(new Set(salts).size,4);
 for(const filename of ['transformations-iode.html','transformaciones-yodo.html']){
  const html=fs.readFileSync(new URL(filename,import.meta.url),'utf8');assert.ok(!html.includes('Cristaux sur la paroi')&&!html.includes('Cristales en la pared')&&!html.includes('sublimation inverse')&&!html.includes('sublimación inversa'));
  assert.ok(html.includes('id="teacher-button"')&&html.includes('id="student-unlock"'));
 }
});
test('State-change correction tolerates accents and casing but rejects ambiguous condensation',()=>{
 const key=[{field:'process',accepted:['sublimación inversa','condensación sólida']}];
 assert.equal(normalizeAnswer('  SUBLIMACIÓN   INVERSA. '),'sublimacion inversa');
 assert.equal(assessAnswers({process:'SUBLIMACION INVERSA'},key,0)[0].correct,true);
 assert.equal(assessAnswers({process:'condensacion solida'},key,0)[0].correct,true);
 for(const process of ['condensación','fusión','',null])assert.equal(assessAnswers({process},key,0)[0].correct,false);
});
test('Observations and interpretations must all be marked in the right color',()=>{
 const key=[{words:true,split:2}],answers={word0:'blue',word1:'blue',word2:'red',word3:'red'};
 assert.equal(assessAnswers(answers,key,4)[0].correct,true);
 assert.equal(assessAnswers({...answers,word1:'red'},key,4)[0].correct,false);
 assert.equal(assessAnswers({...answers,word3:''},key,4)[0].correct,false);
});
test('Checking an experiment not performed is incorrect; self-reported writing remains conditional',()=>{
 const key=[{field:'experiment',checkbox:true,expected:false},{field:'model',checkbox:true,expected:true,conditional:true}];
 assert.deepEqual(assessAnswers({experiment:false,model:true},key,0).map(r=>r.correct),[true,true]);
 assert.equal(assessAnswers({experiment:true},key,0)[0].correct,false);
 assert.equal(assessAnswers({},key,0)[1].conditional,true);
});
