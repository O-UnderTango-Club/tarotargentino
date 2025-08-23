<?php
// CORRECCIÓN: Ahora revisa la ruta completa incluyendo la carpeta /tarot/.
if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], 'favicon.ico') !== false) {
    exit();
}

// Envía las cabeceras para asegurar que la respuesta sea JSON y no se guarde en caché.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

// Oculta errores de PHP para no romper el formato JSON de la respuesta.
ini_set('display_errors', 0);

// Define la ruta al archivo que guarda las visitas.
$archivo = __DIR__ . '/visitas.txt';

// Si el archivo no existe, lo crea con el valor '0'.
if (!file_exists($archivo)) {
    file_put_contents($archivo, '0');
}

// Lee el número actual de visitas, lo convierte a un entero.
$visitas = (int)trim(@file_get_contents($archivo));

// Incrementa el contador en uno.
$visitas++;

// Guarda el nuevo número de visitas en el archivo.
file_put_contents($archivo, (string)$visitas, LOCK_EX);

// Devuelve una respuesta JSON a la página con el conteo actualizado.
echo json_encode(['ok' => true, 'visitas' => $visitas]);