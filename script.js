'use strict';

const $ = (sel) => document.querySelector(sel);

// Pegaremos acá el link real cuando esté definido.
// Mientras esté vacío, la tarjeta de apoyo no se muestra.
const MERCADO_PAGO_URL = '';

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

function descripcionCarta(carta) {
  return carta.texto || carta.descripcion || 'Esta carta todavía está desarrollando su interpretación dentro de la baraja.';
}

function palabrasClave(carta) {
  return carta.clave || carta.palabras_clave || '';
}

async function cargarCartas() {
  if (Array.isArray(cartasCache) && cartasCache.length) return cartasCache;

  const respuesta = await fetch('cartas.json?ts=' + Date.now(), { cache: 'no-store' });
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

function renderCarta(carta) {
  const resultado = $('#resultado');
  if (!resultado) return;

  const nombre = carta.nombre || 'Carta';
  const descripcion = descripcionCarta(carta);
  const clave = palabrasClave(carta);
  const imagen = carta.imagen || '';
  const palo = carta.palo ? ` · ${carta.palo}` : '';

  resultado.innerHTML = `
    <article class="card-reading">
      <div class="card-image-wrap">
        <img id="cardImage" src="${escapeHtml(imagen)}" alt="${escapeHtml(nombre)}" loading="eager">
        <div id="cardImageError" class="card-image-error" hidden>La ilustración de esta carta está siendo revisada.</div>
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

  const acciones = $('#accionesLectura');
  if (acciones) acciones.hidden = false;

  configurarApoyo();
  resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    renderCarta(cartaActual);
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

  if (resultado) resultado.innerHTML = '';
  if (acciones) acciones.hidden = true;
  if (apoyo) apoyo.hidden = true;
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
