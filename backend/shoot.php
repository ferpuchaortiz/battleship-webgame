<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$shooter = $input['shooter'];
$target = $input['target'];
$x = $input['x'];
$y = $input['y'];

$players = json_decode(file_get_contents(__DIR__ . '/players.json'), true);
$boards = json_decode(file_get_contents(__DIR__ . '/boards.json'), true);
$game = json_decode(file_get_contents(__DIR__ . '/game.json'), true);

if ($game['turn'] != $shooter) {
    echo json_encode(["success" => false, "message" => "No es tu turno."]);
    exit;
}

$board = $boards[$target];
$cell = $board[$y][$x];

if ($cell === 2 || $cell === 3) {
    echo json_encode(["success" => false, "message" => "Ya disparaste ahí."]);
    exit;
}

$hit = false;
$sunk = false;

// Impacto
if ($cell === 1) {
    $board[$y][$x] = 2;
    $hit = true;

    // Detectar hundimiento
    if (isShipSunk($board, $x, $y)) {
        $sunk = true;
        $msg = "¡Hundiste un barco del jugador $target!";
    } else {
        $msg = "¡Impacto!";
    }

} else {
    $board[$y][$x] = 3;
    $msg = "Agua.";
}

$boards[$target] = $board;

// Avanzar turno
$currentIndex = array_search($shooter, $players);
$nextIndex = ($currentIndex + 1) % count($players);
$game['turn'] = $players[$nextIndex];

file_put_contents(__DIR__ . '/boards.json', json_encode($boards));
file_put_contents(__DIR__ . '/game.json', json_encode($game));

echo json_encode([
    "success" => true,
    "message" => $msg,
    "hit" => $hit,
    "sunk" => $sunk
]);


// ------------------------------
// FUNCIONES AUXILIARES
// ------------------------------

function isShipSunk($board, $x, $y) {
    $visited = [];
    return !hasRemainingShipCells($board, $x, $y, $visited);
}

function hasRemainingShipCells($board, $x, $y, &$visited) {
    $key = "$x,$y";
    if (isset($visited[$key])) return false;
    $visited[$key] = true;

    $cell = $board[$y][$x];

    // Si encontramos una parte intacta del barco → NO está hundido
    if ($cell === 1) return true;

    // Si es agua o fuera de rango → no cuenta
    if ($cell !== 2) return false;

    // Revisar vecinos
    $dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    foreach ($dirs as $d) {
        $nx = $x + $d[0];
        $ny = $y + $d[1];

        if ($nx >= 0 && $nx < 10 && $ny >= 0 && $ny < 10) {
            if (hasRemainingShipCells($board, $nx, $ny, $visited)) {
                return true;
            }
        }
    }

    return false;
}