<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = strip_tags($_POST['nombre']);
    $comentario = strip_tags($_POST['comentario']);
    $fecha = date('Y-m-d H:i:s');

    if (strlen($comentario) > 300) {
        echo json_encode(['error' => 'Comentario demasiado largo.']);
        exit;
    }

    $nuevoComentario = [
        'nombre' => $nombre,
        'comentario' => $comentario,
        'fecha' => $fecha
    ];

    $archivo = 'comentarios.json';
    $comentarios = file_exists($archivo) ? json_decode(file_get_contents($archivo), true) : [];
    array_unshift($comentarios, $nuevoComentario);
    file_put_contents($archivo, json_encode($comentarios, JSON_PRETTY_PRINT));

    echo json_encode(['success' => true]);
}
?>