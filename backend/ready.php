<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$playerId = $input['playerId'] ?? null;

if ($playerId === null) {
    echo json_encode(["success" => false, "message" => "Falta playerId"]);
    exit;
}

$gameFile = __DIR__ . '/game.json';

if (!file_exists($gameFile)) {
    file_put_contents($gameFile, json_encode(["turn" => null, "ready" => []]));
}

$game = json_decode(file_get_contents($gameFile), true);

if (!isset($game['ready'])) {
    $game['ready'] = [];
}

$game['ready'][$playerId] = true;

file_put_contents($gameFile, json_encode($game));

echo json_encode(["success" => true, "message" => "Jugador marcado como listo."]);