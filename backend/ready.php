<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents("php://input"), true);

$room = $input["room"] ?? null;
$playerId = $input["playerId"] ?? null;
$board = $input["board"] ?? null;

if (!$room || !$playerId || !$board) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

$dir = __DIR__ . "/rooms/$room";

$playersFile = "$dir/players.json";
$boardsFile = "$dir/boards.json";
$gameFile = "$dir/game.json";

$players = json_decode(file_get_contents($playersFile), true);
$boards = json_decode(file_get_contents($boardsFile), true);
$game = json_decode(file_get_contents($gameFile), true);

$boards[$playerId] = $board;
$game["ready"][$playerId] = true;

file_put_contents($boardsFile, json_encode($boards));
file_put_contents($gameFile, json_encode($game));

echo json_encode(["success" => true]);