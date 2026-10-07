# Website audit — 7 October 2026

> This is the original diagnostic report, recorded before repairs. Local fixes and their final checks are documented in [website-validation.md](website-validation.md). The live site still requires publishing the changes and selecting GitHub Actions as the Pages source.

Audited repository commit `c117fbd`, the public GitHub Actions history, the live website, a temporary production Jekyll build, HTML-Proofer validation, presentation behavior in headless Edge, and the portfolio's external media URLs. Website source files and GitHub settings were not changed. The evidence is saved in [website-audit-evidence](website-audit-evidence/).

**The website has three separate, significant failures.** The live domain serves unbuilt Jekyll source; the custom deployment workflow stops at HTML validation; and both presentations request assets from the wrong directory. Correcting any one of these alone will leave the others unresolved.

| Priority | Finding | Consequence |
| --- | --- | --- |
| Critical | Live Pages deployment serves repository source | Homepage loses the Chirpy theme and navigation; generated portfolio routes are unavailable |
| Critical | Custom workflow fails HTML validation | Built website never reaches the upload or deployment steps |
| Critical | Presentation assets use root URLs | Neither presentation initializes its slides |
| High | Vendor demos, tests, and redundant exports are published | Hundreds of validation errors and substantial unnecessary deployment size |
| High | Nested `node_modules` are not excluded | Local Jekyll builds scan installed dependencies and become extremely slow |
| Medium | Missing RollyPoly fabrication images and one CDN gallery image | Broken images remain after deployment and path repairs |
| Medium | Presentations have no incoming links from the portfolio | Visitors cannot discover the slides from the site |
| Medium | Phone mode differs from desktop presentation mode | Deep links and custom navigation need a deliberate mobile configuration |
| Medium | Homepage embeds a full HTML document inside a Jekyll layout | Invalid document nesting once the theme is restored |
| Low | Robot3D font path, library versions, profile metadata, and dated content | Additional rendering and maintenance problems |

**1. The live website is serving source instead of the Jekyll build.**

An HTTP request to [the homepage](https://mahdi-nozari.github.io/) returned the literal front matter `---`, `layout: page`, and `# Index page`. The live HTML matches the repository's root `index.html`, including its complete document wrapper. A correctly built Jekyll page removes that front matter and adds the theme layout.

The repository contains a root `.nojekyll` file. It has existed since the initial commit on 10 February 2025, so its presence is not a newly introduced slide regression. GitHub documents that branch publishing with `.nojekyll` bypasses the build and deploys static files directly. The raw live HTML, paired with successful automatic "pages build and deployment" runs, strongly indicates that branch publishing is active. The exact Pages setting requires access to repository settings; this audit did not change or directly read that setting. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

For the intended architecture, set repository **Settings → Pages → Build and deployment → Source → GitHub Actions**, and publish only the artifact produced by `.github/workflows/pages-deploy.yml`. Removing `.nojekyll` alone while leaving branch publishing active is insufficient for this custom Chirpy setup. A `.nojekyll` marker is appropriate in an already built static artifact; it does not replace building the repository's Jekyll source.

**2. The custom workflow builds successfully, then fails validation.**

The [latest custom workflow run](https://github.com/Mahdi-Nozari/mahdi-nozari.github.io/actions/runs/28012503347), for commit `c117fbd` on 23 June 2026, reports:

- Checkout, Setup Pages, Setup Ruby, and Build site: successful.
- Test site: failed.
- Upload site artifact: skipped.
- Deploy job: skipped.

The [automatic Pages run for that same commit](https://github.com/Mahdi-Nozari/mahdi-nozari.github.io/actions/runs/28012500877) succeeded. Thus a green Pages run does not establish that the intended build was published.

The API's available history reports the last successful custom build at [run 26036810026](https://github.com/Mahdi-Nozari/mahdi-nozari.github.io/actions/runs/26036810026), for commit `b4c2eb7` ("Remove old Robot3D folder") on 18 May 2026. Later checked runs, including the 3 June Robot3D changes, fail at Test site. The failure therefore predates the 23 June addition of MSc_pres.

The deployment gate is `.github/workflows/pages-deploy.yml:53`. A fresh local diagnostic build succeeded, and HTML-Proofer scanned **155 HTML files and reported 342 failures**. The saved [validation output](website-audit-evidence/validation.txt) contains the full list. Its categories are 89 image failures, 6 link-check failures, 184 internal-link failures, and 63 script failures.

This count comes from the installed Chirpy 7.2.4 and HTML-Proofer 5.0.9, with nested local dependency folders excluded only for the diagnostic build. It is a local reproduction, not a quotation of GitHub's historical logs. The public job-log download endpoint returned HTTP 403. CI's resolved gem versions can differ because Gemfile.lock is ignored.

Do not disable the validation step globally. Fix the real published pages and exclude files that are development examples or redundant exports.

**3. Both presentations were built with URLs for the domain root.**

| Page | Requested URL | Actual file location |
| --- | --- | --- |
| RollyPoly | `/assets/index-C7Us1EbN.js` | `/RollyPoly/assets/index-C7Us1EbN.js` |
| RollyPoly | `/assets/index-vxPwyYlx.css` | `/RollyPoly/assets/index-vxPwyYlx.css` |
| MSc_pres | `/assets/index-CW--XHmN.js` | `/MSc_pres/assets/index-CW--XHmN.js` |
| MSc_pres | `/assets/index-C4zd6xHX.css` | `/MSc_pres/assets/index-C4zd6xHX.css` |

The RollyPoly references are at `RollyPoly/index.html:323–324`; the MSc_pres references are at `MSc_pres/index.html:890–891`. Logos also request `/logos/...` instead of their presentation subdirectories. CSS requests `/fonts/...`, and slide templates embedded in JavaScript request `/media/...`, `/graphs/...`, and `/3dmodels/...`.

The live root JavaScript URLs return HTTP 404. Browser reproduction showed **zero slide sections and Reveal not ready** for both original pages. Slides are injected by JavaScript, so a missing bundle leaves the page almost empty.

For diagnosis only, a temporary local server mapped root resource requests to the relevant presentation folder without modifying any source. RollyPoly then initialized **55 sections**; MSc_pres initialized **50**. Navigating their slide indices produced no uncaught JavaScript exceptions. The relative GLB model paths loaded in this preview, and video elements could load their media. This establishes that incorrect resource paths are the primary presentation startup failure; it does not validate every animation, fragment sequence, or physical device.

Rebuild the original Vite projects with an appropriate base such as `/RollyPoly/` and `/MSc_pres/`, or use a carefully implemented relative deployment base. Handwritten URLs inside injected slide templates must also use the correct prefix; changing just the script and stylesheet tags is insufficient. Use `import.meta.env.BASE_URL` or explicit relative paths for manually constructed resource URLs. [Vite's documentation](https://vite.dev/guide/build.html#public-base-path) explains the base option and the distinction for dynamically assembled URLs. The original deck source and Vite configuration are not present here, so a reproducible rebuild requires those original projects; editing minified exports should be a fallback.

**4. Development examples and redundant exports are treated as website pages.**

`_config.yml:207` does not exclude the presentations' Reveal.js demos, examples, or test HTML. Jekyll copies them into the site, and HTML-Proofer checks all of them. Common reproduced failures include:

- Reveal.js test pages reference `../node_modules/qunit/qunit/qunit.js` and its stylesheet, which do not exist in a clean checkout.
- Reveal.js demo links such as `#/themes` are navigation handled by JavaScript; HTML-Proofer interprets them as missing HTML element IDs.
- Vendor demo images lack `alt` attributes.
- Both `graphs/index.html` files reference absent development files such as `Retro.css`, `annotbox.js`, `/main.js`, and `script.js`.
- `MSc_pres/graphs/reveal_fsm_slide_snippet.html` references an absent integration script.
- `RollyPoly/Robot3D/dist/index.html` points to another `dist/` directory and to plugins not present relative to that redundant entry point.

Exclude unused demo, example, test, snippet, and duplicate entry-point files from Jekyll output. Preserve actual runtime resources, especially `RollyPoly/Robot3D/dist/reveal.js`, its stylesheets, and Robot3D's plugin files. A blanket exclusion of every `dist` directory would break that standalone viewer.

**5. Local dependency folders are scanned by Jekyll.**

Both `RollyPoly/reveal.js/node_modules` and `MSc_pres/reveal.js/node_modules` exist locally. `.gitignore` keeps them out of Git, but the custom Jekyll `exclude` list does not keep them out of Jekyll's reader. Diagnostic stack traces showed the build spending its time traversing directories and checking file headers. Adding `**/node_modules` to the diagnostic configuration allowed the production build to complete. Add that exclusion to the real `_config.yml`; also exclude any dependency/cache folders that are not publication assets.

**6. Actual missing images remain after correcting paths.**

RollyPoly's compiled slide templates reference `media/fabrication-01.png` and `media/fabrication-02.png`. Neither file exists in the repository. Both returned 404 even in the path-corrected browser preview. Restore those images or update the fabrication slide to the intended existing images.

Checked **42 unique CDN URLs** referenced by the built portfolio using small range requests. All but one returned successfully. The homepage gallery's [ISME2021.JFIF](https://morphitcdn.netlify.app/personalwebpage/images/ISME2021.JFIF) returned 404; the browser also showed that tile as broken. The sidebar avatar and project thumbnails checked successfully. See [CDN results](website-audit-evidence/cdn-results.json).

MSc_pres's bundle also contains references to `actuator_fab1.jpg` through `actuator_fab8.jpg`, but they are inside a commented-out slide. They were not requested by the browser and are not current visible-image failures. They must be supplied if that slide is enabled.

**7. The presentations are not linked from the portfolio.**

A search of the homepage, all tabs, and all posts found no `RollyPoly` or `MSc_pres` links. Add clear links to the presentation and 3D viewer from `_posts/2025-02-10-MSc.md`, and optionally from My Projects. Keep the exact directory case for GitHub's Linux hosting.

**8. Phone presentation behavior needs deliberate configuration.**

The bundled Reveal.js defaults switch to scroll view below **435 pixels**. At 390 × 844, the browser entered `reveal-scroll`; an initial `#/2` deep link reset to the first page, whose custom navigation and footer had opacity zero. The first slide intentionally contains only the animated model. A simulated touch gesture did not establish successful progression to the requested content slide; physical phone navigation remains unverified.

The decks otherwise use a 1920 × 750 presentation layout, six navigation items, hidden Reveal controls, and a viewport that disables user scaling. Decide whether mobile should retain slide mode (for example, by explicitly configuring `scrollActivationWidth: null`) or use a supported scroll layout. Then verify touch navigation, readable text, deep links, and model behavior on a real phone. Replace navigation spans with keyboard-accessible buttons and allow user zoom. The homepage gallery captions are hover-only and its alt text is generic (`Pic1`, etc.).

**9. The homepage contains nested document markup when Jekyll builds it.**

Root `index.html` already selects `layout: page`, but then includes another doctype, `<html>`, `<head>`, and `<body>`. Chirpy supplies those outer elements. Remove the duplicate document wrapper, move page-specific styling to an appropriate stylesheet or supported include, and configure icons through the theme. This is a separate validity problem; it does not explain the raw front matter currently visible on the live website.

**10. The standalone Robot3D viewer has a missing font import and mixed Three.js versions.**

The viewer loaded Reveal and its model in the browser, but `dist/theme/black.css` requests `dist/theme/fonts/source-sans-pro/source-sans-pro.css`, which is absent at that path. Font files exist in other theme directories. Correct the theme-relative font location or use a correctly exported viewer build.

Its import map selects Three.js **0.179.1**, while `threejs/rollypolytest.js:4–5` loads GLTFLoader and DRACOLoader from **0.160.0**. No crash was observed in this audit, but align the loaders with the mapped Three.js version by importing them through `three/addons/`. The inspected main presentation GLB files have the expected `glTF` binary signature; they are not unresolved Git LFS pointer files.

**11. The publication is unnecessarily large and has no reproducible deck build.**

Tracked presentation files total approximately **440 MiB**: RollyPoly 251.85 MiB and MSc_pres 188.52 MiB. MSc_pres contains a complete duplicate `dist` export of approximately **94.26 MiB**. A redundant Robot3D export contains a **78.34 MiB** uncompressed model. RollyPoly's circular and straight-path videos are approximately 41.60 and 32.91 MiB; its compressed full robot model is approximately 13.66 MiB.

Retain one deployable export per presentation, exclude unused duplicate files from publication, and defer large models, offscreen videos, and iframe loads until needed. The audit did not measure performance on a slow connection. The custom workflow's `fetch-depth: 0` also downloads repository history, which can be substantial with changing binary assets.

Track a suitable Gemfile.lock for predictable CI dependency resolution. Preserve the original deck source, package manifest, lockfile, and Vite configuration so future slide edits can be rebuilt consistently.

**12. Secondary profile, content, and cache findings.**

- `_config.yml:27` uses GitHub username `Morphit`, while `social.links` still contains `https://github.com/username` and Twitter metadata contains `twitter_username`. Verify the intended profile identity and remove template metadata.
- Biography still says MSc "Expected 2025"; the publications tab has a placeholder paper link. Update these based on actual current information.
- Post date strings contain an extra trailing `+`; most use `+0350` rather than Tehran's configured `+0330`. Jekyll accepted them in the diagnostic build, so they are not the deployment blocker. Normalize them to the intended timestamp and offset.
- `_config.yml:139` enables PWA caching with no presentation exclusions. Once built publishing is restored, consider excluding `/RollyPoly/` and `/MSc_pres/` from the portfolio service worker's cache to avoid caching large independent presentations. This is a maintenance concern, not a proven cause of the current raw-source deployment. Old browser caches should be checked if behavior remains inconsistent after a successful deployment.

**Repair order and acceptance checks.**

1. Correct both presentations' asset bases and supply the two missing RollyPoly images.
2. Exclude nested dependency folders, unused vendor examples/tests, and redundant export entry points while preserving runtime assets.
3. Fix remaining real-page validation errors and obtain a successful production build and HTML-Proofer run. Add browser resource checks because HTML-Proofer does not execute the JavaScript that injects slide content.
4. Select GitHub Actions as the sole intended publishing source and deploy the validated Jekyll artifact.
5. Verify the live homepage has no front matter, the Chirpy navigation is present, `/My-Projects/` and `/posts/MSc/` return built pages, both presentations initialize, and their media/model requests succeed.
6. Finish portfolio links, the missing CDN image, document structure, mobile navigation, accessibility, metadata, and cache checks.

The temporary browser URL mapping was diagnostic only. No production path repair, deployment, Pages-settings change, commit, or push was performed during this audit.
