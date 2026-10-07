# Website repair and validation - 7 October 2026

The website has been repaired locally. The public deployment has not been changed, committed, or pushed by this task.

## Repairs

- Removed the source-root `.nojekyll` that bypassed the Jekyll build. The workflow now marks the generated artifact as static and checks that Pages uses GitHub Actions.
- Scoped both presentation entry scripts, styles, fonts, logos, images, and embedded diagrams to `/RollyPoly/` or `/MSc_pres/`. Updated the bundle content hashes.
- Replaced the two missing RollyPoly fabrication images with existing project photographs and corrected the gallery award-photo filename.
- Fixed an expanding animation-frame retry queue in the geometry cards. Initialization now schedules at most one retry and stops after leaving the slide. Hidden cards stop rendering. Videos preload metadata and play only on the visible slide/fragment.
- Preserved deep links, added keyboard-accessible section buttons and visible navigation arrows, enabled browser zoom, and added readable scrollable slide content on portrait phones.
- Aligned the standalone viewer's Three.js imports and corrected its theme/font paths.
- Repaired the homepage document structure, responsive gallery, project cards, contact layout, profile links, dates, and presentation links. Replaced the placeholder finger-paper URL with its verified DOI.
- Kept three incomplete posts unpublished instead of showing empty/placeholder pages in search and recent updates. Their source files remain intact.
- Excluded nested dependencies, unused demos/templates, and duplicate exports from publication; preserved the user's `**/node_modules` exclusion. The output is about 221 MiB rather than publishing about 440 MiB of tracked presentation exports plus dependencies.
- Added a Gemfile.lock with Windows and Linux platforms, Windows test/preview scripts, a portable validator, and a browser regression check.

## Checks

- Production Jekyll build: passed.
- HTML-Proofer: 43 HTML pages, no failures.
- Presentation resource checks: 129 references, no missing files or filename-case errors.
- JavaScript syntax checks: nine reachable presentation scripts plus the new site/media/browser scripts, passed.
- Browser acceptance check: 14 desktop/mobile scenarios, 182 checks, no failures. Both decks traversed every slide and fragment (55 + 50 slides), with keyboard/touch navigation, hidden-card retry regression, media, 3D models, and zero HTTP/JavaScript/console errors verified.
- Local Windows preview: started with live reload; homepage, projects, MSc post, both decks and standalone viewer returned HTTP 200. Server stopped after testing.
- MathJax: inspected the running thesis page; equation containers rendered successfully.
- Bundle content hashes and `git diff --check`: passed.

Browser screenshots and per-page JSON reports are saved in `.test-results/browser/` (ignored by Git). The test serves the actual `_site` output, without any URL rewriting.

## External links

Checked 89 unique external portfolio links. The CV links respond successfully and the DOI links resolve to their publisher. IEEE, LinkedIn, and ResearchGate block some automated requests; Google Scholar timed out during the automated check. These restrictions do not establish broken links, and those destinations still need a manual browser check. The live site's 404 page returned the expected HTTP 404. Details are saved in `.test-results/external-links.json`.

The presentations still contain large videos/models and depend on external CDN resources. This verification does not simulate a slow connection, Safari, Firefox, or GitHub's hosted Linux runner. The original Vite source projects are absent; the repaired compiled exports are checked in directly.

## Publish

1. Set repository **Settings > Pages > Build and deployment > Source** to **GitHub Actions**.
2. Commit and push the repairs, including the new hashed bundles and Gemfile.lock.
3. Confirm the **Build and Deploy** workflow succeeds, then check the live homepage, project links, presentations, and model viewer.

The Pages setting cannot be changed from this unauthenticated workspace. Local validation does not claim that the current live website or a future hosted workflow has already passed.

## Repeat locally

```bat
tools\test.cmd
node tools/check-browser.mjs _site
tools\serve.cmd
```

Open http://127.0.0.1:4000/ for the local preview. See [README.md](../README.md) for setup and shell-specific environment-variable syntax. The original pre-repair findings and evidence remain in [website-audit.md](website-audit.md).
