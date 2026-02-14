<?php
header('Content-Type: application/json; charset=utf-8');

$room = $_GET["room"] ?? null;
$dir = __DIR__ . "/rooms/$room";

$chat = json_decode(file_get_contents("$dir/chat.json"), true);

echo json_encode([
    "success" => true,
    "messages" => $chat
]);