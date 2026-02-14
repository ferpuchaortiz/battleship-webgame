<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

$room = $input["room"] ?? null;
$shooter = $input['shooter'];
$target = $input['target'];
$x = $input['x'];
$y = $input['y'];

$dir = __DIR__ . "/rooms/$room";

$players = json_decode(file_get_contents("$dir/players.json"), true);
$boards = json_decode(file_get_contents("$dir/boards.json"), true);
$game = json_decode(file_get_contents("$dir/game.json"), true);

// Si ya hay ganador
if ($game['winner'] !== null) {
    echo json_encode(["success" => false, "message" => "La partida ya terminó."]);
    exit;
}

// Turno incorrecto
if ($game['turn'] != $shooter) {
    echo json_encode(["success" => false, "message" => "No es tu turno."]);
    exit;
}

$board = $boards[$target];
$cell = $board[$y][$x];

if (in_array($cell, [2,3,4])) {
    echo json_encode(["success" => false, "message" => "Ya disparaste ahí."]);
    exit;
}

$hit = false;
$sunk = false;
$eliminated = false;

// Impacto
if ($cell === 1) {
    $board[$y][$x] = 2;
    $hit = true;

    if (isShipSunk($board, $x, $y)) {
        $sunk = true;
        markShipAsSunk($board, $x, $y);
        $msg = "¡Hundiste un barco del jugador $target!";
    } else {
        $msg = "¡Impacto!";
    }

} else {
    $board[$y][$x] = 3;
    $msg = "Agua.";
}

$boards[$target] = $board;

// Eliminación
if (!playerHasShips($board)) {
    $eliminated = true;
    $msg .= " ⚠️ El jugador $target ha sido eliminado.";

    $players = array_values(array_filter($players, fn($p) => $p != $target));
    file_put_contents("$dir/players.json", json_encode($players));
}

// Ganador
if (count($players) === 1) {
    $winner = $players[0];
    $game['winner'] = $winner;
    file_put_contents("$dir/game.json", json_encode($game));

    echo json_encode([
        "success" => true,
        "message" => "🏆 ¡El jugador $winner ha ganado la partida!",
        "hit" => $hit,
        "sunk" => $sunk,
        "eliminated" => $eliminated,
        "winner" => $winner
    ]);
    exit;
}

// Avanzar turno
$currentIndex = array_search($shooter, $players);
$nextIndex = ($currentIndex + 1) % count($players);
$game['turn'] = $players[$nextIndex];

file_put_contents("$dir/boards.json", json_encode($boards));
file_put_contents("$dir/game.json", json_encode($game));

echo json_encode([
    "success" => true,
    "message" => $msg,
    "hit" => $hit,
    "sunk" => $sunk,
    "eliminated" => $eliminated,
    "winner" => null
]);

// ------------------------------
// FUNCIONES AUXILIARES
// ------------------------------

function playerHasShips($board) {
    foreach ($board as $row)
        foreach ($row as $cell)
            if ($cell === 1) return true;
    return false;
}

function isShipSunk($board, $x, $y) {
    $visited = [];
    return !hasRemainingShipCells($board, $x, $y, $visited);
}

function hasRemainingShipCells($board, $x, $y, &$visited) {
    $key = "$x,$y";
    if (isset($visited[$key])) return false;
    $visited[$key] = true;

    $cell = $board[$y][$x];

    if ($cell === 1) return true;
    if ($cell !== 2) return false;

    $dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    foreach ($dirs as $d) {
        $nx = $x + $d[0];
        $ny = $y + $d[1];
        if ($nx >= 0 && $nx < 10 && $ny >= 0 && $ny < 10)
            if (hasRemainingShipCells($board, $nx, $ny, $visited))
                return true;
    }
    return false;
}

function markShipAsSunk(&$board, $x, $y) {
    $visited = [];
    floodFillSunk($board, $x, $y, $visited);
}

function floodFillSunk(&$board, $x, $y, &$visited) {
    $key = "$x,$y";
    if (isset($visited[$key])) return;
    $visited[$key] = true;

    if ($board[$y][$x] !== 2) return;

    $board[$y][$x] = 4;

    $dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    foreach ($dirs as $d) {
        $nx = $x + $d[0];
        $ny = $y + $d[1];
        if ($nx >= 0 && $nx < 10 && $ny >= 0 && $ny < 10)
            floodFillSunk($board, $nx, $ny, $visited);
    }
}