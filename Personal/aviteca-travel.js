import { groupSightingPlaces, normalizePlace, pointMapUrl } from './aviteca-location.js?v=3';

const regionalDestinations = [
    ['ES-CT', 'Catalunya', 41.82, 1.90, 7,
        'Catalunya|Cataluña|Barcelona|Girona|Gerona|Lleida|Lérida|Tarragona|Empordà|Besòs|Delta de l’Ebre' +
        '|Belianes|Bellcaire Urgell|Bellcaire d’Urgell|Buseu|Cadí Moixeró|Cala Montgó|Cambrils|Cap de Creus|Castelló d’Empúries' +
        '|Cinc Claus|Delta del Llobregat|Deltebre|El Matà|Platja Matà|Estany d’Ivars|Ivars d’Urgell|L’Escala|La Seu d’Urgell' +
        '|Montsonís|Monsonís|Pla de Gates|Pla de les Gates|Remolar-Filipines|Riumors|Secans Balaguer|Sobreestany|Santa Coloma de Cervelló|Sta. Coloma Cervelló|Utxesa|Closes de la Gallinera'],
    ['AD', 'Andorra', 42.54, 1.56, 10,
        'Andorra|Ordino|Canillo|Encamp|La Massana|Escaldes-Engordany|Coll de la Botella|Sispony|Engolasters' +
        '|Mas d’Alins|Pessons|Rec de l’Obac|Reg de l’Obac|Setúria|Sorteny|Port de Cabús|Port Cabús'],
    ['ES-PV', 'País Basc', 43.02, -2.66, 7, 'País Basc|País Vasco|Euskadi|Bilbao|Donostia|Vitòria-Gasteiz|Bizkaia|Gipuzkoa|Àlaba'],
    ['ES-NC', 'Navarra', 42.68, -1.67, 7, 'Navarra|Nafarroa|Pamplona|Iruña'],
    ['ES-IB', 'Illes Balears', 39.59, 2.97, 8, 'Illes Balears|Islas Baleares|Mallorca|Menorca|Eivissa|Ibiza|Formentera'],
    ['ES-AR', 'Aragó', 41.38, -0.91, 7, 'Aragó|Aragón|Zaragoza|Saragossa|Bujaraloz|Belchite|El Planerón'],
    ['ES-CB', 'Cantàbria', 43.25, -3.94, 8, 'Cantàbria|Santander|Santoña|Colindres'],
    ['ES-CN', 'Illes Canàries', 28.28, -15.98, 7,
        'Canàries|Canarias|Canary Islands|El Hierro|Gran Canaria|Gran Canària|Tenerife|Fuerteventura|Lanzarote|La Gomera'],
    ['ES', 'Espanya', 40.29, -3.71, 6, 'Espanya|España|Spain'],
    ['IE', 'Irlanda', 53.38, -8.11, 7, 'Dalkey|Saltee|Saltees|Kilmore Quay|Wexford'],
    ['FR', 'França', 46.63, 2.58, 6, 'França|Francia|France|Camarga|Camargue'],
    ['DE', 'Alemanya', 51.08, 10.45, 6, 'Alemanya|Alemania|Germany|Deutschland|Heidelberg'],
    ['JP', 'Japó', 36.42, 138.44, 5, 'Japó|Japón|Japan|Tokyo|Tòquio|Tokio|Kyoto|Kioto']
];

const aliases = regionalDestinations.map(([code, , , , , names]) => [code, names.split('|').map(normalizePlace)]);
// These short names are ambiguous outside the Maida workbook.
const maidaPlaceDestinations = new Map([
    ['aiguamolls', 'ES-CT'], ['gallinera', 'ES-CT'], ['la gallinera', 'ES-CT'],
    ['parc dels estanys', 'ES-CT'], ['bridgetown', 'IE']
]);
const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['ca'], {type:'region'}) : null;
const compareNames = (a, b) => a.name.localeCompare(b.name, 'ca');

export const UNPLACED = 'unplaced';

export function createDestinations() {
    const items = new Map(regionalDestinations.map(([id, name, latitude, longitude, zoom]) =>
        [id, {id, name, point:[latitude, longitude], zoom}]));
    const countryNames = new Map();

    const addCountries = countries => {
        for (const [id, fallback, latitude, longitude] of countries) {
            const name = regionNames?.of(id) || fallback;
            if (!items.has(id)) items.set(id, {id, name, point:[latitude, longitude], zoom:6});
            for (const label of [fallback, name]) countryNames.set(normalizePlace(label), id);
        }
    };

    const identify = observation => {
        if (observation.destination === UNPLACED || items.has(observation.destination)) return observation.destination;
        const location = String(observation.location ?? '');
        const normalized = normalizePlace(location);
        const maidaDestination = observation.source === 'maida-excel' && maidaPlaceDestinations.get(normalized);
        if (maidaDestination) return maidaDestination;
        // City and regional hints in imported place names. An explicit choice always wins.
        const words = ` ${normalized} `;
        for (const [id, placeNames] of aliases) {
            if (placeNames.some(name => words.includes(` ${name} `))) return id;
        }
        const parts = location.split(/[,()]/).map(normalizePlace).filter(Boolean);
        return countryNames.get(parts.at(-1)) || UNPLACED;
    };

    const summarize = (observations, speciesKey) => {
        const groups = new Map();
        const locationsBySpecies = new Map();
        for (const observation of observations) {
            const id = identify(observation);
            if (!groups.has(id)) {
                groups.set(id, {...(items.get(id) || {id, name:'Per situar'}), observations:[], species:new Map(), dates:new Set()});
            }
            const group = groups.get(id);
            group.observations.push(observation);
            if (/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(observation.date)) group.dates.add(observation.date);
            const key = speciesKey(observation);
            if (!key) continue;
            group.species.set(key, observation.species || observation.scientificName || '');
            if (!locationsBySpecies.has(key)) locationsBySpecies.set(key, new Set());
            locationsBySpecies.get(key).add(id);
        }
        for (const group of groups.values()) {
            group.places = groupSightingPlaces(group.observations);
            group.dateRange = [...group.dates].sort();
            group.exclusive = [...group.species.keys()].filter(key => locationsBySpecies.get(key).size === 1);
            group.shared = [...group.species.keys()].filter(key =>
                [...locationsBySpecies.get(key)].some(id => id !== group.id && id !== UNPLACED));
        }
        return groups;
    };

    return {
        addCountries, identify, summarize,
        list: () => [...items.values()].sort(compareNames)
    };
}

export function setDestinationOptions(select, items, placeholder, {unplaced = false, countries = false, collections = []} = {}) {
    const current = select.value;
    const options = [new Option(placeholder, '', true)];
    if (countries) {
        for (const local of [true, false]) {
            const group = document.createElement('optgroup');
            group.label = local ? 'Destinacions habituals' : 'Altres països i territoris';
            for (const {id, name} of items) {
                if (regionalDestinations.some(([code]) => code === id) === local) group.append(new Option(name, id));
            }
            if (group.children.length) options.push(group);
        }
    } else {
        const collectionNames = new Set(collections.map(collection => collection.name));
        const destinations = [...items].filter(item => item.id !== UNPLACED).sort(compareNames)
            .map(({id, name}) => new Option(collectionNames.has(name) ? `${name} · observades` : name, id));
        if (collections.length) {
            for (const [label, children] of [
                ['Col·leccions territorials', collections.map(({id, name}) => new Option(name, id))],
                ['Destinacions observades', destinations]
            ]) {
                if (!children.length) continue;
                const group = document.createElement('optgroup');
                group.label = label;
                group.append(...children);
                options.push(group);
            }
        } else options.push(...destinations);
    }
    if (unplaced) options.push(new Option('Per situar', UNPLACED));
    if (!countries && options.length === select.children.length &&
        options.every((option, index) => option.isEqualNode(select.children[index]))) return;
    select.replaceChildren(...options);
    if ([...select.options].some(option => option.value === current)) select.value = current;
}

const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;
const worldBounds = [[-59, -179], [81, 179]];

export function createSightingDetails(place, {formatDate, speciesKey, openHistory}) {
    const {point, observations} = place;
    const card = document.createElement('div');
    card.className = 'sighting-details';
    const title = document.createElement('h3');
    title.textContent = place.label;
    const caption = document.createElement('p');
    caption.textContent = point.kind === 'site'
        ? ['Punt de referència', point.access].filter(Boolean).join(' · ')
        : point.kind === 'gps' ? 'Posició GPS' : 'Punt marcat al quadern';
    const birds = new Map();
    for (const observation of [...observations].sort((a,b) => (b.date || '').localeCompare(a.date || ''))) {
        const key = speciesKey(observation);
        if (!key) continue;
        if (!birds.has(key)) birds.set(key, {name:observation.species || observation.scientificName, date:observation.date, count:0});
        birds.get(key).count++;
    }
    const stats = document.createElement('p');
    stats.textContent = `${countLabel(birds.size, 'espècie', 'espècies')} · ${countLabel(observations.length, 'observació', 'observacions')}`;
    const list = document.createElement('ul');
    for (const {name, date, count} of [...birds.values()].slice(0, 6)) {
        const entry = document.createElement('li');
        entry.textContent = `${name} · ${countLabel(count, 'registre', 'registres')} · Darrera data: ${formatDate(date) || 'no indicada'}`;
        list.append(entry);
    }
    const actions = document.createElement('div');
    actions.className = 'sighting-details-actions';
    const history = document.createElement('button');
    history.type = 'button';
    history.className = 'action';
    history.textContent = 'Historial del lloc';
    history.addEventListener('click', openHistory);
    const directions = document.createElement('a');
    directions.href = pointMapUrl(point);
    directions.target = '_blank';
    directions.rel = 'noopener';
    directions.textContent = 'Obre el punt al mapa';
    actions.append(history, directions);
    if (point.reference) {
        const source = directions.cloneNode();
        source.href = point.reference;
        source.textContent = 'Font';
        actions.append(source);
    }
    card.append(title, caption, stats, list, actions);
    return card;
}

export function createTravelView({world, formatDate, birdForKey, speciesKey, escapeHtml, openGuide, openHistory}) {
    const mapNode = document.getElementById('travel-map');
    const notice = document.getElementById('travel-map-note');
    const stamps = document.getElementById('travel-stamps');
    const detail = document.getElementById('travel-destination-detail');
    const siteDetails = document.getElementById('travel-site-detail');
    let groups = new Map();
    let selectedId = '';
    let selectedPlace = '';
    let map;
    let pins;
    let worldLayer;
    let localTiles;

    const birdName = (group, key) => birdForKey(key)?.commonName || group.species.get(key);
    const artwork = group => {
        const bird = [...new Set([...group.exclusive, ...group.species.keys()])].map(birdForKey)
            .find(item => /^[a-z0-9_-]+\.(png|webp)$/i.test(item?.sprite ?? ''));
        return bird ? `<img src="./aviteca-sprites/${bird.sprite}?v=2" alt="" loading="lazy" decoding="async">` : '<span class="travel-stamp-dot" aria-hidden="true"></span>';
    };

    function renderSiteDetails(group) {
        const place = group?.places.find(place => place.key === selectedPlace && place.point);
        siteDetails.classList.toggle('hidden', !place);
        if (!place) siteDetails.replaceChildren();
        else siteDetails.replaceChildren(createSightingDetails(place, {
            formatDate, speciesKey, openHistory:() => openHistory(group.id, place.key)
        }));
    }

    function showPlace(group, place) {
        if (!place.point) {
            openHistory(group.id, place.key);
            return;
        }
        selectedPlace = place.key;
        renderSiteDetails(group);
        siteDetails.focus({preventScroll:true});
        siteDetails.scrollIntoView({block:'nearest'});
    }

    function renderStamps() {
        const sorted = [...groups.values()].filter(group => group.id !== UNPLACED || group.places.some(place => place.point)).sort(compareNames);
        stamps.innerHTML = sorted.map(group => `
            <button type="button" class="travel-stamp" data-destination="${group.id}" aria-pressed="${group.id === selectedId}">
                <span class="travel-stamp-art">${artwork(group)}</span>
                <span><strong>${escapeHtml(group.name)}</strong><small>${countLabel(group.species.size, 'espècie', 'espècies')}</small></span>
            </button>`).join('');
        document.getElementById('travel-empty').classList.toggle('hidden', sorted.length > 0);
        const unplaced = groups.get(UNPLACED);
        const unplacedButton = document.getElementById('travel-unplaced');
        unplacedButton.classList.toggle('hidden', !unplaced);
        if (unplaced) unplacedButton.textContent = `${countLabel(unplaced.observations.length, 'observació per situar', 'observacions per situar')}`;
    }

    function renderDetail(group) {
        detail.classList.toggle('hidden', !group);
        if (!group) {
            detail.replaceChildren();
            return;
        }
        const first = group.dateRange[0];
        const last = group.dateRange.at(-1);
        const dates = first === last ? formatDate(first) : `${formatDate(first)} – ${formatDate(last)}`;
        const exclusive = group.exclusive.map(key => birdName(group, key)).filter(Boolean).sort((a,b) => a.localeCompare(b, 'ca'));
        const examples = exclusive.slice(0, 5).map(escapeHtml).join(' · ');
        const otherCount = exclusive.length - 5;
        const more = otherCount > 0 ? `
            <details class="travel-exclusive-more">
                <summary>Mostra ${otherCount === 1 ? 'l’altra espècie' : `${otherCount} espècies més`}</summary>
                <ul>${exclusive.slice(5).map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>
            </details>` : '';
        const positioned = group.places.filter(place => place.point);
        const missing = group.places.filter(place => !place.point);
        const placeList = places => places.map(place => `<li><button type="button" class="travel-place" data-place="${escapeHtml(place.key)}">
            <strong>${escapeHtml(place.label)}</strong><small>${countLabel(place.observations.length, 'observació', 'observacions')}</small>
        </button></li>`).join('');
        detail.innerHTML = `
            <h2>${escapeHtml(group.name)}</h2>
            <p>${countLabel(group.species.size, 'espècie', 'espècies')} · ${countLabel(group.observations.length, 'observació', 'observacions')}</p>
            ${dates ? `<p class="travel-date">${escapeHtml(dates)}</p>` : ''}
            <p class="travel-exclusive"><strong>${exclusive.length ? countLabel(exclusive.length, 'espècie que només heu registrat aquí', 'espècies que només heu registrat aquí') : 'Cap espècie registrada només aquí'}</strong>
                ${examples ? `<span>${examples}</span>` : ''}</p>
            ${more}
            ${positioned.length ? `<details class="travel-exclusive-more" open>
                <summary>${countLabel(positioned.length, 'lloc al mapa', 'llocs al mapa')}</summary>
                <ul>${placeList(positioned)}</ul>
            </details>` : ''}
            ${missing.length ? `<details class="travel-exclusive-more">
                <summary>${countLabel(missing.reduce((total, place) => total + place.observations.length, 0),
                    'observació pendent de situar', 'observacions pendents de situar')}</summary>
                <p>Obre un lloc i edita l’observació per marcar-ne el punt al mapa.</p>
                <ul>${placeList(missing)}</ul>
            </details>` : ''}
            <div class="travel-actions">
                ${group.id !== UNPLACED ? '<button type="button" data-travel-action="guide" class="action action-primary">Veure a l’Avitèdex</button>' : ''}
                <button type="button" data-travel-action="history" class="action">Veure a l’historial</button>
            </div>`;
    }

    function addPin(point, label, type, text, action) {
        const marker = L.marker(point, {
            title:label, alt:label,
            icon:L.divIcon({className:`travel-pin travel-pin-${type}`, html:`<span aria-hidden="true">${text}</span>`, iconSize:[40,40], iconAnchor:[20,20]})
        }).addTo(pins);
        marker.getElement()?.setAttribute('aria-label', label);
        marker.bindTooltip(escapeHtml(label), {direction:'top', offset:[0,-18]});
        if (action) marker.on('click', action);
        return marker;
    }

    function renderPins() {
        if (!map) return;
        pins.clearLayers();
        const selected = groups.get(selectedId);
        const showTiles = selected && map.getZoom() >= 9;
        if (showTiles && !map.hasLayer(localTiles)) {
            worldLayer.remove();
            localTiles.addTo(map);
        } else if (!showTiles && map.hasLayer(localTiles)) {
            localTiles.remove();
            worldLayer.addTo(map);
        }
        if (selected) {
            for (const place of selected.places) {
                const {point} = place;
                if (!point) continue;
                addPin([point.latitude, point.longitude], place.label, point.kind, place.observations.length, () => showPlace(selected, place));
            }
            return;
        }

        // Cluster in screen pixels so neighbouring destinations can be picked after zooming.
        const clusters = [];
        for (const group of groups.values()) {
            if (!group.point) continue;
            const projected = map.project(group.point);
            const nearby = clusters.find(cluster => cluster.projected.distanceTo(projected) < 44);
            if (nearby) nearby.groups.push(group);
            else clusters.push({projected, groups:[group]});
        }
        for (const {groups:members} of clusters) {
            const [first] = members;
            if (members.length === 1) {
                addPin(first.point, `${first.name} · ${countLabel(first.species.size, 'espècie', 'espècies')}`, 'destination', first.species.size, () => select(first.id));
            } else {
                const bounds = L.latLngBounds(members.map(group => group.point));
                addPin(bounds.getCenter(), members.map(group => group.name).join(' · '), 'cluster', members.length,
                    () => map.fitBounds(bounds, {padding:[45,45], maxZoom:10, animate:false}));
            }
        }
    }

    function positionMap(group) {
        if (!map) return;
        if (!group) {
            map.fitBounds(worldBounds, {animate:false});
            return;
        }
        const points = group.places.map(place => place.point).filter(Boolean);
        if (points.length) map.fitBounds(points.map(point => [point.latitude, point.longitude]), {maxZoom:15, padding:[40,40], animate:false});
        else if (group.point) map.setView(group.point, group.zoom, {animate:false});
    }

    function updateNotice() {
        const group = groups.get(selectedId);
        notice.textContent = !map ? world() === undefined ? 'Carregant el mapa…' : 'Mapa no disponible. Pots consultar les destinacions amb els segells.'
            : !group ? 'Els pins indiquen destinacions aproximades. Amplia el mapa o toca un segell.'
            : group.places.some(place => place.point) ? 'Toca un pin per veure els ocells del lloc. Verd · coordenades desades. Blau · punt de referència.'
            : 'Les observacions d’aquesta destinació estan pendents de situar.';
    }

    function select(id) {
        selectedId = id;
        selectedPlace = '';
        const group = groups.get(id);
        for (const stamp of stamps.querySelectorAll('[data-destination]')) {
            stamp.setAttribute('aria-pressed', String(stamp.dataset.destination === id));
        }
        renderDetail(group);
        renderSiteDetails(group);
        positionMap(group);
        renderPins();
        updateNotice();
        if (group) {
            detail.focus({preventScroll:true});
            detail.scrollIntoView({block:'nearest'});
        }
    }

    stamps.addEventListener('click', event => {
        const button = event.target.closest('[data-destination]');
        if (button) select(button.dataset.destination);
    });
    detail.addEventListener('click', event => {
        const placeKey = event.target.closest('[data-place]')?.dataset.place;
        const group = groups.get(selectedId);
        const place = group?.places.find(candidate => candidate.key === placeKey);
        if (place) showPlace(group, place);
        const action = event.target.closest('[data-travel-action]')?.dataset.travelAction;
        if (action === 'guide') openGuide(selectedId);
        if (action === 'history') openHistory(selectedId);
    });
    document.getElementById('travel-unplaced').addEventListener('click', () => openHistory(UNPLACED));
    document.getElementById('travel-world-reset').addEventListener('click', () => select(''));

    return {
        render(data, open = false) {
            groups = data;
            if (!groups.has(selectedId)) selectedId = '';
            renderStamps();
            const group = groups.get(selectedId);
            renderDetail(group);
            renderSiteDetails(group);
            const outlines = world();
            if (!map && window.L && outlines) {
                mapNode.classList.remove('hidden');
                map = L.map(mapNode, {minZoom:0, maxZoom:19, zoomSnap:0.25, scrollWheelZoom:false});
                worldLayer = L.geoJSON(outlines, {interactive:false, style:{color:'#92a68d', weight:0.75, fillColor:'#c5d5b9', fillOpacity:1}}).addTo(map);
                localTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom:19, keepBuffer:1
                });
                map.attributionControl.setPrefix(false);
                pins = L.layerGroup().addTo(map);
                map.on('zoomend', renderPins);
                open = true;
            }
            if (map && open) {
                map.invalidateSize();
                positionMap(group);
            }
            mapNode.classList.toggle('hidden', !map);
            document.getElementById('travel-world-reset').classList.toggle('hidden', !map);
            renderPins();
            updateNotice();
        },
        reset() {
            groups = new Map();
            selectedId = '';
            selectedPlace = '';
            renderSiteDetails();
            if (map?.hasLayer(localTiles)) {
                localTiles.remove();
                worldLayer.addTo(map);
            }
            pins?.clearLayers();
            detail.replaceChildren();
            stamps.replaceChildren();
        }
    };
}
