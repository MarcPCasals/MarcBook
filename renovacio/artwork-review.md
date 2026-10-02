# Il·lustracions temàtiques de MarcBook

## Retrat sense llibreta — 2 d’octubre de 2026

Per indicació de Marc, s’ha editat el retrat amb l’eina integrada `image_gen` per eliminar la llibreta vertical i el missatge «Ciència per a un món millor». La samarreta clara i les mans es reconstrueixen amb una postura natural. Es conserven el personatge aprovat, la jaqueta taronja, l’estil d’aquarel·la i l’aula, inclosa la pissarra. La imatge revisada és `public/assets/hero-marc-classroom.webp`, de 1440 × 811 px i 140.432 bytes; s’utilitza a la portada i a Sobre MarcBook. El nom nou permet carregar l’edició sense reutilitzar una còpia antiga del navegador. L’original es conserva.

`artwork-hero-edit.json` registra la font, el resultat i el prompt complet de l’edició. S’han inspeccionat el PNG generat, la versió WebP i el resultat a la portada local. `qa/home-teacher-audience-narrow.png` mostra la portada real al panell estret, amb els textos adreçats al professorat i sense la llibreta.

## Cobertes dels recursos

Actualització del 2 d’octubre de 2026: cada una de les 31 fitxes públiques té una coberta pròpia. S’han creat 26 il·lustracions amb l’eina integrada `image_gen` i s’han conservat les cinc que Marc va valorar positivament. Les escenes parteixen del contingut dels HTML dels artefactes, amb traç fi, aquarel·la, porpra i taronja. Les sis eines en preparació tenen una representació de la disciplina, sense atribuir-los funcionalitats encara inexistents.

## Imatges conservades

El Laboratori de Newton, el simulador de mitosi i meiosi, les guies d’investigació de la Terra i de l’Univers, i el Plat de Harvard. S’ha comprovat que els cinc WebP són idèntics als de la publicació anterior.

## Imatges noves

Els fitxers WebP de la taula són a `public/assets/` i es publiquen també a l’arrel `assets/`. Els originals PNG es conserven a `.artwork-originals/`, fora del lliurable.

| Recurs | Escena | Fitxer |
| --- | --- | --- |
| Les Cròniques dels Nutrients | Recorregut digestiu i absorció a les vellositats | resource-les-croniques-dels-nutrients.webp |
| Detectiu d’Etiquetes Alimentàries | Lupa, etiquetes per 100 g i comparació d’aliments | resource-detectiu-d-etiquetes-alimentaries.webp |
| Argumentació científica | Article sota lupa i connexió entre afirmació, evidència i conclusió | resource-argumentacio-cientifica.webp |
| La química de l’amor | Cervell, sinapsi, vies nervioses i missatgers a la sang | resource-la-quimica-de-l-amor.webp |
| Protocol Pubertat | Cartes de REPRO-RACE i roda del cicle | resource-protocol-pubertat.webp |
| Clau dicotòmica roques | Arbre de decisions i textures de mostres | resource-clau-dicotomica-roques.webp |
| Laboratori de roques | Comparació de mostres, lupa i quadern d’observació | resource-laboratori-de-roques.webp |
| Cicle de les roques | Magma, roques, sediments i transformacions | resource-cicle-de-les-roques.webp |
| Química, en preparació | Materials i representació de la disciplina | resource-quimica.webp |
| Quiz de Forces | Preguntes amb exemples de moviment i forces | resource-quiz-de-forces.webp |
| Som iguals? | Observació de trets i freqüències d’un grup fictici | resource-som-iguals.webp |
| Joc de rol enginyeria genètica | Debat amb els cinc perfils del joc i evidències | resource-joc-de-rol-enginyeria-genetica.webp |
| Construcció de molècules | Kit físic de boles i connectors amb H₂O, CO₂ i NH₃ | resource-construccio-de-molecules.webp |
| QuimiLab | Targetes de fórmules i pràctica de nomenclatura | resource-quimilab.webp |
| La balança química | Conservació de quatre H i dos O a cada costat | resource-la-balanca-quimica.webp |
| Escape room de química | Auditoria climàtica d’un vehicle de metà i informes | resource-escape-room-de-quimica.webp |
| Català, en preparació | Lectura, escriptura i vocabulari català | resource-eina-de-catala.webp |
| Castellà, en preparació | Lectura, escriptura i vocabulari castellà | resource-eina-de-castella.webp |
| Francès, en preparació | Quadern de llengua amb expressions franceses | resource-eina-de-frances.webp |
| Anglès, en preparació | Lectura i expressions de conversa en anglès | resource-eina-d-angles.webp |
| Matemàtiques, en preparació | Representacions matemàtiques i material de treball | resource-eina-de-matematiques.webp |
| Agenda docent | Setmana lectiva i recordatoris | resource-agenda-docent.webp |
| Programador docent | Seqüència de sessions, activitats i materials | resource-programador-docent.webp |
| Seguidor de tasques | Registre anònim de tasques fetes, pendents i tardanes | resource-seguidor-de-tasques.webp |
| AvaluaPro | Rúbrica, evidències i progrés | resource-avalua-pro.webp |
| Metacognició en una carta | Carta reflexiva amb aprenentatge i millora | resource-metacognicio-en-una-carta.webp |

## Fonts, prompts i revisió

Els prompts complets, els camins dels artefactes llegits, els resultats de generació i les reparacions es troben als manifests:

- [Biologia i genètica](artwork-biology.json)
- [Geologia, forces i repte químic](artwork-geology.json)
- [Eines docents i llengües](artwork-teaching.json)
- [Molècules, nomenclatura, balança i llengües](artwork-chemistry-languages.json)

Les 26 imatges noves s’han inspeccionat a mida completa i després d’optimitzar-les. La revisió independent ha comprovat la correspondència temàtica i la coherència dels diagrames. S’han reparat fletxes digestives, unitats de les etiquetes, colors de la roda REPRO-RACE, un recompte de freqüències, esbossos moleculars ambigus i la separació entre senyals nerviosos i hormones circulants. L’equació de la balança conserva quatre àtoms d’hidrogen i dos d’oxigen a cada plat.

Les noves cobertes fan 900 × 507 px i es lliuren en WebP. La biblioteca completa ocupa aproximadament 3 MB; les targetes conserven la càrrega diferida. L’editor incorpora totes les noves il·lustracions amb el nom del recurs corresponent.

## Comprovacions de lliurament

- 31 cobertes diferents per a 31 fitxes públiques; 26 assignacions noves.
- Els altres camps del catàleg i els accessos personals es conserven.
- Els cinc dibuixos valorats positivament es conserven byte per byte.
- Cap artefacte de PI al catàleg.
- 28 proves correctes, compilació de producció correcta i preparació de GitHub Pages validada.

La comprovació interactiva del navegador local ha patit terminis d’espera de la connexió, també en una pestanya nova. Aquesta revisió es basa en la inspecció dels fitxers finals, les comprovacions del catàleg i del paquet, i la verificació HTTP de la publicació; les captures anteriors de `qa/` corresponen a les versions prèvies del catàleg.
