<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$shooter = $input['shooter'];
$target = $input['target'];
$x = $input['x'];
$y = $input['y'];

$players = json_decode(file_get_contents(__DIR__ . '/players.json'), true);
$boards = json_decode(file_get_contents(__DIR__ . '/boards.json'), true);
$game = json_decode(file_get_contents(__DIR__ . '/game.json'), true);

if ($game['turn'] != $shooter) {
    echo json_encode(["success" => false, "message" => "No es tu turno."]);
    exit;
}

$cell = $boards[$target][$y][$x];

if ($cell === 2 || $cell === 3) {
    echo json_encode(["success" => false, "message" => "Ya disparaste ahí."]);
    exit;
}

if ($cell === 1) {
    $boards[$target][$y][$x] = 2;
    $msg = "¡Impacto!";
} else {