export const mediaConfig = {
  heroVideoEnabled: true,
  heroVideoSrc: '/media/atelier-video.mp4',
  heroPoster: '/media/atelier-hero.png',
  visualLead: '/media/atelier-wide.png',
  visualDetailA: '/media/atelier-materials.png',
  visualDetailB: '/media/atelier-stitching.png',
  visualDetailC: '/media/atelier-doorway.png',
  portrait: '/media/atelier-portrait.png',
  atelierVideo: '/media/atelier-video.mp4'
}

export const navItems = [
  { label: 'Inicio', href: '#/' },
  { label: 'Colección', href: '#/coleccion' },
  { label: 'Encargos', href: '#/encargos' },
  { label: 'Diario del taller', href: '#/diario' },
  { label: 'Sobre mí', href: '#/sobre-mi' },
  { label: 'Contacto', href: '#/contacto' }
]

export const valuePoints = [
  {
    title: 'Hecho a mano',
    text: 'Cada pieza nace con calma, puntada a puntada, en un atelier donde el tiempo cuenta.'
  },
  {
    title: 'Atmósfera editorial',
    text: 'La web se apoya en luz suave, textura, flores y composición premium para no parecer una tienda genérica.'
  },
  {
    title: 'Colecciones y encargos',
    text: 'La estructura está pensada para enseñar piezas listas y también abrir encargos con significado.'
  },
  {
    title: 'Edición sencilla',
    text: 'Todo el contenido principal vive aquí para poder cambiar textos, productos y artículos sin tocar demasiado el código.'
  }
]

export const heroHighlights = [
  'Luz filtrada y tonos lino',
  'Bordado floral artesanal',
  'Piezas únicas y delicadas'
]

export const visualNarrative = [
  {
    title: 'Toda pieza comienza con un instante de calma',
    image: mediaConfig.visualLead,
    alt: 'Vista amplia del atelier con luz suave y mesa de trabajo'
  },
  {
    title: 'El boceto, los hilos y la intención',
    image: mediaConfig.visualDetailA,
    alt: 'Mesa de trabajo con hilos, flores y boceto'
  },
  {
    title: 'Puntada a puntada',
    image: mediaConfig.visualDetailB,
    alt: 'Primer plano de manos bordando una flor'
  },
  {
    title: 'Hecho a mano, creado despacio',
    image: mediaConfig.visualDetailC,
    alt: 'Entrada íntima al atelier con atmósfera cálida'
  }
]

export const products = [
  {
    slug: 'bolso-silvestre',
    title: 'Bolso Silvestre',
    category: 'Bolsos bordados',
    tag: 'Edición atelier',
    price: '195 €',
    description: 'Bolso de lino bordado a mano con flores suaves y acabados cálidos.',
    image: mediaConfig.heroPoster,
    alt: 'Bolso bordado en un entorno cálido de atelier'
  },
  {
    slug: 'camisa-lumiere',
    title: 'Camisa Lumière',
    category: 'Prendas bordadas',
    tag: 'Nueva colección',
    price: '145 €',
    description: 'Prenda ligera con bordado floral discreto y presencia editorial.',
    image: mediaConfig.portrait,
    alt: 'Creadora con prenda bordada en tonos suaves'
  },
  {
    slug: 'bastidor-peonia',
    title: 'Bastidor Peonía',
    category: 'Piezas únicas',
    tag: 'Pieza única',
    price: '85 €',
    description: 'Bordado botánico pensado como objeto decorativo y pieza de recuerdo.',
    image: mediaConfig.visualDetailB,
    alt: 'Bastidor con bordado floral artesanal'
  },
  {
    slug: 'neceser-amour',
    title: 'Neceser Amour',
    category: 'Accesorios',
    tag: 'Accesorio',
    price: '48 €',
    description: 'Neceser bordado con aire romántico, ideal para regalo o colección.',
    image: mediaConfig.visualLead,
    alt: 'Neceser bordado en escena de atelier'
  },
  {
    slug: 'coleccion-atelier',
    title: 'Colección Atelier',
    category: 'Bolsos bordados',
    tag: 'Colección destacada',
    price: 'Desde 120 €',
    description: 'Una selección cuidada de piezas pensadas para abrir la colección principal.',
    image: mediaConfig.visualDetailC,
    alt: 'Vista íntima del atelier desde la puerta'
  },
  {
    slug: 'encargo-personalizado',
    title: 'Encargo personalizado',
    category: 'Encargos',
    tag: 'A medida',
    price: 'Consultar',
    description: 'Transformamos una idea o recuerdo en una pieza bordada con significado.',
    image: mediaConfig.portrait,
    alt: 'Retrato cálido de la creadora bordando junto a la ventana'
  }
]

export const processSteps = [
  {
    number: '01',
    title: 'Inspiración',
    description: 'Todo empieza con una escena, una emoción o un recuerdo que merece quedarse.'
  },
  {
    number: '02',
    title: 'Boceto y materiales',
    description: 'Se eligen dibujo, colores, telas y hilos para encontrar el tono justo de la pieza.'
  },
  {
    number: '03',
    title: 'Bastidor y bordado',
    description: 'El trabajo manual convierte la idea en textura viva, volumen y presencia real.'
  },
  {
    number: '04',
    title: 'Remate final',
    description: 'Cada detalle se ajusta con calma para que la pieza llegue cuidada y lista para perdurar.'
  }
]

export const journalEntries = [
  {
    slug: 'inspiracion-del-atelier',
    title: 'La inspiración del atelier',
    meta: 'Diario del taller',
    text: 'Flores, luz filtrada y materiales suaves como punto de partida para cada nueva pieza.',
    image: mediaConfig.visualLead,
    alt: 'Vista amplia del atelier con ventana luminosa'
  },
  {
    slug: 'por-que-bordamos-a-mano',
    title: 'Por qué bordamos a mano',
    meta: 'Oficio',
    text: 'El detalle manual convierte cada bordado en una presencia única, lenta y auténtica.',
    image: mediaConfig.visualDetailB,
    alt: 'Detalle de la aguja y el hilo sobre la tela'
  },
  {
    slug: 'mesa-de-trabajo',
    title: 'Lo que cuenta una mesa de trabajo',
    meta: 'Materiales',
    text: 'Hilos, tijeras, bocetos y bastidores construyen el lenguaje visual del atelier.',
    image: mediaConfig.visualDetailA,
    alt: 'Mesa del taller con herramientas y boceto floral'
  }
]

export const aboutNotes = [
  'La marca se apoya en luz cálida, textura y gestos pequeños.',
  'La base visual de la portada ya está preparada para crecer con tienda, producto y checkout.',
  'Los textos, productos y artículos se pueden ampliar editando este archivo.'
]

export const contactDetails = [
  { label: 'Correo', value: 'atelier@atelierlumiere.com', href: 'mailto:atelier@atelierlumiere.com' },
  { label: 'Teléfono', value: '+33 6 12 34 56 78', href: 'tel:+33612345678' },
  { label: 'Ubicación', value: 'Provence, France', href: '' }
]
