# Carpeta de subida manual (`public/uploads`)

Usa esta carpeta para dejar **fotos y vídeos** que quieras reutilizar en la web.

## Cómo subir contenido
1. Copia aquí tus archivos (por ejemplo: `bolso-azul.jpg`, `home-video.mp4`).
2. Haz commit y push al repositorio.
3. Referencia los archivos en el catálogo (`public/data/shop-products.json`) o en configuración de medios (`site/src/content.js`).

## Rutas que puedes usar
- Desde `shop-products.json`: `"image": "./uploads/bolso-azul.jpg"`
- Desde JSX/CSS (Vite): `"${import.meta.env.BASE_URL}uploads/bolso-azul.jpg"`

## Nombres auto-usados por la portada
Si subes estos nombres exactos, la web los toma automáticamente:

- `home-video.mp4` → vídeo principal de Inicio.
- `collection-video.mp4` → vídeo principal de Colección.
- `home-photo-1.jpg` → foto bloque “Sobre la creadora” en Inicio.
- `home-photo-2.jpg` → foto bloque “Encargos personalizados” en Inicio.

Si faltan, la web usa imágenes/vídeo de respaldo.

## Recomendaciones
- Imágenes: `.jpg`, `.png`, `.webp`.
- Vídeos: `.mp4` (H.264) para mejor compatibilidad.
- Evita espacios y acentos en nombres de archivo para reducir errores de URL.
