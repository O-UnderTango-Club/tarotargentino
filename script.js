function tirarCarta() {
  const pregunta = document.getElementById('pregunta').value.trim();
  const resultado = document.getElementById('resultado');

  if (!pregunta) {
    alert('Por favor, escribí una pregunta');
    return;
  }

  fetch('cartas.json')
    .then(response => response.json())
    .then(cartas => {
      const carta = cartas[Math.floor(Math.random() * cartas.length)];

      resultado.innerHTML = `
        <p>Tu carta es: <strong>${carta.nombre}</strong></p>
        <img src="${carta.imagen}" alt="${carta.nombre}">
        <p>${carta.texto}</p>
      `;
    })
    .catch(error => {
      resultado.innerHTML = "<p>Error al cargar las cartas.</p>";
      console.error(error);
    });
}

// Enviar comentario
const form = document.getElementById('formComentario');
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const datos = new FormData(form);

  fetch('guardar_comentario.php', {
    method: 'POST',
    body: datos
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      form.reset();
      cargarComentarios();
    } else {
      alert(data.error);
    }
  });
});

// Mostrar comentarios
function cargarComentarios() {
  fetch('comentarios.json')
    .then(r => r.json())
    .then(comentarios => {
      const contenedor = document.getElementById('listaComentarios');
      contenedor.innerHTML = '';
      comentarios.forEach(c => {
        contenedor.innerHTML += `<p><strong>${c.nombre}</strong> (${c.fecha}):<br>${c.comentario}</p><hr>`;
      });
    });
}

// Contador de visitas
function registrarVisita() {
  fetch('registrar_visita.php')
    .then(r => r.text())
    .then(n => {
      document.getElementById('contadorVisitas').textContent = `Visitas al sitio: ${n}`;
    });
}

registrarVisita();
cargarComentarios();