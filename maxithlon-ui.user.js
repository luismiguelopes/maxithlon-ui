// ==UserScript==
// @name         Maxithlon UI+
// @namespace    v3mpire.maxithlon.uiplus
// @version      1.11.0
// @description  A modern interface for Maxithlon: dark/light theme, wide layout, roster dashboard with filters and heat map, athlete skill radar and a command palette (Ctrl+K). Works with any site language.
// @description:pt  Uma interface moderna para o Maxithlon: tema escuro/claro, layout largo, painel do plantel com filtros e mapa de calor, radar de habilidades do atleta e paleta de comandos (Ctrl+K). Funciona com qualquer língua do site.
// @description:it  Un'interfaccia moderna per Maxithlon: tema scuro/chiaro, layout ampio, pannelli per rosa, mercato e finanze, radar delle abilità e palette dei comandi (Ctrl+K). Funziona con qualsiasi lingua del sito.
// @description:es  Una interfaz moderna para Maxithlon: tema oscuro/claro, diseño amplio, paneles de plantilla, mercado y finanzas, radar de habilidades y paleta de comandos (Ctrl+K). Funciona con cualquier idioma del sitio.
// @description:fr  Une interface moderne pour Maxithlon : thème sombre/clair, mise en page large, tableaux de bord de l'effectif, du marché et des finances, radar des compétences et palette de commandes (Ctrl+K). Fonctionne avec toutes les langues du site.
// @description:de  Eine moderne Oberfläche für Maxithlon: dunkles/helles Design, breites Layout, Dashboards für Kader, Markt und Finanzen, Fähigkeiten-Radar und Befehlspalette (Strg+K). Funktioniert mit jeder Sprache der Seite.
// @icon        data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmY3YTFhIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmY0ZDZkIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNiIgZmlsbD0idXJsKCNnKSIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQgNCkgc2NhbGUoLjY2NjcpIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMi40IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjE1IiBjeT0iNC41IiByPSIyIi8+PHBhdGggZD0iTTcgMjFsMy41LTYgMyAyLjVWMjIiLz48cGF0aCBkPSJNNS41IDExIDkgOGw0IDEuNSAyIDMuNWgzLjUiLz48cGF0aCBkPSJtOSA4IDEuNSA3Ii8+PC9nPjwvc3ZnPgo=
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

  // Shared component builders (see the design system block in CSS)
  const tile = (k, v, s, o = {}) => h('div', { class: 'mx-tile ' + (o.cls || '') + (o.onclick ? ' click' : ''), onclick: o.onclick || null, title: o.title || null },
    h('div', { class: 'k' }, k), h('div', { class: 'v' }, v), s ? h('div', { class: 's' }, s) : null, o.extra || null);
  const sectionTitle = (title, aside) => h('div', { class: 'mx-card-t' }, h('span', {}, title), aside ? h('span', { class: 'mx-card-a' }, aside) : null);
  // CSV with ";" and a BOM, so Excel opens it with the right columns and accents
  const downloadCSV = (name, header, lines) => {
    const q = (x) => '"' + String(x ?? '').replace(/"/g, '""') + '"';
    const body = [header, ...lines].map((l) => l.map(q).join(';')).join('\n');
    const a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })), download: name + '-' + new Date().toISOString().slice(0, 10) + '.csv' });
    document.body.append(a); a.click(); a.remove();
  };
  const meter = (val, max, d = 0) => h('div', { class: 'mxr-meter' }, h('i', { style: { width: Math.round(((val || 0) / (max || 1)) * 34) + 'px' } }), h('span', {}, fmt(val, d)));

  const theme = LS.get('theme', 'dark');
  const enabled = LS.get('enabled', true);
  // User settings (dock gear): accent color, density and modules turned off
  const ACCENTS = ['#ff7a1a', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#ef4444', '#14b8a6', '#eab308'];
  const settings = Object.assign({ accent: ACCENTS[0], density: 'comfortable', menu: 'full', off: [] }, LS.get('settings', {}));
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
      tipMore: 'More', tipLess: 'Less', tipT: 'Show or hide the page explanation',
      mkResults: 'Results', mkResultsS: (n, tot) => `${n} on this page · ${tot} in total`,
      mkCheapest: 'Cheapest', mkAvgPrice: 'Average price', mkBestValue: 'Best value', mkBestValueS: '€ per MAXID point',
      mkEnding: 'Ending first', mkFits: 'Fits my roster', mkFitsS: 'above your group average',
      mkNoRoster: 'open your Athletes list to compare', mkPrice: 'Price', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Price per MAXID point (lower is better value)',
      mkLeft: 'Time left', mkLeftT: 'Time until the deadline (server time)', mkEnded: 'ended',
      mkFit: 'vs roster', mkFitT: 'Sum of the 8 skills compared with your roster average for the same group',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs your ${g} average ${a} (${n} athletes)`,
      mkSearch: 'Search athlete or country…', mkPageNote: 'Sorting and filters apply to the results on this page.',
      mkSave: '★ Save view', mkSaveT: 'Save the current filters as a quick view', mkRemove: 'Remove this view',
      mkCsvFile: 'market', mkEmpty: 'No results match these filters.',
      fnIncVsExp: 'Income vs expenses', fnVsPrev: (p) => 'vs ' + p, fnShare: 'share of the total', fnNew: 'new',
      fnNet: 'Net', fnCount: 'Transactions', fnByDay: 'By day', fnByCat: 'By category', fnAll: 'All',
      fnSearch: 'Search reason…', fnCsvFile: 'transactions', fnEmpty: 'No transactions match these filters.',
      formLow: 'low form', formHigh: 'top form',
      setTitle: 'UI+ settings', setTheme: 'Theme', setDark: 'Dark', setLight: 'Light', setAccent: 'Accent color',
      setDensity: 'Density', setComfortable: 'Comfortable', setCompact: 'Compact', setModules: 'Modules',
      setMenu: 'Left menu', setMenuFull: 'Full', setMenuRail: 'Icons only', sideToggle: 'Show or hide this section', modSidebar: 'Collapsible menu sections', modHome: 'Home page dashboard', modAccount: 'Account, options and messages pages',
      setReset: 'Reset settings', setReload: 'Reload to apply', setLive: 'Changes apply right away',
      modRoster: 'Athletes list dashboard', modMarket: 'Market dashboard', modFinances: 'Finances dashboard',
      modTransactions: 'Transactions dashboard', modAthlete: 'Athlete page cards and radar', modIcons: 'SVG icons and event pictograms',
      modRightCol: 'Right column forms', modTips: 'Collapsible page intros', modBars: 'Colored skill bars', modPalette: 'Command palette (Ctrl+K)',
      failPanel: (n) => `UI+ could not load this panel (${n}). The original page is shown instead.`, failDetails: 'Details in the console',
      lgPos: 'Position', lgOf: (n) => `of ${n}`, lgLeader: 'Gap to leader', lgPromo: 'Promotion zone', lgReleg: 'Relegation zone', lgAvg: 'Points per meeting', lgForm: 'Form', lgFormT: 'Average points in the last 3 meetings (▲▼ against the season average)', lgPromoZ: 'Promotion', lgRelegZ: 'Relegation', lgMissed: 'Did not take part', lgAbove: 'points above the line', lgBelow: 'points below the line', lgNotRun: 'Still to be held', calToday: 'Today', calNext: 'Next', modLeague: 'League table', modCalendar: 'Calendars', modComp: 'Highlights in competition results', modGlory: 'Moments of glory and honours', modCharts: 'League charts', modCompList: 'Competition search as a filter bar',
      modCoaches: 'Coaches', tcNoCoach: 'No coach', tcCovered: (a, b) => `${a} of ${b} with a coach`, tcAvgT: 'Average of your athletes in this group', tcFrom: (d) => `Athletes from the Training page (${d})`, tcVisit: 'Open the Training page once to see the athletes of each coach.', tcPerCoach: 'Athletes per coach', tcRoster: 'Open the Athletes list once to compare the coaches with your groups.',
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
      tipMore: 'Mais', tipLess: 'Menos', tipT: 'Mostrar ou esconder a explicação da página',
      mkResults: 'Resultados', mkResultsS: (n, tot) => `${n} nesta página · ${tot} no total`,
      mkCheapest: 'Mais barato', mkAvgPrice: 'Preço médio', mkBestValue: 'Melhor valor', mkBestValueS: '€ por ponto de MAXID',
      mkEnding: 'Termina primeiro', mkFits: 'Serve o plantel', mkFitsS: 'acima da média do grupo',
      mkNoRoster: 'abre a lista de Atletas para comparar', mkPrice: 'Preço', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Preço por ponto de MAXID (mais baixo = melhor valor)',
      mkLeft: 'Falta', mkLeftT: 'Tempo até ao prazo (hora do servidor)', mkEnded: 'terminou',
      mkFit: 'vs plantel', mkFitT: 'Soma das 8 habilidades comparada com a média do teu plantel no mesmo grupo',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs média dos teus ${g} ${a} (${n} atletas)`,
      mkSearch: 'Procurar atleta ou país…', mkPageNote: 'A ordenação e os filtros aplicam-se aos resultados desta página.',
      mkSave: '★ Guardar vista', mkSaveT: 'Guardar os filtros atuais como vista rápida', mkRemove: 'Remover esta vista',
      mkCsvFile: 'mercado', mkEmpty: 'Nenhum resultado com estes filtros.',
      fnIncVsExp: 'Receitas vs despesas', fnVsPrev: (p) => 'vs ' + p, fnShare: 'do total', fnNew: 'novo',
      fnNet: 'Saldo', fnCount: 'Transações', fnByDay: 'Por dia', fnByCat: 'Por categoria', fnAll: 'Todas',
      fnSearch: 'Procurar motivo…', fnCsvFile: 'transacoes', fnEmpty: 'Nenhuma transação com estes filtros.',
      formLow: 'forma baixa', formHigh: 'forma ótima',
      setTitle: 'Definições do UI+', setTheme: 'Tema', setDark: 'Escuro', setLight: 'Claro', setAccent: 'Cor de destaque',
      setDensity: 'Densidade', setComfortable: 'Confortável', setCompact: 'Compacta', setModules: 'Módulos',
      setMenu: 'Menu lateral', setMenuFull: 'Completo', setMenuRail: 'Só ícones', sideToggle: 'Mostrar ou esconder esta secção', modSidebar: 'Secções do menu recolhíveis', modHome: 'Painel da página inicial', modAccount: 'Páginas da conta, opções e mensagens',
      setReset: 'Repor definições', setReload: 'Recarregar para aplicar', setLive: 'As alterações aplicam-se logo',
      modRoster: 'Painel da lista de atletas', modMarket: 'Painel do mercado', modFinances: 'Painel das finanças',
      modTransactions: 'Painel das transações', modAthlete: 'Cartões e radar da página do atleta', modIcons: 'Ícones SVG e pictogramas das provas',
      modRightCol: 'Formulários da coluna direita', modTips: 'Introduções das páginas recolhíveis', modBars: 'Barras de habilidade coloridas', modPalette: 'Paleta de comandos (Ctrl+K)',
      failPanel: (n) => `O UI+ não conseguiu carregar este painel (${n}). Está a ser mostrada a página original.`, failDetails: 'Detalhes na consola',
      lgPos: 'Posição', lgOf: (n) => `de ${n}`, lgLeader: 'Distância ao líder', lgPromo: 'Zona de subida', lgReleg: 'Zona de descida', lgAvg: 'Pontos por jornada', lgForm: 'Forma', lgFormT: 'Média de pontos nas 3 últimas jornadas (▲▼ face à média da época)', lgPromoZ: 'Subida', lgRelegZ: 'Descida', lgMissed: 'Não participou', lgAbove: 'pontos acima da linha', lgBelow: 'pontos abaixo da linha', lgNotRun: 'Ainda por disputar', calToday: 'Hoje', calNext: 'Próxima', modLeague: 'Classificação da liga', modCalendar: 'Calendários', modComp: 'Destaques nos resultados das competições', modGlory: 'Momentos de glória e quadro de honra', modCharts: 'Gráficos da liga', modCompList: 'Pesquisa de competições em barra de filtros',
      modCoaches: 'Treinadores', tcNoCoach: 'Sem treinador', tcCovered: (a, b) => `${a} de ${b} com treinador`, tcAvgT: 'Média dos teus atletas neste grupo', tcFrom: (d) => `Atletas da página de Treino (${d})`, tcVisit: 'Abre a página de Treino uma vez para ver os atletas de cada treinador.', tcPerCoach: 'Atletas por treinador', tcRoster: 'Abre a lista de Atletas uma vez para comparar os treinadores com os teus grupos.',
    },
    it: {
      palette: 'Palette dei comandi (Ctrl+K o /)', toLight: 'Passa al tema chiaro', toDark: 'Passa al tema scuro',
      turnOff: 'Disattiva Maxithlon UI+ (torna al sito originale)', turnOn: 'Attiva Maxithlon UI+',
      grpMenu: 'Menu', grpTop: 'Barra in alto', grpPage: 'Questa pagina',
      lightTheme: 'Tema chiaro', darkTheme: 'Tema scuro', turnOffShort: 'Disattiva UI+ (sito originale)',
      palPlaceholder: 'Vai a… (atleti, mercato, campionato, allenatori…)',
      palNav: '↑↓ naviga', palOpen: '↵ apri', palNewTab: 'Ctrl+↵ nuova scheda', palClose: 'Esc chiudi',
      group: (n) => 'Gruppo ' + n, forSale: 'In vendita', injured: 'Infortunato',
      hasCoach: 'Ha un allenatore', noCoach: 'Senza allenatore', trains: 'Si allenerà questa settimana', noTrains: 'Non si allenerà questa settimana',
      mDown: 'segnato in rosso / calato', mUp: 'salito', mUpd: 'salito dopo un calo',
      athlete: 'Atleta', female: 'Femmina', male: 'Maschio', badgeSale: '€ in vendita', badgeInj: '✚ infortunato',
      colGroup: 'Gruppo', spec1: 'Sp1', spec2: 'Sp2', spec1T: '1ª abilità di specialità', spec2T: '2ª abilità di specialità',
      totalT: 'Somma delle 8 abilità (6 base + 2 di specialità)', colTrain: 'Allena', colTrainT: 'Si allenerà questa settimana?',
      colEv: 'Gare', colEvT: 'Gare ufficiali nelle ultime 10 settimane (≥5 per non perdere tifosi)', colCoachT: 'Ha un allenatore assegnato?',
      fNoTrain: 'Non si allenano', fRisk: 'Rischio di perdere tifosi', fSale: 'In vendita', fInj: 'Infortunati', fNoCoach: 'Senza allenatore',
      csvName: 'Nome', csvGroup: 'Gruppo', csvGender: 'Sesso', csvSpec1: 'Spec1', csvSpec1v: 'Spec1 valore',
      csvSpec2: 'Spec2', csvSpec2v: 'Spec2 valore', csvTotal: 'Totale', csvEv: 'Gare/10', yes: 'Sì', no: 'No', csvFile: 'rosa',
      clickFilter: 'Clicca per filtrare',
      cAthletes: 'Atleti', cAthletesS: (s, y) => `${s} senior · ${y} giovanili`,
      cGender: 'Maschi / Femmine', cGenderS: 'blu = M · rosa = F',
      cAge: 'Età media', cAgeS: (v) => 'giovanili: ' + v, cMaxid: 'MAXID medio', cMaxidS: (v) => 'migliore: ' + v,
      cNoTrain: 'Non si allenano', cNoTrainS: 'questa settimana', cRisk: 'Rischio tifosi', cRiskS: '< 5 gare in 10 sett.',
      cInj: 'Infortunati', cInjS: 'vedi dettagli', cInjOk: 'tutti in forma', cSale: 'In vendita', cNoCoach: 'Senza allenatore',
      search: 'Cerca atleta o paese…', all: 'Tutti', both: 'Entrambi', maleChip: '♂ Maschi', femaleChip: '♀ Femmine',
      heatT: 'Mappa di calore sulle abilità', heatOn: '▦ Calore: on', heatOff: '▢ Calore: off',
      csvT: 'Esporta la vista attuale in CSV (si apre in Excel)',
      origT: 'Mostra/nascondi le tabelle originali del sito', origShow: 'Mostra originale', origHide: 'Nascondi originale',
      lgBold: 'grassetto', lgTop: 'evidenziato', lgOutline: 'bordo: ', lgDown: 'rosso calato', lgUp: 'verde salito', lgUpd: 'blu salito dopo un calo',
      lgHelp: 'Clicca un\'intestazione per ordinare · Ctrl+K per navigare', empty: 'Nessun atleta con questi filtri.',
      radar: 'Radar delle abilità', profile: 'Profilo delle abilità', avgOf: (g, n) => `Media della rosa: ${g} (${n})`,
      openRoster: 'apri la lista Atleti per confrontare con la tua rosa',
      tTotal: 'Σ abilità', tTotalVs: (d) => d + ' vs media', tTotalS: '8 abilità', tSpec: 'Specialità',
      tBest: 'Punto forte', tWeak: 'Punto debole', q4: 'eccellente', q3: 'buono', q2: 'debole', q1: 'molto debole',
      tipMore: 'Altro', tipLess: 'Meno', tipT: 'Mostra o nascondi la spiegazione della pagina',
      mkResults: 'Risultati', mkResultsS: (n, tot) => `${n} in questa pagina · ${tot} in totale`,
      mkCheapest: 'Più economico', mkAvgPrice: 'Prezzo medio', mkBestValue: 'Miglior valore', mkBestValueS: '€ per punto MAXID',
      mkEnding: 'Scade per primo', mkFits: 'Adatti alla rosa', mkFitsS: 'sopra la media del gruppo',
      mkNoRoster: 'apri la lista Atleti per confrontare', mkPrice: 'Prezzo', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Prezzo per punto MAXID (più basso = miglior valore)',
      mkLeft: 'Tempo rimasto', mkLeftT: 'Tempo alla scadenza (ora del server)', mkEnded: 'scaduto',
      mkFit: 'vs rosa', mkFitT: 'Somma delle 8 abilità confrontata con la media della tua rosa nello stesso gruppo',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs media dei tuoi ${g} ${a} (${n} atleti)`,
      mkSearch: 'Cerca atleta o paese…', mkPageNote: 'Ordinamento e filtri valgono per i risultati di questa pagina.',
      mkSave: '★ Salva vista', mkSaveT: 'Salva i filtri attuali come vista rapida', mkRemove: 'Rimuovi questa vista',
      mkCsvFile: 'mercato', mkEmpty: 'Nessun risultato con questi filtri.',
      fnIncVsExp: 'Entrate vs uscite', fnVsPrev: (p) => 'vs ' + p, fnShare: 'del totale', fnNew: 'nuovo',
      fnNet: 'Saldo', fnCount: 'Transazioni', fnByDay: 'Per giorno', fnByCat: 'Per categoria', fnAll: 'Tutte',
      fnSearch: 'Cerca causale…', fnCsvFile: 'transazioni', fnEmpty: 'Nessuna transazione con questi filtri.',
      formLow: 'forma bassa', formHigh: 'forma ottima',
      setTitle: 'Impostazioni UI+', setTheme: 'Tema', setDark: 'Scuro', setLight: 'Chiaro', setAccent: 'Colore principale',
      setDensity: 'Densità', setComfortable: 'Comoda', setCompact: 'Compatta', setModules: 'Moduli',
      setMenu: 'Menu laterale', setMenuFull: 'Completo', setMenuRail: 'Solo icone', sideToggle: 'Mostra o nascondi questa sezione', modSidebar: 'Sezioni del menu comprimibili', modHome: 'Pannello della home', modAccount: 'Pagine di account, opzioni e messaggi',
      setReset: 'Ripristina impostazioni', setReload: 'Ricarica per applicare', setLive: 'Le modifiche si applicano subito',
      modRoster: 'Pannello della lista atleti', modMarket: 'Pannello del mercato', modFinances: 'Pannello delle finanze',
      modTransactions: 'Pannello delle transazioni', modAthlete: 'Schede e radar della pagina atleta', modIcons: 'Icone SVG e pittogrammi delle gare',
      modRightCol: 'Moduli della colonna destra', modTips: 'Introduzioni delle pagine comprimibili', modBars: 'Barre delle abilità colorate', modPalette: 'Palette dei comandi (Ctrl+K)',
      failPanel: (n) => `UI+ non è riuscito a caricare questo pannello (${n}). Viene mostrata la pagina originale.`, failDetails: 'Dettagli nella console',
      lgPos: 'Posizione', lgOf: (n) => `di ${n}`, lgLeader: 'Distacco dalla vetta', lgPromo: 'Zona promozione', lgReleg: 'Zona retrocessione', lgAvg: 'Punti per giornata', lgForm: 'Forma', lgFormT: 'Media punti nelle ultime 3 giornate (▲▼ rispetto alla media stagionale)', lgPromoZ: 'Promozione', lgRelegZ: 'Retrocessione', lgMissed: 'Non ha partecipato', lgAbove: 'punti sopra la linea', lgBelow: 'punti sotto la linea', lgNotRun: 'Ancora da disputare', calToday: 'Oggi', calNext: 'Prossima', modLeague: 'Classifica del campionato', modCalendar: 'Calendari', modComp: 'Evidenziazioni nei risultati delle competizioni', modGlory: "Momenti di gloria e albo d'oro", modCharts: 'Grafici del campionato', modCompList: 'Ricerca competizioni come barra di filtri',
      modCoaches: 'Allenatori', tcNoCoach: 'Nessun allenatore', tcCovered: (a, b) => `${a} su ${b} con allenatore`, tcAvgT: 'Media dei tuoi atleti in questo gruppo', tcFrom: (d) => `Atleti dalla pagina Allenamento (${d})`, tcVisit: "Apri una volta la pagina Allenamento per vedere gli atleti di ogni allenatore.", tcPerCoach: 'Atleti per allenatore', tcRoster: 'Apri una volta la lista Atleti per confrontare gli allenatori con i tuoi gruppi.',
    },
    es: {
      palette: 'Paleta de comandos (Ctrl+K o /)', toLight: 'Cambiar a tema claro', toDark: 'Cambiar a tema oscuro',
      turnOff: 'Desactivar Maxithlon UI+ (volver al sitio original)', turnOn: 'Activar Maxithlon UI+',
      grpMenu: 'Menú', grpTop: 'Barra superior', grpPage: 'Esta página',
      lightTheme: 'Tema claro', darkTheme: 'Tema oscuro', turnOffShort: 'Desactivar UI+ (sitio original)',
      palPlaceholder: 'Ir a… (atletas, mercado, liga, entrenadores…)',
      palNav: '↑↓ navegar', palOpen: '↵ abrir', palNewTab: 'Ctrl+↵ nueva pestaña', palClose: 'Esc cerrar',
      group: (n) => 'Grupo ' + n, forSale: 'En venta', injured: 'Lesionado',
      hasCoach: 'Tiene entrenador', noCoach: 'Sin entrenador', trains: 'Entrenará esta semana', noTrains: 'No entrenará esta semana',
      mDown: 'marcado en rojo / bajó', mUp: 'subió', mUpd: 'subió tras una bajada',
      athlete: 'Atleta', female: 'Femenino', male: 'Masculino', badgeSale: '€ en venta', badgeInj: '✚ lesionado',
      colGroup: 'Grupo', spec1: 'Esp1', spec2: 'Esp2', spec1T: '1.ª habilidad de especialidad', spec2T: '2.ª habilidad de especialidad',
      totalT: 'Suma de las 8 habilidades (6 base + 2 de especialidad)', colTrain: 'Entrena', colTrainT: '¿Entrenará esta semana?',
      colEv: 'Pruebas', colEvT: 'Pruebas oficiales en las últimas 10 semanas (≥5 para no perder aficionados)', colCoachT: '¿Tiene entrenador asignado?',
      fNoTrain: 'No entrenan', fRisk: 'Riesgo de perder aficionados', fSale: 'En venta', fInj: 'Lesionados', fNoCoach: 'Sin entrenador',
      csvName: 'Nombre', csvGroup: 'Grupo', csvGender: 'Sexo', csvSpec1: 'Esp1', csvSpec1v: 'Esp1 valor',
      csvSpec2: 'Esp2', csvSpec2v: 'Esp2 valor', csvTotal: 'Suma', csvEv: 'Pruebas/10', yes: 'Sí', no: 'No', csvFile: 'plantilla',
      clickFilter: 'Clic para filtrar',
      cAthletes: 'Atletas', cAthletesS: (s, y) => `${s} absolutos · ${y} cantera`,
      cGender: 'Masc. / Fem.', cGenderS: 'azul = M · rosa = F',
      cAge: 'Edad media', cAgeS: (v) => 'cantera: ' + v, cMaxid: 'MAXID medio', cMaxidS: (v) => 'mejor: ' + v,
      cNoTrain: 'No entrenan', cNoTrainS: 'esta semana', cRisk: 'Riesgo aficionados', cRiskS: '< 5 pruebas en 10 sem.',
      cInj: 'Lesionados', cInjS: 'ver detalles', cInjOk: 'todos bien', cSale: 'En venta', cNoCoach: 'Sin entrenador',
      search: 'Buscar atleta o país…', all: 'Todos', both: 'Ambos', maleChip: '♂ Masc.', femaleChip: '♀ Fem.',
      heatT: 'Mapa de calor en las habilidades', heatOn: '▦ Calor: on', heatOff: '▢ Calor: off',
      csvT: 'Exportar la vista actual a CSV (se abre en Excel)',
      origT: 'Mostrar/ocultar las tablas originales del sitio', origShow: 'Ver original', origHide: 'Ocultar original',
      lgBold: 'negrita', lgTop: 'destacado', lgOutline: 'borde: ', lgDown: 'rojo bajó', lgUp: 'verde subió', lgUpd: 'azul subió tras una bajada',
      lgHelp: 'Clic en una cabecera para ordenar · Ctrl+K para navegar', empty: 'Ningún atleta con estos filtros.',
      radar: 'Radar de habilidades', profile: 'Perfil de habilidades', avgOf: (g, n) => `Media de la plantilla: ${g} (${n})`,
      openRoster: 'abre la lista de Atletas para comparar con tu plantilla',
      tTotal: 'Σ habilidades', tTotalVs: (d) => d + ' vs media', tTotalS: '8 habilidades', tSpec: 'Especialidad',
      tBest: 'Punto fuerte', tWeak: 'Punto débil', q4: 'excelente', q3: 'bueno', q2: 'flojo', q1: 'muy flojo',
      tipMore: 'Más', tipLess: 'Menos', tipT: 'Mostrar u ocultar la explicación de la página',
      mkResults: 'Resultados', mkResultsS: (n, tot) => `${n} en esta página · ${tot} en total`,
      mkCheapest: 'Más barato', mkAvgPrice: 'Precio medio', mkBestValue: 'Mejor valor', mkBestValueS: '€ por punto de MAXID',
      mkEnding: 'Termina antes', mkFits: 'Encaja en la plantilla', mkFitsS: 'por encima de la media del grupo',
      mkNoRoster: 'abre la lista de Atletas para comparar', mkPrice: 'Precio', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Precio por punto de MAXID (más bajo = mejor valor)',
      mkLeft: 'Tiempo restante', mkLeftT: 'Tiempo hasta el plazo (hora del servidor)', mkEnded: 'terminado',
      mkFit: 'vs plantilla', mkFitT: 'Suma de las 8 habilidades comparada con la media de tu plantilla en el mismo grupo',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs media de tus ${g} ${a} (${n} atletas)`,
      mkSearch: 'Buscar atleta o país…', mkPageNote: 'El orden y los filtros se aplican a los resultados de esta página.',
      mkSave: '★ Guardar vista', mkSaveT: 'Guardar los filtros actuales como vista rápida', mkRemove: 'Quitar esta vista',
      mkCsvFile: 'mercado', mkEmpty: 'Ningún resultado con estos filtros.',
      fnIncVsExp: 'Ingresos vs gastos', fnVsPrev: (p) => 'vs ' + p, fnShare: 'del total', fnNew: 'nuevo',
      fnNet: 'Saldo', fnCount: 'Transacciones', fnByDay: 'Por día', fnByCat: 'Por categoría', fnAll: 'Todas',
      fnSearch: 'Buscar concepto…', fnCsvFile: 'transacciones', fnEmpty: 'Ninguna transacción con estos filtros.',
      formLow: 'forma baja', formHigh: 'forma óptima',
      setTitle: 'Ajustes de UI+', setTheme: 'Tema', setDark: 'Oscuro', setLight: 'Claro', setAccent: 'Color de acento',
      setDensity: 'Densidad', setComfortable: 'Cómoda', setCompact: 'Compacta', setModules: 'Módulos',
      setMenu: 'Menú lateral', setMenuFull: 'Completo', setMenuRail: 'Solo iconos', sideToggle: 'Mostrar u ocultar esta sección', modSidebar: 'Secciones del menú plegables', modHome: 'Panel de la página de inicio', modAccount: 'Páginas de cuenta, opciones y mensajes',
      setReset: 'Restablecer ajustes', setReload: 'Recargar para aplicar', setLive: 'Los cambios se aplican al momento',
      modRoster: 'Panel de la lista de atletas', modMarket: 'Panel del mercado', modFinances: 'Panel de finanzas',
      modTransactions: 'Panel de transacciones', modAthlete: 'Tarjetas y radar de la página del atleta', modIcons: 'Iconos SVG y pictogramas de las pruebas',
      modRightCol: 'Formularios de la columna derecha', modTips: 'Introducciones de página plegables', modBars: 'Barras de habilidad de colores', modPalette: 'Paleta de comandos (Ctrl+K)',
      failPanel: (n) => `UI+ no pudo cargar este panel (${n}). Se muestra la página original.`, failDetails: 'Detalles en la consola',
      lgPos: 'Posición', lgOf: (n) => `de ${n}`, lgLeader: 'Distancia al líder', lgPromo: 'Zona de ascenso', lgReleg: 'Zona de descenso', lgAvg: 'Puntos por jornada', lgForm: 'Forma', lgFormT: 'Media de puntos en las 3 últimas jornadas (▲▼ frente a la media de la temporada)', lgPromoZ: 'Ascenso', lgRelegZ: 'Descenso', lgMissed: 'No participó', lgAbove: 'puntos por encima de la línea', lgBelow: 'puntos por debajo de la línea', lgNotRun: 'Por disputar', calToday: 'Hoy', calNext: 'Próxima', modLeague: 'Clasificación de la liga', modCalendar: 'Calendarios', modComp: 'Destacados en los resultados de competiciones', modGlory: 'Momentos de gloria y palmarés', modCharts: 'Gráficos de la liga', modCompList: 'Búsqueda de competiciones como barra de filtros',
      modCoaches: 'Entrenadores', tcNoCoach: 'Sin entrenador', tcCovered: (a, b) => `${a} de ${b} con entrenador`, tcAvgT: 'Media de tus atletas en este grupo', tcFrom: (d) => `Atletas de la página de Entrenamiento (${d})`, tcVisit: 'Abre una vez la página de Entrenamiento para ver los atletas de cada entrenador.', tcPerCoach: 'Atletas por entrenador', tcRoster: 'Abre una vez la lista de Atletas para comparar los entrenadores con tus grupos.',
    },
    fr: {
      palette: 'Palette de commandes (Ctrl+K ou /)', toLight: 'Passer au thème clair', toDark: 'Passer au thème sombre',
      turnOff: 'Désactiver Maxithlon UI+ (retour au site d\'origine)', turnOn: 'Activer Maxithlon UI+',
      grpMenu: 'Menu', grpTop: 'Barre du haut', grpPage: 'Cette page',
      lightTheme: 'Thème clair', darkTheme: 'Thème sombre', turnOffShort: 'Désactiver UI+ (site d\'origine)',
      palPlaceholder: 'Aller à… (athlètes, marché, ligue, entraîneurs…)',
      palNav: '↑↓ naviguer', palOpen: '↵ ouvrir', palNewTab: 'Ctrl+↵ nouvel onglet', palClose: 'Échap fermer',
      group: (n) => 'Groupe ' + n, forSale: 'À vendre', injured: 'Blessé',
      hasCoach: 'A un entraîneur', noCoach: 'Sans entraîneur', trains: 'S\'entraînera cette semaine', noTrains: 'Ne s\'entraînera pas cette semaine',
      mDown: 'marqué en rouge / en baisse', mUp: 'en hausse', mUpd: 'en hausse après une baisse',
      athlete: 'Athlète', female: 'Femme', male: 'Homme', badgeSale: '€ à vendre', badgeInj: '✚ blessé',
      colGroup: 'Groupe', spec1: 'Sp1', spec2: 'Sp2', spec1T: '1re compétence de spécialité', spec2T: '2e compétence de spécialité',
      totalT: 'Somme des 8 compétences (6 de base + 2 de spécialité)', colTrain: 'Entraîne', colTrainT: 'S\'entraînera cette semaine ?',
      colEv: 'Épreuves', colEvT: 'Épreuves officielles sur les 10 dernières semaines (≥5 pour garder les fans)', colCoachT: 'A un entraîneur attribué ?',
      fNoTrain: 'Sans entraînement', fRisk: 'Risque de perdre des fans', fSale: 'À vendre', fInj: 'Blessés', fNoCoach: 'Sans entraîneur',
      csvName: 'Nom', csvGroup: 'Groupe', csvGender: 'Sexe', csvSpec1: 'Spé1', csvSpec1v: 'Spé1 valeur',
      csvSpec2: 'Spé2', csvSpec2v: 'Spé2 valeur', csvTotal: 'Total', csvEv: 'Épreuves/10', yes: 'Oui', no: 'Non', csvFile: 'effectif',
      clickFilter: 'Cliquer pour filtrer',
      cAthletes: 'Athlètes', cAthletesS: (s, y) => `${s} seniors · ${y} jeunes`,
      cGender: 'Hommes / Femmes', cGenderS: 'bleu = H · rose = F',
      cAge: 'Âge moyen', cAgeS: (v) => 'jeunes : ' + v, cMaxid: 'MAXID moyen', cMaxidS: (v) => 'meilleur : ' + v,
      cNoTrain: 'Sans entraînement', cNoTrainS: 'cette semaine', cRisk: 'Risque fans', cRiskS: '< 5 épreuves en 10 sem.',
      cInj: 'Blessés', cInjS: 'voir détails', cInjOk: 'tous en forme', cSale: 'À vendre', cNoCoach: 'Sans entraîneur',
      search: 'Chercher un athlète ou un pays…', all: 'Tous', both: 'Les deux', maleChip: '♂ Hommes', femaleChip: '♀ Femmes',
      heatT: 'Carte de chaleur sur les compétences', heatOn: '▦ Chaleur : on', heatOff: '▢ Chaleur : off',
      csvT: 'Exporter la vue actuelle en CSV (s\'ouvre dans Excel)',
      origT: 'Afficher/masquer les tableaux d\'origine du site', origShow: 'Voir l\'original', origHide: 'Masquer l\'original',
      lgBold: 'gras', lgTop: 'surligné', lgOutline: 'contour : ', lgDown: 'rouge en baisse', lgUp: 'vert en hausse', lgUpd: 'bleu en hausse après une baisse',
      lgHelp: 'Cliquer sur un en-tête pour trier · Ctrl+K pour naviguer', empty: 'Aucun athlète avec ces filtres.',
      radar: 'Radar des compétences', profile: 'Profil des compétences', avgOf: (g, n) => `Moyenne de l'effectif : ${g} (${n})`,
      openRoster: 'ouvrez la liste des Athlètes pour comparer avec votre effectif',
      tTotal: 'Σ compétences', tTotalVs: (d) => d + ' vs moyenne', tTotalS: '8 compétences', tSpec: 'Spécialité',
      tBest: 'Point fort', tWeak: 'Point faible', q4: 'excellent', q3: 'bon', q2: 'faible', q1: 'très faible',
      tipMore: 'Plus', tipLess: 'Moins', tipT: 'Afficher ou masquer l\'explication de la page',
      mkResults: 'Résultats', mkResultsS: (n, tot) => `${n} sur cette page · ${tot} au total`,
      mkCheapest: 'Le moins cher', mkAvgPrice: 'Prix moyen', mkBestValue: 'Meilleur rapport', mkBestValueS: '€ par point de MAXID',
      mkEnding: 'Se termine en premier', mkFits: 'Convient à l\'effectif', mkFitsS: 'au-dessus de la moyenne du groupe',
      mkNoRoster: 'ouvrez la liste des Athlètes pour comparer', mkPrice: 'Prix', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Prix par point de MAXID (plus bas = meilleur rapport)',
      mkLeft: 'Temps restant', mkLeftT: 'Temps jusqu\'à l\'échéance (heure du serveur)', mkEnded: 'terminé',
      mkFit: 'vs effectif', mkFitT: 'Somme des 8 compétences comparée à la moyenne de votre effectif dans le même groupe',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs moyenne de vos ${g} ${a} (${n} athlètes)`,
      mkSearch: 'Chercher un athlète ou un pays…', mkPageNote: 'Le tri et les filtres portent sur les résultats de cette page.',
      mkSave: '★ Enregistrer la vue', mkSaveT: 'Enregistrer les filtres actuels comme vue rapide', mkRemove: 'Supprimer cette vue',
      mkCsvFile: 'marche', mkEmpty: 'Aucun résultat avec ces filtres.',
      fnIncVsExp: 'Recettes vs dépenses', fnVsPrev: (p) => 'vs ' + p, fnShare: 'du total', fnNew: 'nouveau',
      fnNet: 'Solde', fnCount: 'Transactions', fnByDay: 'Par jour', fnByCat: 'Par catégorie', fnAll: 'Toutes',
      fnSearch: 'Chercher un motif…', fnCsvFile: 'transactions', fnEmpty: 'Aucune transaction avec ces filtres.',
      formLow: 'forme basse', formHigh: 'forme optimale',
      setTitle: 'Réglages UI+', setTheme: 'Thème', setDark: 'Sombre', setLight: 'Clair', setAccent: 'Couleur d\'accent',
      setDensity: 'Densité', setComfortable: 'Confortable', setCompact: 'Compacte', setModules: 'Modules',
      setMenu: 'Menu latéral', setMenuFull: 'Complet', setMenuRail: 'Icônes seules', sideToggle: 'Afficher ou masquer cette section', modSidebar: 'Sections du menu repliables', modHome: "Tableau de bord de l'accueil", modAccount: 'Pages du compte, des options et des messages',
      setReset: 'Réinitialiser les réglages', setReload: 'Recharger pour appliquer', setLive: 'Les changements s\'appliquent tout de suite',
      modRoster: 'Tableau de bord des athlètes', modMarket: 'Tableau de bord du marché', modFinances: 'Tableau de bord des finances',
      modTransactions: 'Tableau de bord des transactions', modAthlete: 'Cartes et radar de la page athlète', modIcons: 'Icônes SVG et pictogrammes des épreuves',
      modRightCol: 'Formulaires de la colonne de droite', modTips: 'Introductions de page repliables', modBars: 'Barres de compétences colorées', modPalette: 'Palette de commandes (Ctrl+K)',
      failPanel: (n) => `UI+ n'a pas pu charger ce panneau (${n}). La page d'origine est affichée.`, failDetails: 'Détails dans la console',
      lgPos: 'Position', lgOf: (n) => `sur ${n}`, lgLeader: 'Écart avec le leader', lgPromo: 'Zone de promotion', lgReleg: 'Zone de relégation', lgAvg: 'Points par journée', lgForm: 'Forme', lgFormT: 'Moyenne de points sur les 3 dernières journées (▲▼ par rapport à la moyenne de la saison)', lgPromoZ: 'Promotion', lgRelegZ: 'Relégation', lgMissed: "N'a pas participé", lgAbove: 'points au-dessus de la ligne', lgBelow: 'points sous la ligne', lgNotRun: 'À disputer', calToday: "Aujourd'hui", calNext: 'Prochaine', modLeague: 'Classement de la ligue', modCalendar: 'Calendriers', modComp: 'Mise en avant dans les résultats des compétitions', modGlory: 'Moments de gloire et palmarès', modCharts: 'Graphiques de la ligue', modCompList: 'Recherche de compétitions en barre de filtres',
      modCoaches: 'Entraîneurs', tcNoCoach: "Pas d'entraîneur", tcCovered: (a, b) => `${a} sur ${b} avec entraîneur`, tcAvgT: 'Moyenne de vos athlètes dans ce groupe', tcFrom: (d) => `Athlètes de la page Entraînement (${d})`, tcVisit: "Ouvrez une fois la page Entraînement pour voir les athlètes de chaque entraîneur.", tcPerCoach: 'Athlètes par entraîneur', tcRoster: 'Ouvrez une fois la liste des Athlètes pour comparer les entraîneurs à vos groupes.',
    },
    de: {
      palette: 'Befehlspalette (Strg+K oder /)', toLight: 'Zum hellen Design wechseln', toDark: 'Zum dunklen Design wechseln',
      turnOff: 'Maxithlon UI+ ausschalten (zurück zur Originalseite)', turnOn: 'Maxithlon UI+ einschalten',
      grpMenu: 'Menü', grpTop: 'Obere Leiste', grpPage: 'Diese Seite',
      lightTheme: 'Helles Design', darkTheme: 'Dunkles Design', turnOffShort: 'UI+ ausschalten (Originalseite)',
      palPlaceholder: 'Gehe zu… (Athleten, Markt, Liga, Trainer…)',
      palNav: '↑↓ navigieren', palOpen: '↵ öffnen', palNewTab: 'Strg+↵ neuer Tab', palClose: 'Esc schließen',
      group: (n) => 'Gruppe ' + n, forSale: 'Zu verkaufen', injured: 'Verletzt',
      hasCoach: 'Hat einen Trainer', noCoach: 'Kein Trainer', trains: 'Trainiert diese Woche', noTrains: 'Trainiert diese Woche nicht',
      mDown: 'rot markiert / gesunken', mUp: 'gestiegen', mUpd: 'nach einem Rückgang gestiegen',
      athlete: 'Athlet', female: 'Weiblich', male: 'Männlich', badgeSale: '€ zu verkaufen', badgeInj: '✚ verletzt',
      colGroup: 'Gruppe', spec1: 'Sp1', spec2: 'Sp2', spec1T: '1. Spezialfähigkeit', spec2T: '2. Spezialfähigkeit',
      totalT: 'Summe der 8 Fähigkeiten (6 Basis + 2 Spezial)', colTrain: 'Training', colTrainT: 'Trainiert diese Woche?',
      colEv: 'Wettkämpfe', colEvT: 'Offizielle Wettkämpfe in den letzten 10 Wochen (≥5, um keine Fans zu verlieren)', colCoachT: 'Hat einen zugewiesenen Trainer?',
      fNoTrain: 'Kein Training', fRisk: 'Gefahr, Fans zu verlieren', fSale: 'Zu verkaufen', fInj: 'Verletzt', fNoCoach: 'Kein Trainer',
      csvName: 'Name', csvGroup: 'Gruppe', csvGender: 'Geschlecht', csvSpec1: 'Spez1', csvSpec1v: 'Spez1 Wert',
      csvSpec2: 'Spez2', csvSpec2v: 'Spez2 Wert', csvTotal: 'Summe', csvEv: 'Wettkämpfe/10', yes: 'Ja', no: 'Nein', csvFile: 'kader',
      clickFilter: 'Zum Filtern klicken',
      cAthletes: 'Athleten', cAthletesS: (s, y) => `${s} Senioren · ${y} Jugend`,
      cGender: 'Männer / Frauen', cGenderS: 'blau = M · rosa = W',
      cAge: 'Ø Alter', cAgeS: (v) => 'Jugend: ' + v, cMaxid: 'Ø MAXID', cMaxidS: (v) => 'bester: ' + v,
      cNoTrain: 'Kein Training', cNoTrainS: 'diese Woche', cRisk: 'Fan-Risiko', cRiskS: '< 5 Wettkämpfe in 10 Wo.',
      cInj: 'Verletzt', cInjS: 'Details ansehen', cInjOk: 'alle fit', cSale: 'Zu verkaufen', cNoCoach: 'Kein Trainer',
      search: 'Athlet oder Land suchen…', all: 'Alle', both: 'Beide', maleChip: '♂ Männer', femaleChip: '♀ Frauen',
      heatT: 'Heatmap auf den Fähigkeiten', heatOn: '▦ Heatmap: an', heatOff: '▢ Heatmap: aus',
      csvT: 'Aktuelle Ansicht als CSV exportieren (öffnet in Excel)',
      origT: 'Originaltabellen der Seite ein-/ausblenden', origShow: 'Original zeigen', origHide: 'Original ausblenden',
      lgBold: 'fett', lgTop: 'hervorgehoben', lgOutline: 'Rahmen: ', lgDown: 'rot gesunken', lgUp: 'grün gestiegen', lgUpd: 'blau nach Rückgang gestiegen',
      lgHelp: 'Zum Sortieren auf eine Spalte klicken · Strg+K zum Navigieren', empty: 'Keine Athleten mit diesen Filtern.',
      radar: 'Fähigkeiten-Radar', profile: 'Fähigkeitsprofil', avgOf: (g, n) => `Kaderdurchschnitt: ${g} (${n})`,
      openRoster: 'öffne die Athletenliste, um mit deinem Kader zu vergleichen',
      tTotal: 'Σ Fähigkeiten', tTotalVs: (d) => d + ' vs Durchschnitt', tTotalS: '8 Fähigkeiten', tSpec: 'Spezialisierung',
      tBest: 'Stärke', tWeak: 'Schwäche', q4: 'hervorragend', q3: 'gut', q2: 'schwach', q1: 'sehr schwach',
      tipMore: 'Mehr', tipLess: 'Weniger', tipT: 'Seitenerklärung ein- oder ausblenden',
      mkResults: 'Ergebnisse', mkResultsS: (n, tot) => `${n} auf dieser Seite · ${tot} insgesamt`,
      mkCheapest: 'Am günstigsten', mkAvgPrice: 'Durchschnittspreis', mkBestValue: 'Bester Wert', mkBestValueS: '€ pro MAXID-Punkt',
      mkEnding: 'Endet zuerst', mkFits: 'Passt zum Kader', mkFitsS: 'über deinem Gruppendurchschnitt',
      mkNoRoster: 'öffne deine Athletenliste zum Vergleichen', mkPrice: 'Preis', mkPerMaxid: '€/MAXID', mkPerMaxidT: 'Preis pro MAXID-Punkt (niedriger = besserer Wert)',
      mkLeft: 'Restzeit', mkLeftT: 'Zeit bis zur Frist (Serverzeit)', mkEnded: 'beendet',
      mkFit: 'vs Kader', mkFitT: 'Summe der 8 Fähigkeiten im Vergleich zum Kaderdurchschnitt derselben Gruppe',
      mkFitTip: (s, g, a, n) => `Σ ${s} vs Durchschnitt deiner ${g} ${a} (${n} Athleten)`,
      mkSearch: 'Athlet oder Land suchen…', mkPageNote: 'Sortierung und Filter gelten für die Ergebnisse auf dieser Seite.',
      mkSave: '★ Ansicht speichern', mkSaveT: 'Aktuelle Filter als Schnellansicht speichern', mkRemove: 'Diese Ansicht entfernen',
      mkCsvFile: 'markt', mkEmpty: 'Keine Ergebnisse mit diesen Filtern.',
      fnIncVsExp: 'Einnahmen vs Ausgaben', fnVsPrev: (p) => 'vs ' + p, fnShare: 'vom Gesamtbetrag', fnNew: 'neu',
      fnNet: 'Saldo', fnCount: 'Transaktionen', fnByDay: 'Pro Tag', fnByCat: 'Nach Kategorie', fnAll: 'Alle',
      fnSearch: 'Grund suchen…', fnCsvFile: 'transaktionen', fnEmpty: 'Keine Transaktionen mit diesen Filtern.',
      formLow: 'schwache Form', formHigh: 'Topform',
      setTitle: 'UI+-Einstellungen', setTheme: 'Design', setDark: 'Dunkel', setLight: 'Hell', setAccent: 'Akzentfarbe',
      setDensity: 'Dichte', setComfortable: 'Bequem', setCompact: 'Kompakt', setModules: 'Module',
      setMenu: 'Seitenmenü', setMenuFull: 'Vollständig', setMenuRail: 'Nur Symbole', sideToggle: 'Diesen Bereich ein- oder ausblenden', modSidebar: 'Einklappbare Menübereiche', modHome: 'Startseiten-Dashboard', modAccount: 'Konto-, Optionen- und Nachrichtenseiten',
      setReset: 'Einstellungen zurücksetzen', setReload: 'Neu laden zum Anwenden', setLive: 'Änderungen gelten sofort',
      modRoster: 'Athletenlisten-Dashboard', modMarket: 'Markt-Dashboard', modFinances: 'Finanz-Dashboard',
      modTransactions: 'Transaktionen-Dashboard', modAthlete: 'Karten und Radar der Athletenseite', modIcons: 'SVG-Symbole und Disziplin-Piktogramme',
      modRightCol: 'Formulare der rechten Spalte', modTips: 'Einklappbare Seitenerklärungen', modBars: 'Farbige Fähigkeitsbalken', modPalette: 'Befehlspalette (Strg+K)',
      failPanel: (n) => `UI+ konnte dieses Panel nicht laden (${n}). Die Originalseite wird angezeigt.`, failDetails: 'Details in der Konsole',
      lgPos: 'Platz', lgOf: (n) => `von ${n}`, lgLeader: 'Rückstand auf Platz 1', lgPromo: 'Aufstiegszone', lgReleg: 'Abstiegszone', lgAvg: 'Punkte pro Spieltag', lgForm: 'Form', lgFormT: 'Durchschnittspunkte der letzten 3 Spieltage (▲▼ gegenüber dem Saisonschnitt)', lgPromoZ: 'Aufstieg', lgRelegZ: 'Abstieg', lgMissed: 'Nicht teilgenommen', lgAbove: 'Punkte über der Linie', lgBelow: 'Punkte unter der Linie', lgNotRun: 'Noch auszutragen', calToday: 'Heute', calNext: 'Nächster', modLeague: 'Ligatabelle', modCalendar: 'Kalender', modComp: 'Hervorhebungen in Wettkampfergebnissen', modGlory: 'Glanzmomente und Ehrentafel', modCharts: 'Ligadiagramme', modCompList: 'Wettkampfsuche als Filterleiste',
      modCoaches: 'Trainer', tcNoCoach: 'Kein Trainer', tcCovered: (a, b) => `${a} von ${b} mit Trainer`, tcAvgT: 'Durchschnitt deiner Athleten in dieser Gruppe', tcFrom: (d) => `Athleten von der Trainingsseite (${d})`, tcVisit: 'Öffne einmal die Trainingsseite, um die Athleten jedes Trainers zu sehen.', tcPerCoach: 'Athleten pro Trainer', tcRoster: 'Öffne einmal die Athletenliste, um die Trainer mit deinen Gruppen zu vergleichen.',
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
html.mx #left_section{flex:0 0 212px;width:212px!important;float:none!important;position:static;height:auto!important;max-height:none!important;overflow:visible!important;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 8px;box-sizing:border-box;box-shadow:var(--shadow);scrollbar-width:thin;}
html.mx #middle_section{flex:1 1 0;width:auto!important;min-width:0;float:none!important;margin:0!important;}
html.mx #right_section,html.mx #right_part{flex:0 0 262px;width:262px!important;float:none!important;margin:0!important;}
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
html.mx #right_section h2,html.mx #right_section h3,html.mx #right_part h2,html.mx #right_part h3{font-family:var(--font)!important;background-image:none!important;color:var(--text)!important;font-size:14px!important;font-weight:700!important;padding:0 0 10px!important;margin:0!important;height:auto!important;width:auto!important;float:none!important;}
html.mx #right_section > div,html.mx #right_part > div{background:var(--surface)!important;background-image:none!important;border:1px solid var(--border);border-radius:var(--radius);margin:0 0 14px!important;padding:12px 14px!important;box-shadow:var(--shadow);width:auto!important;height:auto!important;float:none!important;box-sizing:border-box;display:flow-root;}
html.mx #right_section > div *,html.mx #right_part > div *{background-image:none;}
html.mx #right_section ul,html.mx #right_part ul{padding:0!important;margin:0!important;}
html.mx #right_section p,html.mx #right_part p{margin:0 0 8px!important;padding:0!important;color:var(--muted)!important;font-size:12px!important;line-height:1.45!important;}
html.mx #right_section form,html.mx #right_part form{margin:0 0 10px!important;padding:0!important;float:none!important;width:auto!important;}
html.mx #right_section .coach h4,html.mx #right_part .coach h4{margin:12px 0 8px!important;padding:0!important;font:600 13.5px/1.3 var(--font)!important;background:none!important;float:none!important;}
html.mx #right_section .coach h4 a,html.mx #right_part .coach h4 a{font:inherit!important;}
.mx-plan{clear:both;display:grid;grid-template-columns:auto 1fr auto;gap:7px 10px;align-items:center;font:12.5px/1.2 var(--font);color:var(--text);}
.mx-plan .cap{grid-column:1/-1;color:var(--muted);font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
.mx-plan .val{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;}
.mx-plan .mx-bar{display:block;width:auto;height:6px;}
.mx-plan .tot{color:var(--muted);border-top:1px solid var(--border);padding-top:7px;}
.mx-plan .tot.val{color:var(--text);}
.mx-plan .tot.bad{color:var(--bad);}
html.mx .user_tip{background:var(--surface)!important;background-image:none!important;border:1px solid var(--border)!important;border-radius:var(--radius);padding:12px 16px!important;color:var(--muted)!important;margin-bottom:14px;}
html.mx .user_tip img{display:none;}

/* ---------- page intro text (collapsible) ---------- */
html.mx .mx-tip{display:flex;align-items:flex-start;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;margin:0 0 14px;color:var(--muted);font:12.5px/1.5 var(--font);box-sizing:border-box;}
html.mx .mx-tip > .mx-ic{color:var(--accent);margin-top:1px;}
html.mx .mx-tip .user_tip{background:none!important;border:0!important;border-radius:0;padding:0!important;margin:0!important;flex:1 1 auto;min-width:0;color:inherit!important;font:inherit!important;}
html.mx .mx-tip:not(.open) .user_tip{display:-webkit-box!important;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
html.mx .mx-tip:not(.open):not(.short){cursor:pointer;}
.mx-tip-btn{all:unset;cursor:pointer;color:var(--accent);font:600 12px/1.6 var(--font);white-space:nowrap;}
.mx-tip-btn:hover{text-decoration:underline;}
html.mx .mx-tip.short .mx-tip-btn{display:none;}

/* ---------- footer ---------- */
html.mx #footer{clear:both;width:min(1500px,96vw)!important;margin:28px auto 0!important;padding:0 0 76px!important;background:none!important;background-image:none!important;border:0!important;height:auto!important;float:none!important;color:var(--muted);}
html.mx #footer .wrapper{width:auto!important;margin:0!important;display:grid!important;grid-template-columns:repeat(3,minmax(120px,1fr)) minmax(260px,2fr);gap:24px;padding:22px 24px!important;background:var(--surface)!important;background-image:none!important;border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);box-sizing:border-box;height:auto!important;float:none!important;}
html.mx #footer .cols{width:auto!important;float:none!important;margin:0!important;padding:0!important;height:auto!important;background:none!important;border:0!important;}
html.mx #footer h3{font:600 11px/1.2 var(--font)!important;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)!important;margin:0 0 10px!important;padding:0!important;background:none!important;height:auto!important;}
html.mx #footer h4{display:none!important;}
html.mx #footer ul{list-style:none!important;margin:0!important;padding:0!important;background:none!important;}
html.mx #footer li{background:none!important;background-image:none!important;padding:3px 0!important;margin:0!important;float:none!important;border:0!important;color:var(--muted)!important;font-size:12.5px!important;width:auto!important;height:auto!important;display:block!important;}
html.mx #footer a{color:var(--text)!important;text-decoration:none!important;background:none!important;}
html.mx #footer a:hover{color:var(--accent)!important;}
html.mx #footer .space_none ul{display:flex!important;flex-wrap:wrap;gap:2px 16px;}
html.mx #footer .space_none li,html.mx #footer .space_none a{color:var(--muted)!important;font-size:12px!important;}
html.mx #footer .space_none li:first-child{flex:1 1 100%;}

/* ---------- tabs (page_bar) ---------- */
html.mx .page_bar{background:none!important;border:0!important;margin:0 0 14px!important;height:auto!important;}
html.mx .page_bar ul{display:flex!important;flex-wrap:wrap;gap:6px;background:none!important;padding:0!important;margin:0!important;height:auto!important;width:auto!important;}
html.mx .page_bar li{float:none!important;background:none!important;margin:0!important;padding:0!important;width:auto!important;height:auto!important;border:0!important;}
html.mx .page_bar li a{display:block;padding:7px 14px!important;border-radius:999px;background:var(--surface)!important;border:1px solid var(--border)!important;color:var(--text)!important;
  text-decoration:none!important;font-size:12.5px!important;height:auto!important;line-height:1.3!important;border-image:none!important;box-shadow:none!important;background-image:none!important;}
html.mx .page_bar *{box-shadow:none!important;}
html.mx .page_bar li a:hover{border-color:var(--accent)!important;}
html.mx .page_bar li a.mx-current{background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;}
/* secondary tabs (league pages): a segmented control */
html.mx .page_bar_main,html.mx .page_bar_youth{background:none!important;border:0!important;margin:0 0 14px!important;height:auto!important;text-align:left!important;}
html.mx .page_bar_main ul,html.mx .page_bar_youth ul{display:inline-flex!important;gap:2px;padding:3px!important;margin:0!important;background:var(--surface2)!important;border:1px solid var(--border);border-radius:10px;width:auto!important;height:auto!important;}
html.mx .page_bar_main li,html.mx .page_bar_youth li{float:none!important;background:none!important;margin:0!important;padding:0!important;width:auto!important;height:auto!important;border:0!important;box-shadow:none!important;}
html.mx .page_bar_main li a,html.mx .page_bar_youth li a{display:block;padding:5px 12px!important;border-radius:7px;background:none!important;border:0!important;color:var(--muted)!important;text-decoration:none!important;font:600 12.5px/1.3 var(--font)!important;height:auto!important;box-shadow:none!important;background-image:none!important;}
html.mx .page_bar_main li a:hover,html.mx .page_bar_youth li a:hover{color:var(--text)!important;}
html.mx .page_bar_main li a.mx-current,html.mx .page_bar_youth li a.mx-current{background:var(--surface)!important;color:var(--text)!important;box-shadow:0 1px 2px rgba(0,0,0,.12)!important;}

/* ---------- generic tables ---------- */
html.mx #middle_section table{border-collapse:collapse;}
html.mx #middle_section table th,html.mx #middle_section table thead td{background:var(--surface2)!important;background-image:none!important;color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;
  text-transform:uppercase;letter-spacing:.04em;padding:8px 6px!important;border:0!important;border-bottom:1px solid var(--border)!important;}
html.mx #middle_section table td{border-color:var(--border)!important;}
html.mx #middle_section table.tablesorter_all,html.mx #middle_section table.tablesorter{background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:var(--shadow);}
html.mx #middle_section table.tablesorter_all td,html.mx #middle_section table.tablesorter td{padding:6px!important;background:transparent!important;}
html.mx #middle_section table.tablesorter_all tbody tr:hover td,html.mx #middle_section table.tablesorter tbody tr:hover td{background:var(--surface3)!important;}
html.mx input[type=text]:not(.colorwell),html.mx input[type=number],html.mx input:not([type]),html.mx input[type=password],html.mx input[type=email],html.mx input[type=url],html.mx input[type=search],html.mx input[type=tel],html.mx select,html.mx textarea{background:var(--surface2)!important;color:var(--text)!important;border:1px solid var(--border)!important;border-radius:8px;padding:5px 8px;}
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
/* ---------- settings panel ---------- */
.mx-set{width:min(480px,92vw);color:var(--text);}
.mx-set-h{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--border);}
.mx-set-h > span{display:inline-flex;align-items:center;gap:8px;font:700 15px/1.2 var(--font);}
.mx-set-x,.mx-notice-x{all:unset;cursor:pointer;font-size:20px;line-height:1;color:var(--muted);padding:0 4px;}
.mx-set-x:hover,.mx-notice-x:hover{color:var(--text);}
.mx-set-body{padding:6px 18px 12px;max-height:62vh;overflow:auto;}
.mx-set-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border);}
.mx-set-row .l{font-size:13.5px;font-weight:600;}
.mx-set .hint{font-size:11.5px;color:var(--muted);}
.mx-set-sub{font:600 11px/1.2 var(--font);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:14px 0 6px;}
.mx-set-mod{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:13px;cursor:pointer;}
.mx-set-mod input{accent-color:var(--accent);width:16px!important;height:16px!important;margin:0!important;padding:0!important;appearance:auto!important;-webkit-appearance:checkbox!important;display:inline-block!important;opacity:1!important;position:static!important;flex:0 0 16px;}
.mx-set-f{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 18px;border-top:1px solid var(--border);}
.mx-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;}
.mx-seg{display:inline-flex;padding:3px;border-radius:10px;background:var(--surface3);gap:2px;}
.mx-seg .mx-seg-b{all:unset;cursor:pointer;padding:5px 12px;border-radius:8px;font-size:12.5px;color:var(--muted);}
.mx-seg .mx-seg-b.on{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.2);}
.mx-swatches{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;}
.mx-swatches .mx-sw{all:unset;cursor:pointer;width:22px;height:22px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(0,0,0,.12);}
.mx-swatches .mx-sw.on{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--text);}

/* ---------- module failure notice ---------- */
.mx-notice{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:8px 0 14px;padding:10px 14px;border-radius:12px;border:1px solid rgba(227,179,65,.45);background:rgba(227,179,65,.1);color:var(--text);font:13px/1.4 var(--font);}
.mx-notice > svg{color:var(--warn);}
.mx-notice > span{flex:1 1 220px;}

/* ---------- compact density ---------- */
html.mx-compact body{font-size:12.5px;}
html.mx-compact table.mx-table td{padding:3px 4px!important;}
html.mx-compact table.mx-table th{padding:6px 4px!important;}
html.mx-compact .mxr-sk{padding:1px 0;}
html.mx-compact .mx-tiles{gap:8px;margin-bottom:10px;}
html.mx-compact .mx-tile{padding:8px 11px;}
html.mx-compact .mx-tile .v{font-size:19px;}
html.mx-compact .mx-card{padding:11px 14px!important;margin-bottom:11px!important;}
html.mx-compact .mxr-tools{gap:6px;margin-bottom:7px;}
html.mx-compact .mx-chip{padding:4px 10px;}
html.mx-compact .mxf-item{padding:3px 0;}
html.mx-compact #middle_section table.results td,html.mx-compact #middle_section table.man_details td,html.mx-compact #middle_section table.tablesorter td{padding:4px 6px!important;}

.mx-pal .mx-pal-foot{padding:8px 14px;border-top:1px solid var(--border);color:var(--muted);font-size:12px;display:flex;gap:14px;}

/* ==================================================================
 * Design system: shared components. Page modules build their UI from
 * these instead of defining their own look.
 *   .mx-card / .mx-card-t   surface card and its section title row
 *                           (title on the left, optional aside on the right)
 *   .mx-tiles / .mx-tile    stat tiles: .k label, .v value, .s sub-text;
 *                           modifiers .good .warn .bad, .click (filters)
 *   .mx-table-wrap/.mx-table  data table: sticky header, row hover,
 *                           th.sorted, .l (left) and .sep (column divider)
 *   .mx-chip                filter chip, .on when active
 *   .mx-badge               small status label: .good .bad .warn .info, .pill
 *   .mx-btn                 secondary button (native submit = primary)
 *   .mx-empty-state         placeholder when a list is empty
 *   .mx-form-row            puts form controls on one line
 * Native inputs, selects and buttons are themed globally (see "buttons").
 * ================================================================== */
.mx-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:10px;margin-bottom:14px;}
.mx-tile{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px 14px;box-shadow:var(--shadow);cursor:default;position:relative;overflow:hidden;min-width:0;font-family:var(--font);color:var(--text);}
.mx-tile.click{cursor:pointer;}
.mx-tile.click:hover{border-color:var(--accent);}
.mx-tile .k{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);}
.mx-tile .v{font-size:24px;font-weight:700;margin-top:4px;letter-spacing:-.02em;line-height:1.15;}
.mx-tile .s{font-size:12px;color:var(--muted);margin-top:2px;}
.mx-tile.warn .v{color:var(--warn);} .mx-tile.bad .v{color:var(--bad);} .mx-tile.good .v{color:var(--good);}
.mx-tile .bar{display:flex;height:5px;border-radius:9px;overflow:hidden;margin-top:8px;background:var(--surface3);}
.mx-card .mx-tile,.mxa .mx-tile{background:var(--surface2);box-shadow:none;border-radius:10px;padding:9px 11px;}
.mx-card .mx-tile .v,.mxa .mx-tile .v{font-size:20px;margin-top:2px;}
.mx-chip{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12.5px;display:inline-flex;gap:6px;align-items:center;}
.mx-chip:hover{border-color:var(--accent);}
.mx-chip.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.mx-chip .n{opacity:.7;font-size:11px;}
.mx-chip .dot{width:8px;height:8px;border-radius:50%;}
.mx-badge{display:inline-block;font-size:10.5px;padding:1px 6px;border-radius:6px;font-weight:600;line-height:1.5;white-space:nowrap;background:var(--surface3);color:var(--muted);}
.mx-badge.pill{font-size:11.5px;padding:2px 7px;border-radius:999px;font-weight:500;font-variant-numeric:tabular-nums;}
.mx-badge.good{background:rgba(63,185,80,.16);color:var(--good);}
.mx-badge.bad{background:rgba(248,81,73,.16);color:var(--bad);}
.mx-badge.warn{background:rgba(227,179,65,.18);color:var(--warn);}
.mx-badge.info{background:var(--accent-soft);color:var(--accent);}
.mx-btn{all:unset;cursor:pointer;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12.5px;}
.mx-btn:hover{border-color:var(--accent);}
.mx-table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);overflow:auto;max-height:78vh;}
table.mx-table{width:100%;border-collapse:separate!important;border-spacing:0;font-size:12.5px;background:transparent!important;box-shadow:none!important;}
table.mx-table th{position:sticky;top:0;z-index:2;background:var(--surface2)!important;color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.04em;
  padding:9px 4px!important;text-align:center;user-select:none;white-space:nowrap;border-bottom:1px solid var(--border)!important;}
table.mx-table.sortable th{cursor:pointer;}
table.mx-table th.l,table.mx-table td.l{text-align:left;}
table.mx-table th:hover{color:var(--text)!important;}
table.mx-table th.sorted{color:var(--accent)!important;}
table.mx-table th.sep,table.mx-table td.sep{border-left:1px solid var(--border)!important;}
table.mx-table td{padding:6px 4px!important;text-align:center;border-bottom:1px solid var(--border)!important;white-space:nowrap;background:transparent!important;color:var(--text);}
table.mx-table tbody tr:hover td{background:var(--surface3)!important;}
.mx-empty-state{padding:30px;text-align:center;color:var(--muted);}
.mx-form-row{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap;}
.mx-form-row > input[type=text],.mx-form-row > input:not([type]),.mx-form-row > select{flex:1 1 80px;min-width:0;width:auto!important;}

/* ---------- roster ---------- */
.mxr{font-family:var(--font);color:var(--text);margin-bottom:18px;}
.mxr-bar-m{background:var(--male);} .mxr-bar-f{background:var(--female);}
.mxr-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px;}
.mxr-search{flex:1 1 200px;min-width:160px;}
.mxr-search input{width:100%!important;box-sizing:border-box;padding:8px 12px!important;border-radius:999px!important;font-size:13px!important;}
table.mx-table tr.inj td{box-shadow:inset 0 0 0 9999px rgba(248,81,73,.06);}
.mxr-name{display:flex;align-items:center;gap:7px;}
.mxr-name a{color:var(--text)!important;text-decoration:none!important;font-weight:600;}
.mxr-name a:hover{color:var(--accent)!important;}
.mxr-name img{width:16px;height:11px;border-radius:2px;object-fit:cover;}
.mxr-g{width:7px;height:7px;border-radius:50%;flex:0 0 7px;}
.mxr-g.M{background:var(--male);} .mxr-g.F{background:var(--female);} .mxr-g.\\?{background:var(--muted);}
.mxr-grp{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;}
.mxr-sk{display:inline-block;min-width:24px;padding:3px 0;border-radius:6px;font-variant-numeric:tabular-nums;}
.mxr-sk.b{font-weight:700;}
.mxr-sk.top{font-weight:800;color:#fff;}
html.mx-light .mxr-sk.top{color:#0b3d17;}
.mxr-sk.down{outline:1.5px solid var(--bad);outline-offset:-1.5px;}
.mxr-sk.up{outline:1.5px solid var(--good);outline-offset:-1.5px;}
.mxr-sk.upd{outline:1.5px solid #58a6ff;outline-offset:-1.5px;}
.mxr-sk.low{color:var(--bad)!important;font-weight:800;}
.mxr-sk.high{color:var(--good)!important;font-weight:800;}
.mxr-meter{display:flex;align-items:center;gap:6px;justify-content:flex-end;}
.mxr-meter i{display:block;height:5px;border-radius:9px;background:var(--accent);opacity:.85;}
.mxr-meter span{min-width:34px;text-align:right;font-variant-numeric:tabular-nums;}
.mxr-ok{color:var(--good);font-weight:700;} .mxr-no{color:var(--bad);font-weight:700;cursor:help;}
.mxr-legend{display:flex;flex-wrap:wrap;gap:14px;color:var(--muted);font-size:11.5px;margin-top:10px;align-items:center;}
.mxr-legend .sw{display:inline-block;width:46px;height:8px;border-radius:9px;vertical-align:middle;margin:0 4px;}
.mx-hide-orig > table[id^="atleti"],.mx-hide-orig > table[id^="atleti"] + br{display:none!important;}

/* ---------- market ---------- */
.mx-hide-orig-mk > table.results{display:none!important;}
.mxm .mx-tile.on{border-color:var(--accent);}
.mxm-num{font-variant-numeric:tabular-nums;}
.mxm-dim{color:var(--muted);}
.mxm-views:empty{display:none;}
.mxm-view{padding:0;gap:0;overflow:hidden;}
.mxm-view > span:first-child{padding:6px 4px 6px 12px;}
.mxm-view .x{padding:6px 10px 6px 6px;opacity:.6;}
.mxm-view .x:hover{opacity:1;}
html.mx table.mx-pager{margin:10px 0!important;}
html.mx table.mx-pager td{border:0!important;background:transparent!important;}
html.mx table.mx-pager a{display:inline-block;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text)!important;text-decoration:none!important;font-size:12.5px;}
html.mx table.mx-pager a:hover{border-color:var(--accent);}

/* ---------- finances ---------- */
.mx-hide-orig-fin > table.tablesorter,.mx-hide-orig-fin > .mxf-fact,.mx-hide-orig-fin > br{display:none!important;}
.mxf .mx-tile .v{font-size:21px;}
.mxf .inc{background:var(--good);color:var(--good);} .mxf .exp{background:var(--bad);color:var(--bad);}
.mxf b.inc,.mxf b.exp,.mxf .mxf-amt{background:none!important;}
.mxf-key{display:inline-flex;align-items:center;gap:6px;}
.mxf-key i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-left:8px;}
.mxf-cmp-row{display:grid;grid-template-columns:minmax(150px,220px) 1fr 1fr;gap:14px;align-items:center;padding:7px 0;border-top:1px solid var(--border);}
.mxf-cmp-row:first-of-type{border-top:0;}
.mxf-cmp-t{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:12.5px;}
.mxf-cmp-t .mx-badge{align-self:flex-start;}
.mxf-bar{display:flex;align-items:center;gap:8px;min-width:0;}
.mxf-bar i{display:block;height:12px;border-radius:6px;min-width:2px;opacity:.85;}
.mxf-bar span{font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--text);}
.mxf-sides{display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.mxf-side-t{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding-bottom:6px;border-bottom:1px solid var(--border);margin-bottom:6px;}
.mxf-side-t b{font-size:14px;letter-spacing:0;}
.mxf-item{padding:5px 0;}
.mxf-item-l{display:flex;align-items:center;gap:6px;font-size:12.5px;}
.mxf-item-l > span:first-child{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mxf-item-l b{font-variant-numeric:tabular-nums;white-space:nowrap;}
.mxf-track{height:5px;border-radius:9px;background:var(--surface3);margin-top:4px;overflow:hidden;}
.mxf-track i{display:block;height:100%;border-radius:9px;opacity:.8;}
.mxf-d{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap;}
.mxf-d.up{color:var(--good);} .mxf-d.down{color:var(--bad);}
.mxf-vs{font-size:11.5px;color:var(--muted);margin-right:8px;}
.mxf-days-wrap{overflow-x:auto;}
svg.mxf-days{width:100%;min-width:320px;height:auto;max-height:220px;display:block;}
svg.mxf-days .axis{stroke:var(--border);}
svg.mxf-days rect.inc{fill:var(--good);opacity:.85;} svg.mxf-days rect.exp{fill:var(--bad);opacity:.85;}
svg.mxf-days g:hover rect{opacity:1;}
svg.mxf-days text{fill:var(--muted);font:10px var(--font);}
@media (max-width:900px){.mxf-sides{grid-template-columns:1fr;}.mxf-cmp-row{grid-template-columns:1fr;}}

/* ---------- legacy data tables (market stats, transfers, finances…) ---------- */
html.mx #middle_section table.results,html.mx #middle_section table.man_details{width:100%!important;background:var(--surface)!important;border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:var(--shadow);border-collapse:separate!important;border-spacing:0;margin:6px 0 16px;}
html.mx #middle_section table.results td,html.mx #middle_section table.man_details td{padding:7px 8px!important;background:transparent!important;border:0!important;border-bottom:1px solid var(--border)!important;color:var(--text);}
html.mx #middle_section table.results tr:last-child td,html.mx #middle_section table.man_details tr:last-child td{border-bottom:0!important;}
html.mx #middle_section table.results tbody tr:hover td,html.mx #middle_section table.man_details tr:hover td{background:var(--surface3)!important;}
html.mx #middle_section table.results th{white-space:nowrap;}
html.mx #middle_section table.results tfoot{display:none;}
html.mx #middle_section table.results td,html.mx #middle_section table.man_details td{font-variant-numeric:tabular-nums;}

/* ---------- athlete page ---------- */
.mxa{display:grid;grid-template-columns:minmax(260px,330px) 1fr;gap:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin:6px 0 16px;box-shadow:var(--shadow);font-family:var(--font);color:var(--text);}
.mxa > .mx-card-t{grid-column:1/-1;margin:0;}
.mxa > .mx-tiles{grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;align-content:start;margin:0;}
.mxa svg{width:100%;height:auto;}
.mxa-leg{display:flex;gap:14px;font-size:11.5px;color:var(--muted);margin-top:4px;justify-content:center;}
.mxa-leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px;}
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
/* ---------- top bar: icons on a single row ---------- */
html.mx #header .top_menu ul{display:flex!important;flex-wrap:nowrap!important;align-items:center;gap:2px;margin:0!important;padding:0!important;width:auto!important;height:auto!important;background:none!important;list-style:none!important;float:none!important;}
html.mx #header .top_menu li{float:none!important;display:block!important;margin:0!important;padding:0!important;width:auto!important;height:auto!important;background:none!important;list-style:none!important;}
html.mx #header .right_details{min-width:0;}
html.mx #header .right_details > :not(.top_menu){white-space:nowrap;}

/* ---------- buttons ---------- */
html.mx input[type=submit],html.mx input[type=button],html.mx button:not([class*="mx-"]):not(#admin_hamburger_menu){box-shadow:none!important;outline:none;font:600 12.5px/1.2 var(--font)!important;padding:8px 14px!important;border-radius:9px!important;transition:filter .15s,transform .05s;}
html.mx input[type=submit]:hover,html.mx input[type=button]:hover,html.mx button:not([class*="mx-"]):not(#admin_hamburger_menu):hover{filter:brightness(1.08);}
html.mx input[type=submit]:active,html.mx input[type=button]:active,html.mx button:not([class*="mx-"]):not(#admin_hamburger_menu):active{transform:translateY(1px);}
html.mx input[type=submit]:focus-visible,html.mx input[type=button]:focus-visible,html.mx button:focus-visible{outline:2px solid var(--accent)!important;outline-offset:2px;}
html.mx input[type=text],html.mx input[type=number],html.mx input:not([type]),html.mx input[type=password],html.mx input[type=email],html.mx input[type=url],html.mx input[type=search],html.mx input[type=tel],html.mx select,html.mx textarea{box-shadow:none!important;outline:none;padding:7px 10px!important;border-radius:9px!important;font:13px var(--font)!important;}
html.mx input[type=text]:focus,html.mx input[type=number]:focus,html.mx input[type=password]:focus,html.mx input[type=email]:focus,html.mx input:not([type]):focus,html.mx select:focus,html.mx textarea:focus{border-color:var(--accent)!important;box-shadow:0 0 0 3px var(--accent-soft)!important;}
html.mx .mx-athlete .head_section button.bookmark-action:not(#admin_hamburger_menu){background:var(--accent-soft)!important;color:var(--accent)!important;padding:7px 9px!important;}
html.mx button.bookmark-action img{display:none;}

/* ---------- cards ---------- */
html.mx .mx-card{display:block;background:var(--surface)!important;border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px 18px!important;margin:0 0 16px!important;width:auto!important;height:auto!important;float:none!important;box-sizing:border-box;display:flow-root;}
html.mx .mx-card *{float:none;}
html.mx .mx-card-t{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 12px;font:700 12px/1.2 var(--font);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);}
html.mx .mx-card-t .mx-card-a{font:500 12px/1.2 var(--font);text-transform:none;letter-spacing:0;}

/* ---------- athlete: title ---------- */
html.mx .mx-athlete .head_section{background:none!important;border:0!important;margin:2px 0 14px!important;padding:0!important;height:auto!important;}
html.mx .mx-athlete .head_section h2{display:flex!important;align-items:center;gap:10px;font:700 26px/1.2 var(--font)!important;letter-spacing:-.01em;color:var(--text)!important;margin:0!important;padding:0!important;border:0!important;background:none!important;height:auto!important;}
html.mx .mx-athlete .head_section h2 > a{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:var(--surface);border:1px solid var(--border);}
html.mx .mx-athlete .head_section h2 > a:hover{border-color:var(--accent);}
html.mx .mx-athlete .head_section h2 > a .mx-ic{color:var(--muted);}
html.mx .mx-athlete .head_section h2 > a:hover .mx-ic{color:var(--accent);}
html.mx .mx-athlete .head_section .id{font:500 12px var(--font)!important;color:var(--muted)!important;background:var(--surface2);border:1px solid var(--border);padding:3px 8px;border-radius:999px;}
html.mx .mx-athlete .head_section .bookmark{margin-left:auto;float:none!important;position:static!important;}

/* ---------- athlete: profile ---------- */
html.mx .mx-hero{display:grid!important;grid-template-columns:auto 1fr;gap:20px;align-items:start;}
html.mx .mx-hero .face_area{width:auto!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;background:none!important;}
html.mx .mx-hero .face_area img{display:block;width:120px!important;height:auto!important;border-radius:14px;border:1px solid var(--border)!important;background:var(--surface2);padding:0!important;box-shadow:none!important;}
html.mx .mx-hero .text_area{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;width:auto!important;margin:0!important;padding:0!important;background:none!important;}
html.mx .mx-hero .row01{grid-column:1/-1;display:flex!important;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 4px!important;padding:0!important;background:none!important;width:auto!important;height:auto!important;}
html.mx .mx-hero .row01 > a:first-child img{width:20px;height:auto;border-radius:3px;}
html.mx .mx-hero .row01 > a{font-weight:600;color:var(--text)!important;margin-right:10px;}
html.mx .mx-hero .row01 > span{color:var(--muted)!important;font-size:12px!important;font-weight:500!important;}
html.mx .mx-hero .row01 > strong{color:var(--text)!important;font-size:15px!important;margin-right:14px;font-variant-numeric:tabular-nums;}
html.mx .mx-hero .row02{display:contents!important;}
html.mx .mx-hero .row02 > div{display:flex!important;flex-direction:column;gap:3px;min-width:0;width:auto!important;height:auto!important;margin:0!important;padding:9px 12px!important;border-radius:10px;background:var(--surface2)!important;border:1px solid var(--border);}
html.mx .mx-hero .row02 > div > span:first-child{color:var(--muted)!important;font:600 10.5px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.06em;}
html.mx .mx-hero .row02 > div > :not(span:first-child),html.mx .mx-hero .row02 > div > * strong,html.mx .mx-hero .row02 > div a{color:var(--text)!important;font-size:13.5px!important;font-weight:600!important;white-space:normal;}
html.mx .mx-hero .row02 > div > span:first-child{width:auto!important;overflow:visible!important;white-space:nowrap;}
html.mx .mx-hero .row02 > div.mx-empty > strong{color:var(--muted)!important;}
html.mx .mx-hero .row02 > div a:hover,html.mx .mx-hero .row02 > div a:hover strong{color:var(--accent)!important;}
html.mx .mx-hero .row02 > div small{color:var(--muted)!important;font-weight:500;font-size:11.5px;}

/* ---------- athlete: skills ---------- */
html.mx .mx-skills > .main_row{display:grid!important;grid-template-columns:1fr 1fr;gap:4px 36px;width:auto!important;height:auto!important;margin:0!important;padding:12px 0!important;background:none!important;border:0!important;border-top:1px solid var(--border)!important;}
html.mx .mx-skills > .main_row:first-of-type{border-top:0!important;padding-top:0!important;}
html.mx .mx-skills > .main_row:has(> h4.heading){display:block!important;padding-bottom:0!important;}
html.mx .mx-skills > .main_row:has(> h4.heading) + .main_row{border-top:0!important;}
html.mx .mx-skills .box{display:flex!important;flex-direction:column;gap:2px;width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:none!important;border:0!important;}
html.mx #middle_section .mx-skills div.row.mx-row{display:grid!important;grid-template-columns:minmax(90px,1fr) 30px minmax(90px,1.4fr);align-items:center;gap:10px;background:none!important;border-radius:8px;padding:6px 8px!important;margin:0!important;width:auto!important;height:auto!important;}
html.mx #middle_section .mx-skills div.row.mx-row:hover{background:var(--surface2)!important;}
html.mx #middle_section .mx-skills div.row.mx-row > span:first-child{color:var(--muted)!important;font-size:13px!important;font-weight:500!important;}
html.mx #middle_section .mx-skills div.row.mx-row > strong{color:var(--text)!important;font-size:14px!important;text-align:right;font-variant-numeric:tabular-nums;}
html.mx .mx-skills div.row.mx-row > small{display:block;width:auto!important;}
html.mx .mx-skills .mx-bar{display:block;width:100%;height:7px;}
html.mx #middle_section .mx-skills h4.heading{display:flex!important;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:0 0 6px!important;padding:0 8px!important;background:none!important;border:0!important;height:auto!important;font:600 14px/1.3 var(--font)!important;}
html.mx #middle_section .mx-skills h4.heading > *{float:none!important;margin:0!important;}
html.mx #middle_section .mx-skills h4.heading > span{color:var(--muted)!important;font:600 11px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.07em;}
html.mx #middle_section .mx-skills h4.heading > span.left{order:1;}
html.mx #middle_section .mx-skills h4.heading > strong:not(.right){order:2;color:var(--text)!important;}
html.mx #middle_section .mx-skills h4.heading > strong,html.mx #middle_section .mx-skills h4.heading strong.right a{text-transform:none!important;font:700 15px/1.3 var(--font)!important;letter-spacing:0;}
html.mx #middle_section .mx-skills h4.heading > span.right{order:3;margin-left:auto!important;}
html.mx #middle_section .mx-skills h4.heading > strong.right{order:4;}
html.mx #middle_section .mx-skills h4.heading > a{order:5;display:inline-flex;}
html.mx #middle_section .mx-skills h4.heading strong.right a{color:var(--text)!important;}
html.mx #middle_section .mx-skills h4.heading img{width:16px;height:16px;border-radius:4px;}

/* ---------- athlete: rankings ---------- */
html.mx .mx-rank > .main_row{width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:none!important;border:0!important;}
html.mx .mx-rank .head_row,html.mx .mx-rank .text_row{display:grid!important;grid-template-columns:minmax(150px,1.5fr) repeat(3,minmax(110px,1fr));align-items:end;gap:0 12px;width:auto!important;height:auto!important;margin:0!important;padding:0!important;background:none!important;border:0!important;}
html.mx .mx-rank .head_row > div,html.mx .mx-rank .text_row > div{width:auto!important;height:auto!important;margin:0!important;padding:6px 4px!important;border:0!important;background:none!important;float:none!important;}
html.mx .mx-rank .head_row{border-bottom:1px solid var(--border)!important;padding-bottom:4px!important;}
html.mx .mx-rank .head_row .box02{align-self:end;color:var(--muted)!important;font:700 12px var(--font)!important;text-transform:uppercase;letter-spacing:.08em;}
html.mx .mx-rank .head_row h4{margin:0 0 4px!important;padding:0!important;text-align:center;font:700 13px var(--font)!important;color:var(--text)!important;background:none!important;}
html.mx .mx-rank h5{display:grid!important;grid-template-columns:1fr 1fr;margin:0!important;padding:0!important;text-align:center;font:600 10px/1.25 var(--font)!important;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)!important;background:none!important;}
html.mx .mx-rank h5 span{color:var(--muted)!important;width:auto!important;float:none!important;overflow:visible!important;white-space:normal!important;text-overflow:clip!important;}
html.mx .mx-rank h5 .col3{grid-column:1/-1;}
html.mx .mx-rank h5 > br{display:none;}
html.mx .mx-rank .text_row{align-items:center;border-bottom:1px solid var(--border)!important;border-radius:0;}
html.mx .mx-rank .text_row:hover{background:var(--surface2)!important;}
html.mx .mx-rank .text_row .box02{display:flex!important;align-items:center;gap:8px;font-weight:600;}
html.mx .mx-rank .text_row .box02 img{width:16px;height:16px;border-radius:4px;}
html.mx .mx-rank .text_row > div:not(.box02){display:grid!important;grid-template-columns:1fr 1fr;text-align:center;font-variant-numeric:tabular-nums;}
html.mx .mx-rank .text_row span{width:auto!important;float:none!important;border:0!important;}
html.mx .mx-rank a,html.mx .mx-rank strong{color:var(--text)!important;text-decoration:none!important;}
html.mx .mx-rank a:hover{color:var(--accent)!important;}
html.mx .mx-rank > .main_row + .main_row .head_row{border-bottom:0!important;}
html.mx .mx-rank > .main_row + .main_row{margin-top:6px!important;}

/* ---------- athlete: misc ---------- */
html.mx .mx-athlete > a.ui4-bookmark-club-count{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:6px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--border);color:var(--text)!important;font-size:12.5px;text-decoration:none!important;}
html.mx .mx-athlete > a.ui4-bookmark-club-count:hover{border-color:var(--accent);}
html.mx .mx-athlete > a.ui4-bookmark-club-count .mx-ic{color:var(--accent);}
/* event pictograms (replace the site's 16x16 square images) */
.mx-evi{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;flex:0 0 20px;vertical-align:middle;background:var(--surface3);color:var(--muted);}
.mx-evi.M{background:color-mix(in srgb,var(--male) 18%,transparent);color:var(--male);}
.mx-evi.F{background:color-mix(in srgb,var(--female) 18%,transparent);color:var(--female);}
html.mx .mx-athlete > a.ui4-bookmark-club-count + br{display:none;}
html.mx .mx-card textarea{width:100%!important;box-sizing:border-box;min-height:90px;}
html.mx #middle_section .mx-card:not(.mx-skills) h4.heading > span{font:inherit!important;color:inherit!important;letter-spacing:inherit;}
html.mx .mx-card div:has(> textarea){background:none!important;border:0!important;padding:0!important;width:auto!important;height:auto!important;}
html.mx #middle_section .mx-card:not(.mx-skills) h4.heading{font:700 12px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)!important;margin:0 0 10px!important;padding:0!important;background:none!important;border:0!important;}
@media (max-width:900px){html.mx .mx-skills > .main_row{grid-template-columns:1fr;} html.mx .mx-hero{grid-template-columns:1fr;}}
/* ---------- responsive ---------- */
html.mx .mx-rank{overflow-x:auto;}
html.mx .mx-rank > .main_row{min-width:560px;}
/* ---------- sidebar sections (collapsible) and icon rail ---------- */
html.mx #left_section ul{float:none!important;}
html.mx #left_section h2{float:none!important;clear:both;}
html.mx #left_section h2.mx-side-h{display:flex!important;align-items:center;justify-content:space-between;gap:6px;cursor:pointer;user-select:none;}
html.mx #left_section .mx-side-tg{all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;color:var(--muted);transition:transform .15s;}
html.mx #left_section .mx-side-tg:hover{background:var(--surface3);color:var(--text);}
html.mx #left_section h2.mx-shut .mx-side-tg{transform:rotate(-90deg);}
html.mx #left_section ul.mx-side-shut{display:none!important;}
html.mx #left_section h2.mx-side-solo{margin-top:12px!important;padding-top:10px!important;border-top:1px solid var(--border)!important;}
html.mx #left_section h2.mx-side-solo a{display:flex!important;align-items:center;gap:10px;padding:4px 2px!important;}
html.mx-rail #left_section{flex:0 0 58px;width:58px!important;padding:8px 6px;}
html.mx-rail #left_section h2.sidebar-user-heading{padding:6px!important;display:flex;justify-content:center;}
html.mx-rail #left_section .sidebar-user-name{display:none!important;}
html.mx-rail #left_section h2:not(.sidebar-user-heading):not(.mx-side-solo){font-size:0!important;height:1px;background:var(--border)!important;margin:8px 6px!important;overflow:hidden;}
html.mx-rail #left_section h2.mx-side-solo a{font-size:0!important;justify-content:center;}
html.mx-rail #left_section .mx-side-tg{display:none;}
html.mx-rail #left_section ul.mx-side-shut{display:block!important;}
html.mx-rail #left_section li a{justify-content:center!important;padding:8px 0!important;font-size:0!important;gap:0!important;}
html.mx-rail #left_section li a *:not(svg):not(svg *){font-size:0!important;}
html.mx-rail #left_section li a .mx-ic{width:18px;height:18px;}

/* ---------- home page ---------- */
html.mx #middle_section.mx-hide-orig-home > .home_details,html.mx #middle_section.mx-hide-orig-home > br{display:none!important;}
.mx-home{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;align-items:stretch;margin-bottom:14px;}
.mx-home > .mx-card{margin:0!important;}
.mx-home .mx-tiles{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));margin:0;}
.mx-home a.mx-tile{text-decoration:none!important;color:var(--text)!important;}
.mx-home a.mx-tile:hover{border-color:var(--accent);}
.mx-home .mx-tile .v{font-variant-numeric:tabular-nums;}
.mx-home-comp{display:flex;flex-direction:column;}
.mx-home-comp > div{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border);font-size:13px;min-width:0;}
.mx-home-comp > div:first-child{border-top:0;padding-top:0;}
.mx-home-comp .mx-badge{flex:0 0 auto;min-width:76px;text-align:center;font-variant-numeric:tabular-nums;display:inline-flex;gap:4px;align-items:center;justify-content:center;}
.mx-home-comp .mx-badge *{color:inherit!important;background:none!important;font:inherit!important;padding:0!important;}
.mx-home-comp a{color:var(--text)!important;text-decoration:none!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mx-home-comp a:hover{color:var(--accent)!important;}
@media (max-width:900px){.mx-home{grid-template-columns:1fr;}}
html.mx #middle_section .news_maxithlon,html.mx #middle_section .status_details{background:var(--surface)!important;border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 18px!important;margin:0 0 14px!important;width:auto!important;float:none!important;box-sizing:border-box;display:flow-root;}
html.mx #middle_section .news_maxithlon h3,html.mx #middle_section .status_details h3{font-size:16px!important;font-weight:700!important;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px!important;padding:0!important;background:none!important;}
html.mx #middle_section .news_maxithlon h3 img,html.mx #middle_section .status_details h3 img{display:none;}
html.mx #middle_section .news_maxithlon .title_text{padding:5px 12px!important;border-radius:999px;border:1px solid var(--border)!important;background:none!important;font-size:13px!important;font-weight:600;cursor:pointer;color:var(--text)!important;}
html.mx #middle_section .news_maxithlon .title_text:hover{border-color:var(--accent)!important;}
html.mx #middle_section .news_maxithlon .title_text.mx-on{background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;cursor:default;}
html.mx #middle_section .home-news-archive{float:right;margin:2px 0 0 10px;}
html.mx #middle_section .news_maxithlon > ul{margin:0!important;padding:0!important;list-style:none!important;}
html.mx #middle_section .news_maxithlon > ul > li{display:block;padding:10px 0!important;margin:0!important;border-top:1px solid var(--border);background:none!important;}
html.mx #middle_section .news_maxithlon > ul > li:first-of-type{border-top:0;}
html.mx #middle_section .news_maxithlon li > .date{display:inline-block;margin-right:10px;padding:2px 7px;border-radius:6px;background:var(--surface3)!important;color:var(--muted)!important;font-size:11.5px;font-variant-numeric:tabular-nums;}
html.mx #middle_section .news_maxithlon li > a strong{font-size:14px;}
html.mx #middle_section .news_maxithlon .news_body_text{margin:10px 0 2px!important;color:var(--text)!important;line-height:1.55!important;}
html.mx #middle_section .status_details .right_text{float:none!important;order:2;margin-left:auto;font-size:12px!important;font-weight:500!important;color:var(--muted)!important;cursor:pointer;}
html.mx #middle_section .status_details .right_text:hover{color:var(--bad)!important;}
html.mx #middle_section .status_details > div{color:var(--muted);font-size:13px;}
/* ---------- account pages: options, password, symbol, profile, messages ---------- */
html.mx input.colorwell{border:1px solid var(--border)!important;border-radius:9px!important;padding:7px 10px!important;width:110px;font:600 12px var(--font)!important;text-align:center;opacity:1!important;box-shadow:none!important;cursor:pointer;}
html.mx #middle_section.mx-acct table.ui4-form-table{width:100%!important;background:var(--surface)!important;border:1px solid var(--border)!important;border-radius:12px;box-shadow:var(--shadow);border-collapse:separate!important;border-spacing:0!important;overflow:hidden;margin:0 0 14px!important;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr > *{padding:10px 14px!important;border:0!important;border-bottom:1px solid var(--border)!important;background:none!important;vertical-align:middle;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr:last-child > *{border-bottom:0!important;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr:hover > *{background:none!important;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr > th,html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr > td:first-child:not(:only-child){width:32%;text-align:left!important;text-transform:none!important;letter-spacing:0!important;font:600 13px/1.3 var(--font)!important;color:var(--muted)!important;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr > td:first-child:not(:only-child) *{color:inherit!important;font:inherit!important;}
html.mx #middle_section.mx-acct table.ui4-form-table input[type=text]:not(.colorwell),html.mx #middle_section.mx-acct table.ui4-form-table input[type=password],html.mx #middle_section.mx-acct table.ui4-form-table input[type=email]{width:100%!important;max-width:380px;box-sizing:border-box;}
html.mx #middle_section.mx-acct table.ui4-form-table > tbody > tr > td:only-child{text-align:left!important;}
/* markItUp text editor (messages, federations) */
html.mx .markItUp{width:100%!important;max-width:760px;border:0!important;}
html.mx .markItUpContainer{background:var(--surface2)!important;border:1px solid var(--border)!important;border-radius:10px!important;padding:6px!important;}
html.mx textarea.markItUpEditor{background:var(--surface)!important;color:var(--text)!important;border:1px solid var(--border)!important;width:100%!important;box-sizing:border-box;}
html.mx-dark .markItUpHeader{background:#d8dde3!important;border-radius:8px;padding:3px 6px;margin-bottom:6px;display:flow-root;}
.mx-opts{background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow);margin:0 0 16px;overflow:hidden;}
.mx-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 14px;border-top:1px solid var(--border);font:13px/1.45 var(--font);color:var(--text);}
.mx-opt:first-child{border-top:0;}
.mx-opt:hover{background:var(--surface2);}
.mx-opt input{margin:2px 0 0!important;accent-color:var(--accent);flex:0 0 auto;cursor:pointer;}
.mx-opt > div{flex:1;min-width:0;}
.mx-opt label{cursor:pointer;}
.mx-opt .hint{color:var(--muted);font-size:12px;margin-top:2px;}
html.mx #middle_section.mx-acct form.ui4-form > label{display:block;margin:0 0 6px!important;font:600 13px var(--font)!important;color:var(--text)!important;}
html.mx #middle_section.mx-acct form.ui4-form > input[type=text]{width:100%!important;max-width:420px;box-sizing:border-box;margin:0 0 14px;}
html.mx #middle_section.mx-acct form.ui4-form > textarea{width:100%!important;max-width:560px;box-sizing:border-box;min-height:80px;margin:0 0 14px;}
.mx-colors{display:flex;gap:20px;align-items:center;flex-wrap:wrap;}
.mx-colors > table.ui4-form-table{flex:1 1 360px;width:auto!important;}
html.mx .mx-colors #picker{float:none!important;order:2;flex:0 0 auto;}
html.mx .mx-colors #picker:empty{display:none;}
.mx-acts{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px;}
.mx-acts a.mx-btn{display:inline-flex;align-items:center;gap:7px;text-decoration:none!important;}
html.mx #middle_section.mx-acct table.ui4-profile-login-history{width:100%!important;background:var(--surface)!important;border:1px solid var(--border)!important;border-radius:12px;box-shadow:var(--shadow);border-collapse:separate!important;border-spacing:0!important;overflow:hidden;font-variant-numeric:tabular-nums;}
html.mx #middle_section.mx-acct table.ui4-profile-login-history td,html.mx #middle_section.mx-acct table.ui4-profile-login-history th{padding:6px 14px!important;border:0!important;border-bottom:1px solid var(--border)!important;background:none!important;font-size:12.5px;}
html.mx #middle_section.mx-acct table.ui4-profile-login-history tr:first-child > *{font-weight:700;color:var(--muted)!important;text-transform:uppercase;font-size:11px;letter-spacing:.07em;}
html.mx #middle_section.mx-acct table.ui4-profile-login-history tr:last-child > *{border-bottom:0!important;}
html.mx #middle_section.mx-acct h4{font:700 12px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)!important;margin:6px 0 6px!important;}
html.mx #middle_section.mx-acct #messaggi tbody td:only-child{text-align:center!important;color:var(--muted)!important;padding:30px 10px!important;font-size:13px;}
/* ---------- league table, calendars, competitions (1.9) ---------- */
.mx-hide-orig-lg > table.results_small{display:none!important;}
.mx-hide-orig-cal > .mx-cal-src{display:none!important;}
/* league charts: drawn from the chart configs in the site's chart images */
.mx-hide-orig-gr > img,.mx-hide-orig-gr > br,.mx-hide-orig-gr > div[style],.mx-hide-orig-gr > table{display:none!important;}
.mx-gr svg{display:block;width:100%;height:auto;overflow:visible;}
.mx-gr svg text{fill:var(--muted);font:10.5px var(--font);}
.mx-gr svg .grid{stroke:var(--border);stroke-width:1;}
.mx-gr .ln{fill:none;stroke:var(--c);stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round;transition:opacity .15s,stroke-width .15s;}
.mx-gr .ln.own{stroke-width:3.4;}
.mx-gr svg.focus .ln{opacity:.12;} .mx-gr svg.focus .ln.on{opacity:1;stroke-width:3.4;}
html.mx-dark .mx-gr .ln,html.mx-dark .mx-gr-key i{--c2:color-mix(in srgb,var(--c) 62%,#fff);}
html.mx-dark .mx-gr .ln{stroke:var(--c2);} html.mx-dark .mx-gr-key i{background:var(--c2)!important;}
.mx-gr-key{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.mx-gr-key button{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;border:1px solid var(--border);font-size:12px;color:var(--text);max-width:220px;}
.mx-gr-key button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mx-gr-key button:hover,.mx-gr-key button.on{background:var(--surface2);border-color:var(--muted);}
.mx-gr-key button.own{font-weight:700;border-color:var(--accent);}
.mx-gr-key i{width:9px;height:9px;border-radius:50%;background:var(--c);flex:0 0 9px;}
.mx-gr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:16px;}
.mx-gr-grid .mx-card{margin:0!important;padding:12px 14px!important;}
.mx-gr-grid .mx-card.own{border-color:var(--accent)!important;box-shadow:0 0 0 1px var(--accent),var(--shadow)!important;}
/* ---------- coaches (1.11) ---------- */
.mx-hide-orig-tc > table.tablesorter,.mx-hide-orig-tc > p,.mx-hide-orig-tc > .mx-tc-src{display:none!important;}
.mx-tc-sec{margin-bottom:18px;}
.mx-tc-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:700 12px/1.2 var(--font);text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:4px 0 8px;}
.mx-tc-groups{display:flex;flex-wrap:wrap;gap:16px 14px;align-items:flex-start;}
.mx-tc-grp{flex:0 1 auto;min-width:0;max-width:100%;}
.mx-tc-gh{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px;font-size:13.5px;font-weight:700;}
.mx-tc-gh .mxr-g{width:9px;height:9px;flex:0 0 9px;}
.mx-tc-grid{display:grid;grid-template-columns:repeat(var(--n,1),minmax(0,250px));gap:10px;}
@media (max-width:760px){.mx-tc-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));}.mx-tc-grp{flex-basis:100%;}}
.mx-tc-grid > .mx-card{margin:0!important;padding:12px 14px!important;display:flex!important;flex-direction:column;gap:8px;}
.mx-tc-name{display:flex;align-items:center;gap:7px;min-width:0;}
.mx-tc-name a{color:var(--text)!important;text-decoration:none!important;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mx-tc-name a:hover{color:var(--accent)!important;}
.mx-tc-name img{width:16px;height:11px;border-radius:2px;object-fit:cover;}
.mx-tc-name .mx-badge{margin-left:auto;}
.mx-tc-load{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);}
.mx-tc-load b{color:var(--text);font-size:15px;font-variant-numeric:tabular-nums;}
.mx-tc-load .trk{flex:1;height:5px;border-radius:9px;background:var(--surface3);overflow:hidden;}
.mx-tc-load .trk i{display:block;height:100%;border-radius:9px;background:var(--accent);}
.mx-tc-sk{display:grid;grid-template-columns:auto 1fr 22px;gap:4px 8px;align-items:center;font-size:12px;}
.mx-tc-sk > span{color:var(--muted);white-space:nowrap;}
.mx-tc-sk > b{text-align:right;font-variant-numeric:tabular-nums;}
.mx-tc-sk .trk{position:relative;height:6px;border-radius:9px;background:var(--surface3);}
.mx-tc-sk .trk i{display:block;height:100%;border-radius:9px;}
.mx-tc-sk .trk u{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;border-radius:2px;background:var(--text);opacity:.55;}
.mx-tc-ath{display:flex;flex-wrap:wrap;gap:4px;}
.mx-tc-ath a{font-size:11.5px;padding:1px 7px;border-radius:999px;background:var(--surface2);color:var(--text)!important;text-decoration:none!important;white-space:nowrap;}
.mx-tc-ath a:hover{background:var(--accent-soft);color:var(--accent)!important;}
.mx-tc-none{border-style:dashed!important;color:var(--muted);font-size:12.5px;justify-content:center;}
.mxr-legend .mk{display:inline-block;width:2px;height:12px;background:var(--text);opacity:.55;vertical-align:middle;margin-right:4px;}

.mx-gr-grid h5{margin:0 0 6px!important;font:700 12.5px/1.3 var(--font)!important;color:var(--text)!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mx-gr .b0{fill:var(--accent);} .mx-gr .b1{fill:color-mix(in srgb,var(--muted) 38%,transparent);}
.mx-gr .b2{fill:var(--good);} .mx-gr .b3{fill:var(--warn);}
/* competition search: the form as a compact filter bar */
.mx-filters{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px 14px;text-align:left;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 16px;margin:0 0 16px;}
.mx-filters .fld{display:flex;flex-direction:column;gap:4px;min-width:0;}
.mx-filters .fld > b{font:700 11px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)!important;}
.mx-filters .ctl{display:flex;align-items:center;gap:6px;min-width:0;}
.mx-filters .ctl > select,.mx-filters .ctl > .select2-container{flex:1 1 auto;width:auto!important;min-width:0;max-width:100%;}
.mx-filters .ctl > select + input,.mx-filters .ctl > select + input + *{flex:0 0 auto;}
.mx-filters .ctl > input[type="text"]{width:64px!important;min-width:0;}
.mx-filters .ctl > select:only-child,.mx-filters .ctl > .select2-container:last-child{flex:1 1 100%;}
.mx-filters .select2-container .select2-selection--single{height:32px!important;display:flex;align-items:center;border-radius:8px!important;}
.mx-filters .select2-container .select2-selection__arrow{height:30px!important;}
.mx-filters .foot{grid-column:1/-1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:10px;}
.mx-filters .foot label{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--text);}
.mx-filters .foot .btns{margin-left:auto;display:flex;gap:8px;}
.mx-lg .mx-table-wrap{max-height:none;margin-bottom:8px;}
table.mx-lg-t td.pos span{display:inline-block;min-width:22px;font-weight:700;color:var(--muted);}
table.mx-lg-t td.club{display:flex;align-items:center;gap:8px;max-width:320px;}
table.mx-lg-t td.club a{color:var(--text)!important;font-weight:600;text-decoration:none!important;overflow:hidden;text-overflow:ellipsis;}
table.mx-lg-t td.club a:hover{color:var(--accent)!important;}
table.mx-lg-t td.club .mx-badge{margin-left:auto;}
table.mx-lg-t td.pts b{font-size:14px;}
table.mx-lg-t td.pts small{display:block;font-size:10.5px;color:var(--muted);line-height:1;}
table.mx-lg-t td.form.up{color:var(--good);font-weight:700;} table.mx-lg-t td.form.down{color:var(--bad);font-weight:700;}
table.mx-lg-t td.rd{padding:3px 2px!important;}
table.mx-lg-t td.rd span{display:inline-block;min-width:26px;padding:3px 0;border-radius:6px;font-weight:600;font-variant-numeric:tabular-nums;}
table.mx-lg-t td.rd span.top{font-weight:800;}
table.mx-lg-t td.wait{color:var(--muted);opacity:.5;}
table.mx-lg-t td.miss{color:var(--bad);font-weight:700;}
table.mx-lg-t tr.z-up td.pos{box-shadow:inset 3px 0 0 var(--good);}
table.mx-lg-t tr.z-down td.pos{box-shadow:inset 3px 0 0 var(--bad);}
table.mx-lg-t tr.line-up td{border-bottom:2px dashed var(--good)!important;}
table.mx-lg-t tr.line-down td{border-bottom:2px dashed var(--bad)!important;}
table.mx-table tr.mx-own td,html.mx #middle_section table tr.mx-own > td{background:var(--accent-soft)!important;}
table.mx-lg-t tr.mx-own td.club a{color:var(--accent)!important;}
table.mx-lg-t tr.mx-own td.pos span{color:var(--accent);}
.mxr-legend .sw.up{background:var(--good);width:14px;} .mxr-legend .sw.down{background:var(--bad);width:14px;}
.mxr-legend .sw.heat{background:linear-gradient(90deg,color-mix(in srgb,var(--good) 12%,transparent),color-mix(in srgb,var(--good) 82%,transparent));}
.mxr-legend .sp{flex:1;}
html.mx #middle_section table.results tr.mx-own > td:first-child{box-shadow:inset 3px 0 0 var(--accent);}
html.mx #middle_section table.results td.mx-place{font-weight:800;}
html.mx #middle_section table.results td.mx-place.p1{color:#d4a017!important;} html.mx #middle_section table.results td.mx-place.p2{color:#9aa4ae!important;} html.mx #middle_section table.results td.mx-place.p3{color:#c07a3a!important;}
html.mx .mx-league td[bgcolor="#000000"]{display:none!important;}
html.mx .mx-league a.mx-own-a{color:var(--accent)!important;font-weight:700;}
html.mx .mx-league > table:last-of-type{width:calc(100% + 28px)!important;margin:0 -14px!important;border-collapse:separate!important;border-spacing:14px 0!important;background:none!important;}
html.mx .mx-league > table:last-of-type > tbody > tr > td{background:var(--surface)!important;border:1px solid var(--border)!important;border-radius:var(--radius);box-shadow:var(--shadow);padding:12px 16px!important;vertical-align:top!important;text-align:left!important;}
html.mx .mx-league > table:last-of-type > tbody > tr > td > b{display:block;font:700 11px/1.2 var(--font)!important;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)!important;margin-bottom:8px;}
html.mx .mx-league > table:last-of-type table{width:100%!important;}
html.mx .mx-league > table:last-of-type table td{padding:2px 0!important;font-size:12.5px;}
html.mx .mx-league > table:last-of-type table td[colspan] a{font-weight:700;}
html.mx .mx-league > table:last-of-type table td[height="8"]{height:4px!important;padding:0!important;}
html.mx .mx-league > table:last-of-type table tr:not(:nth-child(2)) > td[colspan]{border-top:1px solid var(--border)!important;padding-top:8px!important;}
/* calendars */
.mx-cal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:14px;}
.mx-cal-w{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:10px 12px;}
.mx-cal-w.past{opacity:.55;}
.mx-cal-w.cur{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent),var(--shadow);}
.mx-cal-wt{font:700 11px/1.2 var(--font);text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:6px;}
.mx-cal-d{display:grid;grid-template-columns:62px 1fr;gap:8px;padding:6px 0;border-top:1px solid var(--border);}
.mx-cal-d:first-of-type{border-top:0;}
.mx-cal-d.past{opacity:.6;}
.mx-cal-dt{display:flex;flex-direction:column;gap:1px;font-variant-numeric:tabular-nums;}
.mx-cal-dt b{font-size:13px;} .mx-cal-dt span{font-size:11px;color:var(--muted);text-transform:capitalize;}
.mx-cal-dt .mx-badge{align-self:flex-start;margin-top:2px;}
.mx-cal-c{display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;}
a.mx-cal-k{font-size:11.5px;line-height:1.3;padding:2px 8px;border-radius:999px;background:var(--surface3);color:var(--text)!important;text-decoration:none!important;border-left:3px solid var(--muted);}
a.mx-cal-k:hover{color:var(--accent)!important;}
a.mx-cal-k.league{border-left-color:var(--accent);font-weight:700;} a.mx-cal-k.meet{border-left-color:#58a6ff;}
a.mx-cal-k.champ{border-left-color:var(--good);} a.mx-cal-k.intl{border-left-color:var(--warn);}
.mx-cal-note{font-size:12px;color:var(--muted);}
.mx-cal-row{display:grid;grid-template-columns:28px 120px 1fr auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--border);font-size:13px;}
.mx-cal-row:first-of-type{border-top:0;}
.mx-cal-row .n{color:var(--muted);font-weight:700;text-align:center;}
.mx-cal-row .d{display:flex;flex-direction:column;font-variant-numeric:tabular-nums;} .mx-cal-row .d span{font-size:11px;color:var(--muted);}
.mx-cal-row a{color:var(--text)!important;font-weight:600;text-decoration:none!important;} .mx-cal-row a:hover{color:var(--accent)!important;}
.mx-cal-row.past{opacity:.6;}
.mx-cal-row.next{background:var(--accent-soft);border-radius:8px;margin:0 -8px;padding:7px 8px;}
/* moments of glory, honours board */
.mx-place-b{display:inline-block;min-width:26px;padding:1px 6px;margin-right:4px;border-radius:999px;text-align:center;font-weight:700;font-size:11.5px;background:var(--surface3);color:var(--muted);font-variant-numeric:tabular-nums;}
.mx-place-b.top{background:var(--accent-soft);color:var(--accent);}
.mx-place-b.p1{background:rgba(212,160,23,.2);color:#b8860b;} .mx-place-b.p2{background:rgba(154,164,174,.25);color:#7d8790;} .mx-place-b.p3{background:rgba(192,122,58,.2);color:#b0692c;}
html.mx-dark .mx-place-b.p1{color:#f0c44c;} html.mx-dark .mx-place-b.p2{color:#c3ccd5;} html.mx-dark .mx-place-b.p3{color:#e09a5c;}
html.mx #middle_section table.results tr.mx-podium > td{background:rgba(212,160,23,.07)!important;}
/* narrow: the right column moves under the content, its boxes side by side */
@media (max-width:1100px){
  html.mx #inner_body_container{flex-wrap:wrap;}
  html.mx #middle_section{flex:1 1 calc(100% - 230px);}
  html.mx #right_section,html.mx #right_part{display:grid!important;flex:1 1 100%;width:auto!important;margin:0 0 0 230px!important;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;align-items:start;}
  html.mx #right_section > div,html.mx #right_part > div{margin:0!important;}
  html.mx #footer .wrapper{grid-template-columns:repeat(3,1fr);}
  html.mx #footer .space_none{grid-column:1/-1;}
  html.mx #header .right_details{flex-wrap:wrap;row-gap:4px;}
  html.mx #header .top_menu{max-width:100%;overflow-x:auto;scrollbar-width:none;}
  html.mx-rail #middle_section{flex-basis:calc(100% - 76px);}
  html.mx-rail #right_section,html.mx-rail #right_part{margin-left:76px!important;}
}
@media (max-width:900px){
  html.mx #header{flex-wrap:wrap;}
  html.mx .mxa{grid-template-columns:1fr;}
  html.mx .mx-hero .face_area{justify-self:start;}
}
@media (max-width:760px){
  html.mx #left_section{display:none!important;}
  html.mx #middle_section{flex-basis:100%;}
  html.mx #right_section,html.mx #right_part{margin-left:0!important;}
  html.mx #footer .wrapper{grid-template-columns:1fr 1fr;}
}
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
  const SKIP_DARKFIX = 'input.colorwell,#picker,#picker *,.markItUpHeader,.markItUpHeader *,svg,svg *,img,script,style,.mxr,.mxr *,.mxa,.mxa *,.mx-hero,.mx-hero *,.mx-skills,.mx-skills *,.mx-rank,.mx-rank *,.mx-dock,.mx-dock *,.mx-pal-bg,.mx-pal-bg *,.mx-notice,.mx-notice *,#left_section,#left_section *';

  function darkFix(scope) {
    if (theme !== 'dark') return;
    const els = scope.nodeType === 1 ? [scope, ...scope.querySelectorAll('*')] : [];
    for (const el of els) {
      if (el.matches(SKIP_DARKFIX)) continue;
      const mapped = el.classList.contains('mx-lc');
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
      if (!hasText || mapped) continue;
      const fg = parseRGB(cs.color);
      if (!fg) continue;
      const hsl = rgbToHsl(fg);
      if (hsl.l < 0.5 && lumOf(fg) < 0.42) {
        if (hsl.s > 0.35) el.style.setProperty('color', `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s * 85)}% 68%)`, 'important');
        else el.style.setProperty('color', 'var(--text)', 'important');
      }
    }
  }

  /* Legacy text colors (olive, teal, magenta, brick…) mapped to theme
   * colors, in both themes. Matched by RGB value, never by text. Links
   * keep the link color, except the gender colors. */
  const LEGACY_COLORS = [
    [[131, 153, 62], 'var(--good)'], // olive: percentages, positive values
    [[23, 160, 168], 'var(--link)'], [[23, 161, 169], 'var(--link)'], [[37, 166, 173], 'var(--link)'], [[37, 204, 173], 'var(--link)'], // teal: counters, prices
    [[50, 169, 175], 'var(--male)', true], // #32A9AF male names
    [[230, 60, 230], 'var(--female)', true], [[173, 37, 166], 'var(--female)', true], // #E63CE6 female names and values
    [[161, 77, 67], 'var(--accent)'], // brick headings
    [[240, 73, 53], 'var(--bad)'], // red-orange: negative values, delete actions
  ];
  const SKIP_LEGACY = 'input.colorwell,#picker,#picker *,svg,svg *,script,style,.mxr,.mxr *,.mxa,.mxa *,.mx-dock,.mx-dock *,.mx-pal-bg,.mx-pal-bg *,.mx-notice,.mx-notice *,#left_section,#left_section *,.mx-logo,.mx-logo *';
  function legacyColors(scope) {
    const els = scope.nodeType === 1 ? [scope, ...scope.querySelectorAll('*')] : [];
    for (const el of els) {
      if (el.matches(SKIP_LEGACY)) continue;
      if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const c = parseRGB(getComputedStyle(el).color);
      if (!c) continue;
      const hit = LEGACY_COLORS.find(([[r, g, b]]) => Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b) <= 12);
      if (!hit) continue;
      const inLink = !hit[2] && el.closest('a');
      el.style.setProperty('color', inLink ? 'var(--link)' : hit[1], 'important');
      el.classList.add('mx-lc');
    }
  }

  // Content loaded later by AJAX gets the same color fixes.
  function watchDom() {
    let pending = new Set(); let timer = null;
    const mo = new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && !n.closest('.mxr,.mxa,.mx-dock,.mx-pal-bg,.mx-notice')) pending.add(n);
      clearTimeout(timer);
      timer = setTimeout(() => { const p = pending; pending = new Set(); p.forEach((n) => { if (n.isConnected) { eventIcons(n); legacyColors(n); darkFix(n); } }); }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * Navigation: highlight the current link
   * ------------------------------------------------------------------ */
  function markCurrent() {
    const here = location.pathname;
    // the icon-only menu shows each entry's name as a tooltip
    $$('#left_section a').forEach((a) => { if (!a.title) a.title = a.textContent.trim(); });
    $$('#left_section li a, .page_bar li a, .page_bar_main li a, .page_bar_youth li a').forEach((a) => {
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
        moduleOn('palette') ? h('button', { class: 'mx-d', title: t('palette'), onclick: openPalette }, svgIcon('search', 16), h('kbd', {}, 'Ctrl K')) : null,
        h('button', { class: 'mx-d', title: theme === 'dark' ? t('toLight') : t('toDark'), onclick: () => setTheme(theme === 'dark' ? 'light' : 'dark') }, svgIcon(theme === 'dark' ? 'sun' : 'moon', 16)),
        h('button', { class: 'mx-d', title: t('setTitle'), onclick: openSettings }, svgIcon('settings', 16)),
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
      { label: t('setTitle'), group: 'UI+', run: openSettings },
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

  /* ------------------------------------------------------------------ *
   * Settings panel (dock gear or palette): theme, accent, density and
   * modules. Accent and density apply at once; theme and modules reload.
   * ------------------------------------------------------------------ */
  const moduleOn = (k) => !settings.off.includes(k);
  const saveSettings = () => LS.set('settings', settings);
  function applySettings() {
    const hex = /^#[0-9a-f]{6}$/i.test(settings.accent) ? settings.accent : ACCENTS[0];
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-soft', `rgba(${r},${g},${b},.14)`);
    root.classList.toggle('mx-compact', settings.density === 'compact');
    root.classList.toggle('mx-rail', settings.menu === 'rail');
  }

  function openSettings() {
    if ($('.mx-set-bg')) return;
    let reload = false;
    const bg = h('div', { class: 'mx-pal-bg mx-set-bg', onclick: (e) => { if (e.target === bg) close(); } });
    const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const seg = (opts, cur, pick) => h('div', { class: 'mx-seg' }, opts.map(([v, label]) => h('button', { class: 'mx-seg-b' + (v === cur ? ' on' : ''), onclick: () => pick(v) }, label)));
    const row = (label, ctrl, hint) => h('div', { class: 'mx-set-row' }, h('div', {}, h('div', { class: 'l' }, label), hint ? h('div', { class: 'hint' }, hint) : null), ctrl);
    function render() {
      const panel = h('div', { class: 'mx-pal mx-set' },
        h('div', { class: 'mx-set-h' }, h('span', {}, svgIcon('settings', 18), t('setTitle')), h('button', { class: 'mx-set-x', title: t('palClose'), onclick: close }, '×')),
        h('div', { class: 'mx-set-body' },
          row(t('setTheme'), seg([['dark', t('setDark')], ['light', t('setLight')]], theme, (v) => { if (v !== theme) setTheme(v); })),
          row(t('setAccent'), h('div', { class: 'mx-swatches' }, ACCENTS.map((c) => h('button', {
            class: 'mx-sw' + (c === settings.accent ? ' on' : ''), style: { background: c }, title: c,
            onclick: () => { settings.accent = c; saveSettings(); applySettings(); render(); },
          })))),
          row(t('setDensity'), seg([['comfortable', t('setComfortable')], ['compact', t('setCompact')]], settings.density, (v) => { settings.density = v; saveSettings(); applySettings(); render(); })),
          row(t('setMenu'), seg([['full', t('setMenuFull')], ['rail', t('setMenuRail')]], settings.menu, (v) => { settings.menu = v; saveSettings(); applySettings(); render(); })),
          h('div', { class: 'mx-set-sub' }, t('setModules')),
          MODULES.filter((m) => m.label).map((m) => h('label', { class: 'mx-set-mod' },
            h('input', { type: 'checkbox', checked: moduleOn(m.k), onchange: (e) => {
              settings.off = e.target.checked ? settings.off.filter((x) => x !== m.k) : [...settings.off, m.k];
              saveSettings(); reload = true; render();
            } }),
            h('span', {}, t(m.label))))),
        h('div', { class: 'mx-set-f' },
          h('button', { class: 'mx-btn', onclick: () => { LS.set('settings', {}); location.reload(); } }, t('setReset')),
          reload ? h('button', { class: 'mx-btn primary', onclick: () => location.reload() }, t('setReload')) : h('span', { class: 'hint' }, t('setLive'))));
      bg.replaceChildren(panel);
    }
    document.addEventListener('keydown', onKey);
    document.body.append(bg);
    render();
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (!moduleOn('palette')) return;
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

  function formMark(td) {
    const fc = (td.querySelector('font')?.getAttribute('color') || '').toLowerCase();
    const red = fc === 'red' || /^#?f{2}0{4}$/.test(fc), green = fc === 'green' || /^#?0{2}(80|ff)0{2}$/.test(fc);
    return { v: toNum(td.textContent), m: red ? 'low' : green ? 'high' : '' };
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
      groups.push({ name: group, gi, spec: [head[14], head[15]], color: GROUP_COLORS[gi % GROUP_COLORS.length], youth: isYouth });
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
          // Form uses its own colors: red font = low form, green font = top form (not rise/drop markers)
          emp: v(6), forma: formMark(c[7]),
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

  // Another club's pages carry its id in ?u=; our own id comes from the club link in the sidebar.
  const ownClubId = () => { try { return new URL($('#left_section a[href*="dettagli_societa"]').href).searchParams.get('u'); } catch (e) { return null; } };
  const foreignClubPage = () => { const u = new URLSearchParams(location.search).get('u'); return !!u && u !== ownClubId(); };

  /*
   * Roster averages, keyed by the group's table position (#atleti1..8), never by its
   * name, so they work whatever language the site is in. `alias` maps every group
   * name seen so far (in any language) to that position; `aid` maps our athletes'
   * ids to their group, so their own pages find it without reading any text.
   */
  const aidOf = (href) => { try { return new URL(href, location.href).searchParams.get('aid'); } catch (e) { return null; } };
  function saveRosterAverages(rows, groups) {
    const prev = rosterAvgData();
    const out = {}, alias = Object.assign({}, prev.alias), aid = {};
    groups.forEach((g) => {
      alias[g.name.toLowerCase()] = g.gi;
      const rs = rows.filter((r) => r.gi === g.gi);
      if (!rs.length) return;
      const o = { n: rs.length, spec: g.spec, name: g.name };
      BASE.forEach((b) => { o[b.k] = avg(rs.map((r) => r[b.k].v)); });
      o.s1 = avg(rs.map((r) => r.s1.v)); o.s2 = avg(rs.map((r) => r.s2.v));
      o.maxid = avg(rs.map((r) => r.maxid));
      out[g.gi] = o;
      rs.forEach((r) => { const id = aidOf(r.href); if (id) aid[id] = g.gi; });
    });
    LS.set('rosterAvg', { v: 2, at: Date.now(), groups: out, alias, aid });
  }
  // Reads the stored averages; the old format (keyed by group name, in one language) is read too.
  function rosterAvgData() {
    const ra = LS.get('rosterAvg', null) || {};
    let groups = ra.groups || {}, alias = ra.alias || {};
    if (ra.v !== 2) {
      const keys = Object.keys(groups);
      alias = Object.fromEntries(keys.map((k, i) => [k, i]));
      groups = Object.fromEntries(keys.map((k, i) => [i, groups[k]]));
    }
    const aid = ra.aid || {};
    const idxOf = (name, athleteId) => {
      if (athleteId != null && aid[athleteId] != null) return aid[athleteId];
      const i = alias[(name || '').trim().toLowerCase()];
      return i == null ? -1 : i;
    };
    return { groups, alias, aid, idxOf, get: (name, athleteId) => { const i = idxOf(name, athleteId); return i >= 0 ? groups[i] || null : null; }, has: Object.keys(groups).length > 0 };
  }

  function rosterPage() {
    const host = $('.page_details');
    const first = $('#atleti1');
    if (!host || !first) return;
    const { rows, groups, lab } = parseRoster();
    if (!rows.length) return;
    // only our own roster is the reference for the athlete radar
    if (!foreignClubPage()) saveRosterAverages(rows, groups);

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
      const tip = (title ? title + ': ' : '') + (val ?? '–') + (o?.m === 'down' ? ' · ' + t('mDown') : o?.m === 'up' ? ' · ' + t('mUp') : o?.m === 'upd' ? ' · ' + t('mUpd') : o?.m === 'low' ? ' · ' + t('formLow') : o?.m === 'high' ? ' · ' + t('formHigh') : '');
      return h('span', { class: cls, title: tip, style: st.heat ? { background: heatBg(val) } : null }, val ?? '–');
    };

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
          r.sale ? h('span', { class: 'mx-badge good', title: r.sale }, t('badgeSale')) : null,
          r.inj ? h('span', { class: 'mx-badge bad', title: r.inj }, t('badgeInj')) : null) },
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
        { k: 'ev', label: t('colEv'), title: t('colEvT'), sv: (r) => r.ev, td: (r) => h('span', { class: 'mx-badge pill ' + (r.evRisk ? 'bad' : 'good'), title: r.evTip, style: { cursor: 'help' } }, (r.ev ?? '–') + '/10') },
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
      downloadCSV(t('csvFile'), hdr, vis.map((r) => [r.name, r.group, r.gender, r.age, r.maxid, r.fans, r.emp.v, r.forma.v, ...BASE.map((b) => r[b.k].v), r.spec[0], r.s1.v, r.spec[1], r.s2.v, r.total, r.trainOk ? t('yes') : t('no'), r.ev, r.coach ? t('yes') : t('no'), r.sale || '', r.inj || '']));
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

      const card = (k, v, s, cls, onclick, extra) => tile(k, v, s, { cls, onclick, title: onclick ? t('clickFilter') : null, extra });
      const toggleFlag = (k) => () => { st.flags = st.flags.includes(k) ? st.flags.filter((x) => x !== k) : [...st.flags, k]; save(); render(); };

      const nNoTrain = cnt((r) => !r.trainOk), nRisk = cnt((r) => r.evRisk), nSale = cnt((r) => !!r.sale), nInj = cnt((r) => !!r.inj), nNoCoach = cnt((r) => !r.coach);
      const cards = h('div', { class: 'mx-tiles' },
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

      const tableWrap = h('div', { class: 'mx-table-wrap' });
      const legend = h('div', { class: 'mxr-legend' },
        h('span', {}, '0', h('i', { class: 'sw', style: { background: `linear-gradient(90deg,${heatBg(0)},${heatBg(10)},${heatBg(20)})` } }), '20'),
        h('span', {}, h('b', {}, t('lgBold')), ' ≥ 10 · ', h('b', {}, t('lgTop')), ' ≥ 15'),
        h('span', {}, t('lgOutline'), h('span', { style: { color: 'var(--bad)' } }, t('lgDown')), ' · ', h('span', { style: { color: 'var(--good)' } }, t('lgUp')), ' · ', h('span', { style: { color: '#58a6ff' } }, t('lgUpd'))),
        h('span', {}, lab.forma + ': ', h('span', { style: { color: 'var(--bad)' } }, t('formLow')), ' · ', h('span', { style: { color: 'var(--good)' } }, t('formHigh'))),
        h('span', {}, t('lgHelp')));

      function renderTable() {
        const cs = cols();
        const list = sorted(view());
        const thead = h('thead', {}, h('tr', {}, cs.map((c) => h('th', {
          class: (c.l ? 'l ' : '') + (c.sep ? 'sep ' : '') + (st.sort.k === c.k ? 'sorted' : ''), title: c.title || null,
          onclick: () => { st.sort = { k: c.k, d: st.sort.k === c.k ? -st.sort.d : (c.k === 'name' || c.k === 'group' || c.k === 'age' ? 1 : -1) }; save(); renderTable(); },
        }, c.label, st.sort.k === c.k ? (st.sort.d > 0 ? ' ▲' : ' ▼') : ''))));
        const tbody = h('tbody', {}, list.map((r) => h('tr', { class: r.inj ? 'inj' : '' }, cs.map((c) => h('td', { class: (c.l ? 'l ' : '') + (c.sep ? 'sep' : '') }, c.td(r))))));
        const tbl = h('table', { class: 'mx-table sortable' }, thead, tbody);
        tableWrap.replaceChildren(list.length ? tbl : h('div', { class: 'mx-empty-state' }, t('empty')));
      }

      ui.replaceChildren(cards, tools1, tools2, tableWrap, legend);
      renderTable();
    }
    render();
  }

  /* ------------------------------------------------------------------ *
   * Market search results (mercato.php after a search)
   * The site shows 20 results per page in table.results:
   * 0 flag · 1 name (link, <font color> gender, then two spans: deadline
   * and price) · 2 age · 3 MAXID · 4 group · 5 commitment · 6-11 base
   * skills · 12-13 specialty skills. Only this page's rows are used: no
   * requests to other pages.
   * ------------------------------------------------------------------ */
  // Server clock from the header (#ora, HH:MM:SS), as an offset from the local clock.
  // Rounded to 15 minutes, which is what time zones step by.
  function serverNow() {
    const now = new Date();
    const m = ($('#ora')?.textContent || '').match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!m) return now;
    let d = (+m[1] * 3600 + +m[2] * 60 + +m[3]) - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
    if (d > 43200) d -= 86400;
    if (d < -43200) d += 86400;
    return new Date(now.getTime() + Math.round(d / 900) * 900 * 1000);
  }
  // "15:13 23-11-2026" (day first; swapped if the second number can't be a month)
  const parseWhen = (s) => {
    const m = (s || '').match(/(\d{1,2}):(\d{2})\D+(\d{1,2})\D(\d{1,2})\D(\d{4})/);
    if (!m) return null;
    const [H, M, a, b, y] = m.slice(1).map(Number);
    const [d, mo] = b > 12 ? [b, a] : [a, b];
    return new Date(y, mo - 1, d, H, M);
  };
  const fmtLeft = (ms) => {
    if (ms == null) return '–';
    if (ms <= 0) return t('mkEnded');
    const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? `${d}d ${hh}h` : hh ? `${hh}h ${String(mm).padStart(2, '0')}m` : `${mm}m`;
  };
  // Own roster averages per group (saved by the Athletes list), with the group colors in roster order
  const rosterRef = () => {
    const ra = rosterAvgData();
    return {
      get: (name) => ra.get(name),
      color: (name) => { const i = ra.idxOf(name); return i >= 0 ? GROUP_COLORS[i % GROUP_COLORS.length] : 'var(--muted)'; },
      has: ra.has,
    };
  };
  const sumSkills = (o) => [...BASE.map((b) => o[b.k]), o.s1, o.s2].reduce((s, x) => s + (x || 0), 0);

  function parseMarket(tbl) {
    const head = Array.from((tbl.tHead || tbl).rows[0].cells).map((c) => c.textContent.trim());
    if (head.length < 14) return null;
    const lab = { age: head[2], maxid: head[3], group: head[4], emp: head[5], base: head.slice(6, 12), spec: [head[12], head[13]] };
    const rows = [];
    Array.from(tbl.tBodies[0]?.rows || []).forEach((tr) => {
      const c = tr.cells;
      if (c.length < 14) return;
      const a = c[1].querySelector('a[href*="atleta"]');
      if (!a) return;
      const col = (c[1].querySelector('font')?.getAttribute('color') || '').toUpperCase();
      const spans = $$('span', c[1]).map((s) => s.textContent.trim());
      const whenTxt = spans.find((s) => /\d:\d\d/.test(s)) || '';
      const priceTxt = spans.find((s) => s !== whenTxt && /\d/.test(s)) || '';
      const flag = c[0].querySelector('img');
      const v = (i) => toNum(c[i].textContent);
      const r = {
        tr, name: a.textContent.replace(/\s+/g, ' ').trim(), href: a.href,
        gender: col === '#E63CE6' ? 'F' : col === '#32A9AF' ? 'M' : '?',
        flagSrc: flag?.getAttribute('src') || null, flagTitle: stripTags(flag?.getAttribute('title') || ''),
        whenTxt, when: parseWhen(whenTxt), price: toNum(priceTxt),
        age: v(2), maxid: v(3), group: c[4].textContent.replace(/\s+/g, ' ').trim(), emp: v(5), s1: v(12), s2: v(13),
      };
      BASE.forEach((b, i) => { r[b.k] = v(6 + i); });
      r.total = sumSkills(r);
      // a price of 0 means no offer yet: shown, but left out of the price stats
      r.priced = r.price > 0 ? r.price : null;
      r.perMaxid = r.priced && r.maxid ? r.priced / r.maxid : null;
      rows.push(r);
    });
    return { rows, lab };
  }

  function marketPage() {
    const host = $('.page_details');
    const tbl = host && $('table.results', host);
    if (!tbl) return;
    const parsed = parseMarket(tbl);
    if (!parsed || !parsed.rows.length) return;
    const { rows, lab } = parsed;

    // "Results 1 to 20 of 888": the text right before the table; the last number is the total
    let total = null;
    for (let n = tbl.previousSibling; n && total == null; n = n.previousSibling) {
      const nums = (n.textContent || '').match(/\d[\d.\s]*/g);
      if (nums && nums.length >= 3) total = toNum(nums[nums.length - 1]);
    }
    // the pager is the next small table after the results (a few <br>/text nodes in between)
    let pager = tbl.nextElementSibling;
    while (pager && pager.tagName !== 'TABLE') pager = pager.nextElementSibling;
    if (pager && pager.rows.length === 1 && pager.querySelector('a')) pager.classList.add('mx-pager');

    const ref = rosterRef();
    const now = serverNow();
    rows.forEach((r) => {
      r.left = r.when ? r.when - now : null;
      const g = ref.get(r.group);
      if (g) { r.ref = g; r.refTotal = sumSkills(g); r.fit = r.total - r.refTotal; }
    });
    const groupNames = [...new Set(rows.map((r) => r.group))];

    const st = Object.assign({ grp: 'all', gender: 'all', q: '', fit: false, sort: { k: 'left', d: 1 }, heat: true, orig: false }, LS.get('market', {}));
    const save = () => LS.set('market', { grp: st.grp, gender: st.gender, fit: st.fit, sort: st.sort, heat: st.heat });
    let views = LS.get('marketViews', []);

    const ui = h('div', { class: 'mxr mxm' });
    tbl.parentNode.insertBefore(ui, tbl);
    const applyOrig = () => host.classList.toggle('mx-hide-orig-mk', !st.orig);
    applyOrig();

    const skill = (val, title) => h('span', { class: 'mxr-sk' + (val >= 15 ? ' top' : val >= 10 ? ' b' : ''), title: (title ? title + ': ' : '') + (val ?? '–'), style: st.heat ? { background: heatBg(val) } : null }, val ?? '–');
    const perFmt = (n) => fmt(n, n != null && n < 1 ? 2 : 1);
    const money = (n) => (n == null ? '–' : '€ ' + Number(n).toLocaleString(LOCALE, { maximumFractionDigits: 0, useGrouping: 'always' }));

    function view() {
      const q = st.q.toLowerCase();
      return rows.filter((r) => (st.grp === 'all' || r.group === st.grp)
        && (st.gender === 'all' || r.gender === st.gender)
        && (!st.fit || r.fit > 0)
        && (!q || r.name.toLowerCase().includes(q) || r.flagTitle.toLowerCase().includes(q)));
    }

    const cols = () => {
      const vis = view();
      const maxMx = Math.max(1, ...vis.map((r) => r.maxid || 0));
      const maxT = Math.max(1, ...vis.map((r) => r.total || 0));
      return [
        { k: 'name', label: t('athlete'), l: true, sv: (r) => r.name, td: (r) => h('div', { class: 'mxr-name' },
          h('span', { class: 'mxr-g ' + r.gender, title: r.gender === 'F' ? t('female') : r.gender === 'M' ? t('male') : '' }),
          r.flagSrc ? h('img', { src: r.flagSrc, title: r.flagTitle, alt: '' }) : null,
          h('a', { href: r.href }, r.name)) },
        { k: 'group', label: lab.group, l: true, sv: (r) => r.group, td: (r) => { const c = ref.color(r.group); return h('span', { class: 'mxr-grp', style: { background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c } }, r.group); } },
        { k: 'age', label: lab.age, sv: (r) => r.age, td: (r) => fmt(r.age) },
        { k: 'maxid', label: 'MAXID', sv: (r) => r.maxid, td: (r) => meter(r.maxid, maxMx) },
        { k: 'price', label: t('mkPrice'), sep: true, sv: (r) => r.price, td: (r) => h('span', { class: 'mxm-num' + (r.priced ? '' : ' mxm-dim') }, money(r.price)) },
        { k: 'per', label: t('mkPerMaxid'), title: t('mkPerMaxidT'), sv: (r) => r.perMaxid, td: (r) => h('span', { class: 'mxm-num' }, perFmt(r.perMaxid)) },
        { k: 'left', label: t('mkLeft'), title: t('mkLeftT'), sv: (r) => r.left, td: (r) => h('span', {
          class: 'mx-badge pill ' + (r.left == null ? '' : r.left <= 0 ? 'bad' : r.left < 3600e3 ? 'warn' : ''), title: r.whenTxt }, fmtLeft(r.left)) },
        { k: 'emp', label: lab.emp, title: lab.emp, sep: true, sv: (r) => r.emp, td: (r) => skill(r.emp, lab.emp) },
        ...BASE.map((b, i) => ({ k: b.k, label: lab.base[i], title: lab.base[i], sep: i === 0, sv: (r) => r[b.k], td: (r) => skill(r[b.k], lab.base[i]) })),
        { k: 's1', label: lab.spec[0], title: t('spec1T'), sep: true, sv: (r) => r.s1, td: (r) => skill(r.s1, lab.spec[0]) },
        { k: 's2', label: lab.spec[1], title: t('spec2T'), sv: (r) => r.s2, td: (r) => skill(r.s2, lab.spec[1]) },
        { k: 'total', label: 'Σ', title: t('totalT'), sep: true, sv: (r) => r.total, td: (r) => meter(r.total, maxT) },
        { k: 'fit', label: t('mkFit'), title: ref.has ? t('mkFitT') : t('mkNoRoster'), sv: (r) => r.fit, td: (r) => (r.fit == null ? h('span', { class: 'mxm-dim', title: t('mkNoRoster') }, '–')
          : h('span', { class: 'mx-badge pill ' + (r.fit > 0 ? 'good' : r.fit < 0 ? 'bad' : ''), title: t('mkFitTip', r.total, r.group, fmt(r.refTotal, 1), r.ref.n) }, (r.fit > 0 ? '+' : '') + fmt(r.fit, 1))) },
      ];
    };

    function sorted(list) {
      const c = cols().find((x) => x.k === st.sort.k) || cols().find((x) => x.k === 'left');
      return list.slice().sort((a, b) => {
        const A = c.sv(a), B = c.sv(b);
        if (A == null && B == null) return 0; if (A == null) return 1; if (B == null) return -1;
        return (typeof A === 'string' ? A.localeCompare(B, LOCALE) : A - B) * st.sort.d;
      });
    }

    function exportCSV() {
      const hdr = [t('csvName'), lab.group, t('csvGender'), lab.age, 'MAXID', t('mkPrice'), t('mkPerMaxid'), t('mkLeft'), lab.emp, ...lab.base, lab.spec[0], lab.spec[1], t('csvTotal'), t('mkFit')];
      downloadCSV(t('mkCsvFile'), hdr, sorted(view()).map((r) => [r.name, r.group, r.gender, r.age, r.maxid, r.price, r.perMaxid == null ? '' : r.perMaxid.toFixed(2), r.whenTxt, r.emp, ...BASE.map((b) => r[b.k]), r.s1, r.s2, r.total, r.fit == null ? '' : r.fit.toFixed(1)]));
    }

    const viewName = () => [st.grp === 'all' ? t('all') : st.grp, st.gender === 'M' ? '♂' : st.gender === 'F' ? '♀' : '', st.fit ? '★' : '', st.q ? '“' + st.q + '”' : ''].filter(Boolean).join(' · ');

    function render() {
      const minBy = (fn) => rows.filter((r) => fn(r) != null).sort((a, b) => fn(a) - fn(b))[0];
      const cheap = minBy((r) => r.priced), value = minBy((r) => r.perMaxid), soon = minBy((r) => (r.left > 0 ? r.left : null));
      const nFit = rows.filter((r) => r.fit > 0).length;
      const cards = h('div', { class: 'mx-tiles' },
        tile(t('mkResults'), rows.length, total != null ? t('mkResultsS', rows.length, fmt(total)) : ''),
        tile(t('mkCheapest'), money(cheap?.priced), cheap?.name),
        tile(t('mkAvgPrice'), money(avg(rows.map((r) => r.priced)))),
        tile(t('mkBestValue'), perFmt(value?.perMaxid), value ? value.name + ' · ' + t('mkBestValueS') : t('mkBestValueS')),
        tile(t('mkEnding'), fmtLeft(soon?.left), soon?.name, { cls: soon && soon.left < 3600e3 ? 'warn' : '' }),
        ref.has
          ? tile(t('mkFits'), nFit, t('mkFitsS'), { cls: (nFit ? 'good' : '') + (st.fit ? ' on' : ''), title: t('clickFilter'), onclick: () => { st.fit = !st.fit; save(); render(); } })
          : tile(t('mkFits'), '–', t('mkNoRoster')));

      const chip = (on, label, onclick, extra) => h('button', { class: 'mx-chip' + (on ? ' on' : ''), onclick }, extra || null, label);
      const search = h('input', { type: 'text', placeholder: t('mkSearch'), value: st.q, oninput: (e) => { st.q = e.target.value; renderTable(); } });
      const tools1 = h('div', { class: 'mxr-tools' },
        chip(st.grp === 'all', [t('all'), h('span', { class: 'n' }, rows.length)], () => { st.grp = 'all'; save(); render(); }),
        groupNames.map((g) => chip(st.grp === g, [g, h('span', { class: 'n' }, rows.filter((r) => r.group === g).length)], () => { st.grp = g; save(); render(); },
          h('span', { class: 'dot', style: { background: ref.color(g) } }))));
      const tools2 = h('div', { class: 'mxr-tools' },
        ['all', 'M', 'F'].map((g) => chip(st.gender === g, g === 'all' ? t('both') : g === 'M' ? t('maleChip') : t('femaleChip'), () => { st.gender = g; save(); render(); })),
        ref.has ? chip(st.fit, t('mkFits'), () => { st.fit = !st.fit; save(); render(); }) : null,
        h('div', { class: 'mxr-search' }, search),
        h('button', { class: 'mx-btn', title: t('heatT'), onclick: () => { st.heat = !st.heat; save(); render(); } }, st.heat ? t('heatOn') : t('heatOff')),
        h('button', { class: 'mx-btn', title: t('csvT'), onclick: exportCSV }, '⇩ CSV'),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow')));

      // saved views: named sets of the filters above, kept in localStorage
      const same = (v) => v.grp === st.grp && v.gender === st.gender && !!v.fit === !!st.fit && (v.q || '') === st.q;
      const tools3 = h('div', { class: 'mxr-tools mxm-views' },
        views.map((v, i) => h('span', { class: 'mx-chip mxm-view' + (same(v) ? ' on' : '') },
          h('span', { onclick: () => { Object.assign(st, { grp: v.grp, gender: v.gender, fit: !!v.fit, q: v.q || '' }); save(); render(); } }, v.name),
          h('span', { class: 'x', title: t('mkRemove'), onclick: () => { views = views.filter((_, j) => j !== i); LS.set('marketViews', views); render(); } }, '×'))),
        views.some(same) ? null : h('button', { class: 'mx-btn', title: t('mkSaveT'), onclick: () => {
          views = [...views, { name: viewName(), grp: st.grp, gender: st.gender, fit: st.fit, q: st.q }];
          LS.set('marketViews', views); render();
        } }, t('mkSave')));

      const tableWrap = h('div', { class: 'mx-table-wrap' });
      const legend = h('div', { class: 'mxr-legend' },
        h('span', {}, '0', h('i', { class: 'sw', style: { background: `linear-gradient(90deg,${heatBg(0)},${heatBg(10)},${heatBg(20)})` } }), '20'),
        h('span', {}, h('b', {}, t('lgBold')), ' ≥ 10 · ', h('b', {}, t('lgTop')), ' ≥ 15'),
        h('span', {}, t('mkPageNote')));

      function renderTable() {
        const cs = cols();
        const list = sorted(view());
        const thead = h('thead', {}, h('tr', {}, cs.map((c) => h('th', {
          class: (c.l ? 'l ' : '') + (c.sep ? 'sep ' : '') + (st.sort.k === c.k ? 'sorted' : ''), title: c.title || null,
          onclick: () => { st.sort = { k: c.k, d: st.sort.k === c.k ? -st.sort.d : (['name', 'group', 'age', 'price', 'per', 'left'].includes(c.k) ? 1 : -1) }; save(); renderTable(); },
        }, c.label, st.sort.k === c.k ? (st.sort.d > 0 ? ' ▲' : ' ▼') : ''))));
        const tbody = h('tbody', {}, list.map((r) => h('tr', {}, cs.map((c) => h('td', { class: (c.l ? 'l ' : '') + (c.sep ? 'sep' : '') }, c.td(r))))));
        tableWrap.replaceChildren(list.length ? h('table', { class: 'mx-table sortable' }, thead, tbody) : h('div', { class: 'mx-empty-state' }, t('mkEmpty')));
      }

      ui.replaceChildren(cards, tools1, tools2, tools3, tableWrap, legend);
      renderTable();
    }
    render();
  }

  /* ------------------------------------------------------------------ *
   * Finances (budget_det.php)
   * Direct table.tablesorter children of .page_details, one per period
   * (this week, last week, last season). Rows by position:
   * 0 title · 1 income/expense headings · 2 two nested tables with
   * label | (empty) | amount · 3 totals (<b>label</b> amount) · 4 balance.
   * Above them, <b>label</b> value pairs: current cash and loyalty.
   * ------------------------------------------------------------------ */
  const euro = (n) => (n == null ? '–' : '€ ' + Number(n).toLocaleString(LOCALE, { maximumFractionDigits: 0, useGrouping: 'always' }));
  const signed = (n) => (n == null ? '–' : (n > 0 ? '+' : n < 0 ? '−' : '') + euro(Math.abs(n)));
  // "Label: € 1 000": the label is in a <b> or plain text before the colon
  const bLabelValue = (cell) => {
    const txt = (cell?.textContent || '').replace(/\s+/g, ' ').trim();
    const b = cell?.querySelector('b');
    const label = b ? b.textContent.trim() : txt.slice(0, txt.lastIndexOf(':') + 1);
    return { label: label.replace(/:\s*$/, ''), v: toNum(txt.slice(txt.indexOf(label) + label.length)) };
  };

  function parseBudget(host) {
    const items = (cell) => {
      const tb = cell?.querySelector('table');
      return tb ? Array.from(tb.rows).map((r) => ({ label: r.cells[0]?.textContent.replace(/\s+/g, ' ').trim(), v: toNum(r.cells[r.cells.length - 1]?.textContent) })).filter((x) => x.label && x.v != null) : [];
    };
    const periods = $$(':scope > table.tablesorter', host).map((tb) => {
      const R = tb.rows;
      if (R.length < 5 || R[2].cells.length < 2) return null;
      return {
        tb, title: R[0].textContent.replace(/\s+/g, ' ').trim(),
        heads: Array.from(R[1].cells).map((c) => c.textContent.trim()),
        inc: items(R[2].cells[0]), exp: items(R[2].cells[1]),
        tInc: bLabelValue(R[3].cells[0]), tExp: bLabelValue(R[3].cells[1]), bal: bLabelValue(R[4].cells[0]),
      };
    }).filter(Boolean);
    // <b>Label:</b> value<br> pairs above the tables
    // (each pair is wrapped in a span, so "show original" can hide it with the tables)
    const facts = $$(':scope > b', host).map((b) => {
      const wrap = h('span', { class: 'mxf-fact' });
      b.before(wrap);
      let s = '';
      for (let n = b; n && n.nodeName !== 'BR' && (n === b || n.nodeName !== 'B'); n = wrap.nextSibling) {
        if (n !== b) s += n.textContent;
        wrap.append(n);
      }
      return { label: b.textContent.trim().replace(/:\s*$/, ''), text: s.trim() };
    });
    return { periods, facts };
  }

  function financePage() {
    const host = $('.page_details');
    if (!host) return;
    const { periods, facts } = parseBudget(host);
    if (!periods.length) return;
    // remember the category names, so the transactions page can group by them
    LS.set('finCats', [...new Set(periods.flatMap((p) => [...p.inc, ...p.exp].map((x) => x.label)))]);

    const st = Object.assign({ orig: false }, LS.get('finance', {}));
    const ui = h('div', { class: 'mxr mxf' });
    host.insertBefore(ui, periods[0].tb);
    const applyOrig = () => { host.classList.toggle('mx-hide-orig-fin', !st.orig); };
    applyOrig();

    const cur = periods[0], prev = periods[1];
    const factTiles = facts.map((f) => {
      const n = toNum(f.text);
      return tile(f.label, /\//.test(f.text) || n == null ? f.text : euro(n), null, { cls: n != null && n < 0 ? 'bad' : '' });
    });
    const balTiles = periods.map((p) => tile(p.title, signed(p.bal.v), p.bal.label, { cls: p.bal.v < 0 ? 'bad' : 'good' }));

    // income vs expenses: one row per period, each on its own scale (a season is ~10× a week)
    const chart = h('div', { class: 'mx-card mxf-cmp' }, sectionTitle(t('fnIncVsExp'),
      h('span', { class: 'mxf-key' }, h('i', { class: 'inc' }), cur.heads[0] || '', h('i', { class: 'exp' }), cur.heads[1] || '')),
      periods.map((p) => {
        const max = Math.max(1, p.tInc.v || 0, p.tExp.v || 0);
        const bar = (v, cls) => h('div', { class: 'mxf-bar' }, h('i', { class: cls, style: { width: ((v || 0) / max * 100).toFixed(1) + '%' } }), h('span', {}, euro(v)));
        return h('div', { class: 'mxf-cmp-row' },
          h('div', { class: 'mxf-cmp-t' }, p.title, h('span', { class: 'mx-badge pill ' + (p.bal.v < 0 ? 'bad' : 'good') }, signed(p.bal.v))),
          bar(p.tInc.v, 'inc'), bar(p.tExp.v, 'exp'));
      }));

    // category breakdown per period; the current week also shows the change against last week
    const breakdown = (p, cmp) => {
      const side = (list, total, cls, head, other) => {
        const max = Math.max(1, ...list.map((x) => x.v));
        return h('div', { class: 'mxf-side' },
          h('div', { class: 'mxf-side-t' }, h('span', {}, head), h('b', { class: cls }, euro(total))),
          list.slice().sort((a, b) => b.v - a.v).map((x) => {
            const before = other ? other.find((o) => o.label === x.label) : undefined;
            const d = other ? x.v - (before ? before.v : 0) : null;
            return h('div', { class: 'mxf-item', title: total ? Math.round(x.v / total * 100) + '% ' + t('fnShare') : '' },
              h('div', { class: 'mxf-item-l' }, h('span', {}, x.label),
                other && !before ? h('span', { class: 'mx-badge info' }, t('fnNew')) : null,
                d ? h('span', { class: 'mxf-d ' + ((d > 0) === (cls === 'inc') ? 'up' : 'down'), title: t('fnVsPrev', cmp.title) }, (d > 0 ? '▲ ' : '▼ ') + euro(Math.abs(d))) : null,
                h('b', {}, euro(x.v))),
              h('div', { class: 'mxf-track' }, h('i', { class: cls, style: { width: (x.v / max * 100).toFixed(1) + '%' } })));
          }));
      };
      return h('div', { class: 'mx-card mxf-period' },
        sectionTitle(p.title, h('span', {}, cmp ? h('span', { class: 'mxf-vs' }, t('fnVsPrev', cmp.title)) : null,
          h('span', { class: 'mx-badge pill ' + (p.bal.v < 0 ? 'bad' : 'good'), title: p.bal.label }, p.bal.label + ': ' + signed(p.bal.v)))),
        h('div', { class: 'mxf-sides' },
          side(p.inc, p.tInc.v, 'inc', p.heads[0], cmp?.inc),
          side(p.exp, p.tExp.v, 'exp', p.heads[1], cmp?.exp)));
    };

    const origBtn = h('button', { class: 'mx-btn', title: t('origT'), onclick: () => {
      st.orig = !st.orig; LS.set('finance', { orig: st.orig }); applyOrig(); origBtn.textContent = st.orig ? t('origHide') : t('origShow');
    } }, st.orig ? t('origHide') : t('origShow'));
    const tools = h('div', { class: 'mxr-tools mxf-tools' }, origBtn);
    ui.replaceChildren(h('div', { class: 'mx-tiles' }, factTiles, balTiles), chart,
      ...periods.map((p, i) => breakdown(p, i === 0 && prev ? prev : null)), tools);
  }

  /* ------------------------------------------------------------------ *
   * Last transactions (last_budget.php)
   * One table.tablesorter: thead (title row, then headings), tbody rows
   * date | type | reason | amount. Expenses have a red <font> amount.
   * ------------------------------------------------------------------ */
  const isRed = (el) => {
    let s = (el?.getAttribute('color') || el?.style.color || '').trim().toLowerCase();
    if (s === 'red') return true;
    const hx = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hx) { const x = hx[1].length === 3 ? hx[1].replace(/./g, '$&$&') : hx[1]; s = `rgb(${parseInt(x.slice(0, 2), 16)},${parseInt(x.slice(2, 4), 16)},${parseInt(x.slice(4, 6), 16)})`; }
    const c = parseRGB(s);
    return !!c && c.r > 180 && c.g < 80 && c.b < 80;
  };

  function transactionsPage() {
    const host = $('.page_details');
    const tbl = host && $(':scope > table.tablesorter', host);
    if (!tbl || !tbl.tHead) return;
    const hr = tbl.tHead.rows;
    const heads = Array.from(hr[hr.length - 1].cells).map((c) => c.textContent.trim());
    if (heads.length < 4) return;
    const title = hr.length > 1 ? hr[0].textContent.trim() : '';
    const cats = LS.get('finCats', []).slice().sort((a, b) => b.length - a.length);
    const rows = Array.from(tbl.tBodies[0]?.rows || []).filter((r) => r.cells.length >= 4).map((r) => {
      const c = r.cells;
      const reason = c[2].textContent.replace(/\s+/g, ' ').trim();
      const exp = isRed(c[3].querySelector('font')) || isRed(c[3]);
      const v = toNum(c[3].textContent);
      // category: a known name from the finances page, else the reason without its last " - part"
      const cat = cats.find((k) => reason === k || reason.startsWith(k + ' ')) || (reason.includes(' - ') ? reason.slice(0, reason.lastIndexOf(' - ')) : reason);
      const date = c[0].textContent.trim();
      const m = date.match(/(\d{1,2})\D(\d{1,2})\D(\d{4})/);
      return { date, day: m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : date, type: c[1].textContent.trim(), reason, cat, exp, v, amt: v == null ? null : exp ? -v : v };
    }).filter((r) => r.v != null);
    if (!rows.length) return;
    const typeName = { inc: rows.find((r) => !r.exp)?.type || '+', exp: rows.find((r) => r.exp)?.type || '−' };

    const st = Object.assign({ kind: 'all', q: '', sort: { k: 'day', d: -1 }, orig: false }, LS.get('transactions', {}));
    const save = () => LS.set('transactions', { kind: st.kind, sort: st.sort });
    const ui = h('div', { class: 'mxr mxf' });
    host.insertBefore(ui, tbl);
    const applyOrig = () => host.classList.toggle('mx-hide-orig-fin', !st.orig);
    applyOrig();

    const sum = (list) => list.reduce((s, r) => s + r.v, 0);
    const inc = sum(rows.filter((r) => !r.exp)), exp = sum(rows.filter((r) => r.exp));

    // daily bars: income up, expenses down, on one scale
    const days = [...new Set(rows.map((r) => r.day))].sort();
    const byDay = days.map((d) => { const rs = rows.filter((r) => r.day === d); return { d, label: rs[0].date, inc: sum(rs.filter((r) => !r.exp)), exp: sum(rs.filter((r) => r.exp)) }; });
    const dmax = Math.max(1, ...byDay.map((x) => Math.max(x.inc, x.exp)));
    const W = Math.max(900, byDay.length * 40), H = 160, mid = H / 2, bw = Math.min(36, W / byDay.length - 10);
    const svgNS = 'http://www.w3.org/2000/svg';
    const S = (tag, a) => { const e = document.createElementNS(svgNS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const svg = S('svg', { viewBox: `0 0 ${W} ${H + 18}`, class: 'mxf-days' });
    svg.append(S('line', { x1: 0, x2: W, y1: mid, y2: mid, class: 'axis' }));
    byDay.forEach((x, i) => {
      const cx = (i + 0.5) * (W / byDay.length);
      const hi = (x.inc / dmax) * (mid - 6), he = (x.exp / dmax) * (mid - 6);
      const g = S('g', {});
      const tip = S('title', {}); tip.textContent = `${x.label}\n${typeName.inc}: ${euro(x.inc)}\n${typeName.exp}: ${euro(x.exp)}\n${t('fnNet')}: ${signed(x.inc - x.exp)}`;
      g.append(tip, S('rect', { x: cx - bw / 2, y: mid - hi, width: bw, height: Math.max(hi, 0), rx: 3, class: 'inc' }), S('rect', { x: cx - bw / 2, y: mid, width: bw, height: Math.max(he, 0), rx: 3, class: 'exp' }));
      const lb = S('text', { x: cx, y: H + 14, 'text-anchor': 'middle' }); lb.textContent = x.label.slice(0, 5);
      g.append(lb);
      svg.append(g);
    });

    // totals per category, income and expenses apart
    const catList = (isExp) => {
      const m = new Map();
      rows.filter((r) => r.exp === isExp).forEach((r) => m.set(r.cat, (m.get(r.cat) || 0) + r.v));
      const list = [...m].sort((a, b) => b[1] - a[1]);
      const max = Math.max(1, ...list.map((x) => x[1]));
      return h('div', { class: 'mxf-side' },
        h('div', { class: 'mxf-side-t' }, h('span', {}, isExp ? typeName.exp : typeName.inc), h('b', { class: isExp ? 'exp' : 'inc' }, euro(isExp ? exp : inc))),
        list.map(([k, v]) => h('div', { class: 'mxf-item' },
          h('div', { class: 'mxf-item-l' }, h('span', {}, k), h('b', {}, euro(v))),
          h('div', { class: 'mxf-track' }, h('i', { class: isExp ? 'exp' : 'inc', style: { width: (v / max * 100).toFixed(1) + '%' } })))));
    };

    const tableWrap = h('div', { class: 'mx-table-wrap' });
    const view = () => {
      const q = st.q.toLowerCase();
      return rows.filter((r) => (st.kind === 'all' || (st.kind === 'exp') === r.exp) && (!q || r.reason.toLowerCase().includes(q)));
    };
    const cols = [
      { k: 'day', label: heads[0], l: true, sv: (r) => r.day, td: (r) => r.date },
      { k: 'type', label: heads[1], l: true, sv: (r) => (r.exp ? 1 : 0), td: (r) => h('span', { class: 'mx-badge ' + (r.exp ? 'bad' : 'good') }, r.type) },
      { k: 'cat', label: heads[2], l: true, sv: (r) => r.reason, td: (r) => r.reason },
      { k: 'amt', label: heads[3], sv: (r) => r.amt, td: (r) => h('b', { class: 'mxf-amt ' + (r.exp ? 'exp' : 'inc') }, signed(r.amt)) },
    ];
    function renderTable() {
      const c = cols.find((x) => x.k === st.sort.k) || cols[0];
      const list = view().sort((a, b) => { const A = c.sv(a), B = c.sv(b); return (typeof A === 'string' ? A.localeCompare(B, LOCALE) : A - B) * st.sort.d; });
      const thead = h('thead', {}, h('tr', {}, cols.map((x) => h('th', {
        class: (x.l ? 'l ' : '') + (st.sort.k === x.k ? 'sorted' : ''),
        onclick: () => { st.sort = { k: x.k, d: st.sort.k === x.k ? -st.sort.d : (x.k === 'cat' || x.k === 'type' ? 1 : -1) }; save(); renderTable(); },
      }, x.label, st.sort.k === x.k ? (st.sort.d > 0 ? ' ▲' : ' ▼') : ''))));
      const tbody = h('tbody', {}, list.map((r) => h('tr', {}, cols.map((x) => h('td', { class: x.l ? 'l' : '' }, x.td(r))))));
      tableWrap.replaceChildren(list.length ? h('table', { class: 'mx-table sortable' }, thead, tbody) : h('div', { class: 'mx-empty-state' }, t('fnEmpty')));
    }

    function render() {
      const chip = (k, label) => h('button', { class: 'mx-chip' + (st.kind === k ? ' on' : ''), onclick: () => { st.kind = k; save(); render(); } }, label);
      const tools = h('div', { class: 'mxr-tools' },
        chip('all', t('fnAll')), chip('inc', typeName.inc), chip('exp', typeName.exp),
        h('div', { class: 'mxr-search' }, h('input', { type: 'text', placeholder: t('fnSearch'), value: st.q, oninput: (e) => { st.q = e.target.value; renderTable(); } })),
        h('button', { class: 'mx-btn', title: t('csvT'), onclick: () => downloadCSV(t('fnCsvFile'), heads, view().map((r) => [r.date, r.type, r.reason, r.amt])) }, '⇩ CSV'),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow')));
      ui.replaceChildren(
        h('div', { class: 'mx-tiles' },
          tile(typeName.inc, euro(inc), title, { cls: 'good' }),
          tile(typeName.exp, euro(exp), title, { cls: 'bad' }),
          tile(t('fnNet'), signed(inc - exp), title, { cls: inc - exp < 0 ? 'bad' : 'good' }),
          tile(t('fnCount'), rows.length, title)),
        h('div', { class: 'mx-card' }, sectionTitle(t('fnByDay'), h('span', { class: 'mxf-key' }, h('i', { class: 'inc' }), typeName.inc, h('i', { class: 'exp' }), typeName.exp)), h('div', { class: 'mxf-days-wrap' }, svg)),
        h('div', { class: 'mx-card' }, sectionTitle(t('fnByCat')), h('div', { class: 'mxf-sides' }, catList(false), catList(true))),
        tools, tableWrap);
      renderTable();
    }
    render();
  }

  /* ------------------------------------------------------------------ *
   * Athlete page (atleta_one.php): radar + summary
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * Athlete page layout: groups the legacy blocks into cards
   * (profile, skills, rankings, notes). Runs before athletePage(), so the
   * radar lands right after the skills card.
   * ------------------------------------------------------------------ */
  // Club names, cached from any page that shows them in full, keyed by the
  // club link's query string. Used where the site cuts names short.
  const clubKey = (href) => { try { return new URL(href, location.href).search; } catch (e) { return ''; } };
  function rememberClubs() {
    const map = LS.get('clubs', {}); let changed = false;
    const put = (key, name, force) => {
      name = (name || '').replace(/\s+/g, ' ').trim();
      if (!key || !name || /(\.\.\.|…)$/.test(name) || name.length > 80) return;
      if (map[key] === name || (!force && (map[key] || '').length >= name.length)) return;
      map[key] = name; changed = true;
    };
    $$('#middle_section a[href*="dettagli_societa"], #right_section a[href*="dettagli_societa"], #right_part a[href*="dettagli_societa"]').forEach((a) => put(clubKey(a.href), a.textContent));
    // the club's own page: its heading (own text only, without the [ID] tag) is authoritative
    const head = /dettagli_societa\.php$/.test(path) && location.search && $('#middle_section h3, .page_details h3, #middle_section h2');
    if (head) put(location.search, Array.from(head.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(''), true);
    if (!changed) return;
    const keys = Object.keys(map);
    if (keys.length > 400) keys.slice(0, keys.length - 400).forEach((k) => delete map[k]);
    LS.set('clubs', map);
  }

  function athleteLayout() {
    const mid = $('#middle_section');
    const rows = mid ? $$(':scope > .main_row', mid) : [];
    if (!rows.length || mid.classList.contains('mx-athlete')) return;
    mid.classList.add('mx-athlete');
    const card = (cls, els) => {
      if (!els.length) return null;
      const c = h('section', { class: 'mx-card ' + cls });
      els[0].before(c);
      c.append(...els);
      return c;
    };
    // previous/next arrows -> chevrons
    $('.head_section img.arrow_left', mid)?.replaceWith(svgIcon('chevL', 16));
    $('.head_section img.arrow_right', mid)?.replaceWith(svgIcon('chevR', 16));
    // profile: photo + info tiles
    const hero = rows.find((r) => r.querySelector('.face_area'));
    if (hero) {
      hero.classList.add('mx-card', 'mx-hero');
      $$('.row02 > div', hero).forEach((d) => {
        const lab = d.querySelector(':scope > span:first-child');
        if (lab && !d.textContent.replace(lab.textContent, '').trim()) {
          d.classList.add('mx-empty');
          const v = d.querySelector(':scope > strong');
          if (v) v.textContent = '–'; else d.append(h('strong', {}, '–'));
        }
      });
      // the site cuts long club names ("Club Na..."): show the full name when it was seen on another page
      $$('.row02 a[href*="dettagli_societa"]', hero).forEach((a) => {
        const shown = a.textContent.trim();
        const cut = shown.replace(/(\.\.\.|…)$/, '');
        if (cut === shown) return;
        const full = (LS.get('clubs', {})[clubKey(a.href)] || '');
        if (full.length > cut.length && full.startsWith(cut)) (a.querySelector('strong') || a).textContent = full;
        a.title = full.startsWith(cut) && full ? full : shown;
      });
    }
    // "Clubs interested in the athlete: N" -> label + count badge
    const fans = $(':scope > a.ui4-bookmark-club-count', mid);
    if (fans) {
      const m = fans.textContent.trim().match(/^(.*?)[\s:]*(\d+)\s*$/);
      if (m) {
        const n = Number(m[2]);
        fans.replaceChildren(svgIcon('bookmark', 15), h('span', {}, m[1]), h('span', { class: 'mx-badge pill ' + (n ? 'info' : '') }, m[2]));
      }
    }
    // skills: the contiguous run of rows with skill bars or the specialty heading
    const isSkill = (r) => r.querySelector(':scope > .box > div.row, :scope > h4.heading');
    const run = [];
    for (const r of rows) if (isSkill(r) && (!run.length || run[run.length - 1].nextElementSibling === r)) run.push(r);
    card('mx-skills', run);
    // rankings table + its footer legend
    const rk = rows.find((r) => r.querySelector(':scope > .text_row'));
    if (rk) {
      const els = [rk];
      const nx = rk.nextElementSibling;
      if (nx?.matches('.main_row') && nx.querySelector('.head_row') && !nx.querySelector('.text_row')) els.push(nx);
      card('mx-rank', els);
    }
    // notes form
    rows.filter((r) => r.querySelector('textarea')).forEach((r) => r.classList.add('mx-card'));
  }

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
    const ref = rosterAvgData().get(groupName, aidOf(location.href));
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
    svg.append(S('polygon', { points: poly(me), fill: 'color-mix(in srgb, var(--accent) 25%, transparent)', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    me.forEach((v, i) => { const [x, y] = pt(i, v); const c = S('circle', { cx: x, cy: y, r: 3.2, fill: 'var(--accent)' }); const tt = S('title', {}); tt.textContent = `${axes[i].k}: ${v}`; c.append(tt); svg.append(c); });

    const total = me.reduce((s, x) => s + (x || 0), 0);
    const specAvg = avg(spec.map((a) => a.v));
    const best = axes.reduce((b, a) => (a.v > b.v ? a : b)).k;
    const weak = axes.reduce((b, a) => (a.v < b.v ? a : b)).k;
    const refTotal = refVals && refVals.every((x) => x != null) ? refVals.reduce((s, x) => s + x, 0) : null;

    const panel = h('div', { class: 'mxa' },
      sectionTitle(t('profile'), groupName || null),
      h('div', {}, svg, h('div', { class: 'mxa-leg' }, h('span', {}, h('i', { style: { background: 'var(--accent)' } }), t('athlete')),
        refVals ? h('span', {}, h('i', { style: { background: '#94a3b8' } }), t('avgOf', groupName, ref.n)) : h('span', {}, t('openRoster')))),
      h('div', { class: 'mx-tiles' },
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
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    // event families (pictograms for the site's 16x16_<event><m|f>.png images)
    evSprint: '<circle cx="15" cy="4.5" r="2"/><path d="M7 21l3.5-6 3 2.5V22"/><path d="M5.5 11 9 8l4 1.5 2 3.5h3.5"/><path d="m9 8 1.5 7"/>',
    evHurdles: '<path d="M6 20V8M18 20V8M4 8h16M6 12h12"/>',
    evDistance: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M10 2h4M12 2v3"/>',
    evSteeple: '<path d="M6 14V5M18 14V5M4 5h16M6 9h12"/><path d="M3 19c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0"/>',
    evWalk: '<path d="M8 3c1.6 0 2.5 2 2.5 4.5S9.6 12 8.5 12h-1C6.4 12 5.5 10 5.5 7.5S6.4 3 8 3zM6 15h4v1.5a2 2 0 0 1-4 0z"/><path d="M16 8c1.6 0 2.5 2 2.5 4.5S17.6 17 16.5 17h-1c-1.1 0-2-2-2-4.5S14.4 8 16 8zM14 20h4"/>',
    evHigh: '<path d="M5 21V7M19 21V7M3 7h18"/><path d="M6 17c3-6 8-8 13-6"/>',
    evPole: '<path d="M4 21 17 4"/><path d="M14 6h7M14 6V3"/><path d="M3 21h8"/>',
    evLong: '<path d="M3 15c3-7 9-8 13-2"/><path d="m13.5 12.5 2.5.5.7-2.5"/><path d="M3 20h18"/><path d="M15 20v-2h6"/>',
    evShot: '<circle cx="12" cy="11" r="5"/><path d="M4 20h16"/>',
    evDiscus: '<ellipse cx="12" cy="12" rx="9" ry="4.5"/><ellipse cx="12" cy="12" rx="2.5" ry="1.3"/>',
    evHammer: '<circle cx="17" cy="17" r="3.5"/><path d="M4 4l10.5 10.5M3 8l5-5"/>',
    evJavelin: '<path d="M3 21 20 4"/><path d="m21 3-1.5 4.5-3-3z"/>',
    evRelay: '<path d="M4 18 15 7"/><path d="M10 7h5v5"/><circle cx="18" cy="18" r="3"/>',
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
  const EVENT_ICONS = [
    [/^(100|200|400)$/, 'evSprint'], [/^110$/, 'evHurdles'], [/^(800|1500|5000|10000)$/, 'evDistance'],
    [/^steeplechase/, 'evSteeple'], [/^walk/, 'evWalk'], [/^highjump/, 'evHigh'], [/^polevault/, 'evPole'],
    [/^(longjump|triplejump)/, 'evLong'], [/^shotput/, 'evShot'], [/^discus/, 'evDiscus'], [/^hammer/, 'evHammer'],
    [/^javelin/, 'evJavelin'], [/^relay/, 'evRelay'],
  ];
  // event image -> pictogram in the gender color (16x16_<event><m|f>.png)
  function eventIcons(scope = document) {
    $$('img[src*="/gare/"]', scope).forEach((im) => {
      const m = (im.getAttribute('src') || '').split('/').pop().match(/^\d+x\d+_([a-z0-9]+?)([mf])\.(png|gif|jpg)$/i);
      if (!m) return;
      const rule = EVENT_ICONS.find(([re]) => re.test(m[1].toLowerCase()));
      if (!rule) return;
      im.replaceWith(h('span', { class: 'mx-evi ' + (m[2].toLowerCase() === 'f' ? 'F' : 'M'), title: stripTags(im.getAttribute('title') || im.getAttribute('alt') || '') || null }, svgIcon(rule[1], 14)));
    });
  }

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
      // actions only: menu entries, iconNN links and list/heading links in the market and coach boxes
      // (not names inside a sentence, e.g. the club with the best offer)
      const inMenu = a.closest('.right_menu') || /^icon\d/.test(a.className) || (a.closest('.market, .coach') && a.closest('li, h4'));
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
   * Page intro text (.user_tip): one line, expandable. The choice is
   * remembered for every page.
   * ------------------------------------------------------------------ */
  function pageTips() {
    $$('.user_tip').forEach((tip) => {
      if (tip.closest('.mx-tip')) return;
      const wrap = h('div', { class: 'mx-tip' + (LS.get('tipOpen', false) ? ' open' : '') });
      const btn = h('button', { class: 'mx-tip-btn', title: t('tipT') });
      const label = () => { btn.textContent = wrap.classList.contains('open') ? t('tipLess') : t('tipMore'); };
      const toggle = (e) => { e?.stopPropagation(); const o = !wrap.classList.contains('open'); wrap.classList.toggle('open', o); LS.set('tipOpen', o); label(); };
      btn.addEventListener('click', toggle);
      wrap.addEventListener('click', (e) => { if (!wrap.classList.contains('open') && !wrap.classList.contains('short') && !e.target.closest('a')) toggle(e); });
      tip.before(wrap);
      wrap.append(svgIcon('info', 16), tip, btn);
      label();
      // tips that fit on one line don't need the toggle
      const lh = parseFloat(getComputedStyle(tip).lineHeight) || 19;
      if (tip.scrollHeight <= lh * 1.6) wrap.classList.add('short');
    });
  }

  /* ------------------------------------------------------------------ *
   * Right column: forms on one row, coach training plan with bars
   * ------------------------------------------------------------------ */
  function rightColumn() {
    const cols = $$('#right_section, #right_part');
    // forms whose visible controls are just inputs/selects/buttons -> one row
    cols.forEach((col) => $$('form', col).forEach((f) => {
      const vis = Array.from(f.children).filter((c) => !c.matches('input[type=hidden], script'));
      if (vis.length >= 2 && vis.every((c) => c.matches('input, select, button'))) f.classList.add('mx-form-row');
    }));
    // coach box: "Skill: <span>25%</span>" items + "Total: <strong>100%</strong>"
    cols.forEach((col) => $$('.coach ul', col).forEach((ul) => {
      const lis = Array.from(ul.children);
      const pct = (el) => toNum(el?.textContent);
      if (!lis.some((li) => pct(li.querySelector(':scope > span')) != null)) return;
      const label = (li, v) => li.textContent.replace(v.textContent, '').replace(/[:\s]+$/, '').trim();
      const plan = h('div', { class: 'mx-plan' });
      lis.forEach((li) => {
        const sp = li.querySelector(':scope > span'); const st = li.querySelector(':scope > strong');
        if (sp && pct(sp) != null) {
          const v = pct(sp);
          plan.append(h('span', {}, label(li, sp)),
            h('span', { class: 'mx-bar', title: sp.textContent.trim() }, h('i', { style: { width: Math.max(2, Math.min(100, v)) + '%', background: 'var(--accent)' } })),
            h('span', { class: 'val' }, sp.textContent.trim()));
        } else if (st && pct(st) != null) {
          const v = pct(st);
          plan.append(h('span', { class: 'tot' }, label(li, st)), h('span', { class: 'tot' }), h('span', { class: 'tot val' + (v !== 100 ? ' bad' : '') }, st.textContent.trim()));
        } else if (li.textContent.trim()) {
          plan.append(h('span', { class: 'cap' }, li.textContent.replace(/[:\s]+$/, '').trim()));
        }
      });
      ul.replaceWith(plan);
    }));
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * Modules. Each one runs inside its own try/catch, so a page that
   * changes does not break the rest. Page panels (with a path test) show
   * a notice when they fail, and their half-built UI is removed so the
   * original page stays usable. Modules with a label can be turned off
   * in the settings panel.
   * ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------ *
   * Sidebar: each section folds under its heading. Sections are keyed by
   * position (language-independent); the one with the current page stays open.
   * ------------------------------------------------------------------ */
  function sidebarSections() {
    const side = $('#left_section');
    if (!side) return;
    const closed = new Set(LS.get('sideClosed', []));
    $$(':scope > h2:not(.sidebar-user-heading)', side).forEach((h2, i) => {
      const ul = h2.nextElementSibling;
      if (!ul || ul.tagName !== 'UL') {
        // a heading without a list is a single link (logout)
        h2.classList.add('mx-side-solo');
        const a = h2.querySelector('a');
        if (a && !a.querySelector('.mx-ic')) a.prepend(svgIcon(iconFor(a), 16));
        return;
      }
      const btn = h('button', { type: 'button', class: 'mx-side-tg', title: t('sideToggle') }, svgIcon('chevD', 14));
      const set = (open) => { ul.classList.toggle('mx-side-shut', !open); h2.classList.toggle('mx-shut', !open); btn.setAttribute('aria-expanded', String(open)); };
      set(!closed.has(i) || !!ul.querySelector('a.mx-current'));
      h2.classList.add('mx-side-h');
      h2.append(btn);
      h2.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // the heading link (club page) still navigates
        e.preventDefault();
        const open = ul.classList.contains('mx-side-shut');
        set(open);
        if (open) closed.delete(i); else closed.add(i);
        LS.set('sideClosed', [...closed]);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Home page: club summary as tiles, next competitions as a list,
   * news and status messages as cards (CSS; the site's toggles keep working).
   * ------------------------------------------------------------------ */
  function homePage() {
    const mid = $('#middle_section');
    const hd = mid && $(':scope > .home_details', mid);
    if (!hd) return;
    const c1 = $('.content1', hd), c2 = $('.content2', hd);

    // Summary: each line is "Label: value [Label: value]"; read text and elements in order,
    // so it works in any language. A second pair on the same line becomes the sub-text.
    const tiles = [];
    $$('li', c1 || hd).forEach((li) => {
      const box = li.querySelector('strong') || li;
      const pairs = [];
      let label = '';
      box.childNodes.forEach((n) => {
        if (n.nodeType === 3) { label += n.textContent; return; }
        if (n.nodeType !== 1) return;
        const k = label.replace(/[:\s ]+$/, '').trim();
        label = '';
        if (k) pairs.push({ k, v: n.textContent.replace(/\s+/g, ' ').trim(), href: (n.tagName === 'A' ? n : n.querySelector('a'))?.getAttribute('href') });
        else if (pairs.length) pairs[pairs.length - 1].v += n.textContent.trim();
      });
      if (!pairs.length) return;
      const [p, ...rest] = pairs;
      const sub = rest.map((r) => `${r.k} ${r.v}`).join(' · ') || null;
      const el = tile(p.k, p.v, sub);
      if (p.href) { const a = h('a', { href: p.href, class: el.className }); a.append(...el.childNodes); tiles.push(a); } else tiles.push(el);
    });

    // Next competitions: the first line is the title (calendar link), the rest are date + link.
    // The rotating slot (.innerfade) holds several competitions: each gets its own row.
    let compTitle = null;
    const comps = [];
    $$('.col2', c2 || hd).forEach((col) => {
      const a = $$('a', col).pop();
      const date = col.querySelector('.date');
      if (!date) { if (!compTitle && a) compTitle = a; return; }
      if (!a) return;
      const live = date.classList.contains('hasCountdown');
      const txt = h('span', {}, date.textContent.trim());
      // the site's countdown keeps ticking in the hidden original: mirror its text
      if (live) { const tick = setInterval(() => { if (!txt.isConnected) clearInterval(tick); else txt.textContent = date.textContent.trim(); }, 1000); }
      const badge = h('span', { class: 'mx-badge pill' + (live ? ' warn' : '') }, live ? svgIcon('clock', 12) : null, txt);
      comps.push(h('div', {}, badge, h('a', { href: a.getAttribute('href'), title: a.textContent.trim() }, a.textContent.trim())));
    });

    const homeTitle = ($(':scope > h3', hd)?.textContent || '').trim();
    const panel = h('div', { class: 'mxr mx-home' },
      h('div', { class: 'mx-card' }, sectionTitle(homeTitle || '—'), h('div', { class: 'mx-tiles' }, tiles)),
      comps.length ? h('div', { class: 'mx-card' },
        sectionTitle(compTitle ? h('a', { href: compTitle.getAttribute('href'), style: { color: 'inherit' } }, compTitle.textContent.trim()) : '—'),
        h('div', { class: 'mx-home-comp' }, comps)) : null);
    mid.insertBefore(panel, hd);
    mid.classList.add('mx-hide-orig-home');

    // news tabs: the active tab is the one without a click handler
    $$('.news_maxithlon h3 .title_text', mid).forEach((s) => s.classList.toggle('mx-on', !s.hasAttribute('onclick')));
  }

  /* ------------------------------------------------------------------ *
   * Account pages (options, password, symbol, profile, messages): mostly CSS
   * scoped by .mx-acct. Elements are only regrouped inside their own form,
   * so what the forms send does not change.
   * ------------------------------------------------------------------ */
  function accountPages() {
    const host = $('.page_details') || $('#middle_section');
    if (!host) return;
    // on #middle_section too, so these rules outrank the generic #middle_section table styles
    host.classList.add('mx-acct');
    $('#middle_section')?.classList.add('mx-acct');

    // options: loose checkbox + label + <br> lines become a list of rows
    $$('form.ui4-form', host).forEach((form) => {
      const boxes = $$(':scope > input[type=checkbox]', form);
      if (boxes.length) {
        const list = h('div', { class: 'mx-opts' });
        form.insertBefore(list, boxes[0]);
        boxes.forEach((cb) => {
          // everything up to the next <br> belongs to this option (label, notes in plain text)
          const parts = [];
          let n = cb.nextSibling;
          while (n && !(n.nodeType === 1 && (n.tagName === 'BR' || n.tagName === 'INPUT'))) { parts.push(n); n = n.nextSibling; }
          if (n && n.tagName === 'BR') n.remove();
          const lab = parts.find((x) => x.nodeType === 1 && x.tagName === 'LABEL');
          if (lab && !lab.htmlFor && cb.id) lab.htmlFor = cb.id;
          const extra = parts.filter((x) => x !== lab && x.textContent.trim());
          parts.filter((x) => x !== lab && !extra.includes(x)).forEach((x) => x.remove());
          list.append(h('div', { class: 'mx-opt' }, cb, h('div', {}, lab, extra.length ? h('div', { class: 'hint' }, extra) : null)));
        });
      }
      // club colors: the picker sits next to its table instead of floating
      const picker = $(':scope > #picker', form);
      const table = picker && picker.nextElementSibling?.tagName === 'TABLE' ? picker.nextElementSibling : null;
      if (table && $('input.colorwell', table)) {
        const box = h('div', { class: 'mx-colors' });
        form.insertBefore(box, picker);
        box.append(table, picker);
      }
    });

    // profile: legacy action images (send message, add friend) become buttons
    const acts = $$(':scope > a', host).filter((a) => a.querySelector(':scope > img') && /(invia_messaggio|amici)\.php/.test(a.getAttribute('href') || ''));
    if (acts.length) {
      const bar = h('div', { class: 'mx-acts' });
      host.insertBefore(bar, acts[0]);
      acts.forEach((a) => {
        const img = a.querySelector('img');
        const label = (img.getAttribute('title') || img.alt || '').trim();
        a.classList.add('mx-btn');
        a.replaceChildren(svgIcon(/amici/.test(a.getAttribute('href')) ? 'userplus' : 'mail', 15), label);
        bar.append(a);
      });
      // drop the <br> spacers that followed the images
      while (bar.nextElementSibling?.tagName === 'BR') bar.nextElementSibling.remove();
    }
  }

  /* ------------------------------------------------------------------ *
   * League table (dettagli_serie.php, dettagli_serie_youth.php).
   * table.results_small: position · [youth: empty] · club · points · total
   * score · "[n]" meetings · points per meeting (one column per round).
   * Columns are found from the club link, not from header text. Rows carry
   * nl_promoted / nl_relegated on their cells; our club is the one whose
   * ?u= matches the sidebar club link.
   * ------------------------------------------------------------------ */
  const isOwnClub = (a, own = ownClubId()) => { try { return !!own && new URL(a.href, location.href).searchParams.get('u') === own; } catch (e) { return false; } };
  const fullClub = (a) => {
    const shown = a.textContent.replace(/\s+/g, ' ').trim();
    const cut = shown.replace(/(\.\.\.|…)$/, '');
    const full = LS.get('clubs', {})[clubKey(a.href)] || '';
    return cut !== shown && full.startsWith(cut) ? full : shown;
  };
  const signedInt = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));

  function leaguePage() {
    const host = $('.page_details');
    const tbl = host && $(':scope > table.results_small', host);
    if (!tbl || tbl.rows.length < 3) return;
    host.classList.add('mx-league');
    $$('a[href*="dettagli_societa"]', host).forEach((a) => { if (isOwnClub(a)) a.classList.add('mx-own-a'); });
    const head = Array.from(tbl.rows[0].cells).map((c) => c.textContent.trim());
    const own = ownClubId();
    const rows = Array.from(tbl.rows).slice(1).map((r) => {
      const c = Array.from(r.cells);
      const ci = c.findIndex((td) => td.querySelector('a[href*="dettagli_societa"]'));
      if (ci < 0 || c.length < ci + 4) return null;
      const a = c[ci].querySelector('a');
      const rounds = c.slice(ci + 4).map((td) => { const s = td.textContent.trim(); return s === '' ? null : toNum(s); });
      return {
        pos: toNum(c[0].textContent), a, name: fullClub(a), own: isOwnClub(a, own),
        pts: toNum(c[ci + 1].textContent) || 0, total: toNum(c[ci + 2].textContent) || 0,
        n: toNum(c[ci + 3].textContent) || 0, rounds,
        zone: r.cells[0].classList.contains('nl_promoted') ? 'up' : r.cells[0].classList.contains('nl_relegated') ? 'down' : '',
        ci,
      };
    }).filter(Boolean);
    if (!rows.length) return;
    const ci = rows[0].ci;
    // header cells line up with the row cells (the youth table has the same extra column in both)
    const H = { pts: head[ci + 1], total: head[ci + 2], rounds: head.slice(ci + 4) };
    const nR = Math.max(...rows.map((r) => r.rounds.length));
    // a round was held when any club has points in it
    const held = Array.from({ length: nR }, (_, i) => rows.some((r) => r.rounds[i] != null));
    const maxPt = Math.max(1, ...rows.flatMap((r) => r.rounds.filter((v) => v != null)));
    rows.forEach((r) => {
      const played = r.rounds.map((v, i) => (held[i] ? v : undefined)).filter((v) => v !== undefined);
      const got = played.filter((v) => v != null);
      r.avg = got.length ? got.reduce((s, x) => s + x, 0) / played.length : null;
      const last = played.slice(-3);
      r.form = last.length ? last.reduce((s, x) => s + (x || 0), 0) / last.length : null;
    });

    const leader = rows[0];
    const me = rows.find((r) => r.own);
    // the charts page has no club links: it finds our club by this name
    if (me) LS.set('ownClub', me.name);
    const promoN = rows.filter((r) => r.zone === 'up').length;
    const relegAt = rows.findIndex((r) => r.zone === 'down');
    const tiles = [];
    // before the first meeting every club has 0 points: places and zones mean nothing yet
    if (me && held.some(Boolean)) {
      const i = rows.indexOf(me);
      tiles.push(tile(t('lgPos'), fmt(me.pos ?? i + 1) + 'º', t('lgOf', rows.length), { cls: me.zone === 'up' ? 'good' : me.zone === 'down' ? 'bad' : '' }));
      tiles.push(tile(H.pts || '—', fmt(me.pts), me === leader ? null : `${t('lgLeader')}: ${signedInt(me.pts - leader.pts)}`));
      if (promoN) {
        const line = me.zone === 'up' ? rows[promoN] : rows[promoN - 1];
        const d = line ? me.pts - line.pts : 0;
        tiles.push(tile(t('lgPromo'), signedInt(d), me.zone === 'up' ? t('lgAbove') : t('lgBelow'), { cls: me.zone === 'up' ? 'good' : d >= -5 ? 'warn' : '' }));
      }
      if (relegAt >= 0) {
        const line = me.zone === 'down' ? rows[relegAt - 1] : rows[relegAt];
        const d = line ? me.pts - line.pts : 0;
        tiles.push(tile(t('lgReleg'), signedInt(d), me.zone === 'down' ? t('lgBelow') : t('lgAbove'), { cls: me.zone === 'down' ? 'bad' : d <= 5 ? 'warn' : 'good' }));
      }
      tiles.push(tile(H.total || '—', fmt(me.total), me.avg != null ? `${t('lgAvg')}: ${fmt(me.avg, 1)}` : null));
    }

    const heat = (v) => `color-mix(in srgb, var(--good) ${Math.round(12 + (v / maxPt) * 70)}%, transparent)`;
    const thead = h('thead', {}, h('tr', {},
      h('th', {}, '#'), h('th', { class: 'l' }, head[ci] || ''),
      h('th', { class: 'sep' }, H.pts), h('th', {}, H.total), h('th', { title: t('lgFormT') }, t('lgForm')),
      H.rounds.slice(0, nR).map((x, i) => h('th', { class: i === 0 ? 'sep' : '' }, x))));
    const tbody = h('tbody', {}, rows.map((r, i) => {
      const gapPrev = i > 0 ? r.pts - rows[i - 1].pts : null;
      const trend = r.form != null && r.avg != null ? (r.form > r.avg + 0.5 ? 'up' : r.form < r.avg - 0.5 ? 'down' : '') : '';
      return h('tr', { class: [r.own ? 'mx-own' : '', r.zone ? 'z-' + r.zone : '', i === promoN - 1 ? 'line-up' : '', i === relegAt - 1 ? 'line-down' : ''].join(' ').trim() },
        h('td', { class: 'pos' }, h('span', {}, fmt(r.pos ?? i + 1))),
        h('td', { class: 'l club' }, h('a', { href: r.a.getAttribute('href'), title: r.name }, r.name), h('span', { class: 'mx-badge pill' }, String(r.n))),
        h('td', { class: 'sep pts' }, h('b', {}, fmt(r.pts)), gapPrev ? h('small', {}, signedInt(gapPrev)) : null),
        h('td', {}, fmt(r.total)),
        h('td', { class: 'form ' + trend, title: t('lgFormT') }, r.form == null ? '·' : [fmt(r.form, 1), trend === 'up' ? ' ▲' : trend === 'down' ? ' ▼' : '']),
        Array.from({ length: nR }, (_, k) => {
          const v = r.rounds[k];
          const cls = 'rd' + (k === 0 ? ' sep' : '');
          if (!held[k]) return h('td', { class: cls + ' wait', title: t('lgNotRun') }, '·');
          if (v == null) return h('td', { class: cls + ' miss', title: t('lgMissed') }, '–');
          return h('td', { class: cls }, h('span', { style: { background: heat(v) }, class: v === maxPt ? 'top' : '' }, fmt(v)));
        }));
    }));

    const st = { orig: false };
    const ui = h('div', { class: 'mxr mx-lg' });
    host.insertBefore(ui, tbl);
    const applyOrig = () => host.classList.toggle('mx-hide-orig-lg', !st.orig);
    const render = () => ui.replaceChildren(
      tiles.length ? h('div', { class: 'mx-tiles' }, tiles) : null,
      h('div', { class: 'mx-table-wrap' }, h('table', { class: 'mx-table mx-lg-t' }, thead, tbody)),
      h('div', { class: 'mxr-legend' },
        promoN ? h('span', {}, h('i', { class: 'sw up' }), t('lgPromoZ')) : null,
        relegAt >= 0 ? h('span', {}, h('i', { class: 'sw down' }), t('lgRelegZ')) : null,
        h('span', {}, h('i', { class: 'sw heat' }), `0 – ${fmt(maxPt)}`),
        h('span', { class: 'sp' }),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow'))));
    applyOrig();
    render();
  }

  /* ------------------------------------------------------------------ *
   * League charts (grafici_serie.php). The site draws them as quickchart.io
   * images whose Chart.js config, data included, is in the image URL (?c=).
   * Each config is read from the page and drawn again as SVG in the theme;
   * nothing is fetched and the data is not interpreted.
   * ------------------------------------------------------------------ */
  const svgEl = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const chartCfg = (img) => {
    try {
      const u = new URL(img.getAttribute('src') || '', location.href);
      if (!/quickchart\.io$/.test(u.hostname)) return null;
      const c = JSON.parse(u.searchParams.get('c') || 'null');
      return c && c.data && Array.isArray(c.data.datasets) ? c : null;
    } catch (e) { return null; }
  };
  const chartTitle = (c) => { const x = c.options?.plugins?.title?.text ?? c.options?.title?.text ?? ''; return Array.isArray(x) ? x.join(' ') : String(x); };
  const chartY = (c, vals) => {
    const y = c.options?.scales?.y || c.options?.scales?.yAxes?.[0]?.ticks || {};
    const lo = y.min ?? Math.min(0, ...vals), hi = y.max ?? Math.max(1, ...vals);
    return [lo, hi > lo ? hi : lo + 1];
  };
  const niceTicks = (lo, hi, n = 4) => { const step = (hi - lo) / n; return Array.from({ length: n + 1 }, (_, i) => lo + step * i); };
  const numLabel = (v) => fmt(v, Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 2 : 1);
  // our club, from the name saved by the league table (labels may be cut with "...")
  const isOwnLabel = (label) => {
    const own = LS.get('ownClub', '');
    const l = (label || '').trim();
    if (!own || !l) return false;
    if (l === own) return true;
    const cut = l.replace(/(\.\.\.|…)$/, '');
    return cut !== l && cut.length >= 6 && own.startsWith(cut);
  };

  function lineChartSvg(c) {
    const S = svgEl;
    const labels = c.data.labels || [];
    const sets = c.data.datasets.filter((d) => Array.isArray(d.data));
    const all = sets.flatMap((d) => d.data.filter((v) => typeof v === 'number'));
    const [lo, hi] = chartY(c, all);
    const W = 900, H = 300, L = 36, R = 12, T = 10, B = 24;
    const n = Math.max(labels.length, ...sets.map((d) => d.data.length));
    const x = (i) => L + (n > 1 ? (i * (W - L - R)) / (n - 1) : (W - L - R) / 2);
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    niceTicks(lo, hi).forEach((v) => {
      svg.append(S('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      const tx = S('text', { x: L - 6, y: y(v) + 3.5, 'text-anchor': 'end' }); tx.textContent = numLabel(v); svg.append(tx);
    });
    labels.forEach((lb, i) => { const tx = S('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }); tx.textContent = lb; svg.append(tx); });
    const paths = sets.map((d) => {
      const pts = d.data.map((v, i) => (typeof v === 'number' ? `${x(i).toFixed(1)},${y(v).toFixed(1)}` : null));
      const dd = pts.reduce((s, p, i) => (p ? s + (s && pts[i - 1] ? 'L' : 'M') + p : s), '');
      const p = S('path', { d: dd, class: 'ln' + (isOwnLabel(d.label) ? ' own' : ''), style: `--c:${d.borderColor || d.backgroundColor || 'var(--muted)'}` });
      const tt = S('title', {}); tt.textContent = `${d.label || ''}: ${d.data.map((v) => (v == null ? '–' : numLabel(v))).join(' · ')}`; p.append(tt);
      svg.append(p);
      return p;
    });
    // our club's line on top
    paths.forEach((p) => { if (p.classList.contains('own')) svg.append(p); });
    let pinned = -1;
    const focus = (i) => { svg.classList.toggle('focus', i >= 0); paths.forEach((p, k) => p.classList.toggle('on', k === i)); if (i >= 0) svg.append(paths[i]); };
    const key = h('div', { class: 'mx-gr-key' }, sets.map((d, i) => {
      const b = h('button', { class: 'mx-key' + (isOwnLabel(d.label) ? ' own' : ''), title: d.label || '', style: `--c:${d.borderColor || d.backgroundColor || 'var(--muted)'}`,
        onmouseenter: () => focus(i), onmouseleave: () => focus(pinned),
        onclick: () => { pinned = pinned === i ? -1 : i; key.querySelectorAll('button').forEach((x, k) => x.classList.toggle('on', k === pinned)); focus(pinned); } },
      h('i', {}), h('span', {}, d.label || ''));
      return b;
    }));
    return h('div', { class: 'mx-card' }, svg, key);
  }

  function barChartCard(c) {
    const S = svgEl;
    const labels = c.data.labels || [];
    const sets = c.data.datasets.filter((d) => Array.isArray(d.data));
    const all = sets.flatMap((d) => d.data.filter((v) => typeof v === 'number'));
    const [lo, hi] = chartY(c, all);
    const W = 250, H = 130, L = 24, R = 4, T = 6, B = 18;
    const n = Math.max(labels.length, ...sets.map((d) => d.data.length), 1);
    const slot = (W - L - R) / n, bw = Math.max(2, (slot * 0.72) / Math.max(1, sets.length));
    const y = (v) => T + (H - T - B) * (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo));
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    niceTicks(lo, hi, 3).forEach((v) => {
      svg.append(S('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      const tx = S('text', { x: L - 4, y: y(v) + 3.5, 'text-anchor': 'end', style: 'font-size:9px' }); tx.textContent = numLabel(v); svg.append(tx);
    });
    for (let i = 0; i < n; i++) {
      const x0 = L + slot * i + (slot - bw * sets.length) / 2;
      sets.forEach((d, k) => {
        const v = d.data[i];
        if (typeof v !== 'number') return;
        const r = S('rect', { class: 'b' + (k % 4), x: (x0 + k * bw).toFixed(1), y: y(Math.max(v, lo)).toFixed(1), width: (bw - 1).toFixed(1), height: Math.max(0, y(lo) - y(Math.max(v, lo))).toFixed(1), rx: 1.5 });
        const tt = S('title', {}); tt.textContent = `${labels[i] ?? i + 1}${d.label ? ' · ' + d.label : ''}: ${numLabel(v)}`; r.append(tt);
        svg.append(r);
      });
      const tx = S('text', { x: (L + slot * i + slot / 2).toFixed(1), y: H - 5, 'text-anchor': 'middle', style: 'font-size:9px' }); tx.textContent = labels[i] ?? ''; svg.append(tx);
    }
    const title = chartTitle(c);
    return h('div', { class: 'mx-card' + (isOwnLabel(title) ? ' own' : '') }, title ? h('h5', { title }, title) : null, svg);
  }

  function leagueCharts() {
    const host = $('.page_details');
    if (!host) return;
    const charts = $$(':scope > img, :scope > table img', host).map((img) => ({ img, c: chartCfg(img) })).filter((x) => x.c);
    if (!charts.length) return;
    const lines = charts.filter((x) => x.c.type === 'line').map((x) => lineChartSvg(x.c));
    const bars = charts.filter((x) => x.c.type === 'bar').map((x) => barChartCard(x.c));
    // our club's card first
    bars.sort((a, b) => b.classList.contains('own') - a.classList.contains('own'));
    const st = { orig: false };
    const ui = h('div', { class: 'mxr mx-gr' });
    const first = $(':scope > img', host) || charts[0].img.closest('table') || charts[0].img;
    host.insertBefore(ui, first);
    const applyOrig = () => host.classList.toggle('mx-hide-orig-gr', !st.orig);
    const render = () => ui.replaceChildren(
      ...lines,
      bars.length ? h('div', { class: 'mx-gr-grid' }, bars) : null,
      h('div', { class: 'mxr-legend' }, h('span', { class: 'sp' }),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow'))));
    applyOrig();
    render();
  }

  /* ------------------------------------------------------------------ *
   * Competition search (lista_prossima.php): the form's grid of label rows
   * and field rows becomes a compact filter bar. The form's own fields are
   * moved, never copied, so the search sends exactly what it sent before.
   * ------------------------------------------------------------------ */
  function compSearchPage() {
    const form = $('.page_details form[name="lista"]') || $('.page_details form');
    const tbl = form && $(':scope > table', form);
    if (!tbl || tbl.rows.length < 3) return;
    const rows = Array.from(tbl.rows);
    const last = rows[rows.length - 1];
    const fields = [];
    for (let r = 0; r + 1 < rows.length - 1; r += 2) {
      const labs = Array.from(rows[r].cells), ctls = Array.from(rows[r + 1].cells);
      if (!ctls.some((c) => c.querySelector('select,input'))) return; // not the layout we know
      labs.forEach((lc, i) => { if (ctls[i] && ctls[i].querySelector('select,input')) fields.push([lc, ctls[i]]); });
    }
    if (!fields.length) return;
    // build everything first, then move the nodes in one go
    const grid = h('div', { class: 'mx-filters' });
    const items = fields.map(([lc, cc]) => {
      const ctl = h('div', { class: 'ctl' });
      grid.append(h('div', { class: 'fld' }, h('b', {}, lc.textContent.replace(/:\s*$/, '').trim()), ctl));
      return [cc, ctl];
    });
    const chk = h('label', {}), btns = h('div', { class: 'btns' });
    grid.append(h('div', { class: 'foot' }, chk, btns));
    const lastCells = Array.from(last.cells);
    form.insertBefore(grid, tbl);
    items.forEach(([cc, ctl]) => ctl.append(...Array.from(cc.childNodes).filter((n) => n.nodeType === 1 || n.textContent.trim())));
    lastCells.forEach((c) => {
      const target = c.querySelector('input[type="submit"],button') ? btns : chk;
      target.append(...Array.from(c.childNodes).filter((n) => n.nodeType === 1 || n.textContent.trim()));
    });
    tbl.style.display = 'none';
  }

  /* ------------------------------------------------------------------ *
   * Calendars. calendario.php: rows "date · (week) · links", the links
   * carry tipo_competizione_id, which picks the color. calendario_serie.php:
   * rows "competition · status · dd-mm-yyyy hh:mm". Both become cards;
   * past dates fade, the next one is marked.
   * ------------------------------------------------------------------ */
  const compKind = (href) => {
    let id = null;
    try { id = +new URL(href, location.href).searchParams.get('tipo_competizione_id'); } catch (e) { /* ignore */ }
    if (id === 15 || id === 20) return 'league';
    if (id >= 1 && id <= 4) return 'meet';
    if (id >= 5 && id <= 8) return 'champ';
    return id ? 'intl' : '';
  };
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseDay = (s) => { const m = (s || '').match(/(\d{1,2})\D(\d{1,2})\D(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };

  function calendarPage() {
    const host = $('.page_details');
    if (!host) return;
    const now = serverNow(), today = dayStart(now);
    const wk = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
    const dm = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

    if (/calendario\.php$/.test(path)) {
      const tbl = $$(':scope > table', host).find((x) => x.rows.length > 3 && x.rows[0].cells.length === 3);
      if (!tbl) return;
      const head = Array.from(tbl.rows[0].cells).map((c) => c.textContent.trim());
      const days = Array.from(tbl.rows).slice(1).filter((r) => r.cells.length === 3).map((r) => ({
        date: parseDay(r.cells[0].textContent), week: toNum(r.cells[1].textContent),
        links: $$('a', r.cells[2]), text: r.cells[2].textContent.replace(/^[\s-]+/, '').trim(),
      })).filter((d) => d.date);
      if (!days.length) return;
      const next = days.find((d) => d.date >= today && d.links.length);
      const weeks = new Map();
      days.forEach((d) => { if (!weeks.has(d.week)) weeks.set(d.week, []); weeks.get(d.week).push(d); });
      const grid = h('div', { class: 'mx-cal' }, [...weeks].map(([w, list]) => {
        const past = list.every((d) => d.date < today);
        const cur = list.some((d) => +d.date === +today) || (next && list.includes(next));
        return h('div', { class: 'mx-cal-w' + (past ? ' past' : '') + (cur ? ' cur' : '') },
          h('div', { class: 'mx-cal-wt' }, `${head[1] || ''} ${w ?? ''}`.trim()),
          list.map((d) => h('div', { class: 'mx-cal-d' + (d.date < today ? ' past' : '') + (d === next ? ' next' : '') + (+d.date === +today ? ' today' : '') },
            h('div', { class: 'mx-cal-dt' }, h('b', {}, dm.format(d.date)), h('span', {}, wk.format(d.date)),
              +d.date === +today ? h('span', { class: 'mx-badge info' }, t('calToday')) : d === next ? h('span', { class: 'mx-badge warn' }, t('calNext')) : null),
            h('div', { class: 'mx-cal-c' }, d.links.length
              ? d.links.map((a) => h('a', { href: a.getAttribute('href'), class: 'mx-cal-k ' + compKind(a.href) }, a.textContent.trim()))
              : h('span', { class: 'mx-cal-note' }, d.text)))));
      }));
      host.insertBefore(h('div', { class: 'mxr' }, grid), tbl);
      tbl.classList.add('mx-cal-src');
      host.classList.add('mx-hide-orig-cal');
      return;
    }

    // league calendar
    const tbl = $(':scope > table', host);
    if (!tbl) return;
    const items = Array.from(tbl.rows).filter((r) => r.cells.length === 3 && r.querySelector('a')).map((r) => ({
      a: r.querySelector('a'), status: r.cells[1].textContent.trim(), when: parseWhen(r.cells[2].textContent.trim().replace(/^(\S+)\s+(\S+)$/, '$2 $1')), raw: r.cells[2].textContent.trim(),
    }));
    if (!items.length) return;
    const next = items.find((x) => x.when && x.when >= now);
    const list = h('div', { class: 'mx-card mx-cal-list' },
      sectionTitle($(':scope > b', host)?.textContent.trim() || '—', h('span', {}, String(items.length))),
      items.map((x, i) => h('div', { class: 'mx-cal-row' + (x.when && x.when < now ? ' past' : '') + (x === next ? ' next' : '') },
        h('span', { class: 'n' }, String(i + 1)),
        h('span', { class: 'd' }, x.when ? h('b', {}, dm.format(x.when)) : x.raw, x.when ? h('span', {}, `${wk.format(x.when)} ${x.raw.split(' ').pop()}`) : null),
        h('a', { href: x.a.getAttribute('href') }, x.a.textContent.trim()),
        h('span', { class: 'mx-badge pill ' + (x === next ? 'warn' : x.when && x.when < now ? '' : 'info') }, x === next ? `${t('calNext')} · ${fmtLeft(x.when - now)}` : x.status))));
    const title = $(':scope > b', host);
    host.insertBefore(h('div', { class: 'mxr' }, list), title || tbl);
    [title, tbl].forEach((x) => x && x.classList.add('mx-cal-src'));
    host.classList.add('mx-hide-orig-cal');
  }

  /* ------------------------------------------------------------------ *
   * Competition pages (events, results, rankings, records, entry lists):
   * the site marks our athletes' rows with tr.own_athlete; rows that link
   * to our club get the same look. Podium places get medal colors.
   * ------------------------------------------------------------------ */
  function compHighlights() {
    const mid = $('#middle_section');
    if (!mid) return;
    const own = ownClubId();
    $$('table.results tr, table.results_small tr', mid).forEach((tr) => {
      if (tr.classList.contains('own_athlete')) { tr.classList.add('mx-own'); return; }
      if ($$(':scope > td a[href*="dettagli_societa"]', tr).some((a) => isOwnClub(a, own))) tr.classList.add('mx-own');
    });
    // results: first cell is the place
    if (/risultati_gara\.php$/.test(path)) {
      $$('table.results tr', mid).forEach((tr) => {
        const c = tr.cells[0];
        if (!c || c.tagName !== 'TD') return;
        const n = /^\d+$/.test(c.textContent.trim()) ? +c.textContent.trim() : 0;
        if (n >= 1 && n <= 3) c.classList.add('mx-place', 'p' + n);
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Moments of glory (momenti_gloria.php) and the club honours board
   * (albo_oro.php): places such as "6°" become badges, podiums in medal
   * colors. Only the number and the ° sign are read.
   * ------------------------------------------------------------------ */
  function gloryPages() {
    const mid = $('#middle_section');
    if (!mid) return;
    mid.classList.add('mx-glory');
    const badge = (n, txt) => h('span', { class: 'mx-place-b' + (n <= 3 ? ' p' + n : n <= 8 ? ' top' : '') }, txt);
    $$('table.results td, table.man_details td', mid).forEach((td) => {
      const whole = td.textContent.trim().match(/^(\d{1,3})\s*[°º]$/);
      if (whole && !td.querySelector('*')) { td.replaceChildren(badge(+whole[1], whole[0])); return; }
      // "6° in the ... event": the place is the first text node
      const first = td.firstChild;
      const m = first && first.nodeType === 3 && first.textContent.match(/^\s*(\d{1,3})\s*[°º]/);
      if (m) { first.textContent = first.textContent.slice(m[0].length); td.insertBefore(badge(+m[1], m[1] + '°'), first); }
    });
    // medal images at the start of a moment get the same podium tint on their row
    $$('table.results td > img[src*="medal_"]:first-child', mid).forEach((img) => img.closest('tr')?.classList.add('mx-podium'));
  }

  /* ------------------------------------------------------------------ *
   * Coaches (lista_tecnici.php): cards per group with each coach's load
   * and skills against the group's average. The Training page
   * (allenamento_new.php) is only read, to remember which athletes each
   * coach has; nothing on it is changed or sent.
   * ------------------------------------------------------------------ */
  const tidOf = (href) => { try { return new URL(href, location.href).searchParams.get('tid'); } catch (e) { return null; } };
  function rememberTraining() {
    const c = {};
    $$('table[id^="atleti"]').forEach((tbl) => {
      const gi = toNum(tbl.id.replace('atleti', '')) - 1;
      $$('select[name^="tecnico["]', tbl).forEach((sel) => {
        // the option marked selected in the HTML is the saved coach, whatever is picked now
        const opt = sel.querySelector('option[selected]');
        const tid = opt && opt.value;
        if (!tid || tid === '0') return;
        const a = sel.closest('tr')?.querySelector('a[href*="aid="]');
        if (!a) return;
        (c[tid] = c[tid] || []).push([aidOf(a.href), a.textContent.trim(), gi]);
      });
    });
    if (Object.keys(c).length) LS.set('coachAssign', { at: Date.now(), c });
  }

  function coachesPage() {
    const host = $('.page_details');
    const tbls = host ? $$(':scope > table.tablesorter', host) : [];
    if (!tbls.length) return;
    const ra = rosterAvgData();
    const assign = LS.get('coachAssign', null);
    const SK = [...BASE.map((b) => b.k), 's1', 's2'];
    const GIS = [0, 1, 2, 3, 4, 5, 6];

    const sections = tbls.map((tbl) => {
      const hr = Array.from(tbl.tHead?.rows || []);
      const title = hr.length > 1 ? hr[0].textContent.trim() : '';
      const head = Array.from((hr[hr.length - 1] || tbl.rows[0]).cells).map((c) => c.textContent.trim());
      // the second table is the youth academy's (no specialty columns)
      const youth = tbls.length > 1 && tbl === tbls[tbls.length - 1];
      const coaches = Array.from(tbl.tBodies[0]?.rows || []).map((tr) => {
        const c = tr.cells;
        if (c.length < 7) return null;
        const a = c[1].querySelector('a');
        const spec = c[3].textContent.trim();
        return {
          a, name: c[1].textContent.trim(), flag: c[0].querySelector('img'), tid: a && tidOf(a.href),
          maxid: toNum(c[2].textContent), spec, gi: youth ? 7 : ra.idxOf(spec), n: toNum(c[4].textContent) || 0, exp: toNum(c[5].textContent),
          sk: Array.from(c).slice(6).map((td) => toNum(td.textContent) || 0),
        };
      }).filter(Boolean);
      const foot = tbl.tFoot?.rows[0];
      const total = foot && foot.cells.length > 1 ? { k: foot.cells[0].textContent.trim(), v: toNum(foot.cells[1].textContent) } : null;
      return { title, head, youth, coaches, total };
    });

    // "Coaches in the club: 9 (Maximum: 11)" under the tables: <b>label</b> number <i>(max)</i>
    const counts = $$(':scope > b', host).map((b) => {
      const n = b.nextSibling && b.nextSibling.nodeType === 3 ? toNum(b.nextSibling.textContent) : null;
      const i = b.nextSibling?.nextSibling;
      const max = i && i.nodeName === 'I' ? toNum(i.textContent) : null;
      return n == null ? null : { k: b.textContent.trim().replace(/:\s*$/, ''), n, max };
    }).filter(Boolean);
    // the lines under the tables go into a wrapper, so "show original" can hide them
    const last = tbls[tbls.length - 1];
    const src = h('div', { class: 'mx-tc-src' });
    while (last.nextSibling) src.append(last.nextSibling);
    host.append(src);

    const tiles = [];
    counts.forEach((c) => tiles.push(tile(c.k, c.max != null ? `${fmt(c.n)}/${fmt(c.max)}` : fmt(c.n), null)));
    sections.forEach((s) => {
      if (!s.total || s.total.v == null) return;
      const inRoster = ra.has ? (s.youth ? [7] : GIS).reduce((x, gi) => x + (ra.groups[gi]?.n || 0), 0) : 0;
      tiles.push(tile(s.total.k, fmt(s.total.v), inRoster ? t('tcCovered', fmt(Math.min(s.total.v, inRoster)), fmt(inRoster)) : null,
        { cls: inRoster && s.total.v < inRoster ? 'warn' : '' }));
    });
    const all = sections.flatMap((s) => s.coaches);
    const maxLoad = Math.max(1, ...all.map((c) => c.n));
    if (all.length) tiles.push(tile(t('tcPerCoach'), fmt(avg(all.map((c) => c.n)), 1), `max ${fmt(maxLoad)}`));

    // the name saved by the Athletes list, else the coach's specialty (not for youth coaches, who have none), else a known alias
    const grpName = (gi, spec) => {
      const al = Object.keys(ra.alias).find((k) => ra.alias[k] === gi);
      return ra.groups[gi]?.name || (gi < 7 && spec) || (al && al[0].toUpperCase() + al.slice(1)) || t('group', gi + 1);
    };
    const coachCard = (c, s, g) => {
      // the specialty columns are "Es1/Es2" here: use the group's own names when known
      const lab = s.head.slice(6).map((x, i) => (g?.spec && SK[i] === 's1' ? g.spec[0] : g?.spec && SK[i] === 's2' ? g.spec[1] : x));
      // a coach has 0 in the skills it does not train
      const rows = c.sk.map((v, i) => ({ v, lab: lab[i], ref: g ? g[SK[i]] : null })).filter((r) => r.v > 0);
      const ath = assign?.c?.[c.tid] || null;
      const bar = (v, ref, tip) => h('span', { class: 'trk', title: tip || null },
        h('i', { style: { width: (v / 20) * 100 + '%', background: barColor(v) } }),
        ref != null ? h('u', { style: { left: Math.min(100, (ref / 20) * 100) + '%' } }) : null);
      return h('div', { class: 'mx-card' },
        h('div', { class: 'mx-tc-name' }, c.flag ? c.flag.cloneNode() : null,
          c.a ? h('a', { href: c.a.getAttribute('href'), title: c.name }, c.name) : h('b', {}, c.name),
          c.maxid != null ? h('span', { class: 'mx-badge pill', title: s.head[2] }, fmt(c.maxid)) : null),
        h('div', { class: 'mx-tc-load' },
          h('b', {}, fmt(c.n)), h('span', {}, s.head[4]),
          h('span', { class: 'trk' }, h('i', { style: { width: Math.round((c.n / maxLoad) * 100) + '%' } }))),
        h('div', { class: 'mx-tc-sk' },
          c.exp != null ? [h('span', {}, s.head[5]), bar(c.exp), h('b', {}, fmt(c.exp))] : null,
          rows.map((r) => [h('span', {}, r.lab), bar(r.v, r.ref, r.ref != null ? `${t('tcAvgT')}: ${fmt(r.ref, 1)}` : null), h('b', {}, fmt(r.v))])),
        ath ? h('div', { class: 'mx-tc-ath' }, ath.map(([aid, name]) => h('a', { href: '/user/atleta_one.php?tipo=aid&aid=' + encodeURIComponent(aid) }, name))) : null);
    };

    const sectionUi = (s) => {
      const byGroup = new Map();
      s.coaches.forEach((c) => { const key = c.gi >= 0 ? c.gi : 'x' + c.spec; if (!byGroup.has(key)) byGroup.set(key, []); byGroup.get(key).push(c); });
      // groups with athletes but no coach get an empty slot
      if (ra.has) (s.youth ? [7] : GIS).forEach((gi) => { if (ra.groups[gi]?.n && !byGroup.has(gi)) byGroup.set(gi, []); });
      const keys = [...byGroup.keys()].sort((a, b) => (typeof a === 'number' ? a : 99) - (typeof b === 'number' ? b : 99));
      return h('div', { class: 'mx-tc-sec' },
        s.title ? h('div', { class: 'mx-tc-h' }, s.title) : null,
        h('div', { class: 'mx-tc-groups' }, keys.map((key) => {
          const cs = byGroup.get(key);
          const gi = typeof key === 'number' ? key : -1;
          const g = gi >= 0 ? ra.groups[gi] || null : null;
          const load = cs.reduce((x, c) => x + c.n, 0);
          const badge = !g?.n ? null : cs.length
            ? h('span', { class: 'mx-badge ' + (load >= g.n ? 'good' : 'warn') }, t('tcCovered', fmt(Math.min(load, g.n)), fmt(g.n)))
            : h('span', { class: 'mx-badge bad' }, t('tcNoCoach'));
          return h('div', { class: 'mx-tc-grp' },
            h('div', { class: 'mx-tc-gh' },
              h('span', { class: 'mxr-g', style: { background: gi >= 0 ? GROUP_COLORS[gi % GROUP_COLORS.length] : 'var(--muted)' } }),
              h('span', {}, gi >= 0 ? grpName(gi, cs[0]?.spec) : cs[0].spec), badge),
            h('div', { class: 'mx-tc-grid', style: '--n:' + Math.max(1, cs.length) }, cs.length ? cs.map((c) => coachCard(c, s, g)) : h('div', { class: 'mx-card mx-tc-none' }, t('tcNoCoach'))));
        })));
    };

    const st = { orig: false };
    const ui = h('div', { class: 'mxr mx-tc' });
    host.insertBefore(ui, tbls[0]);
    const applyOrig = () => host.classList.toggle('mx-hide-orig-tc', !st.orig);
    const render = () => ui.replaceChildren(
      tiles.length ? h('div', { class: 'mx-tiles' }, tiles) : null,
      ...sections.map(sectionUi),
      h('div', { class: 'mxr-legend' },
        ra.has ? h('span', {}, h('i', { class: 'mk' }), t('tcAvgT')) : h('span', {}, t('tcRoster')),
        h('span', {}, assign ? t('tcFrom', new Date(assign.at).toLocaleDateString(LOCALE)) : t('tcVisit')),
        h('span', { class: 'sp' }),
        h('button', { class: 'mx-btn', title: t('origT'), onclick: () => { st.orig = !st.orig; applyOrig(); render(); } }, st.orig ? t('origHide') : t('origShow'))));
    applyOrig();
    render();
  }

  const MODULES = [
    { k: 'roster', label: 'modRoster', page: /lista_atleti\.php$/, run: rosterPage },
    { k: 'market', label: 'modMarket', page: /mercato\.php$/, run: marketPage },
    { k: 'finances', label: 'modFinances', page: /budget_det\.php$/, run: financePage },
    { k: 'transactions', label: 'modTransactions', page: /last_budget\.php$/, run: transactionsPage },
    { k: 'home', label: 'modHome', page: /^\/(index\.php)?$/, run: homePage },
    { k: 'account', label: 'modAccount', page: /\/user\/(messaggi|messaggi_uscita|invia_messaggio|modifica_utente|modifica_opzioni|cambia_password|upload|dettagli_utente)\.php$/, run: accountPages },
    { k: 'league', label: 'modLeague', page: /dettagli_serie(_youth)?\.php$/, run: leaguePage },
    { k: 'charts', label: 'modCharts', page: /grafici_serie\.php$/, run: leagueCharts },
    { k: 'compList', label: 'modCompList', page: /lista_prossima\.php$/, run: compSearchPage },
    { k: 'calendar', label: 'modCalendar', page: /calendario(_serie)?\.php$/, run: calendarPage },
    { k: 'coaches', label: 'modCoaches', page: /\/user\/(lista_tecnici|allenamento_new)\.php$/, run: () => (/allenamento_new/.test(path) ? rememberTraining() : coachesPage()) },
    { k: 'glory', label: 'modGlory', page: /(momenti_gloria|albo_oro)\.php$/, run: gloryPages },
    { k: 'athlete', label: 'modAthlete', page: /atleta_one\.php$/, run: () => { try { athleteLayout(); } catch (e) { console.warn('[UI+] athlete layout', e); } athletePage(); } },
    { k: 'comp', label: 'modComp', run: () => { if (/\/manifestazioni\/|graduatorie|record|dettagli_serie/.test(path)) compHighlights(); } },
    { k: 'icons', label: 'modIcons', run: () => { decorateIcons(); eventIcons(); } },
    { k: 'sidebar', label: 'modSidebar', run: sidebarSections },
    { k: 'clubs', run: rememberClubs },
    { k: 'rightCol', label: 'modRightCol', run: rightColumn },
    { k: 'tips', label: 'modTips', run: pageTips },
    { k: 'bars', label: 'modBars', run: restyleBars },
    { k: 'palette', label: 'modPalette', run: () => {} },
  ];

  function failNotice(m, err) {
    const host = $('.page_details') || $('#middle_section');
    if (!host) return;
    // undo what the panel managed to build: its containers and the "hide original" classes
    $$('.mxr, .mxa', host).forEach((el) => el.remove());
    host.className = host.className.split(/\s+/).filter((c) => !c.startsWith('mx-hide-orig')).join(' ');
    const note = h('div', { class: 'mx-notice', role: 'status' },
      svgIcon('alert', 16),
      h('span', {}, t('failPanel', t(m.label))),
      h('button', { class: 'mx-btn', title: String(err && (err.stack || err.message) || err), onclick: () => console.warn('[UI+] ' + m.k, err) }, t('failDetails')),
      h('button', { class: 'mx-btn', onclick: openSettings }, t('setTitle')),
      h('button', { class: 'mx-notice-x', title: t('palClose'), onclick: () => note.remove() }, '×'));
    const bar = $(':scope > .page_bar', host);
    if (bar) bar.after(note); else host.prepend(note);
  }

  function runModules() {
    for (const m of MODULES) {
      if (!moduleOn(m.k) || (m.page && !m.page.test(path))) continue;
      try { m.run(); } catch (e) {
        console.warn('[UI+] ' + m.k, e);
        if (m.page) try { failNotice(m, e); } catch (e2) { /* ignore */ }
      }
    }
  }

  // Logged-out pages (home with the login form, public pages) have no club sidebar: leave them untouched.
  const loggedIn = () => !!$('#left_section') && !$('#login_user');

  function start() {
    if (!loggedIn()) return;
    if (!enabled) { buildDock(); return; }
    root.classList.add('mx', 'mx-' + theme);
    injectCSS();
    try { applySettings(); } catch (e) { console.warn('[UI+] settings', e); }
    try { markCurrent(); } catch (e) { console.warn('[UI+] nav', e); }
    runModules();
    buildDock();
    bindKeys();
    requestAnimationFrame(() => {
      try { legacyColors(document.body); } catch (e) { console.warn('[UI+] colors', e); }
      try { darkFix(document.body); watchDom(); } catch (e) { console.warn('[UI+] dark', e); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
