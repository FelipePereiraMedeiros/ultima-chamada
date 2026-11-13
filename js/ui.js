/* Última Chama — interface (pensada primeiro para celular) */

const UI = (() => {
  const app = document.getElementById('app');
  const SAVE = 'ultima-chama-save', REC = 'ultima-chama';
  let screen = 'title';   // title | select | game
  let modal = null;       // map | inv | craft | help | null
  let selHero = 0;
  let craftAll = false;
  let mapSel = null;
  let recorded = false;

  /* ---------- Armazenamento local (o jogo funciona sem ele) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* indisponível */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* indisponível */ } },
  };
  const record = () => { try { return JSON.parse(store.get(REC) || '{}'); } catch { return {}; } };
  function autosave() {
    const S = Game.S;
    if (screen !== 'game' || !S) return;
    if (S.over) {
      store.del(SAVE);
      if (!recorded) {
        recorded = true;
        const r = record();
        r.games = (r.games || 0) + 1;
        if (S.over.win) r.wins = (r.wins || 0) + 1;
        store.set(REC, JSON.stringify(r));
      }
      return;
    }
    const j = Game.serialize();
    if (j) store.set(SAVE, j);
  }

  /* ---------- Pequenos blocos ---------- */
  const bar = (cls, v, max, label) =>
    `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i><span>${label}</span></div>`;
  const kbd = (k) => `<kbd>${k}</kbd>`;

  function itemInfo(it) {
    const b = [];
    if (it.t === 'arma') b.push(`${WTYPES[it.wt]} · Ataque +${it.atk}`);
    if (it.t === 'armadura') {
      b.push(SLOT_NAMES[it.slot]);
      if (it.def) b.push(`Defesa +${it.def}`);
      if (it.hp) b.push(`Vida +${it.hp}`);
      if (it.spd) b.push(`Velocidade +${it.spd}`);
    }
    if (it.t === 'consumivel') {
      if (it.hp) b.push(`Vida +${it.hp}`);
      if (it.vigor) b.push(`Vigor +${it.vigor}`);
    }
    if (it.t === 'material') b.push('Material');
    return b.join(' · ');
  }
  const itemName = (id) => { const it = ITEMS[id]; return `<span class="r${it.r}">${it.i} ${it.n}</span>`; };

  /* Próxima melhoria da arma equipada e o que falta para ela */
  function goal() {
    const p = Game.S.p;
    const ri = RECIPES.findIndex((r) => r.ins.includes(p.equip.arma));
    if (ri < 0) return null;
    const own = Game.owned();
    return { ri, rec: RECIPES[ri], miss: RECIPES[ri].ins.filter((id) => !own[id]) };
  }
  const areaHas = (a, ids) => ids.some((id) => AREAS[a].loot.some((l) => l[0] === id));
  const craftable = () => RECIPES.reduce((n, _, i) => n + (Game.canCraft(i) ? 1 : 0), 0);
  const consumables = () => Game.S.p.inv.map((id, i) => ({ id, i })).filter((x) => ITEMS[x.id].t === 'consumivel');

  /* ---------- Título e seleção ---------- */
  function title() {
    const r = record(), hasSave = !!store.get(SAVE);
    return `<main class="title">
      <div class="flame">🔥</div>
      <h1>Última Chama</h1>
      <h2>Ilha de Vharun</h2>
      <p class="lead">A cada geração a chama do mundo vacila. Dez campeões são levados à ilha,
      a Névoa Cinzenta se fecha — e apenas um sairá carregando o fogo.</p>
      <div class="col">
        ${hasSave ? '<button class="big" data-a="continue">Continuar Partida</button>' : ''}
        <button class="${hasSave ? '' : 'big'}" data-a="toSelect">Nova Partida</button>
        <button data-a="modal" data-v="help">Como Jogar</button>
      </div>
      ${r.games ? `<p class="muted">Partidas: ${r.games} · Vitórias: ${r.wins || 0}</p>` : ''}
      <p class="muted small">Jogo de sobrevivência original, offline e para um jogador. Projeto de fã, sem fins lucrativos.</p>
    </main>`;
  }

  function select() {
    const h = HEROES[selHero], w = ITEMS[h.start];
    return `<main class="select">
      <h1>Escolha seu campeão</h1>
      <div class="heroes">${HEROES.map((x, i) =>
        `<button class="hero ${i === selHero ? 'on' : ''}" data-a="pickHero" data-v="${i}">
          <b>${x.i}</b><span>${x.n.split(' ')[0]}</span></button>`).join('')}</div>
      <section class="panel herocard">
        <div class="portrait">${h.i}</div>
        <div>
          <h2>${h.n}</h2>
          <p class="muted">${h.race} · ${WTYPES[h.wt]}</p>
          <p><em>${h.lore}</em></p>
          <p class="statline">❤️ ${h.hp} · ⚔️ ${h.atk} · 🛡️ ${h.def} · 💨 ${h.spd} · Começa com ${w.i} ${w.n}</p>
          <p><b>Passiva — ${h.pn}:</b> ${h.pd}</p>
          <p><b>Habilidade — ${h.skill.n}:</b> ${h.skill.d} <span class="muted">(recarga: ${h.skill.cd} turnos)</span></p>
        </div>
      </section>
      <div class="foot">
        <button data-a="toTitle">Voltar</button>
        <button class="big" data-a="start">Entrar na Ilha</button>
      </div>
    </main>`;
  }

  /* ---------- Mapa ---------- */
  function mapHtml() {
    const S = Game.S, p = S.p, nb = Game.neighbors(p.area);
    const tracker = HEROES[p.hero].passive === 'rastreador';
    const g = goal(), miss = g ? g.miss : [];
    return `<div class="map">${AREAS.map((a, i) => {
      const st = S.areas[i], here = i === p.area, adj = nb.includes(i);
      const seen = (tracker && adj) ? Game.npcsAt(i).length : 0;
      const want = miss.length && st !== 'selada' && areaHas(i, miss);
      return `<button class="cell ${st} ${here ? 'here' : ''} ${adj ? 'adj' : ''} ${mapSel === i ? 'sel' : ''}" data-a="cell" data-v="${i}"
        aria-label="${a.n}${st !== 'livre' ? `, ${st}` : ''}${adj ? ', vizinha' : ''}">
        <b>${a.i}</b><span>${a.n}</span>
        ${here ? '<em class="you">VOCÊ</em>' : ''}
        ${st === 'condenada' ? '<em class="tag tr">🔔</em>' : st === 'selada' ? '<em class="tag tr">🌫️</em>' : ''}
        ${want ? '<em class="tag bl">⭐</em>' : ''}
        ${seen ? `<em class="tag br seen">👁️${seen}</em>` : ''}
      </button>`;
    }).join('')}</div>`;
  }

  function areaInfo(i) {
    const S = Game.S, a = AREAS[i], st = S.areas[i];
    const g = goal(), miss = g ? g.miss : [];
    const loot = [...new Set(a.loot.map((l) => l[0]))].map((id) =>
      `<span class="${miss.includes(id) ? 'want' : ''}">${ITEMS[id].i} ${ITEMS[id].n}</span>`).join(', ');
    const mons = a.mons.map((m) => `${MONS[m].i} ${MONS[m].n}`).join(', ');
    return `<div class="info">
      <strong>${a.i} ${a.n}</strong>
      ${st === 'condenada' ? '<span class="pill warn">condenada</span>' : st === 'selada' ? '<span class="pill bad">névoa</span>' : ''}
      ${a.forge ? '<span class="pill">forja rápida</span>' : ''}${a.sanctuary ? '<span class="pill">descanso melhor</span>' : ''}
      <p class="small">${loot}</p>
      <p class="small muted">Perigos: ${mons}</p>
    </div>`;
  }

  function mapModal() {
    const p = Game.S.p;
    const i = mapSel ?? p.area;
    return `<h2>🗺️ Mapa</h2>
      ${mapHtml()}
      <p class="small muted legend">Toque numa região vizinha (borda clara) para viajar · ⭐ tem o que falta para sua arma · 🔔 condenada · 🌫️ névoa</p>
      ${areaInfo(i)}`;
  }

  /* ---------- Tela de jogo ---------- */
  function game() {
    const S = Game.S, p = S.p, st = Game.stats(), h = HEROES[p.hero], a = AREAS[p.area];
    const status = S.areas[p.area];
    const mm = Game.nextMist();
    const here = Game.npcsAt(p.area).length;
    const g = goal(), miss = g ? g.miss : [];
    const loot = [...new Set(a.loot.map((l) => l[0]))].map((id) =>
      `<span class="${miss.includes(id) ? 'want' : ''}" title="${ITEMS[id].n}">${ITEMS[id].i}</span>`).join('');
    const nCraft = craftable();
    const danger = status !== 'livre';

    const goalHtml = !g ? ''
      : !g.miss.length
        ? `<button class="goal ready" data-a="craft" data-v="${g.ri}">⚒️ Pronto: forjar ${itemName(g.rec.out)}</button>`
        : `<p class="goal small">🎯 ${itemName(g.rec.out)} — falta ${g.miss.map((id) => `${ITEMS[id].i} ${ITEMS[id].n}`).join(', ')}${areaHas(p.area, g.miss) ? ' <b class="want">⭐ há aqui</b>' : ''}</p>`;

    const quick = consumables();

    return `<main class="game">
      <header class="hud">
        <div class="hudrow">
          <b class="portrait sm">${h.i}</b>
          <div class="grow">
            <div class="chips">
              <span>${Game.isNight() ? '🌙' : '☀️'} ${Game.fmtTime(S.time)}</span>
              <span class="${mm <= 60 ? 'warn-t' : ''}" title="Tempo até o sino">🔔 ${Math.floor(mm / 60)}h${String(mm % 60).padStart(2, '0')}</span>
              <span title="Campeões vivos">👥 ${Game.aliveNpcs().length + 1}</span>
              <span title="Campeões que você derrotou">☠️ ${S.kills}</span>
            </div>
            ${bar('hp', p.hp, st.maxHp, `❤️ ${p.hp}/${st.maxHp}`)}
            ${bar('vg', p.vigor, 100, `⚡ ${p.vigor}/100`)}
          </div>
          <button class="mini" data-a="modal" data-v="help" aria-label="Ajuda">?</button>
        </div>
        <div class="hudsub small muted">Nv ${p.level} · ⚔️ ${st.atk} · 🛡️ ${st.def} · 💨 ${st.spd}
          · ${st.w ? `${st.w.i} ${WTYPES[st.w.wt]} ${st.ml}/10` : 'desarmado'}
          <span class="xp"><i style="width:${(p.xp / Game.xpNeed(p.level)) * 100}%"></i></span></div>
      </header>

      <div class="stage">
        <aside class="side panel">${mapHtml()}${areaInfo(mapSel ?? p.area)}</aside>
        <div class="main">
          <section class="panel area ${status}">
            <h2>${a.i} ${a.n}
              ${status === 'condenada' ? '<span class="pill warn">condenada — saia em breve</span>' : status === 'selada' ? '<span class="pill bad">névoa — fuja!</span>' : ''}</h2>
            <p class="desc">${a.d}</p>
            <p class="loot">${loot}</p>
            ${here ? `<p class="small warn-t">👣 Rastros frescos: ${here > 1 ? 'há outros campeões' : 'há outro campeão'} por perto.</p>` : ''}
            ${goalHtml}
          </section>
          <section class="panel log" id="log" aria-live="polite">${S.log.slice(-40).map((l) =>
            `<p class="${l.cls}"><time>${Game.fmtTime(l.t).split(', ')[1]}</time> ${l.msg}</p>`).join('')}</section>
        </div>
      </div>

      <footer class="dock">
        ${quick.length ? `<div class="quick">${quick.map((x) =>
          `<button data-a="use" data-v="${x.i}" title="${itemInfo(ITEMS[x.id])}">${ITEMS[x.id].i}<small>${ITEMS[x.id].hp ? `+${ITEMS[x.id].hp}❤️` : `+${ITEMS[x.id].vigor}⚡`}</small></button>`).join('')}</div>` : ''}
        <nav class="acts">
          <button class="mapbtn ${danger ? 'pulse' : ''}" data-a="modal" data-v="map"><b>🗺️</b>Mapa${kbd('M')}</button>
          <button data-a="rest"><b>🏕️</b>Descansar${kbd('R')}</button>
          <button class="big" data-a="explore" ${p.vigor < 12 ? 'disabled' : ''}><b>🔍</b>Explorar${kbd('E')}</button>
          <button data-a="modal" data-v="craft"><b>⚒️</b>Forjar${kbd('F')}${nCraft ? `<i class="badge">${nCraft}</i>` : ''}</button>
          <button data-a="modal" data-v="inv"><b>🎒</b>Mochila${kbd('I')}<i class="badge dimb">${p.inv.length}/${INV_CAP}</i></button>
        </nav>
      </footer>
    </main>`;
  }

  /* ---------- Painéis ---------- */
  function invModal() {
    const p = Game.S.p;
    const eq = SLOTS.map((s) => `<li><span class="muted">${SLOT_NAMES[s]}</span>
      ${p.equip[s] ? `${itemName(p.equip[s])}<small>${itemInfo(ITEMS[p.equip[s]])}</small>` : '<span class="muted">—</span>'}</li>`).join('');
    const inv = p.inv.length ? p.inv.map((id, i) => {
      const it = ITEMS[id];
      const act = it.t === 'consumivel' ? `<button data-a="use" data-v="${i}">Usar</button>`
        : it.t !== 'material' ? `<button data-a="equip" data-v="${i}">Equipar</button>` : '';
      return `<li>${itemName(id)}<small>${itemInfo(it)}</small>
        <span class="btns">${act}<button class="ghost" data-a="drop" data-v="${i}" aria-label="Descartar ${it.n}">✕</button></span></li>`;
    }).join('') : '<li class="muted">A mochila está vazia.</li>';
    return `<h2>🎒 Mochila <span class="muted">${p.inv.length}/${INV_CAP}</span></h2>
      <h3>Itens</h3><ul class="list">${inv}</ul>
      <h3>Equipado</h3><ul class="list eq">${eq}</ul>`;
  }

  function craftModal() {
    const own = Game.owned();
    const rows = RECIPES.map((r, i) => ({ r, i, ok: Game.canCraft(i), part: r.ins.some((id) => own[id]) }))
      .filter((x) => craftAll || x.ok || x.part)
      .sort((a, b) => b.ok - a.ok || a.i - b.i);
    return `<h2>⚒️ Forjar</h2>
      <label class="check"><input type="checkbox" data-a="craftAll" ${craftAll ? 'checked' : ''}> Mostrar todas as receitas</label>
      <ul class="list">${rows.length ? rows.map(({ r, i, ok }) => {
        const out = ITEMS[r.out];
        return `<li class="${ok ? '' : 'dim'}">${itemName(r.out)}<small>${itemInfo(out)} · ${RARITY[out.r]}</small>
          <small class="ing">${r.ins.map((id) => `<span class="${own[id] ? 'have' : 'miss'}">${ITEMS[id].i} ${ITEMS[id].n}</span>`).join(' + ')}</small>
          <span class="btns">${ok ? `<button class="big" data-a="craft" data-v="${i}">Forjar</button>` : ''}</span></li>`;
      }).join('') : '<li class="muted">Você ainda não tem materiais para nenhuma receita. Explore!</li>'}</ul>`;
  }

  function helpModal() {
    return `<h2>Como Jogar</h2>
      <ul class="help">
        <li><b>Objetivo:</b> ser o último dos dez campeões vivos na ilha.</li>
        <li><b>Explorar</b> rende materiais, armas e comida — mas pode atrair criaturas ou outros campeões.</li>
        <li><b>Forjar</b> combina itens em equipamento melhor. A linha 🎯 mostra o que falta para a próxima arma, e ⭐ marca onde encontrar.</li>
        <li><b>Maestria:</b> quanto mais você luta com um tipo de arma, mais dano causa com ele.</li>
        <li><b>Vigor</b> ⚡ é gasto ao explorar e viajar. Descanse, coma e beba para recuperá-lo.</li>
        <li><b>Névoa Cinzenta:</b> a cada 3 horas o sino condena regiões 🔔; três horas depois a névoa as engole 🌫️ e ficar nelas causa dano constante. No fim resta um único refúgio.</li>
        <li><b>Combate</b> por turnos: atacar, usar a habilidade, consumir um item ou fugir.</li>
        <li>A <b>Forja Antiga</b> acelera a forja; o <b>Bosque Sagrado</b> melhora o descanso; a noite é mais perigosa.</li>
        <li>A partida é salva sozinha neste aparelho.</li>
      </ul>
      <h3 class="keys">Atalhos de teclado</h3>
      <p class="small keys">${kbd('E')} explorar · ${kbd('R')} descansar · ${kbd('F')} forjar · ${kbd('I')} mochila · ${kbd('M')} mapa ·
        setas ou ${kbd('WASD')} viajar · ${kbd('Esc')} fechar<br>
        Em combate: ${kbd('1')} atacar · ${kbd('2')} habilidade · ${kbd('3')} fugir · ${kbd('4')}–${kbd('9')} itens · ${kbd('Enter')} continuar</p>`;
  }

  function combatHtml() {
    const S = Game.S, c = S.combat, e = c.e, p = S.p, st = Game.stats(), h = HEROES[p.hero];
    const items = consumables();
    const controls = c.done
      ? `<button class="big wide" data-a="closeCombat">${S.over ? 'Ver o desfecho' : 'Continuar'}${kbd('Enter')}</button>`
      : `${items.length ? `<div class="quick">${items.map((x, k) =>
          `<button data-a="cbItem" data-v="${x.i}" title="${itemInfo(ITEMS[x.id])}">${ITEMS[x.id].i}<small>${ITEMS[x.id].hp ? `+${ITEMS[x.id].hp}❤️` : `+${ITEMS[x.id].vigor}⚡`}</small>${k < 6 ? kbd(k + 4) : ''}</button>`).join('')}</div>` : ''}
        <div class="cbar">
          <button data-a="cb" data-v="flee"><b>🏃</b>Fugir${kbd('3')}</button>
          <button class="big" data-a="cb" data-v="atk"><b>⚔️</b>Atacar${kbd('1')}</button>
          <button class="skill" data-a="cb" data-v="skill" ${p.cd > 0 ? 'disabled' : ''}><b>✨</b>${h.skill.n}<small>${p.cd > 0 ? `recarga ${p.cd}` : 'pronta'}</small>${kbd('2')}</button>
        </div>`;
    return `<div class="overlay"><div class="modal combat">
      <div class="versus">
        <div><b class="portrait sm">${h.i}</b><strong>${h.n.split(' ')[0]}</strong>
          ${bar('hp', p.hp, st.maxHp, `${p.hp}/${st.maxHp}`)}</div>
        <span class="vs">VS</span>
        <div><b class="portrait sm">${e.i}</b><strong>${e.n}</strong>
          ${bar('hp', Math.max(0, e.hp), e.maxHp, `${Math.max(0, Math.round(e.hp))}/${e.maxHp}`)}</div>
      </div>
      <div class="clog" id="clog" aria-live="polite">${c.lines.map((l) => `<p>${l}</p>`).join('')}</div>
      ${controls}
    </div></div>`;
  }

  function endHtml() {
    const S = Game.S, o = S.over, h = HEROES[S.p.hero];
    return `<div class="overlay"><div class="modal end ${o.win ? 'win' : 'lose'}">
      <div class="flame">${o.win ? '🔥' : '🕯️'}</div>
      <h1>${o.win ? 'A Última Chama é sua' : 'Sua chama se apagou'}</h1>
      <p>${o.reason}.</p>
      <p class="statline">${h.i} ${h.n} · Nível ${S.p.level}<br>
        Colocação: ${o.rank}º de 10 · Campeões derrotados: ${S.kills}<br>Sobreviveu até ${Game.fmtTime(S.time)}</p>
      <div class="foot">
        <button data-a="toTitle">Início</button>
        <button class="big" data-a="start">Jogar de novo</button>
      </div>
    </div></div>`;
  }

  function render() {
    let html = screen === 'title' ? title() : screen === 'select' ? select() : game();
    const S = Game.S;
    if (screen === 'game' && S.combat) html += combatHtml();
    else if (screen === 'game' && S.over) html += endHtml();
    else if (modal) {
      const body = modal === 'inv' ? invModal() : modal === 'craft' ? craftModal() : modal === 'map' ? mapModal() : helpModal();
      html += `<div class="overlay" data-a="closeModal"><div class="modal sheet-${modal}" data-a="noop">
        <div class="body">${body}</div>
        <button class="close" data-a="closeModal">Fechar</button></div></div>`;
    }
    const keep = document.querySelector('.modal .body');
    const top = keep ? keep.scrollTop : 0;
    app.innerHTML = html;
    const body = document.querySelector('.modal .body');
    if (body) body.scrollTop = top;
    for (const id of ['log', 'clog']) {
      const el = document.getElementById(id);
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  /* ---------- Ações ---------- */
  const inGame = () => screen === 'game' && Game.S;
  const acts = {
    toSelect: () => { screen = 'select'; },
    toTitle: () => { screen = 'title'; modal = null; },
    pickHero: (v) => { selHero = Number(v); },
    start: () => { Game.newGame(selHero); screen = 'game'; modal = null; mapSel = null; recorded = false; },
    continue: () => {
      if (Game.restore(store.get(SAVE))) { screen = 'game'; modal = null; mapSel = null; recorded = false; selHero = Game.S.p.hero; }
      else store.del(SAVE);
    },
    modal: (v) => { modal = modal === v ? null : v; mapSel = null; },
    closeModal: () => { modal = null; mapSel = null; },
    noop: () => {},
    craftAll: () => { craftAll = !craftAll; },
    explore: () => Game.explore(),
    rest: () => Game.rest(),
    cell: (v) => {
      const i = Number(v), S = Game.S;
      if (Game.neighbors(S.p.area).includes(i)) { Game.move(i); mapSel = null; if (modal === 'map') modal = null; }
      else mapSel = i;
    },
    craft: (v) => Game.craft(Number(v)),
    equip: (v) => Game.equip(Number(v)),
    use: (v) => Game.useItem(Number(v)),
    drop: (v) => Game.drop(Number(v)),
    cb: (v) => Game.combatAct(v),
    cbItem: (v) => Game.combatAct('item', v),
    closeCombat: () => Game.closeCombat(),
  };
  function run(a, v) {
    if (!acts[a]) return;
    acts[a](v);
    autosave();
    render();
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    run(el.dataset.a, el.dataset.v);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (k === 'escape' && modal) return run('closeModal');
    if (!inGame()) return;
    const S = Game.S;
    if (S.over && !S.combat) return;
    if (S.combat) {
      if (S.combat.done) { if (k === 'enter' || k === ' ') { ev.preventDefault(); run('closeCombat'); } return; }
      if (k === '1') run('cb', 'atk');
      else if (k === '2') run('cb', 'skill');
      else if (k === '3') run('cb', 'flee');
      else if (k >= '4' && k <= '9') { const it = consumables()[Number(k) - 4]; if (it) run('cbItem', it.i); }
      return;
    }
    const panels = { m: 'map', f: 'craft', i: 'inv', b: 'inv' };
    if (panels[k]) return run('modal', panels[k]);
    if (modal && modal !== 'map') return;
    if (k === 'e') return run('explore');
    if (k === 'r') return run('rest');
    const dir = { arrowup: -4, w: -4, arrowdown: 4, s: 4, arrowleft: -1, a: -1, arrowright: 1, d: 1 }[k];
    if (dir) {
      const to = S.p.area + dir;
      if (Game.neighbors(S.p.area).includes(to)) { ev.preventDefault(); run('cell', to); }
    }
  });

  render();
  return { render };
})();
