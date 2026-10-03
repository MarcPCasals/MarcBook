import {assessments} from './assessments.mjs';
import {decryptPayload,assessAnswers} from './crypto.mjs';
const lang=document.body.dataset.language,fr=lang==='fr';
const text=JSON.parse(document.querySelector('#ui-text').textContent);
const say=(f,s)=>fr?f:s;
const storageKey=`marcbook-iode-${lang}-v1`;
let answers={},color='blue',target='student',answerKey=null,originalPrediction=null,attempt=0;
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.version===1&&saved.language===lang){answers=clean(saved.answers);originalPrediction=typeof saved.originalPrediction==='string'?saved.originalPrediction:null;}}catch{}
function clean(data){const result={};if(!data||typeof data!=='object'||Array.isArray(data))return result;for(const [key,value] of Object.entries(data)){if(/^(name|group|date|arrow[12]|change[12]|condition[12]|explanation|prediction|justification|decision|skill[0-6]|word\d{1,3})$/.test(key)&&(typeof value==='string'||typeof value==='boolean'))result[key]=typeof value==='string'?value.slice(0,30000):value;}return result;}
function record(){return{version:1,activity:'iode',language:lang,answers,originalPrediction};}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(record()));document.querySelector('#save-status').textContent=text.saved;}catch{document.querySelector('#save-status').textContent=text.unsaved;}}
function hydrate(){document.querySelectorAll('[data-answer]').forEach(el=>{const v=answers[el.dataset.answer];if(el.type==='checkbox')el.checked=v===true;else if(el.type==='radio')el.checked=v===el.value;else el.value=typeof v==='string'?v:'';});document.querySelectorAll('[data-word]').forEach(el=>{const mark=answers[`word${el.dataset.word}`];el.classList.toggle('blue',mark==='blue');el.classList.toggle('red',mark==='red');el.setAttribute('aria-pressed',String(mark==='blue'||mark==='red'));});}
hydrate();save();
function invalidate(){document.querySelector('#feedback')?.remove();document.querySelector('#submit-sheet')?.removeAttribute('data-submitted');}
document.querySelector('#student').addEventListener('input',event=>{const el=event.target;if(!el.dataset.answer||el.type==='radio'||el.type==='checkbox')return;answers[el.dataset.answer]=el.value;invalidate();save();});
document.querySelector('#student').addEventListener('change',event=>{const el=event.target;if(!el.dataset.answer)return;answers[el.dataset.answer]=el.type==='checkbox'?el.checked:el.value;invalidate();save();});
const sentence=document.querySelector('.sentence');
let selectedWords=[],pointerOrigin=null,suppressWordClick=false;
const applyButton=document.querySelector('#apply-selection');
function selectionWords(){
 const selection=window.getSelection();
 if(!selection||selection.isCollapsed||!selection.rangeCount)return [];
 const range=selection.getRangeAt(0);
 return [...sentence.querySelectorAll('[data-word]')].filter(word=>range.intersectsNode(word));
}
function wordsBetweenPoints(start,end){
 const caretAt=point=>{
  if(document.caretPositionFromPoint){const caret=document.caretPositionFromPoint(point.x,point.y);if(caret){const range=document.createRange();range.setStart(caret.offsetNode,caret.offset);range.collapse(true);return range;}}
  return document.caretRangeFromPoint?.(point.x,point.y);
 };
 const first=caretAt(start),last=caretAt(end);
 if(!first||!last||!sentence.contains(first.startContainer)||!sentence.contains(last.startContainer))return [];
 const backwards=first.compareBoundaryPoints(Range.START_TO_START,last)>0;
 const begin=backwards?last:first,finish=backwards?first:last,range=document.createRange();
 range.setStart(begin.startContainer,begin.startOffset);range.setEnd(finish.startContainer,finish.startOffset);
 if(range.collapsed)return [];
 return [...sentence.querySelectorAll('[data-word]')].filter(word=>range.intersectsNode(word));
}
function clearSelection(){selectedWords=[];applyButton.disabled=true;window.getSelection()?.removeAllRanges();}
function markWords(words){if(!words.length)return;for(const word of words)answers[`word${word.dataset.word}`]=color;hydrate();invalidate();save();clearSelection();}
document.addEventListener('selectionchange',()=>{const words=selectionWords();if(words.length){selectedWords=words;applyButton.disabled=false;}});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.sentence,.palette'))clearSelection();});
sentence.addEventListener('pointerdown',event=>{selectedWords=[];applyButton.disabled=true;pointerOrigin={x:event.clientX,y:event.clientY,pointerId:event.pointerId,type:event.pointerType};});
document.addEventListener('pointerup',event=>{
 if(!pointerOrigin||pointerOrigin.pointerId!==event.pointerId)return;
 const origin=pointerOrigin;pointerOrigin=null;
 // Let native browser text selection handle mouse drags, including wrapped lines.
 if(origin.type!=='mouse')return;
 const moved=Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>4;
 if(moved){const endpoint={x:event.clientX,y:event.clientY};suppressWordClick=true;requestAnimationFrame(()=>{const words=selectionWords();markWords(words.length?words:wordsBetweenPoints(origin,endpoint));setTimeout(()=>{suppressWordClick=false;},0);});}
});
document.addEventListener('pointercancel',()=>{pointerOrigin=null;suppressWordClick=false;});
document.querySelectorAll('[data-color]').forEach(button=>button.addEventListener('click',()=>{
 const words=selectionWords().length?selectionWords():selectedWords;
 color=button.dataset.color;
 document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 // A native touch selection can be marked by tapping a color as well.
 if(words.length)markWords(words);
}));
applyButton.addEventListener('click',()=>markWords(selectionWords().length?selectionWords():selectedWords));
document.querySelectorAll('[data-word]').forEach(word=>{
 word.addEventListener('click',()=>{if(suppressWordClick||selectionWords().length)return;markWords([word]);});
 word.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();markWords([word]);}});
});
const codeDialog=document.querySelector('#code-dialog'),teacherDialog=document.querySelector('#teacher-dialog');
function ask(kind){target=kind;attempt++;document.querySelector('#code-form').reset();document.querySelector('#code-error').textContent='';document.querySelector('#code-title').textContent=kind==='student'?text.unlock:text.teacherunlock;document.querySelector('#code-submit').disabled=false;codeDialog.showModal();document.querySelector('#code').focus();}
document.querySelector('#student-unlock').addEventListener('click',()=>ask('student'));
document.querySelector('#teacher-button').addEventListener('click',()=>ask('teacher'));
document.querySelector('#cancel-code').addEventListener('click',()=>codeDialog.close());
codeDialog.addEventListener('close',()=>{attempt++;document.querySelector('#code').value='';});
document.querySelector('#code-form').addEventListener('submit',async event=>{
 event.preventDefault();const request=++attempt,kind=target,code=document.querySelector('#code').value;
 const button=document.querySelector('#code-submit');button.disabled=true;document.querySelector('#code-error').textContent='';
 try{
  const response=await fetch(new URL(`${kind}-${lang}.json`,import.meta.url));if(!response.ok)throw new Error('network');
  const encrypted=await response.json();let content;
  try{content=await decryptPayload(encrypted,code);}catch(error){if(error.name==='OperationError')throw new Error('wrong');throw error;}
  if(request!==attempt||!codeDialog.open)return;
  codeDialog.close();
  if(kind==='student'){
   answerKey=content.key;if(originalPrediction===null){originalPrediction=answers.prediction||'';save();}
   document.querySelector('#part-two').innerHTML=content.html;
   document.querySelector('#original-prediction').textContent=originalPrediction||text.empty;
   document.querySelector('#student-gate').hidden=true;hydrate();
   if(!document.querySelector('#submit-sheet')){const deliver=document.createElement('button');deliver.id='submit-sheet';deliver.className='primary';deliver.textContent=say('Remettre la fiche','Entregar la ficha');deliver.addEventListener('click',submit);document.querySelector('.actions').prepend(deliver);}
   document.querySelector('#new-proof').focus();
  }else{document.querySelector('#teacher-content').innerHTML=content.html;teacherDialog.showModal();document.querySelector('#teacher-close').focus();}
 }catch(error){if(request===attempt){document.querySelector('#code-error').textContent=error.message==='wrong'?text.wrong:text.network;document.querySelector('#code').select();}}
 finally{if(request===attempt)button.disabled=false;}
});
document.querySelector('#teacher-close').addEventListener('click',()=>teacherDialog.close());
teacherDialog.addEventListener('close',()=>{document.querySelector('#teacher-content').replaceChildren();document.body.classList.remove('print-teacher');document.querySelector('#teacher-button').focus();});
function submit(){
 const results=assessAnswers(answers,answerKey,document.querySelectorAll('[data-word]').length);
 const objective=results,correct=objective.filter(r=>r.correct).length;
 document.querySelector('#feedback')?.remove();const section=document.createElement('section');section.id='feedback';section.className='feedback';section.tabIndex=-1;section.setAttribute('aria-labelledby','feedback-title');
 const h=document.createElement('h2');h.id='feedback-title';h.textContent=say('Fiche remise · Retour automatique','Ficha entregada · Corrección automática');section.append(h);
 const summary=document.createElement('p');summary.textContent=say(`${correct} / ${objective.length} éléments corrects sur les réponses vérifiables automatiquement.`,`${correct} / ${objective.length} elementos correctos en las respuestas verificables automáticamente.`);section.append(summary);
 const info=document.createElement('p');info.textContent=say('Les explications, la prédiction et la justification restent à revoir avec l’enseignant. Les cases sont comparées à la grille de référence pour une fiche entièrement complétée ; l’enseignant vérifiera ces déclarations dans tes réponses. Cette remise prépare ta fiche sur cet appareil ; elle ne l’envoie pas au professeur. Utilise Imprimer / PDF ou télécharge-la pour la lui remettre.','Las explicaciones, la predicción y la justificación quedan pendientes de revisión docente. Las casillas se comparan con la clave de referencia para una ficha completamente resuelta; el docente comprobará estas declaraciones en tus respuestas. La entrega prepara tu ficha en este dispositivo; no la envía al profesor. Usa Imprimir / PDF o descárgala para entregársela.');section.append(info);
 const list=document.createElement('ul');
 for(const item of results){const li=document.createElement('li');li.className=item.correct?'ok':'no';const strong=document.createElement('strong');strong.textContent=(item.correct?'✓':say('À revoir','Revisar'))+' · '+item.label;li.append(strong);const detail=document.createElement('div');detail.textContent=item.conditional?(item.correct?say('Conforme à la clé de référence. ','Coincide con la clave de referencia. '):say('À cocher pour une fiche entièrement complétée. ','Se marca en una ficha completamente resuelta. '))+item.answer:item.correct?say('Correct.','Correcto.'):say('Réponse attendue : ','Respuesta esperada: ')+item.answer;li.append(detail);list.append(li);}section.append(list);
 const download=document.createElement('button');download.textContent=say('Télécharger la fiche remise','Descargar la ficha entregada');download.addEventListener('click',()=>downloadSubmission(section));section.append(download);
 document.querySelector('.actions').after(section);document.querySelector('#submit-sheet').dataset.submitted='true';section.focus();save();
}
function download(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function downloadSubmission(feedback){
 const doc=document.implementation.createHTMLDocument(document.title);doc.documentElement.lang=lang;
 const style=doc.createElement('style');style.textContent='body{font:17px/1.6 system-ui;max-width:900px;margin:30px auto;padding:24px}h1,h2{color:#381c65}.transformation{display:flex;gap:24px}.transformation>figure{width:30%}.change-fields{width:40%}img{max-width:100%;max-height:240px}label{display:block}input,select{margin:8px}.word{background:white;border:0;font:inherit}.blue{color:#144caf;text-decoration:underline}.red{color:#a32323;border:1px solid}.print-value{white-space:pre-wrap;border:1px solid #ddd;padding:10px}.hint,.palette,.original:empty{display:none}.ok{color:#176342}.no{color:#a32323}@media(max-width:600px){.transformation{display:block}.transformation>figure,.change-fields{width:100%}}';doc.head.append(style);
 for(const sheet of document.querySelectorAll('.sheet')){
  const copy=sheet.cloneNode(true);
  copy.querySelectorAll('img').forEach(img=>{if(!img.src.startsWith('data:'))img.src=new URL(img.getAttribute('src'),location.href).href;});
  copy.querySelectorAll('[data-answer]').forEach(el=>{const value=answers[el.dataset.answer];if(el.type==='checkbox'||el.type==='radio'){const mark=doc.createElement('span');mark.textContent=(el.type==='checkbox'?value===true:value===el.value)?'☑ ':'☐ ';el.replaceWith(mark);}else{const p=doc.createElement('p');p.className='print-value';p.textContent=el.tagName==='SELECT'?([...el.options].find(o=>o.value===value)?.textContent||''):value||'—';el.replaceWith(p);}});
  copy.querySelectorAll('.palette,.hint,.assessment-button').forEach(el=>el.remove());copy.querySelectorAll('.word').forEach(el=>{const span=doc.createElement('span');span.className=el.className;span.textContent=el.textContent+' ';el.replaceWith(span);});doc.body.append(copy);
 }
 const review=feedback.cloneNode(true);review.querySelector('button')?.remove();doc.body.append(review);
 download(new Blob(['<!doctype html>'+doc.documentElement.outerHTML],{type:'text/html;charset=utf-8'}),`iode-${lang}-fiche.html`);
}
document.querySelector('#backup').addEventListener('click',()=>download(new Blob([JSON.stringify(record(),null,2)],{type:'application/json'}),`iode-${lang}-reponses.json`));
document.querySelector('#restore').addEventListener('click',()=>document.querySelector('#restore-file').click());
document.querySelector('#restore-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>500000)throw new Error();const data=JSON.parse(await file.text());if(data.activity!=='iode'||data.version!==1||data.language!==lang||!data.answers||Array.isArray(data.answers))throw new Error();answers=clean(data.answers);originalPrediction=typeof data.originalPrediction==='string'?data.originalPrediction:null;hydrate();invalidate();save();document.querySelector('#save-status').textContent=text.loaded;if(document.querySelector('#original-prediction'))document.querySelector('#original-prediction').textContent=originalPrediction||text.empty;}catch{document.querySelector('#save-status').textContent=text.invalidbackup;}finally{event.target.value='';}});
function preparePrint(){document.querySelectorAll('.print-value').forEach(el=>el.remove());document.querySelectorAll('[data-answer]').forEach(el=>{if(['checkbox','radio'].includes(el.type))return;const p=document.createElement('div');p.className='print-value';p.textContent=el.tagName==='SELECT'?(el.value?el.selectedOptions[0]?.textContent:''):el.value||' ';el.after(p);});}
window.addEventListener('beforeprint',preparePrint);window.addEventListener('afterprint',()=>document.body.classList.remove('print-teacher'));
document.querySelector('#print-student').addEventListener('click',()=>{document.body.classList.remove('print-teacher');window.print();});
document.querySelector('#print-teacher').addEventListener('click',()=>{document.body.classList.add('print-teacher');window.print();});

const assessmentDialog=document.querySelector('#assessment-dialog');
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-assessment]');if(!button)return;
 const locale='ca';
 const copy=assessments[locale],item=copy.items[button.dataset.assessment];if(!item)return;
 assessmentDialog.lang=locale;
 assessmentDialog.querySelector('.eyebrow').textContent=copy.heading;
 document.querySelector('#assessment-title').textContent=item[0];
 document.querySelector('#assessment-criterion').textContent=item[1];
 document.querySelector('#assessment-evidence-title').textContent=copy.evidence;
 const list=document.querySelector('#assessment-evidence');list.replaceChildren();
 for(const evidence of item[2]){const li=document.createElement('li');li.textContent=evidence;list.append(li);}
 document.querySelector('#assessment-scope').textContent=copy.scope+' : '+item[3];
 document.querySelector('#assessment-close').setAttribute('aria-label',copy.close);
 assessmentDialog.showModal();document.querySelector('#assessment-close').focus();
});
document.querySelector('#assessment-close').addEventListener('click',()=>assessmentDialog.close());
