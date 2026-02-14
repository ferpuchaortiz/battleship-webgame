<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$shooter = $input['shooter'];
$target = $input['target'];
$x = $input['x'];
$y = $input['y'];

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

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

if ($cell === 1) {
    $board[$y][$x] = 2;
    $message = "¡Impacto!";
} else {
    $board[$y][$x] = 3;
    $message = "Agua.";
}

$boards[$target] = $board;

$currentIndex = array_search($shooter, $players);
$nextIndex = ($currentIndex + 1) % count($players);
$game['turn'] = $players[$nextIndex];

file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode(["success" => true, "message" => $message]);