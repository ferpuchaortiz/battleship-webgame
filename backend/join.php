<?php
header('Content-Type: application/json; charset=utf-8');

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

if (!file_exists($playersFile)) file_put_contents($playersFile, json_encode([]));
if (!file_exists($boardsFile)) file_put_contents($boardsFile, json_encode(new stdClass()));
if (!file_exists($gameFile)) file_put_contents($gameFile, json_encode(["turn" => null]));

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

$newId = count($players) > 0 ? max($players) + 1 : 1;
$players[] = $newId;

$board = [];
for ($y = 0; $y < 10; $y++) {
    $row = [];
    for ($x = 0; $x < 10; $x++) {
        $row[] = 0;
    }
    $board[] = $row;
}

// colocación simple de 5 celdas con barco
for ($i = 0; $i < 5; $i++) {
    $x = rand(0, 9);
    $y = rand(0, 9);
    $board[$y][$x] = 1;
}

$boards[$newId] = $board;

if ($game['turn'] === null) {
    $game['turn'] = $newId;
}

file_put_contents($playersFile, json_encode($players));
file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode([
    "success" => true,
    "playerId" => $newId
]);