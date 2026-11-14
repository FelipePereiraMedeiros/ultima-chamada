/* Confere as regras de receitas e de distribuição dos itens pelo mapa. Uso: node tools/check-distribution.js */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), ctx);
const { AREAS, RECIPES, ITEMS, HEROES, WTYPES } = vm.runInContext('({AREAS,RECIPES,ITEMS,HEROES,WTYPES})', ctx);

const where = {}, total = {};
AREAS.forEach((a, i) => a.loot.forEach(([id, q]) => { (where[id] = where[id] || []).push(i); total[id] = (total[id] || 0) + q; }));
const dist = (a, b) => Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) + Math.abs((a % 4) - (b % 4));
let bad = 0;
const fail = (m) => { bad++; console.log('  ✗ ' + m); };
const name = (id) => ITEMS[id].n;
/* materiais brutos por trás de um item (abre os componentes) */
const raws = (id) => { const r = ITEMS[id].mid && RECIPES.find((x) => x.out === id); return r ? r.ins.flatMap(raws) : [id]; };

console.log(`Estoque total: ${Object.values(total).reduce((a, b) => a + b, 0)} itens em ${AREAS.length} regiões`);
console.log('Por região: ' + AREAS.map((a) => a.loot.reduce((n, l) => n + l[1], 0)).join(' '));

// 1. receitas: sempre dois insumos, sem pares repetidos, todo componente usado em 3+ receitas
const pairs = {};
for (const r of RECIPES) {
  if (r.ins.length !== 2) fail(`${name(r.out)} não tem dois insumos`);
  const k = r.ins.slice().sort().join('+');
  if (pairs[k]) fail(`${name(r.out)} e ${name(pairs[k])} usam os mesmos insumos`);
  pairs[k] = r.out;
}
const mids = Object.values(ITEMS).filter((i) => i.mid);
for (const m of mids) if (RECIPES.filter((r) => r.ins.includes(m.id)).length < 3) fail(`${m.n} é usado em menos de 3 receitas`);

// 2. materiais brutos em 2–3 regiões, nunca vizinhas
for (const id of Object.keys(where)) {
  if (ITEMS[id].t !== 'material') continue;
  const w = where[id];
  if (w.length < 2 || w.length > 3) fail(`${name(id)} está em ${w.length} regiões`);
  for (const a of w) for (const b of w) if (a < b && dist(a, b) < 2) fail(`${name(id)} em regiões vizinhas (${AREAS[a].n}, ${AREAS[b].n})`);
}
// 3. os dois materiais de um componente, e os de um passo de arma ou proteção, nunca estão na mesma região
for (const r of RECIPES) {
  const out = ITEMS[r.out];
  if (!(out.mid || out.t === 'arma' || (out.t === 'armadura' && out.r >= 1))) continue;
  const mats = [...new Set(r.ins.flatMap(raws))].filter((id) => where[id] && ITEMS[id].t === 'material');
  AREAS.forEach((a, i) => {
    const here = mats.filter((id) => where[id].includes(i));
    if (here.length > 1) fail(`${out.n}: ${here.map(name).join(' + ')} juntos em ${a.n}`);
  });
}
// 4. por tipo de arma e por rota: regiões mínimas até o 3º degrau
const cover = (sets) => {
  for (let k = 1; k <= 7; k++) {
    const go = (start, chosen) => {
      if (chosen.length === k) return sets.every((s) => s.some((a) => chosen.includes(a)));
      for (let a = start; a < AREAS.length; a++) if (go(a + 1, chosen.concat(a))) return true;
      return false;
    };
    if (go(0, [])) return k;
  }
  return 8;
};
console.log('\nRegiões mínimas para levar cada arma ao 3º degrau, por rota:');
for (const wt of Object.keys(WTYPES)) {
  const base = HEROES.find((h) => h.wt === wt).start;
  const t1 = RECIPES.find((r) => r.ins.includes(base));
  for (const id of t1.ins) if (id !== base && where[id].some((a) => (where[base] || []).includes(a))) fail(`${name(base)} aparece junto do seu primeiro material`);
  const routes = RECIPES.filter((r) => r.ins.includes(t1.out) && ITEMS[r.out].r === 2);
  if (routes.length !== 2) fail(`${WTYPES[wt]} tem ${routes.length} rotas no 2º degrau`);
  const line = [];
  for (const t2 of routes) {
    const t3 = RECIPES.find((r) => r.ins.includes(t2.out) && ITEMS[r.out].r === 3);
    const swap = RECIPES.some((r) => r.out === t2.out && r.ins.some((x) => routes.some((o) => o.out === x && o !== t2)));
    if (!swap) fail(`${name(t2.out)} não tem troca de rota`);
    if (!RECIPES.some((r) => r.ins.includes(t3.out) && ITEMS[r.out].r === 4)) fail(`${name(t3.out)} não leva à lendária`);
    const need = [...new Set([t1, t2, t3].flatMap((r) => r.ins.filter((x) => ITEMS[x].t === 'material').flatMap(raws)))];
    const n = cover(need.map((id) => where[id]));
    line.push(`${name(t3.out)} ${n}`);
    if (n < 3) fail(`${name(t3.out)} fecha em ${n} regiões`);
  }
  console.log(`  ${WTYPES[wt].padEnd(7)} ${line.join(' · ')}`);
}
console.log('\nUsos de cada componente: ' + mids.map((m) => `${m.n} ${RECIPES.filter((r) => r.ins.includes(m.id)).length}`).join(' · '));
console.log('Quantidade de cada material no mapa: ' + Object.keys(total).filter((id) => ITEMS[id].t === 'material').sort((a, b) => total[b] - total[a]).map((id) => `${name(id)} ${total[id]}`).join(' · '));
console.log(bad ? `\n${bad} regra(s) violada(s)` : '\nTodas as regras foram atendidas.');
process.exit(bad ? 1 : 0);
