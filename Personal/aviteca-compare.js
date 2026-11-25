export function createComparator({ birds, speciesKey, artwork, rarityBadge, escapeHtml }) {
    const leftSelect = document.getElementById('compare-left');
    const rightSelect = document.getElementById('compare-right');
    const target = document.getElementById('comparison-content');
    let leftKey = '', rightKey = '';
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
        const options = selected => all.map(bird => `<option value="${text(speciesKey(bird))}" ${speciesKey(bird) === selected ? 'selected' : ''}>${text(bird.commonName)} · ${text(bird.scientificName || bird.guideScientificName)}</option>`).join('');
        leftSelect.innerHTML = options(leftKey);
        rightSelect.innerHTML = options(rightKey);
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
    leftSelect.addEventListener('change', () => {
        const previous = leftKey;
        leftKey = leftSelect.value;
        if (leftKey === rightKey) rightKey = previous;
        render();
    });
    rightSelect.addEventListener('change', () => {
        const previous = rightKey;
        rightKey = rightSelect.value;
        if (rightKey === leftKey) leftKey = previous;
        render();
    });
    return {
        render,
        open(bird, related) {
            const all = birds();
            if (bird) leftKey = speciesKey(bird);
            const left = all.find(candidate => speciesKey(candidate) === leftKey) || all[0];
            if (related) rightKey = speciesKey(related);
            else if (bird || !rightKey || rightKey === leftKey) {
                const genus = (left?.scientificName || left?.guideScientificName || '').split(' ')[0];
                const sibling = (genus && all.find(candidate => candidate !== left && (candidate.scientificName || candidate.guideScientificName || '').split(' ')[0] === genus))
                    || all.find(candidate => candidate !== left && candidate.family && candidate.family === left?.family)
                    || all.find(candidate => candidate !== left);
                rightKey = sibling ? speciesKey(sibling) : '';
            }
            render();
        }
    };
}
