/* Última Chama — conexão entre jogadores.
   O navegador do anfitrião comanda a partida; os outros se ligam a ele por WebRTC (PeerJS).
   Parâmetros de URL para desenvolvimento:
     ?net=local        usa BroadcastChannel (abas do mesmo navegador), sem rede
     ?peer=host:porta  usa um servidor PeerJS próprio em vez do público */

const Net = (() => {
  const PREFIX = 'ultima-chama-';
  const q = new URLSearchParams(location.search);
  const local = q.get('net') === 'local';
  const broker = q.get('peer');
  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const newCode = () => Array.from({ length: 5 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');

  let peer = null, chan = null, hostConn = null, myId = null;
  const conns = new Map();

  function loadPeer() {
    return new Promise((res, rej) => {
      if (window.Peer) return res();
      const s = document.createElement('script');
      s.src = 'js/vendor/peerjs.min.js';
      s.onload = () => res();
      s.onerror = () => rej(new Error('lib'));
      document.head.appendChild(s);
    });
  }
  function opts() {
    if (!broker) return {};
    const [host, port] = broker.split(':');
    return { host, port: Number(port) || 9000, path: '/', secure: false };
  }
  const explain = (e) => (e && e.type === 'peer-unavailable' ? 'Sala não encontrada. Confira o código.'
    : e && e.type === 'browser-incompatible' ? 'Este navegador não suporta conexão direta (WebRTC).'
    : 'Não foi possível alcançar o serviço de conexão. Verifique a internet e tente de novo.');

  /* h: { onOpen(code), onMsg(pid, msg), onLeave(pid), onError(text) } */
  function host(h) {
    close();
    if (local) {
      const code = newCode();
      chan = new BroadcastChannel(PREFIX + code);
      chan.onmessage = ({ data: m }) => {
        if (m.to !== 'host') return;
        if (m.k === 'bye') h.onLeave(m.from); else h.onMsg(m.from, m.d);
      };
      setTimeout(() => h.onOpen(code), 0);
      return;
    }
    loadPeer().then(() => {
      const attempt = (left) => {
        const code = newCode();
        const p = new Peer(PREFIX + code, opts());
        peer = p;
        p.on('open', () => h.onOpen(code));
        p.on('connection', (c) => {
          c.on('open', () => conns.set(c.peer, c));
          c.on('data', (d) => h.onMsg(c.peer, d));
          const gone = () => { if (conns.delete(c.peer)) h.onLeave(c.peer); };
          c.on('close', gone); c.on('error', gone);
        });
        p.on('error', (e) => {
          if (e.type === 'unavailable-id' && left > 0) { p.destroy(); attempt(left - 1); }
          else if (e.type !== 'peer-unavailable') h.onError(explain(e));
        });
      };
      attempt(3);
    }).catch(() => h.onError('Não foi possível carregar o módulo de conexão.'));
  }

  /* h: { onOpen(), onMsg(msg), onClose(), onError(text) } */
  function join(code, h) {
    close();
    code = String(code || '').trim().toUpperCase();
    if (local) {
      myId = 'c' + Math.random().toString(36).slice(2, 8);
      chan = new BroadcastChannel(PREFIX + code);
      chan.onmessage = ({ data: m }) => {
        if (m.to === myId) h.onMsg(m.d);
        else if (m.to === 'all' && m.k === 'closed') h.onClose();
      };
      setTimeout(() => h.onOpen(), 0);
      return;
    }
    loadPeer().then(() => {
      const p = new Peer(opts());
      peer = p;
      let opened = false;
      const timer = setTimeout(() => { if (!opened) h.onError('A sala não respondeu. Confira o código e tente de novo.'); }, 15000);
      p.on('open', () => {
        const c = p.connect(PREFIX + code, { reliable: true });
        hostConn = c;
        c.on('open', () => { opened = true; clearTimeout(timer); h.onOpen(); });
        c.on('data', (d) => h.onMsg(d));
        c.on('close', () => h.onClose());
        c.on('error', () => h.onClose());
      });
      p.on('error', (e) => { clearTimeout(timer); h.onError(explain(e)); });
    }).catch(() => h.onError('Não foi possível carregar o módulo de conexão.'));
  }

  function send(pid, msg) {
    if (chan) chan.postMessage({ to: pid, d: msg });
    else { const c = conns.get(pid); if (c && c.open) c.send(msg); }
  }
  function toHost(msg) {
    if (chan) chan.postMessage({ to: 'host', from: myId, d: msg });
    else if (hostConn && hostConn.open) hostConn.send(msg);
  }
  function close() {
    if (chan) {
      chan.postMessage(myId ? { to: 'host', from: myId, k: 'bye' } : { to: 'all', k: 'closed' });
      chan.close();
    }
    if (peer) { try { peer.destroy(); } catch { /* já encerrado */ } }
    peer = null; chan = null; hostConn = null; myId = null;
    conns.clear();
  }

  return { host, join, send, toHost, close };
})();
