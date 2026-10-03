# Les transformacions del iode

Dos artefactes de MarcBook amb la mateixa estructura: `transformations-iode.html` per a l’alumnat en francès i `transformaciones-yodo.html` en castellà. La guia docent francesa conserva el català i els exemples en francès del Word aportat; la castellana tradueix tota la guia.

La primera part conté els exercicis 1 i 2. La segona part, amb els exercicis 3 i 4, la fotografia C i la clau de correcció automàtica, només es construeix al navegador després de desxifrar el paquet d’alumnat. El candau superior obre separadament el paquet docent. Els codis acordats es comuniquen fora de la web i no apareixen en aquests fitxers. Cada paquet té una sal i un vector independents i utilitza PBKDF2 SHA-256 amb 150.000 iteracions i AES-GCM. Un codi curt és un bloqueig didàctic; no substitueix autenticació per a informació confidencial.

Les respostes es desen localment per idioma. En recarregar la pàgina, els continguts es tornen a bloquejar i les respostes es conserven. Els codis i el contingut docent desxifrat no es desen. La predicció prèvia queda registrada en el primer desbloqueig. Es poden exportar i importar les respostes en JSON.

El botó final de lliurament corregeix les fletxes, els noms dels processos, les condicions tèrmiques, les marques d’observació/interpretació i les set caselles. Es mostren 14 comprovacions de referència, sense atribuir una qualificació a les competències. Les cinc caselles que declaren accions de l’alumne es comparen amb la clau d’una fitxa completa i requereixen contrast docent amb les explicacions escrites. S’accepten majúscules, accents i els sinònims científics previstos. «Condensació» sense més precisió no s’accepta per al pas gas → sòlid.

Les respostes llargues i la justificació de la revisió de la predicció requereixen revisió docent. El lliurament prepara un document HTML llegible amb les respostes i la correcció, descarregable i imprimible; no hi ha servidor de recepció, compte ni enviament automàtic al professorat. Imprimir/PDF inclou només la part desbloquejada; imprimir la correcció des del seu diàleg inclou només la guia docent.

Fonts: els dos Word proporcionats per Marc el 3 d’octubre de 2026. Es conserven les tres fotografies del dossier, convertides a WebP per reduir-ne el pes. La tercera fotografia només viatja dins el paquet protegit. Es corregeixen dos errors lingüístics en francès: la concordança de la primera frase i «paroi froide» en lloc de «cristal froid». No s’afegeix cap experiència de laboratori.

La nova coberta `assets/resource-iode.webp` s’ha creat amb l’eina integrada ImageGen. Prompt: cristalls grisos de iode en un plat i un flascó amb vapor violeta, dibuix de tinta fina i aquarel·la sobre fons ivori, porpra i taronja, sense text, refredament ni dipòsit sobre les parets. La coberta no revela la nova prova.

Comprovacions: `node --test CFN/1r/UT-1/iode/activity.test.mjs` i les proves del catàleg de `renovacio`. La revisió de navegador comprova els codis incorrectes i correctes, la independència dels dos accessos, el desament, la correcció i la descàrrega.

Cada pregunta o subpregunta té un botó d’avaluació amb el criteri de C1, les evidències observables esperades i els límits del que es pot valorar. La guia docent en té un per a cadascuna de les quatre preguntes. Font: «Rúbrica C1 UT 1.1 — La fórmula secreta (alumne — amb recursos)» aportada per Marc. Els textos adapten CA1 Rigor i CA2 Precisió al dossier sense exigir conservació de la massa, un experiment autònom o una representació corpuscular que no es demana. Les orientacions no contenen la solució de la predicció.

Les dues versions s’agrupen en una única fitxa de MarcBook, «Les transformacions del iode», amb els enllaços Castellà i Francès a Versions disponibles. Els accessos antics a les fitxes per idioma continuen obrint aquesta fitxa única.
