const withBase = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const mediaConfig = {
  heroVideoEnabled: true,
  heroVideoSrc: withBase('/media/atelier-video.mp4'),
  collectionVideoSrc: withBase('/media/video_musica_desde_050.mp4'),
  heroPoster: withBase('/media/atelier-hero.png'),
  visualLead: withBase('/media/atelier-wide.png'),
  visualDetailA: withBase('/media/atelier-materials.png'),
  visualDetailB: withBase('/media/atelier-stitching.png'),
  visualDetailC: withBase('/media/atelier-doorway.png'),
  portrait: withBase('/media/atelier-portrait.png'),
  atelierVideo: withBase('/media/atelier-video.mp4'),
  journalVideo: withBase('/media/atelier-video.mp4')
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
    tag: 'Edición atelier',
    price: '195 €',
    description: 'Bolso de lino bordado a mano con flores suaves y un acabado cálido y elegante.',
    image: mediaConfig.heroPoster,
    alt: 'Bolso bordado en un entorno cálido de atelier'
  },
  {
    slug: 'camisa-lumiere',
    title: 'Camisa Lumière',
    category: 'Prendas bordadas',
    tag: 'Nueva colección',
    price: '145 €',
    description: 'Prenda ligera con bordado floral discreto y una presencia suave, limpia y femenina.',
    image: mediaConfig.portrait,
    alt: 'Creadora con prenda bordada en tonos suaves'
  },
  {
    slug: 'bastidor-peonia',
    title: 'Bastidor Peonía',
    category: 'Piezas únicas',
    tag: 'Pieza única',
    price: '85 €',
    description: 'Bordado botánico concebido como objeto decorativo y pequeña pieza de recuerdo.',
    image: mediaConfig.visualDetailB,
    alt: 'Bastidor con bordado floral artesanal'
  },
  {
    slug: 'neceser-amour',
    title: 'Neceser Amour',
    category: 'Accesorios',
    tag: 'Accesorio',
    price: '48 €',
    description: 'Neceser bordado con aire romántico, ideal para regalo o como detalle de colección.',
    image: mediaConfig.visualLead,
    alt: 'Neceser bordado en escena de atelier'
  },
  {
    slug: 'coleccion-atelier',
    title: 'Colección Atelier',
    category: 'Bolsos bordados',
    tag: 'Colección destacada',
    price: 'Desde 120 €',
    description: 'Una selección cuidada de piezas pensadas para abrir la colección principal con más presencia.',
    image: mediaConfig.visualDetailC,
    alt: 'Vista íntima del atelier desde la puerta'
  },
  {
    slug: 'encargo-personalizado',
    title: 'Encargo personalizado',
    category: 'Encargos',
    tag: 'A medida',
    price: 'Consultar',
    description: 'Transformamos una idea, una palabra o un recuerdo en una pieza bordada con significado.',
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
  'Cada pieza nace entre lino, luz cálida y pequeños gestos hechos a mano.',
  'El atelier trabaja en series pequeñas para cuidar cada detalle sin prisas.',
  'Cada encargo se diseña con intención para convertir un recuerdo en una pieza única.'
]

export const contactDetails = [
  { label: 'Correo', value: 'atelier@atelierlumiere.com', href: 'mailto:atelier@atelierlumiere.com' },
  { label: 'Teléfono', value: '+34 612 34 56 78', href: 'tel:+34612345678' },
  { label: 'Atelier', value: 'Atención personalizada con cita o encargo previo', href: '' }
]
