/* Última Chama — dados do jogo (mundo, heróis, itens e receitas originais) */

const RARITY = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
const WTYPES = {
  espada: 'Espada', machado: 'Machado', martelo: 'Martelo', adaga: 'Adaga',
  arco: 'Arco', cajado: 'Cajado', lanca: 'Lança',
};
const SLOTS = ['arma', 'cabeca', 'corpo', 'maos', 'pes', 'amuleto'];
const SLOT_NAMES = {
  arma: 'Arma', cabeca: 'Cabeça', corpo: 'Corpo', maos: 'Mãos', pes: 'Pés', amuleto: 'Amuleto',
};
const INV_CAP = 12;

const ITEMS = {};
const mat = (id, n, i, r = 0) => { ITEMS[id] = { id, n, i, t: 'material', r }; };
const wep = (id, n, i, wt, atk, r) => { ITEMS[id] = { id, n, i, t: 'arma', wt, atk, r }; };
const arm = (id, n, i, slot, r, bonus) => { ITEMS[id] = { id, n, i, t: 'armadura', slot, r, ...bonus }; };
const con = (id, n, i, r, hp, vigor) => { ITEMS[id] = { id, n, i, t: 'consumivel', r, hp, vigor }; };

/* Materiais */
mat('galho', 'Galho de Carvalho', '🪵');
mat('pedra', 'Pedra Afiada', '🪨');
mat('ferro', 'Minério de Ferro', '⛓️');
mat('couro', 'Couro Cru', '🟫');
mat('pano', 'Pano Velho', '🧵');
mat('corda', 'Corda', '🪢');
mat('osso', 'Osso Antigo', '🦴');
mat('carvao', 'Carvão', '⚫');
mat('carne', 'Carne Crua', '🥩');
mat('agua', 'Água da Fonte', '💧');
mat('cogumelo', 'Cogumelo Cinzento', '🍄');
mat('erva', 'Erva Lunar', '🌿');
mat('pena', 'Pena de Grifo', '🪶', 1);
mat('prata', 'Pepita de Prata', '🥈', 1);
mat('cristal', 'Cristal Arcano', '🔮', 1);
mat('runa', 'Pedra Rúnica', '🗿', 2);
mat('essencia', 'Essência Sombria', '🌑', 2);
mat('escama', 'Escama de Wyrm', '🐲', 3);
mat('estelar', 'Fragmento Estelar', '🌠', 3);

/* Armas: cinco degraus por tipo */
wep('espada_curta', 'Espada Curta', '🗡️', 'espada', 8, 0);
wep('espada_longa', 'Espada Longa', '🗡️', 'espada', 16, 1);
wep('lamina_prata', 'Lâmina de Prata', '🗡️', 'espada', 28, 2);
wep('lamina_runica', 'Lâmina Rúnica', '🗡️', 'espada', 44, 3);
wep('alvorada', 'Alvorada, a Lâmina do Juramento', '🗡️', 'espada', 64, 4);

wep('machadinha', 'Machadinha', '🪓', 'machado', 9, 0);
wep('machado_guerra', 'Machado de Guerra', '🪓', 'machado', 17, 1);
wep('machado_ossos', 'Machado Quebra-Ossos', '🪓', 'machado', 29, 2);
wep('machado_runico', 'Machado Rúnico', '🪓', 'machado', 45, 3);
wep('ruina_wyrm', 'Ruína dos Wyrms', '🪓', 'machado', 66, 4);

wep('martelo_ferreiro', 'Martelo de Ferreiro', '🔨', 'martelo', 8, 0);
wep('malho_pedra', 'Malho de Pedra', '🔨', 'martelo', 16, 1);
wep('martelo_guerra', 'Martelo de Guerra', '🔨', 'martelo', 28, 2);
wep('martelo_trovao', 'Martelo Trovejante', '🔨', 'martelo', 44, 3);
wep('bigorna_ceu', 'Bigorna do Céu', '🔨', 'martelo', 65, 4);

wep('faca', 'Faca Enferrujada', '🔪', 'adaga', 7, 0);
wep('adaga_afiada', 'Adaga Afiada', '🔪', 'adaga', 15, 1);
wep('estilete_prata', 'Estilete de Prata', '🔪', 'adaga', 27, 2);
wep('adaga_sombria', 'Adaga Sombria', '🔪', 'adaga', 43, 3);
wep('presa_noite', 'Presa da Meia-Noite', '🔪', 'adaga', 63, 4);

wep('arco_curto', 'Arco Curto', '🏹', 'arco', 8, 0);
wep('arco_longo', 'Arco Longo', '🏹', 'arco', 16, 1);
wep('arco_composto', 'Arco Composto', '🏹', 'arco', 28, 2);
wep('arco_arcano', 'Arco Arcano', '🏹', 'arco', 44, 3);
wep('cantor_vento', 'Cantor do Vento', '🏹', 'arco', 64, 4);

wep('cajado_aprendiz', 'Cajado de Aprendiz', '🪄', 'cajado', 8, 0);
wep('cajado_cristal', 'Cajado Cristalino', '🪄', 'cajado', 16, 1);
wep('cajado_sabio', 'Cajado do Sábio', '🪄', 'cajado', 28, 2);
wep('cajado_runico', 'Cajado Rúnico', '🪄', 'cajado', 44, 3);
wep('cetro_eclipse', 'Cetro do Eclipse', '🪄', 'cajado', 64, 4);

wep('lanca_caca', 'Lança de Caça', '🔱', 'lanca', 8, 0);
wep('pique', 'Pique de Ferro', '🔱', 'lanca', 16, 1);
wep('lanca_ossea', 'Lança Óssea', '🔱', 'lanca', 28, 2);
wep('lanca_radiante', 'Lança Radiante', '🔱', 'lanca', 44, 3);
wep('ferrao_wyrm', 'Ferrão do Wyrm', '🔱', 'lanca', 65, 4);

/* Armaduras */
arm('capuz', 'Capuz de Pano', '🧢', 'cabeca', 0, { def: 2 });
arm('elmo_ferro', 'Elmo de Ferro', '🪖', 'cabeca', 1, { def: 5 });
arm('elmo_runico', 'Elmo Rúnico', '🪖', 'cabeca', 3, { def: 9, hp: 10 });
arm('gibao', 'Gibão de Couro', '🦺', 'corpo', 0, { def: 4 });
arm('cota_malha', 'Cota de Malha', '🦺', 'corpo', 2, { def: 9 });
arm('couraca_escamas', 'Couraça de Escamas', '🛡️', 'corpo', 4, { def: 15, hp: 20 });
arm('luvas', 'Luvas de Couro', '🧤', 'maos', 0, { def: 2 });
arm('manoplas', 'Manoplas de Ferro', '🧤', 'maos', 1, { def: 5 });
arm('botas', 'Botas de Couro', '🥾', 'pes', 0, { def: 2, spd: 1 });
arm('botas_andarilho', 'Botas do Andarilho', '🥾', 'pes', 2, { def: 3, spd: 3 });
arm('amuleto_osso', 'Amuleto de Osso', '📿', 'amuleto', 0, { hp: 15 });
arm('amuleto_lunar', 'Amuleto Lunar', '📿', 'amuleto', 2, { hp: 35, def: 1 });
arm('amuleto_chama', 'Amuleto da Brasa Eterna', '📿', 'amuleto', 4, { hp: 60, def: 3 });

/* Consumíveis */
con('pao', 'Pão Dormido', '🍞', 0, 20, 0);
con('maca', 'Maçã Silvestre', '🍎', 0, 12, 5);
con('cantil', 'Cantil de Água', '🧴', 0, 0, 20);
con('carne_assada', 'Carne Assada', '🍖', 0, 45, 5);
con('ensopado', 'Ensopado do Viajante', '🍲', 1, 75, 25);
con('cha_lunar', 'Chá Lunar', '🍵', 1, 10, 45);
con('pocao_cura', 'Poção de Cura', '🧪', 2, 110, 0);
con('elixir', 'Elixir do Campeão', '⚗️', 3, 160, 60);

/* Receitas */
const RECIPES = [
  ['espada_longa', 'espada_curta', 'ferro'],
  ['lamina_prata', 'espada_longa', 'prata', 'carvao'],
  ['lamina_runica', 'lamina_prata', 'runa'],
  ['alvorada', 'lamina_runica', 'estelar'],
  ['machado_guerra', 'machadinha', 'ferro'],
  ['machado_ossos', 'machado_guerra', 'osso', 'couro'],
  ['machado_runico', 'machado_ossos', 'runa'],
  ['ruina_wyrm', 'machado_runico', 'escama'],
  ['malho_pedra', 'martelo_ferreiro', 'pedra'],
  ['martelo_guerra', 'malho_pedra', 'ferro', 'carvao'],
  ['martelo_trovao', 'martelo_guerra', 'runa'],
  ['bigorna_ceu', 'martelo_trovao', 'estelar'],
  ['adaga_afiada', 'faca', 'pedra'],
  ['estilete_prata', 'adaga_afiada', 'prata', 'pano'],
  ['adaga_sombria', 'estilete_prata', 'essencia'],
  ['presa_noite', 'adaga_sombria', 'escama'],
  ['arco_longo', 'arco_curto', 'corda'],
  ['arco_composto', 'arco_longo', 'pena', 'galho'],
  ['arco_arcano', 'arco_composto', 'cristal'],
  ['cantor_vento', 'arco_arcano', 'estelar'],
  ['cajado_cristal', 'cajado_aprendiz', 'cristal'],
  ['cajado_sabio', 'cajado_cristal', 'erva', 'pano'],
  ['cajado_runico', 'cajado_sabio', 'runa'],
  ['cetro_eclipse', 'cajado_runico', 'essencia', 'estelar'],
  ['pique', 'lanca_caca', 'ferro'],
  ['lanca_ossea', 'pique', 'osso', 'corda'],
  ['lanca_radiante', 'lanca_ossea', 'cristal'],
  ['ferrao_wyrm', 'lanca_radiante', 'escama'],
  ['capuz', 'pano', 'corda'],
  ['elmo_ferro', 'capuz', 'ferro'],
  ['elmo_runico', 'elmo_ferro', 'runa'],
  ['gibao', 'couro', 'pano'],
  ['cota_malha', 'gibao', 'ferro', 'carvao'],
  ['couraca_escamas', 'cota_malha', 'escama'],
  ['luvas', 'couro', 'corda'],
  ['manoplas', 'luvas', 'ferro'],
  ['botas', 'couro', 'galho'],
  ['botas_andarilho', 'botas', 'pena'],
  ['amuleto_osso', 'osso', 'corda'],
  ['amuleto_lunar', 'amuleto_osso', 'prata', 'cristal'],
  ['amuleto_chama', 'amuleto_lunar', 'estelar', 'essencia'],
  ['carne_assada', 'carne', 'carvao'],
  ['ensopado', 'carne', 'cogumelo', 'agua'],
  ['cantil', 'agua', 'couro'],
  ['cha_lunar', 'erva', 'agua'],
  ['pocao_cura', 'erva', 'cristal', 'agua'],
  ['elixir', 'pocao_cura', 'essencia', 'cogumelo'],
].map(([out, ...ins]) => ({ out, ins }));

/* Criaturas */
const MONS = {
  lobo: { n: 'Lobo Cinzento', i: '🐺', hp: 40, atk: 12, def: 1, spd: 6, xp: 22, drops: [['carne', 3], ['couro', 3]] },
  goblin: { n: 'Saqueador Goblin', i: '👺', hp: 36, atk: 11, def: 2, spd: 7, xp: 22, drops: [['pano', 3], ['corda', 3], ['faca', 1], ['pao', 2]] },
  aranha: { n: 'Aranha das Sombras', i: '🕷️', hp: 46, atk: 13, def: 2, spd: 6, xp: 26, drops: [['corda', 4], ['cogumelo', 2], ['essencia', 1]] },
  esqueleto: { n: 'Esqueleto Guardião', i: '💀', hp: 62, atk: 17, def: 5, spd: 4, xp: 42, drops: [['osso', 5], ['ferro', 2], ['espada_curta', 1]] },
  ogro: { n: 'Ogro das Colinas', i: '👹', hp: 115, atk: 23, def: 5, spd: 2, xp: 65, drops: [['carne', 3], ['couro', 3], ['pedra', 2], ['prata', 1]] },
  espectro: { n: 'Espectro Errante', i: '👻', hp: 72, atk: 21, def: 3, spd: 7, xp: 62, drops: [['essencia', 4], ['pano', 2], ['cristal', 2]] },
  troll: { n: 'Troll do Lodo', i: '🧌', hp: 165, atk: 29, def: 8, spd: 3, xp: 105, drops: [['couro', 2], ['osso', 2], ['essencia', 3], ['runa', 1]] },
  golem: { n: 'Golem Rúnico', i: '🗿', hp: 185, atk: 31, def: 14, spd: 2, xp: 125, drops: [['runa', 5], ['ferro', 2], ['estelar', 1]] },
  wyrm: { n: 'Wyrm Jovem', i: '🐉', hp: 270, atk: 40, def: 12, spd: 5, xp: 230, drops: [['escama', 6], ['estelar', 2]] },
};

/* Regiões da ilha: grade 4x4, vizinhas na horizontal e na vertical */
const AREAS = [
  { n: 'Porto Naufragado', i: '⚓', d: 'Cascos apodrecidos rangem contra o cais. Há cordame e destroços por toda parte.',
    danger: 0.15, mons: ['goblin'], loot: [['corda', 4], ['pano', 3], ['galho', 3], ['agua', 2], ['lanca_caca', 2], ['cantil', 2], ['carne', 1]] },
  { n: 'Vila Abandonada', i: '🏚️', d: 'Casas vazias, portas escancaradas. Alguém saiu às pressas — e deixou coisas para trás.',
    danger: 0.15, mons: ['goblin', 'lobo'], loot: [['pano', 4], ['pao', 3], ['faca', 2], ['corda', 2], ['couro', 2], ['maca', 2], ['machadinha', 2]] },
  { n: 'Campos Dourados', i: '🌾', d: 'O trigo cresce sem dono e o vento traz cheiro de chuva.',
    danger: 0.15, mons: ['lobo'], loot: [['pao', 3], ['maca', 3], ['galho', 3], ['erva', 2], ['carne', 2], ['pena', 1], ['couro', 1]] },
  { n: 'Pico Gelado', i: '🏔️', d: 'O ar é rarefeito e cortante. Grifos fazem ninho nas escarpas.',
    danger: 0.3, mons: ['ogro', 'lobo'], loot: [['pena', 4], ['cristal', 3], ['pedra', 3], ['agua', 2], ['prata', 2]] },
  { n: 'Mercado em Ruínas', i: '🏛️', d: 'Bancas tombadas e baús arrombados. Nem tudo foi levado.',
    danger: 0.2, mons: ['goblin', 'esqueleto'], loot: [['pano', 3], ['espada_curta', 2], ['arco_curto', 2], ['pao', 2], ['couro', 3], ['corda', 2], ['prata', 2]] },
  { n: 'Floresta Sussurrante', i: '🌲', d: 'As árvores parecem cochichar entre si quando você passa.',
    danger: 0.25, mons: ['lobo', 'aranha'], loot: [['galho', 4], ['erva', 3], ['cogumelo', 3], ['pena', 2], ['carne', 2], ['arco_curto', 2], ['lanca_caca', 1]] },
  { n: 'Lago de Prata', i: '🏞️', d: 'Águas imóveis como um espelho. Algo brilha no fundo raso.',
    danger: 0.2, mons: ['aranha', 'espectro'], loot: [['agua', 5], ['prata', 3], ['erva', 2], ['cristal', 2], ['pedra', 2]] },
  { n: 'Minas de Ferro Fundo', i: '⛏️', d: 'Túneis escuros, trilhos tortos e o eco distante de algo pesado se movendo.',
    danger: 0.3, mons: ['goblin', 'esqueleto', 'golem'], loot: [['ferro', 5], ['carvao', 4], ['pedra', 3], ['prata', 1], ['martelo_ferreiro', 2]] },
  { n: 'Pântano Negro', i: '🐸', d: 'Lama até os joelhos e luzes pálidas dançando entre os juncos.',
    danger: 0.35, mons: ['aranha', 'troll'], loot: [['cogumelo', 4], ['erva', 3], ['osso', 2], ['essencia', 2], ['agua', 2], ['couro', 2]] },
  { n: 'Templo Esquecido', i: '🕍', d: 'Colunas partidas e inscrições que ainda pulsam com magia antiga.',
    danger: 0.3, mons: ['esqueleto', 'espectro', 'golem'], loot: [['runa', 3], ['cristal', 3], ['pano', 2], ['osso', 2], ['cajado_aprendiz', 2], ['erva', 1]] },
  { n: 'Forja Antiga', i: '🔥', d: 'As fornalhas ainda guardam brasas. Aqui se forja mais rápido.',
    danger: 0.25, mons: ['esqueleto', 'ogro'], forge: true, loot: [['carvao', 4], ['ferro', 4], ['martelo_ferreiro', 2], ['machadinha', 2], ['espada_curta', 2], ['couro', 2]] },
  { n: 'Bosque Sagrado', i: '🌳', d: 'Um refúgio de luz suave. Descansar aqui restaura mais.',
    danger: 0.1, mons: ['lobo'], sanctuary: true, loot: [['erva', 4], ['galho', 3], ['agua', 3], ['pena', 2], ['cristal', 1], ['maca', 3]] },
  { n: 'Cemitério dos Reis', i: '⚰️', d: 'Lápides sem nome e criptas abertas. Os mortos daqui dormem mal.',
    danger: 0.35, mons: ['esqueleto', 'espectro'], loot: [['osso', 5], ['essencia', 2], ['pano', 2], ['prata', 2], ['runa', 1]] },
  { n: 'Torre do Arcanista', i: '🗼', d: 'Livros flutuam, portas mudam de lugar. O dono se foi; os guardiões não.',
    danger: 0.3, mons: ['espectro', 'golem'], loot: [['cristal', 4], ['runa', 2], ['cajado_aprendiz', 2], ['pano', 2], ['essencia', 2], ['estelar', 1]] },
  { n: 'Fortaleza Caída', i: '🏰', d: 'Muralhas rachadas e um arsenal saqueado pela metade.',
    danger: 0.3, mons: ['esqueleto', 'ogro', 'troll'], loot: [['ferro', 3], ['espada_curta', 2], ['machadinha', 2], ['lanca_caca', 2], ['couro', 2], ['corda', 2], ['pedra', 2], ['runa', 1]] },
  { n: 'Covil da Fera', i: '🐉', d: 'Ossos calcinados cobrem o chão. O calor vem de dentro da caverna.',
    danger: 0.45, mons: ['troll', 'wyrm'], loot: [['osso', 4], ['couro', 3], ['carne', 3], ['escama', 1], ['estelar', 1]] },
];

/* Campeões */
const HEROES = [
  { n: 'Brakka Presa-Rubra', race: 'Orc · Guerreira', i: '👹', wt: 'machado', start: 'machadinha',
    hp: 130, atk: 12, def: 4, spd: 4, passive: 'furia',
    pn: 'Fúria de Sangue', pd: 'Com menos de metade da vida, causa 25% mais dano.',
    skill: { n: 'Golpe Brutal', d: 'Um golpe devastador (190% de dano).', cd: 3, type: 'dano', v: 1.9 },
    lore: 'Última de um clã que nunca se curvou. Veio buscar a chama para reacender as fogueiras do seu povo.' },
  { n: 'Lyrienne Folha-de-Prata', race: 'Elfa · Arqueira', i: '🧝‍♀️', wt: 'arco', start: 'arco_curto',
    hp: 95, atk: 11, def: 2, spd: 8, passive: 'precisao',
    pn: 'Olho de Falcão', pd: 'Sempre ataca primeiro e tem +15% de chance de crítico.',
    skill: { n: 'Chuva de Flechas', d: 'Dois disparos seguidos (95% de dano cada).', cd: 3, type: 'duplo', v: 0.95 },
    lore: 'Vigiou as fronteiras do bosque por três séculos. Agora o bosque está morrendo.' },
  { n: 'Dorn Barbapedra', race: 'Anão · Ferreiro', i: '🧔', wt: 'martelo', start: 'martelo_ferreiro',
    hp: 120, atk: 10, def: 6, spd: 3, passive: 'ferreiro',
    pn: 'Mestre da Bigorna', pd: 'Forja na metade do tempo e suas armaduras protegem 25% mais.',
    skill: { n: 'Golpe Sísmico', d: 'Golpe que atordoa o inimigo por um turno (120% de dano).', cd: 4, type: 'atordoar', v: 1.2 },
    lore: 'Dizem que a chama original foi acesa numa forja anã. Dorn quer ver com os próprios olhos.' },
  { n: 'Maelis Véu-de-Cinza', race: 'Humana · Maga', i: '🧙‍♀️', wt: 'cajado', start: 'cajado_aprendiz',
    hp: 90, atk: 13, def: 2, spd: 5, passive: 'arcano',
    pn: 'Mente Arcana', pd: 'Sua habilidade recarrega um turno mais rápido.',
    skill: { n: 'Lança Ígnea', d: 'Um dardo de fogo concentrado (220% de dano).', cd: 4, type: 'dano', v: 2.2 },
    lore: 'Expulsa da academia por estudar o que não devia. A chama é a resposta que lhe negaram.' },
  { n: 'Vesk Dedos-Leves', race: 'Goblin · Ladino', i: '🥷', wt: 'adaga', start: 'faca',
    hp: 90, atk: 10, def: 2, spd: 9, passive: 'saqueador',
    pn: 'Mão Leve', pd: 'Encontra itens extras ao explorar e foge com muito mais facilidade.',
    skill: { n: 'Golpe pelas Costas', d: 'Ataque (130% de dano) que faz o inimigo sangrar por 3 turnos.', cd: 3, type: 'sangrar', v: 1.3 },
    lore: 'Ninguém o convocou. Ele roubou o convite de outro campeão — e o lugar dele também.' },
  { n: 'Irmã Aldara', race: 'Humana · Clériga', i: '👩‍⚕️', wt: 'martelo', start: 'martelo_ferreiro',
    hp: 110, atk: 9, def: 5, spd: 4, passive: 'regen',
    pn: 'Bênção Serena', pd: 'Recupera vida continuamente com o passar do tempo.',
    skill: { n: 'Prece da Aurora', d: 'Recupera 35% da vida máxima.', cd: 4, type: 'cura', v: 0.35 },
    lore: 'Seu mosteiro guardou a chama por mil anos. Ela é a única que restou para guardá-la.' },
  { n: 'Ysolde Guarda-Aurora', race: 'Humana · Cavaleira', i: '🛡️', wt: 'espada', start: 'espada_curta',
    hp: 120, atk: 11, def: 6, spd: 4, passive: 'baluarte',
    pn: 'Baluarte', pd: 'Recebe 12% menos dano de todas as fontes de combate.',
    skill: { n: 'Muralha de Aço', d: 'Ataca (70% de dano) e reduz à metade o dano recebido por 3 turnos.', cd: 4, type: 'escudo', v: 0.5 },
    lore: 'Jurou proteger um rei que já não existe. Um juramento ainda pode ser cumprido.' },
  { n: 'Nym Raiz-Antiga', race: 'Meio-elfo · Druida', i: '🧝', wt: 'lanca', start: 'lanca_caca',
    hp: 105, atk: 10, def: 3, spd: 6, passive: 'herbalista',
    pn: 'Herbalista', pd: 'Comidas e poções restauram 40% a mais.',
    skill: { n: 'Espinhos Vivos', d: 'Raízes rasgam o inimigo (110% de dano) e o fazem sangrar por 3 turnos.', cd: 3, type: 'sangrar', v: 1.1 },
    lore: 'Ouve o que a ilha diz. E a ilha está com medo.' },
  { n: 'Rukh Olho-de-Âmbar', race: 'Troll · Caçador', i: '🧌', wt: 'lanca', start: 'lanca_caca',
    hp: 125, atk: 11, def: 3, spd: 5, passive: 'rastreador',
    pn: 'Rastreador', pd: 'Percebe campeões nas regiões vizinhas e ganha 50% mais experiência de criaturas.',
    skill: { n: 'Arremesso Selvagem', d: 'Um arremesso certeiro (180% de dano).', cd: 3, type: 'dano', v: 1.8 },
    lore: 'Já caçou de tudo. Faltava apenas a presa que caça de volta.' },
  { n: 'Zefira Sussurro-Oco', race: 'Meio-demônio · Necromante', i: '🧛‍♀️', wt: 'cajado', start: 'cajado_aprendiz',
    hp: 95, atk: 12, def: 2, spd: 5, passive: 'vampirismo',
    pn: 'Sede Sombria', pd: 'Recupera vida igual a 15% do dano que causa.',
    skill: { n: 'Toque Sepulcral', d: 'Drena o inimigo (150% de dano) e cura metade do dano causado.', cd: 3, type: 'drenar', v: 1.5 },
    lore: 'Os mortos lhe contaram onde a chama dorme. Não contaram o preço.' },
];
