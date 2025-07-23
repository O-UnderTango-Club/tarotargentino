<?php
$archivo = 'visitas.txt';

if (!file_exists($archivo)) {
    file_put_contents($archivo, 0);
}

$contador = (int)file_get_contents($archivo);
$contador++;
file_put_contents($archivo, $contador);

echo $contador;
?>