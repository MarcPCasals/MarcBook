# MarcBook — revisió del disseny i del funcionament

Source visual truth: `/Users/marc/.codex/generated_images/01a0fd34-39f3-7b82-849d-ce0b76254b12/exec-62a25e01-2d0c-40f3-b2e5-c92a9108da41.png`

Implementation: `http://localhost:5173/`

## Current artwork update — 2026-10-02

Marc requested resource-specific drawings after finding that different artifacts reused generic covers. The 31 public cards now have 31 distinct images: 26 new built-in image_gen illustrations based on the actual artifact sources and the 5 explicitly praised illustrations preserved byte for byte. `artwork-review.md` lists the mappings, source/prompt manifests and individual visual reviews. The catalog change affects only the 26 image fields. The illustration dropdown derives resource-specific choices from the canonical bundled catalog. Personal access covers, original resource files and PI exclusion remain unchanged.

All new files were inspected at full resolution and after WebP optimization. Independent checks prompted repairs of digestive arrows, label units, cycle-wheel colors, observation tallies, ambiguous molecular sketches and a neural/endocrine pathway. Final scientific reviews found no material defect in the repaired images. Coverage and preservation checks, 28 tests, the production build and Pages packaging pass. Interactive local browser checks experienced repeated connection deadlines, including a new tab; this update does not claim fresh desktop/mobile browser screenshots. Earlier screenshots and their layout findings below remain historical evidence. Production asset verification is performed against the public release.

## Release review — canonical catalog and web publication

Marc authorized completing and publishing the redesign step by step on 2026-10-02. The canonical catalog is now `../marcbook-catalog.json`; the app fetches it at runtime, so publishing content does not require rebuilding the frontend. The audited counts remain 34 total records and 31 public cards, with 25 available educational tools, 6 in preparation and 3 personal accesses. Eines docents now has 5 resources, including the transversal letter reflection. All 42 unique links respond HTTP 200; see `catalog-audit.md` for source-backed content corrections.

- The previous public website was inspected after loading: 37 original base cards, including the 3 PI cards intentionally excluded. No additional public remote cards were found.
- `qa/editor-publication-desktop.jpg` and `qa/editor-publication-mobile.jpg` show the editor with its publication panel open. A first capture revealed narrow form fields after adding the disabled fieldset and mobile grid overflow. Corrected label selectors, field widths and grid minimum sizes; current checks show form/input widths of 1047 px on desktop and 354 px on mobile, with no horizontal overflow. No actionable P0/P1/P2 findings remain from this addition.
- Browser flow: changed QuimiLab's summary with a temporary test sentence; saved; publication review showed exactly one updated card; reloaded; the change and its baseline survived; restored the original summary; review returned to zero changes. No test sentence was included in the canonical catalog or release. Unsaved form drafts also retain their original baseline; combining drafts from different tabs with different baselines requires an explicit review. Both concurrency cases have regression tests.
- Browser flow: Eines docents shows the 5 intended resources. AvaluaPro's detail and launch dialog distinguish the current `avaluapro.web.app` link from the original V1. Both paths preserve their actual destinations.
- GitHub publication uses a runtime-only key and one fixed Contents API endpoint. It checks the original catalog and the remote file SHA, refuses conflicts, never retries an uncertain PUT automatically, and checks the public Pages JSON before reporting success. The uncertain outcome UI requires a read from GitHub before allowing a new publication attempt. The editor also offers download/upload through GitHub as an alternative.
- 28 domain, publication, draft, packaging and preserved Sites tests pass. Publication network responses are mocked in automated tests; no real publication key was placed in the browser for testing. The production build and dry-run packaging pass.
- GitHub Pages release preparation preserves original tools, the root PI directory and unrelated `c2/`. The original homepage is archived as `index-anterior.html`; the canonical JSON cannot be overwritten by the packaging script.

### Public release verification — 2026-10-02

- GitHub Pages completed its production deployment for commit `5da6aa2fa629af1c220a9ecf73afbe312d2b9c2e` (workflow run `37043023592`, status `built`, no build error).
- The published homepage and canonical JSON at `https://marcpcasals.github.io/MarcBook/` match the release files byte for byte. The real publication module read both GitHub and public Pages without a key: 34 records on each side, matching normalized contents.
- Public browser checks: the homepage renders with all images loaded and no horizontal overflow; the catalog shows 31 cards and no PI filter; searching QuimiLab returns one result; its detail route shows objectives, classroom guidance, evidence, materials and the two actual language links.
- The published editor opens without signing in, lists 34 records including personal entries and shows an up-to-date publication review. Its key field is empty, and confirmation is disabled until there are changes and publication authorization. No authenticated browser write was performed; the owner must supply their own restricted GitHub key or use the manual upload alternative.
- `qa/home-release-desktop.jpg`, `qa/home-release-tablet.jpg` and `qa/home-release-mobile.jpg` record the final packaged layout at desktop, tablet and mobile viewport sizes. These are browser viewport checks, not tests on physical Safari/iPad devices.

The acceptance sections below describe earlier stages; their preview-only publication status and outstanding decisions are historical.

## Current acceptance — PI excluded

Marc explicitly excluded all PI artifacts on 2026-10-02. This instruction overrides the approved source image's Projecte Integrador navigation entry and third homepage pathway. The homepage now has two balanced pathways, Ciències and Eines docents, while retaining the approved portrait, colors, typography and chemistry itinerary.

- Removed Avaluador de PI, Planificador de PI and Metacognició final de PI from the catalog, navigation, filters, detail routes and editor. No PI artwork is served.
- Current catalog: 34 records, including 25 available educational tools, 6 in preparation and 3 discreet personal accesses; 31 public catalog cards.
- `qa/comparison-no-pi.jpg` compares the source and current desktop capture at a normalized width of 1486 px. The two-column pathway change is intentional; there are no empty slots, clipped illustrations or actionable P0/P1/P2 findings from this change.
- `qa/home-no-pi-desktop.jpg` and `qa/home-no-pi-mobile.jpg` show the updated homepage. Desktop and mobile have no horizontal overflow or unloaded images; mobile preserves the single-column adaptation.
- Browser checks confirm 31 catalog results, 34 editor entries, and no PI category or illustration option. The former Planificador de PI detail address returns the unavailable-page view.
- Six domain tests pass, including exclusion of PI from old backups and exports while retaining unrelated edits, and rejection of recategorized PI links. The production build passes.
- Local preview updated. Original root website and original PI files remain untouched.

The comparison history below records the earlier approved implementation before Marc removed PI. Its previous counts and three-pathway description are historical.

Source: 1486 × 1059 px. Desktop browser viewport: 1487 × 1060 CSS px, screenshot at density 1; full-page captures preserve their real height. Source and implementation normalized to 1486 px width for the combined comparisons. State: home, default catalog, no local overrides, no open menus.

## Comparison history

1. `qa/comparison-v1.jpg` and `qa/hero-comparison-v1.jpg`: combined source/render inputs. P2: smaller navigation, background rectangles around pathway artwork, clipped portrait hair, generic liquid-laboratory thumbnail for a nomenclature tool, and three identical card structures where the third source card uses a wide reaction image. Updated typography, portrait crop, transparent pathway images, water-molecule art and the third card structure.
2. `qa/comparison-v2.jpg` and `qa/cards-comparison-v2.jpg`: combined source/render inputs after fixes. P2: excess pathway height, the handwritten note breaking into too many flex fragments, and the third card placing metadata/actions on separate lines. Reduced the pathway height, grouped the note text and aligned metadata/actions. The rendered page was 1157 px tall.
3. `qa/comparison-final.jpg` and `qa/cards-comparison-final.jpg`: combined source/render inputs. The rendered page is 1083 px tall; sections and card density now follow the approved source. The first capture of this pass exposed P2 cropping of atoms in the 16:9 reaction banner. Generated a dedicated wide illustration, keeping the original 16:9 illustration for catalog/detail views. Recaptured the page and both combined comparisons at the same viewport: every atom now fits within the banner; the full composition remains readable. No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces

- Typography: Newsreader headings, DM Sans controls/body and Caveat handwritten accents. Header, hero, pathway headings, card headings and metadata compared in full and focused inputs. The mock’s fictional/generated type is interpreted with available web fonts; hierarchy and wrapping are preserved.
- Spacing/layout: same order, three-column pathways, two portrait cards plus a wide third card, apricot/lavender bands and compact footer. Final height differs by about 2%; additional real language versions account for some metadata differences.
- Colors: deep purple primary, orange secondary, ivory, apricot and lavender. Dark text on orange actions is intentional to maintain readable contrast. Gray-purple body text is less saturated than the generated mock.
- Artwork: actual MB logo and generated raster illustrations; approved drawn Marc, ink/watercolor objects, no photos in the app. All served images compressed to WebP, less than 1 MB total. No CSS/SVG illustration substitutes. Source artwork remains locally outside the served directory.
- Copy: descriptions corrected where the mock implied functionality absent from the actual resources (e.g. QuimiLab concerns nomenclature; molecular construction uses physical models). Both real language versions retained. Classroom guidance explicitly marked as adaptable proposals.

## Browser and functional evidence

- `qa/home-mobile.jpg`: 390 × 844 CSS viewport, full-page home capture; single-column adaptation. No overflow or missing images. Compact images changed to contain their diagrams; link tap targets increased.
- `qa/catalog-mobile.jpg`: same mobile viewport, catalog capture. Menu opens/closes; course filter returns 9 fourth-year resources; empty search has a reset action. No horizontal overflow.
- `qa/home-tablet.jpg`: 768 × 1024 CSS viewport. All five navigation entries remain inside the screen, all images load, no overflow.
- Desktop filters: 4t + UT 4.4 returns 4 resources; adding Francès returns 2. Card/list toggle works; detail route renders objectives, steps, evidence, materials, related tools and versions.
- Language dialog opens; its French link launches the actual public QuimiLab tool in a new tab, confirmed by tab URL/title.
- Editor: created a fictional local record (38th entry); preview rendered its title/goal; saved; reloaded; record still present. Exported JSON file contains all 38 entries and the test record. Invalid import reports validation error; valid 37-record import requires a concrete confirmation and restores the baseline, removing the test record. No real personal or classroom data entered.
- Final checks: Projecte Integrador has 3 resources, Eines docents has 4, Personal has the 3 original accesses, and About links to 28 available educational resources. Final mobile capture was refreshed after the wide reaction artwork and tap-target refinements.
- Five domain tests pass: original links exist; all 37 entries retained; intersected/accent-insensitive search; safe import and export round trip; duplicate IDs and unsafe links rejected; shared URLs preserve filters.
- Production build passes. Original root site unchanged; unrelated `c2/` untouched.
- Browser error/warning console checked: none at the time of the editor checks. Final error/warning console check also returned an empty list.

## Historical decisions and gaps before release

Public publishing from the editor is deliberately unconfigured pending Marc’s choice; local save never claims to publish. The current published site has not been replaced. Existing artifacts retain their original storage and access behavior. Full end-to-end testing of all 28 tools is outside this catalog redesign; every original link was checked against repository files.

final result: passed

## Acceptance and follow-up polish

All five fidelity surfaces were compared in combined full-view and focused inputs. Source and implementation preserve the main proportions, the approved illustrated character and the pathway/itinerary structure. Remaining P3 variations: the real logo and serif glyphs have slightly different optical sizing, handwritten decoration is simplified, and thumbnail models have scientifically clearer colors than the generated source. These do not hide content or controls. Public publication remains a separate decision.

Checklist completed: artwork integration, semantic routes, actual original links, editor validation/persistence/export/import, desktop/tablet/mobile layout, production build, no warning/error console output.
