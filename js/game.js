/* Última Chama — regras e simulação */

const Game = (() => {
  let S = null;
  const GRID = 4;
  const NPC_TIER_ATK = [8, 16, 28, 44, 64];
  const MIST_DMG = 20;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const wpick = (pairs) => {
    let t = 0;
    for (const p of pairs) t += p[1];
    let r = Math.random() * t;
    for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; }
    return pairs[0][0];
  };
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  function neighbors(i) {
    const r = Math.floor(i / GRID), c = i % GRID, o = [];
    if (r > 0) o.push(i - GRID);
    if (r < GRID - 1) o.push(i + GRID);
    if (c > 0) o.push(i - 1);
    if (c < GRID - 1) o.push(i + 1);
    return o;
  }

  /* Primeiro passo do caminho mais curto até uma região que satisfaça `ok` */
  function stepToward(from, ok) {
    const prev = { [from]: -1 }, q = [from];
    while (q.length) {
      const cur = q.shift();
      if (cur !== from && ok(cur)) {
        let s = cur;
        while (prev[s] !== from) s = prev[s];
        return s;
      }
      for (const nb of neighbors(cur)) if (!(nb in prev)) { prev[nb] = cur; q.push(nb); }
    }
    return null;
  }

  function log(msg, cls = '') {
    S.log.push({ t: S.time, msg, cls });
    if (S.log.length > 150) S.log.shift();
  }
  function clog(msg) {
    if (S.combat) S.combat.lines.push(msg);
    log(msg, 'cb');
  }

  const hero = () => HEROES[S.p.hero];
  const passive = (k) => hero().passive === k;
  const aliveNpcs = () => S.npcs.filter((n) => n.alive);
  const npcsAt = (a) => S.npcs.filter((n) => n.alive && n.area === a);

  function fmtTime(t) {
    const d = Math.floor(t / 1440) + 1, h = Math.floor((t % 1440) / 60), m = t % 60;
    return `Dia ${d}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const isNight = () => { const h = Math.floor((S.time % 1440) / 60); return h >= 20 || h < 6; };
  const nextMist = () => 180 - (S.time % 180);

  /* ---------- Nova partida ---------- */
  function newGame(heroId) {
    const h = HEROES[heroId];
    const starts = shuffle(AREAS.map((_, i) => i));
    S = {
      time: 360, areas: AREAS.map(() => 'livre'), mistOrder: shuffle(AREAS.map((_, i) => i)), mistIdx: 0,
      log: [], combat: null, over: null, kills: 0,
      p: {
        hero: heroId, hp: h.hp, vigor: 100, level: 1, xp: 0, mastery: {}, mxp: {},
        inv: ['pao', 'pao', 'cantil'], area: starts[0], cd: 0,
        equip: { arma: h.start, cabeca: null, corpo: null, maos: null, pes: null, amuleto: null },
      },
      npcs: HEROES.map((nh, i) => i).filter((i) => i !== heroId).map((i, k) => ({
        hero: i, hp: HEROES[i].hp, level: 1, wtier: 0, armor: 0, prog: 0, ups: 0,
        area: starts[1 + k], alive: true, kills: 0,
      })),
    };
    log(`A Névoa Cinzenta se fecha sobre a Ilha de Vharun. Dez campeões, uma única chama.`, 'sys');
    log(`Você desperta em ${AREAS[S.p.area].n}.`);
    return S;
  }

  /* ---------- Atributos ---------- */
  function stats() {
    const p = S.p, h = hero();
    const w = p.equip.arma ? ITEMS[p.equip.arma] : null;
    let armor = 0, hpB = 0, spd = h.spd;
    for (const s of SLOTS) {
      if (s === 'arma' || !p.equip[s]) continue;
      const it = ITEMS[p.equip[s]];
      armor += it.def || 0; hpB += it.hp || 0; spd += it.spd || 0;
    }
    if (passive('ferreiro')) armor = Math.round(armor * 1.25);
    const ml = w ? (p.mastery[w.wt] || 0) : 0;
    const maxHp = h.hp + (p.level - 1) * 12 + hpB;
    let atk = h.atk + p.level * 2 + (w ? Math.round(w.atk * (1 + ml * 0.05)) : 0);
    if (passive('furia') && p.hp < maxHp / 2) atk = Math.round(atk * 1.25);
    return { atk, def: h.def + p.level + armor, spd, maxHp, crit: 0.1 + (passive('precisao') ? 0.15 : 0), ml, w };
  }
  function nstats(n) {
    const h = HEROES[n.hero];
    return {
      atk: h.atk + n.level * 2 + NPC_TIER_ATK[n.wtier],
      def: h.def + n.level + n.armor,
      maxHp: h.hp + (n.level - 1) * 12, spd: h.spd,
    };
  }
  const xpNeed = (lv) => 50 + lv * 30;
  const mxpNeed = (lv) => 5 * (lv + 1);

  function dmg(atk, def, mult, crit) {
    let d = atk * mult * rnd(0.85, 1.15) - def * 0.6;
    const cr = Math.random() < crit;
    if (cr) d *= 1.5;
    return { d: Math.max(1, Math.round(d)), cr };
  }

  function heal(v) {
    const p = S.p, mx = stats().maxHp;
    const before = p.hp;
    p.hp = Math.min(mx, p.hp + Math.round(v));
    return p.hp - before;
  }
  function clampHp() { S.p.hp = Math.min(S.p.hp, stats().maxHp); }

  function gainXp(x) {
    const p = S.p;
    p.xp += Math.round(x);
    while (p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level);
      p.level++;
      p.hp += 12;
      heal(stats().maxHp * 0.2);
      log(`✨ Você alcançou o nível ${p.level}!`, 'good');
    }
  }

  /* ---------- Tempo, névoa e adversários ---------- */
  function advance(min) {
    if (S.over) return;
    const end = S.time + min;
    while (Math.floor(S.time / 30) < Math.floor(end / 30)) {
      S.time = (Math.floor(S.time / 30) + 1) * 30;
      halfHour();
      if (S.over) return;
    }
    S.time = end;
  }

  function halfHour() {
    if (S.time % 180 === 0) mistAdvance();
    for (const n of S.npcs) { npcTick(n); if (S.over) return; }
    const p = S.p;
    if (S.areas[p.area] === 'selada') {
      p.hp -= MIST_DMG;
      log(`🌫️ A Névoa Cinzenta corrói sua carne (−${MIST_DMG} de vida). Saia daqui!`, 'bad');
      if (p.hp <= 0) return die('Consumido pela Névoa Cinzenta');
    }
    if (passive('regen')) heal(4);
  }

  function mistAdvance() {
    const sealed = [];
    S.areas.forEach((st, i) => { if (st === 'condenada') { S.areas[i] = 'selada'; sealed.push(AREAS[i].n); } });
    if (sealed.length) log(`🌫️ A névoa engoliu: ${sealed.join(' e ')}.`, 'bad');
    const left = S.mistOrder.length - S.mistIdx;
    const k = left > 2 ? 2 : left === 2 ? 1 : 0; // a última região nunca é tomada: é a arena final
    const doomed = [];
    for (let j = 0; j < k; j++) {
      const a = S.mistOrder[S.mistIdx++];
      S.areas[a] = 'condenada';
      doomed.push(AREAS[a].n);
    }
    if (doomed.length) log(`🔔 O sino toca. Em 3 horas a névoa tomará: ${doomed.join(' e ')}.`, 'warn');
    else if (sealed.length) log(`🔥 Resta um único refúgio: ${AREAS[S.mistOrder[S.mistOrder.length - 1]].n}. É lá que tudo termina.`, 'warn');
  }

  function killNpc(n, by) {
    n.alive = false; n.hp = 0;
    const left = aliveNpcs().length + 1;
    const who = by === 'player' ? 'você' : by === 'mist' ? 'pela Névoa Cinzenta' : by ? HEROES[by.hero].n : 'uma criatura';
    const how = by === 'mist' ? 'foi consumido' : 'foi eliminado por';
    log(`☠️ ${HEROES[n.hero].n} ${how} ${who} em ${AREAS[n.area].n}. Restam ${left}.`, 'kill');
    if (left === 1 && !S.over) S.over = { win: true, reason: 'Você é o último campeão de pé', rank: 1 };
  }

  function npcTick(n) {
    if (!n.alive || (S.combat && !S.combat.done && S.combat.e.ref === n)) return;
    const st = S.areas[n.area];
    if (st === 'selada') {
      n.hp -= MIST_DMG;
      if (n.hp <= 0) return killNpc(n, 'mist');
    }
    if (st !== 'livre') {
      const step = stepToward(n.area, (a) => S.areas[a] === 'livre') ?? stepToward(n.area, (a) => S.areas[a] === 'condenada');
      if (step != null) n.area = step;
      return;
    }
    const mx = nstats(n).maxHp;
    const others = npcsAt(n.area).filter((o) => o !== n && !(S.combat && !S.combat.done && S.combat.e.ref === o));
    if (others.length && Math.random() < 0.3) return npcDuel(n, pick(others));
    const r = Math.random();
    if (n.hp < mx * 0.5 && r < 0.5) { n.hp = Math.min(mx, n.hp + mx * 0.25); return; }
    if (r < 0.6) {
      n.prog += rnd(0.6, 1.4);
      if (n.prog >= 5 + 3 * n.ups) {
        n.prog = 0; n.ups++; n.level++;
        n.wtier = Math.min(4, n.wtier + 1); n.armor += 3;
        n.hp = Math.min(nstats(n).maxHp, n.hp + 12);
      }
    } else if (r < 0.8) {
      const nb = neighbors(n.area).filter((a) => S.areas[a] === 'livre');
      if (nb.length) n.area = pick(nb);
    } else {
      n.hp = Math.min(mx, n.hp + mx * 0.1);
    }
  }

  function npcDuel(a, b) {
    let x = a, y = b;
    if (HEROES[b.hero].spd > HEROES[a.hero].spd) [x, y] = [y, x];
    for (let r = 0; r < 16; r++) {
      const sx = nstats(x), sy = nstats(y);
      y.hp -= dmg(sx.atk, sy.def, Math.random() < 0.2 ? 1.6 : 1, 0.1).d;
      if (y.hp <= 0) {
        x.level++; x.kills++;
        if (y.wtier > x.wtier) x.wtier = y.wtier;
        x.hp = Math.min(nstats(x).maxHp, x.hp + 30);
        return killNpc(y, x);
      }
      if (y.hp < sy.maxHp * 0.25 && Math.random() < 0.5) {
        const nb = neighbors(y.area).filter((i) => S.areas[i] !== 'selada');
        if (nb.length) y.area = pick(nb);
        return;
      }
      [x, y] = [y, x];
    }
  }

  function die(reason) {
    S.p.hp = 0;
    S.over = { win: false, reason, rank: aliveNpcs().length + 1 };
    if (S.combat) S.combat.done = true;
  }

  /* ---------- Mochila ---------- */
  function give(id, verb = 'Encontrou') {
    const it = ITEMS[id];
    if (S.p.inv.length >= INV_CAP) { log(`Mochila cheia: ${it.i} ${it.n} ficou para trás.`, 'warn'); return false; }
    S.p.inv.push(id);
    log(`${verb} ${it.i} ${it.n}.`, it.r >= 2 ? 'good' : '');
    return true;
  }
  const slotOf = (it) => (it.t === 'arma' ? 'arma' : it.t === 'armadura' ? it.slot : null);

  function equip(idx) {
    const p = S.p, it = ITEMS[p.inv[idx]];
    const slot = it && slotOf(it);
    if (!slot || busy()) return;
    const old = p.equip[slot];
    p.equip[slot] = it.id;
    p.inv.splice(idx, 1);
    if (old) p.inv.push(old);
    clampHp();
    log(`Equipou ${it.i} ${it.n}.`);
  }
  function consume(idx) {
    const p = S.p, it = ITEMS[p.inv[idx]];
    if (!it || it.t !== 'consumivel') return false;
    const k = passive('herbalista') ? 1.4 : 1;
    p.inv.splice(idx, 1);
    const h = it.hp ? heal(it.hp * k) : 0;
    const before = p.vigor;
    p.vigor = Math.min(100, p.vigor + Math.round(it.vigor * k));
    const parts = [];
    if (it.hp) parts.push(`+${h} de vida`);
    if (it.vigor) parts.push(`+${p.vigor - before} de vigor`);
    (S.combat ? clog : log)(`Você usa ${it.i} ${it.n} (${parts.join(', ')}).`);
    return true;
  }
  function useItem(idx) { if (!busy()) consume(idx); }
  function drop(idx) {
    if (busy()) return;
    const [id] = S.p.inv.splice(idx, 1);
    if (id) log(`Descartou ${ITEMS[id].i} ${ITEMS[id].n}.`);
  }

  /* ---------- Forja ---------- */
  function owned() {
    const p = S.p, c = {};
    for (const id of p.inv) c[id] = (c[id] || 0) + 1;
    for (const s of SLOTS) if (p.equip[s]) c[p.equip[s]] = (c[p.equip[s]] || 0) + 1;
    return c;
  }
  function canCraft(ri) {
    const c = owned();
    return RECIPES[ri].ins.every((id) => c[id] > 0);
  }
  function craft(ri) {
    if (busy() || !canCraft(ri)) return;
    const p = S.p, rec = RECIPES[ri], out = ITEMS[rec.out];
    const freed = new Set();
    for (const id of rec.ins) {
      const k = p.inv.indexOf(id);
      if (k >= 0) p.inv.splice(k, 1);
      else for (const s of SLOTS) if (p.equip[s] === id) { p.equip[s] = null; freed.add(s); break; }
    }
    const slot = slotOf(out);
    if (slot && !p.equip[slot]) p.equip[slot] = out.id;
    else p.inv.push(out.id);
    clampHp();
    log(`⚒️ Você forjou ${out.i} ${out.n}${out.r >= 3 ? ` — ${RARITY[out.r]}!` : '.'}`, out.r >= 2 ? 'good' : '');
    gainXp(8 + out.r * 10);
    let t = 20;
    if (passive('ferreiro')) t /= 2;
    if (AREAS[p.area].forge) t /= 2;
    advance(t);
  }

  /* ---------- Ações de exploração ---------- */
  const busy = () => !!(S.over || S.combat);

  function explore() {
    if (busy()) return;
    const p = S.p;
    if (p.vigor < 12) { log('Você está exausto demais para explorar. Descanse ou beba algo.', 'warn'); return; }
    p.vigor -= 12;
    advance(20);
    if (busy()) return;
    const a = AREAS[p.area], here = npcsAt(p.area);
    if (here.length && Math.random() < 0.2) return startCombat(npcEnemy(pick(here)), false);
    if (Math.random() < a.danger * (isNight() ? 1.3 : 1)) return startCombat(monEnemy(pickMon(a)), false);
    if (Math.random() < 0.06) { log('Você vasculha a região, mas não encontra nada útil.'); return; }
    let n = 1 + (Math.random() < 0.3 ? 1 : 0) + (passive('saqueador') && Math.random() < 0.4 ? 1 : 0);
    while (n--) give(wpick(a.loot));
  }

  /* Criaturas mais fortes só aparecem quando o campeão já tem alguma experiência */
  function pickMon(a) {
    const lv = S.p.level;
    const ok = a.mons.filter((id) => MONS[id].xp < 60 || (MONS[id].xp < 100 ? lv >= 2 : lv >= 4));
    return ok.length ? pick(ok) : 'aranha';
  }

  function move(to) {
    if (busy()) return;
    const p = S.p;
    if (!neighbors(p.area).includes(to)) return;
    if (p.vigor >= 10) p.vigor -= 10;
    else {
      p.hp -= 8;
      log('Sem vigor, você se arrasta pelo caminho (−8 de vida).', 'warn');
      if (p.hp <= 0) return die('Tombou de exaustão no caminho');
    }
    p.area = to;
    advance(30);
    if (busy()) return;
    const st = S.areas[to];
    log(`Você chega a ${AREAS[to].i} ${AREAS[to].n}.` +
      (st === 'selada' ? ' A névoa aqui é sufocante!' : st === 'condenada' ? ' O sino já tocou por este lugar.' : ''),
      st === 'livre' ? '' : 'warn');
    const here = npcsAt(to);
    if (here.length && Math.random() < 0.12) startCombat(npcEnemy(pick(here)), true);
  }

  function rest() {
    if (busy()) return;
    const p = S.p, here = npcsAt(p.area);
    advance(30);
    if (busy()) return;
    if (here.length && Math.random() < 0.12) {
      log('Seu descanso é interrompido!', 'warn');
      return startCombat(npcEnemy(pick(npcsAt(p.area).length ? npcsAt(p.area) : here)), true);
    }
    advance(30);
    if (busy()) return;
    const k = AREAS[p.area].sanctuary ? 1.6 : 1;
    const h = heal(stats().maxHp * 0.25 * k);
    const before = p.vigor;
    p.vigor = Math.min(100, p.vigor + Math.round(45 * k));
    log(`Você descansa por uma hora (+${h} de vida, +${p.vigor - before} de vigor).`);
  }

  /* ---------- Combate ---------- */
  function monEnemy(id) {
    const m = MONS[id];
    return { ...m, maxHp: m.hp, ref: null, stun: 0, bleed: 0, bleedD: 0 };
  }
  function npcEnemy(n) {
    const s = nstats(n), h = HEROES[n.hero];
    return {
      n: h.n, i: h.i, hp: n.hp, maxHp: s.maxHp, atk: s.atk, def: s.def, spd: s.spd,
      ref: n, stun: 0, bleed: 0, bleedD: 0, skill: h.skill.n,
    };
  }

  function startCombat(e, ambush) {
    S.combat = { e, lines: [], shield: 0, shieldV: 0, done: false, win: false, fled: false };
    S.p.cd = 0;
    clog(ambush ? `⚠️ ${e.i} ${e.n} embosca você!` : e.ref ? `⚔️ Você cruza com ${e.i} ${e.n}!` : `⚔️ ${e.i} ${e.n} surge diante de você!`);
    if (ambush || (!passive('precisao') && e.spd > stats().spd)) enemyTurn();
  }

  function playerHit(mult) {
    const p = S.p, st = stats(), e = S.combat.e;
    const r = dmg(st.atk, e.def, mult, st.crit);
    e.hp -= r.d;
    if (st.w) {
      const wt = st.w.wt, lv = p.mastery[wt] || 0;
      if (lv < 10) {
        p.mxp[wt] = (p.mxp[wt] || 0) + 1;
        if (p.mxp[wt] >= mxpNeed(lv)) {
          p.mxp[wt] = 0; p.mastery[wt] = lv + 1;
          clog(`📈 Maestria com ${WTYPES[wt]} subiu para ${lv + 1}.`);
        }
      }
    }
    if (passive('vampirismo')) heal(r.d * 0.15);
    return r;
  }
  const crit = (r) => (r.cr ? ' (CRÍTICO!)' : '');

  function enemyTurn() {
    const c = S.combat, e = c.e, p = S.p;
    if (e.stun > 0) { e.stun--; clog(`${e.n} está atordoado e perde a vez.`); return; }
    if (e.ref && e.hp < e.maxHp * 0.25 && Math.random() < 0.3) {
      const nb = neighbors(e.ref.area).filter((i) => S.areas[i] !== 'selada');
      if (nb.length) e.ref.area = pick(nb);
      e.ref.hp = e.hp;
      clog(`${e.n} recua ferido e desaparece entre as sombras.`);
      c.done = true; c.fled = true;
      return;
    }
    let mult = 1, verb = 'ataca';
    if (e.ref && Math.random() < 0.22) { mult = 1.6; verb = `usa ${e.skill} e atinge`; }
    const r = dmg(e.atk, stats().def, mult, 0.08);
    let d = r.d;
    if (e.ref) d *= 0.85;
    if (c.shield > 0) d *= 1 - c.shieldV;
    if (passive('baluarte')) d *= 0.88;
    d = Math.max(1, Math.round(d));
    p.hp -= d;
    clog(`${e.n} ${verb} você: ${d} de dano${crit(r)}.`);
    if (p.hp <= 0) {
      if (e.ref) { e.ref.hp = e.hp; e.ref.kills++; }
      clog('Você tomba. A chama não será sua.');
      die(`Derrotado por ${e.n}`);
    }
  }

  function combatAct(kind, arg) {
    const c = S.combat;
    if (!c || c.done) return;
    const p = S.p, e = c.e, h = hero();
    if (kind === 'atk') {
      const r = playerHit(1);
      clog(`Você ataca ${e.n}: ${r.d} de dano${crit(r)}.`);
    } else if (kind === 'skill') {
      if (p.cd > 0) return;
      const sk = h.skill;
      p.cd = sk.cd + 1 - (passive('arcano') ? 1 : 0);
      if (sk.type === 'cura') {
        clog(`✨ ${sk.n}: você recupera ${heal(stats().maxHp * sk.v)} de vida.`);
      } else if (sk.type === 'duplo') {
        const a = playerHit(sk.v), b = playerHit(sk.v);
        clog(`✨ ${sk.n}: ${a.d}${crit(a)} + ${b.d}${crit(b)} de dano.`);
      } else {
        const r = playerHit(sk.type === 'escudo' ? 0.7 : sk.v);
        let extra = '';
        if (sk.type === 'atordoar') { e.stun = 1; extra = ' O inimigo fica atordoado!'; }
        if (sk.type === 'sangrar') { e.bleed = 3; e.bleedD = Math.max(2, Math.round(stats().atk * 0.35)); extra = ' O inimigo começa a sangrar!'; }
        if (sk.type === 'escudo') { c.shield = 3; c.shieldV = sk.v; extra = ' Você ergue a guarda.'; }
        if (sk.type === 'drenar') extra = ` Você absorve ${heal(r.d * 0.5)} de vida.`;
        clog(`✨ ${sk.n}: ${r.d} de dano${crit(r)}.${extra}`);
      }
    } else if (kind === 'item') {
      if (!consume(Number(arg))) return;
    } else if (kind === 'flee') {
      let ch = 0.55 + (stats().spd - e.spd) * 0.04 + (passive('saqueador') ? 0.3 : 0);
      ch = Math.max(0.15, Math.min(0.95, ch));
      if (Math.random() < ch) {
        if (e.ref) e.ref.hp = e.hp;
        clog('Você escapa do combate!');
        c.done = true; c.fled = true;
        advance(5);
        return;
      }
      clog('Você tenta fugir, mas o inimigo bloqueia o caminho!');
    } else return;

    if (e.hp > 0 && e.bleed > 0) {
      e.bleed--; e.hp -= e.bleedD;
      clog(`🩸 ${e.n} sangra: ${e.bleedD} de dano.`);
    }
    if (e.hp <= 0) return victory();
    enemyTurn();
    if (c.done) return;
    if (c.shield > 0) c.shield--;
    if (p.cd > 0) p.cd--;
  }

  function victory() {
    const c = S.combat, e = c.e;
    c.done = true; c.win = true;
    clog(`🏆 ${e.n} foi derrotado!`);
    if (e.ref) {
      const n = e.ref;
      S.kills++;
      killNpc(n, 'player');
      gainXp(60 + n.level * 20);
      const loot = [pick(['pao', 'carne_assada', 'cha_lunar', 'cantil']), pick(['ferro', 'couro', 'prata', 'cristal', 'osso'])];
      if (n.wtier >= 2) loot.push(pick(['runa', 'essencia', 'pocao_cura']));
      if (n.wtier >= 3) loot.push(pick(['escama', 'estelar']));
      loot.forEach((id) => give(id, 'Saqueou'));
    } else {
      gainXp(e.xp * (passive('rastreador') ? 1.5 : 1));
      let k = 1 + (Math.random() < 0.4 ? 1 : 0);
      while (k--) give(wpick(e.drops), 'Obteve');
    }
    advance(5);
  }

  function closeCombat() { if (S.combat && S.combat.done) S.combat = null; }

  /* Partida salva: só fora de combate, quando o estado não guarda referências */
  function serialize() { return S && !S.combat && !S.over ? JSON.stringify(S) : null; }
  function restore(json) {
    try {
      const d = JSON.parse(json);
      if (!d || !d.p || !Array.isArray(d.npcs) || d.areas.length !== AREAS.length) return false;
      S = d; S.combat = null;
      return true;
    } catch { return false; }
  }

  return {
    get S() { return S; },
    serialize, restore,
    newGame, stats, neighbors, fmtTime, nextMist, isNight, npcsAt, aliveNpcs, xpNeed, mxpNeed,
    explore, move, rest, craft, canCraft, owned, equip, useItem, drop, combatAct, closeCombat,
  };
})();
