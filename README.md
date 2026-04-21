# Atelier Lumière

Landing premium de una marca artesanal de bordado.

## Estado actual

La página principal **ya carga directamente** abriendo `index.html` (sin build) y también funciona al publicarla en GitHub Pages desde la raíz del repo.

## Cómo subir tus vídeos

En `index.html` busca:

```js
const mediaConfig = {
  heroVideoSrc: '',
  parallaxVideoSrc: ''
}
```

Cambia por rutas reales, por ejemplo:

```js
const mediaConfig = {
  heroVideoSrc: './videos/hero.mp4',
  parallaxVideoSrc: './videos/parallax.mp4'
}
```

Luego crea la carpeta `videos/` en la raíz y sube ahí tus dos MP4.

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
