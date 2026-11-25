export const outingPlaces = [
    {
        name:'Parc Natural dels Aiguamolls de l’Empordà', destination:'ES-CT', aliases:['Aiguamolls de l’Empordà'],
        habitats:['wetland','coast','open']
    },
    {
        name:'Parc Natural del Delta de l’Ebre', destination:'ES-CT', aliases:['Delta de l’Ebre'],
        habitats:['wetland','coast','open','river']
    },
    {
        name:'Andorra', destination:'AD', aliases:[],
        habitats:['forest','mountain','open','river']
    }
];

export const outingHabitats = [
    {id:'wetland', label:'Aiguamolls', pattern:/\b(aiguamolls?|canyissars?|maresmes?|salines?|arrossars?|llacunes?|fangars?|estuaris?|prats? (?:humits?|inundats?))\b/},
    {id:'coast', label:'Costa i mar', pattern:/\b(mar|mari(?:ns?|nes?)|costes?|costa|costaners?|costaneres?|litorals?|platges?|badies?|esculleres?)\b/},
    {id:'forest', label:'Bosc', pattern:/\b(boscos?|bosc|forestals?|arbredes?|sotabosc|pinedes?|fagedes?|alzinars?|rouredes?|avetoses?|coniferes)\b/},
    {id:'mountain', label:'Muntanya', pattern:/\b(muntanyes?|pirineus?|alpins?|alpines?|subalpins?|subalpines?|carenes?|tarteres?|cingles?|cingleres?)\b/},
    {id:'open', label:'Camps i matollar', pattern:/\b(camps?|conreus?|pastures?|matollars?|brolles?|erms?|guarets?|estepes?|prats?|cereal|agricoles?)\b/},
    {id:'river', label:'Rius i estanys', pattern:/\b(rius?|rieres?|torrents?|ribera|estanys?|llacs?|basses?|embassaments?)\b/},
    {id:'urban', label:'Pobles i parcs', pattern:/\b(pobles?|ciutats?|parcs?|jardins?|nuclis urbans?|urban[es]+|carrers?|teulades?)\b/}
];

export const normalizeOutingPlace = text => String(text ?? '').normalize('NFD').replace(/\p{M}+/gu, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const outingPlaceAliases = new Map(outingPlaces.flatMap(({name, aliases}) =>
    aliases.map(alias => [normalizeOutingPlace(alias), normalizeOutingPlace(name)])));
export function outingLocationKey(location) {
    const normalized = normalizeOutingPlace(location);
    return outingPlaceAliases.get(normalized) || normalized;
}

const seasonsByMonth = ['hivern','hivern','primavera','primavera','primavera','estiu','estiu','estiu','tardor','tardor','tardor','hivern'];
export function outingSeason(date) {
    const month = /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.exec(date)?.[1];
    return month ? seasonsByMonth[Number(month) - 1] : '';
}

export function suggestOutingBirds({birds, observations, speciesKey, identify, plan}) {
    const season = outingSeason(plan.date);
    if (!season || !plan.destination) return [];

    const place = outingLocationKey(plan.location);
    const habitats = outingHabitats.filter(habitat => plan.habitats.includes(habitat.id));
    const history = new Map();
    for (const observation of observations) {
        if (identify(observation) !== plan.destination) continue;
        const key = speciesKey(observation);
        const entry = history.get(key) || {seenHere:false, seenInSeason:false};
        const local = Boolean(place && place === outingLocationKey(observation.location));
        entry.seenHere ||= local;
        entry.seenInSeason ||= (!place || local) && outingSeason(observation.date) === season;
        history.set(key, entry);
    }

    const rarity = ['common','uncommon','rare','epic','legendary'];
    const suggestions = [];
    for (const bird of birds) {
        const key = speciesKey(bird);
        const past = history.get(key);
        const ecology = bird.guide?.ecology;
        const regional = bird.regions?.includes(plan.destination);
        const present = ecology?.seasons?.includes(season) || ecology?.seasons?.includes('resident');
        if (!(regional && present) && !past?.seenInSeason) continue;

        const text = normalizeOutingPlace(ecology?.habitat);
        const habitatMatches = habitats.filter(habitat => habitat.pattern.test(text));
        if (habitats.length && !habitatMatches.length) continue;
        const rank = rarity.indexOf(bird.guide?.rarity?.category);
        suggestions.push({bird, key, seenHere:Boolean(past?.seenHere), seenInRegion:Boolean(past), habitatMatches,
            fromHistory:!(regional && present), rank:rank < 0 ? rarity.length : rank});
    }
    return suggestions.sort((a,b) => Number(b.seenHere) - Number(a.seenHere)
        || b.habitatMatches.length - a.habitatMatches.length
        || a.rank - b.rank
        || a.bird.commonName.localeCompare(b.bird.commonName, 'ca'));
}
