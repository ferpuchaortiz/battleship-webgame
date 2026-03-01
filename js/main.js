// =========================
// VARIABLES GLOBALES
// =========================

let roomCode = null;
let playerId = null;
let gameState = null;

let placingShips = true;
let orientation = "H";
let selectedShipSize = null;

let localBoard = createEmptyBoard();

// =========================
// CREAR TABLERO VACÍO
// =========================

function createEmptyBoard() {
  const board = [];
  for (let y = 0; y < 10; y++) {
    const row = [];
    for (let x = 0; x < 10; x++) row.push(0);
    board.push(row);
  }
  return board;
}

// =========================
// COLOCAR BARCO
// =========================

function placeShipAt(x, y) {
  if (!selectedShipSize) {
    statusDiv.textContent = "Selecciona un barco.";
    return;
  }

  const size = selectedShipSize;

  if (orientation === "H" && x + size > 10) {
    statusDiv.textContent = "No cabe horizontal.";
    return;
  }
  if (orientation === "V" && y + size > 10) {
    statusDiv.textContent = "No cabe vertical.";
    return;
  }

  for (let i = 0; i < size; i++) {
    const cx = orientation === "H" ? x + i : x;
    const cy = orientation === "H" ? y : y + i;
    if (localBoard[cy][cx] > 0) {
      statusDiv.textContent = "Se superpone.";
      return;
    }
  }

  for (let i = 0; i < size; i++) {
    const cx = orientation === "H" ? x + i : x;
    const cy = orientation === "H" ? y : y + i;
    localBoard[cy][cx] = size;
  }

  selectedShipSize = null;
  document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));
  renderGame();
}

// =========================
// RECOGER BARCO
// =========================

function pickUpShipFrom(x, y) {
  const id = localBoard[y][x];
  if (id <= 0) return;

  let orientationDetected = null;

  if (x + 1 < 10 && localBoard[y][x + 1] === id) orientationDetected = "H";
  else if (x - 1 >= 0 && localBoard[y][x - 1] === id) orientationDetected = "H";
  else if (y + 1 < 10 && localBoard[y + 1][x] === id) orientationDetected = "V";
  else if (y - 1 >= 0 && localBoard[y - 1][x] === id) orientationDetected = "V";
  else orientationDetected = "H";

  const cells = [{ x, y }];

  if (orientationDetected === "H") {
    let cx = x - 1;
    while (cx >= 0 && localBoard[y][cx] === id) {
      cells.push({ x: cx, y });
      cx--;
    }
    cx = x + 1;
    while (cx < 10 && localBoard[y][cx] === id) {
      cells.push({ x: cx, y });
      cx++;
    }
  } else {
    let cy = y - 1;
    while (cy >= 0 && localBoard[cy][x] === id) {
      cells.push({ x, y: cy });
      cy--;
    }
    cy = y + 1;
    while (cy < 10 && localBoard[cy][x] === id) {
      cells.push({ x, y: cy });
      cy++;
    }
  }

  cells.forEach(c => {
    localBoard[c.y][c.x] = 0;
  });

  selectedShipSize = cells.length;
  statusDiv.textContent = `Reubicando barco de tamaño ${selectedShipSize}`;

  document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));

  renderGame();
}

// =========================
// RENDER DEL JUEGO
// =========================

function renderGame() {

  if (!gameState || !playerId) return;

  const { players, boards, turn, ready, winner } = gameState;
  const allReady = players.length > 0 && players.every(p => ready[p]);

    // 🔥 Cambiar luces LED según el turno
  if (!allReady) {
    document.body.setAttribute("data-turn", "placing");
  } else if (turn === playerId) {
    document.body.setAttribute("data-turn", "me");
  } else {
    document.body.setAttribute("data-turn", "enemy");
  }

  if (winner) {
    statusDiv.textContent = `🏆 ¡El jugador ${winner} ha ganado la partida!`;
  } else if (!allReady) {
    statusDiv.textContent = "Fase de colocación: esperando a todos...";
  } else {
    statusDiv.textContent =
      turn === playerId ? "Es tu turno (disparos)" : `Turno del jugador ${turn}`;
  }

  playersList.innerHTML = `<p>Jugadores: ${players.join(", ")}</p>`;

  myBoardContainer.innerHTML = "";
  enemyBoardsContainer.innerHTML = "";

  players.forEach(pId => {
    const isReady = ready[pId];

    // 🔥 CORRECCIÓN CRÍTICA:
    // SIEMPRE usar localBoard para el jugador local
    const boardData = pId === playerId ? localBoard : boards[pId];

    const title = document.createElement("p");
    title.textContent =
      pId === playerId
        ? `Jugador ${pId} (Tú) ${isReady ? "[Listo]" : "[Colocando]"}`
        : `Jugador ${pId} ${isReady ? "[Listo]" : "[Colocando]"}`;

    const boardDiv = document.createElement("div");
    boardDiv.className = "board";

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";

        const cell = boardData[y][x];

        if (pId === playerId && cell > 0) {
          cellDiv.classList.add("own");
        }

        if (cell === 2) cellDiv.classList.add("hit");
        if (cell === 3) cellDiv.classList.add("miss");
        if (cell === 4) cellDiv.classList.add("sunk");

        if (!winner) {
          if (pId === playerId && placingShips && !isReady) {
            cellDiv.addEventListener("click", () => {
              if (localBoard[y][x] > 0) {
                pickUpShipFrom(x, y);
              } else {
                placeShipAt(x, y);
              }
            });
          }

          if (allReady && pId !== playerId && turn === playerId) {
            cellDiv.addEventListener("click", () => shoot(pId, x, y));
          }
        }

        boardDiv.appendChild(cellDiv);
      }
    }

    if (pId === playerId) {
      myBoardContainer.appendChild(title);
      myBoardContainer.appendChild(boardDiv);
    } else {
      enemyBoardsContainer.appendChild(title);
      enemyBoardsContainer.appendChild(boardDiv);
    }
  });
}

// =========================
// BOTÓN LISTO
// =========================

readyBtn.addEventListener("click", async () => {
  placingShips = false;
  readyBtn.classList.add("disabled");
  readyBtn.disabled = true;
  statusDiv.textContent = "Marcado como listo. Enviando tablero...";

  try {
    const res = await fetch("backend/ready.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: roomCode,
        playerId,
        board: localBoard
      })
    });
    const data = await res.json();
    if (!data.success) statusDiv.textContent = data.message;
    else addLog(`Jugador ${playerId} está listo.`, "info");
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al comunicar estado listo.";
  }
});