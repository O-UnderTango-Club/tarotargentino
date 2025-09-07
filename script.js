// Espera a que todo el contenido del DOM esté cargado para evitar errores
document.addEventListener('DOMContentLoaded', () => {

    // --- MANEJO DEL FORMULARIO DE COMENTARIOS ---
    const form = document.getElementById('formComentario');
    if (form) {
        form.addEventListener('submit', function(e) {
            // Previene que la página se recargue al enviar
            e.preventDefault();
            const datos = new FormData(form);

            // Envía los datos al PHP para guardarlos
            // CORRECCIÓN: Se agrega la ruta completa /tarot/
            fetch('/tarot/guardar_comentario.php', { 
                method: 'POST',
                body: datos
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    form.reset(); // Limpia el formulario
                    cargarComentarios(); // Vuelve a cargar los comentarios para mostrar el nuevo
                } else {
                    alert(data.error || 'Hubo un error al guardar el comentario.');
                }
            })
            .catch(error => {
                console.error("Error al enviar comentario:", error);
                alert("No se pudo conectar con el servidor para guardar el comentario.");
            });
        });
    }

    // --- FUNCIÓN PARA CARGAR Y MOSTRAR COMENTARIOS (Versión corregida y robusta) ---
    function cargarComentarios() {
        // Se define el contenedor de comentarios al inicio de la función.
        const contenedor = document.getElementById('listaComentarios');

        // Si el contenedor no existe en la página, se detiene la función para evitar errores.
        if (!contenedor) {
            console.error("Error: No se encontró el elemento con id 'listaComentarios' en la página.");
            return;
        }

        // Se agrega un timestamp a la URL para asegurar que la respuesta del servidor no venga de la caché.
        // CORRECCIÓN: Se agrega la ruta completa /tarot/
        fetch('/tarot/obtener_comentarios.php?ts=' + Date.now())
            .then(response => {
                // Se verifica si la respuesta del servidor fue exitosa (ej. código 200 OK).
                // Si no lo fue (ej. error 404 o 500), se lanza un error para pasar al bloque .catch().
                if (!response.ok) {
                    throw new Error('Error del servidor: ' + response.status);
                }
                // Si la respuesta es exitosa, se convierte a formato JSON.
                return response.json();
            })
            .then(comentarios => {
                // Se limpia el contenido previo del contenedor.
                contenedor.innerHTML = ''; 
                
                // Si no hay comentarios, se muestra un mensaje invitando a ser el primero.
                if (comentarios.length === 0) {
                    contenedor.innerHTML = '<p>Sé el primero en dejar un comentario.</p>';
                    return;
                }

                // Se itera sobre cada comentario para crearlo y mostrarlo en la página.
                comentarios.forEach(c => {
                    const fecha = new Date(c.fecha);
                    const fechaFormateada = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    
                    // Se crea un nuevo elemento <div> para cada comentario.
                    const comentarioDiv = document.createElement('div');
                    comentarioDiv.classList.add('comentario-item');
                    
                    // Se asigna el contenido HTML al nuevo div.
                    comentarioDiv.innerHTML = `<p>"${c.comentario}"</p><small><strong>${c.nombre}</strong> el ${fechaFormateada}</small><hr>`;
                    
                    // Se añade el nuevo comentario al contenedor principal.
                    contenedor.appendChild(comentarioDiv);
                });
            })
            .catch(error => {
                // Si ocurre cualquier error en la cadena (de red, de servidor, de JSON), se captura aquí.
                console.error("Error al cargar comentarios:", error);
                // Se muestra un mensaje de error amigable al usuario en el contenedor.
                contenedor.innerHTML = "<p>En este momento no se pueden cargar los comentarios. Intenta de nuevo más tarde.</p>";
            });
    }

    // --- Carga inicial de comentarios ---
    cargarComentarios();

});


// --- FUNCIÓN PARA TIRAR LA CARTA (esta puede quedar fuera del DOMContentLoaded) ---
function tirarCarta() {
    const pregunta = document.getElementById('pregunta').value.trim();
    const resultado = document.getElementById('resultado');

    if (!pregunta) {
        alert('Por favor, escribí una pregunta');
        return;
    }

    // Asegúrate de tener el archivo cartas.json en la ruta correcta
    // CORRECCIÓN: Se agrega la ruta completa /tarot/
    fetch('/tarot/cartas.json')
        .then(response => response.json())
        .then(cartas => {
            const carta = cartas[Math.floor(Math.random() * cartas.length)];

            resultado.innerHTML = `
                <p>Tu carta es: <strong>${carta.nombre}</strong></p>
                <img src="/tarot/${carta.imagen}" alt="${carta.nombre}">
                <p>${carta.texto}</p>
            `;
        })
        .catch(error => {
            resultado.innerHTML = "<p>Error al cargar las cartas del tarot.</p>";
            console.error(error);
        });
}