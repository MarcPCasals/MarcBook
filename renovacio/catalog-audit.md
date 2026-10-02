# Auditoria del catàleg de MarcBook

Revisió del 2 d’octubre de 2026. Catàleg canònic: `../marcbook-catalog.json`, format `{ schemaVersion: 1, resources: [...] }`.

## Resultat

- Es mantenen **34 fitxes**: 20 recursos de ciències disponibles, 5 recursos docents disponibles, 6 propostes en preparació i 3 accessos personals. Els artefactes de PI estan exclosos.
- Els **42 enllaços inicials** han respost HTTP 200. Hi havia dos enllaços repetits del Cicle de les roques dins la fitxa Laboratori de roques.
- El catàleg corregit té **42 enllaços únics**, tots comprovats de nou amb resposta HTTP 200. Incorpora el laboratori de roques en francès i l’AvaluaPro actual, i conserva l’AvaluaPro V1.
- La portada pública anterior conserva 37 targetes de base: 34 incloses i 3 de PI excloses per petició de Marc. La comprovació del DOM públic feta per l’agent principal no ha detectat targetes remotes addicionals.

## Correccions aplicades

| Fitxa | Canvi | Evidència |
| --- | --- | --- |
| Som iguals? | Idioma i etiqueta de l’enllaç: Castellà. | `CFN/4t/UT4-3/respostes-inicial.html:2` declara `lang="es"`; el títol és «¿Somos iguales?». |
| Laboratori de roques | Enllaços Castellà/Francès al laboratori; els enllaços del Cicle queden exclusivament a la seva fitxa. Descripció, objectiu, passos i evidències reformulats com a indagació i classificació. | `laboratorio-rocas.html:318`, `:342`, `:504`, `:594`, `:630` i `:738`: hipòtesi, comparació, regla, diàleg, identificació i transferència. La versió francesa `CFN/2n/UT2-4/lab-roches.html` existeix i respon HTTP 200. |
| Metacognició en una carta | Àmbit Eines docents per facilitar-ne l’accés com a recurs transversal. | `Altres/metacognicio-carta.html` presenta una reflexió final de UT. Es conserva aquesta fitxa; no correspon a `PI/metacognicio-pi.html`. |
| AvaluaPro | Marca escrita AvaluaPro; primer accés a `https://avaluapro.web.app/`, segon accés identificat com «Versió original (V1)». Text sense promeses noves de funcionalitat. | La publicació actual respon HTTP 200 i `/Users/marc/Documents/projectes/avaluapro/.firebaserc` identifica el projecte `avaluapro`. L’HTML V1 es conserva a `Altres/avaluapro.html`. |
| Seguidor de tasques | Títol, descripció i botó identifiquen clarament la versió original conservada. | `Altres/seguidor-tasques.html` és el fitxer existent i el seu enllaç respon HTTP 200. |
| El Laboratori de Newton | La presentació reflecteix els quatre mòduls reals i l’objectiu inclou el model físic corresponent. | `CFN/4t/UT4-2/laboratorio-newton.html:164`, `:359`, `:452`, `:633`: vectors, vehicle, Hooke i missió orbital. |
| Detectiu d’etiquetes alimentàries | Tipus Eina i passos centrats en introduir les dades per 100 g i interpretar el veredicte. | `CFN/2n/UT2-2/detective-etiquetas.html:104` i `:179`: dades nutricionals per 100 g i veredicte final. |

## Publicacions existents del catàleg anterior

S’ha fet una lectura anònima a l’API pública de Firestore, únicament de la col·lecció `marcbook_artifacts` del projecte `eines-docents`, amb consulta `published == true`. La resposta ha retornat només `readTime`, sense documents: **0 publicacions remotes amb aquest filtre**. No s’han consultat altres col·leccions, comptes autenticats ni dades de classe.

El filtre és deliberadament limitat a publicacions explícitament públiques. La comprovació independent de la portada pública anterior ha trobat només les targetes de base; no s’ha detectat contingut públic addicional que calgui traslladar.

## Abast de la verificació

La comprovació HTTP confirma que les adreces existeixen; no certifica tots els fluxos interactius de les aplicacions. L’auditoria pedagògica s’ha basat en el codi font públic dels recursos. No s’ha executat cap prova amb alumnes, comptes reals ni informació guardada dels usuaris. Els objectius i evidències descriuen propostes d’ús docent, sense atribuir exportacions o funcions que no s’han verificat.
