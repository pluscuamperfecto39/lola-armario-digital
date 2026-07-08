# 👗 LOLA — Tu armario digital (PWA)

Una app instalable (PWA) que funciona como un **armario digital**:

- **Apartados**: Ropa de verano ☀️, primavera 🌸, invierno ❄️, calzado 👠, accesorios 👜 y maquillaje 💄.
- **Añadir con foto**: haces una foto con el móvil a la prenda y la app **recorta el fondo automáticamente** y la guarda en el apartado que elijas.
- **Probador 🧍‍♀️**: eliges prendas del armario y las combinas sobre un **maniquí** (mujer delgada, pelo largo castaño) para ver cómo quedaría el conjunto. Puedes mover, redimensionar y apilar cada prenda, y **guardar el look** como imagen.

- **Modo oscuro** 🌙: botón en la cabecera para alternar claro/oscuro (por defecto sigue el tema de tu móvil y recuerda tu elección).

Todo funciona **en el propio dispositivo**: tus fotos se guardan solo en tu teléfono (en el almacenamiento del navegador) y **no se suben a ningún servidor**.

---

## 📁 Contenido

```
APP LOLA/
├─ index.html            ← la app
├─ manifest.webmanifest  ← datos de instalación PWA
├─ sw.js                 ← service worker (funciona sin conexión)
├─ css/styles.css
├─ js/                   ← código (armario, cámara, probador, base de datos…)
├─ assets/               ← maniquí + iconos
├─ start-servidor.bat    ← abre la app en tu PC (para probar)
└─ tools/generate_icons.py
```

---

## ▶️ Probarla en el PC (rápido)

Haz **doble clic en `start-servidor.bat`**. Se abrirá sola en el navegador en `http://localhost:5173`.
Para cerrarla, cierra la ventana negra.

> Necesita Python (ya lo tienes instalado). Alternativa con Node: `npx serve -l 5173` dentro de la carpeta.

---

## 📱 Usarla en el móvil (recomendado)

Para instalarla en el móvil y que funcione **offline y a pantalla completa**, necesita abrirse por **HTTPS**. La forma más fácil y gratis:

### Opción A — Netlify Drop (sin cuenta, 1 minuto)
1. Entra en **https://app.netlify.com/drop** desde el ordenador.
2. **Arrastra la carpeta `APP LOLA`** entera a la página.
3. Te dará un enlace `https://algo.netlify.app`.
4. Abre ese enlace en el **móvil** → menú del navegador → **“Añadir a pantalla de inicio”**.

### Opción B — GitHub Pages
Sube la carpeta a un repositorio y actívalo en *Settings → Pages*. Te dará una URL `https://usuario.github.io/...`.

> **Nota**: hacer fotos y recortar el fondo también funciona abriendo la app por la red local (`http://IP-del-PC:5173`) desde el móvil, pero **instalarla y el modo sin conexión** solo funcionan con HTTPS (opciones A o B).

---

## 💡 Consejos para el mejor recorte

- Coloca la prenda sobre un **fondo liso** (una cama, una pared, el suelo) y con **buena luz**.
- Que la prenda **ocupe casi toda la foto** y contraste con el fondo.
- El recorte usa el modelo de IA **RMBG-1.4** (BRIA) ejecutándose en tu navegador. **La primera vez** descarga el modelo (~44 MB): necesita **internet solo esa primera vez**; luego queda guardado y funciona sin conexión. Cada recorte tarda unos segundos.

---

## ❓ Preguntas frecuentes

**¿Dónde se guardan mis prendas?**
En el navegador del dispositivo (IndexedDB). Si borras los datos del navegador o desinstalas, se pierden.

**El recorte no funciona / sale sin recortar.**
Suele ser falta de internet la primera vez (para descargar el modelo RMBG-1.4). La app te deja **guardar la foto igualmente** aunque no se recorte. El motor de recorte está en `js/bgremove.js` (modelo `briaai/RMBG-1.4` vía Transformers.js).

**¿Puedo cambiar el maniquí?**
Sí: sustituye `assets/mannequin.svg` (mantén el mismo `viewBox="0 0 360 820"` para que las prendas encajen).

---

Hecho con cariño para organizar y combinar tu ropa. 💖
