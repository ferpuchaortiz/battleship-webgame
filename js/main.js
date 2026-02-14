console.log("Battleship Multijugador FFA iniciado");

let playerId = null;
let gameState = null;

const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");
const gameArea = document.getElementById("gameArea");
const playerInfo = document.getElementById("playerInfo");
const playersList = document.getElementById("playersList");
const myBoardContainer = document.getElementById("myBoardContainer");
const enemyBoardsContainer = document.getElementById("enemyBoardsContainer");
const resetBtn = document.getElementById("resetBtn");
const readyBtn = document.getElementById("readyBtn");

let selectedShipSize = null;
let placingShips = true;
let orientation = "H";

function createEmptyBoard() {
  const board = [];
  for (let y = 0; y < 10; y++) {
    const row = [];
    for (let x = 0; x < 10; x++) {
      row.push(0);
    }
    board.push(row);
  }
  return board;
}

let localBoard = createEmptyBoard();

/* Orientación */
const orientationBtn = document.getElementById("orientationBtn");
orientationBtn.addEventListener("click", () => {
  orientation = (orientation === "H") ? "V" : "H";
  orientationBtn.textContent = (orientation === "H") ? "Horizontal" : "Vertical";
});

/* Selección de barcos */
document.querySelectorAll(".shipBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedShipSize = parseInt(btn.dataset.size);
    statusDiv.textContent = `Barco seleccionado: tamaño ${selectedShipSize}`;
  });
});

/* Botón Listo */
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
        playerId,
        board: localBoard
      })
    });
    const data = await res.json();
    if (!data.success) {
      statusDiv.textContent = data.message || "Error al marcar listo.";
    }
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al comunicar estado listo.";
  }
});

/* Unirse */
joinBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Uniéndose a la partida...";
  try {
    const res = await fetch("backend/join.php");
    const data = await res.json();
    if (data.success) {
      playerId = data.playerId;
      statusDiv.textContent = `Te uniste como jugador ${playerId}`;
      playerInfo.textContent = `Tu ID: ${playerId}`;
      joinBtn.classList.add("hidden");
      gameArea.classList.remove("hidden");
      startPolling();
    } else {
      statusDiv.textContent = data.message || "No se pudo unir.";
    }
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al conectar.";
  }
});

/* Polling */
async function fetchState() {
  try {
    const res = await fetch("backend/state.php");
    const data = await res.json();
    if (!data.success) return;
    gameState = data;
    renderGame();
  } catch (err) {
    console.error(err);
  }
}

function startPolling() {
  fetchState();
  setInterval(fetchState, 1000);
}

/* Render */
function renderGame() {
  if (!gameState || !playerId) return;

  const { players, boards, turn, ready } = gameState;
  const allReady = players.length > 0 && players.every(pId => ready && ready[pId]);

  if (!allReady) {
    statusDiv.textContent = "Fase de colocación: esperando a todos...";
  } else {
    statusDiv.textContent = (turn === playerId)
      ? "Es tu turno (disparos)"
      : `Turno del jugador ${turn}`;
  }

  playersList.innerHTML = `<p>Jugadores: ${players.join(", ")}</p>`;

  myBoardContainer.innerHTML = "";
  enemyBoardsContainer.innerHTML = "";

  players.forEach((pId) => {
    const boardData = (pId === playerId)
      ? localBoard
      : boards[pId];

    const title = document.createElement("p");
    const isReady = ready && ready[pId];
    title.textContent = (pId === playerId)
      ? `Jugador ${pId} (Tú) ${isReady ? "[Listo]" : "[Colocando]"}`
      : `Jugador ${pId} ${isReady ? "[Listo]" : "[Colocando]"}`;

    const boardDiv = document.createElement("div");
    boardDiv.className = "board";

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";

        const cell = boardData[y][x];

        if (pId === playerId && cell === 1) cellDiv.classList.add("own");
        if (cell === 2) cellDiv.classList.add("hit");
        if (cell === 3) cellDiv.classList.add("miss");

        if (pId === playerId && placingShips && !(ready && ready[playerId])) {
          cellDiv.style.cursor = "pointer";
          cellDiv.addEventListener("click", () => placeShipAt(x, y));
        }

        if (allReady && pId !== playerId && gameState.turn === playerId) {
          cellDiv.style.cursor = "pointer";
          cellDiv.addEventListener("click", () => shoot(pId, x, y));
        }

        if (pId !== playerId && (!allReady || gameState.turn !== playerId)) {
          cellDiv.classList.add("disabled");
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

/* Colocar barco */
function placeShipAt(x, y) {
  if (!selectedShipSize) {
    statusDiv.textContent = "Selecciona un barco.";
    return;
  }

  const board = localBoard;

  if (orientation === "H" && x + selectedShipSize > 10) {
    statusDiv.textContent = "No cabe horizontal.";
    return;
  }
  if (orientation === "V" && y + selectedShipSize > 10) {
    statusDiv.textContent = "No cabe vertical.";
    return;
  }

  for (let i = 0; i < selectedShipSize; i++) {
    const cx = orientation === "H" ? x + i : x;
    const cy = orientation === "H" ? y : y + i;
    if (board[cy][cx] === 1) {
      statusDiv.textContent = "Se superpone.";
      return;
    }
  }

  for (let i = 0; i < selectedShipSize; i++) {
    const cx = orientation === "H" ? x + i : x;
    const cy = orientation === "H" ? y : y + i;
    localBoard[cy][cx] = 1;
  }

  statusDiv.textContent = `Barco de ${selectedShipSize} colocado.`;

  selectedShipSize = null;
  document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));

  renderGame();
}

/* Disparar */
async function shoot(targetPlayerId, x, y) {
  statusDiv.textContent = `Disparando a ${targetPlayerId}...`;

  try {
    const res = await fetch("backend/shoot.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shooter: playerId, target: targetPlayerId, x, y })
    });

    const data = await res.json();
    statusDiv.textContent = data.message;

    fetchState();
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al disparar.";
  }
}

/* Reset */
resetBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Reiniciando...";
  try {
    const res = await fetch("backend/reset.php");
    const data = await res.json();
    if (data.success) location.reload();
  } catch (err) {
    console.error(err);
  }
});