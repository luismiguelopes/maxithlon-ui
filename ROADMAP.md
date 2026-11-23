# Roadmap

Planned work for Maxithlon UI+. Items are grouped by milestone, roughly in priority order. The scope rule never changes: UI+ only changes **presentation**. It does not submit forms, automate actions or work around game rules.

## 1.3 — Robustness and languages

- [ ] **More UI translations**: Italian, Spanish, French and German first (the site's largest communities), then others on request.
- [ ] **Language test pass**: switch the game language and check every module (roster, athlete page, icons, palette).
- [ ] **Graceful degradation**: when a page changes and a module fails, show a small "UI+ could not load this panel" notice instead of failing silently.
- [ ] **Settings panel** in the dock: theme, accent color, density (compact/comfortable), and turning individual modules on or off.
- [ ] **Confirm what the red Form value means** in the roster and show it properly in the legend.

## 1.4 — Market

- [ ] Market page (`/varie/mercato.php`) as a filterable, sortable table: age, MAXID, skills, price, time left.
- [ ] Skill heat map and "fits my roster" hint (compares with your roster's group averages).
- [ ] Price per MAXID point and other value indicators.
- [ ] Saved filters.

## 1.5 — Finances

- [ ] Finances page (`/user/budget_det.php`) with income vs. expenses charts.
- [ ] Breakdown by category (salaries, staff, stadium, transfers…).
- [ ] Week-over-week change highlights.

## 1.6 — League and competitions

- [ ] League table (`/varie/dettagli_serie.php`) that is easier to read: your club highlighted, promotion/relegation zones, form.
- [ ] Upcoming competitions in a compact calendar view.
- [ ] Results pages with your athletes highlighted.

## 1.7 — Athlete insights

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
