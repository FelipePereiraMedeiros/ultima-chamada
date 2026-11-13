/* Última Chama — interface */

const UI = (() => {
  const app = document.getElementById('app');
  let screen = 'title';   // title | select | game
  let modal = null;       // inv | craft | help | null
  let selHero = 0;
  let craftAll = false;

  const record = () => {
    try { return JSON.parse(localStorage.getItem('ultima-chama') || '{}'); } catch { return {}; }
  };
  const saveRecord = (win) => {
    try {
      const r = record();
      r.games = (r.games || 0) + 1;
      if (win) r.wins = (r.wins || 0) + 1;
      localStorage.setItem('ultima-chama', JSON.stringify(r));
    } catch { /* sem armazenamento: o jogo segue normalmente */ }
  };

  const bar = (cls, v, max, label) =>
    `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i><span>${label}</span></div>`;

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

  /* ---------- Telas ---------- */
  function title() {
    const r = record();
    return `<main class="title">
      <div class="flame">🔥</div>
      <h1>Última Chama</h1>
      <h2>Ilha de Vharun</h2>
      <p class="lead">A cada geração a chama do mundo vacila. Dez campeões são levados à ilha,
      a Névoa Cinzenta se fecha — e apenas um sairá carregando o fogo.</p>
      <div class="col">
        <button class="big" data-a="toSelect">Nova Partida</button>
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
      <div class="row">
        <button data-a="toTitle">Voltar</button>
        <button class="big" data-a="start">Entrar na Ilha</button>
      </div>
    </main>`;
  }

  function mapHtml() {
    const S = Game.S, p = S.p, nb = Game.neighbors(p.area);
    const tracker = HEROES[p.hero].passive === 'rastreador';
    return `<div class="map">${AREAS.map((a, i) => {
      const st = S.areas[i], here = i === p.area, adj = nb.includes(i);
      const seen = (tracker && adj) ? Game.npcsAt(i).length : 0;
      return `<button class="cell ${st} ${here ? 'here' : ''} ${adj ? 'adj' : ''}" ${adj ? `data-a="move" data-v="${i}"` : 'disabled'}
        title="${a.n}${st !== 'livre' ? ` (${st})` : ''}">
        <b>${a.i}</b><span>${a.n}</span>
        ${here ? '<em class="you">VOCÊ</em>' : ''}
        ${st === 'condenada' ? '<em class="tag warn">🔔</em>' : st === 'selada' ? '<em class="tag bad">🌫️</em>' : ''}
        ${seen ? `<em class="tag seen">👁️ ${seen}</em>` : ''}
      </button>`;
    }).join('')}</div>`;
  }

  function game() {
    const S = Game.S, p = S.p, st = Game.stats(), h = HEROES[p.hero], a = AREAS[p.area];
    const status = S.areas[p.area];
    const mm = Game.nextMist();
    const here = Game.npcsAt(p.area).length;
    const loot = [...new Set(a.loot.map((l) => l[0]))].map((id) => `<span title="${ITEMS[id].n}">${ITEMS[id].i}</span>`).join(' ');
    const wt = st.w ? st.w.wt : null;
    return `<main class="game">
      <header class="top">
        <span>${Game.isNight() ? '🌙' : '☀️'} ${Game.fmtTime(S.time)}</span>
        <span title="Tempo até o próximo avanço da névoa">🔔 ${Math.floor(mm / 60)}h${String(mm % 60).padStart(2, '0')}</span>
        <span>👥 ${Game.aliveNpcs().length + 1}/10</span>
        <span>☠️ ${S.kills}</span>
        <button class="mini" data-a="modal" data-v="help">?</button>
      </header>

      <section class="panel me">
        <div class="who"><b class="portrait sm">${h.i}</b>
          <div><strong>${h.n}</strong><br><span class="muted">Nível ${p.level} · ⚔️ ${st.atk} · 🛡️ ${st.def} · 💨 ${st.spd}</span></div></div>
        ${bar('hp', p.hp, st.maxHp, `Vida ${p.hp}/${st.maxHp}`)}
        ${bar('vg', p.vigor, 100, `Vigor ${p.vigor}/100`)}
        ${bar('xp', p.xp, Game.xpNeed(p.level), `Experiência ${p.xp}/${Game.xpNeed(p.level)}`)}
        <p class="small muted">${st.w ? `${itemName(st.w.id)} · Maestria ${WTYPES[wt]} ${st.ml}/10` : 'Desarmado'}</p>
      </section>

      <section class="panel">${mapHtml()}
        <p class="small muted center">Toque numa região vizinha para viajar (30 min, 10 de vigor).</p></section>

      <section class="panel area ${status}">
        <h2>${a.i} ${a.n}
          ${status === 'condenada' ? '<span class="tag warn">condenada</span>' : status === 'selada' ? '<span class="tag bad">tomada pela névoa</span>' : ''}</h2>
        <p>${a.d}</p>
        <p class="small muted">Costuma-se achar aqui: ${loot}</p>
        ${here ? `<p class="small warn-t">👣 Rastros frescos: ${here > 1 ? 'há outros campeões' : 'há outro campeão'} por perto.</p>` : ''}
        <div class="actions">
          <button class="big" data-a="explore">🔍 Explorar<small>20 min · 12 vigor</small></button>
          <button data-a="rest">🏕️ Descansar<small>1 hora</small></button>
          <button data-a="modal" data-v="craft">⚒️ Forjar</button>
          <button data-a="modal" data-v="inv">🎒 Mochila<small>${p.inv.length}/${INV_CAP}</small></button>
        </div>
      </section>

      <section class="panel log" id="log">${S.log.slice(-40).map((l) =>
        `<p class="${l.cls}"><time>${Game.fmtTime(l.t).split(', ')[1]}</time> ${l.msg}</p>`).join('')}</section>
    </main>`;
  }

  /* ---------- Sobreposições ---------- */
  function invModal() {
    const p = Game.S.p;
    const eq = SLOTS.map((s) => `<li><span class="muted">${SLOT_NAMES[s]}</span>
      ${p.equip[s] ? `${itemName(p.equip[s])}<small>${itemInfo(ITEMS[p.equip[s]])}</small>` : '<span class="muted">—</span>'}</li>`).join('');
    const inv = p.inv.length ? p.inv.map((id, i) => {
      const it = ITEMS[id];
      const act = it.t === 'consumivel' ? `<button data-a="use" data-v="${i}">Usar</button>`
        : it.t !== 'material' ? `<button data-a="equip" data-v="${i}">Equipar</button>` : '';
      return `<li>${itemName(id)}<small>${itemInfo(it)}</small>
        <span class="btns">${act}<button class="ghost" data-a="drop" data-v="${i}" title="Descartar">✕</button></span></li>`;
    }).join('') : '<li class="muted">A mochila está vazia.</li>';
    return `<h2>🎒 Mochila <span class="muted">${p.inv.length}/${INV_CAP}</span></h2>
      <h3>Equipado</h3><ul class="list eq">${eq}</ul>
      <h3>Itens</h3><ul class="list">${inv}</ul>`;
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
          <span class="btns">${ok ? `<button data-a="craft" data-v="${i}">Forjar</button>` : ''}</span></li>`;
      }).join('') : '<li class="muted">Você ainda não tem materiais para nenhuma receita. Explore!</li>'}</ul>`;
  }

  function helpModal() {
    return `<h2>Como Jogar</h2>
      <ul class="help">
        <li><b>Objetivo:</b> ser o último dos dez campeões vivos na ilha.</li>
        <li><b>Explorar</b> uma região rende materiais, armas e comida — mas pode atrair criaturas ou outros campeões.</li>
        <li><b>Forjar</b> combina itens em equipamento melhor. Cada tipo de arma tem cinco degraus, do comum ao lendário.</li>
        <li><b>Maestria:</b> quanto mais você luta com um tipo de arma, mais dano causa com ele.</li>
        <li><b>Vigor</b> é gasto ao explorar e viajar. Descanse, coma e beba para recuperá-lo.</li>
        <li><b>Névoa Cinzenta:</b> a cada 3 horas o sino toca e regiões são condenadas 🔔; três horas depois a névoa as engole 🌫️ e ficar nelas causa dano constante. No fim resta um único refúgio.</li>
        <li><b>Combate</b> é por turnos: atacar, usar a habilidade do campeão, consumir um item ou fugir.</li>
        <li>Os outros campeões também exploram, se fortalecem e lutam entre si. O tempo joga contra você.</li>
        <li>A <b>Forja Antiga</b> acelera a forja; o <b>Bosque Sagrado</b> melhora o descanso; a noite é mais perigosa.</li>
      </ul>`;
  }

  function combatHtml() {
    const S = Game.S, c = S.combat, e = c.e, p = S.p, st = Game.stats(), h = HEROES[p.hero];
    const items = p.inv.map((id, i) => ({ id, i })).filter((x) => ITEMS[x.id].t === 'consumivel');
    const controls = c.done
      ? `<button class="big" data-a="closeCombat">${S.over ? 'Ver o desfecho' : 'Continuar'}</button>`
      : `<div class="actions">
          <button class="big" data-a="cb" data-v="atk">⚔️ Atacar</button>
          <button data-a="cb" data-v="skill" ${p.cd > 0 ? 'disabled' : ''}>✨ ${h.skill.n}<small>${p.cd > 0 ? `recarga: ${p.cd}` : 'pronta'}</small></button>
          <button data-a="cb" data-v="flee">🏃 Fugir</button>
        </div>
        ${items.length ? `<div class="quick">${items.map((x) =>
          `<button data-a="cbItem" data-v="${x.i}" title="${itemInfo(ITEMS[x.id])}">${ITEMS[x.id].i} ${ITEMS[x.id].n}</button>`).join('')}</div>` : ''}`;
    return `<div class="overlay"><div class="modal combat">
      <div class="versus">
        <div><b class="portrait sm">${h.i}</b><strong>${h.n.split(' ')[0]}</strong>
          ${bar('hp', p.hp, st.maxHp, `${p.hp}/${st.maxHp}`)}</div>
        <span class="vs">VS</span>
        <div><b class="portrait sm">${e.i}</b><strong>${e.n}</strong>
          ${bar('hp', Math.max(0, e.hp), e.maxHp, `${Math.max(0, Math.round(e.hp))}/${e.maxHp}`)}</div>
      </div>
      <div class="clog" id="clog">${c.lines.map((l) => `<p>${l}</p>`).join('')}</div>
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
      <button class="big" data-a="toTitle">Voltar ao início</button>
    </div></div>`;
  }

  function render() {
    let html = screen === 'title' ? title() : screen === 'select' ? select() : game();
    const S = Game.S;
    if (screen === 'game' && S.combat) html += combatHtml();
    else if (screen === 'game' && S.over) html += endHtml();
    else if (modal) {
      const body = modal === 'inv' ? invModal() : modal === 'craft' ? craftModal() : helpModal();
      html += `<div class="overlay" data-a="closeModal"><div class="modal" data-a="noop">${body}
        <button class="close" data-a="closeModal">Fechar</button></div></div>`;
    }
    app.innerHTML = html;
    for (const id of ['log', 'clog']) {
      const el = document.getElementById(id);
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  /* ---------- Eventos ---------- */
  let recorded = false;
  const acts = {
    toSelect: () => { screen = 'select'; },
    toTitle: () => { screen = 'title'; modal = null; },
    pickHero: (v) => { selHero = Number(v); },
    start: () => { Game.newGame(selHero); screen = 'game'; modal = null; recorded = false; },
    modal: (v) => { modal = v; },
    closeModal: () => { modal = null; },
    noop: () => {},
    craftAll: () => { craftAll = !craftAll; },
    explore: () => Game.explore(),
    rest: () => Game.rest(),
    move: (v) => Game.move(Number(v)),
    craft: (v) => Game.craft(Number(v)),
    equip: (v) => Game.equip(Number(v)),
    use: (v) => Game.useItem(Number(v)),
    drop: (v) => Game.drop(Number(v)),
    cb: (v) => Game.combatAct(v),
    cbItem: (v) => Game.combatAct('item', v),
    closeCombat: () => Game.closeCombat(),
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    acts[el.dataset.a]?.(el.dataset.v);
    const S = Game.S;
    if (screen === 'game' && S && S.over && !recorded) { recorded = true; saveRecord(S.over.win); }
    render();
  });

  render();
  return { render };
})();
