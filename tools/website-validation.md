# Light portfolio redesign validation

Validated on 2026-10-07.

The main portfolio now uses a custom light Jekyll layout based on concept H. Chirpy and its unused configuration, contact/share data, asset submodule and post-history hook have been removed. Superseded mockups, old audit evidence, an accidental Git-log file, and the unused root Vite cache were cleaned up. The selected H mockups remain as excluded design references; they are never used by the website.

## Preserved content and protected files

- All 10 published project pages remain at their existing URLs.
- All 3 unfinished posts remain in the repository with their existing unpublished status.
- All 5 publications and their links remain.
- Education, work and teaching experience, awards, skills, languages, CV links, report links, collaborators, contact information, Teams and Sunshine remain.
- The original homepage introduction and all 6 gallery entries moved to About.
- Compared 18 original project/tab document bodies against the saved pre-redesign inventory. Only local image URLs, a YouTube accessibility title, and whitespace differ.
- All 368 tracked files under RollyPoly, including Robot3D, match their original SHA-256 hashes.
- MSc_pres and the shared presentation CSS/JavaScript have no changes.
- Retained the old favicon URL referenced by the standalone exports, avoiding a dependency on Chirpy for that file.

## Checks

- The documented production build command, `tools/test.cmd`, passes.
- HTML-Proofer checks 41 HTML files with no failures.
- Portfolio validation verifies projects, drafts, publications, gallery, custom layouts and local image references.
- Browser regression: 24 page/viewport scenarios, 321 checks, zero failures.
- Browser coverage includes desktop, tablet, 390px and 320px phones, every published project page, all portfolio tabs, About, mobile menu/Escape behavior, project filters, image loading, horizontal overflow, zoom access, JavaScript exceptions and network errors.
- Presentation resource checks: 129 references, zero failures; 9 presentation JavaScript files pass syntax checks.
- The new portfolio JavaScript, retirement worker, and browser test script pass syntax checks.
- A build with `baseurl: /preview` verifies prefixed portfolio links and images on Home, About and a project with raw Markdown links.
- The local preview command starts successfully at http://127.0.0.1:4000/.

The standalone slide decks and 3D viewer were not redesigned or edited. This run verifies their file integrity, resources and syntax; it does not repeat their full interactive browser suite. The existing browser suite can still run them by omitting `BROWSER_TEST_PORTFOLIO`.

## Images and artifacts

Copied 40 existing portfolio image files from the original CDN. All originals remain in `assets/images/`. Smaller local WebP copies in `assets/images/previews/` reduce page transfer sizes; the preview set totals about 2.56 MB. The main site no longer relies on the external portfolio image CDN. Annotated figures use contained thumbnails to keep their labels visible.

Screenshots and browser reports are in `.test-results/browser/`; the temporary source inventory and preservation checks are in `.test-results/redesign/`. Test artifacts and design references are excluded from the published site.

Changes are local; no commit, push or deployment was made. The removed theme submodule entry is staged because Git tracks it as a gitlink.
