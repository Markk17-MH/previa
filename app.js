/*!
 * Previa · https://markk17-mh.github.io/previa/
 * © 2026 Markk17-MH. Todos los derechos reservados.
 * Prohibida la copia, redistribución o publicación de este código sin permiso del autor.
 */
'use strict';

// ---------- storage ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('previa:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('previa:' + k, JSON.stringify(v)); } catch {} }
};
// Identifies this tab in a room so a reload rejoins the same seat. Per tab, not per browser.
const CID = (() => {
  try {
    let id = sessionStorage.getItem('previa:cid');
    if (!id) { id = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('previa:cid', id); }
    return id;
  } catch { return Math.random().toString(36).slice(2, 12); }
})();

// ---------- sound & haptics ----------
const sound = {
  ctx: null,
  on: store.get('sound', true),
  init() {
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) this.ctx = new C(); }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} },
  tone(type, f1, f2, dur, vol, delay = 0) {
    if (!this.on) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f1, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  },
  click() { this.tone('sine', 700, 320, 0.05, 0.1); this.buzz(10); },
  flip() { this.tone('triangle', 420, 900, 0.08, 0.12); this.buzz(15); },
  tick(p = 750) { this.tone('square', p, 0, 0.04, 0.07); this.buzz(20); },
  boom() { this.tone('sawtooth', 160, 30, 0.7, 0.3); this.buzz(400); },
  win() { [523, 659, 784].forEach((f, i) => this.tone('sine', f, 0, 0.2, 0.12, i * 0.08)); this.buzz(40); }
};

// ---------- content ----------
const WHAT = [
  'Hacer cinco flexiones mirando fijamente a {x}',
  'Darle un beso en la mejilla a {x} y decirle «gracias por existir»',
  'Sentarte en el regazo de {x} diez segundos como si no hubiera sitio',
  'Robarle un sorbo del vaso a {x} sin pedir permiso',
  'Decir «eso es lo que me dijeron anoche» con cara de pillo',
  'Quitarte algo (chaqueta, pulsera, gorra) y ponérselo a {x}',
  'Cantarle al oído a {x} el estribillo de una canción romántica',
  'Chocar los cinco con {x} y dejar los dedos entrelazados',
  'Proponer un brindis por los ojos de {x}',
  'Mirar a {x} con cara de sospecha durante cinco segundos',
  'Pedirle a {x} que te haga un masaje en el hombro porque «te has dado un tirón»',
  'Soltarle un piropo a {x} sin reírte',
  'Imitar la risa de {x} justo después de que se ría',
  'Preguntarle a {x} con mucha seriedad cuál es su signo del zodiaco',
  'Contar una anécdota inventada en la que sale {x}',
  'Hacerte una foto con {x} poniendo la misma cara que {x}'
];
const WHEN = [
  'cuando {x} beba de su vaso',
  'cuando {x} mire el móvil',
  'cuando {x} se ría a carcajadas',
  'cuando alguien diga «fiesta», «salir» o «discoteca»',
  'cuando {x} se toque el pelo o la cara',
  'cuando alguien mencione a un ex',
  'cuando haya un silencio de más de tres segundos',
  'cuando {x} cambie de postura en el asiento',
  'cuando alguien proponga pedir comida o un brindis',
  'cuando alguien diga la hora',
  'cuando {x} se levante'
];
const TOPICS = [
  '¿Cuál es la mentira más absurda que has dicho para ligar?',
  '¿Qué es lo más vergonzoso que alguien ha visto en tu móvil?',
  '¿Cuál ha sido tu peor cita?',
  '¿Qué hiciste de fiesta que todavía te da vergüenza recordar?',
  '¿Cuál es tu red flag que escondes en las primeras citas?',
  '¿Cuál ha sido la noche más surrealista de tu vida?',
  'Si mañana te tocara la lotería, ¿a quién de aquí se lo dirías primero?',
  '¿Qué canción te pone triste aunque no lo admitas?',
  '¿A quién de tus ex volverías a escribir esta noche?',
  '¿Qué es lo más caro que has comprado por impulso?',
  '¿Cuál es la mejor excusa que has puesto para no ir a un plan?',
  'Si tu vida fuera una serie, ¿cómo se llamaría el capítulo de hoy?'
];

// a: 1 only makes sense with alcohol (hidden in modo sin alcohol)
// s: 1 spicy (hidden in nivel Suave) · x: 1 extra spicy (only in nivel Atrevido)
const TRUTHS = [
  { t: '¿Cuál es la mentira más gorda que les has contado a tus padres para salir?', n: 2 },
  { t: '¿Has besado a más de dos personas en la misma noche? Cuéntalo.', n: 3, s: 1 },
  { t: '¿Quién de esta habitación te parece más atractivo o atractiva?', n: 3, s: 1 },
  { t: '¿Alguna vez has mirado el móvil de tu pareja a escondidas?', n: 2 },
  { t: '¿Tienes alguna fantasía que nunca hayas dicho en voz alta?', n: 4, s: 1 },
  { t: '¿Te liarías con el ex de alguien de este grupo si nadie se enterase?', n: 3, s: 1 },
  { t: '¿Has soñado alguna vez con alguien de aquí?', n: 4, s: 1 },
  { t: '¿Cuál es el sitio más raro donde te has liado con alguien?', n: 3, x: 1 },
  { t: 'Si tuvieras que tener una cita esta noche con alguien de aquí, ¿con quién y por qué?', n: 3, x: 1 },
  { t: '¿Qué es lo más atrevido que has hecho por mensaje?', n: 4, x: 1 },
  { t: 'Puntúa del 1 al 10 cómo besa tu ex. Sin mentir.', n: 3, x: 1 },
  { t: '¿Con quién de tus amigos (no de aquí) te liarías?', n: 3, x: 1 },
  { t: '¿Qué es lo que más te pone de alguien nada más conocerle?', n: 2, x: 1 },
  { t: '¿Qué serie o película te recuerda a tu peor rollo?', n: 1 },
  { t: '¿Cuál ha sido tu momento más ridículo intentando ligar?', n: 2 },
  { t: '¿A quién de este grupo bloquearías una semana si pudieras?', n: 3 },
  { t: '¿Cuál es el mensaje más vergonzoso que has enviado borracho o borracha?', n: 2, a: 1 },
  { t: '¿Qué es lo primero que miras en alguien que te gusta?', n: 1 },
  { t: '¿Cuál ha sido tu peor beso y con quién?', n: 3, s: 1 },
  { t: '¿Qué es lo que más te molesta de la persona a tu izquierda?', n: 2 },
  { t: 'Enseña tu última búsqueda en internet.', n: 3 },
  { t: '¿Has fingido alguna vez estar enfermo o enferma para no quedar con alguien de aquí?', n: 2 },
  { t: '¿Qué secreto de alguien de este grupo conoces y nadie más sabe? Sin decir de quién.', n: 2 }
];
const DARES = [
  { t: 'Manda «te echo de menos» a la última persona con la que hablaste por WhatsApp.', n: 3 },
  { t: 'Baila treinta segundos encima de una silla sin música.', n: 2 },
  { t: 'Enseña al grupo la última foto de tu galería.', n: 3 },
  { t: 'Bebe del vaso de la persona a tu izquierda con las manos a la espalda.', n: 2, a: 1 },
  { t: 'Deja que la persona a tu derecha suba una historia desde tu cuenta.', n: 4 },
  { t: 'Haz un masaje de hombros a quien tengas enfrente durante treinta segundos.', n: 2, s: 1 },
  { t: 'Habla con acento argentino hasta tu próximo turno.', n: 2 },
  { t: 'Deja que el grupo te escriba algo en la mano con boli.', n: 2 },
  { t: 'Llama a alguien de tu familia y dile que le quieres mucho. Sin explicar nada.', n: 3 },
  { t: 'Imita a alguien del grupo hasta que adivinen quién es.', n: 1 },
  { t: 'Declárale tu amor a la lámpara más cercana durante veinte segundos.', n: 2 },
  { t: 'Haz tu mejor imitación de un presentador de telediario anunciando lo que hay en la mesa.', n: 1 },
  { t: 'Intercambia una prenda con la persona de tu izquierda hasta el final de la previa.', n: 3 },
  { t: 'Lee en voz alta el último mensaje que has enviado.', n: 3 },
  { t: 'Haz que el grupo elija a alguien y susúrrale al oído un piropo inventado en el momento.', n: 2, x: 1 },
  { t: 'Deja que la persona a tu izquierda lea tu último chat con tu crush.', n: 4, x: 1 },
  { t: 'Baila lento con quien el grupo elija durante media canción.', n: 3, x: 1 },
  { t: 'Manda un emoji de fuego a la tercera persona de tus chats recientes.', n: 3, x: 1 },
  { t: 'Haz tu mejor mirada seductora a cámara y deja que el grupo decida si la subes.', n: 2, x: 1 },
  { t: 'Haz una foto de grupo en diez segundos con la pose más absurda posible.', n: 1 },
  { t: 'Canta el estribillo de la última canción que has escuchado.', n: 2 }
];
const NUNCA = [
  'he mirado el móvil de mi pareja a escondidas',
  { t: 'me he liado con el ex de un amigo o amiga', s: 1 },
  'he vomitado en un taxi',
  'he mandado un mensaje a las 4 de la mañana del que me arrepentí',
  { t: 'me he liado con alguien en el baño de una discoteca', s: 1 },
  { t: 'he pensado en alguien de este grupo de forma poco inocente', s: 1 },
  { t: 'me he liado con dos personas de la misma fiesta', x: 1 },
  { t: 'he mandado una foto de la que me arrepiento', x: 1 },
  { t: 'me he liado con alguien sin saber su nombre', x: 1 },
  { t: 'he tenido una cita con dos personas el mismo día', x: 1 },
  { t: 'he ligado con alguien de esta habitación', x: 1 },
  'me he despertado sin saber cómo llegué a casa',
  'he dicho «te quiero» sin sentirlo',
  'me he colado en un sitio sin pagar',
  'he stalkeado a un ex hasta fotos de hace años',
  'he dado un like sin querer a una foto antigua',
  'he ligado por una aplicación',
  'he tenido una cita a ciegas',
  'me he quedado dormido o dormida en una fiesta',
  'he perdido el móvil de fiesta',
  'he fingido no ver a alguien por la calle',
  'he mentido sobre mi edad',
  'he llorado en una discoteca',
  'he cantado en un karaoke delante de desconocidos',
  'he salido de casa en pijama a comprar',
  'he tenido un crush con un profesor o profesora',
  'he usado la excusa de «me he quedado sin batería»',
  'he hecho ghosting',
  'me han hecho ghosting',
  'me he enamorado de alguien en una noche',
  { t: 'he olvidado el nombre de alguien con quien me he liado', s: 1 },
  'he dormido en un sitio que no era una cama',
  'he ido a trabajar o a clase sin dormir',
  'he cotilleado el móvil de alguien de esta mesa',
  'me he hecho un tatuaje del que me arrepiento'
];
const PARANOIA = [
  '¿Quién de aquí es más probable que tenga un perfil falso en redes?',
  '¿Con quién de aquí te irías de viaje un mes?',
  '¿Quién de aquí crees que miente más?',
  '¿A quién de aquí le contarías un secreto muy gordo?',
  '¿Quién de aquí te parece que liga más?',
  '¿Quién de aquí sería peor compañero de piso?',
  '¿A quién de aquí no le dejarías tu móvil desbloqueado?',
  '¿Quién de aquí tiene peor gusto para elegir pareja?',
  '¿Quién de aquí acabará siendo famoso o famosa?',
  '¿A quién de aquí llamarías si tuvieras que esconder algo?',
  '¿Quién de aquí crees que cotillea más?',
  '¿Quién de aquí te parece más atractivo o atractiva?',
  '¿Con quién de aquí no irías nunca de fiesta?',
  '¿Quién de aquí crees que tiene un crush secreto en el grupo?',
  '¿Quién de aquí sería el peor jefe?',
  '¿Quién de aquí se cree más gracioso de lo que es?',
  '¿Con quién de aquí te casarías si tuvieras que hacerlo mañana?',
  '¿Quién de aquí sobreviviría menos en una isla desierta?',
  '¿A quién de aquí le confesarías tu peor noche?',
  '¿Quién de aquí crees que habla mal de los demás cuando no están?'
];
const PROBABLE = [
  'acabe esta noche con una multa',
  'se enamore de quien le sirva la copa',
  'pierda el móvil o las llaves antes de las cuatro',
  'vuelva con su ex antes de que acabe el mes',
  'se gaste más de cien euros esta noche sin darse cuenta',
  'llore en el taxi de vuelta',
  'se case primero',
  'se haga famoso o famosa por algo absurdo',
  'desaparezca de la fiesta sin despedirse',
  'conteste a un mensaje de su ex esta noche',
  'llegue tarde hasta a su propia boda',
  'se quede dormido o dormida antes de la una',
  'se pelee con el portero',
  'acabe bailando encima de una mesa',
  'tenga un perfil secreto en redes',
  'se mude a otro país sin avisar',
  'se ría en el momento más inapropiado',
  'adopte cinco gatos',
  'mande un audio de diez minutos',
  'se olvide del cumpleaños de su pareja'
];
const CATS = [
  'Marcas de bebida', 'Sitios raros para dar un beso', 'Excusas para no contestar un mensaje',
  'Canciones de reguetón', 'DJs o artistas de festival', 'Cosas que encuentras en el suelo de una discoteca',
  'Mentiras de primera cita', 'Series de Netflix', 'Cosas que llevas en el bolsillo',
  'Palabras que riman con «-ción»', 'Futbolistas', 'Marcas de ropa', 'Ciudades de España',
  'Cosas que dices cuando vas pedo', 'Apps del móvil', 'Comida de madrugada',
  'Cosas que hay en un baño', 'Nombres de ex famosos', 'Películas de miedo', 'Cosas que pican'
];
const WORDS = {
  'Comida': ['Croqueta', 'Paella', 'Kebab', 'Sushi', 'Tortilla', 'Churros', 'Pizza', 'Gazpacho', 'Nachos', 'Fabada'],
  'Lugares': ['Aeropuerto', 'Gimnasio', 'Hospital', 'Playa', 'Biblioteca', 'Discoteca', 'Iglesia', 'Mercadona', 'Camping', 'Cárcel'],
  'Profesiones': ['Bombero', 'Dentista', 'Influencer', 'Fontanero', 'Azafata', 'Policía', 'Profesor', 'Cura', 'Camarero', 'Astronauta'],
  'Objetos': ['Paraguas', 'Cepillo de dientes', 'Mechero', 'Ventilador', 'Espejo', 'Tostadora', 'Chancla', 'Calcetín', 'Llavero', 'Almohada'],
  'Fiesta': ['Chupito', 'Portero', 'Guardarropa', 'Reservado', 'Cubata', 'Photocall', 'Afterparty', 'Karaoke', 'Barra libre', 'Resaca'],
  'Animales': ['Pingüino', 'Mosquito', 'Jirafa', 'Pulpo', 'Canguro', 'Murciélago', 'Caracol', 'Flamenco', 'Perezoso', 'Tiburón']
};
const LIE_TOPICS = [
  'Tu infancia', 'Tu peor cita', 'Algo que has roto', 'Un viaje', 'Tu primer trabajo', 'Una noche de fiesta',
  'Un famoso que has visto', 'Algo ilegal (poco)', 'Tu familia', 'Un ex', 'Algo que te da miedo', 'Tu mayor manía'
];
const PAIRS = [
  ['Playa', 'Montaña'], ['Ligar en la discoteca', 'Ligar por app'], ['Previa en casa', 'Cena fuera'],
  ['Perder el móvil', 'Perder la cartera'], ['Saber leer mentes', 'Ser invisible'], ['Reguetón toda la noche', 'Techno toda la noche'],
  ['Tu ex en tu boda', 'Tu jefe en tu boda'], ['Sin redes un año', 'Sin música un año'], ['Pizza con piña', 'Tortilla sin cebolla'],
  ['Vivir sin café', 'Vivir sin queso'], ['Que lean tus mensajes', 'Que vean tu historial'], ['Bailar fatal', 'Cantar fatal'],
  ['Viajar al pasado', 'Viajar al futuro'], ['Cita con tu crush famoso', '1.000 € ahora mismo'], ['Ser muy alto', 'Ser muy bajo'],
  ['Madrugar siempre', 'Trasnochar siempre'], ['Gato', 'Perro'], ['Primera cita en el cine', 'Primera cita en un bar'],
  ['Saber cómo mueres', 'Saber cuándo mueres'], ['Ducha fría', 'Agua del grifo caliente'], ['Mensaje de voz', 'Llamada'],
  ['Vivir en Madrid', 'Vivir en Barcelona'], ['Ir siempre de traje', 'Ir siempre en chándal'], ['Volver con tu ex', 'Quedarte solo o sola un año'],
  ['Hacer el ridículo en TV', 'Hacer el ridículo en tu trabajo']
];
const MIMICA = [
  'Titanic', 'Tiburón', 'Spiderman', 'El Rey León', 'Harry Potter', 'Shrek', 'Frozen', 'Matrix',
  'Hacer surf', 'Montar en bici', 'Cocinar una paella', 'Ir al dentista', 'Atracar un banco', 'Primera cita',
  'Pescar', 'Bañar a un perro', 'Cambiar un pañal', 'Hacer yoga', 'Perder el autobús', 'Pedir un taxi',
  'Gorila', 'Pingüino', 'Canguro', 'Serpiente', 'Pulpo', 'Gallina',
  'Lavadora', 'Paraguas', 'Secador de pelo', 'Selfie', 'Batidora', 'Ascensor',
  'Bombero', 'Peluquero', 'DJ', 'Árbitro', 'Mago', 'Camarero', 'Portero de discoteca', 'Profesor de autoescuela'
];
const ROULETTE = [
  { t: () => `${pen(2)} para ti.`, self: 2 },
  { t: () => `Reparte ${pen(3)} como quieras.` },
  { t: () => 'Elige a alguien: verdad o reto, y no puede negarse.' },
  { t: () => 'Te libras esta ronda.' },
  { t: () => `Brindis: todo el grupo, ${pen(1)}.` },
  { t: () => 'Cambia de sitio con quien tengas enfrente.' },
  { t: () => 'Imita a alguien del grupo hasta que lo adivinen.' },
  { t: () => `Hasta tu próximo turno no puedes decir «sí» ni «no». Cada fallo, ${pen(1)}.` },
  { t: () => 'La persona a tu izquierda elige tu castigo.' },
  { t: () => `Enseña tu última búsqueda en el móvil o ${pen(2)}.` },
  { t: () => 'Cuenta un secreto pequeño. El grupo decide si vale.' },
  { t: () => 'Elige pareja: hasta la próxima ronda, cuando uno pierda, pierden los dos.' }
];
const KINGS_RULES = {
  1: () => ({ t: 'Cascada', d: S.sober ? 'Todos a la vez hacéis la cosa más ridícula que se le ocurra a quien sacó la carta. Nadie para hasta que pare el de su izquierda.' : 'Empieza quien sacó la carta y todos beben detrás. Nadie para hasta que pare el de su izquierda.' }),
  2: () => ({ t: 'Para ti no', d: `Manda ${pen(2)} a quien quieras.` }),
  3: () => ({ t: 'Para ti', d: `${pen(2)} para quien sacó la carta.` }),
  4: () => ({ t: 'Suelo', d: `Todos tocan el suelo. El último, ${pen(1)}.` }),
  5: () => ({ t: 'Pulgar', d: `Cuando quieras, pon el pulgar sobre la mesa en silencio. El último en darse cuenta, ${pen(1)}. Dura hasta el próximo 5.` }),
  6: () => ({ t: 'Cielo', d: `Todos señalan arriba. El último, ${pen(1)}.` }),
  7: () => ({ t: 'Categoría', d: `Elige una categoría. Por turnos, cada uno dice algo. Quien se quede en blanco o repita, ${pen(1)}.` }),
  8: () => ({ t: 'Compañero', d: 'Elige pareja. Hasta el próximo 8, cuando a uno le toque castigo, al otro también.' }),
  9: () => ({ t: 'Rima', d: `Di una palabra. Por turnos, rimad con ella. Quien falle, ${pen(1)}.` }),
  10: () => ({ t: 'Yo nunca', d: 'Una ronda de «yo nunca» empezando por quien sacó la carta.' }),
  11: () => ({ t: 'Norma', d: `Inventa una norma que dure toda la partida. Quien la rompa, ${pen(1)}.` }),
  12: () => ({ t: 'Preguntas', d: `Hazle una pregunta a alguien. Tiene que responder con otra pregunta, y así sucesivamente. Quien falle, ${pen(1)}.` }),
  13: () => ({ t: 'Rey', d: S.sober ? 'Anota una cosa en el bote: el que saque el cuarto rey hará lo que diga el bote.' : 'Echa un poco de tu vaso en la copa del centro. Quien saque el cuarto rey se la bebe.' })
};

// ---------- state ----------
const S = {
  view: store.get('adult', false) ? 'home' : 'gate',
  players: store.get('players', []),
  sober: store.get('sober', false),
  level: store.get('level', 'clasico'),
  custom: store.get('custom', { nunca: [], verdad: [], reto: [] }),
  game: null,
  g: {},
  sheet: null,
  focus: null,
  form: { myname: store.get('myname', ''), code: '', pname: '', cardtxt: '' },
  cardKind: 'nunca',
  pending: null,
  netBusy: null,
  netErr: null,
  hostView: null,
  localPlayers: null
};
// Per-device state that is never synced: which secret is uncovered, this phone's reaction timer.
const L = { rid: null, mine: false, rx: null, rxRound: null, tGo: 0, ms: 0, t: null };

// ---------- online rooms (PeerJS / WebRTC) ----------
// The phone that creates the room is the host: it runs every game and sends the whole state
// to the rest after each change. Guests only send the actions they tap.
const NET_PREFIX = 'previa-v2-';
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PEER_OPTS = { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] } };
const MAX_PLAYERS = 16;
const net = { peer: null, role: null, code: null, me: null, conns: {}, host: null, fx: null };
const online = () => !!net.role;
const isHost = () => net.role === 'host';
const meIdx = () => online() ? S.players.findIndex(p => p.id === net.me) : -1;
let ACTOR = -1;
// Game actions guests may send to the host. Everything else stays on the device.
const GAME_ACT = /^(m|v|n|p|e|l|b|i|h|c|r|mi|rx|pa)-|^(countdown|restart)$/;

let peerLoading = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve();
  if (!peerLoading) {
    peerLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
    // Refuse the file if the CDN ever serves anything other than this exact build.
    s.integrity = 'sha384-nlUQ8ZqCbvStErob+biJNzSgltf6urV3VGqhfIfzhmg9RXmpeRm76ELw0pYnKlTR';
    s.crossOrigin = 'anonymous';
      s.onload = res;
      s.onerror = () => { peerLoading = null; rej(); };
      document.head.appendChild(s);
    });
  }
  return peerLoading;
}
const makeCode = () => Array.from({ length: 4 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join('');

function sync() {
  if (!isHost()) return;
  const msg = { t: 'state', view: S.view, game: S.game, g: S.g, players: S.players, sober: S.sober, level: S.level, fx: net.fx };
  net.fx = null;
  for (const c of Object.values(net.conns)) if (c.open) { try { c.send(msg); } catch {} }
}

async function createRoom(name) {
  S.netErr = null; S.netBusy = 'Creando la sala…'; render();
  try { await loadPeer(); } catch { return netFail('No se pudo cargar el modo online. Comprueba la conexión a internet.'); }
  const code = makeCode();
  const peer = new Peer(NET_PREFIX + code, PEER_OPTS);
  peer.on('open', id => {
    net.peer = peer; net.role = 'host'; net.code = code; net.me = id;
    S.localPlayers = S.players;
    S.players = [{ id, cid: CID, name, score: 0 }];
    S.netBusy = null; sound.win();
    S.view = 'room'; render();
  });
  peer.on('error', err => {
    if (err.type === 'unavailable-id') { peer.destroy(); createRoom(name); return; }
    if (!net.role) { peer.destroy(); netFail('No se pudo crear la sala. Prueba otra vez en unos segundos.'); }
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
  peer.on('connection', conn => {
    conn.on('data', msg => hostReceive(conn, msg));
    conn.on('close', () => {
      delete net.conns[conn.peer];
      const p = S.players.find(x => x.id === conn.peer);
      if (p) { p.off = true; render(); }
    });
  });
}

function hostReceive(conn, msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'hello') {
    const nm = String(msg.name || '').trim().slice(0, 16) || 'Sin nombre';
    let p = S.players.find((x, i) => i > 0 && x.cid === msg.cid);
    if (!p && S.players.length >= MAX_PLAYERS) { try { conn.send({ t: 'full' }); } catch {} return; }
    if (p) { p.id = conn.peer; p.off = false; p.name = nm; }
    else S.players.push({ id: conn.peer, cid: msg.cid, name: nm, score: 0 });
    net.conns[conn.peer] = conn;
    sound.click(); render();
  } else if (msg.t === 'act') {
    const i = S.players.findIndex(p => p.id === conn.peer);
    if (i < 0 || !GAME_ACT.test(msg.a) || !A[msg.a] || S.view !== 'play') return;
    ACTOR = i;
    try { A[msg.a](msg.arg); } finally { ACTOR = meIdx(); }
  }
}

async function joinRoom(name, code) {
  S.netErr = null; S.netBusy = 'Entrando en la sala…'; render();
  try { await loadPeer(); } catch { return netFail('No se pudo cargar el modo online. Comprueba la conexión a internet.'); }
  const peer = new Peer(undefined, PEER_OPTS);
  let opened = false;
  const fail = m => { if (opened) return; opened = true; clearTimeout(to); try { peer.destroy(); } catch {} netFail(m); };
  const to = setTimeout(() => fail('No se pudo conectar. Comprobad que todos tenéis internet.'), 15000);
  peer.on('error', err => {
    if (!net.role) fail(err.type === 'peer-unavailable' ? `No hay ninguna sala con el código ${code}.` : 'No se pudo conectar con la sala.');
    else lost();
  });
  peer.on('open', () => {
    const conn = peer.connect(NET_PREFIX + code, { reliable: true, serialization: 'json' });
    conn.on('open', () => {
      if (opened) return;
      opened = true; clearTimeout(to);
      net.peer = peer; net.role = 'guest'; net.code = code; net.me = peer.id; net.host = conn;
      S.localPlayers = S.players; S.players = [];
      S.netBusy = null; S.sheet = null;
      conn.send({ t: 'hello', name, cid: CID });
      if (S.view === 'online') history.pushState({ app: 1 }, '');
      S.view = 'room'; render();
    });
    conn.on('data', guestReceive);
    conn.on('close', () => { if (net.role === 'guest') lost(); });
  });
}

function guestReceive(msg) {
  if (!msg || typeof msg !== 'object') return;
  if (msg.t === 'state') {
    S.players = msg.players; S.sober = msg.sober; S.level = msg.level || 'clasico'; S.game = msg.game; S.g = msg.g || {}; S.hostView = msg.view;
    S.view = msg.view === 'play' && S.game ? 'play' : msg.view === 'summary' ? 'summary' : 'room';
    if (msg.fx && sound[msg.fx[0]]) sound[msg.fx[0]](msg.fx[1]);
    render();
  } else if (msg.t === 'bye') {
    leave('El anfitrión ha cerrado la sala.');
  } else if (msg.t === 'full') {
    leave(`La sala está llena (máximo ${MAX_PLAYERS}).`);
  }
}

function lost() {
  if (net.role !== 'guest') return;
  S.sheet = `<h3>Se ha perdido la conexión</h3><p class="sub">Puede que el anfitrión haya cerrado la app o que alguien se haya quedado sin cobertura.</p>
    <div class="duo"><button class="btn alt" data-act="leave">Salir</button><button class="btn hot" data-act="rejoin">Volver a entrar</button></div>`;
  render();
}

function cleanup() {
  clearClock(); clearTimeout(L.t);
  try { if (net.peer) net.peer.destroy(); } catch {}
  Object.assign(net, { peer: null, role: null, code: null, me: null, conns: {}, host: null, fx: null });
  S.players = S.localPlayers || store.get('players', []);
  S.localPlayers = null;
  S.sober = store.get('sober', false);
  S.level = store.get('level', 'clasico');
  S.hostView = null;
}
function netFail(msg) {
  cleanup();
  S.netBusy = null; S.netErr = msg; S.sheet = null; S.view = 'online';
  render();
}
function leave(msg) {
  if (isHost()) for (const c of Object.values(net.conns)) { try { c.send({ t: 'bye' }); } catch {} }
  cleanup();
  S.game = null; S.g = {}; S.view = 'home';
  S.sheet = msg ? `<h3>Fuera de la sala</h3><p class="sub">${esc(msg)}</p><button class="btn" data-act="close-sheet">Vale</button>` : null;
  render();
}

// Sounds triggered on the host are replayed on every phone.
for (const k of ['flip', 'tick', 'boom', 'win']) {
  const f = sound[k].bind(sound);
  sound[k] = (...a) => { f(...a); if (isHost()) net.fx = [k, a[0]]; };
}

// ---------- helpers ----------
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Draws from a list without repeats until it runs out. The pool lives in S.g so it can be synced.
const draw = (key, list) => {
  const p = S.g._p || (S.g._p = {});
  if (!p[key] || !p[key].length || p[key].some(i => i >= list.length)) p[key] = shuffle(list.map((_, i) => i));
  return list[p[key].pop()];
};
const LEVELS = { suave: 'Suave', clasico: 'Clásico', atrevido: 'Atrevido' };
const LEVEL_HINT = {
  suave: 'Para romper el hielo o con gente que acabáis de conocer.',
  clasico: 'Picante, pero sin pasarse.',
  atrevido: 'Solo con confianza. Más preguntas y retos subidos de tono.'
};
const SITE = 'https://markk17-mh.github.io/previa/';
// Public address of this page, or the GitHub Pages one when running locally or inside the store app.
const shareBase = () => /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? location.origin + location.pathname : SITE;
const clean = list => list.filter(x =>
  !(S.sober && x.a) &&
  !(S.level === 'suave' && (x.s || x.x)) &&
  !(S.level !== 'atrevido' && x.x));
const txt = it => typeof it === 'string' ? it : it.t;
// Base cards plus the group's own ("Tus cartas"), filtered by level and alcohol mode.
const BASE = { nunca: NUNCA, verdad: TRUTHS, reto: DARES };
const deck = kind => clean(BASE[kind].concat((S.custom[kind] || []).map(t => kind === 'nunca' ? { t: esc(t) } : { t: esc(t), n: 2 })));
const mod = i => ((i % S.players.length) + S.players.length) % S.players.length;
const name = i => esc(S.players[mod(i)].name);
const active = () => S.players.map((_, i) => i).filter(i => !S.players[i].off);
const randOn = () => pick(active());
const nextOn = t => { for (let k = 1; k <= S.players.length; k++) if (!S.players[mod(t + k)].off) return t + k; return t + 1; };
const isMe = i => online() && meIdx() === mod(i);
// In a room, turn-based buttons belong to whoever has the turn (and the host, as referee).
const canAct = (t, who = meIdx()) => !online() || who === 0 || who === mod(t);
const unit = () => S.sober ? 'puntos' : 'tragos';
const pen = n => S.sober ? `${n} ${n === 1 ? 'punto' : 'puntos'}` : `${n} ${n === 1 ? 'trago' : 'tragos'}`;
const savePlayers = () => { if (!online()) store.set('players', S.players); };
const addPen = (i, n) => { const p = S.players[mod(i)]; p.score = Math.max(0, (p.score || 0) + n); savePlayers(); };
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const COLORS = ['pink', 'mustard', 'sky', 'mint', 'lilac', 'tomato'];
const colorOf = i => `var(--${COLORS[i % COLORS.length]})`;

let clocks = [];
const every = (ms, fn) => clocks.push(setInterval(fn, ms));
const after = (ms, fn) => clocks.push(setTimeout(fn, ms));
const clearClock = () => { clocks.forEach(id => { clearInterval(id); clearTimeout(id); }); clocks = []; };

// One drawn mark per game, same 24px grid and 1.7 stroke as the interface icons.
const GAME_ICON = {
  mision: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"/>',
  verdad: '<path d="M4 5h16v11H10l-6 4z"/><path d="M10 9.3a2.1 2.1 0 1 1 3 1.9c-.6.3-1 .8-1 1.4"/><circle cx="12" cy="14.4" r=".6" fill="currentColor"/>',
  nunca: '<path d="M6 4h12l-1.6 15.2A1.6 1.6 0 0 1 14.8 21H9.2a1.6 1.6 0 0 1-1.6-1.8z"/><path d="M6.6 9.5h10.8"/>',
  probable: '<circle cx="16.5" cy="7" r="2.6"/><path d="M11.5 20.5c.4-3.6 2.4-5.8 5-5.8s4.6 2.2 5 5.8"/><path d="M2.5 12H9M6.5 9.5 9 12l-2.5 2.5"/>',
  bomba: '<circle cx="10.5" cy="14" r="6.5"/><path d="M15.2 9.3 17.6 7"/><path d="M19.2 3.8 20.4 2.6M20.6 6.8h1.7M17.4 2.4V.9"/>',
  paranoia: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  impostor: '<path d="M4 6c3.2 1.1 12.8 1.1 16 0v5.2c0 4.8-3.8 8.3-8 8.3s-8-3.5-8-8.3z"/><path d="M7.8 11.2h2.8M13.4 11.2h2.8M10 15.5c1.3.8 2.7.8 4 0"/>',
  mentira: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6 5 7.5 7.5 5M3.5 12 5 13.5 7.5 11M3.8 16.7l3.2 3.2M7 16.7l-3.2 3.2"/>',
  mayor: '<rect x="3" y="4" width="11" height="16" rx="2"/><path d="M19 4v16M16.5 6.5 19 4l2.5 2.5M16.5 17.5 19 20l2.5-2.5"/>',
  copa: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  esto: '<path d="M12 21v-8M12 13 5.5 6.5M12 13l6.5-6.5M5 11V6h5M19 11V6h-5"/>',
  reflejos: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  ruleta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.6"/><path d="M12 3v7.4M12 13.6V21M3 12h7.4M13.6 12H21M5.6 5.6l5.3 5.3M13.1 13.1l5.3 5.3"/>',
  mimica: '<circle cx="12" cy="4.6" r="2.1"/><path d="M12 7.5v7M12 14.5 8.8 21M12 14.5l3.2 6.5M5.5 8.5 12 10.6l6.5-4.6"/>'
};
const gameIcon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${GAME_ICON[id] || ''}</svg>`;

const ic = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.6 2.9-5.6 6-5.6s5.5 2 6 5.6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.6c1.7.7 2.8 2.4 3 5.4"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
  phones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="8" height="14" rx="2"/><rect x="13" y="4" width="8" height="14" rx="2"/><path d="M6.5 17h1M16.5 15h1"/></svg>'
};

// Icons always sit next to visible text or inside a labelled button, so hide them from screen readers.
for (const k in ic) ic[k] = ic[k].replace('<svg ', '<svg aria-hidden="true" focusable="false" ');

let lastCard = null;
function card(label, text, color = 'pink', foot = '', extra = '') {
  const key = label + '|' + text;
  const enter = key !== lastCard ? ' enter' : '';
  lastCard = key;
  const size = extra || (String(text).length > 110 ? 'long' : '');
  return `<article class="card glass lit${enter}" style="--c:var(--${color})">
    <span class="card-label neon">${label}</span>
    <p class="card-text ${size}">${text}</p>
    ${foot ? `<span class="card-foot">${foot}</span>` : ''}
  </article>`;
}
const turn = i => isMe(i)
  ? `<div class="turn"><b class="neon">Te toca</b></div>`
  : `<div class="turn"><span class="eyebrow">Turno de</span><b>${name(i)}</b></div>`;
const waitFor = (i, what) => `<p class="sub center wait">Esperando a que <b>${name(i)}</b> ${what}…</p>`;
const verdict = (label, big, text, color = 'pink') => `<div class="verdict glass lit" style="--c:var(--${color})"><h2><span class="lead">${label}</span><span class="big neon">${big}</span></h2>${text ? `<p>${text}</p>` : ''}</div>`;
// Pass-the-phone progress: one segment per player, the current one lit.
const progress = (i, n) => `<div class="progress" role="img" aria-label="${i + 1} de ${n}">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('')}</div>`;

// shared 3-2-1 countdown stored in S.g.cd (null → 3 → 2 → 1 → 0)
function countdown() {
  S.g.cd = 3; sound.tick(600); render();
  every(1000, () => {
    S.g.cd--;
    if (S.g.cd > 0) sound.tick(600 + (3 - S.g.cd) * 200);
    else { clearClock(); sound.boom(); }
    render();
  });
}
const countView = (cd, shout) => cd > 0 ? `<div class="count neon">${cd}</div>` : `<div class="shout neon">${shout}</div>`;

// playing cards
const SUITS = { h: '♥', d: '♦', c: '♣', s: '♠' };
const LABELS = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const newDeck = () => shuffle(Object.keys(SUITS).flatMap(s => Array.from({ length: 13 }, (_, i) => ({ s, v: i + 1 }))));
function face(c, cls = '') {
  const red = c.s === 'h' || c.s === 'd';
  const l = LABELS[c.v] || c.v;
  return `<div class="pcard ${red ? 'red' : ''} ${cls}">
    <span class="pc-corner">${l}<i>${SUITS[c.s]}</i></span>
    <span class="pc-mid">${SUITS[c.s]}</span>
    <span class="pc-corner rot">${l}<i>${SUITS[c.s]}</i></span>
  </div>`;
}

// reaction ranking; "early" or missing counts as last
const rxVal = t => t == null || t === 'early' ? Infinity : t;
const rxRank = (times, idxs) => idxs.map(i => ({ i, t: times[i] })).sort((a, b) => rxVal(a.t) - rxVal(b.t));

// 1080×1920 story image of the night's ranking, drawn in the app's neon style.
async function summaryImage() {
  try { await Promise.all([document.fonts.load('120px "Tilt Neon"'), document.fonts.load('700 52px "Bricolage Grotesque"'), document.fonts.load('34px "DM Mono"')]); } catch {}
  const W = 1080, H = 1920, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#0c0a0e'; x.fillRect(0, 0, W, H);
  const glow = (cx, cy, r, col, a) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
  };
  glow(120, 160, 1000, '#ff4fa0', 0.4); glow(1000, 1850, 900, '#ffbe3b', 0.2);
  const neon = (text, y, size, col, core) => {
    x.font = `${size}px "Tilt Neon", sans-serif`; x.textAlign = 'center';
    x.fillStyle = col; x.shadowColor = col;
    for (const b of [70, 34, 14]) { x.shadowBlur = b; x.fillText(text, W / 2, y); }
    x.shadowBlur = 0; x.fillStyle = core; x.fillText(text, W / 2, y);
  };
  const label = (text, y, size = 32, col = '#aaa2ad') => { x.font = `${size}px "DM Mono", monospace`; x.textAlign = 'center'; x.fillStyle = col; x.fillText(text, W / 2, y); };
  const fit = (t, max) => { let s = t; while (x.measureText(s).width > max && s.length > 1) s = s.slice(0, -1); return s === t ? t : s + '…'; };

  neon('Previa.', 270, 170, '#ff4fa0', '#ffe3f0');
  label(`RESUMEN DE LA PREVIA · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`, 360);
  const rank = S.players.filter(p => !p.off).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  label('CORONA DE LA NOCHE', 500, 34);
  x.font = '120px "Tilt Neon", sans-serif';
  neon(fit(rank[0] ? rank[0].name : '—', 900), 640, 120, '#ffbe3b', '#fff3d6');
  label(`${rank[0] ? rank[0].score || 0 : 0} ${unit()}`, 715, 40, '#f6f0e8');

  const rows = rank.slice(0, 8), top = 800, rowH = 104, boxH = rows.length * rowH + 40;
  x.fillStyle = 'rgba(255,255,255,0.06)'; x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = 2;
  x.beginPath();
  if (x.roundRect) x.roundRect(80, top, W - 160, boxH, 40); else x.rect(80, top, W - 160, boxH);
  x.fill(); x.stroke();
  rows.forEach((p, k) => {
    const y = top + 20 + rowH * k + rowH / 2 + 16;
    x.textAlign = 'left'; x.fillStyle = '#6e6773'; x.font = '34px "DM Mono", monospace'; x.fillText(String(k + 1).padStart(2, '0'), 130, y);
    x.fillStyle = '#f6f0e8'; x.font = '700 52px "Bricolage Grotesque", sans-serif'; x.fillText(fit(p.name, 560), 220, y);
    x.textAlign = 'right'; x.fillStyle = k === 0 ? '#ffbe3b' : '#aaa2ad'; x.font = '36px "DM Mono", monospace'; x.fillText(`${p.score || 0} ${unit()}`, W - 130, y);
    if (k < rows.length - 1) { x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(130, top + 20 + rowH * (k + 1), W - 260, 2); }
  });

  label('JUEGA GRATIS, SIN DESCARGAR NADA', H - 230, 32);
  neon(SITE.replace(/^https:\/\//, '').replace(/\/$/, ''), H - 150, 56, '#ff4fa0', '#ffe3f0');
  return cv;
}

function misionClock() {
  const g = S.g;
  every(1000, () => {
    g.left--;
    if (g.left <= 0) { clearClock(); sound.boom(); g.phase = 'reveal'; render(); return; }
    if (g.left <= 10) sound.tick();
    const c = document.getElementById('clock'); if (c) c.textContent = fmt(g.left);
    sync();
  });
}
const mimicaTeam = t => S.players.map((p, i) => ({ p, i })).filter(x => !x.p.off && x.i % 2 === t);
const mimicaActor = g => { const m = mimicaTeam(g.team); return m.length ? m[g.actor[g.team] % m.length].i : 0; };

// ---------- games ----------
const GAMES = [
  {
    id: 'mision', title: 'Misión secreta', color: 'tomato', min: 3, time: '10 min',
    short: 'Una acción, un momento, diez minutos.',
    blurb: 'Cada uno recibe algo que hacer y el momento exacto en que hacerlo. Que no se note.',
    rules: () => [
      online() ? 'Cada uno ve su misión en su móvil: un «qué» y un «cuándo». No se la enseñes a nadie.' : 'Pasad el móvil. Cada uno ve en secreto su misión: un «qué» y un «cuándo».',
      'Durante diez minutos hablad con normalidad. La app os da temas.',
      'Cuando ocurra tu «cuándo», haz tu «qué» sin que nadie lo pille.',
      `Al final se revela todo. Si la hiciste sin que te pillaran, repartes ${pen(3)}. Si te pillaron, ${pen(2)} para ti.`
    ],
    start() {
      const w = shuffle(WHAT), wh = shuffle(WHEN);
      const m = S.players.map((p, i) => {
        const others = S.players.filter((q, j) => j !== i && !q.off);
        const t = (others.length ? pick(others) : p).name;
        return { what: w[i % w.length].replaceAll('{x}', t), when: wh[i % wh.length].replaceAll('{x}', t) };
      });
      S.g = { phase: online() ? 'play' : 'deal', i: 0, shown: false, m, left: 600, marks: {} };
      S.g.topic = draw('topic', TOPICS);
    },
    clock() { if (S.g.phase === 'play') misionClock(); },
    view() {
      const g = S.g, n = S.players.length;
      if (g.phase === 'deal') {
        const me = g.m[g.i];
        return `<div class="pass"><h2 class="pass-name">Pásale el móvil a<b class="neon">${name(g.i)}</b></h2>${progress(g.i, n)}</div>
        ${!g.shown
          ? `<button class="reveal" data-act="m-show"><b>Ver mi misión</b><span>Que nadie más mire la pantalla</span></button>`
          : `${card('Qué', esc(me.what), 'tomato')}
             <div class="when glass"><span class="eyebrow">Cuándo</span><p>${esc(me.when[0].toUpperCase() + me.when.slice(1))}</p></div>
             <button class="btn" data-act="m-next">${g.i + 1 < n ? 'Ocultar y pasar' : 'Ocultar y empezar'}</button>`}`;
      }
      if (g.phase === 'play') {
        let mine = '';
        if (online()) {
          const m = g.m[meIdx()];
          mine = !m ? `<p class="sub center">Has entrado a mitad de ronda. En la siguiente tendrás misión.</p>`
            : L.mine ? `${card('Tu misión', esc(m.what), 'tomato', esc(m.when[0].toUpperCase() + m.when.slice(1)))}<button class="btn alt" data-act="loc-mine">Ocultar</button>`
            : `<button class="reveal" data-act="loc-mine"><b>Ver mi misión</b><span>Tápala de los demás</span></button>`;
        }
        return `<div><div class="clock neon" id="clock">${fmt(g.left)}</div><p class="sub center" style="margin-top:8px">Hablad con normalidad. Cuando pase tu «cuándo», haz tu «qué».</p></div>
        ${mine}
        ${card('Tema para hablar', g.topic, 'mustard')}
        <button class="btn alt" data-act="m-topic">Otro tema</button>
        ${online() ? '' : `<div class="peek"><span class="eyebrow">¿Se te ha olvidado? Toca tu nombre</span>
          <div class="chips">${S.players.map((p, i) => `<button class="chip" data-act="m-peek" data-arg="${i}">${esc(p.name)}</button>`).join('')}</div>
        </div>`}
        <button class="link" data-act="m-end" style="align-self:center">Terminar ya y revelar</button>`;
      }
      return `<div><h2 class="h2">Se acabó el tiempo</h2><p class="sub" style="margin-top:8px">Leed cada misión en voz alta. Si la hizo sin que le pillaran, reparte ${pen(3)}. Si le pillaron, ${pen(2)} para quien la tenía.</p></div>
      <ul class="rlist panel glass">${S.players.map((p, i) => g.m[i] ? `<li>
        <b>${esc(p.name)}</b><p>${esc(g.m[i].what)}</p><small>${esc(g.m[i].when)}</small>
        <div class="chips"><button class="chip ${g.marks[i] === 'ok' ? 'on' : ''}" data-act="m-mark" data-arg="${i}:ok" aria-pressed="${g.marks[i] === 'ok'}">La hizo</button><button class="chip ${g.marks[i] === 'caught' ? 'on bad' : ''}" data-act="m-mark" data-arg="${i}:caught" aria-pressed="${g.marks[i] === 'caught'}">Le pillaron</button></div>
      </li>` : '').join('')}</ul>
      <button class="btn hot" data-act="restart">Otra ronda</button>`;
    }
  },
  {
    id: 'verdad', title: 'Verdad o reto', color: 'sky', min: 2, time: '20–40 min',
    short: 'El de siempre, con preguntas que escuecen.',
    blurb: 'Preguntas que nadie quiere contestar y retos que nadie quiere hacer.',
    rules: () => [
      'En tu turno eliges verdad o reto.',
      'Si cumples, pasa el turno.',
      'Si te niegas, te llevas lo que marque la carta.',
      'Si al grupo le parece demasiado fuerte, puede vetarla y sale otra sin castigo.'
    ],
    start() { S.g = { turn: randOn(), card: null, kind: null }; },
    view() {
      const g = S.g, mine = canAct(g.turn);
      if (!g.card) {
        return `${turn(g.turn)}
        ${mine ? `<div class="duo">
          <button class="bigchoice glass lit" style="--c:var(--sky)" data-act="v-pick" data-arg="t"><small>A</small><span class="neon">Verdad</span></button>
          <button class="bigchoice glass lit" style="--c:var(--tomato)" data-act="v-pick" data-arg="d"><small>B</small><span class="neon">Reto</span></button>
        </div>` : waitFor(g.turn, 'elija verdad o reto')}`;
      }
      return `${turn(g.turn)}
      ${card(g.kind === 't' ? 'Verdad' : 'Reto', g.card.t, g.kind === 't' ? 'sky' : 'tomato', `Si se niega: ${pen(g.card.n)}`)}
      ${mine ? `<div class="duo"><button class="btn alt" data-act="v-done" data-arg="no">Me niego</button><button class="btn hot" data-act="v-done" data-arg="ok">Hecho</button></div>` : waitFor(g.turn, 'cumpla')}
      <button class="link" data-act="v-veto" style="align-self:center">El grupo la veta: otra carta sin castigo</button>`;
    }
  },
  {
    id: 'nunca', title: 'Yo nunca', color: 'mint', min: 2, time: '15–30 min',
    short: 'Quien lo haya hecho, lo paga.',
    blurb: 'Una frase, y quien lo haya hecho no puede disimular.',
    rules: () => [
      'Alguien lee la frase en voz alta.',
      S.sober ? 'Quien lo haya hecho, se apunta un punto en el marcador.' : 'Quien lo haya hecho, bebe.',
      'Las explicaciones son opcionales, pero recomendables.'
    ],
    start() { S.g = { n: 1 }; S.g.cur = txt(draw('n', deck('nunca'))); },
    view() {
      const g = S.g;
      return `${card(`Nº ${g.n}`, `Yo nunca ${g.cur}.`, 'mint', S.sober ? 'Si lo has hecho, suma un punto.' : 'Si lo has hecho, bebe.')}
      <div class="stackbtns"><button class="btn hot" data-act="n-next">Siguiente</button></div>`;
    }
  },
  {
    id: 'probable', title: 'Quién es más probable', color: 'lilac', min: 3, time: '15–25 min',
    short: 'A la de tres, todos señalan.',
    blurb: 'Descubre lo que tu grupo piensa de ti de verdad.',
    rules: () => [
      'Leed la frase.',
      'Cuenta atrás y, a la de tres, todos señalan a alguien a la vez.',
      `El más señalado se lleva ${pen(1)} por cada dedo.`
    ],
    start() { S.g = { cd: null }; S.g.cur = draw('p', PROBABLE); },
    view() {
      const g = S.g;
      return `${card('Quién es más probable que…', g.cur, 'lilac')}
      ${g.cd == null
        ? `<div class="stackbtns"><button class="btn hot" data-act="countdown">Contar hasta tres</button><button class="btn alt" data-act="p-next">Otra frase</button></div>`
        : g.cd > 0 ? countView(g.cd)
        : `${countView(0, '¡Señalad!')}<p class="sub center">El más señalado: ${pen(1)} por dedo.</p><button class="btn" data-act="p-next">Siguiente</button>`}`;
    }
  },
  {
    id: 'bomba', title: 'La bomba', color: 'mustard', min: 2, time: '10–20 min',
    short: 'Di una palabra y pasa. Rápido.',
    blurb: 'Una categoría, un temporizador que nadie ve y una bomba que quema.',
    rules: () => [
      'Sale una categoría.',
      online() ? 'Quien tiene la bomba en su móvil dice algo que encaje y pulsa «Pasar». La bomba salta al móvil del siguiente.' : 'Quien tiene el móvil dice algo que encaje, pulsa «Pasar» y lo pasa a su derecha.',
      'No se puede repetir. Nadie sabe cuánto dura la mecha.',
      `A quien le explote, ${pen(3)}.`
    ],
    start() { S.g = { state: 'idle', holder: randOn() }; S.g.cat = draw('c', CATS); },
    view() {
      const g = S.g;
      if (g.state === 'idle') {
        return `${card('Categoría', g.cat, 'mustard', online() ? 'Di algo que encaje y pasa la bomba.' : 'Di algo que encaje y pasa el móvil a tu derecha.')}
        <p class="sub center">Empieza <b>${isMe(g.holder) ? 'tú' : name(g.holder)}</b></p>
        <div class="stackbtns"><button class="btn hot" data-act="b-light">Encender la mecha</button><button class="btn alt" data-act="b-cat">Otra categoría</button></div>`;
      }
      if (g.state === 'running') {
        if (online() && !isMe(g.holder)) {
          return `<p class="sub center">${g.cat}</p><div class="fuse glass"><span class="lead">Lo tiene</span><b class="neon" style="--c:var(--mustard)">${name(g.holder)}</b></div>`;
        }
        return `<p class="sub center">${g.cat}</p>
        <div class="fuse glass lit" style="--c:var(--tomato)"><span class="lead">${online() ? '¡La tienes tú!' : 'Lo tiene'}</span><b class="neon" style="--c:var(--tomato)">${online() ? 'Di una y pasa' : name(g.holder)}</b></div>
        <button class="btn hot passbtn" data-tap="b-pass">${online() ? `Pasar a ${name(nextOn(g.holder))}` : 'Pasar'}</button>`;
      }
      return `${verdict('Explotó en manos de', isMe(g.holder) ? 'Ti' : name(g.holder), pen(3), 'tomato')}
      <div class="stackbtns"><button class="btn" data-act="b-again">Otra ronda</button></div>`;
    }
  },
  {
    id: 'paranoia', title: 'Paranoia', color: 'lilac', min: 3, isNew: true, time: '15–30 min',
    short: 'Una pregunta secreta, un nombre en voz alta.',
    blurb: 'Alguien lee una pregunta en secreto y contesta en voz alta solo con un nombre. Saber la pregunta tiene un precio.',
    rules: () => [
      online() ? 'La pregunta solo aparece en el móvil de quien tiene el turno.' : 'Pásale el móvil a quien tiene el turno. Solo esa persona lee la pregunta.',
      'Contesta en voz alta solo con un nombre de los que estáis jugando y tócalo en la pantalla.',
      `La persona nombrada puede pagar ${pen(2)} para que se lea la pregunta. Si no, se queda con la duda.`
    ],
    start() { S.g = { phase: 'ask', turn: randOn(), shown: false, target: null, open: false }; S.g.q = draw('q', PARANOIA); },
    view() {
      const g = S.g;
      if (g.phase === 'ask') {
        if (online() && !isMe(g.turn)) return `${turn(g.turn)}${verdict('Pregunta secreta', '¿?', `${name(g.turn)} está leyendo su pregunta…`, 'lilac')}`;
        if (!online() && !g.shown) {
          return `<div class="pass"><h2 class="pass-name">Pregunta secreta para<b class="neon">${name(g.turn)}</b></h2></div>
          <button class="reveal" data-act="pa-show"><b>Ver la pregunta</b><span>Que nadie más mire la pantalla</span></button>`;
        }
        return `${turn(g.turn)}${card('Solo para ti', g.q, 'lilac', 'Contesta en voz alta con un nombre y tócalo:')}
        <div class="chips">${S.players.map((p, i) => p.off || i === mod(g.turn) ? '' : `<button class="chip" data-act="pa-pick" data-arg="${i}">${esc(p.name)}</button>`).join('')}</div>`;
      }
      const canPay = !online() || isMe(g.target) || meIdx() === 0;
      return `${verdict(`${name(g.turn)} ha dicho`, isMe(g.target) ? 'Tú' : name(g.target), g.open ? '' : '¿Por qué será?', 'lilac')}
      ${g.open ? card('La pregunta era', g.q, 'lilac')
        : canPay ? `<button class="btn" data-act="pa-open">${isMe(g.target) ? 'Pagar' : `${name(g.target)} paga`} ${pen(2)} para ver la pregunta</button>`
        : waitFor(g.target, 'decida si paga por saber la pregunta')}
      <div class="stackbtns"><button class="btn hot" data-act="pa-next">Siguiente</button></div>`;
    }
  },
  {
    id: 'impostor', title: 'El impostor', color: 'pink', min: 3, time: '15–30 min',
    short: 'Todos saben la palabra menos uno.',
    blurb: 'Todos ven la misma palabra menos uno, que tendrá que improvisar.',
    rules: () => [
      online() ? 'Cada uno mira su palabra en su móvil. El impostor no la tiene.' : 'Pasad el móvil. Todos ven la palabra secreta menos el impostor.',
      'Por turnos, cada uno dice una palabra relacionada. Ni muy obvia ni muy rara.',
      'Tras dos vueltas, votad a la vez quién es el impostor.',
      `Si le pilláis, ${pen(3)} para el impostor. Si no, ${pen(1)} para cada uno de los demás.`
    ],
    start() {
      const cat = pick(Object.keys(WORDS));
      S.g = { phase: online() ? 'talk' : 'deal', i: 0, shown: false, cat, word: pick(WORDS[cat]), imp: randOn(), starter: randOn(), parts: active() };
    },
    view() {
      const g = S.g, n = S.players.length;
      const secret = i => i === g.imp
        ? card('Tu papel', 'Eres el impostor', 'tomato', `Categoría: ${g.cat}. Escucha y disimula.`, 'xl')
        : card('La palabra', g.word, 'mint', `Categoría: ${g.cat}`, 'xl');
      if (g.phase === 'deal') {
        return `<div class="pass"><h2 class="pass-name">Pásale el móvil a<b class="neon">${name(g.i)}</b></h2>${progress(g.i, n)}</div>
        ${!g.shown
          ? `<button class="reveal" data-act="i-show"><b>Ver mi palabra</b><span>Que nadie más mire la pantalla</span></button>`
          : `${secret(g.i)}<button class="btn" data-act="i-next">${g.i + 1 < n ? 'Ocultar y pasar' : 'Ocultar y empezar'}</button>`}`;
      }
      if (g.phase === 'talk') {
        let mine = '';
        if (online()) {
          const me = meIdx();
          mine = !g.parts.includes(me) ? `<p class="sub center">Has entrado a mitad de ronda: esta vez solo votas.</p>`
            : L.mine ? `${secret(me)}<button class="btn alt" data-act="loc-mine">Ocultar</button>`
            : `<button class="reveal" data-act="loc-mine"><b>Ver mi palabra</b><span>Tápala de los demás</span></button>`;
        }
        return `${mine}${verdict('Empieza', isMe(g.starter) ? 'Tú' : name(g.starter), 'y seguid hacia la derecha', 'pink')}
        <p class="sub">Cada uno dice una palabra relacionada con la secreta. Dos vueltas y votad todos a la vez señalando.</p>
        <div class="stackbtns"><button class="btn hot" data-act="i-reveal">Revelar impostor</button></div>`;
      }
      return `${verdict('El impostor era', name(g.imp), `La palabra era <b>${g.word}</b>`, 'tomato')}
      <p class="sub">Si le habéis pillado, ${pen(3)} para el impostor. Si no, ${pen(1)} para cada uno de los demás. Si el impostor adivina la palabra, se libra.</p>
      <div class="stackbtns"><button class="btn" data-act="restart">Otra ronda</button></div>`;
    }
  },
  {
    id: 'mentira', title: 'Dos verdades, una mentira', color: 'tomato', min: 3, time: '20–35 min',
    short: 'Tres historias. Una es falsa.',
    blurb: 'Cuenta tres cosas sobre ti. El grupo tiene que oler cuál te has inventado.',
    rules: () => [
      'La app te da un tema. Cuenta tres cosas sobre él: dos ciertas y una inventada.',
      'Cuenta atrás y todos enseñan a la vez 1, 2 o 3 dedos.',
      `Quien falle, ${pen(1)}. Si nadie acierta, el que contaba reparte ${pen(3)}.`
    ],
    start() { S.g = { turn: randOn(), cd: null }; S.g.topic = draw('t', LIE_TOPICS); },
    view() {
      const g = S.g, mine = canAct(g.turn);
      if (g.cd == null) {
        return `${turn(g.turn)}
        ${card('Tema', g.topic, 'tomato', 'Tres cosas. Dos ciertas, una inventada. Numéralas al contarlas.')}
        ${mine ? `<div class="stackbtns"><button class="btn hot" data-act="countdown">Ya lo he contado, a votar</button><button class="btn alt" data-act="l-topic">Otro tema</button></div>` : waitFor(g.turn, 'cuente sus tres historias')}`;
      }
      if (g.cd > 0) return `${turn(g.turn)}${countView(g.cd)}`;
      return `${turn(g.turn)}${countView(0, '¡1, 2 o 3 dedos!')}
      <p class="sub center"><b>${name(g.turn)}</b>, ¿cuál era la mentira? Quien falle, ${pen(1)}.</p>
      ${mine ? `<button class="btn" data-act="l-next">Siguiente</button>` : ''}`;
    }
  },
  {
    id: 'mayor', title: 'Mayor o menor', color: 'mustard', min: 2, time: '10–25 min',
    short: 'Adivina la siguiente carta.',
    blurb: 'Una baraja de verdad, sin repetir cartas. Acierta tres seguidas y pasas.',
    rules: () => [
      'Mira la carta y apuesta: la siguiente, ¿mayor o menor? El As vale 1.',
      `Si fallas (o es igual), ${pen(2)} y pasa el turno.`,
      `Si aciertas tres seguidas, repartes ${pen(3)} y pasas el turno.`
    ],
    start() { const deck = newDeck(); S.g = { deck, cur: deck.pop(), prev: null, streak: 0, turn: randOn(), msg: '', tone: '' }; },
    view() {
      const g = S.g;
      return `${turn(g.turn)}
      <div class="table">${g.prev ? face(g.prev, 'small') : ''}${face(g.cur, 'enter')}</div>
      <p class="msg ${g.tone}">${g.msg}</p>
      <div class="stats"><span class="eyebrow">Racha ${g.streak}/3</span><span class="eyebrow dim">Quedan ${g.deck.length}</span></div>
      ${canAct(g.turn) ? `<div class="duo"><button class="btn alt" data-act="h-guess" data-arg="low">Menor</button><button class="btn hot" data-act="h-guess" data-arg="high">Mayor</button></div>` : waitFor(g.turn, 'apueste')}`;
    }
  },
  {
    id: 'copa', title: 'La copa del rey', color: 'lilac', min: 3, time: '25–45 min',
    short: 'Cada carta, una norma. Cuidado con los reyes.',
    blurb: 'Cada carta tiene su norma. Y el cuarto rey se lleva la copa.',
    rules: () => [
      S.sober ? 'Poned un vaso vacío en el centro: es el bote.' : 'Poned un vaso vacío en el centro de la mesa.',
      'Por turnos, cada uno saca una carta y se cumple su norma.',
      S.sober ? 'Cada rey suma algo al bote. Quien saque el cuarto rey, lo cumple.' : 'Cada rey echa un poco de su bebida en la copa. Quien saque el cuarto, se la bebe.'
    ],
    start() { S.g = { deck: newDeck(), cur: null, kings: 0, turn: randOn(), over: false }; },
    view() {
      const g = S.g, mine = canAct(g.turn);
      if (g.over) {
        return `${verdict('Cuarto rey para', name(g.turn), S.sober ? 'Le toca cumplir lo que diga el bote.' : 'Toda la copa del centro.', 'lilac')}
        <div class="stackbtns"><button class="btn hot" data-act="restart">Nueva partida</button></div>`;
      }
      const top = `${turn(g.turn)}<div class="stats"><span class="eyebrow">Reyes ${g.kings}/4</span><span class="eyebrow dim">Quedan ${g.deck.length}</span></div>`;
      if (!g.cur) return `${top}<div class="table">${mine ? `<button class="pcard back" data-act="c-draw"><span>Toca para sacar</span></button>` : `<div class="pcard back"><span>${name(g.turn)} saca</span></div>`}</div>`;
      const r = KINGS_RULES[g.cur.v]();
      return `${top}<div class="table">${face(g.cur, 'enter')}</div>
      <div class="rule glass"><b>${r.t}</b><p>${r.d}</p></div>
      ${mine ? `<button class="btn" data-act="c-next">Siguiente jugador</button>` : ''}`;
    }
  },
  {
    id: 'esto', title: 'Esto o aquello', color: 'sky', min: 3, time: '10–20 min',
    short: 'Dos opciones. La minoría pierde.',
    blurb: 'Dos opciones y a la de tres todos eligen. Pierde quien piense distinto al resto.',
    rules: () => [
      'Leed las dos opciones.',
      'Cuenta atrás. A la de tres, todos señalan a la izquierda o a la derecha.',
      `Los que hayan quedado en minoría, ${pen(1)}. Si hay empate, todos.`
    ],
    start() { S.g = { cd: null }; S.g.cur = draw('e', PAIRS); },
    view() {
      const g = S.g;
      const opts = `<div class="vs">
        <div class="opt glass lit" style="--c:var(--sky)"><small class="neon">Izquierda</small><span>${g.cur[0]}</span></div>
        <div class="opt glass lit" style="--c:var(--pink)"><small class="neon">Derecha</small><span>${g.cur[1]}</span></div>
        <span class="vs-o">o</span></div>`;
      if (g.cd == null) return `${opts}<div class="stackbtns"><button class="btn hot" data-act="countdown">Contar hasta tres</button><button class="btn alt" data-act="e-next">Otras dos</button></div>`;
      if (g.cd > 0) return `${opts}${countView(g.cd)}`;
      return `${opts}${countView(0, '¡Elegid!')}<p class="sub center">La minoría: ${pen(1)}. Empate: todos.</p><button class="btn" data-act="e-next">Siguiente</button>`;
    }
  },
  {
    id: 'reflejos', title: 'Reflejos', color: 'mint', min: 2, time: '5–10 min',
    short: 'Toca cuando se ponga verde.',
    blurb: 'Toca la pantalla en cuanto cambie de color. El más lento lo paga.',
    rules: () => [
      online() ? 'Todos a la vez, cada uno en su móvil.' : 'Cada jugador, por turnos, toca para empezar y espera.',
      'Cuando la pantalla se ponga verde, toca lo más rápido que puedas.',
      'Si tocas antes de tiempo, quedas último.',
      `El más lento, ${pen(2)}. El más rápido reparte ${pen(2)}.`
    ],
    start() { S.g = online() ? { phase: 'ready', round: 0, delay: 0, times: {}, parts: [] } : { i: 0, phase: 'ready', times: [], tGo: 0 }; },
    view() {
      const g = S.g, n = S.players.length;
      const results = idxs => {
        const rank = rxRank(g.times, idxs);
        return `<div><h2 class="h2">Resultados</h2><p class="sub" style="margin-top:6px"><b>${name(rank[rank.length - 1].i)}</b> se lleva ${pen(2)}. <b>${name(rank[0].i)}</b> reparte ${pen(2)}.</p></div>
        <ol class="ranking panel glass">${rank.map((r, k) => `<li><span class="pos">${String(k + 1).padStart(2, '0')}</span><span class="nm">${name(r.i)}</span><span class="ms">${rxVal(r.t) === Infinity ? 'antes de tiempo' : r.t + ' ms'}</span></li>`).join('')}</ol>
        <div class="stackbtns"><button class="btn hot" data-act="${online() ? 'rx-start' : 'restart'}">Otra vez</button></div>`;
      };
      if (online()) {
        if (g.phase === 'results') return results(g.parts);
        if (g.phase === 'ready') {
          return `${verdict('Todos a la vez', 'Atentos', 'Cuando vuestra pantalla se ponga verde, tocad lo antes posible.', 'mint')}
          <div class="stackbtns"><button class="btn hot" data-act="rx-start">Empezar ronda</button></div>`;
        }
        const me = meIdx(), done = g.parts.filter(i => g.times[i] != null).length;
        if (!g.parts.includes(me)) return `<p class="sub center">Esta ronda la miras. Entras en la siguiente.</p><p class="eyebrow center">${done}/${g.parts.length} han tocado</p>`;
        const inner = {
          wait: `<b>Espera…</b><span>No toques todavía</span>`,
          go: `<b>¡YA!</b>`,
          done: `<b class="ms">${L.ms} ms</b><span>Esperando al resto · ${done}/${g.parts.length}</span>`,
          early: `<b>Demasiado pronto</b><span>Quedas último. Esperando al resto · ${done}/${g.parts.length}</span>`
        }[L.rx || 'wait'];
        return `<button class="rx glass ${L.rx || 'wait'}" data-tap="loc-rx">${inner}</button>
        ${isHost() && done < g.parts.length ? `<button class="link" data-act="rx-finish" style="align-self:center">Ver resultados sin esperar</button>` : ''}`;
      }
      if (g.phase === 'results') return results(S.players.map((_, i) => i));
      const nextLabel = g.i + 1 < n ? `Toca para pasar a ${name(g.i + 1)}` : 'Toca para ver resultados';
      const inner = {
        ready: `<span>${g.i + 1} de ${n}</span><b>${name(g.i)}</b><span>Toca para empezar. Luego espera al verde.</span>`,
        wait: `<b>Espera…</b><span>No toques todavía</span>`,
        go: `<b>¡YA!</b>`,
        done: `<span>${name(g.i)}</span><b class="ms">${g.times[g.i]} ms</b><span>${nextLabel}</span>`,
        early: `<b>Demasiado pronto</b><span>${name(g.i)} queda último. ${nextLabel}</span>`
      }[g.phase];
      return `<button class="rx glass ${g.phase}" data-tap="rx">${inner}</button>`;
    }
  },
  {
    id: 'ruleta', title: 'La ruleta', color: 'pink', min: 2, time: 'Lo que dure',
    short: 'Le toca a alguien. Algo le toca.',
    blurb: 'Gira, cae en alguien y le toca lo que diga la ruleta. Ideal entre juego y juego.',
    rules: () => [
      'Pulsa «Girar». La ruleta elige a una persona.',
      'Le toca lo que salga: castigos, repartos, pequeños retos o librarse.',
      'Se puede usar sola o entre partidas de otros juegos.'
    ],
    start() { S.g = { spinning: false, who: null, res: null, flash: null }; },
    view() {
      const g = S.g;
      const shown = g.spinning ? (g.flash != null ? name(g.flash) : '¿?') : g.who != null ? (isMe(g.who) ? 'Ti' : name(g.who)) : '¿?';
      return `<div class="spin glass ${g.res && !g.spinning ? 'lit' : ''}" style="--c:var(--pink)"><span class="lead">${g.spinning ? 'Girando' : g.who != null ? 'Le toca a' : 'La ruleta'}</span><b class="neon" id="spin">${shown}</b></div>
      ${g.res && !g.spinning ? card('Le toca', g.res, 'pink') : ''}
      <div class="stackbtns"><button class="btn hot" data-act="r-spin" ${g.spinning ? 'disabled' : ''}>${g.who == null ? 'Girar' : 'Girar otra vez'}</button></div>`;
    }
  },
  {
    id: 'mimica', title: 'Mímica', color: 'tomato', min: 4, time: '20–30 min',
    short: 'Por equipos, sin hablar, contra el reloj.',
    blurb: 'Dos equipos y sesenta segundos para hacer acertar todo lo que puedas sin abrir la boca.',
    rules: () => [
      'La app hace dos equipos alternando el orden del grupo.',
      online() ? 'Quien actúa ve la palabra en su móvil. Su equipo tiene 60 segundos para acertar todas las que pueda.' : 'Uno del equipo actúa sin hablar. Su equipo tiene 60 segundos para acertar todas las que pueda.',
      'Si una es muy difícil, se puede pasar.',
      `Cuando acabéis, el equipo que pierda: ${pen(2)} cada uno.`
    ],
    start() { S.g = { phase: 'ready', team: 0, scores: [0, 0], actor: [0, 0], left: 60, word: null, got: 0 }; },
    view() {
      const g = S.g, a = mimicaActor(g), acting = !online() || isMe(a);
      const board = `<div class="score2">${[0, 1].map(t => `<div class="glass ${g.team === t ? 'lit' : ''}"><small class="eyebrow">Equipo ${'AB'[t]}</small><b>${g.scores[t]}</b><span>${mimicaTeam(t).map(x => esc(x.p.name)).join(', ')}</span></div>`).join('')}</div>`;
      if (g.phase === 'ready') {
        return `${board}${verdict(`Equipo ${'AB'[g.team]} · Actúa`, isMe(a) ? 'Tú' : name(a), online() ? 'La palabra solo sale en su móvil.' : 'Solo tú miras la pantalla.', 'tomato')}
        <div class="stackbtns">${canAct(a) ? `<button class="btn hot" data-act="mi-go">Empezar · 60 s</button>` : waitFor(a, 'empiece')}</div>`;
      }
      if (g.phase === 'play') {
        return `<div class="clock sm neon" id="clock">${fmt(g.left)}</div>
        ${acting
          ? `${card(`Aciertos: ${g.got}`, g.word, 'tomato', '', 'xl')}
             <div class="duo"><button class="btn alt" data-act="mi-word" data-arg="skip">Pasar</button><button class="btn hot" data-act="mi-word" data-arg="ok">Acertado</button></div>`
          : `${card(`Equipo ${'AB'[g.team]}`, `Actúa ${name(a)}`, 'tomato', `Aciertos: ${g.got}`)}`}`;
      }
      return `${verdict(`Tiempo · Equipo ${'AB'[g.team]}`, g.got, g.got === 1 ? 'acierto' : 'aciertos', 'mint')}
      ${board}<div class="stackbtns"><button class="btn" data-act="mi-swap">Turno del equipo ${'AB'[1 - g.team]}</button></div>`;
    }
  }
];
const gameById = id => GAMES.find(g => g.id === id);

// ---------- views ----------
const backBtn = (label = 'Volver') => `<button class="icon-btn glass" data-act="back" aria-label="${label}">${ic.back}</button>`;
const avatars = list => list.slice(0, 4).map(({ p, i }) => `<span class="av ${p.off ? 'off' : ''}" style="--c:${colorOf(i)}">${esc(p.name[0].toUpperCase())}</span>`).join('') + (list.length > 4 ? `<span class="av more">+${list.length - 4}</span>` : '');

const VIEWS = {
  gate: () => `<div class="gate">
    <h1 class="wordmark neon">Previa<span class="neon">.</span></h1>
    <p class="lede">Juegos para antes de salir, con preguntas picantes y castigos con bebida. Solo para mayores de 18.</p>
    <div class="panel glass"><button class="setting" data-act="toggle" data-arg="sober" role="switch" aria-checked="${S.sober}">
      <span class="setting-text"><b>Jugar sin alcohol</b><small>Los tragos se cambian por puntos</small></span>
      <span class="switch ${S.sober ? 'on' : ''}" aria-hidden="true"></span>
    </button></div>
    <button class="btn hot" data-act="adult">Tengo 18 años o más</button>
    <p class="fine center">Puedes cambiarlo cuando quieras en Ajustes.</p>
  </div>`,

  home: () => {
    const n = S.players.length;
    const list = S.players.map((p, i) => ({ p, i }));
    const status = isHost() ? `<span class="pill glass"><span class="dot"></span>Sala ${net.code}</span>`
      : S.sober ? '<span class="pill glass">Sin alcohol</span>' : '<span></span>';
    const who = isHost()
      ? `<button class="setup-row" data-act="nav" data-arg="room">
          <span class="glyph" style="--c:var(--mint)">${ic.phones}</span>
          <span class="strip-text"><b>Sala ${net.code}</b><small>${active().length} en la sala · ver el código e invitar</small></span>${ic.chev}</button>`
      : `<button class="setup-row" data-act="nav" data-arg="players">
          ${n ? `<span class="avatars">${avatars(list)}</span>` : `<span class="glyph" style="--c:var(--pink)">${ic.users}</span>`}
          <span class="strip-text"><b>${n ? `${n} ${n === 1 ? 'jugador' : 'jugadores'}` : 'Añade al grupo'}</b><small>${n ? S.players.map(p => esc(p.name)).join(', ') : 'Los nombres reparten los turnos'}</small></span>${ic.chev}</button>`;
    return `<header class="top">
      ${status}
      <button class="icon-btn glass" data-act="nav" data-arg="settings" aria-label="Ajustes">${ic.gear}</button>
    </header>
    <section class="hero">
      <h1 class="wordmark neon">Previa<span class="neon">.</span></h1>
      <p class="lede">${GAMES.length} juegos para antes de salir. En un solo móvil o cada uno en el suyo.</p>
    </section>
    <section class="setup glass" aria-label="Cómo vais a jugar">
      ${who}
      <div class="setup-levels">
        <div class="levels" role="radiogroup" aria-label="Nivel">${Object.entries(LEVELS).map(([k, l]) => `<button class="lv ${S.level === k ? 'on' : ''}" data-act="level" data-arg="${k}" role="radio" aria-checked="${S.level === k}">${l}</button>`).join('')}</div>
        <p class="fine">${LEVEL_HINT[S.level]}</p>
      </div>
      ${isHost() ? '' : `<button class="setup-row" data-act="nav" data-arg="online">
        <span class="glyph" style="--c:var(--mint)">${ic.phones}</span>
        <span class="strip-text"><b>Cada uno en su móvil</b><small>Crea una sala o entra con un código</small></span>${ic.chev}</button>`}
    </section>
    ${S.players.some(p => p.score > 0) ? `<button class="strip glass lit" style="--c:var(--mustard)" data-act="nav" data-arg="summary">
      <span class="glyph">${ic.crown}</span>
      <span class="strip-text"><b>Cerrar la previa</b><small>Ver quién se lleva la corona y compartirlo</small></span>${ic.chev}</button>` : ''}
    <h2 class="section-title">Juegos <span>${GAMES.length}</span></h2>
    <ul class="games glass">${GAMES.map((g, i) => `<li><button class="game" data-act="open" data-arg="${g.id}">
      <span class="tile" style="--c:var(--${g.color})">${gameIcon(g.id)}</span>
      <span class="game-text"><span class="game-title">${g.title}${g.isNew ? '<em class="new">Nuevo</em>' : ''}</span><span class="game-blurb">${g.short}</span></span>
      <span class="game-meta">${g.min}+</span>
    </button></li>`).join('')}</ul>
    <nav class="guides"><span class="eyebrow">Guías</span>
      <a href="juegos-para-previas.html">Juegos para previas</a>
      <a href="yo-nunca-preguntas.html">Preguntas de Yo nunca</a>
      <a href="verdad-o-reto-online.html">Verdad o reto online</a>
      <a href="juegos-para-previas-sin-alcohol.html">Previas sin alcohol</a>
    </nav>
    <p class="foot">${S.sober ? 'Pásalo bien.' : 'Bebe con cabeza. Si conduces, hoy toca agua.'}<br>© 2026 Previa · Markk17-MH. Todos los derechos reservados.</p>`;
  },

  summary: () => {
    const rank = S.players.map((p, i) => ({ p, i })).filter(x => !x.p.off).sort((a, b) => (b.p.score || 0) - (a.p.score || 0));
    if (!rank.length) return `<header class="top">${backBtn()}<span class="top-title">Resumen</span><span class="spacer"></span></header><p class="empty">Todavía no hay nadie en el marcador.</p>`;
    const top = rank[0], low = rank[rank.length - 1];
    const canReset = !online() || isHost();
    return `<header class="top">${backBtn(online() && !isHost() ? 'Salir de la sala' : 'Volver')}<span class="top-title">Resumen de la previa</span><span class="spacer"></span></header>
    ${verdict('Corona de la noche', isMe(top.i) ? 'Tú' : name(top.i), `${top.p.score || 0} ${unit()}`, 'mustard')}
    <ol class="ranking panel glass">${rank.map((r, k) => `<li><span class="pos">${String(k + 1).padStart(2, '0')}</span><span class="nm">${name(r.i)}</span><span class="ms">${r.p.score || 0} ${unit()}</span></li>`).join('')}</ol>
    ${rank.length > 1 ? `<p class="sub center">Sin un rasguño: <b>${name(low.i)}</b>, con ${low.p.score || 0} ${unit()}.</p>` : ''}
    <div class="stackbtns">
      <button class="btn hot" data-act="share-img">Compartir en historias</button>
      ${canReset ? `<button class="btn alt" data-act="new-night">Empezar otra previa</button>` : ''}
    </div>`;
  },

  cartas: () => {
    const kinds = { nunca: 'Yo nunca', verdad: 'Verdades', reto: 'Retos' };
    const ph = { nunca: 'Ej: he llorado viendo Shrek', verdad: 'Ej: ¿Qué es lo que más echas de menos de tu ex?', reto: 'Ej: Llama a tu madre y cántale algo' };
    const list = S.custom[S.cardKind] || [];
    return `<header class="top">${backBtn()}<span class="top-title">Tus cartas</span><span class="spacer"></span></header>
    <div><h2 class="h2">Las cartas de tu grupo</h2><p class="sub" style="margin-top:6px">Escribid vuestras propias frases. Se mezclan con las de la app y se guardan en este móvil.</p></div>
    <div class="levels glass">${Object.entries(kinds).map(([k, l]) => `<button class="lv ${S.cardKind === k ? 'on' : ''}" data-act="ckind" data-arg="${k}">${l} · ${(S.custom[k] || []).length}</button>`).join('')}</div>
    <form class="add" data-submit="add-card"><input class="input" id="cardtxt" name="t" maxlength="140" placeholder="${ph[S.cardKind]}" aria-label="Texto de la carta nueva" autocomplete="off" enterkeyhint="done" value="${esc(S.form.cardtxt || '')}" /><button class="btn hot sm" type="submit">Añadir</button></form>
    ${list.length ? `<ul class="plist panel glass">${list.map((t, i) => `<li><span class="pname wrap">${S.cardKind === 'nunca' ? 'Yo nunca ' : ''}${esc(t)}</span><button class="x" data-act="del-card" data-arg="${i}" aria-label="Borrar">${ic.x}</button></li>`).join('')}</ul>`
      : `<p class="empty">Todavía no hay ninguna.</p>`}`;
  },

  players: () => `<header class="top">${backBtn()}<span class="top-title">Grupo</span><span class="spacer"></span></header>
    <div><h2 class="h2">¿Quién juega?</h2><p class="sub" style="margin-top:6px">Para jugar todos con este móvil. Se guarda solo aquí.</p></div>
    <form class="add" data-submit="add"><input class="input" id="pname" name="n" maxlength="16" placeholder="Nombre" aria-label="Nombre del jugador" autocomplete="off" enterkeyhint="done" value="${esc(S.form.pname)}" /><button class="btn hot sm" type="submit">Añadir</button></form>
    ${S.players.length ? `<ul class="plist panel glass">${S.players.map((p, i) => `<li>
      <span class="av" style="--c:${colorOf(i)}">${esc(p.name[0].toUpperCase())}</span>
      <span class="pname">${esc(p.name)}</span>
      <span class="counter"><button data-act="score" data-arg="${i}:-1" aria-label="Restar">−</button><b>${p.score || 0}</b><button data-act="score" data-arg="${i}:1" aria-label="Sumar">+</button></span>
      <button class="x" data-act="del" data-arg="${i}" aria-label="Quitar">${ic.x}</button>
    </li>`).join('')}</ul>
    <div class="row-split"><span class="eyebrow">Marcador en ${unit()}</span><button class="link" data-act="reset-score">Poner a cero</button></div>`
    : `<p class="empty">Todavía no hay nadie.<br>Mínimo dos para jugar.</p>`}
    <div class="stackbtns"><button class="btn" data-act="back">Listo</button></div>`,

  online: () => `<header class="top">${backBtn()}<span class="top-title">Cada uno en su móvil</span><span class="spacer"></span></header>
    <div><h2 class="h2">Una sala, todos los móviles</h2><p class="sub" style="margin-top:8px">Uno crea la sala y el resto entra con el código. Cada uno ve sus secretos en su pantalla. Hace falta internet.</p></div>
    <label class="field"><span class="eyebrow">Tu nombre</span><input class="input" id="myname" maxlength="16" placeholder="Cómo te llaman" autocomplete="off" value="${esc(S.form.myname)}" /></label>
    ${S.netErr ? `<p class="warn" role="alert">${esc(S.netErr)}</p>` : ''}
    ${S.netBusy ? `<p class="busy" role="status">${S.netBusy}</p>` : `
    <button class="btn hot" data-act="room-create">Crear sala</button>
    <div class="or">o entra en una</div>
    <div class="panel glass pad">
      <label class="field"><span class="eyebrow">Código de la sala</span><input class="input code" id="code" maxlength="4" placeholder="····" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(S.form.code)}" /></label>
      <button class="btn" data-act="room-join">Entrar</button>
    </div>`}`,

  room: () => {
    const host = isHost();
    const g = host ? null : gameById(S.game);
    const list = S.players.length ? `<ul class="plist panel glass">${S.players.map((p, i) => `<li>
        <span class="av ${p.off ? 'off' : ''}" style="--c:${colorOf(i)}">${esc(p.name[0].toUpperCase())}</span>
        <span class="pname">${esc(p.name)}${i === 0 ? '<small>anfitrión</small>' : ''}${p.id === net.me && i !== 0 ? '<small>tú</small>' : ''}${p.off ? '<span class="offline">desconectado</span>' : ''}</span>
        <span class="dot ${p.off ? 'off' : ''}" aria-hidden="true"></span>
        ${host && p.off ? `<button class="x" data-act="room-kick" data-arg="${i}" aria-label="Quitar">${ic.x}</button>` : ''}
      </li>`).join('')}</ul>` : `<p class="busy">Conectando…</p>`;
    const waiting = host ? '' : S.hostView === 'intro' && g
      ? `<div class="intro-hero glass lit" style="--c:var(--${g.color})"><span class="tile lg">${gameIcon(g.id)}</span><h2><span class="lead">${name(0)} ha elegido</span><span class="neon">${g.title}</span></h2><p>${g.blurb}</p></div>
         <h3 class="section-title sm">Cómo se juega</h3>
         <ol class="rules">${g.rules().map(r => `<li>${r}</li>`).join('')}</ol>`
      : S.players.length ? `<p class="sub center">Esperando a que <b>${name(0)}</b> elija juego…</p>` : '';
    return `<header class="top">${backBtn(host ? 'Volver' : 'Salir de la sala')}<span class="top-title">Sala</span><span class="spacer"></span></header>
    <div class="panel glass pad roomcode">
      <span class="eyebrow">Código de la sala</span>
      <b class="neon">${net.code}</b>
      <div class="chips" style="justify-content:center"><button class="chip" data-act="room-invite">Invitar con un enlace</button><button class="chip" data-act="room-copy">Copiar código</button></div>
    </div>
    ${host ? `<p class="sub center">Los demás abren Previa, tocan <b>Jugar cada uno en su móvil</b> y escriben el código.</p>` : ''}
    ${waiting}
    <h3 class="section-title sm">En la sala <span>${active().length}</span></h3>
    ${list}
    <div class="stackbtns">
      ${host ? `<button class="btn hot" data-act="nav" data-arg="home">Elegir juego</button>` : ''}
      ${host && S.players.some(p => p.score > 0) ? `<button class="btn" data-act="nav" data-arg="summary">Cerrar la previa y ver el resumen</button>` : ''}
      <button class="btn alt" data-act="ask-leave">${host ? 'Cerrar la sala' : 'Salir de la sala'}</button>
    </div>`;
  },

  settings: () => `<header class="top">${backBtn()}<span class="top-title">Ajustes</span><span class="spacer"></span></header>
    <div class="panel glass">
      <button class="setting" data-act="toggle" data-arg="sober" role="switch" aria-checked="${S.sober}"><span class="setting-text"><b>Modo sin alcohol</b><small>Los castigos se cuentan en puntos, no en tragos</small></span><span class="switch ${S.sober ? 'on' : ''}" aria-hidden="true"></span></button>
      <button class="setting" data-act="nav" data-arg="cartas"><span class="setting-text"><b>Tus cartas</b><small>Añade vuestros propios «yo nunca», verdades y retos</small></span>${ic.chev}</button>
      <button class="setting" data-act="toggle" data-arg="sound" role="switch" aria-checked="${sound.on}"><span class="setting-text"><b>Sonido y vibración</b><small>Efectos al pasar cartas y en las cuentas atrás</small></span><span class="switch ${sound.on ? 'on' : ''}" aria-hidden="true"></span></button>
      <button class="setting" data-act="wipe"><span class="setting-text"><b>Borrar datos</b><small>Quita el grupo, el marcador y las preferencias</small></span></button>
    </div>
    <p class="fine">Previa no guarda cuentas ni datos en ningún servidor. En las salas online, los nombres viajan directamente entre los móviles de la sala. <a class="link" href="privacidad.html">Política de privacidad</a></p>
    <p class="fine">Contenido para mayores de 18. Bebe con moderación y nunca conduzcas si has bebido. Nadie está obligado a beber ni a cumplir un reto.</p>`,

  intro: () => {
    const g = gameById(S.game), i = GAMES.indexOf(g), n = active().length;
    return `<header class="top">${backBtn()}<span class="spacer"></span></header>
    <div class="intro-hero glass lit" style="--c:var(--${g.color})">
      <span class="tile lg">${gameIcon(g.id)}</span>
      <h2 class="neon">${g.title}</h2><p>${g.blurb}</p>
      <div class="chips"><span>${g.min}+ jugadores</span><span>${g.time}</span>${online() ? `<span>Sala ${net.code}</span>` : ''}</div>
    </div>
    <h3 class="section-title sm">Cómo se juega</h3>
    <ol class="rules">${g.rules().map(r => `<li>${r}</li>`).join('')}</ol>
    <div class="stackbtns">${n >= g.min
      ? `<button class="btn hot" data-act="start">Empezar${online() ? ' en todos los móviles' : ''}</button>`
      : `<p class="warn center">Hacen falta al menos ${g.min} jugadores. Ahora ${n === 1 ? 'hay 1' : `hay ${n}`}.</p>
         ${online() ? `<button class="btn" data-act="nav" data-arg="room">Ver el código de la sala</button>` : `<button class="btn" data-act="nav" data-arg="players">Añadir jugadores</button>`}`}</div>`;
  },

  play: () => {
    const g = gameById(S.game);
    return `<header class="top">${backBtn(online() && !isHost() ? 'Salir de la sala' : 'Salir del juego')}<span class="top-title">${g.title}</span><button class="icon-btn glass" data-act="rules" aria-label="Reglas">${ic.help}</button></header>
    ${g.view()}`;
  }
};

// Starts this phone's own reaction timer when a room round begins.
function rxLocal() {
  const g = S.g;
  if (!online() || S.view !== 'play' || S.game !== 'reflejos' || g.phase !== 'wait' || L.rxRound === g.round || !g.parts.includes(meIdx())) return;
  L.rxRound = g.round; L.rx = 'wait'; clearTimeout(L.t);
  L.t = setTimeout(() => {
    if (L.rx !== 'wait') return;
    L.rx = 'go'; L.tGo = performance.now(); sound.tone('square', 1200, 0, 0.05, 0.08); sound.buzz(30); render();
  }, g.delay);
}

function render() {
  if (S.g && S.g.rid !== L.rid) { L.rid = S.g.rid; L.mine = false; L.rx = null; L.rxRound = null; clearTimeout(L.t); }
  rxLocal();
  const view = VIEWS[S.view] ? S.view : 'home';
  const hadSheet = !!$app.querySelector('.sheet');
  const prevFocus = focusKey();
  $app.innerHTML = VIEWS[view]() + (S.sheet ? `<div class="scrim" data-act="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Detalles" tabindex="-1">${S.sheet}</div>` : '');
  restoreFocus(prevFocus, view, hadSheet);
  announce();
  renderedView = view;
  sync();
}

// The whole screen is redrawn on every change, so put keyboard focus back where it was:
// on the same control if it still exists, on the open sheet, or on the new screen's title.
let renderedView = null;
const sel = (k, v) => `[${k}="${CSS.escape(v)}"]`;
function focusKey() {
  const a = document.activeElement;
  if (!a || !$app.contains(a)) return null;
  if (a.id) return '#' + CSS.escape(a.id);
  if (a.dataset.act) return sel('data-act', a.dataset.act) + (a.dataset.arg != null ? sel('data-arg', a.dataset.arg) : '');
  if (a.dataset.tap) return sel('data-tap', a.dataset.tap);
  return null;
}
let sheetOpener = null;
function restoreFocus(key, view, hadSheet) {
  const opt = { preventScroll: true };
  if (S.focus) { const el = document.getElementById(S.focus); S.focus = null; if (el) { el.focus(); return; } }
  const sheet = $app.querySelector('.sheet');
  if (sheet && !hadSheet) { sheetOpener = key; sheet.focus(opt); return; }
  if (!sheet && hadSheet) {
    const opener = sheetOpener && $app.querySelector(sheetOpener);
    sheetOpener = null;
    if (opener) { opener.focus(opt); return; }
    key = key || 'sheet';
  }
  const same = key && key !== 'sheet' && $app.querySelector(key);
  if (same && (!sheet || sheet.contains(same))) { same.focus(opt); return; }
  if (!key || sheet) return;
  // The control that had focus is gone: land on what replaced it (the new card or result), or the screen title.
  const order = view === renderedView ? ['.card', '.verdict', '.shout', '.count', '.top-title', 'h1', 'h2'] : ['.top-title', 'h1', 'h2'];
  const target = order.map(s => $app.querySelector(s)).find(Boolean);
  if (target) { target.tabIndex = -1; target.focus(opt); }
}
// Read the new card, result or countdown aloud for screen reader users.
const $live = document.getElementById('live');
let lastSaid = '';
function announce() {
  const el = $app.querySelector('.sheet, .verdict, .shout, .count, .card');
  const t = el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  if (t && t !== lastSaid) { lastSaid = t; $live.textContent = t; }
}

// Android hardware back / browser back returns to the menu.
function go(view) {
  clearClock();
  S.sheet = null;
  if (online() && view === 'players') view = 'room';
  if (S.view === 'home' && view !== 'home') history.pushState({ app: 1 }, '');
  S.view = view;
  render();
  window.scrollTo(0, 0);
}
function back() {
  if (S.view === 'play') { go('intro'); return; }
  if (history.state && history.state.app) history.back(); else go('home');
}
function askLeave() {
  S.sheet = `<h3>${isHost() ? '¿Cerrar la sala?' : '¿Salir de la sala?'}</h3>
    <p class="sub">${isHost() ? 'Se acaba la partida para todos los móviles.' : 'Podrás volver a entrar con el mismo código.'}</p>
    <div class="duo"><button class="btn alt" data-act="close-sheet">Cancelar</button><button class="btn hot" data-act="leave">${isHost() ? 'Cerrar' : 'Salir'}</button></div>`;
  render();
}
window.addEventListener('popstate', () => {
  if (S.sheet) { S.sheet = null; history.pushState({ app: 1 }, ''); render(); return; }
  if (online() && !isHost()) { history.pushState({ app: 1 }, ''); askLeave(); return; }
  clearClock(); S.view = 'home'; render();
});

// ---------- actions ----------
const G = () => gameById(S.game);
const A = {
  adult() { store.set('adult', true); sound.win(); go('home'); openDeepLink(); },
  level(k) {
    if (!LEVELS[k] || (online() && !isHost())) return;
    S.level = k; store.set('level', k); sound.click(); render();
  },
  ckind(k) { if (BASE[k]) { S.cardKind = k; sound.click(); render(); } },
  'add-card'(form) {
    let t = form.t.value.trim();
    if (S.cardKind === 'nunca') t = t.replace(/^yo nunca\s*/i, '');
    t = t.replace(/\.+$/, '');
    if (!t) return;
    (S.custom[S.cardKind] = S.custom[S.cardKind] || []).push(t);
    store.set('custom', S.custom); sound.click();
    S.form.cardtxt = ''; S.focus = 'cardtxt'; render();
  },
  'del-card'(i) { S.custom[S.cardKind].splice(+i, 1); store.set('custom', S.custom); sound.click(); render(); },
  async 'share-img'(_, el) {
    if (el) el.textContent = 'Preparando la imagen…';
    const cv = await summaryImage();
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    if (el) el.textContent = 'Compartir en historias';
    if (!blob) return;
    const file = new File([blob], 'previa-resumen.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Previa', text: `Así ha ido la previa. Juega gratis: ${SITE}` }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'previa-resumen.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
  'new-night'() {
    if (online() && !isHost()) return;
    S.players.forEach(p => p.score = 0); savePlayers(); sound.win(); go('home');
  },
  async 'room-invite'(_, el) {
    const url = `${shareBase()}?sala=${net.code}`;
    const text = `Únete a mi previa con el código ${net.code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Previa', text, url }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(`${text}: ${url}`); if (el) el.textContent = 'Enlace copiado'; } catch {}
  },
  nav(v) { sound.click(); go(v); },
  back() {
    sound.click();
    if (online() && !isHost()) return askLeave();
    if (S.view === 'room') return go('home');
    back();
  },
  toggle(k) {
    if (k === 'sound') { sound.on = !sound.on; store.set('sound', sound.on); sound.click(); }
    else { S.sober = !S.sober; store.set('sober', S.sober); sound.click(); }
    render();
  },
  wipe() {
    S.sheet = `<h3>¿Borrar todo?</h3><p class="sub">Se quitan el grupo, el marcador y los ajustes de este dispositivo.</p><div class="duo"><button class="btn alt" data-act="close-sheet">Cancelar</button><button class="btn hot" data-act="wipe-yes">Borrar</button></div>`;
    render();
  },
  'wipe-yes'() {
    S.sheet = null;
    if (online()) leave();
    try { Object.keys(localStorage).filter(k => k.startsWith('previa:')).forEach(k => localStorage.removeItem(k)); } catch {}
    S.players = []; S.sober = false; sound.on = true; S.form.myname = ''; S.view = 'gate'; render();
  },
  add(form) {
    const v = form.n.value.trim();
    if (!v) return;
    S.players.push({ name: v, score: 0 }); savePlayers(); sound.click();
    S.form.pname = ''; S.focus = 'pname'; render();
  },
  del(i) { S.players.splice(+i, 1); savePlayers(); sound.click(); render(); },
  score(arg) { const [i, d] = arg.split(':').map(Number); addPen(i, d); sound.click(); render(); },
  'reset-score'() { S.players.forEach(p => p.score = 0); savePlayers(); sound.click(); render(); },
  open(id) { sound.click(); S.game = id; go('intro'); },
  start() {
    sound.win(); lastCard = null;
    G().start(); S.g.rid = Date.now();
    go('play');
    if (G().clock) G().clock();
  },
  restart() {
    clearClock(); sound.flip();
    G().start(); S.g.rid = Date.now();
    if (G().clock) G().clock();
    render(); window.scrollTo(0, 0);
  },
  rules() { S.sheet = `<h3>${G().title}</h3><ol class="rules">${G().rules().map(r => `<li>${r}</li>`).join('')}</ol><button class="btn" data-act="close-sheet">Seguir jugando</button>`; render(); },
  'close-sheet'() { S.sheet = null; render(); },
  countdown() {
    if (S.g.cd != null) return;
    if (S.game === 'mentira' && !canAct(S.g.turn, ACTOR)) return;
    countdown();
  },
  'loc-mine'() { sound.flip(); L.mine = !L.mine; render(); },

  // rooms
  'room-create'() {
    const nm = (S.form.myname || '').trim();
    if (!nm) { S.netErr = 'Escribe tu nombre para que los demás sepan quién eres.'; S.focus = 'myname'; render(); return; }
    store.set('myname', nm); sound.click(); createRoom(nm);
  },
  'room-join'() {
    const nm = (S.form.myname || '').trim(), code = (S.form.code || '').toUpperCase();
    if (!nm) { S.netErr = 'Escribe tu nombre para que los demás sepan quién eres.'; S.focus = 'myname'; render(); return; }
    if (code.length !== 4) { S.netErr = 'El código tiene 4 letras o números.'; S.focus = 'code'; render(); return; }
    store.set('myname', nm); sound.click(); joinRoom(nm, code);
  },
  'room-copy'(_, el) {
    const done = () => { if (el) el.textContent = 'Copiado'; };
    try { navigator.clipboard.writeText(net.code).then(done, () => {}); } catch {}
  },
  'room-kick'(i) {
    const p = S.players[+i];
    if (!isHost() || !p || !p.off || +i === 0) return;
    S.players.splice(+i, 1); render();
  },
  'ask-leave'() { askLeave(); },
  leave() { leave(); },
  rejoin() {
    const code = net.code, nm = store.get('myname', '') || 'Sin nombre';
    cleanup(); S.sheet = null; S.view = 'online';
    joinRoom(nm, code);
  },

  // misión
  'm-show'() { sound.flip(); S.g.shown = true; render(); },
  'm-next'() {
    const g = S.g; sound.click(); g.shown = false;
    if (g.i + 1 < S.players.length) { g.i++; render(); return; }
    g.phase = 'play'; sound.win(); render();
    misionClock();
  },
  'm-topic'() { sound.flip(); S.g.topic = draw('topic', TOPICS); render(); },
  'm-peek'(i) {
    const m = S.g.m[+i];
    S.sheet = `<span class="eyebrow">Misión de ${name(+i)}</span><p class="sheet-what">${esc(m.what)}</p><p class="sheet-when">${esc(m.when[0].toUpperCase() + m.when.slice(1))}</p><button class="btn" data-act="close-sheet">Ocultar</button>`;
    render();
  },
  'm-end'() { if (S.g.phase !== 'play') return; clearClock(); sound.boom(); S.g.phase = 'reveal'; render(); },
  'm-mark'(arg) {
    const [i, st] = String(arg).split(':'); const g = S.g;
    const prev = g.marks[i];
    g.marks[i] = prev === st ? null : st;
    if (prev === 'caught') addPen(+i, -2);
    if (g.marks[i] === 'caught') addPen(+i, 2);
    sound.click(); render();
  },

  // verdad o reto
  'v-pick'(k) {
    const g = S.g;
    if (g.card || !canAct(g.turn, ACTOR)) return;
    sound.flip(); g.kind = k === 't' ? 't' : 'd';
    g.card = g.kind === 't' ? draw('t', deck('verdad')) : draw('d', deck('reto'));
    render();
  },
  // The group vetoes a card that goes too far: new card, no penalty.
  'v-veto'() {
    const g = S.g;
    if (!g.card) return;
    sound.flip();
    g.card = g.kind === 't' ? draw('t', deck('verdad')) : draw('d', deck('reto'));
    g.vetos = (g.vetos || 0) + 1;
    render();
  },
  'v-done'(r) {
    const g = S.g;
    if (!g.card || !canAct(g.turn, ACTOR)) return;
    if (r === 'no') { addPen(g.turn, g.card.n); sound.boom(); } else sound.win();
    g.turn = nextOn(g.turn); g.card = null; render();
  },

  // yo nunca
  'n-next'() { sound.flip(); S.g.cur = txt(draw('n', deck('nunca'))); S.g.n++; render(); },

  // probable / esto
  'p-next'() { clearClock(); sound.flip(); S.g.cur = draw('p', PROBABLE); S.g.cd = null; render(); },
  'e-next'() { clearClock(); sound.flip(); S.g.cur = draw('e', PAIRS); S.g.cd = null; render(); },

  // mentira
  'l-topic'() { if (!canAct(S.g.turn, ACTOR)) return; sound.flip(); S.g.topic = draw('t', LIE_TOPICS); render(); },
  'l-next'() { if (!canAct(S.g.turn, ACTOR) || S.g.cd !== 0) return; sound.flip(); S.g.turn = nextOn(S.g.turn); S.g.topic = draw('t', LIE_TOPICS); S.g.cd = null; render(); },

  // bomba
  'b-cat'() { if (S.g.state !== 'idle') return; sound.flip(); S.g.cat = draw('c', CATS); render(); },
  'b-light'() {
    const g = S.g;
    if (g.state !== 'idle') return;
    g.state = 'running'; render();
    const total = 15000 + Math.random() * 25000, t0 = performance.now();
    const loop = () => {
      const el = performance.now() - t0;
      if (el >= total) { g.state = 'boom'; addPen(g.holder, 3); sound.boom(); render(); return; }
      sound.tick(600 + 700 * el / total); sync();
      after(Math.max(130, 850 * (1 - el / total)), loop);
    };
    loop();
  },
  'b-pass'() {
    const g = S.g;
    if (g.state !== 'running') return;
    if (online() && ACTOR !== mod(g.holder)) return;
    g.holder = mod(nextOn(g.holder)); sound.click(); render();
  },
  'b-again'() { if (S.g.state !== 'boom') return; sound.flip(); S.g.cat = draw('c', CATS); S.g.state = 'idle'; render(); },

  // paranoia
  'pa-show'() { sound.flip(); S.g.shown = true; render(); },
  'pa-pick'(i) {
    const g = S.g;
    if (g.phase !== 'ask' || !canAct(g.turn, ACTOR) || !S.players[+i] || +i === mod(g.turn)) return;
    g.target = +i; g.phase = 'said'; sound.flip(); render();
  },
  'pa-open'() {
    const g = S.g;
    if (g.phase !== 'said' || g.open) return;
    if (online() && ACTOR !== mod(g.target) && ACTOR !== 0) return;
    addPen(g.target, 2); g.open = true; sound.boom(); render();
  },
  'pa-next'() {
    const g = S.g;
    if (g.phase !== 'said') return;
    Object.assign(g, { phase: 'ask', turn: nextOn(g.turn), shown: false, target: null, open: false });
    g.q = draw('q', PARANOIA); sound.click(); render();
  },

  // impostor
  'i-show'() { sound.flip(); S.g.shown = true; render(); },
  'i-next'() {
    const g = S.g; sound.click(); g.shown = false;
    if (g.i + 1 < S.players.length) g.i++; else g.phase = 'talk';
    render();
  },
  'i-reveal'() { if (S.g.phase !== 'talk') return; sound.boom(); S.g.phase = 'reveal'; render(); },

  // mayor o menor
  'h-guess'(dir) {
    const g = S.g;
    if (!canAct(g.turn, ACTOR)) return;
    if (!g.deck.length) g.deck = newDeck();
    const next = g.deck.pop();
    const ok = dir === 'high' ? next.v > g.cur.v : next.v < g.cur.v;
    const who = name(g.turn);
    if (!ok) {
      addPen(g.turn, 2); sound.boom();
      g.msg = `${next.v === g.cur.v ? 'Igual. ' : 'Fallo. '}${pen(2)} para ${who}.`; g.tone = 'bad';
      g.streak = 0; g.turn = nextOn(g.turn);
    } else if (++g.streak === 3) {
      sound.win(); g.msg = `Tres seguidas. ${who} reparte ${pen(3)}.`; g.tone = 'good';
      g.streak = 0; g.turn = nextOn(g.turn);
    } else { sound.flip(); g.msg = 'Bien. Otra.'; g.tone = 'good'; }
    g.prev = g.cur; g.cur = next; render();
  },

  // copa del rey
  'c-draw'() {
    const g = S.g;
    if (g.cur || g.over || !canAct(g.turn, ACTOR)) return;
    if (!g.deck.length) g.deck = newDeck();
    g.cur = g.deck.pop(); sound.flip();
    if (g.cur.v === 13 && ++g.kings === 4) { sound.boom(); g.over = true; }
    render();
  },
  'c-next'() { const g = S.g; if (!g.cur || !canAct(g.turn, ACTOR)) return; sound.click(); g.cur = null; g.turn = nextOn(g.turn); render(); },

  // reflejos, un móvil
  rx() {
    const g = S.g, n = S.players.length;
    if (g.phase === 'ready') {
      g.phase = 'wait'; render();
      after(1200 + Math.random() * 3000, () => { g.phase = 'go'; g.tGo = performance.now(); sound.tick(1200); render(); });
    } else if (g.phase === 'wait') {
      clearClock(); g.times[g.i] = null; g.phase = 'early'; sound.boom(); render();
    } else if (g.phase === 'go') {
      g.times[g.i] = Math.round(performance.now() - g.tGo); g.phase = 'done'; sound.click(); render();
    } else {
      g.i++;
      if (g.i < n) { g.phase = 'ready'; render(); return; }
      const rank = rxRank(g.times, S.players.map((_, i) => i));
      addPen(rank[rank.length - 1].i, 2);
      g.phase = 'results'; sound.win(); render();
    }
  },
  // reflejos, sala: el anfitrión arranca la ronda y cada móvil mide su propio tiempo
  'rx-start'() {
    const g = S.g;
    if (g.phase === 'wait') return;
    g.phase = 'wait'; g.round++; g.delay = 1500 + Math.round(Math.random() * 3000); g.times = {}; g.parts = active();
    sound.click(); render();
  },
  'loc-rx'() {
    if (L.rx === 'wait') { clearTimeout(L.t); L.rx = 'early'; sound.boom(); dispatch('rx-time', 'early'); render(); }
    else if (L.rx === 'go') { L.ms = Math.round(performance.now() - L.tGo); L.rx = 'done'; sound.click(); dispatch('rx-time', L.ms); render(); }
  },
  'rx-time'(t) {
    const g = S.g;
    if (g.phase !== 'wait' || !g.parts.includes(ACTOR) || g.times[ACTOR] != null) return;
    g.times[ACTOR] = t === 'early' ? 'early' : Math.max(0, +t || 0);
    if (g.parts.every(i => g.times[i] != null)) A['rx-finish']();
    else render();
  },
  'rx-finish'() {
    const g = S.g;
    if (g.phase !== 'wait') return;
    const rank = rxRank(g.times, g.parts);
    addPen(rank[rank.length - 1].i, 2);
    g.phase = 'results'; sound.win(); render();
  },

  // ruleta
  'r-spin'() {
    const g = S.g, n = S.players.length;
    if (g.spinning) return;
    const on = active();
    g.spinning = true; g.res = null; render();
    let k = rand(on.length), steps = 16 + rand(on.length * 2), d = 55;
    const step = () => {
      k = (k + 1) % on.length;
      g.flash = on[k];
      const e = document.getElementById('spin'); if (e) e.textContent = S.players[on[k]].name;
      sound.tick(900); sync();
      if (--steps > 0) { d *= 1.12; after(d, step); return; }
      const r = pick(ROULETTE);
      g.who = on[k]; g.res = r.t(); g.spinning = false;
      if (r.self) addPen(g.who, r.self);
      sound.win(); render();
    };
    after(d, step);
  },

  // mímica
  'mi-go'() {
    const g = S.g;
    if (g.phase !== 'ready' || !canAct(mimicaActor(g), ACTOR)) return;
    g.phase = 'play'; g.left = 60; g.got = 0; g.word = draw('w', MIMICA); sound.win(); render();
    every(1000, () => {
      g.left--;
      if (g.left <= 0) { clearClock(); g.scores[g.team] += g.got; g.phase = 'end'; sound.boom(); render(); return; }
      if (g.left <= 5) sound.tick();
      const c = document.getElementById('clock'); if (c) c.textContent = fmt(g.left);
      sync();
    });
  },
  'mi-word'(r) {
    const g = S.g;
    if (g.phase !== 'play' || (online() && ACTOR !== mimicaActor(g))) return;
    if (r === 'ok') { g.got++; sound.win(); } else sound.click();
    g.word = draw('w', MIMICA); render();
  },
  'mi-swap'() { const g = S.g; if (g.phase !== 'end') return; g.actor[g.team]++; g.team = 1 - g.team; g.phase = 'ready'; sound.click(); render(); }
};

// Guests send game actions to the host; everything else runs on this device.
function dispatch(act, arg, el) {
  if (!A[act]) return;
  if (online() && !isHost() && GAME_ACT.test(act)) {
    if (net.host && net.host.open) { try { net.host.send({ t: 'act', a: act, arg }); } catch {} }
    if (!/^(rx-time)$/.test(act)) sound.click();
    return;
  }
  ACTOR = meIdx();
  A[act](arg, el);
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  dispatch(el.dataset.act, el.dataset.arg, el);
});
// Reaction-sensitive buttons fire on touch-down rather than click.
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-tap]');
  if (!el) return;
  e.preventDefault();
  dispatch(el.dataset.tap, el.dataset.arg, el);
});
document.addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (A[f.dataset.submit]) A[f.dataset.submit](f);
});
// Keep typed text across re-renders.
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'code') {
    const v = t.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (v !== t.value) t.value = v;
    S.form.code = v;
  } else if (t.id === 'myname' || t.id === 'pname' || t.id === 'cardtxt') S.form[t.id] = t.value;
});

// ?sala=ABCD opens the join screen with the code filled in; ?juego=nunca opens that game.
(() => {
  const q = new URLSearchParams(location.search);
  const sala = (q.get('sala') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const juego = q.get('juego');
  if (!sala && !juego) return;
  history.replaceState(null, '', location.pathname);
  S.pending = { sala, juego };
})();
function openDeepLink() {
  const p = S.pending;
  S.pending = null;
  if (!p) return;
  if (p.sala) { S.form.code = p.sala; go('online'); }
  else if (p.juego && gameById(p.juego)) { S.game = p.juego; go('intro'); }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.sheet) { e.preventDefault(); S.sheet = null; render(); return; }
  // Keep Tab inside an open sheet.
  if (e.key === 'Tab' && S.sheet) {
    const sheet = $app.querySelector('.sheet');
    const f = sheet ? [...sheet.querySelectorAll('button, [href], input')] : [];
    if (f.length) {
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!sheet.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
    return;
  }
  if (e.key !== 'Enter') return;
  if (e.target.id === 'code') dispatch('room-join');
  else if (e.target.id === 'myname' && !S.form.code) e.target.blur();
});

render();
if (S.view === 'home') openDeepLink();
