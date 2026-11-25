const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const scientific = bird => normalize(bird.scientificName || bird.guideScientificName);
// Symmetric visual comparison groups. Taxonomic fallback is labelled separately in the UI.
// These are editorial suggestions, not a numerical measure of biological similarity.
const visualGroups = [
  ["Circus cyaneus", "Circus pygargus"],
  ["Falco eleonorae", "Falco subbuteo"],
  ["Gulosus aristotelis", "Phalacrocorax carbo"],
  ["Sterna hirundo", "Thalasseus sandvicensis"],
  ["Curruca iberiae", "Curruca melanocephala", "Curruca communis"],
  ["Curruca hortensis", "Sylvia atricapilla", "Curruca melanocephala"],
  ["Calidris minuta", "Calidris temminckii"],
  ["Calidris canutus", "Calidris ferruginea"],
  ["Pernis apivorus", "Buteo buteo"],
  ["Circus pygargus", "Circus aeruginosus"],
  ["Fringilla montifringilla", "Fringilla coelebs"],
  ["Monticola saxatilis", "Monticola solitarius"],
  ["Scolopax rusticola", "Gallinago gallinago"],
  ["Turdus iliacus", "Turdus philomelos"],
  [
    "Hieraaetus pennatus",
    "Aquila fasciata",
    "Aquila chrysaetos",
    "Aquila adalberti",
    "Circaetus gallicus",
    "Pandion haliaetus",
    "Buteo buteo"
  ],
  [
    "Circus aeruginosus",
    "Accipiter nisus",
    "Buteo buteo",
    "Cuculus canorus",
    "Falco peregrinus"
  ],
  [
    "Neophron percnopterus",
    "Gypaetus barbatus",
    "Gyps fulvus",
    "Aegypius monachus"
  ],
  [
    "Puffinus mauretanicus",
    "Calonectris diomedea",
    "Puffinus yelkouan"
  ],
  [
    "Tachymarptis melba",
    "Apus apus"
  ],
  [
    "Tachymarptis melba",
    "Apus apus",
    "Delichon urbicum",
    "Cecropis rufula",
    "Riparia riparia",
    "Ptyonoprogne rupestris",
    "Hirundo rustica"
  ],
  [
    "Acrocephalus arundinaceus",
    "Acrocephalus scirpaceus",
    "Acrocephalus melanopogon",
    "Locustella naevia",
    "Cettia cetti",
    "Cisticola juncidis"
  ],
  [
    "Hippolais polyglotta",
    "Phylloscopus collybita",
    "Phylloscopus trochilus",
    "Phylloscopus bonelli",
    "Phylloscopus sibilatrix"
  ],
  [
    "Lanius meridionalis",
    "Lanius senator",
    "Lanius collurio"
  ],
  [
    "Regulus ignicapilla",
    "Regulus regulus"
  ],
  [
    "Tachybaptus ruficollis",
    "Podiceps nigricollis",
    "Podiceps cristatus",
    "Podiceps grisegena",
    "Gavia arctica"
  ],
  [
    "Carduelis carduelis",
    "Serinus serinus",
    "Linaria cannabina",
    "Fringilla coelebs",
    "Chloris chloris"
  ],
  [
    "Charadrius hiaticula",
    "Charadrius alexandrinus",
    "Charadrius dubius",
    "Pluvialis squatarola"
  ],
  [
    "Recurvirostra avosetta",
    "Himantopus himantopus"
  ],
  [
    "Gallinago gallinago",
    "Lymnocryptes minimus"
  ],
  [
    "Numenius arquata",
    "Limosa lapponica",
    "Limosa limosa"
  ],
  [
    "Calidris pugnax",
    "Calidris ferruginea",
    "Calidris temminckii",
    "Calidris alpina"
  ],
  [
    "Tringa totanus",
    "Tringa nebularia",
    "Tringa glareola",
    "Tringa ochropus",
    "Actitis hypoleucos"
  ],
  [
    "Ardea alba",
    "Ardea purpurea",
    "Ardea cinerea",
    "Bubulcus ibis",
    "Egretta garzetta",
    "Nycticorax nycticorax",
    "Botaurus minutus",
    "Ardeola ralloides",
    "Botaurus stellaris"
  ],
  [
    "Ardea alba",
    "Egretta garzetta",
    "Platalea leucorodia"
  ],
  [
    "Ciconia ciconia",
    "Ciconia nigra",
    "Grus grus"
  ],
  [
    "Cygnus olor",
    "Cygnus atratus"
  ],
  [
    "Tadorna tadorna",
    "Tadorna ferruginea",
    "Anser cygnoides",
    "Anser anser",
    "Branta leucopsis",
    "Branta canadensis",
    "Alopochen aegyptiaca"
  ],
  [
    "Anas platyrhynchos",
    "Anas acuta",
    "Spatula clypeata",
    "Mareca strepera",
    "Mareca penelope",
    "Spatula querquedula",
    "Anas crecca",
    "Anas zonorhyncha"
  ],
  [
    "Aythya ferina",
    "Aythya fuligula",
    "Aythya nyroca",
    "Netta rufina"
  ],
  [
    "Columba livia",
    "Columba livia domestica",
    "Columba palumbus",
    "Streptopelia turtur",
    "Streptopelia decaocto"
  ],
  [
    "Corvus corax",
    "Corvus corone"
  ],
  [
    "Corvus corax",
    "Corvus corone",
    "Pica pica",
    "Garrulus glandarius"
  ],
  [
    "Psittacula krameri",
    "Myiopsitta monachus"
  ],
  [
    "Saxicola rubicola",
    "Saxicola rubetra",
    "Luscinia svecica",
    "Phoenicurus ochruros",
    "Erithacus rubecula",
    "Oenanthe leucura"
  ],
  [
    "Motacilla alba",
    "Motacilla flava",
    "Motacilla cinerea",
    "Motacilla grandis"
  ],
  [
    "Gelochelidon nilotica",
    "Chlidonias hybrida",
    "Hydroprogne caspia"
  ],
  [
    "Bubo bubo",
    "Strix aluco",
    "Asio otus",
    "Athene noctua",
    "Tyto alba",
    "Otus scops"
  ],
  [
    "Sturnus vulgaris",
    "Sturnus unicolor"
  ],
  [
    "Fulica cristata",
    "Fulica atra"
  ],
  [
    "Fulica cristata",
    "Fulica atra",
    "Porphyrio porphyrio",
    "Gallinula chloropus"
  ],
  [
    "Porzana porzana",
    "Zapornia pusilla",
    "Rallus aquaticus",
    "Gallinula chloropus"
  ],
  [
    "Larus michahellis",
    "Larus fuscus",
    "Chroicocephalus genei",
    "Ichthyaetus audouinii",
    "Hydrocoloeus minutus",
    "Chroicocephalus ridibundus"
  ],
  [
    "Anthus spinoletta",
    "Anthus trivialis",
    "Anthus richardi"
  ],
  [
    "Turdus pilaris",
    "Turdus viscivorus",
    "Turdus merula",
    "Monticola solitarius",
    "Turdus philomelos"
  ],
  [
    "Cyanistes caeruleus",
    "Parus major",
    "Aegithalos caudatus",
    "Lophophanes cristatus",
    "Periparus ater",
    "Remiz pendulinus"
  ],
  [
    "Ficedula hypoleuca",
    "Muscicapa striata"
  ],
  [
    "Delichon urbicum",
    "Cecropis rufula",
    "Riparia riparia",
    "Ptyonoprogne rupestris",
    "Hirundo rustica"
  ],
  [
    "Passer domesticus",
    "Passer montanus"
  ],
  [
    "Passer domesticus",
    "Passer montanus",
    "Emberiza calandra",
    "Emberiza schoeniclus",
    "Emberiza cia"
  ],
  [
    "Alectoris rufa",
    "Perdix perdix hispaniensis",
    "Coturnix coturnix",
    "Phasianus colchicus",
    "Pterocles alchata",
    "Tetrax tetrax"
  ],
  [
    "Sitta europaea",
    "Certhia brachydactyla"
  ],
  [
    "Dendrocoptes medius",
    "Dryobates minor",
    "Picus viridis",
    "Dendrocopos major",
    "Yungipicus kizuki"
  ],
  [
    "Luscinia megarhynchos",
    "Cettia cetti"
  ],
  [
    "Curruca melanocephala",
    "Sylvia atricapilla"
  ],
  [
    "Falco tinnunculus",
    "Falco naumanni",
    "Falco peregrinus"
  ]
];
const size = bird => {
    const values = String(bird.guide?.ecology?.lengthCm || '').match(/\d+(?:[.,]\d+)?/g) || [];
    return values.length ? values.reduce((sum, value) => sum + Number(value.replace(',', '.')), 0) / values.length : 0;
};
export function findSimilarBirds(source, all, limit = 6) {
    if (!source) return [];
    const sourceName = scientific(source);
    const genus = sourceName.split(' ')[0];
    const groups = visualGroups.filter(group => group.some(name => normalize(name) === sourceName));
    const seen = new Set([sourceName || normalize(source.commonName)]);
    const candidates = [];
    for (const bird of all) {
        const name = scientific(bird), identity = name || normalize(bird.commonName);
        if (bird === source || seen.has(identity)) continue;
        if (!bird.scientificName && all.some(other => other.scientificName && scientific(other) === name)) continue;
        seen.add(identity);
        const visual = groups.filter(group => group.some(member => normalize(member) === name)).length;
        const sameGenus = genus && genus === name.split(' ')[0];
        const sameFamily = source.family && source.family === bird.family;
        const sameOrder = source.order && source.order === bird.order && source.order !== 'Passeriformes';
        if (!visual && !sameGenus && !sameFamily && !sameOrder) continue;
        const a = size(source), z = size(bird);
        const proximity = a && z ? Math.min(a, z) / Math.max(a, z) : 0;
        if (!visual && !sameGenus && !sameFamily && proximity < .55) continue;
        candidates.push({bird, reason:visual ? 'Aspecte semblant' : sameGenus ? 'Mateix gènere' : sameFamily ? 'Mateixa família' : 'Mateix ordre',
            score:visual * 100 + (sameGenus ? 30 : 0) + (sameFamily ? 15 : 0) + proximity * 10});
    }
    return candidates.sort((a, b) => b.score - a.score || a.bird.commonName.localeCompare(b.bird.commonName, 'ca')).slice(0, limit);
}
export function searchBirds(all, query) {
    const term = normalize(query);
    if (!term) return all;
    const terms = bird => [bird.commonName, bird.scientificName, bird.guideScientificName, bird.guide?.spanishName, bird.guide?.englishName].filter(Boolean).map(normalize);
    return all.filter(bird => terms(bird).some(name => name.includes(term))).sort((a, b) => {
        const prefix = bird => terms(bird).some(name => name.startsWith(term)) ? 0 : 1;
        return prefix(a) - prefix(b) || a.commonName.localeCompare(b.commonName, 'ca');
    });
}

function createPicker(id, getBirds, onChoose, escapeHtml) {
    const input = document.getElementById(id);
    const root = input.closest('.compare-picker');
    const list = document.getElementById(id + '-options');
    const toggle = root.querySelector('.compare-list-toggle');
    let selected, results = [], active = -1, open = false;
    const positionList = () => {
        if (!open) return;
        const viewport = window.visualViewport;
        const area = root.closest('main').getBoundingClientRect();
        const box = root.getBoundingClientRect();
        const top = Math.max(area.top, viewport?.offsetTop || 0);
        const bottom = Math.min(area.bottom, (viewport?.offsetTop || 0) + (viewport?.height || innerHeight));
        const above = box.top - top - 8, below = bottom - box.bottom - 8;
        const upwards = below < 150 && above > below;
        list.classList.toggle('opens-up', upwards);
        list.style.maxHeight = Math.max(64, Math.min(304, upwards ? above : below)) + 'px';
    };
    window.addEventListener('resize', positionList);
    window.visualViewport?.addEventListener('resize', positionList);
    window.visualViewport?.addEventListener('scroll', positionList);
    const expand = value => {
        open = value;
        list.hidden = !value;
        input.setAttribute('aria-expanded', String(value));
        toggle.setAttribute('aria-expanded', String(value));
        if (!value) input.removeAttribute('aria-activedescendant');
        else positionList();
    };
    const close = () => { expand(false); input.value = selected?.commonName || ''; };
    const highlight = index => {
        active = index;
        [...list.querySelectorAll('[role="option"]')].forEach((item, i) => {
            item.classList.toggle('is-active', i === index);
            item.setAttribute('aria-selected', String(i === index));
        });
        const item = list.children[index];
        if (item) { input.setAttribute('aria-activedescendant', item.id); item.scrollIntoView({block:'nearest'}); }
    };
    const show = query => {
        results = searchBirds(getBirds(), query);
        active = -1;
        input.removeAttribute('aria-activedescendant');
        list.innerHTML = results.length ? results.map((bird, i) => `<div id="${id}-option-${i}" class="compare-option" role="option" aria-selected="false" data-option="${i}"><strong>${escapeHtml(bird.commonName)}</strong><small lang="la">${escapeHtml(bird.scientificName || bird.guideScientificName || '')}</small></div>`).join('')
            : '<p class="compare-no-results" role="status">No hem trobat cap ocell amb aquest nom.</p>';
        expand(true);
    };
    const choose = index => {
        const bird = results[index];
        if (!bird) return;
        selected = bird;
        close();
        onChoose(bird);
    };
    input.addEventListener('focus', () => { input.select(); show(''); });
    input.addEventListener('click', () => { if (!open) { input.select(); show(''); } });
    input.addEventListener('input', () => show(input.value));
    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) show('');
            if (results.length) highlight(active < 0 ? (event.key === 'ArrowDown' ? 0 : results.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (!open) show('');
            else if (active >= 0 || results.length === 1) choose(active >= 0 ? active : 0);
        } else if (event.key === 'Escape' || event.key === 'Tab') {
            if (event.key === 'Escape' && open) event.preventDefault();
            close();
        }
    });
    toggle.addEventListener('mousedown', event => event.preventDefault());
    toggle.addEventListener('click', () => {
        const wasOpen = open;
        input.focus();
        if (wasOpen) close();
        else show('');
    });
    list.addEventListener('mousedown', event => event.preventDefault());
    list.addEventListener('click', event => {
        const item = event.target.closest('[data-option]');
        if (item) choose(Number(item.dataset.option));
    });
    root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
    document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
    return { close, setBird(bird) { selected = bird; if (!open) input.value = bird.commonName; } };
}

export function createComparator({ birds, speciesKey, artwork, rarityBadge, escapeHtml }) {
    const target = document.getElementById('comparison-content');
    let leftKey = '', rightKey = '', anchorSide = 'left';
    const suggestions = document.getElementById('compare-similar-grid');
    const anchorButtons = [...document.querySelectorAll('[data-compare-anchor]')];
    const choose = (side, bird) => {
        const previous = side === 'left' ? leftKey : rightKey;
        if (side === 'left') { leftKey = speciesKey(bird); if (leftKey === rightKey) rightKey = previous; }
        else { rightKey = speciesKey(bird); if (rightKey === leftKey) leftKey = previous; }
        leftPicker.close(); rightPicker.close();
        render();
    };
    const leftPicker = createPicker('compare-left', birds, bird => { anchorSide = 'left'; choose('left', bird); }, escapeHtml);
    const rightPicker = createPicker('compare-right', birds, bird => { anchorSide = 'right'; choose('right', bird); }, escapeHtml);
    function renderSuggestions(left, right) {
        const anchor = anchorSide === 'left' ? left : right;
        const other = anchorSide === 'left' ? right : left;
        document.getElementById('compare-similar-title').textContent = 'Semblants a: ' + anchor.commonName;
        anchorButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.compareAnchor === anchorSide)));
        const related = findSimilarBirds(anchor, birds());
        document.querySelector('.mobile-swipe-hint').hidden = related.length < 3;
        suggestions.innerHTML = related.length ? related.map(({bird, reason}, index) => `<button type="button" class="compare-similar-card" data-similar="${index}" aria-pressed="${speciesKey(bird) === speciesKey(other)}" aria-label="Compara ${escapeHtml(anchor.commonName)} amb ${escapeHtml(bird.commonName)}">
            ${artwork(bird)}<strong>${escapeHtml(bird.commonName)}</strong><small>${escapeHtml(reason)}</small>
        </button>`).join('') : '<p class="compare-no-results">No hi ha altres espècies properes en aquest catàleg. Pots cercar qualsevol ocell als camps de dalt.</p>';
        suggestions.querySelectorAll('[data-similar]').forEach(button => button.addEventListener('click', () => {
            choose(anchorSide === 'left' ? 'right' : 'left', related[Number(button.dataset.similar)].bird);
            if (window.matchMedia('(max-width:649px)').matches) {
                const main = target.closest('main');
                const top = main.scrollTop + target.getBoundingClientRect().top - main.getBoundingClientRect().top;
                main.scrollTo({top, behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth'});
            }
        }));
    }
    anchorButtons.forEach(button => button.addEventListener('click', () => { anchorSide = button.dataset.compareAnchor; render(); }));
    const text = value => escapeHtml(value || 'Dada pendent');
    const photo = bird => (bird.guide?.photos || []).slice(0, 2).map(image => `<figure class="compare-photo">
        <a href="./aviteca-fotos/${encodeURIComponent(image.file)}" target="_blank" rel="noopener" aria-label="Amplia la fotografia de ${text(bird.commonName)} · ${text(image.caption)}">
            <img src="./aviteca-fotos/${encodeURIComponent(image.file)}" alt="${text(bird.commonName)} · ${text(image.caption)}" loading="lazy" decoding="async" width="${image.width}" height="${image.height}">
        </a>
        <figcaption><strong>${text(image.caption)}</strong><span>
            <a href="${text(image.source)}" target="_blank" rel="noopener">${text(image.author || 'Wikimedia Commons')}</a>
            · <a href="${text(image.licenseUrl)}" target="_blank" rel="noopener">${text(image.license === 'Public domain' ? 'Domini públic' : image.license)}</a>
        </span></figcaption>
    </figure>`).join('') || '<p class="text-sm">Encara no hi ha fotografies per a aquesta espècie.</p>';
    function render() {
        const all = birds();
        const left = all.find(bird => speciesKey(bird) === leftKey) || all[0];
        const right = all.find(bird => speciesKey(bird) === rightKey && bird !== left) || all.find(bird => bird !== left);
        if (!left || !right) {
            target.innerHTML = '<p>Calen dues espècies al catàleg per poder comparar-les.</p>';
            return;
        }
        leftKey = speciesKey(left);
        rightKey = speciesKey(right);
        document.getElementById('compare-current-pair').textContent = 'Comparant ' + left.commonName + ' amb ' + right.commonName;
        leftPicker.setBird(left);
        rightPicker.setBird(right);
        renderSuggestions(left, right);
        const header = bird => `${artwork(bird)}<h2>${text(bird.commonName)}</h2>
            <p lang="la" class="compare-science">${text(bird.scientificName || bird.guideScientificName)}</p>${rarityBadge(bird)}`;
        const row = (label, getValue) => `<tr><th scope="row">${label}</th><td>${getValue(left)}</td><td>${getValue(right)}</td></tr>`;
        const field = name => bird => text(bird.guide?.identification?.[name]);
        target.innerHTML = `<table class="comparison-table">
            <caption class="sr-only">Comparació de ${text(left.commonName)} i ${text(right.commonName)}</caption>
            <colgroup><col class="compare-label-col"><col><col></colgroup>
            <thead><tr><td></td><th scope="col">${header(left)}</th><th scope="col">${header(right)}</th></tr></thead>
            <tbody>
                ${row('Plomatge', field('plumage'))}
                ${row('Bec i cap', field('head'))}
                ${row('Silueta', field('shape'))}
                ${row('Longitud', bird => bird.guide?.ecology ? text(bird.guide.ecology.lengthCm) + ' cm' : 'Dada pendent')}
                ${row('Envergadura', bird => bird.guide?.ecology?.wingspanCm ? text(bird.guide.ecology.wingspanCm) + ' cm' : 'Dada pendent')}
                ${row('Hàbitat', bird => text(bird.guide?.ecology?.habitat))}
                ${row('Quan veure’l', bird => text(bird.guide?.ecology?.seasonNote))}
                ${row('Castellà', bird => text(bird.guide?.spanishName))}
                ${row('Anglès', bird => text(bird.guide?.englishName))}
                ${row('Fotografies', photo)}
                ${row('Fonts', bird => (bird.guide?.sources || []).map(source => `<a class="compare-source" href="${text(source.url)}" target="_blank" rel="noopener">${text(source.name)}</a>`).join('<br>') || 'Dada pendent')}
            </tbody></table>`;
    }
    return {
        render,
        open(bird, related) {
            leftPicker.close(); rightPicker.close();
            anchorSide = 'left';
            const all = birds();
            if (bird) leftKey = speciesKey(bird);
            const left = all.find(candidate => speciesKey(candidate) === leftKey) || all[0];
            if (related) rightKey = speciesKey(related);
            else if (bird || !rightKey || rightKey === leftKey) {
                const sibling = findSimilarBirds(left, all)[0]?.bird || all.find(candidate => candidate !== left);
                rightKey = sibling ? speciesKey(sibling) : '';
            }
            render();
        }
    };
}
