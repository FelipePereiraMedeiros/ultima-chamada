/* Última Chama — simulação em tempo real.
   Roda no navegador do anfitrião (ou sozinha, no modo solo). Não toca na página:
   recebe comandos dos jogadores, avança com step(dt) e devolve a visão de cada um. */

const Sim = (() => {
  /* Durações em segundos */
  const T = {
    explore: 3, move: 4, craft: 2, rest: 1, mist: 90, tick: 3, mistDmg: 5, think: 15,
    guard: 0.9, guardCd: 3.5, stun: 2.5, shield: 6, item: 1.5, flee: 1.8, fleeCd: 3, immune: 6, skillTurn: 4,
  };
  const GRID = 4;
  const BOT_TIER_ATK = [8, 16, 28, 44, 64];
  const MAX_CHAMPS = 10;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  const xpNeed = (lv) => 50 + lv * 30;
  const mxpNeed = (lv) => 5 * (lv + 1);
  const slotOf = (it) => (it.t === 'arma' ? 'arma' : it.t === 'armadura' ? it.slot : null);

  /* Contagem de itens (mochila + equipados) e receitas possíveis — usado também pela interface */
  function owned(u) {
    const c = {};
    for (const id of u.inv) c[id] = (c[id] || 0) + 1;
    for (const s of SLOTS) if (u.equip[s]) c[u.equip[s]] = (c[u.equip[s]] || 0) + 1;
    return c;
  }
  const canCraft = (u, ri) => { const c = owned(u); return !!RECIPES[ri] && RECIPES[ri].ins.every((id) => c[id] > 0); };

  /* players: [{ pid, name, hero }] — os demais campeões, até dez, são controlados pelo jogo */
  function create(players) {
    const S = {
      now: 0, units: {}, nextId: 1, areas: AREAS.map(() => 'livre'),
      mistOrder: shuffle(AREAS.map((_, i) => i)), mistIdx: 0, mistAt: T.mist, tickAt: T.tick,
      over: false, lastStand: false, total: 0,
    };
    const base = () => ({
      foe: null, alive: true, kills: 0, atkAt: 0, skillAt: 0, guardAt: 0, guardUntil: 0, itemAt: 0, fleeAt: 0,
      shieldUntil: 0, shieldV: 0, stunUntil: 0, bleedN: 0, bleedD: 0, bleedAt: 0, bleedBy: 0, immuneUntil: 0,
    });
    const add = (u) => { u.id = S.nextId++; S.units[u.id] = u; return u; };
    const starts = shuffle(AREAS.map((_, i) => i));
    const ids = {};
    players.forEach((p, k) => {
      const h = HEROES[p.hero];
      ids[p.pid] = add({
        ...base(), kind: 'h', pid: p.pid, hero: p.hero, name: p.name || h.n, icon: h.i,
        hp: h.hp, vigor: 100, level: 1, xp: 0, mastery: {}, mxp: {}, inv: ['pao', 'pao', 'cantil'],
        equip: { arma: h.start, cabeca: null, corpo: null, maos: null, pes: null, amuleto: null },
        area: starts[k % starts.length], act: null, resting: false, restAt: 0, log: [], over: null,
      }).id;
    });
    const taken = new Set(players.map((p) => p.hero));
    shuffle(HEROES.map((_, i) => i).filter((i) => !taken.has(i)))
      .slice(0, Math.max(0, MAX_CHAMPS - players.length))
      .forEach((i, k) => add({
        ...base(), kind: 'b', hero: i, name: HEROES[i].n, icon: HEROES[i].i, hp: HEROES[i].hp,
        level: 1, wtier: 0, armor: 0, prog: 0, ups: 0, area: starts[(players.length + k) % starts.length],
        thinkAt: rnd(4, T.think),
      }));

    const all = () => Object.values(S.units);
    const champs = () => all().filter((u) => u.kind !== 'm' && u.alive);
    const humans = () => all().filter((u) => u.kind === 'h');
    const passive = (u, k) => u.kind === 'h' && HEROES[u.hero].passive === k;
    S.total = champs().length;
    const intro = () => humans().forEach((u) => {
      plog(u, 'A Névoa Cinzenta se fecha sobre a Ilha de Vharun. A Última Chama concederá um único desejo — ao último que restar de pé.', 'sys');
      plog(u, `Você desperta em ${AREAS[u.area].i} ${AREAS[u.area].n}.`);
    });

    function plog(u, m, c = '') {
      if (!u || u.kind !== 'h') return;
      u.log.push({ t: S.now, m, c });
      if (u.log.length > 60) u.log.shift();
    }
    const glog = (m, c) => humans().forEach((u) => plog(u, m, c));

    /* ---------- Atributos ---------- */
    function stats(u) {
      if (u.kind === 'm') return { atk: u.atk, def: u.def, spd: u.spd, maxHp: u.maxHp, crit: 0.08, iv: clamp(2.8 - u.spd * 0.15, 1.4, 2.6) };
      const h = HEROES[u.hero];
      if (u.kind === 'b') {
        return {
          atk: h.atk + u.level * 2 + BOT_TIER_ATK[u.wtier], def: h.def + u.level + u.armor,
          maxHp: h.hp + (u.level - 1) * 12, spd: h.spd, crit: 0.1, iv: clamp(2.3 - h.spd * 0.09, 1.2, 2.1),
        };
      }
      const w = u.equip.arma ? ITEMS[u.equip.arma] : null;
      let armor = 0, hpB = 0, spd = h.spd;
      for (const s of SLOTS) {
        if (s === 'arma' || !u.equip[s]) continue;
        const it = ITEMS[u.equip[s]];
        armor += it.def || 0; hpB += it.hp || 0; spd += it.spd || 0;
      }
      if (passive(u, 'ferreiro')) armor = Math.round(armor * 1.25);
      const ml = w ? (u.mastery[w.wt] || 0) : 0;
      const maxHp = h.hp + (u.level - 1) * 12 + hpB;
      let atk = h.atk + u.level * 2 + (w ? Math.round(w.atk * (1 + ml * 0.05)) : 0);
      if (passive(u, 'furia') && u.hp < maxHp / 2) atk = Math.round(atk * 1.25);
      return {
        atk, def: h.def + u.level + armor, spd, maxHp, ml, w: w ? w.id : null,
        crit: 0.1 + (passive(u, 'precisao') ? 0.15 : 0), iv: clamp(2.0 - spd * 0.08, 1.0, 1.8),
      };
    }
    function heal(u, v) {
      const before = u.hp;
      u.hp = Math.min(stats(u).maxHp, u.hp + Math.round(v));
      return u.hp - before;
    }
    const clampHp = (u) => { u.hp = Math.min(u.hp, stats(u).maxHp); };
    function gainXp(u, x) {
      u.xp += Math.round(x);
      while (u.xp >= xpNeed(u.level)) {
        u.xp -= xpNeed(u.level);
        u.level++; u.hp += 12;
        heal(u, stats(u).maxHp * 0.2);
        plog(u, `✨ Você alcançou o nível ${u.level}!`, 'good');
      }
    }
    function give(u, id, verb = 'Encontrou') {
      const it = ITEMS[id];
      if (u.inv.length >= INV_CAP) { plog(u, `Mochila cheia: ${it.i} ${it.n} ficou para trás.`, 'warn'); return; }
      u.inv.push(id);
      plog(u, `${verb} ${it.i} ${it.n}.`, it.r >= 2 ? 'good' : '');
    }

    /* ---------- Combate ---------- */
    function engage(a, b, ambush) {
      for (const u of [a, b]) {
        u.act = null; u.resting = false; u.guardUntil = 0; u.shieldUntil = 0; u.stunUntil = 0; u.bleedN = 0;
      }
      a.foe = b.id; b.foe = a.id;
      const ia = stats(a).iv, ib = stats(b).iv;
      a.atkAt = S.now + (ambush ? 0.3 : ia * 0.5);
      b.atkAt = S.now + (passive(b, 'precisao') ? 0.3 : ambush ? ib : ib * 0.6);
      if (passive(a, 'precisao')) a.atkAt = S.now + 0.3;
      plog(a, ambush ? `⚔️ Você embosca ${b.icon} ${b.name}!` : `⚔️ ${b.icon} ${b.name} surge diante de você!`, 'cb');
      plog(b, ambush ? `⚠️ ${a.icon} ${a.name} embosca você!` : `⚔️ ${a.icon} ${a.name} surge diante de você!`, ambush ? 'warn' : 'cb');
    }
    function release(u) {
      const f = S.units[u.foe];
      u.foe = null;
      for (const x of [u, f]) {
        if (!x) continue;
        x.foe = null; x.bleedN = 0; x.stunUntil = 0; x.act = null; x.immuneUntil = S.now + T.immune;
        if (x.kind === 'm' && x !== u) delete S.units[x.id];
      }
    }

    function hit(att, def, mult) {
      const sa = stats(att), sd = stats(def);
      let d = sa.atk * mult * rnd(0.85, 1.15) - sd.def * 0.6;
      const cr = Math.random() < sa.crit;
      if (cr) d *= 1.5;
      if (def.shieldUntil > S.now) d *= 1 - def.shieldV;
      const guarded = def.guardUntil > S.now || (def.kind === 'b' && Math.random() < 0.25);
      if (guarded) d *= 0.4;
      if (passive(def, 'baluarte')) d *= 0.88;
      d = Math.max(1, Math.round(d));
      def.hp -= d;
      if (att.kind === 'h' && sa.w) {
        const wt = ITEMS[sa.w].wt, lv = att.mastery[wt] || 0;
        if (lv < 10) {
          att.mxp[wt] = (att.mxp[wt] || 0) + 1;
          if (att.mxp[wt] >= mxpNeed(lv)) {
            att.mxp[wt] = 0; att.mastery[wt] = lv + 1;
            plog(att, `📈 Maestria com ${WTYPES[wt]} subiu para ${lv + 1}.`, 'good');
          }
        }
      }
      if (passive(att, 'vampirismo')) heal(att, d * 0.15);
      return { d, tag: (cr ? ' (CRÍTICO!)' : '') + (guarded ? ' (defendido)' : '') };
    }
    /* Registra um golpe para os dois lados e resolve a morte do alvo */
    function strike(att, def, mult, label) {
      const r = hit(att, def, mult);
      plog(att, `${label ? `✨ ${label}: ` : 'Você atinge '}${label ? '' : `${def.name}: `}${r.d} de dano${r.tag}.`, 'cb');
      plog(def, `${att.name} ${label ? `usa ${label} e atinge` : 'atinge'} você: ${r.d} de dano${r.tag}.`, 'hurt');
      return r;
    }
    const dead = (u) => u.hp <= 0;

    function kill(u, by, cause) {
      if (!u.alive) return;
      u.alive = false; u.hp = 0;
      release(u);
      if (u.kind === 'm') {
        delete S.units[u.id];
        if (by && by.kind === 'h') {
          plog(by, `🏆 ${u.name} foi derrotado!`, 'good');
          gainXp(by, u.xp * (passive(by, 'rastreador') ? 1.5 : 1));
          let k = 1 + (Math.random() < 0.4 ? 1 : 0);
          while (k--) give(by, wpick(u.drops), 'Obteve');
        }
        return;
      }
      const left = champs().length;
      const how = cause === 'mist' ? 'foi consumido pela Névoa Cinzenta'
        : cause === 'quit' ? 'abandonou a ilha'
        : cause === 'tired' ? 'tombou de exaustão'
        : `foi eliminado por ${by ? by.name : 'uma criatura'}`;
      glog(`☠️ ${u.name} ${how} em ${AREAS[u.area].n}. Restam ${left}.`, 'kill');
      if (by && by.kind === 'b') {
        by.kills++; by.level++;
        if (u.kind === 'b' && u.wtier > by.wtier) by.wtier = u.wtier;
        by.hp = Math.min(stats(by).maxHp, by.hp + 30);
      } else if (by && by.kind === 'h') {
        by.kills++;
        gainXp(by, 60 + u.level * 20);
        let loot;
        if (u.kind === 'h') loot = shuffle(u.inv).slice(0, 4);
        else {
          loot = [pick(['pao', 'carne_assada', 'cha_lunar', 'cantil']), pick(['ferro', 'couro', 'prata', 'cristal', 'osso'])];
          if (u.wtier >= 2) loot.push(pick(['runa', 'essencia', 'pocao_cura']));
          if (u.wtier >= 3) loot.push(pick(['escama', 'estelar']));
        }
        loot.forEach((id) => give(by, id, 'Saqueou'));
      }
      if (u.kind === 'h') {
        u.act = null; u.resting = false;
        u.over = {
          win: false, rank: left + 1,
          reason: cause === 'mist' ? 'Consumido pela Névoa Cinzenta' : cause === 'quit' ? 'Você abandonou a ilha'
            : cause === 'tired' ? 'Tombou de exaustão no caminho' : `Derrotado por ${by ? by.name : 'uma criatura'}`,
        };
      }
      checkEnd();
    }
    function checkEnd() {
      const al = champs();
      if (al.length === 1) {
        const w = al[0];
        if (w.kind === 'h' && !w.over) w.over = { win: true, rank: 1, reason: 'Você é o último campeão de pé' };
        glog(`🔥 ${w.name} alcança a Última Chama. Um desejo será concedido.`, 'sys');
        S.over = true;
      } else if (!al.some((u) => u.kind === 'h')) S.over = true;
    }

    /* Criaturas e campeões do jogo atacam sozinhos quando o tempo de ataque chega */
    function aiAttack(u) {
      const f = S.units[u.foe];
      if (!f) { u.foe = null; return; }
      const st = stats(u);
      if (u.kind === 'b' && u.hp < st.maxHp * 0.25 && Math.random() < 0.3) {
        plog(f, `${u.name} recua ferido e desaparece entre as sombras.`, 'cb');
        release(u);
        const nb = neighbors(u.area).filter((i) => S.areas[i] !== 'selada');
        if (nb.length) u.area = pick(nb);
        return;
      }
      const skill = u.kind === 'b' && Math.random() < 0.22;
      strike(u, f, skill ? 1.6 : 1, skill ? HEROES[u.hero].skill.n : null);
      u.atkAt = S.now + st.iv;
      if (dead(f)) kill(f, u);
    }

    function fightCmd(u, c, v) {
      const f = S.units[u.foe], st = stats(u), h = HEROES[u.hero];
      if (!f) { u.foe = null; return; }
      if (u.stunUntil > S.now) return;
      if (c === 'guard') {
        if (S.now < u.guardAt) return;
        u.guardUntil = S.now + T.guard; u.guardAt = S.now + T.guardCd;
        return;
      }
      if (u.act) return; // tentando fugir
      if (c === 'atk') {
        if (S.now < u.atkAt) return;
        strike(u, f, 1);
        u.atkAt = S.now + st.iv;
      } else if (c === 'skill') {
        if (S.now < u.skillAt) return;
        const sk = h.skill;
        u.skillAt = S.now + (sk.cd - (passive(u, 'arcano') ? 1 : 0)) * T.skillTurn;
        u.atkAt = Math.max(u.atkAt, S.now + st.iv * 0.6);
        if (sk.type === 'cura') {
          plog(u, `✨ ${sk.n}: você recupera ${heal(u, st.maxHp * sk.v)} de vida.`, 'good');
        } else if (sk.type === 'duplo') {
          strike(u, f, sk.v, sk.n);
          if (!dead(f)) strike(u, f, sk.v, sk.n);
        } else {
          const r = strike(u, f, sk.type === 'escudo' ? 0.7 : sk.v, sk.n);
          if (sk.type === 'atordoar') {
            f.stunUntil = S.now + T.stun; f.atkAt = Math.max(f.atkAt, f.stunUntil + 0.2);
            if (f.kind === 'h') f.act = null;
            plog(u, `${f.name} fica atordoado!`, 'cb'); plog(f, 'Você está atordoado!', 'warn');
          }
          if (sk.type === 'sangrar') {
            f.bleedN = 4; f.bleedD = Math.max(2, Math.round(st.atk * 0.3)); f.bleedAt = S.now + 1; f.bleedBy = u.id;
            plog(u, `${f.name} começa a sangrar!`, 'cb'); plog(f, 'Você está sangrando!', 'warn');
          }
          if (sk.type === 'escudo') { u.shieldUntil = S.now + T.shield; u.shieldV = sk.v; plog(u, 'Você ergue a guarda.', 'cb'); }
          if (sk.type === 'drenar') plog(u, `Você absorve ${heal(u, r.d * 0.5)} de vida.`, 'good');
        }
      } else if (c === 'flee') {
        if (S.now < u.fleeAt) return;
        u.act = { type: 'flee', start: S.now, end: S.now + T.flee };
        plog(u, 'Você procura uma brecha para fugir…', 'cb');
        return;
      } else return;
      if (dead(f)) kill(f, u);
    }
    function resolveFlee(u) {
      const f = S.units[u.foe];
      u.act = null;
      if (!f) return;
      const ch = clamp(0.55 + (stats(u).spd - stats(f).spd) * 0.04 + (passive(u, 'saqueador') ? 0.3 : 0), 0.15, 0.95);
      if (Math.random() < ch) {
        plog(u, 'Você escapa do combate!', 'good');
        plog(f, `${u.name} escapou!`, 'cb');
        release(u);
      } else {
        u.fleeAt = S.now + T.fleeCd;
        plog(u, 'O inimigo bloqueia sua fuga!', 'warn');
      }
    }

    /* ---------- Mochila e forja ---------- */
    function equip(u, idx) {
      const it = ITEMS[u.inv[idx]], slot = it && slotOf(it);
      if (!slot) return;
      const old = u.equip[slot];
      u.equip[slot] = it.id;
      u.inv.splice(idx, 1);
      if (old) u.inv.push(old);
      clampHp(u);
      plog(u, `Equipou ${it.i} ${it.n}.`);
    }
    function useItem(u, idx) {
      const it = ITEMS[u.inv[idx]];
      if (!it || it.t !== 'consumivel') return;
      if (u.foe && (S.now < u.itemAt || u.stunUntil > S.now)) return;
      const k = passive(u, 'herbalista') ? 1.4 : 1;
      u.inv.splice(idx, 1);
      const h = it.hp ? heal(u, it.hp * k) : 0, before = u.vigor;
      u.vigor = Math.min(100, u.vigor + Math.round(it.vigor * k));
      const parts = [];
      if (it.hp) parts.push(`+${h} de vida`);
      if (it.vigor) parts.push(`+${u.vigor - before} de vigor`);
      plog(u, `Você usa ${it.i} ${it.n} (${parts.join(', ')}).`, 'good');
      if (u.foe) u.itemAt = S.now + T.item;
    }
    function drop(u, idx) {
      const [id] = u.inv.splice(idx, 1);
      if (id) plog(u, `Descartou ${ITEMS[id].i} ${ITEMS[id].n}.`);
    }
    function doCraft(u, ri) {
      if (!canCraft(u, ri)) return;
      const rec = RECIPES[ri], out = ITEMS[rec.out];
      for (const id of rec.ins) {
        const k = u.inv.indexOf(id);
        if (k >= 0) u.inv.splice(k, 1);
        else for (const s of SLOTS) if (u.equip[s] === id) { u.equip[s] = null; break; }
      }
      const slot = slotOf(out);
      if (slot && !u.equip[slot]) u.equip[slot] = out.id;
      else u.inv.push(out.id);
      clampHp(u);
      plog(u, `⚒️ Você forjou ${out.i} ${out.n}${out.r >= 3 ? ` — ${RARITY[out.r]}!` : '.'}`, out.r >= 2 ? 'good' : '');
      gainXp(u, 8 + out.r * 10);
    }

    /* ---------- Ações no campo ---------- */
    const free = (x, u) => x.alive && x.kind !== 'm' && x !== u && !x.foe && x.immuneUntil <= S.now && !(x.act && x.act.type === 'move');
    const others = (u) => all().filter((x) => x.area === u.area && free(x, u));

    function pickMon(u) {
      const a = AREAS[u.area];
      const ok = a.mons.filter((id) => MONS[id].xp < 60 || (MONS[id].xp < 100 ? u.level >= 2 : u.level >= 4));
      return ok.length ? pick(ok) : 'aranha';
    }
    function spawnMon(u) {
      const id = pickMon(u), m = MONS[id];
      return add({ ...base(), kind: 'm', mon: id, name: m.n, icon: m.i, hp: m.hp, maxHp: m.hp, atk: m.atk, def: m.def, spd: m.spd, xp: m.xp, drops: m.drops, area: u.area });
    }

    function finishAct(u) {
      const act = u.act;
      u.act = null;
      if (act.type === 'flee') return resolveFlee(u);
      if (act.type === 'craft') return doCraft(u, act.ri);
      if (act.type === 'move') {
        u.area = act.to;
        const st = S.areas[u.area];
        plog(u, `Você chega a ${AREAS[u.area].i} ${AREAS[u.area].n}.` +
          (st === 'selada' ? ' A névoa aqui é sufocante!' : st === 'condenada' ? ' O sino já tocou por este lugar.' : ''), st === 'livre' ? '' : 'warn');
        const bots = others(u).filter((x) => x.kind === 'b');
        if (bots.length && Math.random() < 0.12) engage(pick(bots), u, true);
        return;
      }
      /* explorar */
      const a = AREAS[u.area], near = others(u);
      if (near.length && Math.random() < (S.lastStand ? 0.6 : 0.2)) return engage(u, pick(near), false);
      if (Math.random() < a.danger) return engage(spawnMon(u), u, false);
      if (Math.random() < 0.06) return plog(u, 'Você vasculha a região, mas não encontra nada útil.');
      let n = 1 + (Math.random() < 0.3 ? 1 : 0) + (passive(u, 'saqueador') && Math.random() < 0.4 ? 1 : 0);
      while (n--) give(u, wpick(a.loot));
    }

    function fieldCmd(u, c, v) {
      if (u.act) return;
      if (c === 'rest') {
        u.resting = !u.resting; u.restAt = S.now + T.rest;
        if (u.resting) plog(u, 'Você se acomoda para descansar.');
        return;
      }
      if (c === 'explore') {
        if (u.vigor < 12) return plog(u, 'Você está exausto demais para explorar. Descanse ou beba algo.', 'warn');
        u.resting = false; u.vigor -= 12;
        u.act = { type: 'explore', start: S.now, end: S.now + T.explore };
      } else if (c === 'move') {
        const to = Number(v);
        if (!neighbors(u.area).includes(to)) return;
        u.resting = false;
        if (u.vigor >= 10) u.vigor -= 10;
        else {
          u.hp -= 8;
          plog(u, 'Sem vigor, você se arrasta pelo caminho (−8 de vida).', 'warn');
          if (dead(u)) return kill(u, null, 'tired');
        }
        u.act = { type: 'move', to, start: S.now, end: S.now + T.move };
      } else if (c === 'craft') {
        const ri = Number(v);
        if (!canCraft(u, ri)) return;
        u.resting = false;
        let d = T.craft;
        if (passive(u, 'ferreiro')) d /= 2;
        if (AREAS[u.area].forge) d /= 2;
        u.act = { type: 'craft', ri, start: S.now, end: S.now + d };
      }
    }

    function cmd(id, c, v) {
      const u = S.units[id];
      if (!u || u.kind !== 'h' || !u.alive || S.over) return;
      if (c === 'equip') return equip(u, Number(v));
      if (c === 'drop') return drop(u, Number(v));
      if (c === 'use') return useItem(u, Number(v));
      if (u.foe) fightCmd(u, c, v); else fieldCmd(u, c, v);
    }

    function restTick(u) {
      u.restAt = S.now + T.rest;
      const k = AREAS[u.area].sanctuary ? 1.6 : 1, mx = stats(u).maxHp;
      heal(u, mx * 0.03 * k);
      u.vigor = Math.min(100, u.vigor + Math.round(5 * k));
      const bots = others(u).filter((x) => x.kind === 'b');
      if (bots.length && Math.random() < 0.015) { plog(u, 'Seu descanso é interrompido!', 'warn'); return engage(pick(bots), u, true); }
      if (u.hp >= mx && u.vigor >= 100) { u.resting = false; plog(u, 'Você está descansado.'); }
    }

    /* ---------- Névoa ---------- */
    function mistAdvance() {
      const sealed = [];
      S.areas.forEach((st, i) => { if (st === 'condenada') { S.areas[i] = 'selada'; sealed.push(AREAS[i].n); } });
      if (sealed.length) glog(`🌫️ A névoa engoliu: ${sealed.join(' e ')}.`, 'bad');
      const left = S.mistOrder.length - S.mistIdx;
      const k = left > 2 ? 2 : left === 2 ? 1 : 0; // a última região nunca é tomada: é a arena final
      const doomed = [];
      for (let j = 0; j < k; j++) {
        const a = S.mistOrder[S.mistIdx++];
        S.areas[a] = 'condenada';
        doomed.push(AREAS[a].n);
      }
      if (doomed.length) glog(`🔔 O sino toca. Em ${T.mist} segundos a névoa tomará: ${doomed.join(' e ')}.`, 'warn');
      else if (sealed.length) {
        S.lastStand = true;
        glog(`🔥 Resta um único refúgio: ${AREAS[S.mistOrder[S.mistOrder.length - 1]].n}. É lá que tudo termina.`, 'warn');
      }
    }

    /* ---------- Campeões controlados pelo jogo ---------- */
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
    function botDuel(a, b) {
      let x = a, y = b;
      if (HEROES[b.hero].spd > HEROES[a.hero].spd) [x, y] = [y, x];
      for (let r = 0; r < 16; r++) {
        const sx = stats(x), sy = stats(y);
        let d = sx.atk * (Math.random() < 0.2 ? 1.6 : 1) * rnd(0.85, 1.15) - sy.def * 0.6;
        if (Math.random() < 0.1) d *= 1.5;
        y.hp -= Math.max(1, Math.round(d));
        if (dead(y)) return kill(y, x);
        if (y.hp < sy.maxHp * 0.25 && Math.random() < 0.5) {
          const nb = neighbors(y.area).filter((i) => S.areas[i] !== 'selada');
          if (nb.length) y.area = pick(nb);
          return;
        }
        [x, y] = [y, x];
      }
    }
    function botThink(u) {
      const st = S.areas[u.area];
      u.thinkAt = S.now + (st === 'livre' ? T.think : T.think / 3);
      if (st !== 'livre') {
        const step = stepToward(u.area, (a) => S.areas[a] === 'livre') ?? stepToward(u.area, (a) => S.areas[a] === 'condenada');
        if (step != null) u.area = step;
        return;
      }
      const mx = stats(u).maxHp, near = others(u);
      const bots = near.filter((x) => x.kind === 'b'), hum = near.filter((x) => x.kind === 'h');
      if (hum.length && Math.random() < (S.lastStand ? 0.4 : 0.08)) return engage(u, pick(hum), true);
      if (bots.length && Math.random() < 0.3) return botDuel(u, pick(bots));
      const r = Math.random();
      if (u.hp < mx * 0.5 && r < 0.5) { u.hp = Math.min(mx, u.hp + mx * 0.25); return; }
      if (r < 0.6) {
        u.prog += rnd(0.6, 1.4);
        if (u.prog >= 3 + 1.5 * u.ups) {
          u.prog = 0; u.ups++; u.level += 2;
          u.wtier = Math.min(4, u.wtier + 1); u.armor += 3;
          u.hp = Math.min(stats(u).maxHp, u.hp + 12);
        }
      } else if (r < 0.8) {
        const nb = neighbors(u.area).filter((a) => S.areas[a] === 'livre');
        if (nb.length) u.area = pick(nb);
      } else u.hp = Math.min(mx, u.hp + mx * 0.1);
    }

    /* ---------- Avanço do tempo ---------- */
    function step(dt) {
      if (S.over) return;
      S.now += dt;
      if (S.now >= S.mistAt) { S.mistAt += T.mist; mistAdvance(); }
      const tick = S.now >= S.tickAt;
      if (tick) S.tickAt += T.tick;
      for (const u of all()) {
        if (S.over) return;
        if (!u.alive || !S.units[u.id]) continue;
        if (tick && u.kind !== 'm') {
          if (S.areas[u.area] === 'selada' && !(u.act && u.act.type === 'move')) {
            u.hp -= T.mistDmg;
            plog(u, `🌫️ A Névoa Cinzenta corrói sua carne (−${T.mistDmg} de vida). Saia daqui!`, 'bad');
            if (dead(u)) { kill(u, null, 'mist'); continue; }
          }
          if (u.kind === 'h') {
            if (!u.foe) u.vigor = Math.min(100, u.vigor + 1);
            if (passive(u, 'regen')) heal(u, 2);
          }
        }
        if (u.bleedN > 0 && S.now >= u.bleedAt) {
          u.bleedN--; u.bleedAt += 1; u.hp -= u.bleedD;
          plog(u, `🩸 Você sangra: ${u.bleedD} de dano.`, 'hurt');
          plog(S.units[u.bleedBy], `🩸 ${u.name} sangra: ${u.bleedD} de dano.`, 'cb');
          if (dead(u)) { kill(u, S.units[u.bleedBy]); continue; }
        }
        if (u.kind === 'h') {
          if (u.act && S.now >= u.act.end) finishAct(u);
          else if (u.resting && !u.foe && S.now >= u.restAt) restTick(u);
        } else if (u.foe) {
          if (S.now >= u.atkAt && S.now >= u.stunUntil) aiAttack(u);
        } else if (u.kind === 'b' && S.now >= u.thinkAt) botThink(u);
      }
    }

    function removePlayer(id) {
      const u = S.units[id];
      if (u && u.alive) kill(u, null, 'quit');
    }

    /* O que um jogador pode saber: seu estado, o mapa, o inimigo à frente e os avisos gerais */
    function view(id) {
      const u = S.units[id];
      if (!u) return null;
      const f = S.units[u.foe];
      const fs = f && stats(f);
      const near = {};
      if (passive(u, 'rastreador')) for (const a of neighbors(u.area)) near[a] = champs().filter((x) => x.area === a).length;
      const { log, pid, ...me } = u;
      return {
        now: S.now, you: { ...me, st: stats(u) }, log: log.slice(), areas: S.areas.slice(), mistIn: S.mistAt - S.now, lastStand: S.lastStand,
        alive: champs().length, total: S.total, ended: S.over, near,
        here: champs().filter((x) => x !== u && x.area === u.area).length,
        foe: f ? {
          name: f.name, icon: f.icon, kind: f.kind, hp: Math.max(0, Math.round(f.hp)), maxHp: fs.maxHp, iv: fs.iv, atkAt: f.atkAt,
          stunUntil: f.stunUntil, bleedN: f.bleedN, shieldUntil: f.shieldUntil, guardUntil: f.guardUntil,
        } : null,
        roster: all().filter((x) => x.kind !== 'm').map((x) => ({ name: x.name, icon: x.icon, alive: x.alive, kills: x.kills, human: x.kind === 'h', you: x === u })),
      };
    }

    intro();
    return { S, ids, step, cmd, view, removePlayer };
  }

  return { create, T, neighbors, xpNeed, mxpNeed, owned, canCraft };
})();
