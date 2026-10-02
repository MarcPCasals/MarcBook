# MarcBook · renovació

Codi font de la nova portada i del catàleg de MarcBook. La compilació es publica a l’adreça habitual de GitHub Pages; les eines existents es conserven.

## Què inclou

- Portada fidel al disseny aprovat: porpra i taronja, il·lustracions d’aquarel·la i el personatge d’en Marc.
- Catàleg de 34 fitxes: 25 recursos educatius disponibles, 6 en preparació i 3 accessos personals.
- Cerca sense distinció d’accents i filtres combinables d’àmbit, curs, UT, llengua, tema, tipus i disponibilitat.
- Vista de targetes/llista; fitxes compartibles i imprimibles amb objectius, orientacions d’aula, evidències, materials i recursos relacionats.
- Eines docents, presentació d’en Marc i accessos personals al peu.
- Editor web: crear/editar/ocultar fitxes, previsualitzar, guardar localment, exportar/importar JSON, recuperar una fitxa pendent d’edició i publicar el catàleg a GitHub.

## Contingut i publicació

El catàleg canònic (`../marcbook-catalog.json`) deriva dels accessos de la web pública del 2 d’octubre de 2026 i es carrega en temps d’execució. Els artefactes de PI s’exclouen per indicació de Marc. S’han comprovat les llengües i els 42 enllaços; el Laboratori de roques i el Cicle tenen accessos diferenciats, i AvaluaPro ofereix la versió actual i la V1 identificada. Les còpies locals i els fitxers antics s’importen excloent-ne el PI i conservant els altres canvis. Les orientacions pedagògiques són propostes adaptables; no atribueixen funcions noves a les eines originals. Les fitxes incompletes apareixen com a «En preparació» i no ofereixen un accés inexistent. Vegeu `catalog-audit.md`.

Guardar a l’editor canvia només la vista del navegador actual. Exportar crea un catàleg amb `schemaVersion: 1`; importar valida totes les fitxes abans de substituir la còpia local. Un avís permet alternar entre els canvis locals i el catàleg publicat. Les còpies locals noves conserven també la versió de partida per detectar canvis fets des d’altres dispositius.

Per publicar des de la web:

1. Obriu **Editar continguts**, completeu les fitxes i guardeu els canvis locals.
2. Desplegueu **Publicar els canvis a la web** i reviseu la llista de fitxes que canviaran.
3. Introduïu una clau personal granular de GitHub, limitada al repositori **MarcPCasals/MarcBook**, amb **Contents: Read and write**. La clau només es manté en memòria dins l’editor; no es desa en cap fitxer, URL ni emmagatzematge del navegador.
4. Premeu **Confirma i publica**. L’editor comprova la versió remota abans de substituir el JSON, conserva els esborranys si hi ha conflictes i diferencia «enviat a GitHub» de «publicació comprovada a la web».

Hi ha una alternativa sense clau: descarregar `marcbook-catalog.json` des del mateix panell i pujar-lo a l’arrel amb la interfície de GitHub. Aquesta opció requereix confirmar el canvi amb el compte de GitHub. Els visitants de MarcBook no necessiten cap compte; la portada i el catàleg no fan servir Firebase ni cap base de dades. Les aplicacions vinculades conserven el seu funcionament propi.

Referències: [claus personals de GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [actualització de fitxers](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents).

Cada fitxa pública té una il·lustració temàtica pròpia: 26 dibuixos nous basats en els artefactes reals i les 5 imatges que Marc va valorar positivament. Les noves imatges són WebP de 900 × 507 px; la biblioteca completa, incloses les imatges anteriors que es conserven, ocupa aproximadament 3 MB. Les targetes carreguen les imatges quan s’apropen a la vista. Els PNG de treball queden en `.artwork-originals/`, fora del lliurable i del control de versions. No es publiquen les fotografies de referència. La correspondència, els prompts i la revisió es documenten a `artwork-review.md` i als quatre manifests `artwork-*.json`.

## Desenvolupament i comprovacions

```sh
npm install
npm run dev
npm test
npm run build
```

La sortida estàtica és `dist/client/` i funciona també en una subcarpeta. Es mantenen els fitxers del prototip inicial per a un eventual lliurament a Sites. Les proves comproven la conservació dels recursos i dels seus accessos, la combinació dels filtres, els identificadors compartibles i la importació/exportació. La revisió visual i les proves reals de navegador es documenten a `design-qa.md`.

## Lliurament a GitHub Pages

El catàleg canònic és `../marcbook-catalog.json`, amb `schemaVersion: 1` i `resources`. Vite el serveix durant el desenvolupament i en deixa la mateixa còpia a `dist/client/`. La compilació valida totes les fitxes i rebutja un catàleg que encara contingui PI.

Abans d’una nova actualització del disseny, sincronitzeu el repositori amb GitHub per recuperar també les publicacions fetes des de l’editor. La compilació no ha de reemplaçar una versió del catàleg més recent amb una còpia antiga.

```sh
npm test
npm run build
npm run pages:check
```

`pages:check` només comprova el lliurable. Quan toca preparar la publicació, `npm run pages:prepare` copia la portada compilada, els fitxers JavaScript/CSS de `marcbook-assets/` i les il·lustracions de `assets/` a l’arrel del repositori. `npm run build:pages` combina la compilació i aquesta preparació. Aquests passos modifiquen l’arrel local; no fan cap commit, push ni desplegament per si mateixos. GitHub Pages continua publicant l’arrel de la branca principal amb la configuració existent.

Abans de substituir la portada per primera vegada, es desa `../index-anterior.html` al mateix nivell: així es conserven els enllaços relatius i l’accés a l’editor anterior. El preparador preserva totes les eines existents, `PI/`, el treball independent de `c2/`, els scripts antics i les imatges alienes a la renovació. No copia codi font, captures de comprovació ni mapes de codi. El catàleg compilat ha de coincidir exactament amb el canònic: si s’ha editat després de compilar, cal repetir la compilació. El catàleg canònic mai se sobreescriu.

El fitxer `../.marcbook-pages-manifest.json` identifica els assets generats. Qualsevol col·lisió amb un fitxer anterior diferent atura la preparació abans de substituir la portada. En publicacions posteriors només s’actualitzen els assets generats que continuen intactes; les còpies antigues es preserven. Cal incloure el manifest al commit juntament amb la portada, el catàleg i els assets preparats.
