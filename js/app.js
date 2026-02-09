(function () {
  const INVITADOS_URL = 'config/invitados.json';
  const params = new URLSearchParams(window.location.search);
  const invitacionId = (params.get('id') || '').trim();

  // Elementos
  const elNombre = document.getElementById('quinceaneraNombre');
  const elFrase  = document.getElementById('frase');
  const elSaludo = document.getElementById('saludo');
  const elMesaInfo = document.getElementById('mesaInfo');
  const elMesaNum = document.getElementById('mesaNum');
  const elCupoNum = document.getElementById('cupoNum');
  const elFechaTexto = document.getElementById('fechaTexto');
  const elLugarNombre = document.getElementById('lugarNombre');
  const btnMapa = document.getElementById('btnMapa');
  const btnWhatsapp = document.getElementById('btnWhatsapp');
  const inputAsistentes = document.getElementById('asistentes');

  const diasEl = document.getElementById('dias');
  const horasEl = document.getElementById('horas');
  const minEl = document.getElementById('min');
  const segEl = document.getElementById('seg');

  // Seguridad básica: evitar IDs malformados
  const sanitizeId = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();

  // Carga de configuración
  fetch(INVITADOS_URL)
    .then(r => r.json())
    .then(data => init(data))
    .catch(err => {
      console.error('Error cargando configuración', err);
      elSaludo.textContent = 'No se pudo cargar la invitación. Intenta más tarde.';
    });

  function init(config) {
    const evento = config.evento || {};
    const invitados = config.invitados || {};
    const id = sanitizeId(invitacionId);

    // Datos de evento
    const fechaISO = evento.fecha_iso || '2026-04-25T18:00:00-06:00';
    const fechaObj = new Date(fechaISO);
    const nombreQuince = evento.quinceanera_nombre || 'Tu Hija';
    const frase = evento.frase || 'Un cuento de hadas está por comenzar…';
    const lugarNombre = evento.lugar_nombre || 'Salón Real';
    const mapsUrl = evento.maps_url || '#';
    const whatsapp = evento.whatsapp || ''; // formato 52XXXXXXXXXX

    elNombre.textContent = nombreQuince;
    elFrase.textContent = frase;
    elLugarNombre.textContent = lugarNombre;

    // Texto legible de fecha (ej. Sábado 25 de abril de 2026 · 6:00 pm)
    const fechaLegible = fechaObj.toLocaleString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Mexico_City'
    });
    elFechaTexto.textContent = capitalizarPrimera(fechaLegible.replace(',', ' · '));

    // Botón de mapa
    btnMapa.href = mapsUrl;

    // Personalización por invitado
    let invitado = null;
    if (id && invitados[id]) {
      invitado = invitados[id];
      const saludo = `Querid${terminacionGenero(invitado)} ${invitado.nombre}, estás cordialmente invitad${terminacionGenero(invitado)} a celebrar los XV años de ${nombreQuince}.`;
      elSaludo.textContent = saludo;

      // Mesa y cupo
      if (typeof invitado.mesa !== 'undefined') {
        elMesaNum.textContent = invitado.mesa;
      }
      if (typeof invitado.cupo !== 'undefined') {
        elCupoNum.textContent = invitado.cupo;
        inputAsistentes.max = String(invitado.cupo);
        if (Number(inputAsistentes.value) > invitado.cupo) inputAsistentes.value = invitado.cupo;
      }
      elMesaInfo.classList.remove('oculto');
    } else {
      elSaludo.textContent = `Querida familia y amigos: están cordialmente invitados a celebrar los XV años de ${nombreQuince}.`;
      elMesaInfo.classList.add('oculto');
    }

    // Contador regresivo
    startCountdown(fechaISO);

    // WhatsApp RSVP
    btnWhatsapp.addEventListener('click', () => {
      const n = Math.max(1, parseInt(inputAsistentes.value || '1', 10));
      const nombre = invitado?.nombre || 'Invitad@';
      const mesaTxt = (invitado?.mesa != null) ? `Mesa ${invitado.mesa}. ` : '';
      const idTxt = id ? ` (ID: ${id})` : '';

      const fechaCorta = fechaObj.toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' });
      const hora = fechaObj.toLocaleTimeString('es-MX', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:'America/Mexico_City' });

      const msg = `¡Hola! Soy ${nombre}${idTxt}. Confirmo ${n} asistente(s) para los XV años de ${nombreQuince} el ${fechaCorta} a las ${hora}. ${mesaTxt}¡Gracias!`;
      const phone = whatsapp || '52XXXXXXXXXX';
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener');
    });
  }

  function startCountdown(isoString) {
    const eventTime = new Date(isoString).getTime();
    const tick = () => {
      const now = Date.now();
      let diff = Math.max(0, eventTime - now);

      const d = Math.floor(diff / (1000*60*60*24));
      diff -= d * (1000*60*60*24);
      const h = Math.floor(diff / (1000*60*60));
      diff -= h * (1000*60*60);
      const m = Math.floor(diff / (1000*60));
      diff -= m * (1000*60);
      const s = Math.floor(diff / 1000);

      diasEl.textContent = d;
      horasEl.textContent = h.toString().padStart(2,'0');
      minEl.textContent = m.toString().padStart(2,'0');
      segEl.textContent = s.toString().padStart(2,'0');
    };
    tick();
    setInterval(tick, 1000);
  }

  function capitalizarPrimera(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function terminacionGenero(inv){
    // si nombre termina con 'a' asumimos femenino para saludo (ligera heurística)
    if (!inv?.nombre) return 'o/a';
    const n = inv.nombre.trim();
    return n.endsWith('a') ? 'a' : 'o';
  }
})();

// === Destellos (sparkles) cada 3 segundos alrededor del marco ===
(function sparklesAroundFrame(){
  const container = document.querySelector('.scroll');
  if (!container) return;

  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function spawnSparkles() {
    if (!motionOK) return;

    // Genera de 4 a 8 chispas
    const count = Math.floor(rand(4, 9));

    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.className = 'sparkle';

      // Tamaño aleatorio
      if (Math.random() < 0.33) sp.classList.add('big');
      else if (Math.random() < 0.5) sp.classList.add('small');

      // Posición: distribuimos a lo largo del borde exterior del contenedor
      // Elegimos un lado aleatorio (top, right, bottom, left)
      const side = Math.floor(rand(0, 4));
      const offset = rand(4, 96); // % a lo largo del lado
      const spread = rand(-10, 10); // ligera separación hacia afuera

      // Coordenadas relativas
      const rectPad = 6; // separarlo un poco del borde
      sp.style.position = 'absolute';

      switch (side) {
        case 0: // top
          sp.style.top = (-rectPad + spread) + 'px';
          sp.style.left = `calc(${offset}% - 3px)`;
          break;
        case 1: // right
          sp.style.top = `calc(${offset}% - 3px)`;
          sp.style.right = (-rectPad + spread) + 'px';
          break;
        case 2: // bottom
          sp.style.bottom = (-rectPad + spread) + 'px';
          sp.style.left = `calc(${offset}% - 3px)`;
          break;
        case 3: // left
          sp.style.top = `calc(${offset}% - 3px)`;
          sp.style.left = (-rectPad + spread) + 'px';
          break;
      }

      container.appendChild(sp);

      // Limpieza al terminar la animación
      sp.addEventListener('animationend', () => sp.remove());
    }
  }

  // Primera tanda inmediata y luego cada 3 segundos
  spawnSparkles();
  setInterval(spawnSparkles, 3000);
})();


