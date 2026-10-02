import React, { useEffect, useRef, useState } from 'react';
import { ArrowSquareOut, Check, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { exportCatalog, importCatalog } from './catalog.mjs';
import { catalogChanges } from './content-state.mjs';
import { PUBLICATION_CONFIG, publishCatalog, readPublicCatalog, readRepositoryCatalog } from './publishing.mjs';

export function PublishingPanel({ resources, published, baseCatalog, dirty, catalogReady, onSent, onLive, onBusy }) {
  const [token, setToken] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const pendingRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRef = useRef(true);
  const sentCallback = useRef(onSent);sentCallback.current = onSent;
  const liveCallback = useRef(onLive);
  liveCallback.current = onLive;
  useEffect(() => { activeRef.current = true; return () => {activeRef.current=false;controllerRef.current?.abort();}; }, []);
  useEffect(() => { setReviewed(false); }, [resources, published]);

  let baseline;
  try { baseline = baseCatalog ? importCatalog(baseCatalog) : published; } catch { baseline = published; }
  const changes = catalogChanges(baseline, resources);
  const busy = ['sending','checking'].includes(status);
  useEffect(()=>{onBusy(busy);return()=>onBusy(false);},[busy,onBusy]);

  async function verify(result) {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('checking');setMessage('GitHub ha rebut el catàleg. Estem comprovant quan apareix a la web.');
    for (let attempt=0; attempt<24 && !controller.signal.aborted; attempt++) {
      try {
        const url = new URL(PUBLICATION_CONFIG.publicUrl);
        url.searchParams.set('revision',result.commit.sha);
        const live = await readPublicCatalog({url:url.href,signal:controller.signal,timeoutMs:8000});
        if (live.normalizedCatalog === result.normalizedCatalog) {
          if (activeRef.current) {setStatus('live');setMessage('Publicació comprovada: els canvis ja són visibles a la web.');liveCallback.current(result);}
          return;
        }
      } catch { /* A failed poll never retries the write. */ }
      if (attempt<23) await new Promise(resolve => {
        const finish=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',finish);resolve();};
        const timer=setTimeout(finish,5000);
        controller.signal.addEventListener('abort',finish,{once:true});
      });
    }
    if (activeRef.current && !controller.signal.aborted) {setStatus('sent');setMessage('El catàleg és a GitHub. La web encara no ha confirmat l’actualització; pots comprovar-la de nou d’aquí a una estona.');}
  }

  async function publish() {
    if (dirty || busy || !catalogReady || !token.trim() || (!baseCatalog && !reviewed)) return;
    setStatus('sending');setMessage('Enviant el catàleg a GitHub…');
    pendingRef.current={normalizedCatalog:exportCatalog(importCatalog(exportCatalog(resources))),baseCatalog:baseCatalog || exportCatalog(published)};
    const controller=new AbortController();controllerRef.current=controller;
    try {
      const result=await publishCatalog({resources,expectedBaseCatalog:baseCatalog || exportCatalog(published),token:token.trim(),signal:controller.signal});
      if (!activeRef.current) return;
      setToken('');setReceipt(result);sentCallback.current(result);
      await verify(result);
    } catch(error) {
      if (activeRef.current) {setStatus(error.code==='UNKNOWN_OUTCOME'?'uncertain':'error');setMessage(error.message);}
    }
  }

  async function checkUncertainPublication() {
    if(!pendingRef.current)return;
    setStatus('checking');setMessage('Comprovant el catàleg de GitHub, sense tornar a enviar els canvis…');
    const controller=new AbortController();controllerRef.current=controller;
    try {
      const remote=await readRepositoryCatalog({token:token.trim(),signal:controller.signal});
      if(!activeRef.current)return;
      if(remote.normalizedCatalog===pendingRef.current.normalizedCatalog){
        const result={...remote,commit:{sha:remote.sha,url:'https://github.com/MarcPCasals/MarcBook/blob/main/marcbook-catalog.json'}};
        setToken('');setReceipt(result);sentCallback.current(result);await verify(result);
      }else{
        setStatus('error');
        setMessage(remote.normalizedCatalog===pendingRef.current.baseCatalog?'GitHub conserva la versió anterior. Pots tornar a publicar; els teus canvis locals continuen guardats.':'El catàleg ha canviat a GitHub. Exporta els teus canvis i revisa la versió nova abans de publicar.');
      }
    }catch(error){if(activeRef.current){setStatus('uncertain');setMessage(error.message);}}
  }

  function manualPublication() {
    const blob = new Blob([exportCatalog(resources)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=PUBLICATION_CONFIG.path;link.click();URL.revokeObjectURL(url);
    setMessage('Còpia descarregada. A GitHub, puja marcbook-catalog.json a l’arrel i confirma el canvi. La web s’actualitzarà quan acabi la publicació.');
  }

  return <details className="publication-panel">
    <summary><UploadSimple size={20}/>Publicar els canvis a la web<span>{changes.length ? `${changes.length} ${changes.length===1?'fitxa':'fitxes'} amb canvis` : 'Catàleg al dia'}</span></summary>
    <div className="publication-content">
      <div className="publication-review">
        <h2>Abans de publicar</h2>
        <p>Revisa les fitxes que canviaran per a tothom. Els canvis sense guardar s’han d’incorporar primer al catàleg.</p>
        {changes.length ? <ul>{changes.map(change=><li key={change.id}><strong>{change.action}</strong><span>{change.title}</span></li>)}</ul> : <p className="muted">No hi ha canvis respecte a la darrera versió guardada.</p>}
        {dirty && <p className="publication-warning"><WarningCircle size={19}/>Guarda la fitxa que estàs editant abans de publicar.</p>}
        {!baseCatalog && <label className="visibility-check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>He revisat aquesta còpia antiga respecte al catàleg publicat i vull publicar els canvis indicats.</label>}
      </div>
      <div className="publication-controls">
        <h3>La teva clau de publicació</h3>
        <p>Només la necessita qui publica. Utilitza una clau de GitHub limitada a <strong>MarcPCasals/MarcBook</strong>, amb permís d’escriptura de continguts. Es manté en memòria mentre ets en aquest editor.</p>
        <label>Clau de GitHub<input type="password" autoComplete="off" spellCheck="false" value={token} onChange={e=>setToken(e.target.value)} placeholder="Introdueix la clau per publicar" disabled={busy}/></label>
        <div className="publication-links"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Crea una clau <ArrowSquareOut size={15}/></a><a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" target="_blank" rel="noopener noreferrer">Com configurar-la <ArrowSquareOut size={15}/></a></div>
        <button className="button" type="button" disabled={busy || status==='uncertain' || dirty || !catalogReady || !token.trim() || !changes.length || (!baseCatalog&&!reviewed)} onClick={publish}><UploadSimple/>{busy?'Publicació en curs…':'Confirma i publica'}</button>
        <details className="manual-publication"><summary>Publicar amb el teu compte de GitHub, sense clau</summary><p>Descarrega el catàleg, obre GitHub i puja aquest fitxer a l’arrel del repositori. GitHub et demanarà el teu compte per confirmar el canvi.</p><button className="subtle-button" type="button" disabled={dirty || busy} onClick={manualPublication}>Descarrega el fitxer per publicar</button><a className="subtle-button" href="https://github.com/MarcPCasals/MarcBook/upload/main" target="_blank" rel="noopener noreferrer">Obre la publicació a GitHub <ArrowSquareOut/></a></details>
      </div>
    </div>
    {message && <div className={`publication-status ${['error','uncertain'].includes(status)?'publication-error':''}`} role={['error','uncertain'].includes(status)?'alert':'status'}>{status==='live'?<Check size={20}/>:['error','uncertain'].includes(status)?<WarningCircle size={20}/>:<UploadSimple size={20}/>}<p>{message}</p>{receipt && <a href={receipt.commit.url} target="_blank" rel="noopener noreferrer">Veure el canvi a GitHub</a>}{status==='sent' && <button className="subtle-button" onClick={()=>verify(receipt)}>Comprova la publicació</button>}{status==='uncertain' && <button className="subtle-button" onClick={checkUncertainPublication}>Comprova l’estat a GitHub</button>}</div>}
  </details>;
}
