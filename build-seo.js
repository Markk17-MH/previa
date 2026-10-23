// Generates the search landing pages (one per topic people search for) and sitemap.xml.
// Run: node build-seo.js
const fs = require('fs');
const path = require('path');

const SITE = 'https://markk17-mh.github.io/previa/';
const TODAY = new Date().toISOString().slice(0, 10);

const PAGES = [
  {
    file: 'juegos-para-previas.html',
    title: 'Juegos para previas: 14 ideas para antes de salir',
    desc: 'Los mejores juegos para la previa con amigos: Yo nunca, Verdad o reto, El impostor, La bomba, Paranoia y más. Gratis, en el móvil y sin descargar nada.',
    h1: 'Juegos para previas',
    lede: 'La previa es el rato antes de salir en el que se decide si la noche va a ser memorable. Estos son los juegos que mejor funcionan en grupo, ordenados según el momento.',
    sections: [
      { h: 'Para romper el hielo', p: 'Cuando todavía no conoces a todo el mundo, empieza con juegos de risa rápida y sin preguntas comprometidas.', list: [
        '<b>Esto o aquello:</b> dos opciones y a la de tres todos señalan. La minoría pierde.',
        '<b>La bomba:</b> sale una categoría, dices una palabra y pasas el móvil antes de que explote.',
        '<b>Reflejos:</b> toca la pantalla cuando se ponga verde. El más lento lo paga.',
        '<b>Mímica por equipos:</b> sesenta segundos para hacer acertar todo lo que puedas sin hablar.'
      ] },
      { h: 'Cuando el grupo ya está suelto', p: 'Con confianza, lo que más engancha son los juegos de revelar cosas y señalar a los demás.', list: [
        '<b>Yo nunca:</b> quien lo haya hecho, lo paga. Las explicaciones son opcionales.',
        '<b>Quién es más probable:</b> a la de tres todos señalan a alguien.',
        '<b>Paranoia:</b> alguien lee una pregunta en secreto y contesta en voz alta solo con un nombre.',
        '<b>Dos verdades y una mentira:</b> el grupo tiene que oler cuál te has inventado.'
      ] },
      { h: 'Para el final de la previa', p: 'Juegos largos con cartas y normas que se acumulan, para cuando nadie tiene prisa.', list: [
        '<b>La copa del rey:</b> cada carta tiene su norma y el cuarto rey se lleva la copa.',
        '<b>Mayor o menor:</b> adivina si la siguiente carta es más alta. Tres seguidas y repartes.',
        '<b>Misión secreta:</b> cada uno tiene una acción y el momento exacto para hacerla sin que le pillen.',
        '<b>El impostor:</b> todos saben la palabra menos uno, que tiene que disimular.'
      ] }
    ],
    tip: 'En Previa puedes jugar a todos con un solo móvil o crear una sala para que cada uno juegue desde el suyo con un código de cuatro letras.',
    play: '',
    faq: [
      ['¿Cuántas personas hacen falta?', 'La mayoría de juegos funcionan desde dos o tres personas. Mímica necesita al menos cuatro para hacer dos equipos.'],
      ['¿Hay que descargar algo?', 'No. Previa funciona en el navegador del móvil y es gratis.'],
      ['¿Se puede jugar sin alcohol?', 'Sí. En los ajustes hay un modo sin alcohol que cambia los tragos por puntos.']
    ]
  },
  {
    file: 'yo-nunca-preguntas.html',
    title: 'Preguntas de Yo nunca: más de 40 frases para jugar',
    desc: 'Preguntas de Yo nunca para la previa: suaves, clásicas y atrevidas. Cómo se juega y una app gratis con las frases listas para usar.',
    h1: 'Preguntas de Yo nunca',
    lede: 'Yo nunca es el juego más sencillo de la previa: alguien dice una frase que empieza por «yo nunca» y quien sí lo haya hecho tiene que pagarlo. Aquí tienes frases para cada nivel.',
    sections: [
      { h: 'Cómo se juega', p: 'Por turnos, cada persona lee una frase en voz alta. Quien lo haya hecho bebe o se apunta un punto. Lo mejor viene después: pedir explicaciones.' },
      { h: 'Frases suaves', p: 'Para empezar o con gente que acabas de conocer.', list: [
        'Yo nunca he fingido no ver a alguien por la calle.',
        'Yo nunca he usado la excusa de «me he quedado sin batería».',
        'Yo nunca he salido de casa en pijama a comprar.',
        'Yo nunca he cantado en un karaoke delante de desconocidos.',
        'Yo nunca he dado un like sin querer a una foto antigua.',
        'Yo nunca he ido a clase o a trabajar sin dormir.',
        'Yo nunca he perdido el móvil de fiesta.',
        'Yo nunca me he quedado dormido en una fiesta.'
      ] },
      { h: 'Frases clásicas', p: 'Las de toda la vida, para cuando el grupo ya tiene confianza.', list: [
        'Yo nunca he mirado el móvil de mi pareja a escondidas.',
        'Yo nunca he mandado un mensaje a las 4 de la mañana del que me arrepentí.',
        'Yo nunca he hecho ghosting.',
        'Yo nunca he stalkeado a un ex hasta fotos de hace años.',
        'Yo nunca he dicho «te quiero» sin sentirlo.',
        'Yo nunca he tenido una cita a ciegas.',
        'Yo nunca he llorado en una discoteca.',
        'Yo nunca me he enamorado de alguien en una noche.'
      ] },
      { h: 'Frases atrevidas', p: 'Solo para grupos con mucha confianza y mayores de edad.', list: [
        'Yo nunca me he liado con el ex de un amigo o amiga.',
        'Yo nunca he pensado en alguien de este grupo de forma poco inocente.',
        'Yo nunca he tenido una cita con dos personas el mismo día.',
        'Yo nunca me he liado con alguien sin saber su nombre.',
        'Yo nunca he ligado con alguien de esta habitación.'
      ] }
    ],
    tip: 'En la app tienes todas estas frases y más, sin repetir, con tres niveles de intensidad. También puedes añadir las vuestras en «Tus cartas».',
    play: 'nunca',
    faq: [
      ['¿Hay que beber obligatoriamente?', 'No. Se puede jugar con puntos y al final el que más tenga cumple un castigo que elija el grupo.'],
      ['¿Cuántas frases tiene la app?', 'Más de cuarenta, separadas en tres niveles, y puedes añadir las tuyas.']
    ]
  },
  {
    file: 'verdad-o-reto-online.html',
    title: 'Verdad o reto online: preguntas y retos para la previa',
    desc: 'Juega a Verdad o reto online gratis: preguntas comprometidas, retos divertidos y un veto para cuando alguna se pasa. En un móvil o cada uno en el suyo.',
    h1: 'Verdad o reto online',
    lede: 'El clásico de siempre, pero sin tener que inventarse las preguntas. En tu turno eliges verdad o reto y la app saca una carta.',
    sections: [
      { h: 'Cómo se juega en Previa', list: [
        'En tu turno eliges <b>verdad</b> o <b>reto</b>.',
        'Si cumples, pasa el turno. Si te niegas, te llevas el castigo que marca la carta.',
        'Si al grupo le parece demasiado fuerte, puede <b>vetarla</b> y sale otra sin castigo.',
        'Con una sala online, solo quien tiene el turno ve los botones en su móvil.'
      ] },
      { h: 'Ejemplos de verdades', list: [
        '¿Cuál es la mentira más gorda que les has contado a tus padres para salir?',
        '¿A quién de este grupo bloquearías una semana si pudieras?',
        '¿Qué es lo primero que miras en alguien que te gusta?',
        '¿Cuál ha sido tu momento más ridículo intentando ligar?',
        '¿Qué secreto de alguien de este grupo conoces y nadie más sabe? Sin decir de quién.'
      ] },
      { h: 'Ejemplos de retos', list: [
        'Baila treinta segundos encima de una silla sin música.',
        'Enseña al grupo la última foto de tu galería.',
        'Habla con acento argentino hasta tu próximo turno.',
        'Haz una foto de grupo en diez segundos con la pose más absurda posible.',
        'Lee en voz alta el último mensaje que has enviado.'
      ] }
    ],
    tip: 'Elige el nivel antes de empezar: Suave para gente nueva, Clásico para el grupo de siempre y Atrevido solo con mucha confianza.',
    play: 'verdad',
    faq: [
      ['¿Se puede jugar cada uno desde su móvil?', 'Sí. Uno crea una sala y el resto entra con el código o con el enlace de invitación.'],
      ['¿Puedo añadir mis propios retos?', 'Sí, en Ajustes, en «Tus cartas».']
    ]
  },
  {
    file: 'juegos-para-previas-sin-alcohol.html',
    title: 'Juegos para previas sin alcohol',
    desc: 'Juegos para la previa sin alcohol: los mismos juegos de siempre con puntos en lugar de tragos. Gratis, en el móvil y para grupos.',
    h1: 'Juegos para previas sin alcohol',
    lede: 'No hace falta beber para que la previa sea buena. Todos los juegos de Previa funcionan igual con puntos en lugar de tragos, y al final quien más tenga cumple el castigo que elija el grupo.',
    sections: [
      { h: 'Cómo funciona el modo sin alcohol', list: [
        'Actívalo en Ajustes o al abrir la app por primera vez.',
        'Los tragos se convierten en puntos y se apuntan solos en el marcador.',
        'Las cartas que solo tienen sentido bebiendo desaparecen.',
        'Al cerrar la previa, la app enseña quién se lleva la corona y puedes compartirlo en historias.'
      ] },
      { h: 'Los que mejor funcionan sin beber', list: [
        '<b>Mímica:</b> por equipos y contra el reloj.',
        '<b>Reflejos:</b> se mide en milisegundos quién es más rápido.',
        '<b>El impostor:</b> todo es cuestión de disimular.',
        '<b>Paranoia:</b> la tensión de no saber qué pregunta era.',
        '<b>Esto o aquello:</b> perfecto para conocer a gente nueva.'
      ] }
    ],
    tip: 'Ideas de castigo para el que pierda: elegir la música de la noche, invitar a la primera ronda de refrescos o subir la foto que decida el grupo.',
    play: '',
    faq: [
      ['¿Es apto para menores?', 'No. Previa tiene preguntas picantes y es solo para mayores de 18, aunque se juegue sin alcohol.']
    ]
  }
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const page = p => {
  const url = SITE + p.file;
  const others = PAGES.filter(o => o !== p).map(o => `<a href="${o.file}">${o.h1}</a>`).join('');
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };
  const cta = p.play ? `index.html?juego=${p.play}` : 'index.html';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0a0e" />
  <title>${esc(p.title)} · Previa</title>
  <meta name="description" content="${esc(p.desc)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="es_ES" />
  <meta property="og:site_name" content="Previa" />
  <meta property="og:title" content="${esc(p.title)}" />
  <meta property="og:description" content="${esc(p.desc)}" />
  <meta property="og:url" content="${url}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=Tilt+Neon&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(faqLd)}</script>
  <style>
    :root { color-scheme: dark; --bg: #0c0a0e; --cream: #f6f0e8; --muted: #aaa2ad; --dim: #918996; --edge: rgba(255,255,255,.11); --pink: #ff4fa0; --mustard: #ffbe3b; --ink: #160a10; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg) radial-gradient(90vmax 70vmax at 0% 0%, rgba(255,79,160,.16), transparent 60%); color: var(--cream); font: 17px/1.6 'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    main { max-width: 680px; margin: 0 auto; padding: 28px max(18px, env(safe-area-inset-right, 0px)) 56px max(18px, env(safe-area-inset-left, 0px)); }
    .brand { font-family: 'Tilt Neon', sans-serif; font-size: 32px; color: #ffe3f0; text-decoration: none; text-shadow: 0 0 8px var(--pink), 0 0 22px var(--pink); }
    h1 { font-size: clamp(36px, 8vw, 54px); line-height: 1.02; letter-spacing: -0.035em; margin: 28px 0 14px; text-wrap: balance; }
    h2 { font-size: 24px; letter-spacing: -0.02em; margin: 36px 0 8px; }
    p, li { color: #d8d0d9; }
    .lede { font-size: 19px; color: var(--muted); }
    ul { padding-left: 1.2em; } li { margin: 6px 0; } li::marker { color: var(--pink); }
    b { color: var(--cream); }
    .cta { display: inline-flex; align-items: center; justify-content: center; min-height: 54px; padding: 0 26px; margin: 18px 0 6px; border-radius: 16px; background: var(--pink); color: var(--ink); font-weight: 800; text-decoration: none; box-shadow: 0 0 24px -4px var(--pink); }
    .cta:focus-visible { outline: 2px solid var(--cream); outline-offset: 3px; }
    .tip { border: 1px solid var(--edge); border-radius: 18px; padding: 16px 18px; background: rgba(255,255,255,.04); margin-top: 32px; }
    dl dt { font-weight: 700; margin-top: 16px; } dl dd { margin: 4px 0 0; color: var(--muted); }
    nav.more { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--edge); }
    nav.more a, footer a { color: var(--muted); display: inline-flex; align-items: center; min-height: 44px; }
    a:focus-visible { outline: 2px solid var(--pink); outline-offset: 2px; }
    footer { color: var(--dim); font-size: 14px; margin-top: 28px; }
  </style>
</head>
<body>
  <main>
    <a class="brand" href="index.html">Previa.</a>
    <h1>${p.h1}</h1>
    <p class="lede">${p.lede}</p>
    <a class="cta" href="${cta}">Jugar gratis ahora</a>
    ${p.sections.map(s => `<h2>${s.h}</h2>${s.p ? `<p>${s.p}</p>` : ''}${s.list ? `<ul>${s.list.map(li => `<li>${li}</li>`).join('')}</ul>` : ''}`).join('\n    ')}
    <p class="tip">${p.tip}</p>
    <h2>Preguntas frecuentes</h2>
    <dl>${p.faq.map(([q, a]) => `<dt>${q}</dt><dd>${a}</dd>`).join('')}</dl>
    <a class="cta" href="${cta}">Abrir Previa</a>
    <nav class="more" aria-label="Más guías">${others}</nav>
    <footer>Previa es para mayores de 18. Bebe con moderación y nunca conduzcas si has bebido. <a href="privacidad.html">Privacidad</a></footer>
  </main>
</body>
</html>
`;
};

for (const p of PAGES) fs.writeFileSync(path.join(__dirname, p.file), page(p));

const urls = ['', 'privacidad.html', ...PAGES.map(p => p.file)];
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </url>`).join('\n')}
</urlset>
`);
console.log(`Wrote ${PAGES.length} pages and sitemap.xml`);
