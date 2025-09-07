<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-cache');

$archivo = __DIR__ . '/comentarios.json';
if (file_exists($archivo)) {
  $json = file_get_contents($archivo);
  // fallback defensivo si el archivo está vacío/corrupto
  json_decode($json);
  if (json_last_error() !== JSON_ERROR_NONE) { echo '[]'; exit; }
  echo $json;
} else {
  echo json_encode([]);
}
