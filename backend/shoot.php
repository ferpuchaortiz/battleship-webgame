<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$shooter = $input['shooter'] ?? null;
$target = $input['target'] ?? null;
$x = $input['x'] ?? null;
$y = $input['y'] ?? null;

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

if ($shooter === null || $target === null || $x === null || $y === null) {
    echo json_encode(["success" => false, "message" => "Datos incompletos."]);
    exit;
}

if ($game['turn'] != $shooter) {
    echo json_encode(["success" => false, "message" => "No es tu turno."]);
    exit;
}

if (!in_array($shooter, $players) || !in_array($target, $players)) {
    echo json_encode(["success" => false, "message" => "Jugador inválido."]);
    exit;
}

$board = $boards[$target];

$cell = $board[$y][$x];

if ($cell === 2 || $cell === 3) {
    echo json_encode(["success" => false, "message" => "Ya disparaste a esa celda."]);
    exit;
}

if ($cell === 1) {
    $board[$y][$x] = 2;
    $message = "¡Impacto al jugador $target!";
} else {
    $board[$y][$x] = 3;
    $message = "Agua contra el jugador $target.";
}

$boards[$target] = $board;

$currentIndex = array_search($shooter, $players);
$nextIndex = ($currentIndex + 1) % count($players);
$game['turn'] = $players[$nextIndex];

file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode([
    "success" => true,
    "message" => $message
]);