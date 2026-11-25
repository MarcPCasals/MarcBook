// Keep unknown locations unknown: names alone never become invented coordinates.
export function gpsFields(position) {
    if (!position || position.latitude == null || position.longitude == null || String(position.latitude).trim() === '' || String(position.longitude).trim() === '') return {};
    const latitude = Number(position.latitude), longitude = Number(position.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return {};
    const fields = {latitude, longitude};
    const accuracy = position.accuracy ?? position.gpsAccuracy;
    if (accuracy != null && Number.isFinite(Number(accuracy)) && Number(accuracy) >= 0) fields.gpsAccuracy = Number(accuracy);
    return fields;
}
function groupByCoordinates(observations, coordinatesFor) {
    const groups = new Map();
    for (const observation of observations) {
        const coordinates = coordinatesFor(observation);
        if (coordinates?.latitude == null) continue;
        const key = `${coordinates.latitude},${coordinates.longitude},${coordinates.kind || ''}`;
        if (!groups.has(key)) groups.set(key, {...coordinates, observations:[]});
        groups.get(key).observations.push(observation);
    }
    return [...groups.values()];
}

export function groupLocations(observations, checklistId = '') {
    return groupByCoordinates(observations, observation =>
        !checklistId || observation.checklistId === checklistId ? gpsFields(observation) : null);
}

const namedSites = [
    [['obs la arenilla santona', 'obs las arenillas santona'], 'Observatorio de La Arenilla · Santoña', 43.44361, -3.47148,
        'https://www.openstreetmap.org/way/171753209'],
    [['obs cicero santona'], 'Mirador de Sollagua · Cicero', 43.419111, -3.480535,
        'https://web.unican.es/campuscultural/huellas/Paginas/SANTO%C3%91A/santo%C3%B1a_recorrido.aspx'],
    [['font de la navina ordino'], 'Font de la Navina · Ordino', 42.5557786, 1.5623002,
        'https://www.openstreetmap.org/node/1367752249'],
    [['coll de la botella'], 'Coll de la Botella', 42.5456633, 1.4529502, 'https://www.openstreetmap.org/node/3895031171'],
    [['port cabus', 'port de cabus'], 'Port de Cabús', 42.5463595, 1.4197414, 'https://www.openstreetmap.org/node/53376950'],
];
const namedSitesByLabel = new Map(namedSites.flatMap(([aliases, label, latitude, longitude, reference]) =>
    aliases.map(alias => [alias, {label, latitude, longitude, reference, kind:'site'}])));

export function sightingPoint(observation) {
    const coordinates = gpsFields(observation);
    if (coordinates.latitude != null) {
        return {...coordinates, label:observation.location || 'Punt de l’observació', kind:observation.positionSource === 'manual' ? 'manual' : 'gps'};
    }
    if (observation.source !== 'maida-excel') return null;
    const place = String(observation.location || '').normalize('NFD').replace(/\p{M}+/gu, '')
        .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    return namedSitesByLabel.get(place) || null;
}

export function groupSightingPoints(observations) {
    return groupByCoordinates(observations, sightingPoint);
}

export function pointMapUrl({latitude, longitude}) {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
}
