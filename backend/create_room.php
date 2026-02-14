<?php
header('Content-Type: application/json; charset=utf-8');

// Generar código de sala (4 caracteres)
$room = substr(str_shuffle("ABCDEFGHJKLMNPQRSTUVWXYZ23456789"), 0, 4);

// Crear carpeta
$dir = __DIR__ . "/rooms/$room";
mkdir($dir, 0777, true);

// Crear archivos base
file_put_contents("$dir/players.json", json_encode([]));
file_put_contents("$dir/boards.json", json_encode(new stdClass()));
file_put_contents("$dir/game.json", json_encode([
    "turn" => null,
    "ready" => new stdClass(),
    "winner" => null
]));
file_put_contents("$dir/chat.json", json_encode([]));

echo json_encode([
    "success" => true,
    "room" => $room
]);