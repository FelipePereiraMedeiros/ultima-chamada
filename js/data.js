/* Última Chama — dados do jogo.
   Os amaldiçoados são releituras de figuras clássicas do terror e do mito (domínio público e folclore);
   textos, itens, receitas e regiões foram escritos para este jogo. */

const RARITY = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
const WTYPES = {
  espada: 'Lâmina', machado: 'Foice', martelo: 'Maça', adaga: 'Punhal',
  arco: 'Besta', cajado: 'Cetro', lanca: 'Lança',
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
mat('galho', 'Estaca de Freixo', '🪵');
mat('pedra', 'Lasca de Lápide', '🪨');
mat('ferro', 'Ferro Frio', '⛓️');
mat('couro', 'Couro Curtido', '🟫');
mat('pano', 'Linho de Mortalha', '🧵');
mat('corda', 'Corda de Forca', '🪢');
mat('osso', 'Osso Antigo', '🦴');
mat('carvao', 'Brasa de Fornalha', '⚫');
mat('carne', 'Carne de Caça', '🥩');
mat('agua', 'Água Benta', '💧');
mat('cogumelo', 'Cogumelo de Cripta', '🍄');
mat('erva', 'Acônito', '🌿');
mat('pena', 'Pena de Corvo', '🪶', 1);
mat('prata', 'Prata Pura', '🥈', 1);
mat('cristal', 'Cristal de Lua', '🔮', 1);
mat('runa', 'Escaravelho de Ônix', '🪲', 2);
mat('essencia', 'Ectoplasma', '🫧', 2);
mat('escama', 'Escama da Serpe', '🐲', 3);
mat('estelar', 'Centelha da Chama', '✨', 3);

/* Armas: cinco degraus por tipo */
wep('espada_curta', 'Sabre Enferrujado', '🗡️', 'espada', 8, 0);
wep('espada_longa', 'Sabre de Cavalaria', '🗡️', 'espada', 16, 1);
wep('lamina_prata', 'Lâmina de Prata', '🗡️', 'espada', 28, 2);
wep('lamina_runica', 'Lâmina do Voivoda', '🗡️', 'espada', 44, 3);
wep('alvorada', 'Aurora Rubra, a Lâmina do Juramento', '🗡️', 'espada', 64, 4);

wep('machadinha', 'Foice de Coveiro', '🪓', 'machado', 9, 0);
wep('machado_guerra', 'Gadanha de Ferro', '🪓', 'machado', 17, 1);
wep('machado_ossos', 'Gadanha Quebra-Ossos', '🪓', 'machado', 29, 2);
wep('machado_runico', 'Gadanha Espectral', '🪓', 'machado', 45, 3);
wep('ruina_wyrm', 'Ceifadora de Promessas', '🪓', 'machado', 66, 4);

wep('martelo_ferreiro', 'Marreta de Pedreiro', '🔨', 'martelo', 8, 0);
wep('malho_pedra', 'Malho de Lápide', '🔨', 'martelo', 16, 1);
wep('martelo_guerra', 'Maça de Guerra', '🔨', 'martelo', 28, 2);
wep('martelo_trovao', 'Maça Trovejante', '🔨', 'martelo', 44, 3);
wep('bigorna_ceu', 'Primeiro Relâmpago', '🔨', 'martelo', 65, 4);

wep('faca', 'Estilete Enferrujado', '🔪', 'adaga', 7, 0);
wep('adaga_afiada', 'Punhal Afiado', '🔪', 'adaga', 15, 1);
wep('estilete_prata', 'Estilete de Prata', '🔪', 'adaga', 27, 2);
wep('adaga_sombria', 'Punhal Sombrio', '🔪', 'adaga', 43, 3);
wep('presa_noite', 'Presa da Meia-Noite', '🔪', 'adaga', 63, 4);

wep('arco_curto', 'Besta de Mão', '🏹', 'arco', 8, 0);
wep('arco_longo', 'Besta de Caça', '🏹', 'arco', 16, 1);
wep('arco_composto', 'Besta de Repetição', '🏹', 'arco', 28, 2);
wep('arco_arcano', 'Besta Abençoada', '🏹', 'arco', 44, 3);
wep('cantor_vento', 'Juízo de Prata', '🏹', 'arco', 64, 4);

wep('cajado_aprendiz', 'Cetro Rachado', '🪄', 'cajado', 8, 0);
wep('cajado_cristal', 'Cetro de Cristal', '🪄', 'cajado', 16, 1);
wep('cajado_sabio', 'Cetro do Vidente', '🪄', 'cajado', 28, 2);
wep('cajado_runico', 'Cetro dos Faraós', '🪄', 'cajado', 44, 3);
wep('cetro_eclipse', 'Cetro do Eclipse', '🪄', 'cajado', 64, 4);

wep('lanca_caca', 'Arpão de Pescador', '🔱', 'lanca', 8, 0);
wep('pique', 'Lança de Ferro Frio', '🔱', 'lanca', 16, 1);
wep('lanca_ossea', 'Lança de Osso', '🔱', 'lanca', 28, 2);
wep('lanca_radiante', 'Tridente Lunar', '🔱', 'lanca', 44, 3);
wep('ferrao_wyrm', 'Tridente do Abismo', '🔱', 'lanca', 65, 4);

/* Proteções: cada parte do corpo tem um caminho pesado (aguenta mais) e um ágil (bate melhor).
   Efeitos além de defesa/vida/velocidade:
     crit    chance de crítico          haste   ataca mais rápido
     block   Defender apara mais        stun    atordoamentos duram menos
     thorns  devolve parte do dano      regen   recupera vida com o tempo
     mist    resiste à névoa            stride  viajar não gasta vigor */
arm('capuz', 'Capuz de Mortalha', '🧢', 'cabeca', 0, { def: 2 });
arm('elmo_ferro', 'Elmo de Ferro Frio', '🪖', 'cabeca', 1, { def: 5 });
arm('elmo_runico', 'Máscara Selada', '🎭', 'cabeca', 3, { def: 10, hp: 10, stun: 0.6 });
arm('chapeu_cacador', 'Chapéu do Caçador', '🎩', 'cabeca', 2, { def: 3, crit: 0.08 });
arm('coroa_corvos', 'Coroa de Corvos', '👑', 'cabeca', 3, { def: 6, crit: 0.14 });

arm('gibao', 'Casaco de Viajante', '🧥', 'corpo', 0, { def: 4 });
arm('cota_malha', 'Cota de Malha', '🦺', 'corpo', 2, { def: 10, hp: 10 });
arm('couraca_escamas', 'Couraça de Escamas', '🛡️', 'corpo', 4, { def: 17, hp: 30, thorns: 0.15 });
arm('capa_crepusculo', 'Capa do Crepúsculo', '🧣', 'corpo', 2, { def: 6, spd: 2 });
arm('manto_meia_noite', 'Manto da Meia-Noite', '🦇', 'corpo', 3, { def: 9, spd: 3, mist: 0.6 });

arm('luvas', 'Luvas de Coveiro', '🧤', 'maos', 0, { def: 2 });
arm('manoplas', 'Manoplas de Ferro Frio', '🧤', 'maos', 1, { def: 5 });
arm('manoplas_prata', 'Manoplas do Guardião', '🤲', 'maos', 3, { def: 8, block: 0.2 });
arm('luvas_duelista', 'Luvas de Duelista', '🤌', 'maos', 2, { def: 3, haste: 0.12 });

arm('botas', 'Botas de Couro', '🥾', 'pes', 0, { def: 2, spd: 1 });
arm('botas_andarilho', 'Botas do Andarilho Noturno', '🥾', 'pes', 2, { def: 3, spd: 3 });
arm('botas_leguas', 'Botas de Sete Léguas', '👢', 'pes', 3, { def: 4, spd: 5, stride: true });
arm('grevas', 'Grevas de Ferro Frio', '🦿', 'pes', 1, { def: 6 });
arm('grevas_runicas', 'Grevas do Sentinela', '🦿', 'pes', 3, { def: 10, hp: 15, stun: 0.3 });

arm('amuleto_osso', 'Amuleto de Osso', '📿', 'amuleto', 0, { hp: 15 });
arm('colar_alho', 'Colar de Alho', '🧄', 'amuleto', 1, { hp: 20, thorns: 0.08 });
arm('espelho_bronze', 'Espelho de Bronze', '🪞', 'amuleto', 3, { hp: 30, thorns: 0.22 });
arm('amuleto_lunar', 'Medalhão Lunar', '📿', 'amuleto', 2, { hp: 35, def: 1, regen: 2 });
arm('amuleto_chama', 'Relicário da Brasa Eterna', '📿', 'amuleto', 4, { hp: 60, def: 3, regen: 4, mist: 0.5 });

/* Consumíveis */
con('pao', 'Pão de Centeio', '🍞', 0, 20, 0);
con('maca', 'Maçã do Pomar Morto', '🍎', 0, 12, 5);
con('cantil', 'Cantil de Água Benta', '🧴', 0, 0, 20);
con('carne_assada', 'Carne Assada', '🍖', 0, 45, 5);
con('ensopado', 'Ensopado do Coveiro', '🍲', 1, 75, 25);
con('cha_lunar', 'Chá de Acônito', '🍵', 1, 10, 45);
con('pocao_cura', 'Tônico Vital', '🧪', 2, 110, 0);
con('elixir', 'Elixir da Meia-Noite', '⚗️', 3, 160, 60);

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
  ['chapeu_cacador', 'capuz', 'pena', 'couro'],
  ['coroa_corvos', 'chapeu_cacador', 'essencia'],
  ['gibao', 'couro', 'pano'],
  ['cota_malha', 'gibao', 'ferro', 'carvao'],
  ['couraca_escamas', 'cota_malha', 'escama'],
  ['capa_crepusculo', 'gibao', 'pena', 'pano'],
  ['manto_meia_noite', 'capa_crepusculo', 'essencia'],
  ['luvas', 'couro', 'corda'],
  ['manoplas', 'luvas', 'ferro'],
  ['manoplas_prata', 'manoplas', 'prata', 'runa'],
  ['luvas_duelista', 'luvas', 'pena', 'prata'],
  ['botas', 'couro', 'galho'],
  ['botas_andarilho', 'botas', 'pena'],
  ['botas_leguas', 'botas_andarilho', 'cristal', 'essencia'],
  ['grevas', 'botas', 'ferro'],
  ['grevas_runicas', 'grevas', 'runa'],
  ['amuleto_osso', 'osso', 'corda'],
  ['colar_alho', 'amuleto_osso', 'erva', 'cogumelo'],
  ['espelho_bronze', 'colar_alho', 'prata', 'cristal'],
  ['amuleto_lunar', 'amuleto_osso', 'prata', 'cristal'],
  ['amuleto_chama', 'amuleto_lunar', 'estelar', 'essencia'],
  ['carne_assada', 'carne', 'carvao'],
  ['ensopado', 'carne', 'cogumelo', 'agua'],
  ['cantil', 'agua', 'couro'],
  ['cha_lunar', 'erva', 'agua'],
  ['pocao_cura', 'erva', 'cristal', 'agua'],
  ['elixir', 'pocao_cura', 'essencia', 'cogumelo'],
].map(([out, ...ins]) => ({ out, ins }));

/* Criaturas da noite */
const MONS = {
  lobo: { n: 'Mastim Infernal', i: '🐕', hp: 40, atk: 12, def: 1, spd: 6, xp: 22, drops: [['carne', 3], ['couro', 3]] },
  goblin: { n: 'Ladrão de Túmulos', i: '🦹', hp: 36, atk: 11, def: 2, spd: 7, xp: 22, drops: [['pano', 3], ['corda', 3], ['faca', 1], ['pao', 2], ['luvas', 1], ['botas', 1]] },
  aranha: { n: 'Aranha de Cripta', i: '🕷️', hp: 46, atk: 13, def: 2, spd: 6, xp: 26, drops: [['corda', 4], ['cogumelo', 2], ['essencia', 1]] },
  esqueleto: { n: 'Esqueleto Inquieto', i: '💀', hp: 62, atk: 17, def: 5, spd: 4, xp: 42, drops: [['osso', 5], ['ferro', 2], ['espada_curta', 1], ['elmo_ferro', 1]] },
  ogro: { n: 'Gárgula de Pedra', i: '😈', hp: 115, atk: 23, def: 5, spd: 2, xp: 65, drops: [['carne', 3], ['couro', 3], ['pedra', 2], ['prata', 1]] },
  espectro: { n: 'Alma Penada', i: '👻', hp: 72, atk: 21, def: 3, spd: 7, xp: 62, drops: [['essencia', 4], ['pano', 2], ['cristal', 2]] },
  troll: { n: 'Abominação do Lodo', i: '🧌', hp: 165, atk: 29, def: 8, spd: 3, xp: 105, drops: [['couro', 2], ['osso', 2], ['essencia', 3], ['runa', 1]] },
  golem: { n: 'Sentinela do Sarcófago', i: '🗿', hp: 185, atk: 31, def: 14, spd: 2, xp: 125, drops: [['runa', 5], ['ferro', 2], ['estelar', 1]] },
  wyrm: { n: 'Serpe do Abismo', i: '🐉', hp: 270, atk: 40, def: 12, spd: 5, xp: 230, drops: [['escama', 6], ['estelar', 2]] },
};

/* O campo de batalha: grade 4x4, vizinhas na horizontal e na vertical.
   Cada amaldiçoado reconhece na ilha um pedaço do lugar onde sua história deu errado. */
const AREAS = [
  { n: 'Recife da Sereia', i: '⚓', d: 'Navios partidos contra a rocha onde alguém cantava. O cordame ainda balança sem vento.',
    danger: 0.15, mons: ['goblin'], loot: [['corda', 4], ['pano', 3], ['galho', 3], ['agua', 2], ['lanca_caca', 2], ['cantil', 2], ['carne', 1]] },
  { n: 'Vila dos Archotes', i: '🏚️', d: 'Os aldeões saíram com tochas atrás de um monstro e nunca voltaram para trancar as portas.',
    danger: 0.15, mons: ['goblin', 'lobo'], loot: [['pano', 4], ['pao', 3], ['faca', 2], ['corda', 2], ['couro', 2], ['maca', 2], ['machadinha', 2], ['capuz', 1], ['luvas', 1]] },
  { n: 'Charneca do Uivo', i: '🌾', d: 'Capim alto e névoa baixa. Quem atravessa à noite jura ouvir alguém pedindo perdão.',
    danger: 0.15, mons: ['lobo'], loot: [['pao', 3], ['maca', 3], ['galho', 3], ['erva', 2], ['carne', 2], ['pena', 1], ['couro', 1]] },
  { n: 'Castelo do Conde', i: '🏰', d: 'Salões gelados, um único lugar posto à mesa e corvos em cada ameia.',
    danger: 0.3, mons: ['ogro', 'lobo'], loot: [['pena', 4], ['cristal', 3], ['pedra', 3], ['agua', 2], ['prata', 2]] },
  { n: 'Feira dos Horrores', i: '🎪', d: 'Tendas rasgadas e jaulas abertas. O cartaz ainda anuncia "os monstros mais terríveis do mundo".',
    danger: 0.2, mons: ['goblin', 'esqueleto'], loot: [['pano', 3], ['espada_curta', 2], ['arco_curto', 2], ['pao', 2], ['couro', 3], ['corda', 2], ['prata', 2], ['gibao', 1], ['botas', 1]] },
  { n: 'Bosque da Lua Cheia', i: '🌲', d: 'Troncos marcados por garras, da altura de um homem. A lua aqui nunca míngua.',
    danger: 0.25, mons: ['lobo', 'aranha'], loot: [['galho', 4], ['erva', 3], ['cogumelo', 3], ['pena', 2], ['carne', 2], ['arco_curto', 2], ['lanca_caca', 1]] },
  { n: 'Lago de Avalon', i: '🏞️', d: 'Águas imóveis onde uma feiticeira aprendeu tudo — menos a se contentar.',
    danger: 0.2, mons: ['aranha', 'espectro'], loot: [['agua', 5], ['prata', 3], ['erva', 2], ['cristal', 2], ['pedra', 2]] },
  { n: 'Pedreira dos Condenados', i: '⛏️', d: 'Correntes presas à rocha e ferramentas largadas no meio do golpe.',
    danger: 0.3, mons: ['goblin', 'esqueleto', 'golem'], loot: [['ferro', 5], ['carvao', 4], ['pedra', 3], ['prata', 1], ['martelo_ferreiro', 2]] },
  { n: 'Pântano das Almas', i: '🐸', d: 'Luzes pálidas dançam sobre o lodo. São bonitas até a gente entender o que são.',
    danger: 0.35, mons: ['aranha', 'troll'], loot: [['cogumelo', 4], ['erva', 3], ['osso', 2], ['essencia', 2], ['agua', 2], ['couro', 2]] },
  { n: 'Templo de Atena', i: '🏛️', d: 'Colunas partidas e um jardim de estátuas com expressão de espanto.',
    danger: 0.3, mons: ['esqueleto', 'espectro', 'golem'], loot: [['runa', 3], ['cristal', 3], ['pano', 2], ['osso', 2], ['cajado_aprendiz', 2], ['erva', 1]] },
  { n: 'Laboratório do Criador', i: '⚡', d: 'Bobinas, fornalhas e uma mesa com correias. Aqui se forja mais rápido — tudo já foi feito às pressas.',
    danger: 0.25, mons: ['esqueleto', 'ogro'], forge: true, loot: [['carvao', 4], ['ferro', 4], ['martelo_ferreiro', 2], ['machadinha', 2], ['espada_curta', 2], ['couro', 2]] },
  { n: 'Capela do Altar Vazio', i: '⛪', d: 'Flores secas, bancos enfeitados e ninguém à espera. Descansar aqui restaura mais.',
    danger: 0.1, mons: ['lobo'], sanctuary: true, loot: [['erva', 4], ['galho', 3], ['agua', 3], ['pena', 2], ['cristal', 1], ['maca', 3]] },
  { n: 'Cemitério da Vigília', i: '⚰️', d: 'Lápides tortas, covas abertas por dentro. Os mortos daqui dormem mal.',
    danger: 0.35, mons: ['esqueleto', 'espectro'], loot: [['osso', 5], ['essencia', 2], ['pano', 2], ['prata', 2], ['runa', 1], ['amuleto_osso', 2]] },
  { n: 'Ópera Assombrada', i: '🎼', d: 'O lustre caído no meio da plateia, cortinas em farrapos e um órgão que toca sozinho.',
    danger: 0.3, mons: ['espectro', 'golem'], loot: [['cristal', 4], ['runa', 2], ['cajado_aprendiz', 2], ['pano', 2], ['essencia', 2], ['estelar', 1]] },
  { n: 'Tumba do Faraó', i: '🏜️', d: 'Corredores de areia e ouro, armas de um exército enterrado junto com o rei.',
    danger: 0.3, mons: ['esqueleto', 'ogro', 'troll'], loot: [['ferro', 3], ['espada_curta', 2], ['machadinha', 2], ['lanca_caca', 2], ['couro', 2], ['corda', 2], ['pedra', 2], ['runa', 1], ['elmo_ferro', 1], ['amuleto_osso', 1]] },
  { n: 'Abismo da Serpe', i: '🐉', d: 'Ossos calcinados cobrem o chão. Dizem que a fera guarda uma centelha da própria Chama.',
    danger: 0.45, mons: ['troll', 'wyrm'], loot: [['osso', 4], ['couro', 3], ['carne', 3], ['escama', 1], ['estelar', 1]] },
];

/* Os amaldiçoados. `wish` é o desejo concedido pela Última Chama, revelado apenas na vitória. */
const HEROES = [
  { n: 'A Criatura de Frankenstein', s: 'Criatura', de: 'da Criatura', race: 'Feito de retalhos · sem nome', i: '🧟', wt: 'martelo', start: 'martelo_ferreiro',
    hp: 130, atk: 12, def: 5, spd: 3, passive: 'baluarte',
    pn: 'Carne Costurada', pd: 'Recebe 12% menos dano em combate.',
    skill: { n: 'Punho Galvânico', d: 'Um soco carregado de relâmpago (190% de dano).', cd: 3, type: 'dano', v: 1.9 },
    lore: 'Foi montado, despertado e abandonado na mesma noite. Aprendeu a falar ouvindo famílias pela fresta de uma parede — e aprendeu a odiar quando elas o viram.',
    wish: 'A Chama não lhe deu outro rosto: deu outros olhos a quem o vê. Numa aldeia de montanha alguém abre a porta, não grita, e puxa mais uma cadeira para a mesa. Ele finalmente recebe um nome, e envelhece em paz respondendo a ele.' },
  { n: 'Ankhesar, a Múmia', s: 'Múmia', de: 'da Múmia', race: 'Rainha embalsamada · insone', i: '⚱️', wt: 'cajado', start: 'cajado_aprendiz',
    hp: 110, atk: 9, def: 5, spd: 4, passive: 'regen',
    pn: 'Sono Milenar', pd: 'Recupera vida continuamente com o passar do tempo.',
    skill: { n: 'Bênção das Areias', d: 'Recupera 35% da vida máxima.', cd: 4, type: 'cura', v: 0.35 },
    lore: 'Prometeram-lhe a eternidade no descanso. Então vieram os saqueadores, depois os estudiosos, e cada selo partido a arrancou de volta para um mundo que já não é o seu.',
    wish: 'A areia volta a cobrir a entrada. Os selos se refazem, um a um, e nenhum mapa jamais tornará a apontar para ali. Ankhesar deita, cruza as mãos sobre o peito e, pela primeira vez em três mil anos, dorme.' },
  { n: 'Conde Drácula', s: 'Drácula', de: 'de Drácula', race: 'Vampiro · senhor de um castelo vazio', i: '🧛', wt: 'espada', start: 'espada_curta',
    hp: 100, atk: 12, def: 3, spd: 6, passive: 'vampirismo',
    pn: 'Sede Imortal', pd: 'Recupera vida igual a 15% do dano que causa.',
    skill: { n: 'Beijo Rubro', d: 'Drena o inimigo (150% de dano) e cura metade do dano causado.', cd: 3, type: 'drenar', v: 1.5 },
    lore: 'Venceu a morte para não perdê-la — e a perdeu assim mesmo. Desde então atravessa os séculos com a mesa posta para dois.',
    wish: 'Ela desperta como se tivesse apenas cochilado, e a eternidade deixa de ser castigo para ser tempo. Anos depois, pelos corredores onde só havia eco, corre o som mais improvável daquele castelo: risada de criança.' },
  { n: 'Bastien, o Lobisomem', s: 'Lobisomem', de: 'do Lobisomem', race: 'Homem amaldiçoado · refém da lua', i: '🐺', wt: 'adaga', start: 'faca',
    hp: 120, atk: 12, def: 3, spd: 6, passive: 'furia',
    pn: 'Fúria da Lua Cheia', pd: 'Com menos de metade da vida, causa 25% mais dano.',
    skill: { n: 'Garras Dilacerantes', d: 'Ataque (130% de dano) que faz o inimigo sangrar.', cd: 3, type: 'sangrar', v: 1.3 },
    lore: 'Uma mordida numa estrada, e desde então acorda uma vez por mês sem saber de quem é o sangue. Trancou-se, acorrentou-se, exilou-se. A fera sempre achou a saída.',
    wish: 'A lua cheia nasce e nada acontece. A fera continua lá, mas agora atende quando ele chama e se deita quando ele manda. Se quiser, nunca mais precisará soltá-la — e é só por isso que, às vezes, ele solta.' },
  { n: 'Lorelei, a Sereia', s: 'Sereia', de: 'da Sereia', race: 'Voz do rochedo · temida, nunca ouvida', i: '🧜‍♀️', wt: 'lanca', start: 'lanca_caca',
    hp: 105, atk: 11, def: 3, spd: 6, passive: 'rastreador',
    pn: 'Ouvido das Marés', pd: 'Percebe amaldiçoados nas regiões vizinhas e ganha 50% mais experiência de criaturas.',
    skill: { n: 'Canto Dilacerante', d: 'Uma nota que fere como lâmina (180% de dano).', cd: 3, type: 'dano', v: 1.8 },
    lore: 'Só queria que alguém ficasse até o fim da canção. Mas todo navio que se aproximava para ouvir acabava nas pedras, e a culpa ficou sendo dela.',
    wish: 'Seu canto atravessa o mar sem afundar ninguém. Chega a portos, montanhas e cidades que ela nunca verá, e em todos alguém para o que está fazendo para escutar. Já não há quem a olhe e desvie os olhos: é o ser mais belo do mundo, e o mundo inteiro sabe a canção de cor.' },
  { n: 'Abraham Van Helsing', s: 'Van Helsing', de: 'de Van Helsing', race: 'Humano · caçador de monstros', i: '🤠', wt: 'arco', start: 'arco_curto',
    hp: 95, atk: 11, def: 2, spd: 8, passive: 'precisao',
    pn: 'Olho de Caçador', pd: 'Sempre ataca primeiro e tem +15% de chance de crítico.',
    skill: { n: 'Virotes de Prata', d: 'Dois disparos seguidos (95% de dano cada).', cd: 3, type: 'duplo', v: 0.95 },
    lore: 'O único aqui que não carrega maldição alguma — só a lista dos que não chegou a tempo de salvar. Para ele, os outros nove não são rivais: são o trabalho.',
    wish: 'Presas, garras, feitiços e assombrações se desfazem como névoa ao sol, em todo lugar, de uma vez. Nenhuma criança jamais voltará a temer o escuro. Van Helsing guarda a besta num baú, fecha a tampa e descobre que não sabe o que fazer com uma manhã livre.' },
  { n: 'Erik, o Fantasma da Ópera', s: 'Fantasma', de: 'do Fantasma', race: 'Gênio mascarado · morador dos porões', i: '🎭', wt: 'adaga', start: 'faca',
    hp: 90, atk: 10, def: 2, spd: 9, passive: 'saqueador',
    pn: 'Senhor dos Alçapões', pd: 'Encontra itens extras ao explorar e foge com muito mais facilidade.',
    skill: { n: 'Laço Traiçoeiro', d: 'Um golpe vindo da sombra (110% de dano) que deixa o inimigo sangrando.', cd: 3, type: 'sangrar', v: 1.1 },
    lore: 'Compôs as árias que a cidade inteira aplaudiu, escondido sob o palco onde outros as cantavam. Um rosto bastou para que ninguém quisesse saber da voz.',
    wish: 'Ele tira a máscara diante do espelho e não há nada a esconder. Na noite de estreia sobe ao palco pelo lado da frente, sob o lustre aceso, e a plateia que antes gritaria se levanta para aplaudir de pé.' },
  { n: 'Medusa', s: 'Medusa', de: 'de Medusa', race: 'Górgona · sacerdotisa amaldiçoada', i: '🐍', wt: 'lanca', start: 'lanca_caca',
    hp: 115, atk: 10, def: 6, spd: 3, passive: 'ferreiro',
    pn: 'Dádiva de Atena', pd: 'Forja na metade do tempo e suas armaduras protegem 25% mais.',
    skill: { n: 'Olhar de Pedra', d: 'Um golpe (120% de dano) que deixa o inimigo paralisado por alguns segundos.', cd: 4, type: 'atordoar', v: 1.2 },
    lore: 'Servia no templo e foi punida por uma culpa que não era sua. Desde então, todos os que vieram vê-la — por ódio, por glória ou por pena — viraram parte do jardim.',
    wish: 'As serpentes adormecem e voltam a ser cabelo. Ela ergue os olhos para o próprio reflexo no bronze e o reflexo não endurece. As portas do templo se abrem, e a sacerdotisa retoma seu lugar diante do altar como se nunca tivesse saído.' },
  { n: 'Morgana', s: 'Morgana', de: 'de Morgana', race: 'Feiticeira · a segunda melhor', i: '🧙‍♀️', wt: 'cajado', start: 'cajado_aprendiz',
    hp: 90, atk: 13, def: 2, spd: 5, passive: 'arcano',
    pn: 'Mente Arcana', pd: 'Sua habilidade recarrega bem mais rápido.',
    skill: { n: 'Fogo Feérico', d: 'Uma labareda de magia antiga (220% de dano).', cd: 4, type: 'dano', v: 2.2 },
    lore: 'Aprendeu cada feitiço que lhe quiseram ensinar e roubou os que lhe negaram. Ainda assim, em toda lenda, seu nome vem depois do de outro.',
    wish: 'Não há mais limite, mestre ou segredo. As estrelas mudam de lugar quando ela aponta, e em todas as realidades os livros de magia passam a começar pelo mesmo nome. Morgana sorri — e, pela primeira vez, não tem mais nada para querer.' },
  { n: 'Elara, a Noiva do Além', s: 'Noiva', de: 'da Noiva', race: 'Morta no dia do casamento · ainda de véu', i: '👰', wt: 'machado', start: 'machadinha',
    hp: 110, atk: 11, def: 4, spd: 5, passive: 'herbalista',
    pn: 'Buquê Eterno', pd: 'Comidas e poções restauram 40% a mais.',
    skill: { n: 'Véu do Além', d: 'Ataca (70% de dano) e reduz à metade o dano recebido por alguns segundos.', cd: 4, type: 'escudo', v: 0.5 },
    lore: 'Esperou no altar por alguém que já tinha escolhido outra — e escolhido também que ela não saísse viva daquela noite. Continua de vestido, porque ninguém lhe disse que a festa acabou.',
    wish: 'Os sinos tocam, e desta vez ele está lá: chegou cedo, com as mãos trêmulas e os olhos só para ela. Não há estrada escura, nem traição, nem cova rasa. Há um sim dito em voz alta e uma vida inteira para depois dele.' },
];
