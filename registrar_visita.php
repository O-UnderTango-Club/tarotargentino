<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$archivo = __DIR__ . '/visitas.txt';
if (!file_exists($archivo)) file_put_contents($archivo, '0');

$visitas = (int)trim(@file_get_contents($archivo));
$visitas++;
file_put_contents($archivo, (string)$visitas, LOCK_EX);

echo json_encode(['ok'=>true,'visitas'=>$visitas]);
