/* Alumno: Leonardo Ivan Gongora Us */

/* UTILIDADES */
const $ = id => document.getElementById(id);
const t = x => String(x ?? '').trim();
const nombreArchivo = s => s.toLowerCase().replace(/^\./, '').replace(/[\\/:*?"<>|]/g, '-');
const SIN_RESULTADOS = '<p class="text-white">No hay resultados.</p>';
const SIN_DATOS = '<span class="text-secondary small">No especificado</span>';

async function cargarJSON(ruta) {
  try {
    const res = await fetch(ruta);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`No se pudo cargar ${ruta}:`, err);
    return [];
  }
}

function mostrarModal(titulo, html) {
  $('modalTitulo').textContent = titulo;
  $('modalCuerpo').innerHTML = html;
  bootstrap.Modal.getOrCreateInstance($('modalDetalle')).show();
}

function imagenFallida(img) {
  if (!img.getAttribute('src')) return;
  if (img.dataset.fallback && !img.dataset.usado) {
    img.dataset.usado = '1';
    img.src = img.dataset.fallback;
  } else {
    img.style.display = 'none';
  }
}
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG') imagenFallida(e.target);
}, true);
// las que ya fallaron antes de que se registrara el listener
document.querySelectorAll('img').forEach(img => {
  if (img.complete && !img.naturalWidth) imagenFallida(img);
});

/* SECCIONES  */
const links = document.querySelectorAll('#Categories .nav-link');
const secciones = document.querySelectorAll('.seccion');
const cargadores = { personajes: cargarOperadores, mapas: cargarMapas };
const yaCargadas = new Set();

function mostrarSeccion(id) {
  links.forEach(l => l.classList.toggle('active', l.dataset.seccion === id));
  secciones.forEach(s => s.classList.toggle('d-none', s.id !== id));
  bootstrap.Collapse.getInstance($('menu'))?.hide();   // cierra el menú desplegable en celular

  if (cargadores[id] && !yaCargadas.has(id)) {   // los datos se piden solo la primera vez
    yaCargadas.add(id);
    cargadores[id]();
  }
}

links.forEach(link => link.addEventListener('click', e => {
  e.preventDefault();
  mostrarSeccion(link.dataset.seccion);
}));


document.querySelectorAll('[data-ir]').forEach(btn =>
  btn.addEventListener('click', () => mostrarSeccion(btn.dataset.ir)));

/* OPERADORES */
let todosLosOperadores = [];
let armas = [];                
let ladoActual = 'todos';
let textoBusqueda = '';

const mapasFondoOps = ['bank.png', 'border.png', 'chalet.png', 'clubhouse.png', 'coastline.png', 'consulate.png', 'emerald plains.png'];
const fondoOperador = op =>
  mapasFondoOps[[...op.name].reduce((suma, c) => suma + c.charCodeAt(0), 0) % mapasFondoOps.length];

async function asegurarOperadores() {
  if (!todosLosOperadores.length) todosLosOperadores = await cargarJSON('data/operadores.json');
}

async function asegurarArmas() {
  if (!armas.length) armas = await cargarJSON('data/armas.json');
}

async function cargarOperadores() {
  await asegurarOperadores();
  mostrarOperadores();
}

function mostrarOperadores() {
  const filtrados = todosLosOperadores.filter(op =>
    (ladoActual === 'todos' || op.side === ladoActual) &&
    op.name.toLowerCase().includes(textoBusqueda)
  );

  $('operadores').innerHTML = filtrados.map(op => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="card h-100 bg-dark text-light text-center operador-card"
           role="button" data-safename="${op.safename}">
        <img src="img/operadores/${encodeURIComponent(op.name.toLowerCase())}.png" class="card-img-top p-3" alt="${op.name}">
        <div class="card-body">
          <h5 class="card-title">${op.name}</h5>
          <span class="badge ${op.side === 'attacker' ? 'bg-warning text-dark' : 'bg-primary'}">
            ${op.side === 'attacker' ? 'Atacante' : 'Defensor'}
          </span>
          <p class="small text-secondary mt-2 mb-0">${t(op.unit)}</p>
        </div>
      </div>
    </div>`).join('') || SIN_RESULTADOS;
}

/* Detalle del operador */
const pct = (valor, maximo) => Math.min(100, Math.round((valor / maximo) * 100));

const statBarra = (etiqueta, valor, porcentaje, color, margen = '') => `
  <div class="d-flex justify-content-between" style="font-size:0.75rem;">
    <span class="text-secondary">${etiqueta}</span>
    <strong class="text-white">${valor}</strong>
  </div>
  <div class="progress bg-secondary bg-opacity-25 ${margen}" style="height:5px;">
    <div class="progress-bar bg-${color}" style="width:${porcentaje}%"></div>
  </div>`;

function tarjetaArma(nombre) {
  const info = armas.find(a => a.name.toLowerCase() === nombre.toLowerCase());
  const dano = Number(info?.stats_damage) || 0;
  const cargador = Number(info?.stats_ammo) || 0;

  const stats = info
    ? `<div class="w-100 mt-2 pt-2 border-top border-secondary border-opacity-25 text-start">
         ${statBarra('Daño', dano, pct(dano, 125), 'danger', 'mb-2')}
         ${statBarra('Cargador', cargador, pct(cargador, 150), 'info')}
       </div>`
    : '<div class="text-secondary mt-2" style="font-size:0.72rem;">Sin datos</div>';

  return `<div class="col-6">
    <div class="p-3 rounded text-center h-100 d-flex flex-column justify-content-between arma-op-card">
      ${info?.type ? `<div class="text-end mb-1"><span class="badge bg-secondary bg-opacity-50" style="font-size:0.65rem;">${info.type}</span></div>` : ''}
      <img src="img/armas/${nombreArchivo(nombre)}.png" alt="${nombre.replace(/"/g, '&quot;')}">
      <div class="fw-bold text-white mt-2">${nombre}</div>
      ${stats}
    </div>
  </div>`;
}

const tarjetaGadget = nombre => `<div class="col-6">
    <div class="p-2 rounded text-center h-100 d-flex flex-column justify-content-between arma-op-card">
      <img src="img/gadgets/${nombreArchivo(nombre)}.png" alt="${nombre}">
      <div class="small fw-semibold text-white mt-1">${nombre}</div>
    </div>
  </div>`;

const grilla = (lista, tarjeta) =>
  lista?.length ? `<div class="row g-2 mt-1">${lista.map(tarjeta).join('')}</div>` : SIN_DATOS;

async function abrirDetalle(safename) {
  await asegurarArmas();
  const op = todosLosOperadores.find(o => o.safename === safename);
  if (!op) return;

  const roles = op.roles.map(r =>
    `<span class="badge bg-dark bg-opacity-75 border border-secondary me-1 text-capitalize">${r.toLowerCase()}</span>`
  ).join('');
  const dato = (etiqueta, valor) => `<div class="col-6"><strong>${etiqueta}:</strong> ${valor}</div>`;

  mostrarModal(op.name, `
    <div class="text-center mb-3 op-hero-banner" style="background-image:url('img/mapas/${fondoOperador(op)}')">
      <img src="img/operadores/${encodeURIComponent(op.name.toLowerCase())}.png" alt="${op.name}">
      <div class="mt-2">${roles}</div>
    </div>
    ${op.habilidad ? `<div class="alert alert-dark border-secondary py-2 mb-2"><strong>Habilidad única:</strong> ${op.habilidad}</div>` : ''}
    ${op.descripcion ? `<p class="small text-light opacity-75 mb-3">${op.descripcion}</p>` : ''}
    <div class="row small mb-3 g-2">
      ${dato('Nombre real', op.realname)}
      ${dato('Origen', op.birthplace)}
      ${dato('Unidad', t(op.unit))}
      ${dato('Temporada', op.season_introduced)}
      ${dato('Blindaje', op.health + '/3')}
      ${dato('Velocidad', op.speed + '/3')}
    </div>
    <hr class="border-secondary">
    <h6 class="text-warning mb-1">Armas Primarias</h6>${grilla(op.primarias, tarjetaArma)}
    <h6 class="text-warning mt-3 mb-1">Armas Secundarias</h6>${grilla(op.secundarias, tarjetaArma)}
    <h6 class="text-warning mt-3 mb-1">Aditamentos (Gadgets)</h6>${grilla(op.aditamentos, tarjetaGadget)}`);
}

/*  MAPAS  */
let mapas = [];
let planosMapas = {};
let pisosActuales = [];

async function cargarMapas() {
  [mapas, planosMapas] = await Promise.all([
    cargarJSON('data/mapas.json'),
    cargarJSON('img/planos/planos.json')
  ]);
  mostrarMapas();
}

function mostrarMapas() {
  const q = $('buscadorMapas').value.toLowerCase();
  const lista = mapas.filter(m =>
    t(m.name).toLowerCase().includes(q) || t(m.location).toLowerCase().includes(q));

  $('contenedorMapas').innerHTML = lista.map(m => {
    const slug = m.name.toLowerCase();
    const planos = planosMapas[slug];
    return `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card h-100 bg-dark text-light overflow-hidden">
        <div class="mapa-banner">
          <img src="img/mapas/${slug}.png" alt="">
          <span class="mapa-banner-texto">${t(m.name)}</span>
        </div>
        <div class="card-body">
          <p class="mb-1"><strong>Ubicación:</strong> ${t(m.location)}</p>
          <p class="mb-1"><strong>Lanzamiento:</strong> ${t(m.releaseDate)}</p>
          ${t(m.mapReworked) ? `<p class="mb-2"><strong>Rediseño:</strong> ${t(m.mapReworked)}</p>` : ''}
          <div>${t(m.playlists).split(',').filter(Boolean).map(p =>
            `<span class="badge bg-secondary me-1">${p.trim()}</span>`).join('')}</div>
          ${planos ? `<button type="button" class="btn btn-outline-warning btn-sm mt-3 w-100 fw-semibold"
              data-plano="${slug}" data-titulo="${t(m.name)}">Ver planos tácticos (${planos.length} pisos)</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('') || SIN_RESULTADOS;
}

/* Planos tácticos */
function seleccionarPiso(i) {
  const piso = pisosActuales[i];
  const img = $('imgModalPlanos');
  img.style.display = '';         
  img.src = piso.ruta;
  $('pieModalPlanos').textContent = piso.nombre;
  [...$('tabsModalPlanos').children].forEach((b, k) => {
    b.classList.toggle('btn-warning', k === i);
    b.classList.toggle('btn-outline-light', k !== i);
  });
}

function abrirPlanosMapa(slug, titulo) {
  pisosActuales = planosMapas[slug] || [];
  if (!pisosActuales.length) return;

  $('tituloModalPlanos').textContent = 'Planos tácticos — ' + titulo;
  $('tabsModalPlanos').innerHTML = pisosActuales.map((p, i) =>
    `<button type="button" class="btn btn-sm btn-outline-light" data-piso="${i}">${p.nivel || 'Nivel ' + (i + 1)}</button>`
  ).join('');
  seleccionarPiso(0);
  bootstrap.Modal.getOrCreateInstance($('modalPlanos')).show();
}

/* INICIO: PILARES */
const pilares = [
  {
    id: 'modos', num: 'I',
    titulo: 'Modos de juego',
    resumen: 'Bombas, Asegurar la zona y Rehén: objetivos asimétricos donde el tiempo y la posición deciden al ganador.',
    enlace: 'Ver reglas y objetivos →',
    modalTitulo: 'Modos de Juego Competitivos',
    cuerpo: `
      <div class="mb-3">
        <span class="badge bg-danger mb-2">ESTÁNDAR Y COMPETITIVO</span>
        <h6 class="text-warning fw-bold">1. Bombas (Desactivación)</h6>
        <p class="small text-light opacity-75">Es el modo principal y competitivo del juego. Los defensores protegen dos bombas ubicadas en salas conectadas; los atacantes deben plantar el <strong>Sedax</strong> en cualquiera de ellas y defenderlo durante 45 segundos hasta completar la desactivación.</p>
      </div>
      <div class="mb-3">
        <h6 class="text-warning fw-bold">2. Asegurar la zona</h6>
        <p class="small text-light opacity-75">Un contenedor biológico se encuentra en una sola habitación. Los atacantes deben despejar la sala y mantener presencia continua durante 10 segundos sin defensores dentro.</p>
      </div>
      <div>
        <h6 class="text-warning fw-bold">3. Rehén</h6>
        <p class="small text-light opacity-75 mb-0">Los atacantes deben infiltrarse, escoltar al rehén fuera del edificio hasta la zona de extracción y evitar que reciba fuego cruzado.</p>
      </div>`
  },
  {
    id: 'roles', num: 'II',
    titulo: 'Roles de escuadra',
    resumen: 'Desde Hard Breachers y Soporte en ataque hasta Anclas y Roamers en defensa: cada operador cumple una función vital.',
    enlace: 'Explorar roles →',
    modalTitulo: 'Roles Tácticos de Escuadra',
    cuerpo: `
      <div class="row g-3 small">
        <div class="col-md-6">
          <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary h-100">
            <span class="badge bg-warning text-dark mb-2">ATAQUE</span>
            <ul class="ps-3 mb-0 text-light opacity-75">
              <li class="mb-2"><strong>Hard Breacher:</strong> Abre paredes reforzadas (Thermite, Hibana, Ace).</li>
              <li class="mb-2"><strong>Soporte / Anti-gadgets:</strong> Inhabilita defensas eléctricas (Thatcher, Twitch, Kali).</li>
              <li><strong>Entry Fragger:</strong> Lidera la entrada y gana duelos iniciales (Ash, Iana, Buck).</li>
            </ul>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary h-100">
            <span class="badge bg-info text-dark mb-2">DEFENSA</span>
            <ul class="ps-3 mb-0 text-light opacity-75">
              <li class="mb-2"><strong>Ancla (Anchor):</strong> Permanece dentro del objetivo sosteniendo ángulos (Smoke, Mira, Rook).</li>
              <li class="mb-2"><strong>Roamer:</strong> Patrulla plantas lejanas para retrasar al rival (Caveira, Vigil, Jäger).</li>
              <li><strong>Denegación:</strong> Impide la apertura de muros (Bandit, Kaid, Mute).</li>
            </ul>
          </div>
        </div>
      </div>`
  },
  {
    id: 'destruccion', num: 'III',
    titulo: 'Destrucción y cobertura',
    resumen: 'Diferencia entre superficies blandas perforables, muros reforzados y coberturas indestructibles.',
    enlace: 'Ver mecánicas →',
    modalTitulo: 'Sistema de Destrucción y Cobertura',
    cuerpo: `
      <p class="small text-light opacity-75">El motor de destrucción en tiempo real permite moldear cada mapa durante la ronda:</p>
      <ul class="small text-light opacity-75">
        <li class="mb-0"><strong>Agujeros de rotación y líneas de tiro:</strong> Abrir pasos entre dos bombas permite a los defensores moverse sin exponerse a los pasillos principales.</li>
      </ul>`
  },
  {
    id: 'estadisticas', num: 'IV',
    titulo: 'Blindaje, velocidad y sonido',
    resumen: 'Cómo equilibran los operadores su resistencia, movilidad y nivel de ruido al desplazarse por el mapa.',
    enlace: 'Ver comparativa →',
    modalTitulo: 'Blindaje, Velocidad y Acústica',
    cuerpo: `
      <p class="small text-light opacity-75">Cada operador cuenta con una combinación fija de salud máxima y movilidad que define su estilo de juego:</p>
      <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary small mb-2">
        <strong class="text-warning">3 Velocidad / 1 Blindaje (100 HP):</strong> Desplazamiento rápido y sigiloso. Ideales para flanquear y sorprender.
      </div>
      <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary small mb-2">
        <strong class="text-info">2 Velocidad / 2 Blindaje (110 HP):</strong> Equilibrio versátil entre movilidad, ruido y resistencia en tiroteos.
      </div>
      <div class="p-3 rounded bg-black bg-opacity-50 border border-secondary small">
        <strong class="text-danger">1 Velocidad / 3 Blindaje (125 HP):</strong> Pasos más ruidosos y movimiento lento, pero absorben mayor daño para defender puntos fijos.
      </div>`
  }
];

function pintarPilares() {
  $('lista-pilares').innerHTML = pilares.map(p => `
    <div class="col">
      <div class="card h-100 bg-dark text-white border-danger ps-story-card" data-pilar="${p.id}">
        <div class="card-body p-4 d-flex flex-column justify-content-between">
          <div>
            <span class="text-danger fw-bold small d-block mb-2">PILAR ${p.num}</span>
            <h5 class="card-title fw-bold">${p.titulo}</h5>
            <p class="card-text text-secondary small">${p.resumen}</p>
          </div>
          <span class="text-warning small fw-semibold mt-3">${p.enlace}</span>
        </div>
      </div>
    </div>`).join('');
}

/* ESTRATEGIAS */
const estrategias = [
  {
    color: 'danger', claveColor: 'warning',
    etiqueta: '01 · Destrucción balística y brechas',
    titulo: 'Haz una entrada',
    parrafos: [
      'Además de su detallado diseño, las tácticas se complican con los entornos destructibles del juego. Puedes destruir muros y pisos enteros con balística, destrozarlos con mazos o perforarlos para mejorar tu línea de visión a punta de disparos.',
      'Cuando los defensores refuerzan paredes exteriores como el garaje de Chalet o Consulado, necesitarás especialistas en demolición pesada (Thermite, Hibana o Ace) apoyados con granadas de impacto electromagnético para abrir el acceso principal.'
    ],
    clave: 'Abre líneas cruzadas antes de entrar al punto',
    img: 'brecha', fallback: 'chalet', alt: 'Brecha táctica en garaje',
    tag: 'BRECHA', tagTexto: 'Apertura de muros reforzados y cobertura con humo'
  },
  {
    color: 'info',
    etiqueta: '02 · Arquitectura multinivel',
    titulo: 'Control vertical y trampillas',
    parrafos: [
      'El combate en Siege nunca ocurre en un solo piso. Romper el suelo de madera directamente encima del objetivo obliga a los defensores a abandonar sus esquinas seguras bajo presión constante desde las vigas superiores.',
      'Del mismo modo, controlar las trampillas del techo permite ejecutar descensos rápidos coordinados mientras otro compañero presiona desde los pasillos laterales, dividiendo la atención del equipo defensor.'
    ],
    clave: 'Asegura la planta superior antes de plantar el sedax',
    img: 'vertical', fallback: 'consulate', alt: 'Juego vertical y ángulos',
    tag: 'VERTICALIDAD', tagTexto: 'Disparos a través de suelos y control de trampillas'
  },
  {
    color: 'warning',
    etiqueta: '03 · Guerra de información',
    titulo: 'El reconocimiento gana tiroteos',
    parrafos: [
      'Entrar a una habitación sin verificar las esquinas es el error más común en Siege. Cada atacante dispone de dos drones: usa el primero para identificar el objetivo durante la preparación y salva el segundo para limpiar habitaciones en tiempo real.',
      'En defensa, colocar cámaras ocultas (Valkyrie, Maestro) o bloqueadores de señal (Mute, Mozzie) deja a los atacantes a ciegas en los últimos segundos de la ronda.'
    ],
    clave: 'No sacrifiques tu primer dron al encontrar las bombas',
    img: 'intel', fallback: 'bank', alt: 'Reconocimiento e inteligencia',
    tag: 'INTELIGENCIA', tagTexto: 'Limpieza de habitaciones con drones y cámaras tácticas'
  },
  {
    color: 'danger',
    etiqueta: '04 · Estructura defensiva',
    titulo: 'Anclas, Roamers y gestión del reloj',
    parrafos: [
      'Los defensores no necesitan eliminar a todo el equipo rival para ganar: solo deben impedir que planten el sedax hasta que el reloj llegue a cero. Para lograrlo, el equipo se divide en dos roles complementarios.',
      'Los <strong>Anclas</strong> (blindaje alto) sostienen el punto de bomba con humo, escudos desplegables y trampas, mientras los <strong>Roamers</strong> (velocidad alta) patrullan zonas alejadas para retrasar el avance atacante y quemar tiempo valioso.'
    ],
    clave: 'Como roamer, sobrevivir y retrasar vale más que arriesgar',
    img: 'defensa', fallback: 'clubhouse', alt: 'Defensa y control de zonas',
    tag: 'DEFENSA', tagTexto: 'Contención por zonas y retardo del avance enemigo'
  },
  {
    color: 'info',
    etiqueta: '05 · Trabajo en escuadra',
    titulo: 'Sinergia de gadgets y cobertura del plante',
    parrafos: [
      'Ningún operador es autosuficiente. Las mejores rondas nacen al encadenar habilidades: desactivar trampas eléctricas con Thatcher o granadas EMP, abrir el muro con Thermite, lanzar humo para bloquear líneas de tiro y cubrir al portador del sedax.',
      'Una vez activado el sedax, los roles se invierten: los atacantes pasan a defender la posición desde ángulos cruzados y a distancia mientras los defensores se ven forzados a desactivarlo bajo presión.'
    ],
    clave: 'Nunca plantes sin humo ni un compañero cubriendo el flanco',
    img: 'coordinacion', fallback: 'border', alt: 'Ejecución coordinada de escuadra',
    tag: 'ESCUADRA', tagTexto: 'Ejecución coordinada y defensa post-plante'
  }
];

function pintarEstrategias() {
  $('lista-estrategias').innerHTML = estrategias.map((e, i) => {
    const claveColor = e.claveColor || e.color;
    const textoTag = e.color === 'danger' ? '' : ' text-dark';   // danger lleva texto blanco
    return `
    <div class="ps-feature-block rounded-4 p-4 p-md-5 ${i === estrategias.length - 1 ? 'mb-2' : 'mb-4'}">
      <div class="row align-items-center g-4 ${i % 2 ? 'flex-lg-row-reverse' : ''}">
        <div class="col-lg-6">
          <span class="text-${e.color} text-uppercase fw-bold small d-block mb-2">${e.etiqueta}</span>
          <h3 class="h2 fw-bold text-white mb-3">${e.titulo}</h3>
          ${e.parrafos.map(p => `<p class="text-light opacity-75 mb-3">${p}</p>`).join('')}
          <div class="bg-dark border border-secondary rounded px-3 py-2 small">
            <div class="mb-1"><span class="badge bg-${e.color}${textoTag} me-2">${e.tag}</span><span class="text-light">${e.tagTexto}</span></div>
            <div class="fw-bold text-${claveColor}">Clave: ${e.clave}</div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="strat-shot-box rounded-3 overflow-hidden">
            <img src="img/estrategias/${e.img}.png" alt="${e.alt}" class="w-100 strat-shot-img" data-fallback="img/mapas/${e.fallback}.png">
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* GLOSARIO */
const glosarioR6 = [
  { termino: 'Anchor (Ancla)', desc: 'Defensor que permanece dentro o muy cerca del punto de bomba para sostener la posición hasta el final de la ronda.' },
  { termino: 'Roamer', desc: 'Defensor rápido que patrulla habitaciones alejadas del objetivo para retrasar a los atacantes y atacar por la espalda.' },
  { termino: 'Lurker', desc: 'Atacante que avanza en solitario por el lado opuesto del ataque principal para cortar rotaciones y flanquear.' },
  { termino: 'Entry Fragger', desc: 'Primer atacante en entrar al edificio o al punto de bomba para ganar los primeros duelos y abrir espacio.' },
  { termino: 'Support (Apoyo)', desc: 'Jugador encargado de dronear, abrir muros reforzados y portar o plantar el Sedax bajo cobertura.' },
  { termino: 'Hard Breach', desc: 'Apertura de muros o trampillas reforzadas usando dispositivos especializados (Thermite, Hibana, Ace o Maverick).' },
  { termino: 'Soft Breach', desc: 'Destrucción de paredes, pisos o barricadas sin reforzar mediante escopetas, cargas demoledoras o mazos.' },
  { termino: 'Bandit Trick', desc: 'Colocar una batería eléctrica justo cuando el enemigo instala una carga térmica en un muro reforzado para destruirla.' },
  { termino: 'Impact Trick', desc: 'Lanzar una granada de impacto por el hueco superior de un muro reforzado para destruir cargas de demolición antes de que detonen.' },
  { termino: 'Wall Denial', desc: 'Dispositivos defensivos (Bandit, Kaid, Mute, Tubarão) diseñados para impedir que los atacantes abran muros reforzados.' },
  { termino: 'Rotación', desc: 'Hueco abierto en una pared suave entre dos bombas para moverse rápidamente sin exponerse a los pasillos.' },
  { termino: 'Spawnpeek', desc: 'Romper una ventana o puerta al inicio de la ronda como defensor para disparar hacia la zona de aparición atacante.' },
  { termino: 'Runout', desc: 'Salir brevemente al exterior del edificio como defensor para sorprender a atacantes en rapel o ventanas.' },
  { termino: 'Sedax (Defuser)', desc: 'Maletín desactivador que los atacantes deben plantar en una de las bombas y defender durante 45 segundos.' },
  { termino: 'Post-plant', desc: 'Fase tras plantar el Sedax donde los atacantes defienden ángulos cruzados a distancia mientras los defensores intentan desactivarlo.' },
  { termino: 'Clutch', desc: 'Ganar una ronda siendo el último jugador vivo de tu equipo frente a varios rivales.' },
  { termino: 'Wallbang', desc: 'Eliminar o herir a un enemigo disparando a través de una pared, puerta o piso destructible sin verlo directamente.' },
  { termino: 'Prefire', desc: 'Empezar a disparar justo antes de asomarse por una esquina donde sospechas que hay un enemigo apuntando.' },
  { termino: 'Quick Peek', desc: 'Asomarse y regresar de una cobertura en una fracción de segundo usando inclinación para obtener información sin recibir daño.' },
  { termino: 'Pixel Angle', desc: 'Línea de visión extremadamente estrecha entre dos objetos que permite ver movimiento enemigo siendo casi invisible.' },
  { termino: 'Refrag / Trade', desc: 'Eliminar inmediatamente al enemigo que acaba de abatir a un compañero de tu equipo.' },
  { termino: 'Verticalidad', desc: 'Romper pisos de madera desde arriba o techos desde abajo para expulsar a los defensores de sus coberturas.' },
  { termino: 'Flank (Flanqueo)', desc: 'Rodear al equipo rival para atacarlo por la retaguardia o el costado mientras mira hacia otro ángulo.' },
  { termino: 'Callout', desc: 'Aviso corto y preciso por voz indicando la ubicación exacta y el operador enemigo avistado.' },
  { termino: 'Yellow Ping', desc: 'Marcador contextual que se coloca desde drones o cámaras sin alertar al rival de que fue detectado.' },
  { termino: 'Droneo', desc: 'Uso de drones para limpiar habitaciones antes de entrar, detectar trampas y guiar al equipo.' },
  { termino: 'One-tap', desc: 'Eliminar a un oponente con un único disparo limpio a la cabeza.' }
];

function pintarGlosario() {
  $('lista-glosario').innerHTML = glosarioR6.map(item => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 p-3 text-start">
        <h5 class="fw-bold text-warning mb-2" style="font-size: 1.05rem;">${item.termino}</h5>
        <p class="text-light opacity-75 small mb-0">${item.desc}</p>
      </div>
    </div>`).join('');
}

/* EVENTOS */
$('filtros').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  ladoActual = btn.dataset.lado;
  document.querySelectorAll('#filtros button')
    .forEach(b => b.classList.toggle('active', b === btn));
  mostrarOperadores();
});

$('buscador').addEventListener('input', e => {
  textoBusqueda = e.target.value.toLowerCase();
  mostrarOperadores();
});

$('operadores').addEventListener('click', e => {
  const card = e.target.closest('.operador-card');
  if (card) abrirDetalle(card.dataset.safename);
});

$('buscadorMapas').addEventListener('input', mostrarMapas);

$('contenedorMapas').addEventListener('click', e => {
  const btn = e.target.closest('[data-plano]');
  if (btn) abrirPlanosMapa(btn.dataset.plano, btn.dataset.titulo);
});

$('tabsModalPlanos').addEventListener('click', e => {
  const btn = e.target.closest('[data-piso]');
  if (btn) seleccionarPiso(Number(btn.dataset.piso));
});

$('lista-pilares').addEventListener('click', e => {
  const card = e.target.closest('[data-pilar]');
  const pilar = card && pilares.find(p => p.id === card.dataset.pilar);
  if (pilar) mostrarModal(pilar.modalTitulo, pilar.cuerpo);
});

/* INICIO */
pintarPilares();
pintarEstrategias();
pintarGlosario();
mostrarSeccion('historia');