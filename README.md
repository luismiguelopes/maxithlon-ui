# Maxithlon UI+

A userscript that gives [Maxithlon](https://maxithlon.com), the online athletics management game, a modern interface: dark and light themes, a wide layout, SVG icons, a roster dashboard, a market dashboard, an athlete skill radar and a command palette.

It only changes how pages **look**. It never submits forms, makes extra requests or automates anything in the game.

## Screenshots

![Roster dashboard, dark theme](docs/screenshots/roster-dark.jpg)

| | |
|---|---|
| ![Roster table with the skill heat map](docs/screenshots/roster-table.jpg) | ![Roster dashboard, light theme](docs/screenshots/roster-light.jpg) |
| **Roster table** with the 0–20 heat map | **Light theme** |
| ![Athlete page, dark theme](docs/screenshots/athlete-dark.jpg) | ![Athlete page, light theme](docs/screenshots/athlete-light.jpg) |
| **Athlete page**: profile and skills | **Athlete page**, light theme |
| ![Athlete skill radar](docs/screenshots/athlete-radar.jpg) | ![Command palette](docs/screenshots/palette.jpg) |
| **Skill radar** compared with the roster average | **Command palette** (`Ctrl+K`) |

## Features

- **Dark / light theme** with an adaptive dark mode that also fixes the colors of content loaded later via AJAX.
- **Wide, flexible layout** instead of the original fixed-width columns. On narrow windows the right column moves under the content.
- **Theme colors everywhere**: the site's legacy olive, teal, magenta and red text is mapped to the theme palette.
- **Home page dashboard**: club summary as clickable tiles (athletes, fans, contracts, coaches, season, stadium, budget), the next competitions as a list with a live countdown, and news and status messages as cards.
- **Left menu**: each section folds under its heading (the one with the current page stays open), and an icon-only mode in the settings.
- **Account pages**: options, password, profile and messages as cards and clean forms; club colors shown in their color.
- **Collapsible page intros**: the long explanation at the top of each page shows one line until you expand it.
- **Settings panel** (gear in the dock): theme, accent color, comfortable or compact density, full or icon-only menu, and each module on or off. If a page changes and a panel can't load, UI+ shows a short notice and leaves the original page in place.
- **Command palette** (`Ctrl+K` or `/`): jump to any page in the menu, top bar or current page tabs. Recently used pages come first.
- **Roster dashboard** (`Athletes` page):
  - summary cards (gender split, average age and MAXID, athletes not training, fan risk, injuries, for sale, without coach);
  - filters by group, gender and status, plus search by name or country;
  - sortable table with a 0–20 heat map and the site's rise/drop markers;
  - CSV export of the current view (opens in Excel).
- **Market search results** as a dashboard: cheapest, average price, best value and ending-first cards; price per MAXID point; time left to the deadline; the sum of skills compared with your roster average for the same group, with a "fits my roster" filter; group and gender filters, saved views, heat map, sorting and CSV export.
- **Finances**: income vs expenses for this week, last week and last season, a category breakdown with week-over-week changes, and the last transactions as a daily chart and a filterable table.
- **Athlete page** as cards (profile, skills, rankings, notes) with a **skill radar**: the 8 skills (6 base + 2 specialty) compared with your roster's average for that group. Full club names instead of the site's cut ones, once seen on another page.
- **Right column**: price and coach forms on one row, the coach's training plan as bars.
- **Event pictograms** (sprint, hurdles, jumps, throws…) in the athlete's gender color instead of the square images.
- **Skill bars** colored from red (0) to green (20).
- **Consistent SVG icons** for the menus, top bar and athlete actions.

## Languages

The script works with **any site language**. Game data (skill names, groups, tooltips) is read from the page itself, and parsing relies on page structure (column order, element position, CSS classes, image names), never on text.

UI+ works with the game in any language. Its own buttons and labels are available in English, Portuguese, Italian, Spanish, French and German, picked from the site's language automatically (English is used for other languages). Translations live in the `I18N` object at the top of the script. Pull requests for more languages are welcome.

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Install the script from **[Greasy Fork](https://greasyfork.org/scripts/606889-maxithlon-ui)** (recommended) or straight from GitHub: [`maxithlon-ui.user.js` (raw)](https://raw.githubusercontent.com/luismiguelopes/maxithlon-ui/main/maxithlon-ui.user.js).
3. Open Maxithlon. Updates are picked up automatically from wherever you installed it.

Use the dock in the bottom-right corner to switch themes, open the palette or turn UI+ off (going back to the original site).

## Development

Everything lives in a single file, `maxithlon-ui.user.js`: plain JavaScript, no build step, no dependencies and no remote assets.

- Bump `@version` on every change, otherwise userscript managers won't pick up the update.
- Wrap each page module in `try/catch` inside `start()`, so a site change only breaks that module. Errors are logged with the `[UI+]` prefix.
- Check the syntax with `node --check maxithlon-ui.user.js`.
- Test in both themes on at least: home, Athletes list, an athlete page, market and finances.

See [ROADMAP.md](ROADMAP.md) for planned work.

## Disclaimer

This is an unofficial fan project, not affiliated with or endorsed by Maxithlon.

## License

[MIT](LICENSE)
