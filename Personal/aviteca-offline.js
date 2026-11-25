// Verify the browser allows durable storage before accepting field observations.
export async function checkLocalStorage() {
    try {
        await new Promise((resolve, reject) => {
            const request = indexedDB.open('aviteca-storage-check', 1);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('Emmagatzematge bloquejat'));
            request.onsuccess = () => { request.result.close(); resolve(); };
        });
        return true;
    } catch { return false; }
}

// Firebase emits the local document after its persistent mutation transaction commits.
// The server acknowledgement remains observed so rejected writes are reported too.
export function acknowledgeLocalWrite({ subscribe, start, matches, onRejected }) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let unsubscribe = () => {};
        const finish = (error) => {
            if (settled) return;
            settled = true;
            unsubscribe();
            if (error) reject(error);
            else resolve();
        };
        unsubscribe = subscribe(snapshot => {
            if (matches(snapshot)) finish();
        }, error => finish(error));
        try {
            Promise.resolve(start()).then(() => finish(), error => {
                if (settled) onRejected(error);
                else finish(error);
            });
        } catch (error) {
            finish(error);
        }
    });
}

export function startFieldMode() {
    const button = document.getElementById('btn-field-download');
    const status = document.getElementById('field-download-status');
    let registration;
    let downloading = false;
    const updateButton = () => { button.disabled = downloading || !navigator.onLine || !registration; };
    const request = (type, onMessage) => new Promise((resolve, reject) => {
        const worker = registration?.active;
        if (!worker) return reject(new Error('El mode de camp encara s’està preparant. Torna-ho a provar.'));
        const channel = new MessageChannel();
        let timer;
        const refreshTimeout = () => {
            clearTimeout(timer);
            timer = setTimeout(() => { channel.port1.close(); reject(new Error('La descàrrega s’ha interromput. Torna-ho a provar.')); }, 45000);
        };
        refreshTimeout();
        channel.port1.onmessage = ({data}) => {
            refreshTimeout();
            onMessage?.(data);
            if (data.type === 'DONE' || data.type === 'STATUS') {
                clearTimeout(timer);
                channel.port1.close();
                resolve(data);
            } else if (data.type === 'ERROR') {
                clearTimeout(timer);
                channel.port1.close();
                reject(new Error(data.message));
            }
        };
        worker.postMessage({type}, [channel.port2]);
    });
    button.addEventListener('click', async () => {
        downloading = true;
        updateButton();
        try {
            status.textContent = 'Preparant la descàrrega…';
            await request('PREPARE', data => {
                if (data.type === 'PROGRESS') status.textContent = `Descarregant fitxes i imatges · ${data.done} de ${data.total}`;
            });
            status.textContent = 'Fitxes i imatges disponibles sense connexió';
            button.textContent = 'Actualitza la descàrrega';
            navigator.storage?.persist?.().catch(() => {});
        } catch (error) {
            status.textContent = `Descàrrega incompleta. ${error.message}`;
        } finally {
            downloading = false;
            updateButton();
        }
    });
    window.addEventListener('online', updateButton);
    window.addEventListener('offline', updateButton);
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        status.textContent = 'Aquest navegador no permet preparar les fitxes sense connexió.';
        button.disabled = true;
        return;
    }
    navigator.serviceWorker.register('./aviteca-sw.js', {scope:'./'}).then(async registered => {
        registration = registered;
        if (!registration.active) await new Promise((resolve, reject) => {
            const worker = registration.installing || registration.waiting;
            if (!worker) return reject(new Error('No s’ha instal·lat el mode de camp.'));
            const timer = setTimeout(() => reject(new Error('La preparació ha trigat massa.')), 30000);
            const changed = () => {
                if (worker.state === 'activated' || worker.state === 'redundant') {
                    clearTimeout(timer);
                    worker.removeEventListener('statechange', changed);
                    if (worker.state === 'activated') resolve();
                    else reject(new Error('No s’han pogut descarregar els recursos de l’app.'));
                }
            };
            worker.addEventListener('statechange', changed);
            changed();
        });
        const result = await request('STATUS');
        if (result.ready) {
            status.textContent = 'Fitxes i imatges disponibles sense connexió';
            button.textContent = 'Actualitza la descàrrega';
        } else {
            status.textContent = 'Prepara les fitxes i les imatges abans de sortir al camp';
        }
        updateButton();
    }).catch(() => {
        status.textContent = 'No s’ha pogut preparar el mode sense connexió. Recarrega amb cobertura.';
        button.disabled = true;
    });
    updateButton();
}
