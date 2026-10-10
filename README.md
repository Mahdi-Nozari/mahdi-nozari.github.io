# Mahdi Nozari's portfolio

A custom light portfolio at https://mahdi-nozari.github.io/, built with Jekyll, HTML, CSS, and a small JavaScript file. The main site follows the Research Atlas concept. Its images are Mahdi's existing photographs, CAD renders, and diagrams; generated mockups are design references only and are excluded from publishing.

## Preview locally on Windows

Install Ruby 3.3 with Devkit, Bundler, and Python 3. From this repository:

```powershell
bundle install
.\tools\serve.cmd
```

Open http://127.0.0.1:4000/. The server rebuilds changes and reloads the browser. Stop it with Ctrl+C. Command Prompt also supports `tools\serve.cmd`.

## Test before pushing

```powershell
.\tools\test.cmd
```

This builds the production site, checks internal links, images and scripts, verifies the project and content inventory, and validates the presentation resources. On Windows the validator uses Git for Windows' libcurl DLL if available. For other installations, set `LIBCURL_PATH` to the installed `libcurl-4.dll`.

For browser checks with Node.js 22+ and Edge:

```powershell
$env:BROWSER_TEST_PORTFOLIO = "1"
$env:BROWSER_TEST_ALL_PROJECTS = "1"
node tools/check-browser.mjs _site
```

This checks desktop, tablet and phone layouts, the mobile menu, every project page, filters, images, horizontal overflow, JavaScript errors and network failures. Results and screenshots are saved in `.test-results/browser/`. Set `BROWSER_PATH` for a different Chrome/Edge executable.

To include the standalone slides and 3D viewer in the original browser regression suite, remove `BROWSER_TEST_PORTFOLIO`. Those files were not redesigned.

On Linux/macOS use `bash tools/test.sh` and `bash tools/run.sh -p` after installing the Ruby dependencies and Python 3.

## Edit the portfolio

- `index.html`: short introduction and featured research.
- `_data/featured.yml`: the three homepage project links.
- `_data/navigation.yml`: main navigation.
- `_posts/`: all project content, including three retained unpublished drafts.
- `_tabs/`: research listing, publications, experience, teams, contact and Sunshine.
- `about.html`: the original homepage introduction and six-image gallery.
- `_layouts/` and `_includes/`: shared HTML.
- `assets/css/site.css`: light theme and responsive layout.
- `assets/js/site.js`: mobile navigation, project filters and retirement of the old portfolio cache.

Existing URLs such as `/My-Projects/`, `/Biography/`, and `/posts/MSc/` remain valid. All ten published projects, five publications, CV links, reports, teaching, awards, skills, collaborations and the personal Sunshine page are retained.

Project front matter supports `area` for filtering and `preview` for a thumbnail. The `published: false` drafts stay in the repository until their content is ready.

Original portfolio images are in `assets/images/`; smaller WebP versions are in `assets/images/previews/`. The portfolio layout uses these smaller copies without modifying the originals. Keep the filename case exact. New image previews can be exported with an image editor; Pillow was used for the initial conversions. No image generation is part of the site build.

The legacy favicon at `assets/img/favicons/favicon.ico` is retained because the standalone exports reference it. `sw.min.js` retires the previous Chirpy service worker and clears only its `chirpy-*` caches.

## Protected standalone pages

- `/RollyPoly/`: project slides.
- `/RollyPoly/Robot3D/`: interactive robot.
- `/MSc_pres/`: thesis presentation.

RollyPoly, Robot3D, MSc_pres and their shared presentation CSS/JavaScript are unchanged by the portfolio redesign. Their compiled files and existing publication exclusions remain intact.

## Publish with GitHub Pages

In **Settings > Pages > Build and deployment**, set **Source** to **GitHub Actions**. Commit and push to `main` or `master`. The workflow builds, validates and deploys the static artifact. Keep `.nojekyll` out of the source root; the workflow creates it in the built artifact.

See [validation notes](tools/website-validation.md) for the redesign checks.

## License

The repository retains the original [MIT license](LICENSE) and its attribution.
