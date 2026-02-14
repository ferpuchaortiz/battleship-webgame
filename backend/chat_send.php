<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents("php://input"), true);

$room = $input["room"] ?? null;
$playerId = $input["playerId"] ?? null;
$message = trim($input["message"] ?? "");

if (!$room || !$playerId || $message === "") {
    echo json_encode(["success" => false]);
    exit;
}

$dir = __DIR__ . "/rooms/$room";
$chatFile = "$dir/chat.json";

$chat = json_decode(file_get_contents($chatFile), true);

$chat[] = [
    "player" => $playerId,
    "message" => $message,
    "time" => time()
];

file_put_contents($chatFile, json_encode($chat));

echo json_encode(["success" => true]);