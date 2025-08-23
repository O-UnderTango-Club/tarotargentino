<?php
// CORRECCIÓN: Si la petición es para el favicon, no hagas nada y termina el script.
// Esto evita que el contador sume una segunda vez por la solicitud automática del ícono.
if (isset($_SERVER['REQUEST_URI']) && $_SERVER['REQUEST_URI'] === '/favicon.ico') {
    exit();
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
ini_set('display_errors', 0); // pon 1 si quieres ver errores

$archivo = __DIR__ . '/visitas.txt';
if (!file_exists($archivo)) {
    file_put_contents($archivo, '0');
}

$visitas = (int)trim(@file_get_contents($archivo));
$visitas++;
file_put_contents($archivo, (string)$visitas, LOCK_EX);

echo json_encode(['ok' => true, 'visitas' => $visitas]);