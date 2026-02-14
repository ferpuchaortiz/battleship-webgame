console.log("Battleship Multijugador FFA iniciado");

let playerId = null;
let gameState = null;
let roomCode = null;

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const lobbyStatus = document.getElementById("lobbyStatus");

const joinBtn = document.getElementById("joinBtn");
const statusDiv = document.getElementById("status");
const gameArea = document.getElementById("gameArea");
const playerInfo = document.getElementById("playerInfo");
const playersList = document.getElementById("playersList");
const myBoardContainer = document.getElementById("myBoardContainer");
const enemyBoardsContainer = document.getElementById("enemyBoardsContainer");
const resetBtn = document.getElementById("resetBtn");
const readyBtn = document.getElementById("readyBtn");
const battleLog = document.getElementById("battleLog");

const chatBox = document.getElementById("chatBox");
const chatMessage = document.getElementById("chatMessage");
const chatSendBtn = document.getElementById("chatSendBtn");

let selectedShipSize = null;
let placingShips = true;
let orientation = "H";

function createEmptyBoard() {
  const board = [];
  for (let y = 0; y < 10; y++) {
    const row = [];
    for (let x = 0; x < 10; x++) row.push(0);
    board.push(row);
  }
  return board;
}

let localBoard = createEmptyBoard();

/* -------------------------
   HISTORIAL DE BATALLA
-------------------------- */
function addLog(message, type = "") {
  const entry = document.createElement("div");
  entry.className = "battle-log-entry " + type;
  entry.textContent = message;
  battleLog.prepend(entry);
}

/* -------------------------
   CHAT
-------------------------- */
async function sendChatMessage() {
  const msg = chatMessage.value.trim();
  if (msg === "") return;

  await fetch("backend/chat_send.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room: roomCode, playerId, message: msg })
  });

  chatMessage.value = "";
}

chatSendBtn.addEventListener("click", sendChatMessage);
chatMessage.addEventListener("keypress", e => {
  if (e.key === "Enter") sendChatMessage();
});

async function loadChat() {
  if (!roomCode) return;

  const res = await fetch(`backend/chat_get.php?room=${roomCode}`);
  const data = await res.json();

  if (!data.success) return;

  chatBox.innerHTML = "";

  data.messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "chat-message";
    div.innerHTML = `<span class="player">Jugador ${m.player}:</span> ${m.message}`;
    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

/* -------------------------
   LOBBY
-------------------------- */
createRoomBtn.addEventListener("click", async () => {
  const res = await fetch("backend/create_room.php");
  const data = await res.json();

  if (data.success) {
    roomCode = data.room;
    lobbyStatus.textContent = `Sala creada: ${roomCode}`;
  }
});

joinRoomBtn.addEventListener("click", async () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) return;

  const res = await fetch("backend/join_room.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room: code })
  });

  const data = await res.json();

  if (data.success) {
    roomCode = code;
    lobbyStatus.textContent = `Unido a sala: ${roomCode}`;
  } else {
    lobbyStatus.textContent = data.message;
  }
});

/* -------------------------
   ORIENTACIÓN
-------------------------- */
const orientationBtn = document.getElementById("orientationBtn");
orientationBtn.addEventListener("click", () => {
  orientation = orientation === "H" ? "V" : "H";
  orientationBtn.textContent = orientation === "H" ? "Horizontal" : "Vertical";
});

/* -------------------------
   SELECCIÓN DE BARCOS
-------------------------- */
document.querySelectorAll(".shipBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedShipSize = parseInt(btn.dataset.size);
    statusDiv.textContent = `Barco seleccionado: tamaño ${selectedShipSize}`;
  });
});

/* -------------------------
   LISTO
-------------------------- */
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

/* -------------------------
   UNIRSE A LA PARTIDA
-------------------------- */
joinBtn.addEventListener("click", async () => {
  if (!roomCode) {
    statusDiv.textContent = "Primero debes crear o unirte a una sala.";
    return;
  }

  statusDiv.textContent = "Uniéndose...";

  try {
    const res = await fetch(`backend/join.php?room=${roomCode}`);
    const data = await res.json();
    if (data.success) {
      playerId = data.playerId;
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

/* -------------------------
   POLLING
-------------------------- */
async function fetchState() {
  if (!roomCode) return;

  try {
    const res = await fetch(`backend/state.php?room=${roomCode}`);
    const data = await res.json();
    if (data.success) {
      gameState = data;
      renderGame();
    }
  } catch (err) {
    console.error(err);
  }
}

function startPolling() {
  fetchState();
  loadChat();
  setInterval(fetchState, 1000);
  setInterval(loadChat, 1000);
}

/* -------------------------
   RENDER
-------------------------- */
function renderGame() {
  if (!gameState || !playerId) return;

  const { players, boards, turn, ready, winner } = gameState;
  const allReady = players.length > 0 && players.every(p => ready[p]);

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

    const boardData =
      pId === playerId && !isReady ? localBoard : boards[pId];

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

        if (pId === playerId && cell === 1) cellDiv.classList.add("own");
        if (cell === 2) cellDiv.classList.add("hit");
        if (cell === 3) cellDiv.classList.add("miss");
        if (cell === 4) cellDiv.classList.add("sunk");

        if (!winner) {
          if (pId === playerId && placingShips && !isReady) {
            cellDiv.addEventListener("click", () => placeShipAt(x, y));
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

/* -------------------------
   COLOCAR BARCO
-------------------------- */
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

  selectedShipSize = null;
  document.querySelectorAll(".shipBtn").forEach(b => b.classList.remove("selected"));
  renderGame();
}

/* -------------------------
   DISPARAR
-------------------------- */
async function shoot(targetPlayerId, x, y) {
  statusDiv.textContent = `Disparando a ${targetPlayerId}...`;

  try {
    const res = await fetch("backend/shoot.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: roomCode,
        shooter: playerId,
        target: targetPlayerId,
        x, y
      })
    });

    const data = await res.json();

    if (!data.success) {
      statusDiv.textContent = data.message;
      return;
    }

    statusDiv.textContent = data.message;

    // LOG
    addLog(
      `Jugador ${playerId} disparó a Jugador ${targetPlayerId} (${x},${y}) → ${data.message}`,
      data.sunk ? "sunk" : data.hit ? "hit" : "miss"
    );

    // SONIDOS
    if (data.hit && !data.sunk) {
      document.getElementById("soundExplosion").play();
    }

    if (!data.hit) {
      document.getElementById("soundWater").play();
    }

    if (data.sunk) {
      document.getElementById("soundSunk").play();
    }

    if (data.eliminated) {
      document.getElementById("soundEliminated").play();
      addLog(`Jugador ${targetPlayerId} fue eliminado`, "eliminated");
    }

    if (data.winner) {
      document.getElementById("soundVictory").play();
      addLog(`🏆 ¡Jugador ${data.winner} ganó la partida!`, "winner");
      return;
    }

    fetchState();

  } catch (err) {
    console.error(err);
    statusDiv.textContent = "Error al disparar.";
  }
}

/* -------------------------
   RESET
-------------------------- */
resetBtn.addEventListener("click", async () => {
  await fetch(`backend/reset.php?room=${roomCode}`);
  location.reload();
});