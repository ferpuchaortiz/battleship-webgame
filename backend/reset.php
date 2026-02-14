<?php
header('Content-Type: application/json; charset=utf-8');

file_put_contents(__DIR__ . '/players.json', json_encode([]));
file_put_contents(__DIR__ . '/boards.json', json_encode(new stdClass()));
file_put_contents(__DIR__ . '/game.json', json_encode(["turn" => null]));

echo json_encode(["success" => true, "message" => "Partida reiniciada."]);