<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tarot Argentino</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
</head>
<body>
  <h1>Bienvenido al Tarot Argentino</h1>

  <p>Hacé tu pregunta y revelá tu destino...</p>
  <input type="text" id="pregunta" placeholder="Escribí tu pregunta" />
  <button onclick="tirarCarta()">Tirar carta</button>

  <div id="resultado" class="carta"></div>

  <div class="scroll-espacio"></div>

  <section class="secundaria">
    <h2>Dejá tu comentario</h2>
    <form id="formComentario" action="/tarot/enviar_comentario.php" method="POST">
      <input type="text" name="nombre" placeholder="Tu nombre" required><br>
      <textarea name="comentario" placeholder="Escribí tu comentario (máx. 300 caracteres)" maxlength="300" required></textarea><br>
      <button type="submit">Enviar comentario</button>
    </form>
    <div id="listaComentarios"></div>

    <p id="contadorVisitas">Visitas al sitio: —</p>
  </section>

  <footer class="footer-aviso">
    Sitio en construcción — Última actualización: 23/08/2025 - Tarot Argentino - Ø.
  </footer>

  <script src="script.js" defer></script>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      try {
        const url = '/tarot/registrar_visita.php?ts=' + Date.now();
        const r = await fetch(url, { method: 'GET', cache: 'no-store' });

        // Primero, verificamos si la respuesta del servidor fue exitosa (ej. no fue un error 404 o 500)
        if (!r.ok) {
          const errorBody = await r.text(); // Leemos el cuerpo del error como texto
          console.error('Error del servidor:', r.status, errorBody);
          return;
        }

        // Usamos el método .json() que convierte la respuesta directamente en un objeto JavaScript.
        // Si la respuesta no es un JSON válido, saltará al bloque catch automáticamente.
        const data = await r.json();

        // Verificamos que el objeto tenga la propiedad "visitas" que esperamos
        if (data && typeof data.visitas !== 'undefined') {
          const lbl = document.getElementById('contadorVisitas');
          if (lbl) lbl.textContent = 'Visitas al sitio: ' + data.visitas;
        } else {
          console.error('La respuesta JSON no tiene el formato esperado:', data);
        }

      } catch (e) {
        // Este bloque se activa si hay un error de red o si la respuesta no es un JSON válido.
        console.error('Error al procesar la respuesta:', e);
      }
    });
  </script>
</body>
</html>