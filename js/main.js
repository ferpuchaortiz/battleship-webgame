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
      statusDiv.textContent = data.message || "No se pudo unir a la partida.";
    }
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al conectar con el servidor.";
  }
});

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

function renderGame() {
  if (!gameState || !playerId) return;

  const { players, boards, turn } = gameState;

  statusDiv.textContent = (turn === playerId)
    ? "Es tu turno"
    : `Turno del jugador ${turn}`;

  if (playerId === 1) {
    resetBtn.classList.remove("hidden");
  } else {
    resetBtn.classList.add("hidden");
  }

  playersList.innerHTML = `<p>Jugadores conectados: ${players.join(", ")}</p>`;

  myBoardContainer.innerHTML = "";
  enemyBoardsContainer.innerHTML = "";

  players.forEach((pId) => {
    const boardData = boards[pId];
    if (!boardData) return;

    const title = document.createElement("p");
    title.textContent = (pId === playerId)
      ? `Jugador ${pId} (Tú)`
      : `Jugador ${pId}`;

    const boardDiv = document.createElement("div");
    boardDiv.className = "board";

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";

        const cell = boardData[y][x];

        if (pId === playerId && cell === 1) {
          cellDiv.classList.add("own");
        }

        if (cell === 2) {
          cellDiv.classList.add("hit");
        } else if (cell === 3) {
          cellDiv.classList.add("miss");
        }

        if (pId !== playerId && gameState.turn === playerId) {
          cellDiv.style.cursor = "pointer";
          cellDiv.addEventListener("click", () => {
            shoot(pId, x, y);
          });
        }

        if (pId !== playerId && gameState.turn !== playerId) {
          cellDiv.classList.add("disabled");
          cellDiv.style.cursor = "not-allowed";
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

async function shoot(targetPlayerId, x, y) {
  if (!playerId) return;
  statusDiv.textContent = `Disparando a jugador ${targetPlayerId} (${x}, ${y})...`;
  try {
    const res = await fetch("backend/shoot.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shooter: playerId,
        target: targetPlayerId,
        x,
        y,
      }),
    });
    const data = await res.json();
    if (data.success) {
      const lastMessage = data.message || "Disparo realizado.";
      statusDiv.textContent = lastMessage;

      setTimeout(() => {
        if (gameState) {
          const { turn } = gameState;
          statusDiv.textContent = (turn === playerId)
            ? "Es tu turno"
            : `Turno del jugador ${turn}`;
        }
      }, 1200);

      fetchState();
    } else {
      statusDiv.textContent = data.message || "No se pudo disparar.";
    }
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al enviar disparo.";
  }
}

resetBtn.addEventListener("click", async () => {
  statusDiv.textContent = "Reiniciando partida...";
  try {
    const res = await fetch("backend/reset.php");
    const data = await res.json();
    if (data.success) {
      statusDiv.textContent = "Partida reiniciada. Recargando...";
      setTimeout(() => {
        location.reload();
      }, 1000);
    } else {
      statusDiv.textContent = "No se pudo reiniciar.";
    }
  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al reiniciar.";
  }
});