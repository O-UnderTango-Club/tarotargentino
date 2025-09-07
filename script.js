'use strict';

// ==============================
// Utilidades simples
// ==============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ==============================
// Contador de visitas (al cargar)
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
  // evita múltiples envíos si hay recargas rápidas
  if (window.__visita_enviada) return;
  window.__visita_enviada = true;

  try {
    const r = await fetch('/tarot/registrar_visita.php?ts=' + Date.now(), {
      method: 'POST',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Accept': 'application/json' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const lbl = $('#contadorVisitas');
    if (lbl && d && typeof d.visitas !== 'undefined') {
      lbl.textContent = 'Visitas al sitio: ' + d.visitas;
    }
  } catch (e) {
    console.error('Error contador visitas:', e);
  }
});

// ==============================
// Comentarios: enviar y listar
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  const form = $('#formComentario');

  // --- Envío de comentario ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const datos = new FormData(form);

      try {
        const r = await fetch('/tarot/guardar_comentario.php', {
          method: 'POST',
          body: datos
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);

        const data = await r.json();
        if (data && data.success) {
          form.reset();
          await cargarComentarios(); // refresca la lista
        } else {
          alert((data && data.error) || 'Hubo un error al guardar el comentario.');
        }
      } catch (err) {
        console.error('Error al enviar comentario:', err);
        alert('No se pudo conectar con el servidor para guardar el comentario.');
      }
    });
  }

  // --- Carga inicial de comentarios ---
  cargarComentarios();
});

/**
 * Carga y muestra los comentarios desde el servidor.
 * Usa el endpoint SINGULAR: obtener_comentario.php
 */
async function cargarComentarios() {
  const contenedor = $('#listaComentarios');
  if (!contenedor) {
    console.error("No se encontró el elemento con id 'listaComentarios'.");
    return;
  }

  // indicador simple de carga
  contenedor.innerHTML = '<p>Cargando comentarios…</p>';

  try {
    const r = await fetch('/tarot/obtener_comentario.php?ts=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);

    const comentarios = await r.json();

    contenedor.innerHTML = '';

    if (!Array.isArray(comentarios) || comentarios.length === 0) {
      contenedor.innerHTML = '<p>Sé el primero en dejar un comentario.</p>';
      return;
    }

    comentarios.forEach((c) => {
      const fecha = new Date(c.fecha);
      const fechaFormateada = isNaN(fecha)
        ? (c.fecha || '')
        : fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const div = document.createElement('div');
      div.className = 'comentario-item';
      div.innerHTML = `
        <p>"${escapeHtml(c.comentario || '')}"</p>
        <small><strong>${escapeHtml(c.nombre || 'Anónimo')}</strong> el ${fechaFormateada}</small>
        <hr>
      `;
      contenedor.appendChild(div);
    });
  } catch (err) {
    console.error('Error al cargar comentarios:', err);
    contenedor.innerHTML = '<p>En este momento no se pueden cargar los comentarios. Intentá de nuevo más tarde.</p>';
  }
}

// Pequeña utilidad para evitar inyectar HTML desde el JSON
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ==============================
// Tarot: tirar carta
// ==============================
async function tirarCarta() {
  const preguntaEl = $('#pregunta');
  const resultado = $('#resultado');

  if (!preguntaEl || !resultado) return;

  const pregunta = (preguntaEl.value || '').trim();
  if (!pregunta) {
    alert('Por favor, escribí una pregunta');
    return;
  }

  try {
    const r = await fetch('/tarot/cartas.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const cartas = await r.json();

    if (!Array.isArray(cartas) || cartas.length === 0) {
      resultado.innerHTML = '<p>No hay cartas disponibles.</p>';
      return;
    }

    const carta = cartas[Math.floor(Math.random() * cartas.length)];

    resultado.innerHTML = `
      <p>Tu carta es: <strong>${escapeHtml(carta.nombre || 'Carta')}</strong></p>
      <img src="/tarot/${escapeHtml(carta.imagen || '')}" alt="${escapeHtml(carta.nombre || 'Carta')}">
      <p>${escapeHtml(carta.texto || '')}</p>
    `;
  } catch (err) {
    console.error('Error al cargar cartas:', err);
    resultado.innerHTML = '<p>Error al cargar las cartas del tarot.</p>';
  }
}

// Exponer tirarCarta al scope global para el botón inline
window.tirarCarta = tirarCarta;
