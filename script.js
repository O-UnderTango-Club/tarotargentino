'use strict';

const $ = (sel) => document.querySelector(sel);
const BASE_PATH = '/tarot/';
const MERCADO_PAGO_URL = 'https://link.mercadopago.com.ar/tarotargentino';
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

let cartasCache = null;
let cartaActual = null;

function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function esperar(ms) {
  if (REDUCED_MOTION || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function renderCarta(carta) {
  const resultado = $('#resultado');
  if (!resultado) return;

  const acciones = $('#accionesLectura');
  const apoyo = $('#apoyo');
  const boton = $('#botonTirada');
  if (acciones) acciones.hidden = true;
  if (apoyo) apoyo.hidden = true;

  const nombre = carta.nombre || 'Carta';
  const descripcion = descripcionCarta(carta);
  const clave = palabrasClave(carta);
  const imagen = rutaProyecto(carta.imagen || '');
  const palo = carta.palo ? ` · ${carta.palo}` : '';

  resultado.setAttribute('aria-busy', 'true');
  resultado.innerHTML = `
    <article class="card-reading is-shuffling">
      <div class="card-image-wrap">
        <div class="card-aura" aria-hidden="true"></div>
        <div class="shuffle-ghost shuffle-ghost-left" aria-hidden="true"><span>✦</span></div>
        <div class="shuffle-ghost shuffle-ghost-right" aria-hidden="true"><span>✦</span></div>
        <div class="card-flipper">
          <div class="card-face card-face-back" aria-hidden="true">
            <div class="card-back-ornament"><span>✦</span></div>
            <p class="card-back-label">Tarot Argentino</p>
          </div>
          <div class="card-face card-face-front">
            <img id="cardImage" src="${escapeHtml(imagen)}" alt="${escapeHtml(nombre)}" loading="eager">
            <div id="cardImageError" class="card-image-error" hidden>La ilustración de esta carta está siendo revisada.</div>
          </div>
        </div>
      </div>
      <div class="card-copy">
        <p class="card-kicker">Tu carta${escapeHtml(palo)}</p>
        <h2>${escapeHtml(nombre)}</h2>
        <p class="interpretation">${escapeHtml(descripcion)}</p>
        ${clave ? `<p class="card-keywords"><strong>Claves:</strong> ${escapeHtml(clave)}</p>` : ''}
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

  resultado.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });

  const lectura = resultado.querySelector('.card-reading');

  await esperar(1050);
  if (lectura) {
    lectura.classList.remove('is-shuffling');
    lectura.classList.add('is-cutting');
  }
  if (boton) boton.textContent = 'Cortando…';

  await esperar(650);
  if (lectura) {
    lectura.classList.remove('is-cutting');
    lectura.classList.add('is-pausing');
  }
  if (boton) boton.textContent = 'La carta se acomoda…';

  await esperar(520);
  if (lectura) {
    lectura.classList.remove('is-pausing');
    lectura.classList.add('is-revealed');
  }
  if (boton) boton.textContent = 'Revelando…';

  await esperar(1050);

  if (lectura) lectura.classList.add('is-settled');
  if (acciones) acciones.hidden = false;
  configurarApoyo();
  resultado.setAttribute('aria-busy', 'false');
}

async function tirarCarta() {
  const preguntaEl = $('#pregunta');
  const boton = $('#botonTirada');

  if (!preguntaEl || !boton) return;

  const pregunta = preguntaEl.value.trim();
  if (!pregunta) {
    mostrarError('Escribí una pregunta antes de tirar la carta.');
    preguntaEl.focus();
    return;
  }

  limpiarError();
  boton.disabled = true;
  boton.textContent = 'Mezclando…';

  try {
    const cartas = await cargarCartas();
    cartaActual = cartas[Math.floor(Math.random() * cartas.length)];
    await renderCarta(cartaActual);
  } catch (error) {
    console.error(error);
    mostrarError('No pudimos abrir la baraja en este momento. Probá de nuevo en unos segundos.');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Tirar una carta';
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

  const resultado = $('#resultado');
  const acciones = $('#accionesLectura');
  const apoyo = $('#apoyo');
  const pregunta = $('#pregunta');

  if (resultado) {
    resultado.innerHTML = '';
    resultado.removeAttribute('aria-busy');
  }
  if (acciones) acciones.hidden = true;
  if (apoyo) apoyo.hidden = true;
  if (pregunta) {
    pregunta.value = '';
    pregunta.focus();
  }

  limpiarError();
  window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = $('#formTarot');
  const shareButton = $('#shareButton');
  const resetButton = $('#resetButton');
  const deckCount = $('#deckCount');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      tirarCarta();
    });
  }

  if (shareButton) shareButton.addEventListener('click', compartirCarta);
  if (resetButton) resetButton.addEventListener('click', reiniciarLectura);

  try {
    const cartas = await cargarCartas();
    if (deckCount) deckCount.textContent = `${cartas.length} cartas disponibles hoy`;
  } catch (error) {
    console.error('No se pudo precargar la baraja:', error);
  }
});
