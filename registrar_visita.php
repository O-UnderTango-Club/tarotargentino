<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
ini_set('display_errors', 0);

// Solo 1 copia de este archivo: idealmente en /public_html/tarot/ (no dentro de /assets)

$archivo = __DIR__ . '/visitas.txt';
if (!file_exists($archivo)) file_put_contents($archivo, '0');

// Incrementar SOLAMENTE para POST
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Antidoble: si dos requests llegan casi juntas en la MISMA sesión, solo cuenta 1
session_start();
$ahora = microtime(true);
$ultimo = isset($_SESSION['__ultima_visita']) ? (float)$_SESSION['__ultima_visita'] : 0.0;
$delta = $ahora - $ultimo;

// Si no es POST, devolveme el valor sin incrementar
if ($method !== 'POST') {
  $visitas = (int)trim(@file_get_contents($archivo));
  echo json_encode(['ok' => true, 'visitas' => $visitas, 'skipped' => true, 'reason' => 'not-post']);
  exit;
}

// Si ya contamos hace < 1.0s en esta sesión, no vuelvas a contar
if ($delta < 1.0) {
  $visitas = (int)trim(@file_get_contents($archivo));
  echo json_encode(['ok' => true, 'visitas' => $visitas, 'skipped' => true, 'reason' => 'throttled']);
  exit;
}

// Incremento atómico con bloqueo de archivo
$fp = fopen($archivo, 'c+');
if (!$fp) { http_response_code(500); echo json_encode(['ok'=>false, 'error'=>'cant_open']); exit; }

flock($fp, LOCK_EX);
$contenido = stream_get_contents($fp);
$visitas = (int)trim($contenido);
$visitas++;
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, (string)$visitas);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

// marca la hora para la sesión
$_SESSION['__ultima_visita'] = (string)$ahora;

echo json_encode(['ok' => true, 'visitas' => $visitas]);
