<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$playerId = $input['playerId'] ?? null;
$board = $input['board'] ?? null;

$gameFile = __DIR__ . '/game.json';
$boardsFile = __DIR__ . '/boards.json';

$game = json_decode(file_get_contents($gameFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);

if ($board !== null) {
    $boards[$playerId] = $board;
    file_put_contents($boardsFile, json_encode($boards));
}

$game['ready'][$playerId] = true;

file_put_contents($gameFile, json_encode($game));

echo json_encode(["success" => true]);