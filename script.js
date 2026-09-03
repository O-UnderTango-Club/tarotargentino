'use strict';

const $ = (sel) => document.querySelector(sel);
const BASE_PATH = '/tarot/';
const MERCADO_PAGO_URL = 'https://link.mercadopago.com.ar/tarotargentino';

let cartasCache = null;
let cartaActual = null;
let preguntaActual = '';
let cartasRitual = [];
let ritualLocked = false;

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function descripcionCarta(carta) {
  return carta.texto || carta.descripcion || 'Esta carta todavía está desarrollando su interpretación dentro de la baraja.';
}

function palabrasClave(carta) {
  return carta.clave || carta.palabras_clave || '';
}

function rutaProyecto(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path)) return path;
  return BASE_PATH + String(path).replace(/^\/+/, '');
}

async function cargarCartas() {
  if (Array.isArray(cartasCache) && cartasCache.length) return cartasCache;

  const respuesta = await fetch(BASE_PATH + 'cartas.json?ts=' + Date.now(), { cache: 'no-store' });
  if (!respuesta.ok) throw new Error('No se pudo cargar cartas.json (HTTP ' + respuesta.status + ')');

  const cartas = await respuesta.json();
  if (!Array.isArray(cartas) || cartas.length === 0) throw new Error('La baraja no contiene cartas disponibles.');

  cartasCache = cartas;
  return cartasCache;
}

function mostrarError(mensaje) {
  const error = $('#formError');
  if (!error) return;
  error.textContent = mensaje;
  error.hidden = false;
}

function limpiarError() {
  const error = $('#formError');
  if (!error) return;
  error.textContent = '';
  error.hidden = true;
}

function configurarApoyo() {
  const apoyo = $('#apoyo');
  const link = $('#supportLink');

  if (!apoyo || !link || !MERCADO_PAGO_URL) return;

  link.href = MERCADO_PAGO_URL;
  apoyo.hidden = false;
}

function ejeCarta(carta) {
  const claves = palabrasClave(carta)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (claves.length) return claves[0].toLowerCase();

  const nombre = String(carta?.nombre || '').trim();
  return nombre ? `lo que despierta ${nombre}` : 'lo que esta carta te invita a mirar';
}

function reflexionCarta(carta) {
  const eje = ejeCarta(carta);

  if (preguntaActual) {
    return `Volvé a tu pregunta. ¿Qué cambia si la mirás desde ${eje}? ¿Qué parte de la situación pide ser vista con un poco más de atención?`;
  }

  return `Quedate un momento con esta pregunta: ¿dónde aparece ${eje} en tu día de hoy, y qué te invita a mirar con más atención?`;
}

function renderCarta(carta) {
  const resultado = $('#resultado');
  if (!resultado) return;

  const nombre = carta.nombre || 'Carta';
  const descripcion = descripcionCarta(carta);
  const clave = palabrasClave(carta);
  const imagen = rutaProyecto(carta.imagen || '');
  const palo = carta.palo ? ` · ${carta.palo}` : '';
  const preguntaHtml = preguntaActual
    ? `<p class="reading-question"><span>Tu pregunta</span>“${escapeHtml(preguntaActual)}”</p>`
    : '';

  resultado.innerHTML = `
    <article class="card-reading">
      <div class="card-image-wrap">
        <img id="cardImage" src="${escapeHtml(imagen)}" alt="${escapeHtml(nombre)}" loading="eager">
        <div id="cardImageError" class="card-image-error" hidden>La ilustración de esta carta está siendo revisada.</div>
      </div>
      <div class="card-copy">
        <p class="card-kicker">Tu carta${escapeHtml(palo)}</p>
        <h2>${escapeHtml(nombre)}</h2>
        ${preguntaHtml}
        <p class="interpretation">${escapeHtml(descripcion)}</p>
        ${clave ? `<p class="card-keywords"><strong>Claves:</strong> ${escapeHtml(clave)}</p>` : ''}
        <div class="reading-reflection">
          <strong>Para llevarte</strong>
          <p>${escapeHtml(reflexionCarta(carta))}</p>
        </div>
      </div>
    </article>
  `;

  const img = $('#cardImage');
  const fallback = $('#cardImageError');
  if (img && fallback) {
    img.addEventListener('error', () => {
      img.hidden = true;
      fallback.hidden = false;
    }, { once: true });
  }

  const acciones = $('#accionesLectura');
  if (acciones) acciones.hidden = false;

  configurarApoyo();
  resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mezclarYTomar(cartas, cantidad = 7) {
  const mezcla = [...cartas];

  for (let i = mezcla.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [mezcla[i], mezcla[j]] = [mezcla[j], mezcla[i]];
  }

  return mezcla.slice(0, Math.min(cantidad, mezcla.length));
}

function limpiarLecturaVisual() {
  const resultado = $('#resultado');
  const acciones = $('#accionesLectura');
  const apoyo = $('#apoyo');

  if (resultado) resultado.innerHTML = '';
  if (acciones) acciones.hidden = true;
  if (apoyo) apoyo.hidden = true;
}

function renderRitual() {
  const ritual = $('#ritual');
  const deck = $('#ritualDeck');
  const question = $('#ritualQuestion');

  if (!ritual || !deck || !question) return;

  question.textContent = preguntaActual
    ? `Tu pregunta: “${preguntaActual}”`
    : 'No escribiste una pregunta. Dejá que la carta abra una mirada para hoy.';

  deck.innerHTML = cartasRitual.map((carta, index) => {
    const imagen = rutaProyecto(carta.imagen || '');
    return `
      <button class="ritual-card" type="button" data-card-index="${index}" style="--delay:${index * 60}ms" aria-label="Elegir carta ${index + 1}">
        <span class="ritual-card-inner">
          <span class="ritual-card-back" aria-hidden="true"><span>✦</span></span>
          <span class="ritual-card-front" aria-hidden="true">
            <img src="${escapeHtml(imagen)}" alt="" loading="eager">
          </span>
        </span>
      </button>
    `;
  }).join('');

  deck.querySelectorAll('.ritual-card').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.cardIndex);
      elegirCarta(index, button);
    });
  });

  ritual.hidden = false;
  ritual.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function prepararRitual() {
  const preguntaEl = $('#pregunta');
  const boton = $('#botonTirada');

  if (!preguntaEl || !boton) return;

  preguntaActual = preguntaEl.value.trim();
  limpiarError();
  limpiarLecturaVisual();
  ritualLocked = false;
  boton.disabled = true;
  boton.textContent = 'Preparando…';

  try {
    const cartas = await cargarCartas();
    cartasRitual = mezclarYTomar(cartas, 7);
    cartaActual = null;
    renderRitual();
  } catch (error) {
    console.error(error);
    mostrarError('No pudimos abrir la baraja en este momento. Probá de nuevo en unos segundos.');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Comenzar mi tirada';
  }
}

function elegirCarta(index, button) {
  if (ritualLocked || !cartasRitual[index]) return;

  ritualLocked = true;
  cartaActual = cartasRitual[index];

  const deck = $('#ritualDeck');
  const ritual = $('#ritual');
  const buttons = deck ? [...deck.querySelectorAll('.ritual-card')] : [];

  buttons.forEach((item) => {
    item.disabled = true;
    if (item === button) item.classList.add('is-chosen');
    else item.classList.add('is-fading');
  });

  if ('vibrate' in navigator) {
    try { navigator.vibrate(18); } catch (_) { /* sin vibración disponible */ }
  }

  window.setTimeout(() => {
    if (ritual) ritual.hidden = true;
    renderCarta(cartaActual);
    ritualLocked = false;
  }, 920);
}

function cancelarRitual() {
  const ritual = $('#ritual');
  const deck = $('#ritualDeck');
  const pregunta = $('#pregunta');

  ritualLocked = false;
  cartasRitual = [];
  cartaActual = null;

  if (ritual) ritual.hidden = true;
  if (deck) deck.innerHTML = '';
  if (pregunta) {
    pregunta.focus();
    pregunta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function compartirCarta() {
  if (!cartaActual) return;

  const texto = `Me salió ${cartaActual.nombre || 'una carta'} en Tarot Argentino — tarotargentino.ar`;
  const data = {
    title: 'Tarot Argentino',
    text: texto,
    url: window.location.origin
  };

  try {
    if (navigator.share) {
      await navigator.share(data);
      return;
    }

    await navigator.clipboard.writeText(`${texto} ${window.location.origin}`);
    const boton = $('#shareButton');
    if (boton) {
      const anterior = boton.textContent;
      boton.textContent = 'Enlace copiado';
      setTimeout(() => { boton.textContent = anterior; }, 1800);
    }
  } catch (error) {
    if (error?.name !== 'AbortError') console.error('No se pudo compartir:', error);
  }
}

function reiniciarLectura() {
  cartaActual = null;
  cartasRitual = [];
  preguntaActual = '';
  ritualLocked = false;

  const ritual = $('#ritual');
  const deck = $('#ritualDeck');
  const pregunta = $('#pregunta');

  limpiarLecturaVisual();
  if (ritual) ritual.hidden = true;
  if (deck) deck.innerHTML = '';

  if (pregunta) {
    pregunta.value = '';
    pregunta.focus();
  }

  limpiarError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = $('#formTarot');
  const shareButton = $('#shareButton');
  const resetButton = $('#resetButton');
  const ritualCancel = $('#ritualCancel');
  const deckCount = $('#deckCount');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      prepararRitual();
    });
  }

  if (shareButton) shareButton.addEventListener('click', compartirCarta);
  if (resetButton) resetButton.addEventListener('click', reiniciarLectura);
  if (ritualCancel) ritualCancel.addEventListener('click', cancelarRitual);

  try {
    const cartas = await cargarCartas();
    if (deckCount) deckCount.textContent = `${cartas.length} cartas disponibles hoy`;
  } catch (error) {
    console.error('No se pudo precargar la baraja:', error);
  }
});
