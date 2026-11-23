# Changelog

All notable changes to Maxithlon UI+. Versions follow [semver](https://semver.org/): fixes bump the patch number, new features bump the minor number.

## [1.5.0] — 2026-11-23

### Added
- Market search results as a dashboard: tiles (results, cheapest, average price, best value, ending first, athletes that fit your roster), group and gender chips, search, heat map, sortable columns and CSV export.
- New columns: price per MAXID point, time left until the deadline (from the server clock, highlighted in the last hour) and the sum of the 8 skills compared with your roster average for the same group.
- "Fits my roster" filter: athletes above your own group average (needs a visit to your Athletes list).
- Saved views: keep sets of market filters as chips (stored in the browser).
- Market statistics, transfers in progress and other legacy data tables (`results`, `man_details`) styled as cards; the results pager as a button.

## [1.4.0] — 2026-11-23

### Added
- Shared design-system components (card, section title, stat tile, data table, chip, badge, empty state, form row), documented in the CSS and used by the roster and the athlete radar.
- Legacy text colors (olive, teal, magenta, red) mapped to theme colors in both themes, including content loaded later.
- Right column: "Put up for sale" and "Assign to coach" forms on one row; the coach's training plan shown as bars.
- Athlete page: empty tiles show a dash aligned with the other values; full club name (remembered from any page that shows it) instead of the cut one; "Clubs interested in the athlete" as a count badge.
- Event pictograms in SVG, in the athlete's gender color, replacing the square event images.
- Page intro text (`.user_tip`) collapsed to one line, with More/Less (remembered).
- New footer: link columns in a card, without the old logo and underlines.
- Responsive layout: below 1100px the right column moves under the content with its boxes side by side; the top bar wraps; the rankings table scrolls.

### Fixed
- Opening another club's athletes list no longer overwrites your group averages used by the athlete radar.
- Club names inside market text no longer get an action icon.

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

[1.4.0]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.4.0
[1.3.1]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.3.1
[1.3.0]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.3.0
[1.2.1]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.2.1
[1.2.0]: https://github.com/luismiguelopes/maxithlon-ui/releases/tag/v1.2.0
