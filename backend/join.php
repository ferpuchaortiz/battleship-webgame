<?php
header('Content-Type: application/json; charset=utf-8');

$room = $_GET["room"] ?? null;
if (!$room) {
    echo json_encode(["success" => false, "message" => "No se envió room"]);
    exit;
}

$dir = __DIR__ . "/rooms/$room";
if (!is_dir($dir)) {
    echo json_encode(["success" => false, "message" => "La sala no existe"]);
    exit;
}

$playersFile = "$dir/players.json";
$boardsFile = "$dir/boards.json";
$gameFile = "$dir/game.json";

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

// Nuevo ID
$newId = count($players) > 0 ? max($players) + 1 : 1;
$players[] = $newId;

// Crear tablero vacío
$board = [];
for ($y = 0; $y < 10; $y++) {
    $row = [];
    for ($x = 0; $x < 10; $x++) $row[] = 0;
    $board[] = $row;
}

$boards[$newId] = $board;
$game["ready"][$newId] = false;

if ($game["turn"] === null) {
    $game["turn"] = $newId;
}

file_put_contents($playersFile, json_encode($players));
file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode(["success" => true, "playerId" => $newId]);