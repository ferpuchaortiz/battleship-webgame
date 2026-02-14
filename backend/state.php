<?php
header('Content-Type: application/json; charset=utf-8');

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

echo json_encode([
    "success" => true,
    "players" => $players,
    "boards" => $boards,
    "turn" => $game['turn']
]);