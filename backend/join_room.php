<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents("php://input"), true);
$room = strtoupper($input["room"] ?? "");

$dir = __DIR__ . "/rooms/$room";

if (!is_dir($dir)) {
    echo json_encode(["success" => false, "message" => "La sala no existe"]);
    exit;
}

echo json_encode(["success" => true]);