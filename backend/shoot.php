<?php
header('Content-Type: application/json; charset=utf-8');

$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

$input = json_decode(file_get_contents('php://input'), true);
$shooter = $input['shooter'] ?? null;
$target = $input['target'] ?? null;
$x = $input['x'] ?? null;
$y = $input['y'] ?? null;

if ($shooter === null || $target === null || $x === null || $y === null) {
    echo json_encode(["success" => false, "message" => "Datos incompletos."]);
    exit;
}

$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

if ($game['turn'] !== $shooter) {
  echo json_encode(["success" => false, "message" => "No es tu turno."]);
  exit;
}

if (!isset($boards[$target])) {
  echo json_encode(["success" => false, "message" => "Tablero objetivo no encontrado."]);
  exit;
}

$board = $boards[$target];

if (!isset($board[$y][$x])) {
  echo json_encode(["success" => false, "message" => "Coordenadas fuera de rango."]);
  exit;
}

$cell = $board[$y][$x];

if ($cell === 2 || $cell === 3) {
  echo json_encode(["success" => false, "message" => "Ya disparaste a esa celda."]);
  exit;
}

if ($cell === 1) {
  $board[$y][$x] = 2;
  $message = "¡Impacto al jugador $target en ($x, $y)!";
} else {
  $board[$y][$x] = 3;
  $message = "Agua contra el jugador $target en ($x, $y).";
}

$boards[$target] = $board;

$playersFile = __DIR__ . '/players.json';
$players = json_decode(file_get_contents($playersFile), true);
if ($players && count($players) > 0) {
    $currentIndex = array_search($shooter, $players);
    $nextIndex = ($currentIndex + 1) % count($players);
    $game['turn'] = $players[$nextIndex];
}

file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode([
  "success" => true,
  "message" => $message
]);