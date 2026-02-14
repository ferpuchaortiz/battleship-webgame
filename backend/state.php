<?php
header('Content-Type: application/json; charset=utf-8');

$players = json_decode(file_get_contents(__DIR__ . '/players.json'), true);
$boards = json_decode(file_get_contents(__DIR__ . '/boards.json'), true);
$game = json_decode(file_get_contents(__DIR__ . '/game.json'), true);

echo json_encode([
    "success" => true,
    "players" => $players,
    "boards" => $boards,
    "turn" => $game['turn'],
    "ready" => $game['ready']
]);