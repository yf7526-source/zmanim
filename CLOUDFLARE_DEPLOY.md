# Deploy SolarZmanim to Cloudflare Pages

## 1. Put the project on GitHub

Create a private or public GitHub repository. Extract the source ZIP, then
upload the contents of the extracted project folder so `package.json` is at the
repository root. Commit to the `main` branch.

## 2. Connect the repository to Cloudflare Pages

In Cloudflare, open **Workers & Pages**, choose **Create application**, select
**Pages**, and connect the GitHub repository.

Use these build settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node version | `20` |

## 3. Add environment variables

Under the Pages project's **Settings > Variables and Secrets**, add these to
both Production and Preview:

- `VITE_BASE44_APP_ID`: the public ID of the connected Base44 app.
- `VITE_BASE44_APP_BASE_URL`: the app's published `.base44.app` URL.
- `VITE_BASE44_FUNCTIONS_VERSION`: only if Base44 supplies a pinned version.
- `VITE_ERROR_REPORTING_URL`: optional HTTPS endpoint for privacy-scrubbed
  browser error reports. Leave blank to disable reporting.
- `VITE_APP_VERSION`: optional public release label such as `2026.08.26.1`.

These are public browser-build settings. Never put private secrets in a
variable whose name begins with `VITE_`.

## 4. Connect solarzmanim.app

After the first successful deployment, open the Pages project, choose
**Custom domains**, and add `solarzmanim.app`. If the domain is already attached
to an older Pages project, remove it from the old project before attaching it
to the new one.

## 5. Verify before switching traffic

Open the generated `.pages.dev` address and check:

1. Home zmanim load for two cities in different timezones.
2. Calendar, weather, 2D map, and 3D globe.
3. Login and saved locations.
4. Monthly and yearly PDF exports.
5. A direct route such as `/zmanim-guide`, then refresh the page.
6. Installation from the browser and the offline fallback page.
7. A test notification while the app is open.

Only attach `solarzmanim.app` after these checks pass.

## Automatic updates

Every push to `main` triggers Cloudflare to install dependencies, build the
site, and publish the new production version. Pull requests receive preview
deployments. The included GitHub workflow separately runs the full validation
suite before changes are merged.
