import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, MagnifyingGlass, FileText, SquaresFour, List, X, ListChecks, DownloadSimple, UploadSimple, Plus, PencilSimple, Eye, EyeSlash, LinkSimple, Printer, Check, Funnel, ArrowSquareOut, FloppyDisk, BookOpen, WarningCircle } from '@phosphor-icons/react';
import bundledCatalog from '../../marcbook-catalog.json';
import { readPublicCatalog } from './publishing.mjs';
import { PublishingPanel } from './PublishingPanel.jsx';
import { readLocalDraft, serializeLocalDraft, readEditorDraft, serializeEditorDraft, combineDraftBases } from './content-state.mjs';
import { STORAGE_KEY, SUBJECTS, KINDS, LANGUAGES, asset, filterResources, importCatalog, exportCatalog, validateResource, uniqueId, parseRoute, route, isPIResource } from './catalog.mjs';

const DRAWINGS = { 'path-science':'Ciències', 'path-teacher':'Eines docents', 'resource-molecules':'Molècules', 'resource-chemistry':'Química', 'resource-reactions':'Reaccions', 'resource-newton':'Forces', 'resource-universe':'Univers', 'resource-food':'Alimentació', 'resource-cells':'Cèl·lules', 'resource-earth':'Geologia',
  ...Object.fromEntries(bundledCatalog.resources.filter(r => r.subject !== 'personal' && /^assets\/resource-[a-z0-9-]+\.webp$/.test(r.image)).map(r => [r.image.slice(7, -5), r.title])) };
const EMPTY = { id:'', title:'', description:'', detail:'', teachingValue:'', subject:'science', course:'', unit:'', topic:'', kind:'Activitat', languages:['Català'], links:[{ label:'Català', url:'' }], image:'assets/path-science.webp', objectives:[], steps:[], evidence:[], materials:['Dispositiu amb navegador'], tags:'', status:'ready', visible:true, order:999 };
const IMG = ({ path, alt = '', ...props }) => <img src={path.startsWith('assets/') ? asset(path) : path} alt={alt} {...props} />;
const Button = ({ children, className = '', ...props }) => <button className={`button ${className}`} {...props}>{children}</button>;
const Meta = ({ item }) => <p className="resource-meta">{[item.course && `${item.course} curs`, item.unit && `UT ${item.unit}`, ...item.languages].filter(Boolean).join(' · ') || SUBJECTS[item.subject]}</p>;
const isTeacherTool = item => item.subject === 'teacher' && item.kind === 'Eina';
const explanationLabels = item => isTeacherTool(item)
  ? { objectives:'Què et permet fer?', steps:'Com la pots utilitzar?', evidence:'Quina informació pots recollir?', proposal:'Proposta d’ús adaptable a la teva pràctica docent.' }
  : { objectives:'Què pot treballar l’alumnat?', steps:'Com el pots portar a l’aula?', evidence:'Quines evidències pots recollir?', proposal:'Proposta d’ús adaptable al teu grup.' };

export function App() {
  const [location, setLocation] = useState(() => parseRoute(window.location.hash));
  const [storageNotice, setStorageNotice] = useState('');
  const [published, setPublished] = useState(() => importCatalog(JSON.stringify(bundledCatalog)));
  const [draft] = useState(() => { try { return readLocalDraft(localStorage.getItem(STORAGE_KEY)); } catch { return {resources:null,baseCatalog:null}; } });
  const [local, setLocal] = useState(draft.resources);
  const [localBaseCatalog, setLocalBaseCatalog] = useState(draft.baseCatalog);
  const [catalogReady, setCatalogReady] = useState(false);
  const [showLocal, setShowLocal] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [launch, setLaunch] = useState(null);
  const [notice, setNotice] = useState('');
  const [layout, setLayout] = useState('grid');
  const mainRef = useRef(null);
  const localResources = local?.filter(r=>!isPIResource(r));
  const resources = localResources && showLocal ? localResources : published;
  const go = (page, filters) => { const next = route(page, filters); if (window.location.hash === next) { setLocation(parseRoute(next)); } else window.location.hash = next; setMenuOpen(false); };
  useEffect(() => {
    const change = () => { setLocation(parseRoute(window.location.hash)); setMenuOpen(false); window.scrollTo(0,0); mainRef.current?.focus({ preventScroll: true }); };
    window.addEventListener('hashchange',change); return () => window.removeEventListener('hashchange',change);
  }, []);
  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if(saved) importCatalog(saved); }
    catch { setStorageNotice('Les dades locals no es poden llegir. El catàleg publicat continua disponible; exporta una còpia abans de substituir-les.'); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    readPublicCatalog({url:new URL(asset('marcbook-catalog.json'),window.location.href).href,signal:controller.signal})
      .then(result=>{
        setPublished(result.resources);
        if(draft.resources && exportCatalog(draft.resources)===result.normalizedCatalog){
          setLocal(null);setLocalBaseCatalog(null);try{localStorage.removeItem(STORAGE_KEY);}catch{}
        }
        setCatalogReady(true);
      })
      .catch(()=>{if(!controller.signal.aborted){setCatalogReady(true);setStorageNotice('No s’ha pogut actualitzar el catàleg. Mostrem la darrera còpia inclosa a la web; pots tornar-ho a provar recarregant.');}});
    return ()=>controller.abort();
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5500); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { document.title = `${location.page === 'recurs' ? resources.find(r=>r.id===location.id)?.title || 'Recurs' : ({inici:'L’Univers d’Aprenentatge', recursos:'Recursos d’aula', docents:'Eines docents', sobre:'Sobre MarcBook', editor:'Editar continguts', personal:'Espai personal'}[location.page] || 'MarcBook')} · MarcBook`; }, [location,resources]);
  function save(next, formBaseOverride) {
    const currentPublished = exportCatalog(published.map(validateResource));
    const changed = exportCatalog(next.map(validateResource)) !== currentPublished || Boolean(localBaseCatalog && localBaseCatalog !== currentPublished);
    let stored = true;
    const baseCatalog = local ? combineDraftBases(localBaseCatalog,formBaseOverride) : formBaseOverride!==undefined ? formBaseOverride : exportCatalog(published);
    try { if(changed) localStorage.setItem(STORAGE_KEY,serializeLocalDraft(next,baseCatalog)); else localStorage.removeItem(STORAGE_KEY); }
    catch { stored = false; setStorageNotice('El navegador no ha pogut guardar els canvis. Pots continuar i exportar el catàleg per conservar-los.'); }
    setLocal(changed ? next : null); setLocalBaseCatalog(changed ? baseCatalog : null); setShowLocal(true);
    return stored;
  }
  function publicationSent(result) {
    setLocalBaseCatalog(result.normalizedCatalog);
    try { localStorage.setItem(STORAGE_KEY,serializeLocalDraft(localResources || published,result.normalizedCatalog)); } catch {setStorageNotice('El catàleg s’ha enviat a GitHub. Exporta una còpia si el navegador no pot conservar-la.');}
  }
  function publicationLive(result) {
    setPublished(result.resources);
    setLocal(current=>{
      if(current && exportCatalog(current)!==result.normalizedCatalog)return current;
      try {localStorage.removeItem(STORAGE_KEY);}catch{}
      return null;
    });
    setLocalBaseCatalog(result.normalizedCatalog);setStorageNotice('');setNotice('Publicació comprovada: el catàleg ja és visible a la web.');
  }
  function open(item) { if (item.links.length === 1) window.open(item.links[0].url,'_blank','noopener,noreferrer'); else setLaunch(item); }
  const publicCount = resources.filter(r=>r.visible && r.subject !== 'personal' && r.status==='ready').length;
  const page = location.page;
  const nav = [['inici','Inici'],['recursos','Recursos d’aula'],['docents','Eines docents'],['sobre','Sobre MarcBook']];
  return <>
    <a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault(); mainRef.current.focus();}}>Ves al contingut</a>
    <header className="site-header">
      <a className="brand" href="#/inici" aria-label="MarcBook, inici"><IMG path="assets/logo-mb.webp" /><span>MarcBook</span><small>L’Univers<br/>d’Aprenentatge</small></a>
      <button className="menu-toggle icon-button" onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen?'Tanca el menú':'Obre el menú'}>{menuOpen ? <X/> : <List/>}</button>
      <nav aria-label="Principal" className={menuOpen?'open':''}>{nav.map(([id,label])=><a key={id} href={route(id)} className={page===id?'active':''} aria-current={page===id?'page':undefined}>{label}</a>)}</nav>
      <span className="header-note">Explora<br/>Experimenta<br/>Aprèn</span>
    </header>
    {local && <aside className="local-strip"><span><PencilSimple size={16}/>{showLocal?'Estàs veient els teus canvis locals.':'Estàs veient el catàleg publicat.'}</span><button onClick={()=>setShowLocal(!showLocal)}>{showLocal?'Veure catàleg publicat':'Veure canvis locals'}</button></aside>}
    {storageNotice && <aside className="storage-notice" role="alert">{storageNotice}</aside>}
    <main id="main-content" tabIndex={-1} ref={mainRef}>
      {page === 'inici' ? <Home resources={resources} go={go} open={open}/> :
       ['recursos','docents'].includes(page) ? <Catalog resources={resources} location={location} go={go} open={open} layout={layout} setLayout={setLayout}/> :
       page === 'recurs' ? <Detail item={resources.find(r=>r.id===location.id && !isPIResource(r) && r.visible!==false && r.subject!=='personal')} resources={resources} go={go} open={open} notify={setNotice}/> :
       page === 'editor' ? <Editor resources={localResources || published} published={published} baseCatalog={local ? localBaseCatalog : exportCatalog(published)} catalogReady={catalogReady} onSent={publicationSent} onLive={publicationLive} save={save} go={go} notify={setNotice}/> :
       page === 'sobre' ? <About count={publicCount} go={go}/> :
       page === 'personal' ? <Personal resources={resources} open={open}/> : <NotFound go={go}/>}
    </main>
    <footer className="site-footer"><a className="footer-brand" href="#/inici"><IMG path="assets/logo-mb.webp"/><strong>MarcBook</strong><span>L’Univers d’Aprenentatge</span></a><div><a href="#/personal">Personal</a><span aria-hidden="true">|</span><a href="#/editor">Editar continguts</a></div></footer>
    {notice && <div className="toast" role="status"><Check size={20}/>{notice}</div>}
    {launch && <LaunchDialog item={launch} close={()=>setLaunch(null)}/>}
  </>;
}

function Home({ resources, go, open }) {
  const [query,setQuery] = useState('');
  const itinerary = ['construccio-de-molecules','quimilab','la-balanca-quimica'].map(id=>resources.find(r=>r.id===id && r.visible && r.status==='ready')).filter(Boolean);
  const paths = [
    {title:'Ciències',image:'path-science',text:'Simulacions i activitats interactives per treballar les ciències amb el teu grup.',page:'recursos',filters:{subject:'science'}},
    {title:'Eines docents',image:'path-teacher',text:'Recursos per organitzar, avaluar i dinamitzar l’aula.',page:'docents'}
  ];
  return <div className="home">
    <section className="hero" aria-labelledby="hero-title"><IMG className="hero-art" path="assets/hero-marc-classroom.webp" alt="En Marc, il·lustrat amb ulleres i jaqueta taronja, en una aula lluminosa." fetchPriority="high"/>
      <div className="hero-copy"><h1 id="hero-title">L’Univers d’Aprenentatge</h1><p>Simulacions, activitats i eines per a les teves classes.</p>
      <form className="search-box" onSubmit={e=>{e.preventDefault();go('recursos',{q:query})}}><MagnifyingGlass size={25}/><label className="sr-only" htmlFor="home-search">Quin recurs necessites per a l’aula?</label><input id="home-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Quin recurs necessites per a l’aula?"/><Button type="submit">Buscar <ArrowRight/></Button></form>
      <div className="topic-pills" aria-label="Temes per treballar a l’aula">{[['Àtoms','Àtoms i molècules'],['Forces','Forces'],['Sistema solar','Univers'],['Reaccions químiques','Reaccions químiques'],['Cèl·lules','Cèl·lules']].map(([label,topic])=><button key={label} onClick={()=>go('recursos',{topic})}>{label}</button>)}<button onClick={()=>go('recursos')}>Més temes…</button></div></div>
    </section>
    <section className="pathways" aria-labelledby="pathways-title"><h2 className="brush-heading" id="pathways-title">Tria per on vols començar</h2><div className="path-grid">{paths.map(p=><article className="path-card" key={p.title}><IMG path={`assets/${p.image}.webp`} alt=""/><h3>{p.title}</h3><p>{p.text}</p><Button onClick={()=>go(p.page,p.filters)}>Explorar <ArrowRight/></Button></article>)}</div></section>
    {itinerary.length > 0 && <section className="itinerary" aria-labelledby="itinerary-title"><div className="section-title"><h2 className="brush-heading" id="itinerary-title">Un itinerari per treballar la química</h2><p>Combina els tres recursos per relacionar models, fórmules i reaccions amb el teu grup.</p><span className="hand-note"><span>De la teoria<br/>a la pràctica</span><ArrowRight/></span></div><div className="itinerary-grid">{itinerary.map((item,i)=><React.Fragment key={item.id}><ResourceCard item={item} open={open} compact/>{i<itinerary.length-1 && <ArrowRight className="itinerary-arrow" size={30}/>}</React.Fragment>)}</div></section>}
  </div>;
}

function ResourceCard({item,open,compact=false,list=false}) {
  return <article className={`resource-card ${compact?'compact':''} ${list?'list-card':''}`}>
    <a className="resource-image" href={route(`recurs/${item.id}`)} tabIndex={-1} aria-hidden="true"><IMG path={compact && item.id==='la-balanca-quimica' && item.image==='assets/resource-reactions.webp' ? 'assets/itinerary-reactions.webp' : item.image} loading="lazy"/>{!compact && <span className="image-kind">{item.kind}</span>}</a>
    <div className="resource-body"><h3><a href={route(`recurs/${item.id}`)}>{item.title}</a></h3>{!compact && <Meta item={item}/>}<p className="resource-summary">{item.description}</p>{compact && <Meta item={item}/>}<div className="card-actions">{item.status==='ready' ? <Button onClick={()=>open(item)}>Obrir <ArrowRight/></Button> : <span className="status-soon">En preparació</span>}<a className="detail-link" href={route(`recurs/${item.id}`)}><FileText size={19}/>Veure la fitxa</a></div></div>
  </article>;
}

function Catalog({resources,location,go,open,layout,setLayout}) {
  const [filtersOpen,setFiltersOpen] = useState(false);
  const page=location.page;
  const forced = page==='docents'?'teacher':'';
  const filters={...location.filters,...(forced?{subject:forced}:{})};
  const items=filterResources(resources,filters);
  const [q,setQ]=useState(filters.q || '');
  useEffect(()=>setQ(filters.q || ''),[filters.q]);
  const update=(key,value)=>go(page,{...location.filters,[key]:value,...(key==='subject'||key==='course'?{unit:''}:{})});
  const units=[...new Set(filterResources(resources,{subject:filters.subject,course:filters.course}).map(r=>r.unit).filter(Boolean))].sort();
  const topics=[...new Set(filterResources(resources,{subject:filters.subject}).map(r=>r.topic))].sort();
  const title=page==='docents'?'Més temps per ensenyar':'L’Univers d’Aprenentatge';
  const subtitle=page==='docents'?'Organitza, acompanya i avalua amb eines creades des de l’aula.':'Tria activitats i simulacions per preparar les teves classes.';
  return <div className="catalog-page page-shell"><section className="catalog-banner"><div><h1>{title}</h1><p>{subtitle}</p></div><form className="search-box" onSubmit={e=>{e.preventDefault();update('q',q)}}><MagnifyingGlass/><label className="sr-only" htmlFor="catalog-search">Cerca un recurs, un tema o una UT</label><input id="catalog-search" placeholder="Cerca un recurs, un tema o una UT…" value={q} onChange={e=>setQ(e.target.value)}/><button className="search-submit icon-button" type="submit" aria-label="Cerca"><ArrowRight/></button></form><BookOpen className="banner-symbol" size={55} weight="thin"/></section>
    <div className="catalog-layout"><aside className={`filters ${filtersOpen?'filters-open':''}`} aria-label="Filtres"><div className="filter-header"><strong>Afina la cerca</strong><button className="icon-button mobile-only" aria-label="Tanca els filtres" onClick={()=>setFiltersOpen(false)}><X/></button></div>
      {!forced && <FilterGroup title="Àmbit" name="subject" options={[['','Tots els àmbits'],...Object.entries(SUBJECTS).filter(([id])=>id!=='personal')]} value={filters.subject||''} change={v=>update('subject',v)}/>}
      <FilterGroup title="Curs" name="course" options={['','1r','2n','3r','4t'].map(v=>[v,v||'Tots'])} value={filters.course||''} change={v=>update('course',v)}/>
      <label className="filter-select">Unitat de treball<select value={filters.unit||''} onChange={e=>update('unit',e.target.value)}><option value="">Totes les UT</option>{units.map(v=><option key={v} value={v}>UT {v}</option>)}</select></label>
      <FilterGroup title="Llengua" name="language" options={[['','Totes'],...LANGUAGES.map(l=>[l,l])]} value={filters.language||''} change={v=>update('language',v)}/>
      <label className="filter-select">Tema<select value={filters.topic||''} onChange={e=>update('topic',e.target.value)}><option value="">Tots els temes</option>{topics.map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="filter-select">Tipus de recurs<select value={filters.kind||''} onChange={e=>update('kind',e.target.value)}><option value="">Tots els tipus</option>{KINDS.map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="filter-select">Disponibilitat<select value={filters.status||''} onChange={e=>update('status',e.target.value)}><option value="">Tots</option><option value="ready">Disponibles</option><option value="soon">En preparació</option></select></label>
      <button className="text-button clear-filters" onClick={()=>{go(page);setFiltersOpen(false)}}>Neteja els filtres</button>
    </aside><section className="catalog-results"><div className="results-heading"><h2>{page==='docents'?'Eines per a la pràctica docent':'Recursos per a l’aula'}</h2><div className="result-controls"><button className="icon-button mobile-only" aria-label="Obre els filtres" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}><Funnel/></button><div className="view-switch"><button aria-label="Vista de targetes" aria-pressed={layout==='grid'} className={layout==='grid'?'selected':''} onClick={()=>setLayout('grid')}><SquaresFour/></button><button aria-label="Vista de llista" aria-pressed={layout==='list'} className={layout==='list'?'selected':''} onClick={()=>setLayout('list')}><List/></button></div><span role="status">{items.length} {items.length===1?'recurs':'recursos'}</span></div></div>
      {Object.entries(location.filters).filter(([,v])=>v).length>0 && <div className="active-filters">{Object.entries(location.filters).filter(([,v])=>v).map(([key,value])=><button key={key} onClick={()=>update(key,'')} aria-label={`Treu el filtre ${value}`}>{SUBJECTS[value] || (key==='unit'?`UT ${value}`:key==='status'?value==='ready'?'Disponibles':'En preparació':value)}<X size={13}/></button>)}</div>}
      {items.length ? <div className={`resources-grid ${layout==='list'?'resources-list':''}`}>{items.map(item=><ResourceCard key={item.id} item={item} open={open} list={layout==='list'}/>)}</div> : <div className="empty-state"><MagnifyingGlass size={42} weight="thin"/><h3>No hem trobat cap recurs</h3><p>Prova una altra paraula o amplia els filtres.</p><Button onClick={()=>go(page)}>Veure tots els recursos <ArrowRight/></Button></div>}
    </section></div>
  </div>;
}
function FilterGroup({title,name,options,value,change}) { return <fieldset className="filter-group"><legend>{title}</legend>{options.map(([id,label])=><label key={id}><input type="radio" name={name} checked={value===id} onChange={()=>change(id)}/>{label}</label>)}</fieldset>; }

function Detail({item,resources,go,open,notify}) {
  if(!item) return <NotFound go={go}/>;
  const labels=explanationLabels(item);
  const related=resources.filter(r=>r.id!==item.id && r.visible && r.status==='ready' && r.subject!=='personal' && r.subject===item.subject && (item.unit?r.unit===item.unit:r.topic===item.topic)).slice(0,3);
  const share=async()=>{try{await navigator.clipboard.writeText(window.location.href);notify('Enllaç de la fitxa copiat.')}catch{notify('Pots copiar l’enllaç de la barra d’adreces.')}};
  return <article className="detail-page page-shell"><div className="breadcrumb"><a href="#/inici">Inici</a><span>/</span><a href={route(item.subject==='teacher'?'docents':'recursos',item.subject==='science'?{subject:'science'}:{})}>{SUBJECTS[item.subject]}</a><span>/</span><span>{item.title}</span></div>
    <section className="detail-hero"><div><span className="eyebrow">{item.topic} · {item.kind}</span><h1>{item.title}</h1><Meta item={item}/><p className="detail-intro">{item.detail || item.description}</p><div className="detail-actions">{item.status==='ready'?<Button onClick={()=>open(item)}>Obrir el recurs <ArrowSquareOut/></Button>:<span className="status-soon">En preparació</span>}<button className="subtle-button" onClick={share}><LinkSimple/>Comparteix la fitxa</button><button className="icon-button" aria-label="Imprimeix la fitxa" onClick={()=>window.print()}><Printer/></button></div>{item.status==='ready' && <p className="external-note">El recurs s’obre en una pestanya nova.</p>}</div><IMG path={item.image} alt={`Il·lustració sobre ${item.topic.toLowerCase()}`} className="detail-art"/></section>
    {item.status==='ready' ? <div className="detail-content"><div>{item.teachingValue && <section className="info-section"><h2>Per què és útil?</h2><p>{item.teachingValue}</p></section>}<section className="info-section"><h2>{labels.objectives}</h2><ul>{item.objectives.map(v=><li key={v}>{v}</li>)}</ul></section><section className="info-section"><h2>{labels.steps}</h2><p className="muted">{labels.proposal}</p><ol className="classroom-steps">{item.steps.map((v,i)=><li key={v}><span>{i+1}</span><p>{v}</p></li>)}</ol></section><section className="info-section"><h2>{labels.evidence}</h2><ul>{item.evidence.map(v=><li key={v}>{v}</li>)}</ul></section></div><aside className="detail-aside"><h2>Abans de començar</h2><ul>{item.materials.map(v=><li key={v}><Check size={18}/>{v}</li>)}</ul><h3>Versions disponibles</h3>{item.links.map((l,i)=><a key={i} className="version-link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}<ArrowSquareOut size={17}/></a>)}<p className="muted">La portada i el catàleg són d’accés lliure. Cada eina conserva el seu funcionament i les seves opcions de desament.</p></aside></div> : <div className="coming-soon"><h2>Aquest recurs s’està preparant</h2><p>La fitxa estarà disponible quan es completi l’activitat.</p><a href="#/recursos" className="detail-link">Explora els recursos disponibles <ArrowRight/></a></div>}
    {related.length>0 && <section className="related-section"><h2>Altres recursos per al teu grup</h2><div className="resources-grid">{related.map(r=><ResourceCard key={r.id} item={r} open={open}/>)}</div></section>}
  </article>;
}

function LaunchDialog({item,close}) {
  const ref=useRef(null);
  useEffect(()=>{const dialog=ref.current;dialog.showModal();return ()=>dialog.close()},[]);
  return <dialog ref={ref} className="launch-dialog" onCancel={close} onClick={e=>{if(e.target===ref.current)close()}}><button className="close-dialog icon-button" aria-label="Tanca" onClick={close}><X/></button><span className="eyebrow">Tria la versió</span><h2>{item.title}</h2><p>Tria un dels accessos disponibles.</p><div>{item.links.map((l,i)=><a className="version-link" key={i} href={l.url} target="_blank" rel="noopener noreferrer" onClick={close}>{l.label}<ArrowSquareOut/></a>)}</div></dialog>;
}

function About({count,go}) { return <div className="about-page page-shell"><section className="about-hero"><div><span className="eyebrow">Creat des de l’aula</span><h1>La curiositat és un bon començament.</h1><p className="detail-intro">Soc en Marc Pérez Casals, docent de secundària a Andorra. MarcBook és un banc de recursos per al professorat, amb activitats i eines que connecten les preguntes amb l’aprenentatge.</p><p>Va néixer com una col·lecció de recursos per a les meves classes. Aquí hi trobaràs simulacions, jocs, guies i orientacions per preparar les classes i acompanyar l’alumnat.</p><Button onClick={()=>go('recursos')}>Explora els {count} recursos disponibles <ArrowRight/></Button></div><IMG path="assets/hero-marc-classroom.webp" alt="Il·lustració d’en Marc en una aula."/></section><div className="about-values"><section><span>01</span><h2>Aprendre explorant</h2><p>Propostes perquè l’alumnat faci prediccions, posi a prova idees i expliqui els resultats. Les eines ajuden el docent a observar aquest procés.</p></section><section><span>02</span><h2>Autonomia amb orientació</h2><p>Activitats per desenvolupar l’autonomia de l’alumnat i orientacions perquè cada docent les adapti al seu grup.</p></section><section><span>03</span><h2>Connexions entre idees</h2><p>Fitxes i itineraris per combinar activitats i construir un recorregut d’aprenentatge coherent amb els objectius del grup.</p></section></div><section className="about-contact"><h2>Continuem compartint idees</h2><p>També pots visitar el Racó TIC-TAC per descobrir altres propostes educatives.</p><div><a className="subtle-button" href="https://tice-easeo.web.app/" target="_blank" rel="noopener noreferrer">Visita el Racó TIC-TAC <ArrowSquareOut/></a><a className="subtle-button" href="mailto:mperezc@educand.ad">Contacta amb en Marc <ArrowRight/></a></div></section></div>; }
function Personal({resources,open}) { return <div className="personal-page page-shell"><a className="back-link" href="#/inici"><ArrowLeft/>Torna a MarcBook</a><span className="eyebrow">Accessos personals</span><h1>El meu petit racó</h1><p className="detail-intro">Les aplicacions personals, a mà.</p><div className="personal-links">{resources.filter(r=>r.subject==='personal' && r.visible!==false).map(r=><article key={r.id}><BookOpen size={28} weight="thin"/><h2>{r.title}</h2><Button onClick={()=>open(r)}>Obrir <ArrowSquareOut/></Button></article>)}</div></div>; }
function NotFound({go}) { return <div className="empty-state page-shell"><BookOpen size={48} weight="thin"/><h1>No trobem aquesta pàgina</h1><p>El recurs pot haver canviat o estar ocult.</p><Button onClick={()=>go('recursos')}>Torna al catàleg <ArrowRight/></Button></div>; }

function Editor({resources,published,baseCatalog,catalogReady,onSent,onLive,save,go,notify}) {
  const [publicationBusy,setPublicationBusy]=useState(false);
  const [recovered] = useState(()=>{try {return readEditorDraft(localStorage.getItem('marcbook-editor-draft-v1'))}catch{return null}});
  const [selected,setSelected]=useState(recovered?.selected || null),[form,setForm]=useState(recovered?.form || EMPTY),[error,setError]=useState(''),[search,setSearch]=useState(''),[pendingImport,setPendingImport]=useState(null),[preview,setPreview]=useState(false),[dirty,setDirty]=useState(Boolean(recovered));
  const [formBase,setFormBase]=useState(recovered ? recovered.baseCatalog : baseCatalog);
  const labels=explanationLabels(form);
  const fileRef=useRef(null);
  const clearDraft=()=>{try{localStorage.removeItem('marcbook-editor-draft-v1')}catch{}};
  const edit=(item)=>{if(publicationBusy || !catalogReady)return;if(dirty && !window.confirm('Tens canvis sense incorporar al catàleg. Vols descartar-los i canviar de fitxa?'))return;clearDraft();setSelected(item?.id || 'new');setForm(item?structuredClone(item):structuredClone(EMPTY));setError('');setDirty(false);setPreview(false);setFormBase(baseCatalog || exportCatalog(published))};
  const set=(key,value)=>{setForm(f=>({...f,[key]:value}));setDirty(true)};
  useEffect(()=>{if(dirty && selected){try{localStorage.setItem('marcbook-editor-draft-v1',serializeEditorDraft(selected,form,formBase))}catch{}}},[form,selected,dirty,formBase]);
  useEffect(()=>{
    if(!dirty && selected && selected!=='new'){
      const current=resources.find(r=>r.id===selected);
      try{if(current && JSON.stringify(validateResource(form))===JSON.stringify(validateResource(current)))setFormBase(baseCatalog || exportCatalog(published));}catch{}
    }
  },[resources,published,baseCatalog,selected,dirty]);
  useEffect(()=>{const warn=e=>{if(dirty){e.preventDefault();e.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);
  function submit(e) {
    e.preventDefault();setError('');if(publicationBusy || !catalogReady)return;
    try { const next=validateResource({...form,id:selected==='new'?uniqueId(form.title,resources):selected});const stored=save(selected==='new'?[...resources,next]:resources.map(r=>r.id===selected?next:r),formBase);setSelected(next.id);setForm(next);setDirty(false);if(stored)clearDraft();notify(stored?'Canvis guardats en aquest navegador.':'Canvis a la vista local. Exporta el catàleg per conservar-los.'); } catch(e){setError(e.message)}
  }
  function download() {const url=URL.createObjectURL(new Blob([exportCatalog(resources)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`marcbook-cataleg-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);notify('Catàleg exportat per conservar-lo o publicar-lo.');}
  async function readImport(e) {setError('');const file=e.target.files?.[0];if(!file)return;try{if(file.size>3000000)throw new Error('El fitxer és massa gran. El límit és de 3 MB.');setPendingImport(importCatalog(await file.text()));}catch(e){setError(e.message)}e.target.value='';}
  const listed=resources.filter(r=>r.title.toLocaleLowerCase('ca').includes(search.toLocaleLowerCase('ca')));
  return <div className="editor-page page-shell"><div className="editor-title"><div><span className="eyebrow">El teu espai de continguts</span><h1>Editar MarcBook</h1></div><div className="editor-tools"><Button className="secondary" onClick={download}><DownloadSimple/>Exporta el catàleg</Button><Button className="secondary" disabled={publicationBusy || !catalogReady} onClick={()=>fileRef.current.click()}><UploadSimple/>Importa</Button><Button disabled={publicationBusy || !catalogReady} onClick={()=>edit(null)}><Plus/>Nou recurs</Button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={readImport}/></div></div>
    <div className="editor-explainer"><FloppyDisk size={25}/><p><strong>Els canvis es guarden en aquest navegador.</strong> Pots editar i previsualitzar les fitxes sense entrar al codi. Exporta el catàleg per tenir-ne una còpia i importar-lo en un altre dispositiu. Quan estiguin a punt, publica el catàleg perquè els canvis siguin visibles per a tothom.</p></div>
    <PublishingPanel resources={resources} published={published} baseCatalog={baseCatalog} dirty={dirty} catalogReady={catalogReady} onSent={onSent} onLive={onLive} onBusy={setPublicationBusy}/>
    {error && <div className="form-error" role="alert"><WarningCircle/>{error}</div>}
    {pendingImport && <section className="import-confirm"><h2>Importar {pendingImport.length} recursos?</h2><p>Substituirà el catàleg local. Exporta abans una còpia si vols conservar els canvis actuals.</p><Button onClick={()=>{const stored=save(pendingImport);setPendingImport(null);setSelected(null);setDirty(false);if(stored)clearDraft();notify(stored?'Catàleg importat i guardat localment.':'Catàleg importat a la vista local. Exporta’l per conservar-lo.')}}>Aplica la importació</Button><button className="subtle-button" onClick={()=>setPendingImport(null)}>Cancel·la</button></section>}
    <div className="editor-layout"><aside className="editor-list"><label className="sr-only" htmlFor="editor-search">Cerca una fitxa</label><div className="search-small"><MagnifyingGlass/><input id="editor-search" placeholder="Cerca una fitxa…" value={search} onChange={e=>setSearch(e.target.value)}/></div><p className="muted">{resources.length} fitxes · inclou ocults i personals</p><div>{listed.map(r=><button key={r.id} className={selected===r.id?'selected':''} onClick={()=>edit(r)}><span>{r.title}<small>{r.subject==='personal'?'Personal':SUBJECTS[r.subject]}</small></span>{r.visible===false?<EyeSlash/>:<PencilSimple/>}</button>)}</div></aside>
    {!selected?<section className="editor-welcome"><IMG path="assets/path-teacher.webp" alt=""/><h2>Una nova idea per compartir?</h2><p>Tria una fitxa per actualitzar-la o crea un recurs nou. Podràs afegir-hi explicacions, orientacions d’aula i accessos en diverses llengües.</p><Button disabled={publicationBusy || !catalogReady} onClick={()=>edit(null)}><Plus/>Crea un recurs</Button></section>:<section className="editor-work"><div className="edit-heading"><h2>{selected==='new'?'Nou recurs':form.title}</h2><button className="subtle-button" onClick={()=>setPreview(!preview)}><Eye/>{preview?'Continua editant':'Previsualitza'}</button></div>
      {preview?<div className="editor-preview"><IMG path={form.image} alt=""/><h2>{form.title||'Títol del recurs'}</h2><Meta item={form}/><p>{form.detail||form.description||'El resum apareixerà aquí.'}</p>{form.teachingValue && <><h3>Per què és útil?</h3><p>{form.teachingValue}</p></>}<h3>{labels.objectives}</h3><ul>{form.objectives.map((v,i)=><li key={i}>{v}</li>)}</ul><h3>{labels.steps}</h3><ol>{form.steps.map((v,i)=><li key={i}>{v}</li>)}</ol><h3>{labels.evidence}</h3><ul>{form.evidence.map((v,i)=><li key={i}>{v}</li>)}</ul><h3>Abans de començar</h3><ul>{form.materials.map((v,i)=><li key={i}>{v}</li>)}</ul><button className="subtle-button" onClick={()=>setPreview(false)}><ArrowLeft/>Torna a l’edició</button></div>:<form className="resource-form" onSubmit={submit}><fieldset className="editor-fields" disabled={publicationBusy || !catalogReady}>
        <label>Títol *<input required maxLength={160} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
        <label>Resum per a la targeta *<small>Presenta al professorat què permet treballar el recurs.</small><textarea required rows={2} maxLength={600} value={form.description} onChange={e=>set('description',e.target.value)}/></label>
        <label>Explicació del recurs<small>Explica al docent com funciona i per a què el pot utilitzar.</small><textarea rows={4} value={form.detail} onChange={e=>set('detail',e.target.value)}/></label>
        <label>Per què és útil?<small>Explica’n el valor educatiu o docent en una o dues frases.</small><textarea rows={2} maxLength={1000} value={form.teachingValue || ''} onChange={e=>set('teachingValue',e.target.value)}/></label>
        <div className="form-columns"><label>Àmbit<select value={form.subject} onChange={e=>set('subject',e.target.value)}>{Object.entries(SUBJECTS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>Tipus<select value={form.kind} onChange={e=>set('kind',e.target.value)}>{KINDS.map(v=><option key={v}>{v}</option>)}</select></label><label>Curs<select value={form.course} onChange={e=>set('course',e.target.value)}><option value="">Sense curs específic</option>{['1r','2n','3r','4t'].map(v=><option key={v}>{v}</option>)}</select></label><label>Unitat de treball<input value={form.unit} placeholder="p. ex. 4.4" onChange={e=>set('unit',e.target.value)}/></label><label>Tema<input value={form.topic} placeholder="p. ex. Reaccions químiques" onChange={e=>set('topic',e.target.value)}/></label><label>Estat<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="ready">Disponible</option><option value="soon">En preparació</option></select></label></div>
        <fieldset className="language-checks"><legend>Llengües del recurs</legend>{LANGUAGES.map(lang=><label key={lang}><input type="checkbox" checked={form.languages.includes(lang)} onChange={e=>set('languages',e.target.checked?[...form.languages,lang]:form.languages.filter(l=>l!==lang))}/>{lang}</label>)}</fieldset>
        <fieldset className="links-fields"><legend>Accessos al recurs</legend>{form.links.map((l,i)=><div className="link-row" key={i}><label>Nom de l’accés<input value={l.label} placeholder="Castellà" onChange={e=>set('links',form.links.map((v,j)=>j===i?{...v,label:e.target.value}:v))}/></label><label>Adreça web completa<input type="url" value={l.url} placeholder="https://…" onChange={e=>set('links',form.links.map((v,j)=>j===i?{...v,url:e.target.value}:v))}/></label><button type="button" className="icon-button" aria-label={`Treu l’accés ${i+1}`} onClick={()=>set('links',form.links.filter((_,j)=>i!==j))}><X/></button></div>)}<button type="button" className="subtle-button" onClick={()=>set('links',[...form.links,{label:'',url:''}])}><Plus/>Afegeix un accés</button></fieldset>
        <label>Il·lustració<select value={Object.keys(DRAWINGS).some(k=>`assets/${k}.webp`===form.image)?form.image:'custom'} onChange={e=>set('image',e.target.value==='custom'?'https://':e.target.value)}>{Object.entries(DRAWINGS).map(([id,label])=><option key={id} value={`assets/${id}.webp`}>{label}</option>)}<option value="custom">Imatge amb adreça pròpia</option></select></label>{!form.image.startsWith('assets/') && <label>Adreça de la imatge<input type="url" value={form.image} onChange={e=>set('image',e.target.value)}/></label>}
        {[['objectives',isTeacherTool(form)?'Accions que facilita':'Objectius per a l’alumnat'],['steps',isTeacherTool(form)?'Passos per utilitzar l’eina':'Passos de la proposta d’aula'],['evidence',isTeacherTool(form)?'Informació que es pot recollir':'Evidències que es poden recollir'],['materials','Materials i requisits']].map(([key,label])=><label key={key}>{label}<small>{key==='steps'?'Una proposta per línia, adreçada al docent.':'Una idea per línia.'}</small><textarea rows={3} value={form[key].join('\n')} onChange={e=>set(key,e.target.value.split('\n'))}/></label>)}
        <label>Paraules clau<input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="molècules química enllaços…"/></label>
        <label className="visibility-check"><input type="checkbox" checked={form.visible} onChange={e=>set('visible',e.target.checked)}/>Mostra la fitxa al catàleg</label>
        <div className="form-save"><Button type="submit"><FloppyDisk/>Guarda els canvis locals</Button>{selected!=='new' && <button type="button" className="subtle-button" disabled={dirty || !form.visible || form.subject==='personal'} onClick={()=>go(`recurs/${selected}`)}>Veure la fitxa <ArrowRight/></button>}<span>{dirty?'Tens canvis sense guardar.':'Fitxa al dia.'}</span></div>
      </fieldset></form>}
    </section>}
    </div>
  </div>;
}
