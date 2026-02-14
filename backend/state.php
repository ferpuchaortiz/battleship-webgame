<?php
header('Content-Type: application/json; charset=utf-8');

$room = $_GET["room"] ?? null;
$dir = __DIR__ . "/rooms/$room";

$players = json_decode(file_get_contents("$dir/players.json"), true);
$boards = json_decode(file_get_contents("$dir/boards.json"), true);
$game = json_decode(file_get_contents("$dir/game.json"), true);

echo json_encode([
    "success" => true,
    "players" => $players,
    "boards" => $boards,
    "turn" => $game["turn"],
    "ready" => $game["ready"],
    "winner" => $game["winner"]
]);