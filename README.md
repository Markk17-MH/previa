# Previa

Juegos para la previa: con un solo móvil para todo el grupo o cada uno en el suyo, uniéndose a una sala con un código. Trece juegos, modo sin alcohol y sin registro.

Es una web estática: abre `index.html` en el navegador y funciona. No necesita servidor ni compilación. Las salas online usan WebRTC con PeerJS (servidor público gratuito para que los móviles se encuentren). Para probarlas, sirve la carpeta con un servidor local (por ejemplo `npx http-server`) y ábrela en dos pestañas o dos dispositivos.

- `index.html`: la app entera.
- `privacidad.html`: política de privacidad (necesaria para Google Play y el App Store).
- `GUIA_PUBLICACION.md`: cómo subirla a las tiendas con Capacitor.
- `build-seo.js`: genera las páginas para buscadores (`juegos-para-previas.html`, `yo-nunca-preguntas.html`, etc.) y `sitemap.xml`. Ejecuta `node build-seo.js` después de cambiar sus textos.
- `build-web.js`: genera `web/previa.html` para publicarla como Artifact de claude.ai.

Enlaces directos: `?sala=ABCD` abre la pantalla para entrar en esa sala y `?juego=nunca` abre ese juego.
- `index.original.html`: la versión anterior, por si hace falta volver.

## Verla online con GitHub Pages

En el repositorio: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**. En un par de minutos queda en `https://<tu-usuario>.github.io/previa/`.
