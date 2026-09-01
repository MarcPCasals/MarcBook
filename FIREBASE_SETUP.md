# Activació de l’editor de MarcBook

La pàgina pública sempre pot mostrar les targetes que ja existeixen a `index.html`. La creació i l’edició de targetes utilitzen el projecte Firebase `eines-docents`.

**Estat:** configuració activada i regles publicades l’1 de setembre de 2026.

## 1. Inici de sessió amb Google

Configuració verificada al tauler de Firebase:

1. Obre **Authentication → Sign-in method**.
2. Activa el proveïdor **Google**.
3. A **Authentication → Settings → Authorized domains**, comprova que hi hagi `marcpcasals.github.io`.

## 2. Regles de Firestore

Aquest bloc està publicat dins de `match /databases/{database}/documents`, sense substituir les regles de les altres eines del projecte.

```text
match /marcbook_artifacts/{artifactId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null
    && request.auth.token.email == "mperezc@educand.ad";
}
```

La lectura és pública perquè els alumnes puguin veure el catàleg sense iniciar sessió. L’escriptura queda limitada al compte indicat encara que algú intenti saltar-se els botons de la pàgina.

Proves efectuades després de publicar:

- Lectura sense sessió: permesa.
- Escriptura sense sessió: denegada amb `PERMISSION_DENIED`.

## Funcionament

- Col·lecció de Firestore: `marcbook_artifacts`
- Compte editor: `mperezc@educand.ad`
- Les targetes originals continuen sent la còpia de seguretat local.
- Les targetes noves i les modificacions es guarden a Firestore.
- Un enllaç `github.com/MarcPCasals/MarcBook/blob/main/...` es converteix automàticament en una ruta de GitHub Pages.
