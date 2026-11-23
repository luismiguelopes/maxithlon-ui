// ==UserScript==
// @name         Maxithlon UI+
// @namespace    v3mpire.maxithlon.uiplus
// @version      1.2.1
// @description  A modern interface for Maxithlon: dark/light theme, wide layout, roster dashboard with filters and heat map, athlete skill radar and a command palette (Ctrl+K). Works with any site language.
// @author       luismiguelopes
// @license      MIT
// @homepageURL  https://github.com/luismiguelopes/maxithlon-ui
// @supportURL   https://github.com/luismiguelopes/maxithlon-ui/issues
// @updateURL    https://raw.githubusercontent.com/luismiguelopes/maxithlon-ui/main/maxithlon-ui.user.js
// @downloadURL  https://raw.githubusercontent.com/luismiguelopes/maxithlon-ui/main/maxithlon-ui.user.js
// @match        https://maxithlon.com/*
// @match        https://www.maxithlon.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  if (window.__mxui) return;
  window.__mxui = true;

  /* ------------------------------------------------------------------ *
   * Utilities
   * ------------------------------------------------------------------ */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('mxui.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mxui.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  };
  const stripTags = (s) => (s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const toNum = (s) => {
    const str = String(s == null ? '' : s).replace(/[^\d,.-]/g, '').replace(/[.\s](?=\d{3}\b)/g, '').replace(',', '.');
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  };
  const avg = (a) => { const v = a.filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const fmt = (n, d = 0) => (n == null ? '–' : Number(n).toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }));
  const path = location.pathname;

  const theme = LS.get('theme', 'dark');
  const enabled = LS.get('enabled', true);
  const root = document.documentElement;

  /* ------------------------------------------------------------------ *
   * i18n
   * Only UI+'s own strings live here. Game data (skill names, groups,
   * tooltips) is read from the page, so it already comes in the site's
   * language. Parsing never depends on text: it uses column indexes,
   * element order, classes, image file names and colors.
   * To add a language, add a block keyed by its ISO 639-1 code; missing
   * keys fall back to English.
   * ------------------------------------------------------------------ */
  const I18N = {
    en: {
      palette: 'Command palette (Ctrl+K or /)', toLight: 'Switch to light theme', toDark: 'Switch to dark theme',
      turnOff: 'Turn off Maxithlon UI+ (back to the original site)', turnOn: 'Turn on Maxithlon UI+',
      grpMenu: 'Menu', grpTop: 'Top bar', grpPage: 'This page',
      lightTheme: 'Light theme', darkTheme: 'Dark theme', turnOffShort: 'Turn off UI+ (original site)',
      palPlaceholder: 'Go to… (athletes, market, league, coaches…)',
      palNav: '↑↓ navigate', palOpen: '↵ open', palNewTab: 'Ctrl+↵ new tab', palClose: 'Esc close',
      group: (n) => 'Group ' + n, forSale: 'For sale', injured: 'Injured',
      hasCoach: 'Has a coach', noCoach: 'No coach', trains: 'Will train this week', noTrains: 'Will not train this week',
      mDown: 'marked red / dropped', mUp: 'rose', mUpd: 'rose after a drop',
      athlete: 'Athlete', female: 'Female', male: 'Male', badgeSale: '€ for sale', badgeInj: '✚ injured',
      colGroup: 'Group', spec1: 'Sp1', spec2: 'Sp2', spec1T: '1st specialty skill', spec2T: '2nd specialty skill',
      totalT: 'Sum of the 8 skills (6 base + 2 specialty)', colTrain: 'Trains', colTrainT: 'Will train this week?',
      colEv: 'Events', colEvT: 'Official events in the last 10 weeks (≥5 to keep fans)', colCoachT: 'Has an assigned coach?',
      fNoTrain: 'Not training', fRisk: 'Risk of losing fans', fSale: 'For sale', fInj: 'Injured', fNoCoach: 'No coach',
      csvName: 'Name', csvGroup: 'Group', csvGender: 'Gender', csvSpec1: 'Spec1', csvSpec1v: 'Spec1 value',
      csvSpec2: 'Spec2', csvSpec2v: 'Spec2 value', csvTotal: 'Total', csvEv: 'Events/10', yes: 'Yes', no: 'No', csvFile: 'roster',
      clickFilter: 'Click to filter',
      cAthletes: 'Athletes', cAthletesS: (s, y) => `${s} senior · ${y} youth`,
      cGender: 'Male / Female', cGenderS: 'blue = M · pink = F',
      cAge: 'Average age', cAgeS: (v) => 'youth: ' + v, cMaxid: 'Average MAXID', cMaxidS: (v) => 'best: ' + v,
      cNoTrain: 'Not training', cNoTrainS: 'this week', cRisk: 'Fan risk', cRiskS: '< 5 events in 10 wks',
      cInj: 'Injured', cInjS: 'see details', cInjOk: 'all fit', cSale: 'For sale', cNoCoach: 'No coach',
      search: 'Search athlete or country…', all: 'All', both: 'Both', maleChip: '♂ Male', femaleChip: '♀ Female',
      heatT: 'Heat map on skills', heatOn: '▦ Heat: on', heatOff: '▢ Heat: off',
      csvT: 'Export the current view to CSV (opens in Excel)',
      origT: 'Show/hide the original site tables', origShow: 'Show original', origHide: 'Hide original',
      lgBold: 'bold', lgTop: 'highlight', lgOutline: 'outline: ', lgDown: 'red dropped', lgUp: 'green rose', lgUpd: 'blue rose after a drop',
      lgHelp: 'Click a header to sort · Ctrl+K to navigate', empty: 'No athletes match these filters.',
      radar: 'Skill radar', profile: 'Skill profile', avgOf: (g, n) => `Roster average: ${g} (${n})`,
      openRoster: 'open the Athletes list to compare with your roster',
      tTotal: 'Σ skills', tTotalVs: (d) => d + ' vs average', tTotalS: '8 skills', tSpec: 'Specialty',
      tBest: 'Strongest', tWeak: 'Weakest', q4: 'excellent', q3: 'good', q2: 'weak', q1: 'very weak',
    },
    pt: {
      palette: 'Paleta de comandos (Ctrl+K ou /)', toLight: 'Mudar para tema claro', toDark: 'Mudar para tema escuro',
      turnOff: 'Desligar Maxithlon UI+ (voltar ao site original)', turnOn: 'Ligar Maxithlon UI+',
      grpMenu: 'Menu', grpTop: 'Topo', grpPage: 'Esta página',
      lightTheme: 'Tema claro', darkTheme: 'Tema escuro', turnOffShort: 'Desligar UI+ (site original)',
      palPlaceholder: 'Ir para… (atletas, mercado, liga, treinadores…)',
      palNav: '↑↓ navegar', palOpen: '↵ abrir', palNewTab: 'Ctrl+↵ novo separador', palClose: 'Esc fechar',
      group: (n) => 'Grupo ' + n, forSale: 'À venda', injured: 'Lesionado',
      hasCoach: 'Tem treinador', noCoach: 'Não tem treinador', trains: 'Vai treinar esta semana', noTrains: 'Não vai treinar esta semana',
      mDown: 'assinalado a vermelho / desceu', mUp: 'subiu', mUpd: 'subiu após descida',
      athlete: 'Atleta', female: 'Feminino', male: 'Masculino', badgeSale: '€ venda', badgeInj: '✚ lesão',
      colGroup: 'Grupo', spec1: 'Esp1', spec2: 'Esp2', spec1T: '1.ª habilidade de especialidade', spec2T: '2.ª habilidade de especialidade',
      totalT: 'Soma das 8 habilidades (6 base + 2 de especialidade)', colTrain: 'Treina', colTrainT: 'Vai treinar esta semana?',
      colEv: 'Eventos', colEvT: 'Eventos oficiais nas últimas 10 semanas (≥5 para não perder adeptos)', colCoachT: 'Tem treinador associado?',
      fNoTrain: 'Não treinam', fRisk: 'Risco de perder adeptos', fSale: 'À venda', fInj: 'Lesionados', fNoCoach: 'Sem treinador',
      csvName: 'Nome', csvGroup: 'Grupo', csvGender: 'Sexo', csvSpec1: 'Esp1', csvSpec1v: 'Esp1 valor',
      csvSpec2: 'Esp2', csvSpec2v: 'Esp2 valor', csvTotal: 'Soma', csvEv: 'Eventos/10', yes: 'Sim', no: 'Não', csvFile: 'plantel',
      clickFilter: 'Clicar para filtrar',
      cAthletes: 'Atletas', cAthletesS: (s, y) => `${s} principal · ${y} academia`,
      cGender: 'Masc. / Fem.', cGenderS: 'azul = M · rosa = F',
      cAge: 'Idade média', cAgeS: (v) => 'academia: ' + v, cMaxid: 'MAXID médio', cMaxidS: (v) => 'melhor: ' + v,
      cNoTrain: 'Não treinam', cNoTrainS: 'esta semana', cRisk: 'Risco adeptos', cRiskS: '< 5 eventos em 10 sem.',
      cInj: 'Lesionados', cInjS: 'ver detalhe', cInjOk: 'tudo ok', cSale: 'À venda', cNoCoach: 'Sem treinador',
      search: 'Procurar atleta ou país…', all: 'Todos', both: 'Ambos', maleChip: '♂ Masc.', femaleChip: '♀ Fem.',
      heatT: 'Mapa de calor nas habilidades', heatOn: '▦ Calor: on', heatOff: '▢ Calor: off',
      csvT: 'Exportar a vista atual para CSV (abre no Excel)',
      origT: 'Mostrar/esconder as tabelas originais do site', origShow: 'Ver original', origHide: 'Esconder original',
      lgBold: 'negrito', lgTop: 'destaque', lgOutline: 'contorno: ', lgDown: 'vermelho desceu', lgUp: 'verde subiu', lgUpd: 'azul subiu após descida',
      lgHelp: 'Clica no cabeçalho para ordenar · Ctrl+K para navegar', empty: 'Nenhum atleta com estes filtros.',
      radar: 'Radar de habilidades', profile: 'Perfil de habilidades', avgOf: (g, n) => `Média do plantel: ${g} (${n})`,
      openRoster: 'abre a lista de Atletas para comparar com o plantel',
      tTotal: 'Σ habilidades', tTotalVs: (d) => d + ' vs média', tTotalS: '8 habilidades', tSpec: 'Especialidade',
      tBest: 'Ponto forte', tWeak: 'Ponto fraco', q4: 'excelente', q3: 'bom', q2: 'fraco', q1: 'muito fraco',
    },
  };
  const LOCALE = root.lang || navigator.language || 'en';
  const LANG = (() => { const l = LOCALE.toLowerCase().split('-')[0]; return I18N[l] ? l : 'en'; })();
  const t = (k, ...args) => {
    const s = I18N[LANG][k] ?? I18N.en[k] ?? k;
    return typeof s === 'function' ? s(...args) : s;
  };

  /* ------------------------------------------------------------------ *
   * CSS
   * ------------------------------------------------------------------ */
  const CSS = `
html.mx{
  --accent:#ff7a1a; --accent-soft:rgba(255,122,26,.14);
  --male:#38bdf8; --female:#f472d0;
  --good:#3fb950; --bad:#f85149; --warn:#e3b341;
  --radius:14px;
  --font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
html.mx-dark{
  --bg:#0d1117; --surface:#161b22; --surface2:#1c232c; --surface3:#232c37; --border:#2b3541;
  --text:#e6edf3; --muted:#8b98a5; --link:#7cc4ff; --shadow:0 8px 28px rgba(0,0,0,.35);
  color-scheme:dark;
}
html.mx-light{
  --bg:#f3f4f6; --surface:#ffffff; --surface2:#f6f8fa; --surface3:#eef1f4; --border:#e1e4e8;
  --text:#1f2328; --muted:#656d76; --link:#0969da; --shadow:0 8px 28px rgba(15,23,42,.08);
}

/* ---------- base / layout ---------- */
html.mx body{background:var(--bg)!important;color:var(--text);font-family:var(--font)!important;font-size:13px;}
html.mx #inner_main,html.mx #inner_main_centre{background:var(--bg)!important;background-image:none!important;width:100%!important;float:none!important;height:auto!important;}
html.mx #wrapper{width:min(1500px,96vw)!important;margin:0 auto!important;float:none!important;height:auto!important;display:flow-root;}
html.mx #header{width:100%!important;float:none!important;height:auto!important;min-height:60px;display:flex!important;align-items:center;gap:18px;
  background:var(--surface)!important;background-image:none!important;border:1px solid var(--border);border-radius:var(--radius);
  margin:14px 0 18px!important;padding:6px 18px!important;box-sizing:border-box;box-shadow:var(--shadow);position:relative;}
html.mx #header img.logo{height:46px!important;width:auto!important;position:static!important;margin:0!important;}
html.mx #header > a{display:flex;align-items:center;flex:0 0 auto;}
html.mx #header .right_details{float:none!important;width:auto!important;flex:1 1 auto;background:none!important;position:static!important;margin:0!important;height:auto!important;}
html.mx #inner_body_container{width:100%!important;float:none!important;display:flex!important;gap:18px;align-items:flex-start;height:auto!important;}
html.mx #left_section{flex:0 0 212px;width:212px!important;float:none!important;position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 8px;box-sizing:border-box;box-shadow:var(--shadow);scrollbar-width:thin;}
html.mx #middle_section{flex:1 1 0;width:auto!important;min-width:0;float:none!important;margin:0!important;}
html.mx #right_section,html.mx #right_part{flex:0 0 262px;width:262px!important;float:none!important;margin:0!important;}
html.mx #footer{clear:both;width:100%!important;background:var(--surface)!important;background-image:none!important;border-top:1px solid var(--border);margin-top:28px;color:var(--muted);}
html.mx #footer a{color:var(--muted)!important;}
html.mx a{color:var(--link);}
html.mx .page_details{float:none!important;display:block!important;width:auto!important;max-width:100%!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important;}
html.mx #middle_section > *{max-width:100%;box-sizing:border-box;}
html.mx *{text-shadow:none!important;}

/* ---------- sidebar ---------- */
html.mx #left_section h2{background:none!important;background-image:none!important;color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;
  letter-spacing:.09em;text-transform:uppercase;margin:16px 8px 6px!important;padding:0!important;border:0!important;height:auto!important;width:auto!important;text-shadow:none!important;}
html.mx #left_section h2 a,html.mx #left_section h2 span{color:inherit!important;background:none!important;box-shadow:none!important;padding:0!important;border:0!important;}
html.mx #left_section h2.sidebar-user-heading{margin:2px 0 8px!important;padding:10px 12px!important;border-radius:10px;background:linear-gradient(135deg,var(--accent),#ff4d6d)!important;color:#fff!important;font-size:13px!important;letter-spacing:.02em;text-transform:none;}
html.mx #left_section h2.sidebar-user-heading *{color:#fff!important;background:none!important;border:0!important;}
html.mx #left_section ul{margin:0!important;padding:0!important;list-style:none!important;background:none!important;width:auto!important;}
html.mx #left_section li{background:none!important;background-image:none!important;margin:1px 0!important;padding:0!important;border:0!important;width:auto!important;height:auto!important;}
html.mx #left_section li a{display:flex!important;align-items:center;justify-content:space-between;padding:7px 10px!important;border-radius:8px;color:var(--text)!important;
  background:none!important;text-decoration:none!important;font-size:13px!important;line-height:1.2!important;width:auto!important;height:auto!important;border:0!important;}
html.mx #left_section li a:hover{background:var(--surface3)!important;}
html.mx #left_section li > span{display:block!important;background:none!important;border:0!important;padding:0!important;margin:0!important;width:auto!important;height:auto!important;}
html.mx #left_section li a{width:100%!important;box-sizing:border-box!important;}
html.mx #left_section li > span[class^="highligth"] > a{box-shadow:inset 3px 0 0 var(--hl,var(--accent));}
html.mx #left_section li > span.highligthm{--hl:#58a6ff;}
html.mx #left_section li a.mx-current{background:var(--accent-soft)!important;color:var(--accent)!important;font-weight:600;}

/* ---------- typography ---------- */
html.mx #middle_section h3,html.mx #middle_section h1,html.mx #middle_section h2{font-family:var(--font)!important;color:var(--text)!important;background-image:none!important;text-shadow:none!important;}
html.mx #middle_section > h3,html.mx .page_details > h3{font-size:24px!important;font-weight:700!important;letter-spacing:-.01em;margin:4px 0 12px!important;padding:0!important;}
html.mx #right_section h2,html.mx #right_section h3,html.mx #right_part h2,html.mx #right_part h3{font-family:var(--font)!important;background-image:none!important;color:var(--text)!important;font-size:14px!important;font-weight:700!important;padding:12px 14px 6px!important;margin:0!important;height:auto!important;}
html.mx #right_section > div,html.mx #right_part > div{background:var(--surface)!important;background-image:none!important;border:1px solid var(--border);border-radius:var(--radius);margin:0 0 14px!important;padding-bottom:10px;box-shadow:var(--shadow);width:auto!important;}
html.mx #right_section > div *,html.mx #right_part > div *{background-image:none;}
html.mx #right_section ul,html.mx #right_part ul{padding:0 14px!important;margin:0!important;}
html.mx .user_tip{background:var(--surface)!important;background-image:none!important;border:1px solid var(--border)!important;border-radius:var(--radius);padding:12px 16px!important;color:var(--muted)!important;margin-bottom:14px;}
html.mx .user_tip img{display:none;}

/* ---------- tabs (page_bar) ---------- */
html.mx .page_bar{background:none!important;border:0!important;margin:0 0 14px!important;height:auto!important;}
html.mx .page_bar ul{display:flex!important;flex-wrap:wrap;gap:6px;background:none!important;padding:0!important;margin:0!important;height:auto!important;width:auto!important;}
html.mx .page_bar li{float:none!important;background:none!important;margin:0!important;padding:0!important;width:auto!important;height:auto!important;border:0!important;}
html.mx .page_bar li a{display:block;padding:7px 14px!important;border-radius:999px;background:var(--surface)!important;border:1px solid var(--border)!important;color:var(--text)!important;
  text-decoration:none!important;font-size:12.5px!important;height:auto!important;line-height:1.3!important;border-image:none!important;box-shadow:none!important;background-image:none!important;}
html.mx .page_bar li a:hover{border-color:var(--accent)!important;}
html.mx .page_bar li a.mx-current{background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;}

/* ---------- generic tables ---------- */
html.mx #middle_section table{border-collapse:collapse;}
html.mx #middle_section table th,html.mx #middle_section table thead td{background:var(--surface2)!important;background-image:none!important;color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;
  text-transform:uppercase;letter-spacing:.04em;padding:8px 6px!important;border:0!important;border-bottom:1px solid var(--border)!important;}
html.mx #middle_section table td{border-color:var(--border)!important;}
html.mx #middle_section table.tablesorter_all,html.mx #middle_section table.tablesorter{background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:var(--shadow);}
html.mx #middle_section table.tablesorter_all td,html.mx #middle_section table.tablesorter td{padding:6px!important;background:transparent!important;}
html.mx #middle_section table.tablesorter_all tbody tr:hover td,html.mx #middle_section table.tablesorter tbody tr:hover td{background:var(--surface3)!important;}
html.mx input[type=text],html.mx input[type=number],html.mx input:not([type]),html.mx select,html.mx textarea{background:var(--surface2)!important;color:var(--text)!important;border:1px solid var(--border)!important;border-radius:8px;padding:5px 8px;}
html.mx input[type=submit],html.mx input[type=button],html.mx button:not([class*="mx-"]):not(#admin_hamburger_menu){background:var(--accent)!important;color:#fff!important;border:0!important;border-radius:8px!important;padding:6px 12px!important;cursor:pointer;background-image:none!important;}
html.mx #vtip{background:var(--surface3)!important;color:var(--text)!important;border:1px solid var(--border)!important;border-radius:10px!important;padding:8px 12px!important;box-shadow:var(--shadow);font:12px/1.4 var(--font)!important;}
html.mx #vtip img{display:none!important;}
html.mx-dark img[src*="/flags/"],html.mx-dark img[src*="flag"]{filter:none;}

/* ---------- dock ---------- */
.mx-dock{position:fixed;right:16px;bottom:16px;z-index:99998;display:flex;gap:6px;padding:6px;border-radius:999px;background:var(--surface,#161b22);border:1px solid var(--border,#2b3541);box-shadow:0 8px 28px rgba(0,0,0,.35);font-family:system-ui,sans-serif;}
.mx-dock button{all:unset;cursor:pointer;min-width:34px;height:34px;padding:0 10px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:var(--text,#e6edf3);box-sizing:border-box;}
.mx-dock button:hover{background:var(--surface3,#232c37);}
.mx-dock kbd{font:11px var(--font,system-ui);padding:1px 5px;border-radius:5px;border:1px solid var(--border,#2b3541);color:var(--muted,#8b98a5);}
html:not(.mx) .mx-dock{background:#161b22;}

/* ---------- command palette ---------- */
.mx-pal-bg{position:fixed;inset:0;background:rgba(1,4,9,.55);backdrop-filter:blur(3px);z-index:99999;display:flex;justify-content:center;align-items:flex-start;padding-top:12vh;}
.mx-pal{width:min(620px,92vw);background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.5);overflow:hidden;font-family:var(--font);}
.mx-pal input{all:unset;box-sizing:border-box;width:100%;padding:16px 18px;font-size:16px;color:var(--text);border-bottom:1px solid var(--border);}
.mx-pal ul{list-style:none;margin:0;padding:6px;max-height:52vh;overflow:auto;}
.mx-pal li{padding:9px 12px;border-radius:9px;display:flex;justify-content:space-between;gap:12px;cursor:pointer;color:var(--text);font-size:14px;}
.mx-pal li small{color:var(--muted);font-size:12px;}
.mx-pal li.on{background:var(--accent-soft);color:var(--accent);}
.mx-pal .mx-pal-foot{padding:8px 14px;border-top:1px solid var(--border);color:var(--muted);font-size:12px;display:flex;gap:14px;}

/* ---------- roster ---------- */
.mxr{font-family:var(--font);color:var(--text);margin-bottom:18px;}
.mxr-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;margin-bottom:14px;}
.mxr-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;box-shadow:var(--shadow);cursor:default;position:relative;overflow:hidden;}
.mxr-card.click{cursor:pointer;}
.mxr-card.click:hover{border-color:var(--accent);}
.mxr-card .k{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);}
.mxr-card .v{font-size:24px;font-weight:700;margin-top:4px;letter-spacing:-.02em;}
.mxr-card .s{font-size:12px;color:var(--muted);margin-top:2px;}
.mxr-card.warn .v{color:var(--warn);} .mxr-card.bad .v{color:var(--bad);} .mxr-card.good .v{color:var(--good);}
.mxr-card .bar{display:flex;height:5px;border-radius:9px;overflow:hidden;margin-top:8px;background:var(--surface3);}
.mxr-bar-m{background:var(--male);} .mxr-bar-f{background:var(--female);}
.mxr-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}
.mx-chip{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12.5px;display:inline-flex;gap:6px;align-items:center;}
.mx-chip:hover{border-color:var(--accent);}
.mx-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.mx-chip .n{opacity:.7;font-size:11px;}
.mx-chip .dot{width:8px;height:8px;border-radius:50%;}
.mxr-search{flex:1 1 200px;min-width:160px;}
.mxr-search input{width:100%!important;box-sizing:border-box;padding:8px 12px!important;border-radius:999px!important;font-size:13px!important;}
.mx-btn{all:unset;cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12.5px;}
.mx-btn:hover{border-color:var(--accent);}
.mxr-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:auto;max-height:78vh;}
table.mxr-t{width:100%;border-collapse:separate!important;border-spacing:0;font-size:12.5px;background:transparent!important;box-shadow:none!important;}
table.mxr-t th{position:sticky;top:0;z-index:2;background:var(--surface2)!important;color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.04em;
  padding:9px 4px!important;text-align:center;cursor:pointer;user-select:none;white-space:nowrap;border-bottom:1px solid var(--border)!important;}
table.mxr-t th.l,table.mxr-t td.l{text-align:left;}
table.mxr-t th:hover{color:var(--text)!important;}
table.mxr-t th.sorted{color:var(--accent)!important;}
table.mxr-t th.sep,table.mxr-t td.sep{border-left:1px solid var(--border)!important;}
table.mxr-t td{padding:6px 4px!important;text-align:center;border-bottom:1px solid var(--border)!important;white-space:nowrap;background:transparent!important;color:var(--text);}
table.mxr-t tbody tr:hover td{background:var(--surface3)!important;}
table.mxr-t tr.inj td{box-shadow:inset 0 0 0 9999px rgba(248,81,73,.06);}
.mxr-name{display:flex;align-items:center;gap:7px;}
.mxr-name a{color:var(--text)!important;text-decoration:none!important;font-weight:600;}
.mxr-name a:hover{color:var(--accent)!important;}
.mxr-name img{width:16px;height:11px;border-radius:2px;object-fit:cover;}
.mxr-g{width:7px;height:7px;border-radius:50%;flex:0 0 7px;}
.mxr-g.M{background:var(--male);} .mxr-g.F{background:var(--female);} .mxr-g.\\?{background:var(--muted);}
.mxr-badge{font-size:10.5px;padding:1px 6px;border-radius:6px;font-weight:600;}
.mxr-badge.sale{background:rgba(63,185,80,.16);color:var(--good);}
.mxr-badge.inj{background:rgba(248,81,73,.16);color:var(--bad);}
.mxr-grp{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;}
.mxr-sk{display:inline-block;min-width:24px;padding:3px 0;border-radius:6px;font-variant-numeric:tabular-nums;}
.mxr-sk.b{font-weight:700;}
.mxr-sk.top{font-weight:800;color:#fff;}
html.mx-light .mxr-sk.top{color:#0b3d17;}
.mxr-sk.down{outline:1.5px solid var(--bad);outline-offset:-1.5px;}
.mxr-sk.up{outline:1.5px solid var(--good);outline-offset:-1.5px;}
.mxr-sk.upd{outline:1.5px solid #58a6ff;outline-offset:-1.5px;}
.mxr-meter{display:flex;align-items:center;gap:6px;justify-content:flex-end;}
.mxr-meter i{display:block;height:5px;border-radius:9px;background:var(--accent);opacity:.85;}
.mxr-meter span{min-width:34px;text-align:right;font-variant-numeric:tabular-nums;}
.mxr-ok{color:var(--good);font-weight:700;} .mxr-no{color:var(--bad);font-weight:700;cursor:help;}
.mxr-ev{font-size:11.5px;padding:2px 7px;border-radius:999px;font-variant-numeric:tabular-nums;cursor:help;}
.mxr-ev.ok{background:rgba(63,185,80,.14);color:var(--good);} .mxr-ev.risk{background:rgba(248,81,73,.16);color:var(--bad);}
.mxr-legend{display:flex;flex-wrap:wrap;gap:14px;color:var(--muted);font-size:11.5px;margin-top:10px;align-items:center;}
.mxr-legend .sw{display:inline-block;width:46px;height:8px;border-radius:9px;vertical-align:middle;margin:0 4px;}
.mxr-empty{padding:30px;text-align:center;color:var(--muted);}
.mx-hide-orig > table[id^="atleti"],.mx-hide-orig > table[id^="atleti"] + br{display:none!important;}

/* ---------- athlete page ---------- */
.mxa{display:grid;grid-template-columns:minmax(260px,330px) 1fr;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin:6px 0 16px;box-shadow:var(--shadow);font-family:var(--font);color:var(--text);}
.mxa svg{width:100%;height:auto;}
.mxa-k{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;align-content:start;}
.mxa-k div{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:9px 11px;}
.mxa-k b{display:block;font-size:20px;letter-spacing:-.02em;margin-top:2px;}
.mxa-k small{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;}
.mxa-k em{font-style:normal;font-size:11.5px;color:var(--muted);}
.mxa-leg{display:flex;gap:14px;font-size:11.5px;color:var(--muted);margin-top:4px;justify-content:center;}
.mxa-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;}
.mxa-title{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;}
.mxa-title b{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);}
html.mx #middle_section div.row{border-radius:8px;}
html.mx body *:not(svg):not(svg *):not(kbd){font-family:var(--font)!important;}
.mx-ic{flex:0 0 auto;vertical-align:-3px;}
.mx-logo{display:inline-flex;align-items:center;gap:10px;}
.mx-logo-ic{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--accent),#ff4d6d);color:#fff;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(255,122,26,.35);}
.mx-logo-t{font:800 20px/1 var(--font)!important;letter-spacing:-.03em;color:var(--text);}
.mx-logo-b{font:700 10px/1 var(--font)!important;padding:3px 6px;border-radius:6px;background:var(--accent-soft);color:var(--accent);}
html.mx #header a{text-decoration:none!important;}
html.mx #header .top_menu{display:flex!important;align-items:center;flex-wrap:wrap;gap:2px;float:none!important;width:auto!important;height:auto!important;background:none!important;position:static!important;margin:0!important;padding:0!important;}
html.mx #header a.mx-hi{background:none!important;background-image:none!important;width:36px!important;height:36px!important;display:inline-flex!important;align-items:center;justify-content:center;border-radius:10px;color:var(--muted)!important;margin:0 1px!important;padding:0!important;float:none!important;position:static!important;text-indent:0!important;overflow:visible!important;line-height:1!important;}
html.mx #header a.mx-hi:hover{background:var(--surface3)!important;color:var(--text)!important;}
html.mx #header a.mx-hi.mx-current{background:var(--accent-soft)!important;color:var(--accent)!important;}
html.mx #left_section li a{justify-content:flex-start!important;gap:10px;}
html.mx #left_section li a::after,html.mx #left_section li a::before{content:none!important;display:none!important;}
html.mx #left_section li a .mx-ic{color:var(--muted);}
html.mx #left_section li a:hover .mx-ic,html.mx #left_section li a.mx-current .mx-ic{color:inherit;}
html.mx a.mx-ri{display:flex!important;align-items:center;gap:9px;background-image:none!important;padding:5px 0!important;color:var(--text)!important;font-weight:500!important;text-decoration:none!important;}
html.mx a.mx-ri .mx-ic{color:var(--accent);}
html.mx a.mx-ri:hover{color:var(--accent)!important;}
html.mx #right_section .right_menu a,html.mx #right_part .right_menu a{color:var(--text)!important;}
html.mx #middle_section div.row.mx-row{background:var(--surface2)!important;border-radius:8px;padding:4px 10px!important;display:flex!important;align-items:center;gap:8px;height:auto!important;}
html.mx #middle_section div.row.mx-row > span:first-child{color:var(--muted)!important;font-weight:500!important;flex:1 1 auto;}
html.mx #middle_section div.row.mx-row > strong{color:var(--text)!important;min-width:22px;text-align:right;}
.mx-bar{display:inline-block;flex:0 0 120px;width:120px;height:8px;border-radius:9px;background:var(--surface3);overflow:hidden;}
.mx-bar i{display:block;height:100%;border-radius:9px;}
.mx-tick{color:var(--good);font-weight:700;} .mx-cross{color:var(--bad);font-weight:700;cursor:help;}
html.mx #middle_section div.row.mx-row > span:first-child{white-space:nowrap;overflow:visible!important;text-overflow:clip!important;}
html.mx #header .right_details{display:flex!important;align-items:center;justify-content:space-between;gap:12px;}
html.mx #middle_section h4.heading,html.mx #middle_section h4.heading *{font-weight:600!important;}
html.mx #middle_section h4.heading > span,html.mx #middle_section h4.heading{color:var(--muted)!important;}
html.mx #middle_section h4.heading strong,html.mx #middle_section h4.heading a{color:var(--text)!important;}
@media (max-width:1100px){html.mx #right_section,html.mx #right_part{display:none!important;}}
@media (max-width:760px){html.mx #left_section{display:none!important;} .mxa{grid-template-columns:1fr;}}
`;

  function injectCSS() {
    const s = h('style', { id: 'mxui-css' });
    s.textContent = CSS;
    (document.head || root).append(s);
  }

  /* ------------------------------------------------------------------ *
   * Adaptive dark mode: fixes the legacy site's hard-coded colors
   * ------------------------------------------------------------------ */
  const parseRGB = (c) => {
    const m = (c || '').match(/[\d.]+/g);
    if (!m || m.length < 3) return null;
    const [r, g, b, a = 1] = m.map(Number);
    return { r, g, b, a };
  };
  const lumOf = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const rgbToHsl = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let hh = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hh *= 60;
    }
    return { h: hh, s, l };
  };
  const SKIP_DARKFIX = 'svg,svg *,img,script,style,.mxr,.mxr *,.mxa,.mxa *,.mx-dock,.mx-dock *,.mx-pal-bg,.mx-pal-bg *,#left_section,#left_section *';

  function darkFix(scope) {
    if (theme !== 'dark') return;
    const els = scope.nodeType === 1 ? [scope, ...scope.querySelectorAll('*')] : [];
    for (const el of els) {
      if (el.matches(SKIP_DARKFIX)) continue;
      const cs = getComputedStyle(el);
      // light backgrounds -> dark surface (skips thin skill bars)
      const bg = parseRGB(cs.backgroundColor);
      if (bg && bg.a > 0.3 && el.offsetHeight > 13) {
        const L = lumOf(bg);
        if (L > 0.72) el.style.setProperty('background-color', 'var(--surface2)', 'important');
        else if (L > 0.5 && rgbToHsl(bg).s < 0.25) el.style.setProperty('background-color', 'var(--surface3)', 'important');
      }
      // large paper textures
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && el.offsetWidth > 260 && el.offsetHeight > 60) {
        el.style.setProperty('background-image', 'none', 'important');
      }
      // dark text -> light (keeps the hue if it is colored)
      const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      const fg = parseRGB(cs.color);
      if (!fg) continue;
      const hsl = rgbToHsl(fg);
      if (hsl.l < 0.5 && lumOf(fg) < 0.42) {
        if (hsl.s > 0.35) el.style.setProperty('color', `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s * 85)}% 68%)`, 'important');
        else el.style.setProperty('color', 'var(--text)', 'important');
      }
    }
  }

  function watchDark() {
    if (theme !== 'dark') return;
    let pending = new Set(); let timer = null;
    const mo = new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && !n.closest('.mxr,.mxa,.mx-dock,.mx-pal-bg')) pending.add(n);
      clearTimeout(timer);
      timer = setTimeout(() => { const p = pending; pending = new Set(); p.forEach((n) => n.isConnected && darkFix(n)); }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * Navigation: highlight the current link
   * ------------------------------------------------------------------ */
  function markCurrent() {
    const here = location.pathname;
    $$('#left_section li a, .page_bar li a').forEach((a) => {
      try { if (new URL(a.href, location.href).pathname === here) a.classList.add('mx-current'); } catch (e) { /* */ }
    });
  }

  /* ------------------------------------------------------------------ *
   * Dock + command palette
   * ------------------------------------------------------------------ */
  function setTheme(next) { LS.set('theme', next); location.reload(); }
  function setEnabled(v) { LS.set('enabled', v); location.reload(); }

  function buildDock() {
    const dock = h('div', { class: 'mx-dock' });
    if (enabled) {
      dock.append(
        h('button', { class: 'mx-d', title: t('palette'), onclick: openPalette }, svgIcon('search', 16), h('kbd', {}, 'Ctrl K')),
        h('button', { class: 'mx-d', title: theme === 'dark' ? t('toLight') : t('toDark'), onclick: () => setTheme(theme === 'dark' ? 'light' : 'dark') }, svgIcon(theme === 'dark' ? 'sun' : 'moon', 16)),
        h('button', { class: 'mx-d', title: t('turnOff'), onclick: () => setEnabled(false) }, svgIcon('power', 16)),
      );
    } else {
      dock.append(h('button', { class: 'mx-d', title: t('turnOn'), onclick: () => setEnabled(true) }, '✦ UI+'));
    }
    document.body.append(dock);
  }

  function collectCommands() {
    const seen = new Set(); const out = [];
    const add = (label, href, group) => {
      label = (label || '').replace(/\s+/g, ' ').trim();
      if (!label || !href || href.startsWith('javascript') || href === '#') return;
      const key = label.toLowerCase() + '|' + href;
      if (seen.has(key)) return; seen.add(key);
      out.push({ label, href, group });
    };
    $$('#left_section a').forEach((a) => {
      const sec = a.closest('ul')?.previousElementSibling?.textContent?.trim() || t('grpMenu');
      add(a.textContent.replace(/\(\d+\)/, ''), a.href, sec);
    });
    $$('#header a').forEach((a) => add(a.title || a.querySelector('img')?.title || a.querySelector('img')?.alt || a.textContent, a.href, t('grpTop')));
    $$('.page_bar a').forEach((a) => add(a.textContent, a.href, t('grpPage')));
    $$('#right_section .right_menu a, #right_part .right_menu a').forEach((a) => add(a.textContent, a.href, t('grpPage')));
    const favs = LS.get('recent', []);
    return { items: out, favs };
  }

  function openPalette() {
    if ($('.mx-pal-bg')) return;
    const { items } = collectCommands();
    const recent = LS.get('recent', []);
    const actions = [
      { label: theme === 'dark' ? t('lightTheme') : t('darkTheme'), group: 'UI+', run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
      { label: t('turnOffShort'), group: 'UI+', run: () => setEnabled(false) },
    ];
    const all = [...items, ...actions];
    const score = (it, q) => {
      if (!q) { const r = recent.indexOf(it.href); return r >= 0 ? 100 - r : 1; }
      const L = it.label.toLowerCase(), G = (it.group || '').toLowerCase();
      if (L.startsWith(q)) return 90;
      if (L.includes(q)) return 70;
      let i = 0; for (const ch of L) if (ch === q[i]) i++;
      if (i === q.length) return 40;
      if (G.includes(q)) return 20;
      return 0;
    };
    let sel = 0; let list = [];
    const input = h('input', { placeholder: t('palPlaceholder'), autocomplete: 'off', spellcheck: 'false' });
    const ul = h('ul');
    const bg = h('div', { class: 'mx-pal-bg', onclick: (e) => { if (e.target === bg) close(); } },
      h('div', { class: 'mx-pal' }, input, ul, h('div', { class: 'mx-pal-foot' }, h('span', {}, t('palNav')), h('span', {}, t('palOpen')), h('span', {}, t('palNewTab')), h('span', {}, t('palClose')))));
    const close = () => bg.remove();
    const go = (it, newTab) => {
      if (it.run) { close(); it.run(); return; }
      LS.set('recent', [it.href, ...recent.filter((x) => x !== it.href)].slice(0, 8));
      if (newTab) window.open(it.href, '_blank'); else location.href = it.href;
      close();
    };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      list = all.map((it) => ({ it, s: score(it, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 40).map((x) => x.it);
      sel = Math.min(sel, Math.max(0, list.length - 1));
      ul.replaceChildren(...list.map((it, i) => h('li', { class: i === sel ? 'on' : '', onmouseenter: () => { sel = i; render(); }, onclick: (e) => go(it, e.ctrlKey || e.metaKey) }, h('span', {}, it.label), h('small', {}, it.group || ''))));
      ul.children[sel]?.scrollIntoView({ block: 'nearest' });
    };
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, list.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter' && list[sel]) { go(list[sel], e.ctrlKey || e.metaKey); e.preventDefault(); }
      else if (e.key === 'Escape') close();
    });
    document.body.append(bg);
    render();
    input.focus();
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
      else if (!typing && e.key === '/') { e.preventDefault(); openPalette(); }
    });
  }

  /* ------------------------------------------------------------------ *
   * Roster (lista_atleti.php)
   * ------------------------------------------------------------------ */
  // The six base skills, in the order the site prints them (roster columns 8-13,
  // athlete page rows 4-9). Display names are read from the page.
  const BASE = ['str', 'sta', 'spd', 'agi', 'jmp', 'thr'].map((k) => ({ k }));
  const GROUP_COLORS = ['#ff7a1a', '#38bdf8', '#a78bfa', '#34d399', '#f472d0', '#fbbf24', '#f87171', '#94a3b8'];

  const heatBg = (v) => {
    if (v == null) return '';
    const ratio = Math.max(0, Math.min(1, v / 20));
    const hue = Math.round(ratio * 135);
    const a = (theme === 'dark' ? 0.1 : 0.12) + ratio * (theme === 'dark' ? 0.5 : 0.45);
    return `hsla(${hue},75%,${theme === 'dark' ? 45 : 50}%,${a.toFixed(2)})`;
  };

  function cellMark(td) {
    // site markers: font color and legend backgrounds (dropped / rose / rose after a drop)
    let mark = '';
    const f = td.querySelector('font');
    const fc = (f?.getAttribute('color') || '').toLowerCase();
    if (fc === 'red') mark = 'down';
    for (const el of [td, ...td.querySelectorAll('*')]) {
      const bg = parseRGB(el.getAttribute('bgcolor') || el.style.backgroundColor || '');
      const named = (el.getAttribute('bgcolor') || el.style.backgroundColor || '').toLowerCase();
      if (named.includes('orange') || (bg && bg.r === 255 && bg.g === 165 && bg.b === 0)) mark = 'down';
      else if (named.includes('blue') || (bg && bg.r === 0 && bg.g === 0 && bg.b === 255)) mark = 'upd';
      else if (named === 'green' || (bg && bg.r === 0 && bg.g === 128 && bg.b === 0)) mark = 'up';
    }
    return mark;
  }

  function parseRoster() {
    const rows = [];
    const groups = [];
    let lab = null; // column labels, in the site's language
    $$('table[id^="atleti"]').forEach((tbl, gi) => {
      if (!tbl.rows.length) return;
      const head = Array.from(tbl.rows[0].cells).map((c) => c.textContent.trim());
      if (head.length < 18) return;
      const group = head[1] || t('group', gi + 1);
      if (!lab) lab = { coach: head[2], age: head[3], fans: head[5], emp: head[6], forma: head[7], base: head.slice(8, 14) };
      const isYouth = tbl.id === 'atleti8' || tbl.classList.contains('youth');
      groups.push({ name: group, spec: [head[14], head[15]], color: GROUP_COLORS[gi % GROUP_COLORS.length], youth: isYouth });
      Array.from(tbl.tBodies[0]?.rows || []).forEach((tr) => {
        const c = tr.cells;
        if (c.length < 18) return;
        const a = c[1].querySelector('a[href*="atleta"]') || c[1].querySelector('a');
        const nf = c[1].querySelector('font');
        const col = (nf?.getAttribute('color') || '').toUpperCase();
        const gender = col === '#E63CE6' ? 'F' : col === '#32A9AF' ? 'M' : '?';
        let sale = null; const inj = [];
        $$('img', c[1]).forEach((im) => {
          const src = (im.getAttribute('src') || '').toLowerCase();
          const tip = stripTags(im.getAttribute('title') || im.getAttribute('alt') || '');
          if (src.includes('dollar')) sale = tip || t('forSale');
          else inj.push(tip || t('injured'));
        });
        const flag = c[0].querySelector('img');
        const trImg = c[2].querySelector('img');
        const trOk = !!trImg && /tick/i.test(trImg.getAttribute('src') || '');
        const tnImg = c[16].querySelector('img');
        const trainOk = !!tnImg && /tick/i.test(tnImg.getAttribute('src') || '');
        const evF = c[17].querySelector('[title]') || c[17];
        const evTitle = stripTags(evF.getAttribute('title') || '');
        const evNum = toNum((c[17].textContent || '').split('/')[0]);
        const v = (i) => ({ v: toNum(c[i].textContent), m: cellMark(c[i]) });
        const name = (a ? a.textContent : c[1].textContent).replace(/\s+/g, ' ').trim();
        const nameExtra = c[1].textContent.replace(name, '').replace(/\s+/g, ' ').trim();
        const r = {
          group, gi, youth: isYouth, spec: [head[14], head[15]],
          name, href: a ? a.href : null, gender,
          flagSrc: flag?.getAttribute('src') || null, flagTitle: stripTags(flag?.getAttribute('title') || c[0].querySelector('a')?.getAttribute('title') || ''),
          sale, inj: inj.length ? inj.join(' · ') + (nameExtra ? ' (' + nameExtra + ')' : '') : null,
          coach: trOk, coachTip: stripTags(trImg?.getAttribute('title') || '') || (trOk ? t('hasCoach') : t('noCoach')),
          age: toNum(c[3].textContent), maxid: toNum(c[4].textContent), fans: toNum(c[5].textContent),
          emp: v(6), forma: v(7),
          trainOk, trainTip: stripTags(tnImg?.getAttribute('title') || '') || (trainOk ? t('trains') : t('noTrains')),
          // fewer than 5 official events in the last 10 weeks means losing fans
          ev: evNum, evTip: evTitle, evRisk: evNum != null && evNum < 5,
        };
        BASE.forEach((b, i) => { r[b.k] = v(8 + i); });
        r.s1 = v(14); r.s2 = v(15);
        const sk = [...BASE.map((b) => r[b.k].v), r.s1.v, r.s2.v];
        r.total = sk.every((x) => x == null) ? null : sk.reduce((s, x) => s + (x || 0), 0);
        r.specAvg = avg([r.s1.v, r.s2.v]);
        rows.push(r);
      });
    });
    return { rows, groups, lab };
  }

  function saveRosterAverages(rows, groups) {
    const out = {};
    groups.forEach((g) => {
      const rs = rows.filter((r) => r.group === g.name);
      if (!rs.length) return;
      const o = { n: rs.length, spec: g.spec };
      BASE.forEach((b) => { o[b.k] = avg(rs.map((r) => r[b.k].v)); });
      o.s1 = avg(rs.map((r) => r.s1.v)); o.s2 = avg(rs.map((r) => r.s2.v));
      o.maxid = avg(rs.map((r) => r.maxid));
      out[g.name.toLowerCase()] = o;
    });
    LS.set('rosterAvg', { at: Date.now(), groups: out });
  }

  function rosterPage() {
    const host = $('.page_details');
    const first = $('#atleti1');
    if (!host || !first) return;
    const { rows, groups, lab } = parseRoster();
    if (!rows.length) return;
    saveRosterAverages(rows, groups);

    const st = Object.assign({ grp: 'all', gender: 'all', q: '', flags: [], sort: { k: 'maxid', d: -1 }, heat: true, orig: false }, LS.get('roster', {}));
    const save = () => LS.set('roster', { grp: st.grp, gender: st.gender, sort: st.sort, heat: st.heat, flags: st.flags });

    const ui = h('div', { class: 'mxr' });
    first.parentNode.insertBefore(ui, first);
    const applyOrig = () => host.classList.toggle('mx-hide-orig', !st.orig);
    applyOrig();

    // ----- columns -----
    const skillCell = (o, title) => {
      const val = o?.v;
      const cls = 'mxr-sk' + (val >= 15 ? ' top' : val >= 10 ? ' b' : '') + (o?.m ? ' ' + o.m : '');
      const tip = (title ? title + ': ' : '') + (val ?? '–') + (o?.m === 'down' ? ' · ' + t('mDown') : o?.m === 'up' ? ' · ' + t('mUp') : o?.m === 'upd' ? ' · ' + t('mUpd') : '');
      return h('span', { class: cls, title: tip, style: st.heat ? { background: heatBg(val) } : null }, val ?? '–');
    };
    const meter = (val, max, d = 0) => h('div', { class: 'mxr-meter' }, h('i', { style: { width: Math.round(((val || 0) / (max || 1)) * 34) + 'px' } }), h('span', {}, fmt(val, d)));

    const cols = () => {
      const one = st.grp !== 'all' ? groups.find((g) => g.name === st.grp) : null;
      const vis = view();
      const maxMx = Math.max(1, ...vis.map((r) => r.maxid || 0));
      const maxT = Math.max(1, ...vis.map((r) => r.total || 0));
      return [
        { k: 'name', label: t('athlete'), l: true, sv: (r) => r.name, td: (r) => h('div', { class: 'mxr-name' },
          h('span', { class: 'mxr-g ' + r.gender, title: r.gender === 'F' ? t('female') : r.gender === 'M' ? t('male') : '' }),
          r.flagSrc ? h('img', { src: r.flagSrc, title: r.flagTitle, alt: '' }) : null,
          r.href ? h('a', { href: r.href }, r.name) : r.name,
          r.sale ? h('span', { class: 'mxr-badge sale', title: r.sale }, t('badgeSale')) : null,
          r.inj ? h('span', { class: 'mxr-badge inj', title: r.inj }, t('badgeInj')) : null) },
        { k: 'group', label: t('colGroup'), l: true, hide: !!one, sv: (r) => r.gi, td: (r) => { const g = groups[r.gi] || {}; return h('span', { class: 'mxr-grp', style: { background: g.color + '22', color: g.color } }, r.group); } },
        { k: 'age', label: lab.age, sv: (r) => r.age, td: (r) => fmt(r.age) },
        { k: 'maxid', label: 'MAXID', sv: (r) => r.maxid, td: (r) => meter(r.maxid, maxMx) },
        { k: 'fans', label: lab.fans, sv: (r) => r.fans, td: (r) => fmt(r.fans) },
        { k: 'emp', label: lab.emp, sep: true, title: lab.emp, sv: (r) => r.emp.v, td: (r) => skillCell(r.emp, lab.emp) },
        { k: 'forma', label: lab.forma, title: lab.forma, sv: (r) => r.forma.v, td: (r) => skillCell(r.forma, lab.forma) },
        ...BASE.map((b, i) => ({ k: b.k, label: lab.base[i], title: lab.base[i], sep: i === 0, sv: (r) => r[b.k].v, td: (r) => skillCell(r[b.k], lab.base[i]) })),
        { k: 's1', label: one ? one.spec[0] : t('spec1'), title: one ? one.spec[0] : t('spec1T'), sep: true, sv: (r) => r.s1.v, td: (r) => skillCell(r.s1, r.spec[0]) },
        { k: 's2', label: one ? one.spec[1] : t('spec2'), title: one ? one.spec[1] : t('spec2T'), sv: (r) => r.s2.v, td: (r) => skillCell(r.s2, r.spec[1]) },
        { k: 'total', label: 'Σ', title: t('totalT'), sep: true, sv: (r) => r.total, td: (r) => meter(r.total, maxT) },
        { k: 'train', label: t('colTrain'), sep: true, title: t('colTrainT'), sv: (r) => (r.trainOk ? 1 : 0), td: (r) => h('span', { class: r.trainOk ? 'mxr-ok' : 'mxr-no', title: r.trainTip }, r.trainOk ? '✓' : '✕') },
        { k: 'ev', label: t('colEv'), title: t('colEvT'), sv: (r) => r.ev, td: (r) => h('span', { class: 'mxr-ev ' + (r.evRisk ? 'risk' : 'ok'), title: r.evTip }, (r.ev ?? '–') + '/10') },
        { k: 'coach', label: lab.coach, title: t('colCoachT'), sv: (r) => (r.coach ? 1 : 0), td: (r) => h('span', { class: r.coach ? 'mxr-ok' : 'mxr-no', title: r.coachTip }, r.coach ? '✓' : '✕') },
      ].filter((c) => !c.hide);
    };

    const FLAGS = [
      { k: 'notrain', label: t('fNoTrain'), test: (r) => !r.trainOk },
      { k: 'risk', label: t('fRisk'), test: (r) => r.evRisk },
      { k: 'sale', label: t('fSale'), test: (r) => !!r.sale },
      { k: 'inj', label: t('fInj'), test: (r) => !!r.inj },
      { k: 'nocoach', label: t('fNoCoach'), test: (r) => !r.coach },
    ];

    function view() {
      const q = st.q.toLowerCase();
      return rows.filter((r) => (st.grp === 'all' || r.group === st.grp)
        && (st.gender === 'all' || r.gender === st.gender)
        && (!q || r.name.toLowerCase().includes(q) || (r.flagTitle || '').toLowerCase().includes(q))
        && st.flags.every((fk) => FLAGS.find((f) => f.k === fk)?.test(r)));
    }

    function exportCSV() {
      const vis = sorted(view());
      const hdr = [t('csvName'), t('csvGroup'), t('csvGender'), lab.age, 'MAXID', lab.fans, lab.emp, lab.forma, ...lab.base, t('csvSpec1'), t('csvSpec1v'), t('csvSpec2'), t('csvSpec2v'), t('csvTotal'), t('colTrain'), t('csvEv'), lab.coach, t('forSale'), t('injured')];
      const q = (x) => '"' + String(x ?? '').replace(/"/g, '""') + '"';
      const lines = [hdr.map(q).join(';'), ...vis.map((r) => [r.name, r.group, r.gender, r.age, r.maxid, r.fans, r.emp.v, r.forma.v, ...BASE.map((b) => r[b.k].v), r.spec[0], r.s1.v, r.spec[1], r.s2.v, r.total, r.trainOk ? t('yes') : t('no'), r.ev, r.coach ? t('yes') : t('no'), r.sale || '', r.inj || ''].map(q).join(';'))];
      const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = h('a', { href: URL.createObjectURL(blob), download: t('csvFile') + '-' + new Date().toISOString().slice(0, 10) + '.csv' });
      document.body.append(a); a.click(); a.remove();
    }

    function sorted(list) {
      const c = cols().find((x) => x.k === st.sort.k) || cols().find((x) => x.k === 'maxid');
      return list.slice().sort((a, b) => {
        const A = c.sv(a), B = c.sv(b);
        if (A == null && B == null) return 0; if (A == null) return 1; if (B == null) return -1;
        return (typeof A === 'string' ? A.localeCompare(B, LOCALE) : A - B) * st.sort.d;
      });
    }

    function render() {
      const all = rows;
      const vis = view();
      const cnt = (fn) => all.filter(fn).length;
      const M = cnt((r) => r.gender === 'M'), F = cnt((r) => r.gender === 'F');
      const youth = cnt((r) => r.youth);

      const card = (k, v, s, cls, onclick, extra) => h('div', { class: 'mxr-card ' + (cls || '') + (onclick ? ' click' : ''), onclick, title: onclick ? t('clickFilter') : null },
        h('div', { class: 'k' }, k), h('div', { class: 'v' }, v), s ? h('div', { class: 's' }, s) : null, extra || null);
      const toggleFlag = (k) => () => { st.flags = st.flags.includes(k) ? st.flags.filter((x) => x !== k) : [...st.flags, k]; save(); render(); };

      const nNoTrain = cnt((r) => !r.trainOk), nRisk = cnt((r) => r.evRisk), nSale = cnt((r) => !!r.sale), nInj = cnt((r) => !!r.inj), nNoCoach = cnt((r) => !r.coach);
      const cards = h('div', { class: 'mxr-cards' },
        card(t('cAthletes'), all.length, t('cAthletesS', all.length - youth, youth), '', null,
          h('div', { class: 'bar' }, h('i', { class: 'mxr-bar-m', style: { width: (M / all.length * 100) + '%' } }), h('i', { class: 'mxr-bar-f', style: { width: (F / all.length * 100) + '%' } }))),
        card(t('cGender'), `${M} / ${F}`, t('cGenderS')),
        card(t('cAge'), fmt(avg(all.filter((r) => !r.youth).map((r) => r.age)), 1), t('cAgeS', fmt(avg(all.filter((r) => r.youth).map((r) => r.age)), 1))),
        card(t('cMaxid'), fmt(avg(all.filter((r) => !r.youth).map((r) => r.maxid))), t('cMaxidS', fmt(Math.max(...all.map((r) => r.maxid || 0))))),
        card(t('cNoTrain'), nNoTrain, t('cNoTrainS'), nNoTrain ? 'warn' : 'good', toggleFlag('notrain')),
        card(t('cRisk'), nRisk, t('cRiskS'), nRisk ? 'bad' : 'good', toggleFlag('risk')),
        card(t('cInj'), nInj, nInj ? t('cInjS') : t('cInjOk'), nInj ? 'bad' : 'good', toggleFlag('inj')),
        card(t('cSale'), nSale, '', '', toggleFlag('sale')),
        card(t('cNoCoach'), nNoCoach, '', nNoCoach ? 'warn' : 'good', toggleFlag('nocoach')),
      );

      // ----- toolbar -----
      const gChip = (val, label, n, color) => h('button', { class: 'mx-chip' + (st.grp === val ? ' on' : ''), onclick: () => { st.grp = val; save(); render(); } },
        color ? h('span', { class: 'dot', style: { background: color } }) : null, label, h('span', { class: 'n' }, n));
      const search = h('input', { type: 'text', placeholder: t('search'), value: st.q, oninput: (e) => { st.q = e.target.value; renderTable(); } });
      const tools1 = h('div', { class: 'mxr-tools' },
        gChip('all', t('all'), all.length),
        groups.map((g) => gChip(g.name, g.name, cnt((r) => r.group === g.name), g.color)));
      const tools2 = h('div', { class: 'mxr-tools' },
        ['all', 'M', 'F'].map((g) => h('button', { class: 'mx-chip' + (st.gender === g ? ' on' : ''), onclick: () => { st.gender = g; save(); render(); } }, g === 'all' ? t('both') : g === 'M' ? t('maleChip') : t('femaleChip'))),
        FLAGS.map((f) => h('button', { class: 'mx-chip' + (st.flags.includes(f.k) ? ' on' : ''), onclick: toggleFlag(f.k) }, f.label)),
        h('div', { class: 'mxr-search' }, search),
        h('button', { class: 'mx-btn', title: t('heatT'), onclick: () => { st.heat = !st.heat; save(); render(); } }, st.heat ? t('heatOn') : t('heatOff')),
        h('button', { class: 'mx-btn', title: t('csvT'), onclick: exportCSV }, '⇩ CSV'),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow')));

      const tableWrap = h('div', { class: 'mxr-wrap' });
      const legend = h('div', { class: 'mxr-legend' },
        h('span', {}, '0', h('i', { class: 'sw', style: { background: `linear-gradient(90deg,${heatBg(0)},${heatBg(10)},${heatBg(20)})` } }), '20'),
        h('span', {}, h('b', {}, t('lgBold')), ' ≥ 10 · ', h('b', {}, t('lgTop')), ' ≥ 15'),
        h('span', {}, t('lgOutline'), h('span', { style: { color: 'var(--bad)' } }, t('lgDown')), ' · ', h('span', { style: { color: 'var(--good)' } }, t('lgUp')), ' · ', h('span', { style: { color: '#58a6ff' } }, t('lgUpd'))),
        h('span', {}, t('lgHelp')));

      function renderTable() {
        const cs = cols();
        const list = sorted(view());
        const thead = h('thead', {}, h('tr', {}, cs.map((c) => h('th', {
          class: (c.l ? 'l ' : '') + (c.sep ? 'sep ' : '') + (st.sort.k === c.k ? 'sorted' : ''), title: c.title || null,
          onclick: () => { st.sort = { k: c.k, d: st.sort.k === c.k ? -st.sort.d : (c.k === 'name' || c.k === 'group' || c.k === 'age' ? 1 : -1) }; save(); renderTable(); },
        }, c.label, st.sort.k === c.k ? (st.sort.d > 0 ? ' ▲' : ' ▼') : ''))));
        const tbody = h('tbody', {}, list.map((r) => h('tr', { class: r.inj ? 'inj' : '' }, cs.map((c) => h('td', { class: (c.l ? 'l ' : '') + (c.sep ? 'sep' : '') }, c.td(r))))));
        const tbl = h('table', { class: 'mxr-t' }, thead, tbody);
        tableWrap.replaceChildren(list.length ? tbl : h('div', { class: 'mxr-empty' }, t('empty')));
      }

      ui.replaceChildren(cards, tools1, tools2, tableWrap, legend);
      renderTable();
    }
    render();
  }

  /* ------------------------------------------------------------------ *
   * Athlete page (atleta_one.php): radar + summary
   * ------------------------------------------------------------------ */
  function athletePage() {
    const mid = $('#middle_section');
    if (!mid) return;
    const rowsEls = $$('div.row', mid);
    // Rows are read by position, not by label, so any site language works:
    // 0-3 form/commitment/experience/morale, 4-9 base skills, 10-11 specialty.
    const items = [];
    for (const row of rowsEls) {
      const lab = row.querySelector('span');
      const val = row.querySelector('strong');
      const n = toNum(val?.textContent);
      if (!lab || n == null || n < 0 || n > 20) continue;
      items.push({ k: lab.textContent.replace(/:\s*$/, '').trim(), v: n });
      if (items.length === 12) break;
    }
    if (items.length < 10) return;
    const meta = items.slice(0, 4);
    const spec = items.slice(10, 12);
    const axes = [...items.slice(4, 10), ...spec];
    const vals = Object.fromEntries(axes.map((a) => [a.k, a.v]));
    const groupName = ($('h4.heading strong', mid)?.textContent || '').trim();
    const ref = (LS.get('rosterAvg', {}).groups || {})[groupName.toLowerCase()];
    const refVals = ref && spec.length === 2 ? [...BASE.map((b) => ref[b.k]), ref.s1, ref.s2] : null;

    // ---- SVG radar ----
    const N = axes.length, R = 112, C = 150;
    const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / N; const r = (Math.max(0, Math.min(20, v || 0)) / 20) * R; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
    const poly = (arr) => arr.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(',')).join(' ');
    const ns = 'http://www.w3.org/2000/svg';
    const S = (tag, attrs, ...kids) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.forEach((k) => e.append(k)); return e; };
    const svg = S('svg', { viewBox: '-50 -6 400 312', role: 'img', 'aria-label': t('radar') });
    [5, 10, 15, 20].forEach((lv) => svg.append(S('polygon', { points: poly(Array(N).fill(lv)), fill: 'none', stroke: 'var(--border)', 'stroke-width': lv === 20 ? 1.2 : 0.8 })));
    axes.forEach(({ k: ax }, i) => {
      const [x, y] = pt(i, 20);
      svg.append(S('line', { x1: C, y1: C, x2: x, y2: y, stroke: 'var(--border)', 'stroke-width': 0.8 }));
      const [lx, ly] = pt(i, 24.3);
      const txt = S('text', { x: lx, y: ly + 3.5, 'text-anchor': Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end', 'font-size': 10.5, fill: 'var(--muted)', 'font-family': 'system-ui,sans-serif' });
      txt.textContent = ax.length > 11 ? ax.slice(0, 10) + '.' : ax;
      svg.append(txt);
    });
    [10, 20].forEach((lv) => { const txt = S('text', { x: C + 4, y: C - (lv / 20) * R + 10, 'font-size': 8.5, fill: 'var(--muted)' }); txt.textContent = lv; svg.append(txt); });
    if (refVals && refVals.every((x) => x != null)) svg.append(S('polygon', { points: poly(refVals), fill: 'rgba(148,163,184,.14)', stroke: '#94a3b8', 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }));
    const me = axes.map((a) => a.v);
    svg.append(S('polygon', { points: poly(me), fill: 'rgba(255,122,26,.25)', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    me.forEach((v, i) => { const [x, y] = pt(i, v); const c = S('circle', { cx: x, cy: y, r: 3.2, fill: 'var(--accent)' }); const tt = S('title', {}); tt.textContent = `${axes[i].k}: ${v}`; c.append(tt); svg.append(c); });

    const total = me.reduce((s, x) => s + (x || 0), 0);
    const specAvg = avg(spec.map((a) => a.v));
    const best = axes.reduce((b, a) => (a.v > b.v ? a : b)).k;
    const weak = axes.reduce((b, a) => (a.v < b.v ? a : b)).k;
    const refTotal = refVals && refVals.every((x) => x != null) ? refVals.reduce((s, x) => s + x, 0) : null;
    const tile = (k, v, e) => h('div', {}, h('small', {}, k), h('b', {}, v), e ? h('em', {}, e) : null);

    const panel = h('div', { class: 'mxa' },
      h('div', { class: 'mxa-title' }, h('b', {}, t('profile')), groupName ? h('span', { style: { color: 'var(--muted)', fontSize: '12px' } }, groupName) : null),
      h('div', {}, svg, h('div', { class: 'mxa-leg' }, h('span', {}, h('i', { style: { background: 'var(--accent)' } }), t('athlete')),
        refVals ? h('span', {}, h('i', { style: { background: '#94a3b8' } }), t('avgOf', groupName, ref.n)) : h('span', {}, t('openRoster')))),
      h('div', { class: 'mxa-k' },
        tile(t('tTotal'), total, refTotal != null ? t('tTotalVs', `${total - refTotal >= 0 ? '+' : ''}${fmt(total - refTotal, 1)}`) : t('tTotalS')),
        tile(t('tSpec'), fmt(specAvg, 1), spec.map((a) => a.k).join(' · ')),
        tile(t('tBest'), vals[best], best),
        tile(t('tWeak'), vals[weak], weak),
        ...meta.map(({ k, v }) => tile(k, v, v >= 15 ? t('q4') : v >= 10 ? t('q3') : v >= 5 ? t('q2') : t('q1')))));

    // insert after the last skill block (before the rankings)
    const tops = rowsEls.map((r) => { let e = r; while (e.parentElement && e.parentElement !== mid) e = e.parentElement; return e; });
    const anchor = tops[tops.length - 1];
    if (anchor && anchor.parentElement === mid) mid.insertBefore(panel, anchor.nextSibling);
    else mid.prepend(panel);
  }

  /* ------------------------------------------------------------------ *
   * SVG icons (uniform stroke, inherit the theme color)
   * ------------------------------------------------------------------ */
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    stadium: '<ellipse cx="12" cy="8" rx="9" ry="3.5"/><path d="M3 8v8c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V8"/><path d="M8 11.3v8M16 11.3v8"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 21h6M9.5 17h5"/>',
    arrows: '<path d="M4 8h15l-4-4"/><path d="M20 16H5l4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M8.5 11 6 3h4l2 5 2-5h4l-2.5 8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    megaphone: '<path d="M3 11v3a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1z"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    chart: '<path d="M5 20V11M11 20V5M17 20v-7M3 20h18"/>',
    notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    online: '<circle cx="12" cy="12" r="3.5"/><path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    run: '<circle cx="15" cy="4.5" r="2"/><path d="M7 21l3.5-6 3 2.5V22"/><path d="M5.5 11 9 8l4 1.5 2 3.5h3.5"/><path d="m9 8 1.5 7"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
    euro: '<path d="M18 6.5a7 7 0 1 0 0 11"/><path d="M4 10h9M4 14h9"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    relay: '<path d="M4 18 15 7"/><path d="M10 7h5v5"/><circle cx="18" cy="18" r="3"/>',
    cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12l2-8H6.2"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    flag: '<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    clipcheck: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 13l2 2 4-4"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    userx: '<circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 12-4.9M17 15l5 5M22 15l-5 5"/>',
    refresh: '<path d="M20 11A8 8 0 0 0 6.3 5.7L4 8"/><path d="M4 3v5h5M4 13a8 8 0 0 0 13.7 5.3L20 16M20 21v-5h-5"/>',
    send: '<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>',
    dot: '<circle cx="12" cy="12" r="2.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    power: '<path d="M12 3v8"/><path d="M6.3 7a8 8 0 1 0 11.4 0"/>',
  };
  const svgIcon = (name, size = 18) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    s.classList.add('mx-ic');
    s.innerHTML = ICONS[name] || ICONS.dot;
    return s;
  };
  const ICON_RULES = [
    // by page file name (language independent)
    [/^(index)?$/, 'home'], [/^imp_/, 'stadium'], [/dettagli_serie_youth/, 'medal'], [/dettagli_serie/, 'trophy'],
    [/trasf|trasferimenti/, 'arrows'], [/calendario/, 'calendar'], [/amici/, 'users'], [/^record/, 'medal'],
    [/ricerca/, 'search'], [/annunci/, 'megaphone'], [/segnalibri/, 'bookmark'], [/statistiche/, 'chart'],
    [/notepad/, 'notebook'], [/utenti_online/, 'online'], [/modifica_utente/, 'settings'], [/messaggi/, 'mail'],
    [/maxitrainer/, 'zap'], [/lista_atleti_youth/, 'cap'], [/lista_atleti_main/, 'star'], [/lista_atleti/, 'run'],
    [/lista_tecnici|tecnic/, 'clipboard'], [/^staff$/, 'briefcase'], [/budget|economi/, 'euro'], [/staffette/, 'relay'],
    [/dettagli_utente/, 'user'], [/dettagli_societa/, 'shield'], [/geo_/, 'globe'], [/mercato/, 'cart'],
    [/^gare/, 'list'], [/graduatorie|grad_/, 'chart'], [/lista_prossima|competiz/, 'flag'], [/federazion/, 'chat'],
    [/logout/, 'logout'], [/test_settimanali/, 'clipcheck'], [/sviluppo/, 'activity'], [/prestazioni|risultati/, 'list'],
    [/momenti_gloria/, 'medal'], [/bid_history|storico/, 'history'], [/confronta/, 'scale'], [/atleta_one/, 'user'],
  ];
  // athlete actions that stay on the same page are told apart by their class
  const CLASS_ICONS = { icon01: 'scale', icon02: 'userx', icon03: 'refresh', icon04: 'send' };
  const iconFor = (a) => {
    const cls = (a.className.match(/\bicon0\d\b/) || [])[0];
    if (cls && CLASS_ICONS[cls]) return CLASS_ICONS[cls];
    if (a.closest('.market')) return 'euro';
    let p = '';
    try { p = new URL(a.href, location.href).pathname.split('/').pop().replace(/\.php$/, ''); } catch (e) { /* */ }
    for (const [re, name] of ICON_RULES) if (re.test(p)) return name;
    return 'dot';
  };

  function decorateIcons() {
    // ---- logo ----
    const logo = $('#header img.logo');
    if (logo && !$('#header .mx-logo')) {
      const mark = h('span', { class: 'mx-logo' }, h('span', { class: 'mx-logo-ic' }, svgIcon('run', 20)), h('span', { class: 'mx-logo-t' }, 'maxithlon'), h('span', { class: 'mx-logo-b' }, 'UI+'));
      logo.replaceWith(mark);
    }
    // ---- top bar ----
    const here = location.pathname.split('/').pop().replace(/\.php$/, '');
    $$('#header a').forEach((a) => {
      if (a.querySelector('.mx-logo') || a.classList.contains('mx-hi')) return;
      const hasBg = getComputedStyle(a).backgroundImage !== 'none';
      const p = (() => { try { return new URL(a.href, location.href).pathname.split('/').pop().replace(/\.php$/, ''); } catch (e) { return ''; } })();
      if (!hasBg) return; // the online counter stays as text
      a.classList.add('mx-hi');
      if (p && p === here) a.classList.add('mx-current');
      a.replaceChildren(svgIcon(iconFor(a), 18));
    });
    // ---- sidebar ----
    $$('#left_section li a').forEach((a) => {
      if (a.querySelector('.mx-ic')) return;
      a.prepend(svgIcon(iconFor(a), 16));
    });
    // ---- right-column menus ----
    $$('#right_section a, #right_part a').forEach((a) => {
      if (a.querySelector('.mx-ic, img') || !a.textContent.trim()) return;
      const inMenu = a.closest('.right_menu, .market, .coach') || /^icon\d/.test(a.className);
      if (!inMenu) return;
      a.classList.add('mx-ri');
      a.prepend(svgIcon(iconFor(a), 15));
    });
    // ---- decorative images ----
    $$('#middle_section img, #right_section img, #right_part img').forEach((im) => {
      const f = (im.getAttribute('src') || '').split('/').pop().split('?')[0].toLowerCase();
      if (/^(arrow_right\.gif|arrow\.png)$/.test(f)) im.style.display = 'none';
      else if (f === 'bookmark.png') im.replaceWith(svgIcon('bookmark', 18));
      else if (f === 'tick-small.png') im.replaceWith(h('span', { class: 'mx-tick', title: im.title || '' }, '✓'));
      else if (f === 'cross-small.png') im.replaceWith(h('span', { class: 'mx-cross', title: im.title || '' }, '✕'));
    });
  }

  /* ------------------------------------------------------------------ *
   * Skill bars (athlete page and others with div.row)
   * ------------------------------------------------------------------ */
  const barColor = (v, max = 20) => {
    const ratio = Math.max(0, Math.min(1, (v || 0) / max));
    return `hsl(${Math.round(ratio * 135)} 70% ${theme === 'dark' ? 52 : 45}%)`;
  };
  function restyleBars() {
    $$('#middle_section div.row').forEach((row) => {
      if (row.querySelector('.mx-bar')) return;
      const val = toNum(row.querySelector('strong')?.textContent);
      const tbl = row.querySelector('table');
      if (val == null || !tbl) return;
      const bar = h('span', { class: 'mx-bar', title: val + ' / 20' }, h('i', { style: { width: Math.max(2, (val / 20) * 100) + '%', background: barColor(val) } }));
      tbl.replaceWith(bar);
      row.classList.add('mx-row');
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function start() {
    if (!enabled) { buildDock(); return; }
    root.classList.add('mx', 'mx-' + theme);
    injectCSS();
    try { markCurrent(); } catch (e) { console.warn('[UI+] nav', e); }
    try { if (/lista_atleti\.php$/.test(path)) rosterPage(); } catch (e) { console.warn('[UI+] roster', e); }
    try { if (/atleta_one\.php$/.test(path)) athletePage(); } catch (e) { console.warn('[UI+] athlete', e); }
    try { decorateIcons(); } catch (e) { console.warn('[UI+] icons', e); }
    try { restyleBars(); } catch (e) { console.warn('[UI+] bars', e); }
    buildDock();
    bindKeys();
    requestAnimationFrame(() => { try { darkFix(document.body); watchDark(); } catch (e) { console.warn('[UI+] dark', e); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
