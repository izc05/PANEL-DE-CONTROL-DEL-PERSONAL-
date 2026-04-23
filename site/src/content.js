const withBaseMedia = (filename) => `${import.meta.env.BASE_URL}media/${encodeURIComponent(filename)}`

export const mediaConfig = {
  heroVideoEnabled: true,
  heroVideoSrc: withBaseMedia('atelier-video.mp4'),
  collectionVideoSrc: withBaseMedia('video_musica_desde_050.mp4'),
  heroPoster: withBaseMedia('atelier-hero.png'),
  visualLead: withBaseMedia('atelier-wide.png'),
  visualDetailA: withBaseMedia('atelier-materials.png'),
  visualDetailB: withBaseMedia('atelier-stitching.png'),
  visualDetailC: withBaseMedia('atelier-doorway.png'),
  portrait: withBaseMedia('atelier-portrait.png'),
  atelierVideo: withBaseMedia('atelier-video.mp4'),
  journalVideo: withBaseMedia('video_musica_desde_050.mp4'),
  bagImage: withBaseMedia('ChatGPT Image 23 abr 2026, 13_03_07.png'),
  cushionImage: withBaseMedia('ChatGPT Image 23 abr 2026, 13_03_13.png'),
  embroideredSetImage: withBaseMedia('ChatGPT Image 23 abr 2026, 13_03_23.png')
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
    text: 'Cada pieza se trabaja con calma, cuidando el dibujo, la textura y la última puntada.'
  },
  {
    title: 'Belleza serena',
    text: 'Lino, luz suave, flores y materiales nobles componen un universo delicado y atemporal.'
  },
  {
    title: 'Piezas con historia',
    text: 'Colecciones y encargos pensados para recuerdos, regalos delicados y momentos que merecen quedarse.'
  },
  {
    title: 'Encargos con alma',
    text: 'Creamos piezas personalizadas para transformar una idea, un nombre o un recuerdo en algo único.'
  }
]

export const heroHighlights = [
  'Bordado artesanal',
  'Piezas únicas',
  'Encargos personalizados'
]

export const signatureQuote = {
  title: 'Belleza lenta, materia noble y detalles que perduran',
  text: 'Atelier Lumière no quiere parecer una tienda más. Quiere sentirse como una casa creativa pequeña, íntima y cuidadosamente compuesta.'
}

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
    tag: 'Nueva pieza',
    badge: 'Nuevo',
    featuredRank: 1,
    price: '195 €',
    description: 'Bolso bordado a mano con flores suaves y acabado elegante para uso diario o regalo.',
    image: mediaConfig.bagImage,
    alt: 'Bolso bordado artesanal en tonos cálidos'
  },
  {
    slug: 'cojin-jardin-bordado',
    title: 'Cojín Jardín Bordado',
    category: 'Piezas únicas',
    tag: 'Nueva pieza',
    badge: 'Top ventas',
    featuredRank: 2,
    price: '92 €',
    description: 'Cojín decorativo con bordado floral pensado para dar textura y calidez a cualquier rincón.',
    image: mediaConfig.cushionImage,
    alt: 'Cojín bordado con motivos florales en ambiente acogedor'
  },
  {
    slug: 'set-lino-atelier',
    title: 'Set Lino Atelier',
    category: 'Accesorios',
    tag: 'Edición atelier',
    badge: 'Edición limitada',
    featuredRank: 3,
    price: '68 €',
    description: 'Conjunto de piezas textiles bordadas con diseño delicado y estilo artesanal contemporáneo.',
    image: mediaConfig.embroideredSetImage,
    alt: 'Set de textiles bordados sobre mesa de atelier'
  },
  {
    slug: 'camisa-lumiere',
    title: 'Camisa Lumière',
    category: 'Prendas bordadas',
    tag: 'Colección atelier',
    badge: 'Atelier',
    featuredRank: 4,
    price: '145 €',
    description: 'Prenda ligera con bordado floral discreto y una presencia suave, limpia y femenina.',
    image: mediaConfig.portrait,
    alt: 'Creadora con prenda bordada en tonos suaves'
  },
  {
    slug: 'coleccion-atelier',
    title: 'Colección Atelier',
    category: 'Bolsos bordados',
    tag: 'Colección destacada',
    badge: 'Destacado',
    featuredRank: 5,
    price: 'Desde 120 €',
    description: 'Selección de bolsos y piezas bordadas para abrir la colección principal con más presencia visual.',
    image: mediaConfig.visualDetailC,
    alt: 'Vista íntima del atelier desde la puerta'
  },
  {
    slug: 'encargo-personalizado',
    title: 'Encargo personalizado',
    category: 'Encargos',
    tag: 'A medida',
    badge: 'Personalizable',
    featuredRank: 6,
    price: 'Consultar',
    description: 'Transformamos una idea, una palabra o un recuerdo en una pieza bordada con significado.',
    image: mediaConfig.visualDetailA,
    alt: 'Mesa del taller preparada para diseñar encargos personalizados'
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
    description: 'Se eligen dibujo, colores, telas y hilos para encontrar el tono justo de cada pieza.'
  },
  {
    number: '03',
    title: 'Bastidor y bordado',
    description: 'El gesto manual convierte la idea en textura viva, volumen y presencia real.'
  },
  {
    number: '04',
    title: 'Remate final',
    description: 'Cada detalle se ajusta con calma para que la pieza llegue cuidada y lista para perdurar.'
  }
]

export const journalEntries = [
  {
    slug: 'podcast-puntada-01',
    title: 'Podcast breve · Puntada 01',
    meta: 'Audio + historia',
    text: 'Cómo nació el primer bolso de la colección: una anécdota corta sobre luz, materiales y primeras pruebas.',
    image: mediaConfig.bagImage,
    alt: 'Bolso bordado protagonista del primer episodio del diario'
  },
  {
    slug: 'podcast-puntada-02',
    title: 'Podcast breve · Puntada 02',
    meta: 'Detrás de la pieza',
    text: 'Un episodio pequeño sobre cojines bordados, elección de paleta y ritmo lento de producción artesanal.',
    image: mediaConfig.cushionImage,
    alt: 'Cojín bordado mostrado como parte del segundo episodio'
  },
  {
    slug: 'podcast-puntada-03',
    title: 'Podcast breve · Puntada 03',
    meta: 'Dato del taller',
    text: 'Historia corta del set bordado: materiales, tiempos reales y un dato útil para cuidar cada pieza.',
    image: mediaConfig.embroideredSetImage,
    alt: 'Set de piezas bordadas para el tercer episodio del diario'
  }
]

export const aboutNotes = [
  'Cada pieza nace entre lino, luz cálida y pequeños gestos hechos a mano.',
  'El atelier trabaja en series pequeñas para cuidar cada detalle sin prisas.',
  'Cada encargo se diseña con intención para convertir un recuerdo en una pieza única.'
]

export const contactDetails = [
  { label: 'Correo', value: 'atelier@atelierlumiere.com', href: 'mailto:atelier@atelierlumiere.com' },
  { label: 'Teléfono', value: '+34 612 34 56 78', href: 'tel:+34612345678' },
  { label: 'Atelier', value: 'Atención personalizada con cita o encargo previo', href: '' }
]
