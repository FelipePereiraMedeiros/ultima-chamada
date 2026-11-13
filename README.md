# 🔥 Última Chama — Ilha de Vharun

Jogo de sobrevivência **em tempo real**, em fantasia medieval, para jogar **sozinho ou com amigos**.
Dez campeões são levados a uma ilha cercada pela Névoa Cinzenta; só um sai com a chama.

É um projeto de fã, sem fins lucrativos, inspirado no gênero de sobrevivência com exploração e forja.
Mundo, personagens, itens, receitas e textos são **originais** — nenhum conteúdo de outros jogos é usado.

## Como jogar

Abra `index.html` em qualquer navegador moderno. Não há instalação nem build.

- **Sozinho:** funciona offline; os outros nove campeões são controlados pelo jogo.
- **Com amigos (até 8):** um jogador escolhe *Criar Sala* e passa o código de 5 letras; os outros escolhem
  *Entrar em Sala*. Os lugares vagos, até dez campeões, são ocupados pelo jogo.

### Sobre as salas

Não há servidor de jogo. A partida roda no navegador de quem criou a sala (o anfitrião) e os outros se ligam
a ele diretamente por WebRTC. Isso tem consequências:

- O anfitrião precisa manter o jogo aberto e em primeiro plano; se ele sair, a partida acaba para todos.
- Para os jogadores se encontrarem é usado o serviço público gratuito do [PeerJS](https://peerjs.com),
  então criar ou entrar em sala exige internet. Depois de conectados, os dados do jogo vão direto de um
  aparelho ao outro.
- Algumas redes (corporativas, certos 4G) bloqueiam conexões diretas; nesse caso a entrada na sala falha.
- Para jogar em sala, publique a pasta num endereço `https://` (por exemplo, GitHub Pages) e abra por ele
  em todos os aparelhos.
- Quem preferir pode usar um servidor PeerJS próprio abrindo o jogo com `?peer=host:porta`.

## Regras

- **Explorar** regiões para achar materiais, armas e comida — pode atrair criaturas ou outros campeões.
- **Forjar** equipamento melhor: sete tipos de arma, cinco degraus cada, do comum ao lendário.
- **Lutar em tempo real:** atacar quando a recarga termina, usar a habilidade do campeão, **defender** no
  momento certo para aparar o golpe, usar itens ou fugir.
- **Fugir da névoa:** a cada 90 segundos o sino condena novas regiões, até restar um único refúgio.
  Uma partida dura cerca de 10 a 15 minutos.

## Controles

Feito primeiro para celular: status no topo, registro no meio e as ações fixas embaixo, ao alcance do polegar.
A linha 🎯 mostra o que falta para a próxima arma e ⭐ marca no mapa onde encontrar.

No computador há atalhos: `E` explorar, `R` descansar, `F` forjar, `I` mochila, `M` mapa, setas ou `WASD` para viajar.
Em combate: `1` ou `Espaço` atacar, `2` habilidade, `3` defender, `4` fugir, `5`–`9` itens.

## Estrutura

```
index.html      página única
css/style.css   aparência
js/data.js      campeões, regiões, itens, receitas e criaturas
js/sim.js       simulação em tempo real (roda no anfitrião): névoa, combate, forja, adversários
js/net.js       salas por código (WebRTC via PeerJS)
js/ui.js        telas e interação
js/vendor/      PeerJS 1.5.4 (licença MIT, incluída)
```

Para desenvolvimento, `?net=local` troca a rede por abas do mesmo navegador.
