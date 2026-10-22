# Cómo publicar Previa en Google Play y en el App Store

Previa es una web (un solo `index.html`). Para subirla a las tiendas hay que meterla dentro de una app nativa. La forma más sencilla es **Capacitor** (de los creadores de Ionic): coge tu HTML y genera un proyecto Android y otro iOS de verdad.

> Las normas y precios de las tiendas cambian. Lo que pone aquí era lo vigente a finales de 2026; repásalo en las páginas oficiales antes de pagar nada.

---

## 0. Antes de empezar

| Qué | Android | iOS |
|---|---|---|
| Cuenta de desarrollador | Google Play Console: **25 USD**, pago único | Apple Developer Program: **99 USD/año** |
| Ordenador | Windows vale | **Hace falta un Mac con Xcode** (o un Mac en la nube, ver paso 4.1) |
| Programas | Node.js (ya lo tienes) + Android Studio | Node.js + Xcode + CocoaPods |
| Tiempo de revisión | De horas a 7 días, **más 14 días de prueba cerrada** si tu cuenta es personal y nueva | 1 a 3 días normalmente |

Además necesitas, para las dos tiendas:

- **Política de privacidad en una URL pública.** Ya la tienes en `privacidad.html`. Cambia `TU_EMAIL_DE_CONTACTO` por tu email y súbela gratis a GitHub Pages o a Netlify Drop (arrastras la carpeta y te da una URL).
- **Un icono** de 1024×1024 px, PNG, sin transparencias y sin esquinas redondeadas (las tiendas las redondean solas).
- **Capturas de pantalla** del móvil (ver pasos 3.4 y 4.4).
- **Un identificador de app** con forma de dominio al revés, por ejemplo `com.tunombre.previa`. No se puede cambiar después.

---

## 1. Preparar el proyecto con Capacitor

Abre una terminal en `C:\Users\mmoli\OneDrive\Apps` (mejor fuera de OneDrive si puedes, porque la sincronización bloquea archivos mientras se compila; por ejemplo `C:\dev`).

```bash
mkdir previa-app
```

```bash
cd previa-app
```

```bash
npm init -y
```

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

```bash
npx cap init Previa com.tunombre.previa --web-dir www
```

Crea la carpeta `www` dentro de `previa-app` y copia ahí `index.html` y `privacidad.html`.

### 1.1 Que funcione sin internet

La app ya no depende de React, Tailwind ni Babel desde internet: todo va dentro del `index.html`. Lo único externo son las tipografías de Google Fonts y la librería de las salas online (PeerJS, que solo se descarga al crear o entrar en una sala). Sin conexión, los juegos en un solo móvil funcionan igual y las letras se ven con la del sistema. Para que se vean igual siempre:

1. Entra en [google-webfonts-helper](https://gwfh.mranftl.com/fonts) y descarga **Bricolage Grotesque** (400, 500, 700, 800), **DM Mono** (400, 500) y **Tilt Neon** (400) en formato `woff2`.
2. Ponlas en `www/fonts/`.
3. En `index.html`, sustituye las tres líneas `<link ... fonts.googleapis.com ...>` por el CSS `@font-face` que te da esa web.

Apple rechaza apps que son "una web metida en una caja" y que no funcionan sin conexión (norma 4.2), así que este paso merece la pena.

### 1.2 Las salas online (cada uno en su móvil)

Las salas funcionan con **WebRTC**: los móviles se conectan directamente entre ellos y el que crea la sala hace de "servidor" de la partida. Para encontrarse usan el servidor público y gratuito de **PeerJS** (peerjs.com). No hace falta ninguna cuenta ni pagar nada.

Lo que conviene saber:

- **Funcionan muy bien si todos estáis en la misma wifi**, que es lo normal en una previa.
- **Con datos móviles, a veces no conectan.** Algunas operadoras ponen a sus clientes detrás de un tipo de red (NAT simétrica) por el que WebRTC no pasa sin un servidor intermedio llamado **TURN**. Si te pasa a menudo, puedes añadir uno gratuito o barato (Metered.ca tiene un plan gratis) en `PEER_OPTS`, dentro de `index.html`.
- **El servidor de PeerJS es gratis pero no garantiza nada.** Si la app crece, monta tu propio PeerServer (es un programa de Node.js de código abierto) en Render, Railway o Fly.io y cambia la conexión en `index.html` para que apunte a él.
- **Si el anfitrión cierra la app, la sala se acaba.** Los demás ven "Se ha perdido la conexión" y pueden volver a entrar si el anfitrión sigue ahí.
- **En el Artifact de claude.ai las salas no funcionan**, porque ese entorno bloquea WebRTC. En GitHub Pages y dentro de la app de las tiendas sí funcionan.

En los formularios de privacidad de las tiendas sigue valiendo "no se recogen datos": los nombres viajan entre los móviles de la sala y no llegan a ningún servidor tuyo. Ya está explicado en `privacidad.html`.

### 1.3 Icono y pantalla de carga

```bash
npm install -D @capacitor/assets
```

Crea una carpeta `assets` en `previa-app` con:

- `icon.png` → 1024×1024
- `splash.png` → 2732×2732, con el logo centrado sobre fondo `#141210`

```bash
npx capacitor-assets generate --iconBackgroundColor "#141210" --splashBackgroundColor "#141210"
```

---

## 2. Probar en tu propio móvil

```bash
npx cap add android
```

```bash
npx cap sync
```

```bash
npx cap open android
```

Se abre Android Studio. Conecta tu Android por USB con la depuración USB activada y dale al botón ▶ verde. Juega una partida entera de cada juego antes de seguir.

Cada vez que cambies el `index.html`, cópialo otra vez a `www` y ejecuta `npx cap sync`.

---

## 3. Google Play (Android)

### 3.1 Crear la cuenta
1. Entra en [play.google.com/console](https://play.google.com/console) y paga los 25 USD.
2. Elige cuenta **personal** o de **organización**. La de organización exige número D-U-N-S (gratis, pero tarda). La personal es más rápida pero tiene el requisito del paso 3.5.
3. Verifica tu identidad con el DNI. Tarda uno o dos días.

### 3.2 Generar el archivo firmado (.aab)
1. En `android/app/build.gradle` revisa `versionCode 1` y `versionName "1.0.0"`. En cada actualización tienes que subir el `versionCode`.
2. Comprueba que el `targetSdkVersion` es el que exige Google este año (en 2025 era el 35; en 2026, el 36 para apps nuevas). Capacitor lo pone en `android/variables.gradle`.
3. En Android Studio: **Build → Generate Signed App Bundle → Android App Bundle**.
4. Crea una clave nueva (*Create new…*). **Guarda el archivo `.jks` y la contraseña en dos sitios seguros.** Sin ellos no podrás actualizar la app nunca.
5. Elige `release`. El archivo sale en `android/app/release/app-release.aab`.

### 3.3 Crear la ficha de la app
En Play Console → **Crear aplicación**:
- Nombre: Previa (si está cogido, por ejemplo "Previa: juegos para la fiesta").
- Idioma predeterminado: Español (España).
- Aplicación, gratuita.

Luego rellena todo lo que aparece en **Panel → Configurar tu aplicación**:

| Sección | Qué contestar |
|---|---|
| Política de privacidad | La URL donde subiste `privacidad.html` |
| Acceso a la app | Toda la funcionalidad está disponible sin restricciones |
| Anuncios | No contiene anuncios |
| Clasificación del contenido | Categoría *Juegos*. Responde con sinceridad: **sí** a referencias al alcohol y **sí** a contenido sexual sugerente (por las preguntas picantes). Saldrá PEGI 16 o 18 |
| Público objetivo | **Solo 18 o más** |
| Seguridad de los datos | **No se recoge ni se comparte ningún dato** |
| Aplicación gubernamental / financiera / salud | No |

### 3.4 Ficha de Play Store
- Descripción breve (80 caracteres): `Juegos para la previa con tu grupo. Un móvil, trece juegos, cero registro.`
- Descripción completa: explica los juegos, el modo sin alcohol y que no pide registro.
- Icono 512×512.
- Imagen destacada 1024×500.
- Mínimo 2 capturas de móvil (recomendado 4–8), entre 320 y 3840 px. Puedes hacerlas desde el emulador de Android Studio.
- Categoría: **Juegos → Casual** o **Juegos de mesa**.

### 3.5 La prueba cerrada obligatoria (cuentas personales)
Si tu cuenta es personal y la creaste después de noviembre de 2023, Google no te deja publicar hasta que hayas tenido una **prueba cerrada con al menos 12 testers durante 14 días seguidos**.

1. **Pruebas → Prueba cerrada → Crear canal.**
2. Sube el `.aab`.
3. Añade los emails de 12+ amigos (cuentas de Google) o un Grupo de Google.
4. Pásales el enlace de suscripción. Tienen que aceptar e instalar la app, y no desinstalarla en esos 14 días.
5. Pasados los 14 días, en el panel aparece **Solicitar acceso a producción**. Te preguntan cómo ha ido la prueba; contesta con detalle.

### 3.6 Publicar
**Producción → Crear versión →** sube el `.aab` (o promociona el de la prueba cerrada) → notas de la versión → **Enviar a revisión**.

---

## 4. App Store (iOS)

### 4.1 Si no tienes Mac
Las apps de iOS solo se compilan con Xcode, que solo existe en macOS. Opciones:
- Un Mac prestado durante una tarde (es lo más fácil).
- **Codemagic** (tiene plan gratuito para compilar en Macs en la nube; se conecta a tu repositorio de GitHub).
- Alquilar un Mac remoto por horas (MacinCloud o similares).

### 4.2 Cuenta y proyecto
1. Inscríbete en [developer.apple.com/programs](https://developer.apple.com/programs) (99 USD/año). Como persona física se aprueba en uno o dos días.
2. En el Mac, dentro de `previa-app`:

```bash
npx cap add ios
```

```bash
npx cap sync
```

```bash
npx cap open ios
```

3. En Xcode, selecciona el target **App**:
   - **Signing & Capabilities** → marca *Automatically manage signing* y elige tu equipo.
   - **General → Supported Destinations**: deja solo **iPhone** (así no te piden capturas de iPad).
   - **Version** `1.0.0`, **Build** `1`.
   - **Deployment Info**: solo orientación vertical.

### 4.3 Crear la app en App Store Connect
En [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → + → Nueva app**: plataforma iOS, nombre, idioma Español (España), el mismo bundle ID que en Xcode y un SKU cualquiera (por ejemplo `previa-001`).

### 4.4 Ficha
- Subtítulo (30 caracteres): `Juegos para antes de salir`.
- Descripción, palabras clave (100 caracteres separados por comas), URL de soporte y **URL de la política de privacidad**.
- Capturas: como mínimo las de **iPhone de 6,9"** (1320×2868 o 1290×2796). Se hacen con el simulador de Xcode (*iPhone 16 Pro Max* o superior) con ⌘S.
- Categoría principal: **Juegos**, subcategorías *Casual* y *Juegos de mesa*.
- **Privacidad de la app**: *No recopilamos datos de esta app*.
- **Clasificación por edad**: contesta el cuestionario con sinceridad. Alcohol/drogas "frecuente o intenso" y temas sexuales "leves" → saldrá **18+**.

### 4.5 Subir la build
1. En Xcode, arriba, elige *Any iOS Device (arm64)*.
2. **Product → Archive**.
3. En el Organizer: **Distribute App → App Store Connect → Upload**.
4. A los 10–30 minutos la build aparece en App Store Connect. Pruébala primero en tu iPhone con **TestFlight**.
5. En la versión 1.0, selecciona la build, responde a la pregunta de cifrado (*No usa cifrado* o solo el estándar exento) y **Enviar a revisión**.

### 4.6 Notas para el revisor (importante)
Apple es estricta con este tipo de app. En **Información para la revisión de la app** escribe algo así:

> Previa es un juego social para mayores de 18 que se juega en grupo, con un solo móvil o cada uno en el suyo uniéndose a una sala con un código de 4 letras (para probarlo hacen falta dos dispositivos con internet). No requiere cuenta. Incluye un "modo sin alcohol" (Ajustes) que sustituye los tragos por puntos, y mensajes de consumo responsable. Nadie está obligado a beber: en todos los juegos se puede jugar con puntos.

Motivos de rechazo más habituales y cómo los cubre esta versión:

| Norma | Riesgo | Qué hemos hecho |
|---|---|---|
| **1.4.3** No fomentar el consumo excesivo de alcohol | El más probable | Modo sin alcohol, aviso de 18+, castigos moderados (1–3 tragos), mensaje de consumo responsable, sin chupitos obligatorios |
| **2.1 / 2.3** Funciones que no funcionan o engañan | La versión anterior tenía "Salas online" que no hacían nada | Eliminadas. Todo lo que se ve funciona |
| **4.2** Funcionalidad mínima / web empaquetada | Medio | Funciona sin conexión, tiene sonidos, vibración y botón atrás de Android |
| **4.3** Spam (hay muchas apps iguales) | Medio | Juegos propios (Misión secreta, Reflejos, La ruleta…) y diseño propio. Destácalos en la descripción |
| **5.1.1** Privacidad | Bajo | Política publicada y "no recopila datos" |

Si te la rechazan, no te desanimes: contesta en el Centro de resoluciones explicando lo que has cambiado. Es muy normal que la primera vez vuelva con algún comentario.

---

## 5. Actualizar la app más adelante

1. Cambia `index.html` y cópialo a `www`.
2. `npx cap sync`.
3. Android: sube `versionCode` (+1) y `versionName`, genera un `.aab` nuevo con **la misma clave** y súbelo a Producción.
4. iOS: sube el *Build* (+1) y la *Version*, Archive, Upload y envía a revisión.

---

## Checklist rápida

- [ ] Email puesto en `privacidad.html` y la página publicada en una URL
- [ ] Fuentes descargadas en `www/fonts` (opcional pero recomendado)
- [ ] Icono 1024×1024 y splash
- [ ] Probado entero en un Android real
- [ ] Clave `.jks` guardada en dos sitios
- [ ] Prueba cerrada de 14 días con 12 testers (Play, cuenta personal)
- [ ] Probado en iPhone con TestFlight
- [ ] Capturas de pantalla hechas
- [ ] Cuestionarios de edad contestados como 18+
- [ ] Nota para el revisor de Apple
