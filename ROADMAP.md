# Roadmap

Planned work for Maxithlon UI+. Items are grouped by milestone, roughly in priority order. The scope rule never changes: UI+ only changes **presentation**. It does not submit forms, automate actions or work around game rules.

Pages already redesigned: **Athletes list** (roster dashboard), **athlete page**, **market search results**, **finances**, **last transactions**, **home**, **league table** and **calendars**. Every other page gets the theme, colors, icons, collapsible intro, footer and right column styles so far.

## Done

- **1.2:** parsing that works with any site language; UI translated (English, Portuguese).
- **1.3:** athlete page redesign (profile, skills, radar, rankings and notes cards); top bar icons on a single row; buttons and page tabs without the legacy borders and shadows.
- **1.4:** shared design-system components; legacy colors mapped to the theme; right column forms and coach plan; athlete page details (empty tiles, full club names, interested clubs badge, SVG event pictograms); collapsible page intros; new footer; responsive layout; checked on youth, own and other clubs' athletes and athletes on the market.
- **1.5:** market search results dashboard (price per MAXID, time left, fit with your roster, saved views, CSV); legacy data tables (market statistics, transfers) as cards.
- **1.6:** finances dashboard (income vs expenses per period, category breakdown, week-over-week changes) and last transactions dashboard (daily chart, categories, filterable table).
- **1.7:** UI in Italian, Spanish, French and German; settings panel (theme, accent, density, modules); notice and clean fallback when a panel fails; roster Form colors explained (red low, green top); checked with the game in English (roster, athlete radar, market, finances, transactions, icons, palette).
- **1.8:** home page dashboard; collapsible and icon-only left menu; messages and account pages restyled.
- **1.9:** league table dashboard (national and youth); season and league calendars; your athletes and club highlighted in results and rankings; moments of glory and honours board.

## 1.7 — Robustness and languages (left over)

- [ ] **Injured athlete page**: check the layout when an athlete is injured (no injured athlete was available to test 1.4 or 1.7).
- [ ] **Athlete radar with the game in English**: reported missing; check whether the whole panel or only the roster average is missing (averages are stored by group name, in the language the Athletes list was opened in).

## 1.8 — Home and navigation

- [x] **Home page redesign**: club summary as tiles, next competitions with a live countdown, news and status messages as cards.
- [x] **Sidebar**: collapsible sections and an icon-only mode.
- [x] **Messages** restyled (lists, empty state, send form and editor).
- [x] **Settings / user pages** restyled (user details, options, password, symbol, profile).
- [ ] **Messages with content**: check unread rows and the conversation view once there are messages (the inbox, sent and archive were empty when 1.8 was built).

## 1.9 — League and competitions

- [x] League table (`/varie/dettagli_serie.php`, and the youth championship) that is easier to read: your club highlighted, promotion/relegation zones, form.
- [x] Season and league calendars in a compact view.
- [x] Results and rankings pages with your athletes highlighted.
- [x] "Moments of glory" and honours board restyled (records already had the generic table style).
- [ ] **League charts and statistics** tabs (`grafici_serie.php`, `statistiche_serie.php`): not checked yet.
- [ ] **Competitions list** (`lista_prossima.php`): the search form as a compact filter bar.

## 1.10 — Club pages

- [ ] **Coaches**: list as cards with specialty, training plan and assigned athletes.
- [ ] **Staff, stadium and relays** pages redesigned.
- [ ] **Youth academy and youth championship** pages redesigned.
- [ ] **Weekly tests and training results** as tables with highlights.

## 1.11 — Athlete insights

- [ ] Skill history chart from the athlete development page (`atleta_sviluppo.php`), if the data is on the page.
- [ ] Side-by-side comparison of two or more athletes (radar overlay).
- [ ] Training overview: who trains this week, coach coverage per group, athletes at risk of losing fans.

## Later / ideas

- [ ] Local snapshots of the roster (localStorage) to show skill changes between visits.
- [ ] Keyboard shortcuts beyond the palette (e.g. `g a` for Athletes, `g m` for Market).
- [ ] Mobile layout.
- [ ] Market: athlete transfer history and bid history pages checked one by one (they get the generic table style so far).
- [x] Publish on [Greasy Fork](https://greasyfork.org/scripts/606889-maxithlon-ui).
- [ ] Publish on OpenUserJS.
- [ ] Optional data from other game pages via `fetch` (e.g. market data on the roster page). Needs a careful review against the game rules before starting.

## Contributing

Ideas and bug reports are welcome in [issues](https://github.com/luismiguelopes/maxithlon-ui/issues). For new UI languages, add a block to the `I18N` object in `maxithlon-ui.user.js`; missing keys fall back to English.
