# Atelier Lumière

Landing editorial construida con Vite y React para presentar colecciones bordadas, encargos a medida y contenido de marca con una estética más cuidada.

## Qué mejoré

- Unifiqué el proyecto para que la entrada principal sea la app de React y no una `index.html` estática separada.
- Corregí el contenido con caracteres rotos y reescribí varias secciones para que la landing tenga un relato más claro.
- Añadí navegación móvil, enlace para saltar al contenido y una estructura más accesible y responsive.
- Organicé el contenido en arreglos dentro de [`src/App.jsx`](./src/App.jsx) para que editar textos y tarjetas sea más simple.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Vídeos opcionales

Si quieres usar vídeos propios en hero o en la sección narrativa, crea una carpeta `public/videos/` y actualiza `mediaConfig` en [`src/App.jsx`](./src/App.jsx):

```js
const mediaConfig = {
  heroVideoEnabled: true,
  heroVideoSrc: '/videos/hero.mp4',
  parallaxVideoEnabled: true,
  parallaxVideoSrc: '/videos/parallax.mp4'
}
```

Si `heroVideoEnabled` o `parallaxVideoEnabled` están en `false`, la página usará automáticamente las imágenes de apoyo.
