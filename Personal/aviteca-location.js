export const normalizePlace = text => String(text ?? '').normalize('NFD').replace(/\p{M}+/gu, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function gpsFields(position) {
    if (!position || position.latitude == null || position.longitude == null || String(position.latitude).trim() === '' || String(position.longitude).trim() === '') return {};
    const latitude = Number(position.latitude), longitude = Number(position.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return {};
    const fields = {latitude, longitude};
    const accuracy = position.accuracy ?? position.gpsAccuracy;
    if (accuracy != null && Number.isFinite(Number(accuracy)) && Number(accuracy) >= 0) fields.gpsAccuracy = Number(accuracy);
    return fields;
}
// Coordinates for the named landmark or a documented access to a larger site.
const namedSites = [
    [['obs la arenilla santona', 'obs las arenillas santona'], 'Observatorio de La Arenilla · Santoña', 43.44361, -3.47148,
        'https://www.openstreetmap.org/way/171753209'],
    [['obs cicero santona'], 'Mirador de Sollagua · Cicero', 43.419111, -3.480535,
        'https://web.unican.es/campuscultural/huellas/Paginas/SANTO%C3%91A/santo%C3%B1a_recorrido.aspx'],
    [['font de la navina ordino'], 'Font de la Navina · Ordino', 42.5557786, 1.5623002,
        'https://www.openstreetmap.org/node/1367752249'],
    [['coll de la botella'], 'Coll de la Botella', 42.5456633, 1.4529502, 'https://www.openstreetmap.org/node/3895031171'],
    [['port cabus', 'port de cabus'], 'Port de Cabús', 42.5463595, 1.4197414, 'https://www.openstreetmap.org/node/53376950'],
    [['rec de l obac', 'reg de l obac'], 'Rec de l’Obac', 42.506225, 1.533686,
        'https://visitandorra.com/content/dam/visitandorra/ca/assets/documents/cfs/itinerary/macarulla-estevet-s-friends/148x210-macarulla-6-insectes-cat.pdf', 'Accés per la carretera de l’Obac'],
    [['cortals de sispony', 'cortals sispony'], 'Cortals de Sispony', 42.527267, 1.48655,
        'https://visitandorra.com/content/dam/visitandorra/ca/assets/documents/cfs/itinerary/hiking-route-collada-de-muntaner-pic-d-enclar/sispony-collada-muntaner-pic-enclar-cat.pdf', 'Alberg dels Cortals'],
    [['cortals encamp', 'cortals d encamp', 'els cortals d encamp'], 'Cortals d’Encamp', 42.535117, 1.614333,
        'https://visitandorra.com/content/dam/visitandorra/ca/assets/documents/cfs/itinerary/hiking-route-l-alt-del-griu/alt-del-griu-cat.pdf', 'Accés al camí de l’alt del Griu'],
    [['seturia', 'bordes de seturia'], 'Setúria', 42.5455987, 1.4398521,
        'https://www.openstreetmap.org/node/12842226971', 'Bordes de Setúria'],
    [['pessons', 'estanys de pessons'], 'Pessons', 42.525833, 1.68835,
        'https://visitandorra.com/content/dam/visitandorra/ca/assets/documents/cfs/itinerary/hiking-route-estanys-de-pessons/els-pessons-cat.pdf', 'Estany Primer'],
    [['sorteny', 'parc natural de sorteny'], 'Sorteny', 42.625867, 1.551883,
        'https://visitandorra.com/content/dam/visitandorra/de/assets/documents/cfs/itinerary/hiking-trail-mirador-del-grau-de-la-llosa/parc-natural-sorteny-mirador-grau-llosa-eng.pdf', 'Accés de la Canya de la Rabassa'],
    [['engolasters', 'estany d engolasters', 'llac d engolasters'], 'Engolasters', 42.514054, 1.567855,
        'https://i.visitandorra.com/gallery/TdLXtleWz2g7lMvRu5/mapa.pdf', 'Accés pel circuit de les Fonts'],
    [['mas d alins'], 'Mas d’Alins', 42.44137, 1.44946,
        'https://www.openstreetmap.org/node/64954534'],
    [['aiguamolls el mata', 'el mata', 'mas del mata'], 'El Matà · Aiguamolls de l’Empordà', 42.21284, 3.096193,
        'https://www.openstreetmap.org/way/185844468', 'Punt d’informació del Mas del Matà'],
    [['pla de gates', 'pla de les gates'], 'Pla de les Gates', 42.2639084, 3.2078417,
        'https://www.openstreetmap.org/node/1241597624'],
    [['buseu'], 'Buseu', 42.3063229, 1.1170893, 'https://www.openstreetmap.org/node/3361938999'],
    [['estany d ivars', 'estany d ivars i vila sana'], 'Estany d’Ivars i Vila-sana', 41.6791723, 0.9573735,
        'https://www.openstreetmap.org/node/633166987', 'Mirador de l’estany'],
    [['utxesa'], 'Utxesa', 41.491811, 0.508983,
        'https://www.openstreetmap.org/way/761495492', 'Centre d’informació La Fusteria'],
    [['el planeron', 'reserva d el planeron'], 'Reserva ornitològica El Planerón', 41.371545, -0.638336,
        'https://www.observersciencetourism.com/upload/documents/Ficha___2811012022.pdf'],
    [['kilmore quay'], 'Kilmore Quay', 52.17285, -6.58901,
        'https://euroveloireland.ie/poi/kilmore-quay', 'Accés al port'],
    [['remolar filipines', 'el remolar filipines'], 'El Remolar–Filipines', 41.278284, 2.063638,
        'https://www.viladecans.cat/ca/activitats-al-remolar-filipines-canvi-climatic-i-mar', 'Centre d’informació'],
    [['cala montgo'], 'Cala Montgó', 42.1064134, 3.1720805, 'https://www.openstreetmap.org/node/5596212586'],
    [['cinc claus'], 'Cinc Claus', 42.13758, 3.10106, 'https://www.openstreetmap.org/node/2289144980'],
    [['parc dels estanys'], 'Parc dels Estanys · Platja d’Aro', 41.8126, 3.05545,
        'https://www.openstreetmap.org/way/1334231367'],
    [['montsonis', 'monsonis'], 'Montsonís', 41.8866257, 1.0227663,
        'https://www.openstreetmap.org/node/3594112189'],
    [['gallinera', 'la gallinera', 'closes de la gallinera'], 'Closes de la Gallinera', 42.2325749, 3.0608515,
        'https://www.openstreetmap.org/node/1241585244'],
];
const namedSitesByLabel = new Map(namedSites.flatMap(([aliases, label, latitude, longitude, reference, access]) => {
    const site = {key:`site:${aliases[0]}`, label, latitude, longitude, reference, access, kind:'site'};
    return aliases.map(alias => [alias, site]);
}));

const namedSite = observation => {
    if (observation.hide && observation.hideName?.trim()) return null;
    return namedSitesByLabel.get(normalizePlace(observation.location));
};

const placeLabel = observation => [observation.location?.trim(), observation.hide && observation.hideName?.trim()].filter(Boolean).join(' · ');

export function sightingPoint(observation) {
    const coordinates = gpsFields(observation);
    if (coordinates.latitude != null) {
        return {...coordinates, label:placeLabel(observation) || 'Punt de l’observació', kind:observation.positionSource === 'manual' ? 'manual' : 'gps'};
    }
    return namedSite(observation) || null;
}

export function groupSightingPlaces(observations) {
    const groups = new Map();
    for (const observation of observations) {
        const point = namedSite(observation) || sightingPoint(observation);
        const label = point?.label || placeLabel(observation) || 'Lloc no indicat';
        const name = normalizePlace(placeLabel(observation));
        const key = point?.key || (point ? `point:${point.latitude},${point.longitude}:${name}` : `pending:${name}`);
        if (!groups.has(key)) groups.set(key, {key, label, point, observations:[]});
        groups.get(key).observations.push(observation);
    }
    for (const place of groups.values()) {
        if (place.point?.kind !== 'site') continue;
        const saved = sightingPoint(place.observations[0]);
        if (saved.kind !== 'site' && place.observations.every(observation =>
            gpsFields(observation).latitude === saved.latitude && gpsFields(observation).longitude === saved.longitude)) {
            place.point = saved;
        }
    }
    return [...groups.values()].sort((a,b) => a.label.localeCompare(b.label, 'ca'));
}

export function pointMapUrl({latitude, longitude}) {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}
