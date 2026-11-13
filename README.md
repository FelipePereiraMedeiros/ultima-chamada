# 🔥 Última Chama — Ilha de Vharun

Jogo de sobrevivência por turnos, **offline e para um jogador**, em fantasia medieval.
Dez campeões são levados a uma ilha cercada pela Névoa Cinzenta; só um sai com a chama.

É um projeto de fã, sem fins lucrativos, inspirado no gênero de sobrevivência com exploração e forja.
Mundo, personagens, itens, receitas e textos são **originais** — nenhum conteúdo de outros jogos é usado.

## Como jogar

Abra `index.html` em qualquer navegador moderno. Não há instalação, servidor nem conexão.

- **Explorar** regiões para achar materiais, armas e comida.
- **Forjar** equipamento melhor: sete tipos de arma, cinco degraus cada, do comum ao lendário.
- **Lutar** por turnos contra criaturas e contra os outros nove campeões, controlados pelo jogo.
- **Fugir da névoa**: a cada 3 horas o sino condena novas regiões, até restar um único refúgio.

## O que há no jogo

- 10 campeões jogáveis, cada um com passiva e habilidade próprias
- 16 regiões com itens, criaturas e perigos diferentes
- 9 tipos de criatura, de lobos a um wyrm
- 47 receitas de forja, maestria por tipo de arma, níveis e experiência
- Adversários que exploram, evoluem, fogem da névoa e lutam entre si

## Estrutura

```
index.html      página única
css/style.css   aparência
js/data.js      campeões, regiões, itens, receitas e criaturas
js/game.js      regras: tempo, névoa, combate, forja, adversários
js/ui.js        telas e interação
```

Sem dependências e sem etapa de build: JavaScript puro.
