# Mahdi Nozari's website

Personal portfolio at https://mahdi-nozari.github.io/, built with Jekyll and the [Chirpy theme](https://github.com/cotes2020/jekyll-theme-chirpy).

## Test locally on Windows

Install Ruby 3.3 with Devkit, Bundler, and Python 3. From the repository directory, install the locked dependencies once:

```bat
bundle install
```

Build the production website and validate its pages and presentation resources:

```bat
tools\test.cmd
```

Preview the website:

```bat
tools\serve.cmd
```

Open http://127.0.0.1:4000/. Stop the server with Ctrl+C. These scripts work from Command Prompt and PowerShell; in PowerShell, you can use `.\tools\test.cmd` and `.\tools\serve.cmd`.

For manual commands, Command Prompt uses `set "JEKYLL_ENV=production"`; PowerShell uses `$env:JEKYLL_ENV = "production"`. Using PowerShell syntax in Command Prompt produces the filename/directory error.

The Windows validator uses Git for Windows' libcurl DLL if available. If Git is installed elsewhere, set `LIBCURL_PATH` to its `libcurl-4.dll` before running the check.

On Linux/macOS, use `bash tools/test.sh` and `bash tools/run.sh` after installing the dependencies and Python 3.

## Browser verification

After building, run the browser regression check with Node.js 22+ and Microsoft Edge:

```bat
node tools/check-browser.mjs _site
```

It checks the homepage, portfolio tabs, project pages, both presentations at desktop and phone sizes, every slide and fragment, keyboard/touch navigation, media requests, JavaScript errors, and the standalone 3D viewer. It also reproduces hidden geometry-card retries to guard against browser freezes. Screenshots and JSON results are saved under `.test-results/browser/`. Set `BROWSER_PATH` to a Chrome/Edge executable if it is not installed at the default Windows path.

## Publish with GitHub Pages

In this repository's **Settings > Pages > Build and deployment**, set **Source** to **GitHub Actions**. Commit and push the changes to `main` or `master`. The **Build and Deploy** workflow builds the theme, validates the output, and deploys the generated artifact. Check that both its build and deploy jobs succeed.

Keep `.nojekyll` out of the source repository root. The workflow creates that marker inside the already built artifact. Branch publishing of the source bypasses the intended custom build.

## Presentations

- `/RollyPoly/`: project slides
- `/MSc_pres/`: thesis presentation
- `/RollyPoly/Robot3D/`: interactive robot model

Presentation URLs are scoped to their own folders. The checked-in slides are compiled exports; their original Vite source projects are not included. Changes to an exported bundle must update its content-hashed filename and the corresponding `index.html`. If the original projects are recovered, set Vite's `base` to `/RollyPoly/` or `/MSc_pres/` before exporting again.

Portrait phones show readable, scrollable slide content; desktop and landscape views retain the original presentation layout. Videos preload metadata and play only in the current slide/visible fragment. Hidden geometry cards stop rendering and retrying initialization.

Unused vendor demos, dependencies, authoring templates, and duplicate exports are excluded from Jekyll publication. The presentations still rely on external MathJax, Three.js, and Draco CDN resources, and include large videos/models; loading them requires a network connection.

Three unfinished posts (IPFuzzy, SolenoidEngine, TactileSensor) are kept with `published: false`. Complete their content and set `published: true` when ready.

The original diagnostic findings are recorded in [tools/website-audit.md](tools/website-audit.md).

## License

The Chirpy starter is distributed under the [MIT license](LICENSE).
