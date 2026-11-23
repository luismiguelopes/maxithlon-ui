# Changelog

All notable changes to Maxithlon UI+. Versions follow [semver](https://semver.org/): fixes bump the patch number, new features bump the minor number.

## [1.3.1] — 2026-11-23

### Added
- Script icon (`@icon`, embedded as a data URI) and a Portuguese description (`@description:pt`) in the metadata header, ready for userscript directories such as Greasy Fork.
- Screenshots in the README (`docs/screenshots/`).

## [1.3.0] — 2026-11-23

### Added
- Athlete page redesign: profile card (photo, country, age, MAXID and info tiles), skills card with aligned bars in two columns, clean specialty / favorite event heading, rankings table and notes as cards.
- Previous/next athlete arrows as SVG chevrons.

### Fixed
- Top bar icons now stay on a single row.
- Buttons no longer show the legacy 1px shadow that looked like a border.
- Page tabs no longer show the legacy inset shadow around each tab.
- Bookmark button on the athlete page is now a secondary button.

## [1.2.1] — 2026-11-23

### Fixed
- Roster dashboard and theme toggle failed to load because local variables shadowed the i18n `t()` helper.

## [1.2.0] — 2026-11-23

### Added
- First public release.
- Works with any site language: parsing relies on page structure (column order, element position, classes, image names), never on text.
- UI translated into English and Portuguese, picked from the site's language with English as fallback.
- `@updateURL` / `@downloadURL` pointing to this repository, so userscript managers update automatically.

[1.3.1]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.3.1
[1.3.0]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.3.0
[1.2.1]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.2.1
[1.2.0]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.2.0
