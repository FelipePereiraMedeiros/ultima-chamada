/* Última Chama — interface em tempo real (pensada primeiro para celular) */

const UI = (() => {
  const app = document.getElementById('app');
  const REC = 'ultima-chama', MAX_PLAYERS = 8;
  let screen = 'title';   // title | select | lobby | game
  let mode = 'solo';      // solo | host | join
  let sess = null;        // partida ou sala em andamento
  let modal = null;       // map | inv | craft | help
  let selHero = 0, nick = '', joinCode = '', notice = '';
  let craftAll = false, craftTab = 'all', mapSel = null, recorded = false;

  /* ---------- Armazenamento local (o jogo funciona sem ele) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* indisponível */ } },
  };
  const record = () => { try { return JSON.parse(store.get(REC) || '{}'); } catch { return {}; } };
  nick = record().nick || '';

  /* ---------- Sessão: solo, anfitrião ou convidado ---------- */
  const V = () => sess && sess.view;
  const simNow = () => (V() ? V().now + (V().ended ? 0 : (performance.now() - sess.recvAt) / 1000) : 0);

  function setView(v) {
    const old = V();
    if (old && v && v.you.hp < old.you.hp && v.you.alive) {
      try { navigator.vibrate && navigator.vibrate(25); } catch { /* sem vibração */ }
      document.body.classList.add('hurt');
      setTimeout(() => document.body.classList.remove('hurt'), 160);
    }
    diff(old, v);
    sess.view = v; sess.recvAt = performance.now();
    if (v && v.you.over && !recorded) {
      recorded = true;
      const r = record();
      r.games = (r.games || 0) + 1;
      if (v.you.over.win) r.wins = (r.wins || 0) + 1;
      store.set(REC, JSON.stringify(r));
    }
  }

  /* ---------- Efeitos: comparam a visão anterior com a nova e são tocados depois do desenho ---------- */
  const calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pending = [];
  const fx = document.createElement('div');
  fx.id = 'fx';
  fx.innerHTML = '<div id="floats"></div><div id="banners"></div><div id="toasts"></div>';
  document.body.appendChild(fx);

  function diff(old, v) {
    if (!old || !v || calm) return;
    const a = old.you, b = v.you;
    const last = old.log[old.log.length - 1];
    let i = 0;
    if (last) { for (i = v.log.length - 1; i >= 0; i--) if (v.log[i].t === last.t && v.log[i].m === last.m) break; i++; }
    const fresh = v.log.slice(Math.max(i, v.log.length - 4));
    const crit = fresh.some((e) => e.c === 'cb' && e.m.includes('CRÍTICO'));
    if (b.hp < a.hp && b.alive) pending.push({ k: 'num', who: 'you', txt: `−${a.hp - b.hp}`, cls: 'dmg' });
    else if (b.hp - a.hp >= 8 && b.level === a.level && !b.resting) pending.push({ k: 'num', who: 'you', txt: `+${b.hp - a.hp}`, cls: 'heal' });
    if (old.foe && v.foe && old.foe.name === v.foe.name) {
      if (v.foe.hp < old.foe.hp) pending.push({ k: 'num', who: 'foe', txt: `−${old.foe.hp - v.foe.hp}`, cls: crit ? 'dmg crit' : 'dmg' });
      if (v.foe.atkAt > old.foe.atkAt + 0.3) pending.push({ k: 'lunge', who: 'foe' });
      if (b.atkAt > a.atkAt + 0.3) pending.push({ k: 'lunge', who: 'you' });
    }
    if (b.level > a.level) pending.push({ k: 'glow' });
    for (const e of fresh) {
      if (e.c === 'good' || /^(Encontrou|Obteve|Saqueou|Recolheu|Reclamou) /.test(e.m)) pending.push({ k: 'toast', txt: e.m });
      else if (e.c === 'kill') pending.push({ k: 'banner', txt: e.m, cls: 'kill' });
      else if (e.c === 'sys' && e.t > 1) pending.push({ k: 'banner', txt: e.m, cls: 'sys' });
      else if ((e.c === 'warn' && /^[🔔🔥]/u.test(e.m)) || (e.c === 'bad' && e.m.includes('engoliu'))) pending.push({ k: 'banner', txt: e.m, cls: 'mist' });
    }
  }
  function kick(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  function pop(parent, cls, txt, ms) {
    const el = document.createElement('div');
    el.className = cls; el.textContent = txt;
    parent.appendChild(el);
    while (parent.id !== 'floats' && parent.children.length > 3) parent.firstChild.remove();
    setTimeout(() => el.remove(), ms);
    return el;
  }
  function flushFx() {
    for (const f of pending.splice(0)) {
      const inFight = !!document.querySelector('#r-vs .versus');
      const el = document.querySelector(f.who === 'foe' ? '#r-vs .versus > div:last-child .portrait'
        : inFight ? '#r-vs .versus > div:first-child .portrait' : '#r-hud .portrait');
      if (f.k === 'num' && el) {
        const r = el.getBoundingClientRect();
        const n = pop(document.getElementById('floats'), `float ${f.cls}`, f.txt, 900);
        n.style.left = `${r.left + r.width / 2 + (Math.random() * 24 - 12)}px`;
        n.style.top = `${r.top}px`;
        if (f.cls !== 'heal') kick(el, 'shake');
      } else if (f.k === 'lunge' && el) kick(el, f.who === 'foe' ? 'lunge-l' : 'lunge-r');
      else if (f.k === 'glow') { const p = document.querySelector('#r-hud .portrait'); if (p) kick(p, 'glow'); }
      else if (f.k === 'toast') pop(document.getElementById('toasts'), 'toast', f.txt, 2200);
      else if (f.k === 'banner' && !V().you.over) pop(document.getElementById('banners'), `banner ${f.cls}`, f.txt, 4200);
    }
  }
  let overKind = '', lastScreen = '';
  function enter(kind, sel) {
    const changed = kind !== overKind;
    overKind = kind;
    if (changed && kind && !calm) { const el = document.querySelector(sel); if (el) kick(el, 'enter'); }
  }

  function leave() {
    if (sess && sess.timer) clearInterval(sess.timer);
    if (sess && sess.mode !== 'solo') Net.close();
    sess = null; modal = null; mapSel = null;
  }

  const lobbyRoster = () => sess.players.map((p) => ({ name: p.name || HEROES[p.hero].n, hero: p.hero, host: p.pid === 'me' }));
  function sendLobby() {
    const roster = lobbyRoster();
    for (const p of sess.players) if (p.pid !== 'me') Net.send(p.pid, { t: 'lobby', roster, code: sess.code });
  }

  function beginMatch() {
    sess.sim = Sim.create(sess.players);
    sess.myId = sess.sim.ids.me;
    sess.started = true;
    recorded = false; modal = null; mapSel = null; screen = 'game';
    setView(sess.sim.view(sess.myId));
    let last = performance.now(), sent = 0;
    const pushViews = () => {
      for (const p of sess.players) if (p.pid !== 'me') Net.send(p.pid, { t: 'view', v: sess.sim.view(sess.sim.ids[p.pid]) });
    };
    sess.push = pushViews;
    sess.timer = setInterval(() => {
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      if (sess.mode === 'solo' && document.hidden) return; // sozinho, o jogo espera você voltar
      for (let n = 0; dt > 0 && n < 60; n++) { const d = Math.min(0.25, dt); sess.sim.step(d); dt -= d; }
      setView(sess.sim.view(sess.myId));
      if (now - sent >= 240) { sent = now; pushViews(); }
      render();
    }, 100);
  }

  function startSolo() {
    leave();
    sess = { mode: 'solo', players: [{ pid: 'me', name: '', hero: selHero }] };
    beginMatch();
  }

  function createRoom() {
    leave();
    sess = { mode: 'host', players: [{ pid: 'me', name: nick, hero: selHero }], code: null, started: false };
    screen = 'lobby'; notice = 'Abrindo a sala…';
    Net.host({
      onOpen: (code) => { if (!sess) return; sess.code = code; notice = ''; render(); },
      onError: (text) => { leave(); screen = 'select'; notice = text; render(); },
      onMsg: (pid, m) => {
        if (!sess || !m) return;
        if (m.t === 'join') {
          if (sess.started) return Net.send(pid, { t: 'no', why: 'A partida já começou.' });
          if (sess.players.length >= MAX_PLAYERS) return Net.send(pid, { t: 'no', why: 'A sala está cheia.' });
          if (sess.players.some((p) => p.pid === pid)) return;
          const hero = Number(m.hero);
          if (!HEROES[hero]) return;
          sess.players.push({ pid, name: String(m.name || '').slice(0, 16), hero });
          sendLobby(); render();
        } else if (m.t === 'cmd' && sess.started) {
          const id = sess.sim.ids[pid];
          if (id) sess.sim.cmd(id, String(m.c), m.v);
        }
      },
      onLeave: (pid) => {
        if (!sess) return;
        if (sess.started) { const id = sess.sim.ids[pid]; if (id) sess.sim.removePlayer(id); }
        sess.players = sess.players.filter((p) => p.pid !== pid);
        if (!sess.started) { sendLobby(); render(); }
      },
    });
  }

  function joinRoom() {
    leave();
    sess = { mode: 'join', roster: null, code: joinCode.trim().toUpperCase() };
    screen = 'lobby'; notice = 'Conectando à sala…';
    const fail = (text) => { leave(); screen = 'select'; notice = text; render(); };
    Net.join(sess.code, {
      onOpen: () => Net.toHost({ t: 'join', name: nick, hero: selHero }),
      onError: fail,
      onClose: () => {
        if (!sess) return;
        if (V() && (V().ended || V().you.over)) return; // a partida já terminou: mantém o desfecho na tela
        fail('A conexão com o anfitrião foi perdida.');
      },
      onMsg: (m) => {
        if (!sess || !m) return;
        if (m.t === 'no') return fail(m.why);
        if (m.t === 'lobby') { sess.roster = m.roster; notice = ''; }
        if (m.t === 'view') {
          if (screen !== 'game') { screen = 'game'; recorded = false; modal = null; }
          setView(m.v);
        }
        render();
      },
    });
  }

  function command(c, v) {
    if (!sess || !V()) return;
    if (sess.mode === 'join') return Net.toHost({ t: 'cmd', c, v });
    sess.sim.cmd(sess.myId, c, v);
    setView(sess.sim.view(sess.myId));
  }

  /* ---------- Pequenos blocos ---------- */
  const bar = (cls, v, max, label) =>
    `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i><span>${label}</span></div>`;
  const kbd = (k) => `<kbd>${k}</kbd>`;
  const clock = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function itemInfo(it) {
    const b = [];
    if (it.t === 'arma') b.push(`${WTYPES[it.wt]} · Ataque +${it.atk}`);
    if (it.t === 'armadura') {
      b.push(SLOT_NAMES[it.slot]);
      if (it.def) b.push(`Defesa +${it.def}`);
      if (it.hp) b.push(`Vida +${it.hp}`);
      if (it.spd) b.push(`Velocidade +${it.spd}`);
      if (it.crit) b.push(`Crítico +${Math.round(it.crit * 100)}%`);
      if (it.haste) b.push(`Ataca ${Math.round(it.haste * 100)}% mais rápido`);
      if (it.block) b.push(`Defender apara +${Math.round(it.block * 100)}%`);
      if (it.stun) b.push(`Atordoamento −${Math.round(it.stun * 100)}%`);
      if (it.thorns) b.push(`Devolve ${Math.round(it.thorns * 100)}% do dano`);
      if (it.regen) b.push(`Regenera +${it.regen}`);
      if (it.mist) b.push(`Névoa −${Math.round(it.mist * 100)}%`);
      if (it.stride) b.push('Viajar não gasta vigor');
    }
    if (it.t === 'consumivel') {
      if (it.hp) b.push(`Vida +${it.hp}`);
      if (it.vigor) b.push(`Vigor +${it.vigor}`);
    }
    if (it.t === 'material') b.push('Material');
    if (it.t === 'arremesso') b.push(`Arremesso · ${it.dmg} de dano${it.stun ? ' · atordoa' : ''} · só em combate`);
    if (it.t === 'armadilha') b.push(`Armadilha · ${it.dmg} de dano${it.bleed ? ' · faz sangrar' : ''} · arme numa região`);
    return b.join(' · ');
  }
  const itemName = (id) => { const it = ITEMS[id]; return `<span class="r${it.r}">${it.i} ${it.n}</span>`; };
  const quickLabel = (it) => (it.t === 'arremesso' ? `💥${it.dmg}` : it.t === 'armadilha' ? 'armar' : it.hp ? `+${it.hp}❤️` : `+${it.vigor}⚡`);

  function goal() {
    const u = V().you;
    const ri = RECIPES.findIndex((r) => r.ins.includes(u.equip.arma));
    if (ri < 0) return null;
    const own = Sim.owned(u);
    return { ri, rec: RECIPES[ri], miss: RECIPES[ri].ins.filter((id) => !own[id]) };
  }
  /* Próxima proteção ao alcance: só melhorias, preferindo a que falta menos e as partes desprotegidas */
  function defGoal() {
    const u = V().you, own = Sim.owned(u);
    let best = null;
    RECIPES.forEach((rec, ri) => {
      const out = ITEMS[rec.out];
      if (out.t !== 'armadura' || own[out.id]) return;
      const cur = u.equip[out.slot] && ITEMS[u.equip[out.slot]];
      if (cur && out.r <= cur.r) return;
      const miss = rec.ins.filter((id) => !own[id]);
      const score = miss.length * 10 + (cur ? 1 : 0) - out.r * 0.1;
      if (!best || score < best.score) best = { ri, rec, miss, score };
    });
    return best;
  }
  const wanted = (g, dg) => [...new Set([...(g ? g.miss : []), ...(dg ? dg.miss : [])])];
  const areaHas = (a, ids) => ids.some((id) => AREAS[a].loot.some((l) => l[0] === id));
  /* Itens de uso rápido: comida sempre; arremessos só em combate; armadilhas só fora dele */
  const consumables = () => {
    const extra = V().foe ? 'arremesso' : 'armadilha';
    return V().you.inv.map((id, i) => ({ id, i })).filter((x) => ITEMS[x.id].t === 'consumivel' || ITEMS[x.id].t === extra);
  };

  /* ---------- Título, seleção e sala ---------- */
  function title() {
    const r = record();
    return `<main class="title">
      <div class="embers" aria-hidden="true">${Array.from({ length: 14 }, (_, i) =>
        `<i style="left:${(i * 37) % 100}%;animation-delay:-${(i * 0.83).toFixed(2)}s;animation-duration:${5 + (i % 5)}s"></i>`).join('')}</div>
      <div class="flame">🔥</div>
      <h1>Última Chama</h1>
      <h2>Ilha de Vharun</h2>
      <p class="lead">Uma vez a cada era, a Última Chama concede um único desejo.
      Dez amaldiçoados foram chamados à ilha para disputá-la — cada um com um erro antigo para desfazer.</p>
      <div class="col">
        <button class="big" data-a="mode" data-v="solo">Jogar Sozinho</button>
        <button data-a="mode" data-v="host">Criar Sala</button>
        <button data-a="mode" data-v="join">Entrar em Sala</button>
        <button data-a="modal" data-v="help">Como Jogar</button>
      </div>
      ${r.games ? `<p class="muted">Partidas: ${r.games} · Vitórias: ${r.wins || 0}</p>` : ''}
      <p class="muted small">Jogo de sobrevivência original em tempo real. Projeto de fã, sem fins lucrativos.</p>
    </main>`;
  }

  function select() {
    const h = HEROES[selHero], w = ITEMS[h.start];
    const go = mode === 'solo' ? 'Entrar na Ilha' : mode === 'host' ? 'Criar Sala' : 'Entrar na Sala';
    return `<main class="select">
      <h1>${mode === 'solo' ? 'Escolha seu amaldiçoado' : mode === 'host' ? 'Criar sala' : 'Entrar em sala'}</h1>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
      ${mode !== 'solo' ? `<div class="fields">
        <label>Seu nome<input data-in="nick" maxlength="16" autocomplete="off" placeholder="Como os outros verão você" value="${esc(nick)}"></label>
        ${mode === 'join' ? `<label>Código da sala<input data-in="code" maxlength="5" autocomplete="off" autocapitalize="characters" placeholder="5 letras" value="${esc(joinCode)}"></label>` : ''}
      </div>` : ''}
      <div class="heroes">${HEROES.map((x, i) =>
        `<button class="hero ${i === selHero ? 'on' : ''}" data-a="pickHero" data-v="${i}">
          <b>${x.i}</b><span>${x.s}</span></button>`).join('')}</div>
      <section class="panel herocard">
        <div class="portrait">${h.i}</div>
        <div>
          <h2>${h.n}</h2>
          <p class="muted">${h.race} · ${WTYPES[h.wt]}</p>
          <p><em>${h.lore}</em></p>
          <p class="statline">❤️ ${h.hp} · ⚔️ ${h.atk} · 🛡️ ${h.def} · 💨 ${h.spd} · Começa com ${w.i} ${w.n}</p>
          <p><b>Arma — ${WTYPES[h.wt]}:</b> ${WTRAITS[h.wt].d}</p>
          <p><b>Passiva — ${h.pn}:</b> ${h.pd}</p>
          <p><b>Habilidade — ${h.skill.n}:</b> ${h.skill.d} <span class="muted">(recarga: ${h.skill.cd * Sim.T.skillTurn}s)</span></p>
          <p class="small wishhint">🔥 O desejo ${h.de} só será revelado se a Chama for sua.</p>
        </div>
      </section>
      <div class="foot">
        <button data-a="toTitle">Voltar</button>
        <button class="big" data-a="go">${go}</button>
      </div>
    </main>`;
  }

  function lobby() {
    const isHost = sess.mode === 'host';
    const roster = isHost ? lobbyRoster() : sess.roster;
    return `<main class="select lobby">
      <h1>Sala de espera</h1>
      ${sess.code ? `<p class="center muted">Código da sala</p><p class="code">${esc(sess.code)}</p>
        <p class="center small muted">${isHost ? 'Passe este código para quem vai jogar. A partida roda no seu aparelho: mantenha esta tela aberta.' : 'Aguardando o anfitrião começar a partida…'}</p>` : ''}
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
      ${roster ? `<ul class="list roster">${roster.map((p) =>
        `<li><span>${HEROES[p.hero].i} <b>${esc(p.name)}</b></span><small>${HEROES[p.hero].n}${p.host ? ' · anfitrião' : ''}</small></li>`).join('')}</ul>
        <p class="small muted center">${roster.length} de ${MAX_PLAYERS} jogadores · os lugares vagos, até dez campeões, são ocupados pelo jogo.</p>` : ''}
      <div class="foot">
        <button data-a="toTitle">Sair</button>
        ${isHost ? `<button class="big" data-a="begin" ${sess.code ? '' : 'disabled'}>Começar partida</button>` : '<span></span>'}
      </div>
    </main>`;
  }

  /* ---------- Mapa ---------- */
  function mapHtml() {
    const v = V(), u = v.you, nb = Sim.neighbors(u.area);
    const g = goal(), dg = defGoal(), miss = wanted(g, dg);
    return `<div class="map">${AREAS.map((a, i) => {
      const st = v.areas[i], here = i === u.area, adj = nb.includes(i);
      const seen = v.near[i] || 0;
      const want = miss.length && st !== 'selada' && areaHas(i, miss);
      return `<button class="cell ${st} ${here ? 'here' : ''} ${adj ? 'adj' : ''} ${mapSel === i ? 'sel' : ''}" data-a="cell" data-v="${i}"
        aria-label="${a.n}${st !== 'livre' ? `, ${st}` : ''}${adj ? ', vizinha' : ''}">
        <b>${a.i}</b><span>${a.n}</span>
        ${here ? '<em class="you">VOCÊ</em>' : ''}
        ${st === 'condenada' ? '<em class="tag tr">🔔</em>' : st === 'selada' ? '<em class="tag tr">🌫️</em>' : ''}
        ${(() => { const m = (want ? '⭐' : '') + (v.relic === i ? '✨' : '') + (v.caches.includes(i) ? '⚰️' : '') + (v.traps.includes(i) ? '🪤' : ''); return m ? `<em class="tag bl">${m}</em>` : ''; })()}
        ${seen ? `<em class="tag br seen">👁️${seen}</em>` : ''}
      </button>`;
    }).join('')}</div>`;
  }

  function areaInfo(i) {
    const a = AREAS[i], st = V().areas[i];
    const g = goal(), dg = defGoal(), miss = wanted(g, dg);
    const loot = [...new Set(a.loot.map((l) => l[0]))].map((id) =>
      `<span class="${miss.includes(id) ? 'want' : ''}">${ITEMS[id].i} ${ITEMS[id].n}</span>`).join(', ');
    return `<div class="info">
      <strong>${a.i} ${a.n}</strong>
      ${st === 'condenada' ? '<span class="pill warn">condenada</span>' : st === 'selada' ? '<span class="pill bad">névoa</span>' : ''}
      ${a.forge ? '<span class="pill">forja rápida</span>' : ''}${a.sanctuary ? '<span class="pill">descanso melhor</span>' : ''}
      <p class="small">${loot}</p>
      <p class="small muted">Perigos: ${a.mons.map((m) => `${MONS[m].i} ${MONS[m].n}`).join(', ')}</p>
    </div>`;
  }

  /* ---------- Regiões da tela de jogo ---------- */
  const GAME_SHELL = `<main class="game">
      <header class="hud"><div class="hudrow"><div class="grow" id="r-hud"></div>
        <button class="mini" data-a="modal" data-v="help" aria-label="Ajuda">?</button></div></header>
      <div class="stage">
        <aside class="side panel" id="r-side"></aside>
        <div class="main"><div id="r-area"></div><section class="panel log" id="r-log" aria-live="polite"></section></div>
      </div>
      <footer class="dock">
        <div class="actwrap" id="actwrap"><i id="actbar"></i><span id="actlabel"></span></div>
        <div class="quick" id="r-quick"></div>
        <nav class="acts" id="r-acts"></nav>
      </footer>
    </main><div id="r-over"></div>`;

  function hudHtml() {
    const v = V(), u = v.you, st = u.st, h = HEROES[u.hero];
    return `<div class="hudtop"><b class="portrait sm">${h.i}</b><div class="grow">
        <div class="chips">
          <span title="Tempo de partida">⏱️ <span id="clock">0:00</span></span>
          <span id="mistchip" title="Tempo até o sino">${v.lastStand ? '🔥 refúgio final' : '🔔 <span id="mist">0:00</span>'}</span>
          <span title="Campeões vivos">👥 ${v.alive}</span>
          <span title="Campeões que você derrotou">☠️ ${u.kills}</span>
        </div>
        ${bar('hp', u.hp, st.maxHp, `❤️ ${u.hp}/${st.maxHp}`)}
        ${bar('vg', u.vigor, 100, `⚡ ${u.vigor}/100`)}
      </div></div>
      <div class="hudsub small muted">Nv ${u.level} · ⚔️ ${st.atk} · 🛡️ ${st.def} · 💨 ${st.spd}
        · ${st.w ? `${ITEMS[st.w].i} ${WTYPES[ITEMS[st.w].wt]} ${st.ml}/10` : 'desarmado'}
        <span class="xp"><i style="width:${(u.xp / Sim.xpNeed(u.level)) * 100}%"></i></span></div>`;
  }

  function areaHtml() {
    const v = V(), u = v.you, a = AREAS[u.area], status = v.areas[u.area];
    const g = goal(), dg = defGoal(), miss = wanted(g, dg);
    const loot = [...new Set(a.loot.map((l) => l[0]))].map((id) =>
      `<span class="${miss.includes(id) ? 'want' : ''}" title="${ITEMS[id].n}">${ITEMS[id].i}</span>`).join('');
    const goalHtml = !g ? ''
      : !g.miss.length
        ? `<button class="goal ready" data-a="craft" data-v="${g.ri}">⚒️ Pronto: forjar ${itemName(g.rec.out)}</button>`
        : `<p class="goal small">🎯 ${itemName(g.rec.out)} — falta ${g.miss.map((id) => `${ITEMS[id].i} ${ITEMS[id].n}`).join(', ')}${areaHas(u.area, g.miss) ? ' <b class="want">⭐ há aqui</b>' : ''}</p>`;
    return `<section class="panel area ${status}">
      <h2>${a.i} ${a.n}
        ${status === 'condenada' ? '<span class="pill warn">condenada — saia em breve</span>' : status === 'selada' ? '<span class="pill bad">névoa — fuja!</span>' : ''}</h2>
      <p class="desc">${a.d}</p>
      <p class="loot">${loot}</p>
      ${v.here ? `<p class="small warn-t">👣 Rastros frescos: ${v.here > 1 ? 'há outros campeões' : 'há outro campeão'} por perto.</p>` : ''}
      ${v.relic === u.area ? '<p class="small want">✨ Há uma relíquia escondida aqui: explore para reclamá-la.</p>' : ''}
      ${v.caches.includes(u.area) ? '<p class="small">⚰️ Alguém caiu aqui e deixou espólios: explore para achá-los.</p>' : ''}
      ${v.traps.includes(u.area) ? '<p class="small muted">🪤 Sua armadilha está armada aqui.</p>' : ''}
      ${goalHtml}
      ${!dg ? '' : !dg.miss.length
        ? `<button class="goal ready" data-a="craft" data-v="${dg.ri}">🛡️ Pronto: forjar ${itemName(dg.rec.out)}</button>`
        : `<p class="goal small">🛡️ ${itemName(dg.rec.out)} — falta ${dg.miss.map((id) => `${ITEMS[id].i} ${ITEMS[id].n}`).join(', ')}${areaHas(u.area, dg.miss) ? ' <b class="want">⭐ há aqui</b>' : ''}</p>`}
    </section>`;
  }

  const logHtml = (n) => V().log.slice(-n).map((l) => `<p class="${esc(l.c)}"><time>${clock(l.t)}</time> ${esc(l.m)}</p>`).join('');

  function actsHtml() {
    const v = V(), u = v.you;
    const nCraft = RECIPES.reduce((n, _, i) => n + (Sim.canCraft(u, i) ? 1 : 0), 0);
    const danger = v.areas[u.area] !== 'livre';
    return `<button class="mapbtn ${danger ? 'pulse' : ''}" data-a="modal" data-v="map"><b>🗺️</b>Mapa${kbd('M')}</button>
      <button class="${u.resting ? 'on' : ''}" data-a="cmd" data-v="rest"><b>🏕️</b>${u.resting ? 'Levantar' : 'Descansar'}${kbd('R')}</button>
      <button class="big" data-a="cmd" data-v="explore"><b>🔍</b>Explorar${kbd('E')}</button>
      <button data-a="modal" data-v="craft"><b>⚒️</b>Forjar${kbd('F')}${nCraft ? `<i class="badge">${nCraft}</i>` : ''}</button>
      <button data-a="modal" data-v="inv"><b>🎒</b>Mochila${kbd('I')}<i class="badge dimb">${u.inv.length}/${INV_CAP}</i></button>`;
  }
  const quickHtml = (hot) => consumables().map((x, k) =>
    `<button data-a="use" data-v="${x.i}" title="${itemInfo(ITEMS[x.id])}">${ITEMS[x.id].i}<small>${quickLabel(ITEMS[x.id])}</small>${hot && k < 5 ? kbd(k + 5) : ''}</button>`).join('');

  /* ---------- Painéis ---------- */
  function invModal() {
    const u = V().you;
    const eq = SLOTS.map((s) => `<li><span class="muted">${SLOT_NAMES[s]}</span>
      ${u.equip[s] ? `${itemName(u.equip[s])}<small>${itemInfo(ITEMS[u.equip[s]])}</small>` : '<span class="muted">—</span>'}</li>`).join('');
    const inv = u.inv.length ? u.inv.map((id, i) => {
      const it = ITEMS[id];
      const act = it.t === 'consumivel' ? `<button data-a="use" data-v="${i}">Usar</button>`
        : it.t === 'armadilha' ? `<button data-a="use" data-v="${i}">Armar</button>`
        : it.t === 'arma' || it.t === 'armadura' ? `<button data-a="equip" data-v="${i}">Equipar</button>` : '';
      return `<li>${itemName(id)}<small>${itemInfo(it)}</small>
        <span class="btns">${act}<button class="ghost" data-a="drop" data-v="${i}" aria-label="Descartar ${it.n}">✕</button></span></li>`;
    }).join('') : '<li class="muted">A mochila está vazia.</li>';
    return `<h2>🎒 Mochila <span class="muted">${u.inv.length}/${INV_CAP}</span></h2>
      <h3>Itens</h3><ul class="list">${inv}</ul>
      <h3>Equipado</h3>
      <p class="small muted">🛡️ Proteção das peças: +${u.st.armor} de defesa · ${u.st.pieces}/5 partes cobertas ·
        ${u.st.full ? '<b class="want">armadura completa: −10% de dano recebido</b>' : 'cubra as cinco para receber −10% de dano'}</p>
      ${u.st.w ? `<p class="small muted">${ITEMS[u.st.w].i} ${WTYPES[ITEMS[u.st.w].wt]} — ${WTRAITS[ITEMS[u.st.w].wt].d}</p>` : ''}
      <ul class="list eq">${eq}</ul>`;
  }

  function craftModal() {
    const u = V().you, own = Sim.owned(u);
    const rows = RECIPES.map((r, i) => ({ r, i, ok: Sim.canCraft(u, i), part: r.ins.some((id) => own[id]) }))
      .filter((x) => craftAll || x.ok || x.part)
      .filter((x) => { const t = ITEMS[x.r.out].t; return craftTab === 'all' || t === craftTab || (craftTab === 'util' && t !== 'arma' && t !== 'armadura'); })
      .sort((a, b) => b.ok - a.ok || a.i - b.i);
    const tab = (k, label) => `<button class="${craftTab === k ? 'on' : ''}" data-a="craftTab" data-v="${k}">${label}</button>`;
    return `<h2>⚒️ Forjar</h2>
      <div class="tabs">${tab('all', 'Tudo')}${tab('arma', '⚔️ Armas')}${tab('armadura', '🛡️ Proteções')}${tab('util', '🎒 Utilidades')}</div>
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
        <li><b>Objetivo:</b> ser o último dos dez amaldiçoados de pé. A Última Chama concede um desejo ao vencedor — o dele só é revelado na vitória. Tudo acontece em tempo real.</li>
        <li><b>Explorar</b> rende materiais, armas e comida, mas pode atrair criaturas ou outros campeões.</li>
        <li><b>Forjar</b> combina itens em equipamento melhor. A linha 🎯 mostra o que falta para a próxima arma, e ⭐ marca onde encontrar.</li>
        <li><b>Proteções:</b> cabeça, corpo, mãos, pés e amuleto têm, cada um, um caminho pesado (mais defesa e vida) e um ágil (crítico, velocidade, ataque rápido). Algumas devolvem dano, regeneram ou resistem à névoa. Com as cinco partes cobertas você recebe 10% menos dano. A linha 🛡️ mostra a próxima peça ao alcance.</li>
        <li><b>Armas:</b> cada tipo luta de um jeito — punhais são rápidos, maças furam defesa, bestas abrem o combate com um tiro forte, cetros fortalecem a habilidade, lanças atrasam o inimigo. Veja o traço na ficha do amaldiçoado e na mochila.</li>
        <li><b>Relíquias e espólios:</b> a cada toque do sino surge uma relíquia ✨ numa região anunciada a todos; quem explorar lá primeiro fica com ela. Quem cai sem ser pelas suas mãos deixa espólios ⚰️ onde tombou.</li>
        <li><b>Armadilhas e arremessos:</b> armadilhas 🪤 ficam na região e ferem o próximo que passar (e avisam você); arremessos 💥 só valem em combate e ignoram a defesa.</li>
        <li><b>Combate:</b> ataque assim que a recarga terminar, use a habilidade do campeão e toque em <b>Defender</b> pouco antes do golpe inimigo (a barra sob o inimigo mostra quando ele vem) para aparar a maior parte do dano.</li>
        <li><b>Vigor</b> ⚡ é gasto ao explorar e viajar. Descansar recupera vida e vigor aos poucos, mas deixa você exposto.</li>
        <li><b>Névoa Cinzenta:</b> a cada ${Sim.T.mist} segundos o sino condena regiões 🔔; no toque seguinte a névoa as engole 🌫️ e ficar nelas causa dano constante. No fim resta um único refúgio.</li>
        <li><b>Salas:</b> um jogador cria a sala e passa o código; a partida roda no aparelho dele, então ele precisa manter o jogo aberto.</li>
      </ul>
      <h3 class="keys">Atalhos de teclado</h3>
      <p class="small keys">${kbd('E')} explorar · ${kbd('R')} descansar · ${kbd('F')} forjar · ${kbd('I')} mochila · ${kbd('M')} mapa ·
        setas ou ${kbd('WASD')} viajar · ${kbd('Esc')} fechar<br>
        Em combate: ${kbd('1')} ou ${kbd('Espaço')} atacar · ${kbd('2')} habilidade · ${kbd('3')} defender · ${kbd('4')} fugir · ${kbd('5')}–${kbd('9')} itens</p>`;
  }

  function combatShell() {
    const h = HEROES[V().you.hero];
    const cd = (id) => `<i class="cd" id="${id}"></i>`;
    return `<div class="overlay"><div class="modal combat" id="combat">
      <div id="r-vs"></div>
      <div class="clog" id="r-clog" aria-live="polite"></div>
      <div class="quick" id="r-cq"></div>
      <div class="cbar">
        <button data-a="cmd" data-v="flee">${cd('cd-flee')}<b>🏃</b>Fugir${kbd('4')}</button>
        <button data-a="cmd" data-v="guard">${cd('cd-guard')}<b>🛡️</b>Defender${kbd('3')}</button>
        <button class="big" data-a="cmd" data-v="atk">${cd('cd-atk')}<b>⚔️</b>Atacar${kbd('1')}</button>
        <button class="skill" data-a="cmd" data-v="skill">${cd('cd-skill')}<b>✨</b>${h.skill.n}${kbd('2')}</button>
      </div>
    </div></div>`;
  }
  function vsHtml() {
    const v = V(), u = v.you, f = v.foe, h = HEROES[u.hero];
    return `<div class="versus">
      <div><b class="portrait sm">${h.i}</b><strong>${esc(u.name)}</strong>
        ${bar('hp', u.hp, u.st.maxHp, `${u.hp}/${u.st.maxHp}`)}
        <div class="wind"><i id="you-wind"></i></div><small class="state" id="you-state"></small></div>
      <span class="vs">VS</span>
      <div><b class="portrait sm">${f.icon}</b><strong>${esc(f.name)}</strong>
        ${bar('hp', f.hp, f.maxHp, `${f.hp}/${f.maxHp}`)}
        <div class="wind foe"><i id="foe-wind"></i></div><small class="state" id="foe-state"></small></div>
    </div>`;
  }

  function endHtml() {
    const v = V(), u = v.you, o = u.over;
    const roster = v.roster.slice().sort((a, b) => b.alive - a.alive || b.kills - a.kills);
    return `<div class="overlay"><div class="modal end ${o.win ? 'win' : 'lose'}"><div class="body">
      <div class="flame">${o.win ? '🔥' : '🕯️'}</div>
      <h1>${o.win ? 'A Última Chama é sua' : 'Sua chama se apagou'}</h1>
      <p>${esc(o.reason)}.</p>
      ${o.win ? `<div class="wish"><h3>O desejo ${HEROES[u.hero].de}</h3><p>${HEROES[u.hero].wish}</p></div>`
        : `<p class="small muted"><em>O desejo ${HEROES[u.hero].de} continua por realizar.</em></p>`}
      <p class="statline">${u.icon} ${esc(u.name)} · Nível ${u.level}<br>
        Colocação: ${o.rank}º de ${v.total} · Campeões derrotados: ${u.kills}</p>
      <ul class="list roster">${roster.map((p) =>
        `<li class="${p.alive ? '' : 'dim'}"><span>${p.icon} ${p.you ? '<b>' : ''}${esc(p.name)}${p.you ? '</b>' : ''}</span>
          <small>${p.alive ? (v.ended ? 'vencedor' : 'ainda na ilha') : 'eliminado'} · ☠️ ${p.kills}${p.human ? ' · jogador' : ''}</small></li>`).join('')}</ul>
      </div>
      <div class="foot">
        <button data-a="toTitle">Início</button>
        ${sess.mode === 'solo' ? '<button class="big" data-a="go">Jogar de novo</button>' : '<span></span>'}
      </div>
    </div></div>`;
  }

  /* ---------- Desenho: cada região só é refeita quando seu conteúdo muda,
     para que um botão nunca seja trocado enquanto está sendo tocado ---------- */
  let shell = null;
  const cache = {};
  function setShell(name, html) {
    if (shell === name) return;
    shell = name; app.innerHTML = html;
    for (const k of Object.keys(cache)) delete cache[k];
  }
  function patch(id, html, nested = []) {
    if (cache[id] === html) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    const body = el.querySelector('.body'), top = body ? body.scrollTop : 0;
    cache[id] = html; el.innerHTML = html;
    for (const k of nested) delete cache[k];
    const nb = el.querySelector('.body');
    if (nb) nb.scrollTop = top;
    return true;
  }
  const modalHtml = (body) => `<div class="overlay" data-a="closeModal"><div class="modal sheet-${modal}" data-a="noop">
      <div class="body">${body}</div><button class="close" data-a="closeModal">Fechar</button></div></div>`;

  function render() {
    if (screen !== 'game' || !V()) {
      setShell('menu', '<div id="r-screen"></div><div id="r-over"></div>');
      patch('r-screen', screen === 'title' ? title() : screen === 'select' ? select() : sess ? lobby() : title());
      patch('r-over', modal === 'help' ? modalHtml(helpModal()) : '');
      if (lastScreen !== screen && !calm) { const m = document.querySelector('#r-screen main'); if (m) kick(m, 'enter'); }
      lastScreen = screen;
      enter(modal ? `modal:${modal}` : '', '#r-over .modal');
      pending.length = 0;
      return;
    }
    setShell('game', GAME_SHELL);
    lastScreen = screen;
    const v = V(), u = v.you;
    patch('r-hud', hudHtml());
    patch('r-side', mapHtml() + areaInfo(mapSel ?? u.area));
    patch('r-area', areaHtml());
    if (patch('r-log', logHtml(40))) { const el = document.getElementById('r-log'); el.scrollTop = el.scrollHeight; }
    patch('r-quick', quickHtml(false));
    patch('r-acts', actsHtml());
    if (u.over) patch('r-over', endHtml(), ['r-vs', 'r-clog', 'r-cq']);
    else if (v.foe) {
      modal = null;
      patch('r-over', combatShell(), ['r-vs', 'r-clog', 'r-cq']);
      patch('r-vs', vsHtml());
      if (patch('r-clog', logHtml(12))) { const el = document.getElementById('r-clog'); el.scrollTop = el.scrollHeight; }
      patch('r-cq', quickHtml(true));
    } else if (modal) {
      const body = modal === 'inv' ? invModal() : modal === 'craft' ? craftModal() : modal === 'help' ? helpModal()
        : `<h2>🗺️ Mapa</h2>${mapHtml()}<p class="small muted legend">Toque numa região vizinha (borda clara) para viajar · ⭐ tem material que falta · ✨ relíquia · ⚰️ espólios · 🪤 sua armadilha · 🔔 condenada · 🌫️ névoa</p>${areaInfo(mapSel ?? u.area)}`;
      patch('r-over', modalHtml(body), ['r-vs', 'r-clog', 'r-cq']);
    } else patch('r-over', '', ['r-vs', 'r-clog', 'r-cq']);
    enter(u.over ? 'end' : v.foe ? 'combat' : modal ? `modal:${modal}` : '', '#r-over .modal');
    flushFx();
    live();
  }

  /* Relógios, recargas e barras de progresso: atualizados a cada quadro, sem refazer botões */
  const $ = (id) => document.getElementById(id);
  const ACT_LABEL = { explore: 'Explorando…', craft: 'Forjando…', flee: 'Tentando fugir…' };
  function setCd(id, at, dur, now) {
    const el = $(id);
    if (!el) return;
    const f = Math.max(0, Math.min(1, (at - now) / dur));
    el.style.transform = `scaleY(${f})`;
    el.parentElement.classList.toggle('cool', f > 0);
  }
  function live() {
    const v = V();
    if (screen !== 'game' || !v) return;
    const now = simNow(), u = v.you, T = Sim.T;
    const ck = $('clock'), ms = $('mist');
    if (ck) ck.textContent = clock(now);
    if (ms) { const left = v.mistIn - (now - v.now); ms.textContent = clock(left); ms.parentElement.classList.toggle('warn-t', left < 20); }
    const wrap = $('actwrap');
    if (wrap) {
      const act = u.alive && u.act;
      wrap.className = `actwrap ${act ? 'on' : u.resting && u.alive ? 'on rest' : ''}`;
      wrap.parentElement.dataset.act = act ? act.type : u.resting && u.alive ? 'rest' : '';
      if (act) {
        $('actbar').style.width = `${Math.min(100, ((now - act.start) / (act.end - act.start)) * 100)}%`;
        $('actlabel').textContent = act.type === 'move' ? `Viajando para ${AREAS[act.to].n}…` : ACT_LABEL[act.type];
      } else if (u.resting) { $('actbar').style.width = '100%'; $('actlabel').textContent = 'Descansando…'; }
    }
    const f = v.foe;
    if (!f || !$('combat')) return;
    setCd('cd-atk', u.atkAt, u.st.iv, now);
    setCd('cd-guard', u.guardAt, T.guardCd, now);
    setCd('cd-flee', u.act && u.act.type === 'flee' ? u.act.end : u.fleeAt, u.act ? T.flee : T.fleeCd, now);
    const sk = HEROES[u.hero].skill;
    setCd('cd-skill', u.skillAt, Math.max(1, (sk.cd - (HEROES[u.hero].passive === 'arcano' ? 1 : 0)) * T.skillTurn * (u.st.skillCd || 1)), now);
    const cq = $('r-cq');
    if (cq) cq.classList.toggle('cool', now < u.itemAt);
    const fw = $('foe-wind'), yw = $('you-wind');
    if (fw) fw.style.width = `${Math.max(0, Math.min(1, 1 - (f.atkAt - now) / f.iv)) * 100}%`;
    if (yw) yw.style.width = `${Math.max(0, Math.min(1, 1 - (u.atkAt - now) / u.st.iv)) * 100}%`;
    const state = (x) => [x.stunUntil > now ? '💫 atordoado' : '', x.bleedN > 0 ? '🩸 sangrando' : '',
      x.shieldUntil > now ? '🛡️ guarda erguida' : '', x.guardUntil > now ? '🛡️ defendendo' : ''].filter(Boolean).join(' · ');
    const fs = $('foe-state'), ys = $('you-state');
    if (fs) fs.textContent = state(f);
    if (ys) ys.textContent = state(u);
    $('combat').classList.toggle('stunned', u.stunUntil > now);
    $('combat').classList.toggle('guarding', u.guardUntil > now);
  }
  (function frame() { live(); requestAnimationFrame(frame); })();

  /* ---------- Ações ---------- */
  const acts = {
    mode: (v) => { mode = v; notice = ''; screen = 'select'; },
    toTitle: () => { leave(); screen = 'title'; notice = ''; },
    pickHero: (v) => { selHero = Number(v); },
    go: () => {
      notice = '';
      if (mode !== 'solo') { const r = record(); r.nick = nick; store.set(REC, JSON.stringify(r)); }
      if (mode === 'solo') startSolo();
      else if (mode === 'host') createRoom();
      else if (joinCode.trim().length < 5) notice = 'Digite o código de 5 letras da sala.';
      else joinRoom();
    },
    begin: () => {
      if (!sess || sess.mode !== 'host' || !sess.code || sess.started) return;
      beginMatch();
      sess.push();
    },
    modal: (v) => { modal = modal === v ? null : v; mapSel = null; },
    closeModal: () => { modal = null; mapSel = null; },
    noop: () => {},
    craftAll: () => { craftAll = !craftAll; },
    craftTab: (v) => { craftTab = v; },
    cmd: (v) => command(v),
    cell: (v) => {
      const i = Number(v), u = V().you;
      if (Sim.neighbors(u.area).includes(i) && !u.foe) { command('move', i); mapSel = null; if (modal === 'map') modal = null; }
      else mapSel = i;
    },
    craft: (v) => { command('craft', Number(v)); modal = null; },
    equip: (v) => command('equip', Number(v)),
    use: (v) => command('use', Number(v)),
    drop: (v) => command('drop', Number(v)),
  };
  function run(a, v) {
    if (!acts[a]) return;
    acts[a](v);
    render();
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]');
    if (!el || el.disabled) return;
    run(el.dataset.a, el.dataset.v);
  });
  document.addEventListener('input', (ev) => {
    const k = ev.target.dataset && ev.target.dataset.in;
    if (k === 'nick') nick = ev.target.value.slice(0, 16);
    if (k === 'code') joinCode = ev.target.value.toUpperCase().slice(0, 5);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.tagName === 'INPUT') return;
    const k = ev.key.toLowerCase();
    if (k === 'escape' && modal) return run('closeModal');
    const v = V();
    if (screen !== 'game' || !v || v.you.over) return;
    if (v.foe) {
      const map = { 1: 'atk', ' ': 'atk', 2: 'skill', 3: 'guard', 4: 'flee' };
      if (map[k]) { ev.preventDefault(); return run('cmd', map[k]); }
      if (k >= '5' && k <= '9') { const it = consumables()[Number(k) - 5]; if (it) run('use', it.i); }
      return;
    }
    const panels = { m: 'map', f: 'craft', i: 'inv', b: 'inv' };
    if (panels[k]) return run('modal', panels[k]);
    if (modal && modal !== 'map') return;
    if (k === 'e') return run('cmd', 'explore');
    if (k === 'r') return run('cmd', 'rest');
    const dir = { arrowup: -4, w: -4, arrowdown: 4, s: 4, arrowleft: -1, a: -1, arrowright: 1, d: 1 }[k];
    if (dir) {
      const to = v.you.area + dir;
      if (Sim.neighbors(v.you.area).includes(to)) { ev.preventDefault(); run('cell', to); }
    }
  });
  window.addEventListener('pagehide', () => { if (sess && sess.mode !== 'solo') Net.close(); });

  render();
  return { render };
})();
