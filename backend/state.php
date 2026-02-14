<?php
header('Content-Type: application/json; charset=utf-8');

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

if (!file_exists($playersFile)) file_put_contents($playersFile, json_encode([]));
if (!file_exists($boardsFile)) file_put_contents($boardsFile, json_encode(new stdClass()));
if (!file_exists($gameFile)) file_put_contents($gameFile, json_encode(["turn" => null, "ready" => new stdClass()]));

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

$ready = isset($game['ready']) ? $game['ready'] : [];

echo json_encode([
    "success" => true,
    "players" => $players,
    "boards" => $boards,
    "turn" => $game['turn'],
    "ready" => $ready
]);