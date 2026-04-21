# Atelier Lumière

Landing premium de una marca artesanal de bordado.

## Estado actual

La página principal **ya carga directamente** abriendo `index.html` (sin build) y también funciona al publicarla en GitHub Pages desde la raíz del repo.

## Cómo subir tus vídeos

En `index.html` busca:

```js
const mediaConfig = {
  heroMode: 'image',
  heroVideoSrc: '',
  heroImageSrc: '...',
  parallaxMode: 'image',
  parallaxVideoSrc: '',
  parallaxImageSrc: '...'
}
```

Cámbialo así si quieres usar 2 vídeos:

```js
const mediaConfig = {
  heroMode: 'video',
  heroVideoSrc: './videos/hero.mp4',
  heroImageSrc: './videos/hero-poster.jpg',
  parallaxMode: 'video',
  parallaxVideoSrc: './videos/parallax.mp4',
  parallaxImageSrc: './videos/parallax-poster.jpg'
}
```

Si prefieres que una sección sea imagen estática, deja su `mode` en `'image'`.

Luego crea la carpeta `videos/` en la raíz y sube ahí tus MP4/posters.

## Estructura visual incluida

- Header fijo elegante con navegación por anclas.
- Hero cinematográfico con fallback a imagen.
- Sección parallax narrativa con texto progresivo.
- Colección destacada.
- Proceso artesanal en 6 pasos.
- Sobre la creadora.
- Encargos personalizados.
- Diario del taller.
- Footer con contacto.
