<?php
// obtener_comentarios.php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-cache');

$archivo = 'comentarios.json';

if (file_exists($archivo)) {
    echo file_get_contents($archivo);
} else {
    echo json_encode([]);
}
?>