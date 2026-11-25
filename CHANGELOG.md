# Changelog

All notable changes to Maxithlon UI+. Versions follow [semver](https://semver.org/): fixes bump the patch number, new features bump the minor number.

## [1.11.0] — 2026-11-25

### Added
- Coaches page as cards, grouped by specialty: each coach's athletes in charge (with a bar against the busiest coach), experience and the skills they train as bars colored 0–20, with your athletes' average in that group as a marker. Specialty skills carry the group's own names instead of "Es1/Es2".
- Tiles for coaches and youth coaches against the maximum, athletes and youth athletes with a coach against your roster, and athletes per coach.
- Each group shows how many of its athletes have a coach (green when all, amber when some are missing); groups with athletes and no coach get a "No coach" slot.
- After a visit to the Training page, each coach card lists their athletes and the athletes without a coach are named in their group. The Training page is only read as it was loaded; nothing on it changes and nothing is sent. "Show original" brings back the site's tables.

### Changed
- The Athletes list also saves each group's name with its averages, so other pages can name groups in the site's current language.

## [1.10.0] — 2026-11-25

### Added
- League charts as themed SVG charts, drawn from the data the site puts in its chart images (nothing extra is loaded). The lines and axes stay readable in the dark theme; your club's line, legend chip and card are highlighted and your card comes first. Hover or click a club in the legend to pick out its line. "Show original" brings back the site's images.
- Competition search: the search form as a compact filter bar, with labels above their fields and the buttons on the right. The form's own fields are moved, so the search sends exactly the same data.

### Fixed
- Athlete radar: the roster average is shown whatever language the site is in. Averages are now stored by group position instead of group name; your own athletes are matched by their id, and other athletes by the group names seen on the Athletes list in any language. Open the Athletes list once after updating.
- The market's "fits your roster" check uses the same language-independent averages.
- Changelog: the 1.8.0 entry had lost its heading.

## [1.9.0] — 2026-11-24

### Added
- League table (national league and youth championship) as a dashboard: your position, points, gap to the leader, margins to the promotion and relegation lines and total score as tiles (shown once the first meeting is held).
- The standings with promotion and relegation zones and their cut-off lines, your club highlighted, the points gap to the club above, form (average points over the last 3 meetings, with ▲▼ against the season average) and each meeting's points as a heat map. Meetings a club missed and meetings still to come are marked apart. "Show original" brings back the site's table.
- League pages: the second row of tabs (table, calendar, charts, statistics) as a segmented control; last and next competitions as two cards.
- Season calendar as week cards: each competition is a chip colored by type (league, meetings, championships, international), past days fade, today and the next competition day are marked.
- League calendar as a list with the date, weekday and time, faded once held, and the next meeting with a countdown.
- Competition results, rankings, records and entry lists: rows of your athletes and your club are highlighted; places 1–3 in medal colors on event results.
- Moments of glory (athlete) and honours board (club): places as badges, podiums in gold, silver and bronze.

## [1.8.0] — 2026-11-24

### Added
- Home page as a dashboard: the club summary (athletes, fans, contracts, coaches, season and week, stadium efficiency, budget) as clickable tiles, and the next competitions as a list with dates and a live countdown.
- News and status messages on the home page as cards, with the news tabs as chips.
- Left menu sections fold under their heading (arrow or a click on the heading); the choice is remembered, and the section with the current page always opens.
- Icon-only left menu (Settings → Left menu), with each entry's name as a tooltip.
- Account pages restyled: forms as cards with labels in their own column (user details, password, send message); the game options as a list of rows with their notes; club colors next to the color picker.
- User profile: details as label/value rows, "send message" and "add friend" as buttons with icons, login history as a card.
- Messages: an empty inbox, sent or archive list shows a centered empty state.

### Fixed
- Club colors (Options): the color fields show their color again (the theme was painting over them).
- Password and email fields follow the theme (they stayed white in the dark theme).
- The text editor used in messages follows the theme, with its toolbar readable in the dark theme.

## [1.7.1] — 2026-11-24

### Fixed
- Logged-out pages (the home page with the login form and other public pages) are left untouched: UI+ only starts once you are signed in.
- The left menu shows the full list of links; it no longer sticks to the top with its own scroll and cuts the last entries.

## [1.7.0] — 2026-11-23

### Added
- UI translated to Italian, Spanish, French and German (plus script descriptions in those languages).
- Settings panel (gear in the dock, or "UI+ settings" in the palette): theme, accent color (8 colors), comfortable or compact density, and each module on or off.
- When a page panel fails (for example after a site change), UI+ removes the half-built panel, keeps the original page and shows a notice with a link to the settings.

### Changed
- Roster: the Form column's colors are read as the site means them, red for low form and green for top form, with their own legend entry. They were shown as "dropped" before.
- The athlete radar follows the accent color.

## [1.6.0] — 2026-11-23

### Added
- Finances page as a dashboard: current cash, loyalty and the balance of each period as tiles; income vs expenses bars for this week, last week and last season.
- Category breakdown per period, sorted by amount, with each category's share of the total.
- Week-over-week changes: the current week shows how much each category rose or fell against last week, and which ones are new.
- Last transactions page as a dashboard: income, expenses, net and count tiles; a daily chart (income up, expenses down); totals by category; a sortable table filtered by type or reason, with CSV export.

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
