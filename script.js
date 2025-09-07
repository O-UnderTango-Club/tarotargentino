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
            fetch('guardar_comentario.php', { // Asegúrate de que la ruta sea correcta
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

    // --- FUNCIÓN PARA CARGAR Y MOSTRAR COMENTARIOS ---
    // Esta función ahora pide los comentarios al PHP para evitar problemas de caché
    function cargarComentarios() {
        // Se agrega un timestamp para asegurar que la respuesta no venga de la caché
        fetch('obtener_comentarios.php?ts=' + Date.now()) // Asegúrate de que la ruta sea correcta
            .then(r => r.json())
            .then(comentarios => {
                const contenedor = document.getElementById('listaComentarios');
                contenedor.innerHTML = ''; // Limpia la lista antes de volver a llenarla
                
                if (comentarios.length === 0) {
                    contenedor.innerHTML = '<p>Sé el primero en dejar un comentario.</p>';
                    return;
                }

                comentarios.forEach(c => {
                    const fecha = new Date(c.fecha);
                    const fechaFormateada = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    
                    // Se crea un div para cada comentario para mejor estructura
                    const comentarioDiv = document.createElement('div');
                    comentarioDiv.classList.add('comentario-item');
                    comentarioDiv.innerHTML = `<p>"${c.comentario}"</p><small><strong>${c.nombre}</strong> el ${fechaFormateada}</small><hr>`;
                    contenedor.appendChild(comentarioDiv);
                });
            })
            .catch(error => {
                console.error("Error al cargar comentarios:", error);
                contenedor.innerHTML = "<p>Error al cargar los comentarios.</p>";
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
            resultado.innerHTML = "<p>Error al cargar las cartas del tarot.</p>";
            console.error(error);
        });
}