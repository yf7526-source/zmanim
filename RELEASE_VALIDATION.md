# SolarZmanim release validation

`npm run check` is the public-beta release gate. It runs lint, type checking, unit tests, the production build, and every maintained validator.

## Release-blocking validators

- validate-config
- validate-core
- validate-edge-syntax
- validate-settings-calendar
- validate-accessibility
- validate-controls
- validate-pwa
- validate-seo
- validate-exports
- validate-home-experience
- validate-desktop
- validate-audience

## Not release-blocking

- validate-communications: obsolete for the current no-AI product direction; it asserts removed Sun/Moon chat behavior.
- validate-72b0-competition: obsolete competition-only rules; it requires Compare and Community routes that are intentionally excluded from the public beta.