import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAoUM58SRUMEFlCFm56jzI7eTU9QB-JxBE",
    authDomain: "eines-docents.firebaseapp.com",
    projectId: "eines-docents",
    storageBucket: "eines-docents.firebasestorage.app",
    messagingSenderId: "80852705741",
    appId: "1:80852705741:web:375c1a3dfd2ae2466c6484",
    measurementId: "G-JJ73JJ3DQX"
};

const ALLOWED_EMAIL = "mperezc@educand.ad";
const COLLECTION_NAME = "marcbook_artifacts";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let baselineArtifacts = [];
let remoteArtifacts = [];
let currentUser = null;
let editingId = null;
let editingIsBaseline = false;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);

function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

function stableBaselineId(category, title) {
    return `base-${slugify(category)}-${slugify(title)}`;
}

function isAuthorized(user) {
    return Boolean(user?.email && user.email.toLowerCase() === ALLOWED_EMAIL);
}

function showToast(message, type = "success") {
    const toast = $("#marcbookToast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle("error", type === "error");
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4300);
}

function normalizeArtifactUrl(rawValue) {
    const value = rawValue.trim();
    if (!value) return "";

    const githubBlob = value.match(
        /^https:\/\/github\.com\/MarcPCasals\/MarcBook\/blob\/main\/(.+?)(?:[?#].*)?$/i
    );
    if (githubBlob) return decodeURIComponent(githubBlob[1]);

    const pagesUrl = value.match(
        /^https:\/\/marcpcasals\.github\.io\/MarcBook\/(.+?)(?:[?#].*)?$/i
    );
    if (pagesUrl) return decodeURIComponent(pagesUrl[1]);

    if (/^(javascript|data|vbscript):/i.test(value)) return "";
    if (/^(https?:\/\/|mailto:|#|\/)/i.test(value)) return value;

    return value.replace(/^\.\//, "");
}

function serializeCard(card, index) {
    const category = card.dataset.category || "altres";
    const title = card.querySelector(".card-title")?.textContent.trim() || "Sense títol";
    const header = card.querySelector(".card-header");
    const iconImage = header?.querySelector("img");
    const iconElement = header?.querySelector("i");

    return {
        id: stableBaselineId(category, title),
        baseline: true,
        category,
        tags: card.dataset.tags || "",
        color: header?.dataset.color || "altres",
        type: header?.querySelector(".card-tag")?.textContent.trim() || "Artefacte",
        iconUrl: iconImage?.getAttribute("src") || "",
        iconAlt: iconImage?.getAttribute("alt") || title,
        iconClass: iconElement?.className || "fas fa-atom",
        badge: card.querySelector(".course-badge")?.textContent.trim() || "",
        title,
        description: card.querySelector(".card-desc")?.textContent.trim() || "",
        links: Array.from(card.querySelectorAll(".btn-launch"))
            .map((link) => ({
                label: link.textContent.trim() || "Obrir",
                url: link.getAttribute("href") || ""
            }))
            .filter((link) => link.url),
        order: index,
        published: true
    };
}

function captureBaselineCards() {
    baselineArtifacts = Array.from(document.querySelectorAll(".artifact-card")).map(serializeCard);
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function buildArtifactCard(artifact) {
    const card = createElement("div", "artifact-card fade-in");
    card.dataset.artifactId = artifact.id;
    card.dataset.category = artifact.category || "altres";
    card.dataset.tags = artifact.tags || "";
    card.dataset.index = String(Number.isFinite(Number(artifact.order)) ? Number(artifact.order) : 9999);

    if (!artifact.published) {
        card.classList.add("is-draft");
        card.appendChild(createElement("span", "draft-label", "Esborrany"));
    }

    const header = createElement("div", "card-header");
    header.dataset.color = artifact.color || "altres";
    header.appendChild(createElement("span", "card-tag", artifact.type || "Artefacte"));

    if (artifact.iconUrl) {
        const image = document.createElement("img");
        image.src = artifact.iconUrl;
        image.alt = artifact.iconAlt || artifact.title;
        image.className = "card-icon-img";
        image.loading = "lazy";
        header.appendChild(image);
    } else {
        const icon = document.createElement("i");
        icon.className = /^fa[bsr]? fa-[a-z0-9-]+(?: fa-[a-z0-9-]+)*$/i.test(artifact.iconClass || "")
            ? artifact.iconClass
            : "fas fa-atom";
        icon.setAttribute("aria-hidden", "true");
        header.appendChild(icon);
    }
    card.appendChild(header);

    const body = createElement("div", "card-body");
    if (artifact.badge) body.appendChild(createElement("span", "course-badge", artifact.badge));
    body.appendChild(createElement("h3", "card-title", artifact.title));
    body.appendChild(createElement("p", "card-desc", artifact.description || ""));

    const footer = createElement("div", "card-footer");
    (artifact.links || []).forEach((link) => {
        const safeUrl = normalizeArtifactUrl(link.url || "");
        if (!safeUrl) return;
        const anchor = createElement("a", "btn-launch");
        anchor.href = safeUrl;
        const icon = createElement("i", "fas fa-play");
        icon.setAttribute("aria-hidden", "true");
        anchor.append(icon, document.createTextNode(` ${link.label || "Obrir"}`));
        footer.appendChild(anchor);
    });
    body.appendChild(footer);
    card.appendChild(body);

    if (isAuthorized(currentUser)) {
        const actions = createElement("div", "card-admin-actions");
        const editButton = createElement("button", "card-admin-button");
        editButton.type = "button";
        editButton.title = `Editar ${artifact.title}`;
        editButton.setAttribute("aria-label", `Editar ${artifact.title}`);
        editButton.innerHTML = '<i class="fas fa-pen" aria-hidden="true"></i>';
        editButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openArtifactForm(artifact);
        });

        const deleteButton = createElement("button", "card-admin-button delete");
        deleteButton.type = "button";
        deleteButton.title = `Eliminar ${artifact.title}`;
        deleteButton.setAttribute("aria-label", `Eliminar ${artifact.title}`);
        deleteButton.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            removeArtifact(artifact);
        });

        actions.append(editButton, deleteButton);
        card.appendChild(actions);
    }

    return card;
}

function mergedArtifacts() {
    const remoteById = new Map(remoteArtifacts.map((artifact) => [artifact.id, artifact]));
    const merged = baselineArtifacts.map((baseline) => remoteById.get(baseline.id) || baseline);
    const baselineIds = new Set(baselineArtifacts.map((artifact) => artifact.id));

    remoteArtifacts.forEach((artifact) => {
        if (!baselineIds.has(artifact.id)) merged.push(artifact);
    });

    return merged
        .filter((artifact) => !artifact.deleted)
        .filter((artifact) => artifact.published !== false || isAuthorized(currentUser))
        .sort((a, b) => Number(a.order ?? 9999) - Number(b.order ?? 9999));
}

function renderCatalog() {
    const grid = $("#appsGrid");
    const courseView = $("#course-view-container");
    if (!grid) return;

    document.querySelectorAll(".artifact-card").forEach((card) => card.remove());
    if (courseView) courseView.innerHTML = "";

    mergedArtifacts().forEach((artifact, index) => {
        const normalized = { ...artifact, order: Number(artifact.order ?? index) };
        grid.appendChild(buildArtifactCard(normalized));
    });

    if (typeof window.refreshCurrentMarcBookView === "function") {
        window.refreshCurrentMarcBookView();
    }
}

function updateAuthInterface() {
    const authorized = isAuthorized(currentUser);
    const editButton = $("#editPageButton");
    const adminBar = $("#marcbookAdminBar");
    const email = $("#marcbookAdminEmail");

    editButton?.classList.toggle("is-authenticated", authorized);
    if (editButton) {
        editButton.innerHTML = authorized
            ? '<i class="fas fa-circle-check" aria-hidden="true"></i> Mode edició actiu'
            : '<i class="fas fa-pen-to-square" aria-hidden="true"></i> Editar la pàgina';
    }
    adminBar?.classList.toggle("visible", authorized);
    if (email) email.textContent = authorized ? currentUser.email : "";
    renderCatalog();
}

async function login() {
    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithPopup(auth, provider);
    } catch (error) {
        if (error.code === "auth/popup-blocked") {
            await signInWithRedirect(auth, provider);
            return;
        }
        if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
            console.error("No s'ha pogut iniciar sessió", error);
            showToast("No s’ha pogut iniciar sessió. Comprova que Google estigui activat a Firebase.", "error");
        }
    }
}

async function logout() {
    closeArtifactForm();
    await signOut(auth);
    showToast("Has sortit del mode d’edició.");
}

function setField(id, value) {
    const field = document.getElementById(id);
    if (field) field.value = value ?? "";
}

function openArtifactForm(artifact = null) {
    if (!isAuthorized(currentUser)) {
        login();
        return;
    }

    const form = $("#artifactForm");
    form.reset();
    editingId = artifact?.id || null;
    editingIsBaseline = Boolean(artifact?.baseline);
    $("#artifactModalTitle").textContent = artifact ? "Editar artefacte" : "Afegir artefacte";

    setField("artifactTitle", artifact?.title);
    setField("artifactDescription", artifact?.description);
    setField("artifactCategory", artifact?.category || "2eso");
    setField("artifactBadge", artifact?.badge);
    setField("artifactType", artifact?.type || "Activitat");
    setField("artifactColor", artifact?.color || "bio");
    setField("artifactTags", artifact?.tags);
    setField("artifactIconUrl", artifact?.iconUrl);
    setField("artifactIconClass", artifact?.iconClass || "fas fa-atom");
    setField("artifactLink1Label", artifact?.links?.[0]?.label || "Obrir");
    setField("artifactLink1Url", artifact?.links?.[0]?.url);
    setField("artifactLink2Label", artifact?.links?.[1]?.label || "");
    setField("artifactLink2Url", artifact?.links?.[1]?.url);
    setField("artifactOrder", artifact?.order ?? mergedArtifacts().length);
    $("#artifactPublished").checked = artifact?.published !== false;

    $("#artifactModalBackdrop").classList.add("visible");
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#artifactTitle")?.focus(), 50);
}

function closeArtifactForm() {
    $("#artifactModalBackdrop")?.classList.remove("visible");
    document.body.style.overflow = "";
    editingId = null;
    editingIsBaseline = false;
}

function formDataToArtifact() {
    const link1Url = normalizeArtifactUrl($("#artifactLink1Url").value);
    const link2Url = normalizeArtifactUrl($("#artifactLink2Url").value);
    const links = [];

    if (link1Url) links.push({ label: $("#artifactLink1Label").value.trim() || "Obrir", url: link1Url });
    if (link2Url) links.push({ label: $("#artifactLink2Label").value.trim() || "Obrir", url: link2Url });

    return {
        title: $("#artifactTitle").value.trim(),
        description: $("#artifactDescription").value.trim(),
        category: $("#artifactCategory").value,
        badge: $("#artifactBadge").value.trim(),
        type: $("#artifactType").value.trim() || "Artefacte",
        color: $("#artifactColor").value,
        tags: $("#artifactTags").value.trim().toLowerCase(),
        iconUrl: normalizeArtifactUrl($("#artifactIconUrl").value),
        iconAlt: $("#artifactTitle").value.trim(),
        iconClass: $("#artifactIconClass").value.trim() || "fas fa-atom",
        links,
        order: Number($("#artifactOrder").value || 0),
        published: $("#artifactPublished").checked,
        baseline: editingIsBaseline,
        updatedBy: currentUser.email,
        updatedAt: serverTimestamp()
    };
}

async function saveArtifact(event) {
    event.preventDefault();
    if (!isAuthorized(currentUser)) {
        showToast("La sessió d’edició ha caducat.", "error");
        return;
    }

    const saveButton = $("#saveArtifactButton");
    saveButton.disabled = true;
    const wasEditing = Boolean(editingId);

    try {
        const artifact = formDataToArtifact();
        if (!artifact.title || !artifact.links.length) {
            throw new Error("Escriu un títol i almenys un enllaç vàlid.");
        }

        const reference = editingId
            ? doc(db, COLLECTION_NAME, editingId)
            : doc(collection(db, COLLECTION_NAME));

        await setDoc(reference, artifact, { merge: false });
        closeArtifactForm();
        showToast(wasEditing ? "Artefacte actualitzat." : "Artefacte afegit.");
    } catch (error) {
        console.error("No s'ha pogut desar l'artefacte", error);
        const message = error.code === "permission-denied"
            ? "Firebase ha denegat el canvi. Cal publicar les regles de MarcBook."
            : error.message || "No s’ha pogut desar l’artefacte.";
        showToast(message, "error");
    } finally {
        saveButton.disabled = false;
    }
}

async function removeArtifact(artifact) {
    if (!isAuthorized(currentUser)) return;
    const confirmed = window.confirm(`Vols eliminar la targeta «${artifact.title}»?`);
    if (!confirmed) return;

    try {
        const reference = doc(db, COLLECTION_NAME, artifact.id);
        if (artifact.baseline) {
            await setDoc(reference, {
                ...artifact,
                deleted: true,
                updatedBy: currentUser.email,
                updatedAt: serverTimestamp()
            });
        } else {
            await deleteDoc(reference);
        }
        showToast("Targeta eliminada.");
    } catch (error) {
        console.error("No s'ha pogut eliminar l'artefacte", error);
        showToast("No s’ha pogut eliminar la targeta.", "error");
    }
}

function subscribeToArtifacts() {
    onSnapshot(
        collection(db, COLLECTION_NAME),
        (snapshot) => {
            remoteArtifacts = snapshot.docs.map((snapshotDoc) => ({
                id: snapshotDoc.id,
                ...snapshotDoc.data()
            }));
            renderCatalog();
        },
        (error) => {
            console.error("No s'ha pogut llegir el catàleg de MarcBook", error);
            renderCatalog();
            if (isAuthorized(currentUser)) {
                showToast("No es pot connectar amb el catàleg. Revisa les regles de Firebase.", "error");
            }
        }
    );
}

function bindInterface() {
    $("#editPageButton")?.addEventListener("click", () => {
        if (isAuthorized(currentUser)) openArtifactForm();
        else login();
    });
    $("#addArtifactButton")?.addEventListener("click", () => openArtifactForm());
    $("#logoutEditorButton")?.addEventListener("click", logout);
    $("#closeArtifactModal")?.addEventListener("click", closeArtifactForm);
    $("#cancelArtifactButton")?.addEventListener("click", closeArtifactForm);
    $("#artifactForm")?.addEventListener("submit", saveArtifact);
    $("#artifactModalBackdrop")?.addEventListener("click", (event) => {
        if (event.target === event.currentTarget) closeArtifactForm();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeArtifactForm();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    captureBaselineCards();
    bindInterface();
    renderCatalog();
    subscribeToArtifacts();

    try {
        await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
        console.warn("No s'ha pogut conservar la sessió", error);
    }

    onAuthStateChanged(auth, async (user) => {
        if (user && !isAuthorized(user)) {
            const attemptedEmail = user.email || "aquest compte";
            await signOut(auth);
            showToast(`${attemptedEmail} no està autoritzat per editar MarcBook.`, "error");
            return;
        }
        currentUser = user;
        updateAuthInterface();
    });
});
