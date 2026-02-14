<?php
header('Content-Type: application/json; charset=utf-8');

$playersFile = __DIR__ . '/players.json';
$boardsFile = __DIR__ . '/boards.json';
$gameFile = __DIR__ . '/game.json';

file_put_contents($playersFile, json_encode([]));
file_put_contents($boardsFile, json_encode(new stdClass()));
file_put_contents($gameFile, json_encode(["turn" => null, "ready" => new stdClass()]));

echo json_encode(["success" => true]);