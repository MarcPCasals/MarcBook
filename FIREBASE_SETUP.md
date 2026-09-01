# Activació de l’editor de MarcBook

La pàgina pública sempre pot mostrar les targetes que ja existeixen a `index.html`. Per activar la creació i l’edició de targetes des de la web cal completar aquests dos ajustos al projecte Firebase `eines-docents`.

## 1. Inici de sessió amb Google

Al tauler de Firebase:

1. Obre **Authentication → Sign-in method**.
2. Activa el proveïdor **Google**.
3. A **Authentication → Settings → Authorized domains**, comprova que hi hagi `marcpcasals.github.io`.

## 2. Regles de Firestore

Afegeix aquest bloc dins de `match /databases/{database}/documents` de les regles actuals. No substitueixis les regles de les altres eines del projecte.

```text
match /marcbook_artifacts/{artifactId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null
    && request.auth.token.email == "mperezc@educand.ad";
}
```

Després prem **Publish**. La lectura és pública perquè els alumnes puguin veure el catàleg sense iniciar sessió. L’escriptura queda limitada al compte indicat encara que algú intenti saltar-se els botons de la pàgina.

## Funcionament

- Col·lecció de Firestore: `marcbook_artifacts`
- Compte editor: `mperezc@educand.ad`
- Les targetes originals continuen sent la còpia de seguretat local.
- Les targetes noves i les modificacions es guarden a Firestore.
- Un enllaç `github.com/MarcPCasals/MarcBook/blob/main/...` es converteix automàticament en una ruta de GitHub Pages.
