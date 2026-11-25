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
export function groupLocations(observations, checklistId = '') {
    const groups = new Map();
    for (const observation of observations) {
        if (checklistId && observation.checklistId !== checklistId) continue;
        const coordinates = gpsFields(observation);
        if (coordinates.latitude == null) continue;
        const key = `${coordinates.latitude},${coordinates.longitude}`;
        if (!groups.has(key)) groups.set(key, {...coordinates, observations:[]});
        groups.get(key).observations.push(observation);
    }
    return [...groups.values()];
}
