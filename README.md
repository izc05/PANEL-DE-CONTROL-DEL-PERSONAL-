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

## Gestión de fotos/vídeos y catálogo (modo tienda simple)

### 1) Subir archivos multimedia

Guarda imágenes o vídeos en `public/uploads/` (puedes ver guía rápida en `public/uploads/README.md`).

Ejemplos de ruta:

- `./uploads/bolso-azul.jpg`
- `./uploads/home-video.mp4`

### 2) Editar productos de la colección

El catálogo de tienda se carga desde:

- `public/data/shop-products.json`

Ahí puedes añadir, quitar o editar productos (`title`, `description`, `price`, `category`, `image`, etc.) sin tocar JSX.

Si este JSON no existe o falla, la app usa el catálogo por defecto de `site/src/content.js`.

## Roadmap de trabajo (fases + tiempos orientativos)

### Fase 1 · Base funcional (completada)
- Estructura de páginas, navegación y diseño responsive.
- Catálogo simple + carrito + checkout por WhatsApp.
- Publicación estable con `npm run build`.

### Fase 2 · Experiencia y contenido (1 a 2 semanas)
- Ajustes visuales por secciones (colección/diario/sobre mí).
- Integración de vídeos largos en bloques inmersivos.
- Optimización de copy, imágenes y llamadas a la acción.

### Fase 3 · Cuenta cliente y datos (1 a 2 semanas)
- Login/registro real (Firebase).
- Persistencia de sesión y página de estado de pedidos.
- Validaciones de formulario y feedback de errores.

### Fase 4 · Cierre de tienda (2 a 3 semanas)
- Checkout más completo (pasarela o confirmación guiada).
- Gestión de stock/disponibilidad básica.
- Métricas, SEO técnico y rendimiento final.
