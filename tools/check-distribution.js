/* Confere as regras de distribuição dos itens pelo mapa. Uso: node tools/check-distribution.js */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), ctx);
const { AREAS, RECIPES, ITEMS, HEROES, WTYPES } = vm.runInContext('({AREAS,RECIPES,ITEMS,HEROES,WTYPES})', ctx);

const where = {}, total = {};
AREAS.forEach((a, i) => a.loot.forEach(([id, q]) => { (where[id] = where[id] || []).push(i); total[id] = (total[id] || 0) + q; }));
const dist = (a, b) => Math.abs(Math.floor(a / 4) - Math.floor(b / 4)) + Math.abs((a % 4) - (b % 4));
let bad = 0;
const fail = (m) => { bad++; console.log('  ✗ ' + m); };

console.log(`Estoque total: ${Object.values(total).reduce((a, b) => a + b, 0)} itens em ${AREAS.length} regiões`);
console.log('Por região: ' + AREAS.map((a) => a.loot.reduce((n, l) => n + l[1], 0)).join(' '));

// 1. materiais em 2–3 regiões, não vizinhas
for (const id of Object.keys(where)) {
  if (ITEMS[id].t !== 'material') continue;
  const w = where[id];
  if (ITEMS[id].r < 3 && (w.length < 2 || w.length > 3)) fail(`${ITEMS[id].n} está em ${w.length} regiões`);
  for (const a of w) for (const b of w) if (a < b && dist(a, b) < 2) fail(`${ITEMS[id].n} em regiões vizinhas (${AREAS[a].n}, ${AREAS[b].n})`);
}
// 2. ingredientes do mesmo passo nunca juntos
for (const r of RECIPES) {
  // vale para armas e proteções de verdade; comida, utilidades e peças básicas podem ser fáceis
  if (!(ITEMS[r.out].t === 'arma' || (ITEMS[r.out].t === 'armadura' && ITEMS[r.out].r >= 1))) continue;
  const mats = r.ins.filter((id) => where[id] && ITEMS[id].t === 'material');
  AREAS.forEach((a, i) => {
    const here = mats.filter((id) => where[id].includes(i));
    if (here.length > 1) fail(`${ITEMS[r.out].n}: ${here.map((x) => ITEMS[x].n).join(' + ')} juntos em ${a.n}`);
  });
}
// 3 e 4. por linha de arma: arma inicial longe do primeiro material; mínimo de regiões até o terceiro degrau
const cover = (sets) => {       // menor número de regiões que cobre todos os materiais
  for (let k = 1; k <= 6; k++) {
    const pickN = (start, chosen) => {
      if (chosen.length === k) return sets.every((s) => s.some((a) => chosen.includes(a)));
      for (let a = start; a < AREAS.length; a++) if (pickN(a + 1, chosen.concat(a))) return true;
      return false;
    };
    if (pickN(0, [])) return k;
  }
  return 7;
};
console.log('\nRegiões mínimas para levar cada arma ao 3º degrau (sem contar onde a arma inicial é achada):');
for (const wt of Object.keys(WTYPES)) {
  let cur = HEROES.find((h) => h.wt === wt).start;
  const base = cur, need = [];
  for (let step = 0; step < 3; step++) {
    const rec = RECIPES.find((r) => r.ins.includes(cur));
    rec.ins.filter((id) => id !== cur).forEach((id) => need.push(id));
    if (step === 0) for (const id of rec.ins) if (id !== cur && where[id].some((a) => (where[base] || []).includes(a))) fail(`${ITEMS[base].n} aparece junto do seu primeiro material`);
    cur = rec.out;
  }
  const n = cover(need.map((id) => where[id]));
  console.log(`  ${WTYPES[wt].padEnd(7)} ${n} regiões  (${need.map((id) => ITEMS[id].n).join(', ')})`);
  if (n < 3) fail(`${WTYPES[wt]} fecha o 3º degrau em ${n} regiões`);
}
console.log('\nQuantidade de cada material no mapa:');
console.log('  ' + Object.keys(total).filter((id) => ITEMS[id].t === 'material').sort((a, b) => total[b] - total[a]).map((id) => `${ITEMS[id].n} ${total[id]}`).join(' · '));
console.log(bad ? `\n${bad} regra(s) violada(s)` : '\nTodas as regras de distribuição foram atendidas.');
process.exit(bad ? 1 : 0);
