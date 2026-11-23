# Roadmap

Planned work for Maxithlon UI+. Items are grouped by milestone, roughly in priority order. The scope rule never changes: UI+ only changes **presentation**. It does not submit forms, automate actions or work around game rules.

Pages already redesigned: **Athletes list** (roster dashboard) and **athlete page**. Every other page only gets the theme, colors and icons so far.

## Done

- **1.2:** parsing that works with any site language; UI translated (English, Portuguese).
- **1.3:** athlete page redesign (profile, skills, radar, rankings and notes cards); top bar icons on a single row; buttons and page tabs without the legacy borders and shadows.

## 1.4 — Design system and polish

Make every page feel like one product before redesigning more of them.

- [ ] **Shared components**: card, section title, stat tile, data table, tag/chip, empty state and form controls, documented in the CSS and reused by every page module.
- [ ] **Legacy colors**: replace the pink, olive and teal text the site still uses (e.g. "50.5%" and "€ 15 608" in the right column, female athlete values) with theme colors.
- [ ] **Right column**: restyle the "Put up for sale" and "Assign to coach" boxes (price input + button on one row, training plan as a small table with bars instead of colored text).
- [ ] **Athlete page details**:
  - empty tiles (e.g. sponsor) aligned with the others;
  - full club name in a tooltip (the site cuts it to "Petisc...");
  - "Clubs interested in the athlete" as a proper badge or link;
  - the event icons (pink squares) restyled or replaced with SVG.
- [ ] **Page intro text** (`.user_tip`): collapsible, so long explanations don't push the content down.
- [ ] **Footer**: modern layout without the old logo image and underlined link lists.
- [ ] **Responsive layout**: check tablet and narrow-window widths, where the right column is hidden and cards should stack.
- [ ] **Check other athlete page variants**: youth academy athletes, athletes from other clubs, athletes on the market and injured athletes.

## 1.5 — Robustness and languages

- [ ] **More UI translations**: Italian, Spanish, French and German first (the site's largest communities), then others on request.
- [ ] **Language test pass**: switch the game language and check every module (roster, athlete page, icons, palette).
- [ ] **Graceful degradation**: when a page changes and a module fails, show a small "UI+ could not load this panel" notice instead of failing silently.
- [ ] **Settings panel** in the dock: theme, accent color, density (compact/comfortable), and turning individual modules on or off.
- [ ] **Confirm what the red Form value means** in the roster and show it properly in the legend.

## 1.6 — Home and navigation

- [ ] **Home page redesign**: club summary at the top (league position, budget, next competition, unread messages) and the news/feed as cards.
- [ ] **Sidebar**: collapsible sections and a compact mode.
- [ ] **Messages** (inbox and conversation view) restyled.
- [ ] **Settings / user pages** restyled.

## 1.7 — Market

- [ ] Market page (`/varie/mercato.php`) redesign: filterable, sortable table with age, MAXID, skills, price and time left.
- [ ] Skill heat map and a "fits my roster" hint (compares with your roster's group averages).
- [ ] Price per MAXID point and other value indicators.
- [ ] Saved filters.
- [ ] Transfer history and bid history pages restyled.

## 1.8 — Finances

- [ ] Finances page (`/user/budget_det.php`) redesign with income vs. expenses charts.
- [ ] Breakdown by category (salaries, staff, stadium, transfers…).
- [ ] Week-over-week change highlights.

## 1.9 — League and competitions

- [ ] League table (`/varie/dettagli_serie.php`) that is easier to read: your club highlighted, promotion/relegation zones, form.
- [ ] Competitions list, entries and upcoming events in a compact calendar view.
- [ ] Results and rankings pages with your athletes highlighted.
- [ ] Records and "moments of glory" pages restyled.

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
- [ ] Publish on Greasy Fork / OpenUserJS.
- [ ] Optional data from other game pages via `fetch` (e.g. market data on the roster page). Needs a careful review against the game rules before starting.

## Contributing

Ideas and bug reports are welcome in [issues](https://github.com/luismiguelopes/maxithlon-ui/issues). For new UI languages, add a block to the `I18N` object in `maxithlon-ui.user.js`; missing keys fall back to English.
