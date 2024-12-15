const socket = io();
const boardSize = 19;

const board = document.getElementById("board");

let TEST_MODE = false;

let playerTeam;
let isBlackTurn = true; // 흑돌과 백돌 교차로 놓기 위한 변수

// 색깔 선택 버튼 이벤트 리스너 추가
document.getElementById("black").addEventListener("click", () => {
  isBlackTurn = true;
  playerTeam = "black";
  document.getElementById("modal").style.display = "none";
});

document.getElementById("white").addEventListener("click", () => {
  isBlackTurn = false;
  playerTeam = "white";
  document.getElementById("modal").style.display = "none";
  // 흑돌을 정중앙에 놓기
  const center = Math.floor(boardSize / 2);
  socket.emit("placeStoneWithoutAi", {
    row: center,
    col: center,
    color: "black",
  });
});

// 19x19 그리드 생성
for (let i = 0; i < boardSize * boardSize; i++) {
  const cell = document.createElement("div");
  cell.id = `${Math.floor(i / boardSize)}-${i % boardSize}`;
  cell.classList.add("cell");
  const row = Math.floor(i / boardSize);
  const col = i % boardSize;
  cell.addEventListener("click", () => {
    if (cell.hasChildNodes()) {
      return;
    }
    console.log(row, col);
    socket.emit("placeStone", {
      row,
      col,
      color: isBlackTurn ? "black" : "white",
      playerTeam: playerTeam,
      testmode: TEST_MODE,
    });
    if (!TEST_MODE) {
      isBlackTurn = !isBlackTurn;
    }
  });

  board.appendChild(cell);
}

socket.on("omok:update", (board) => {
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      const data = cell || null;
      if (!data) {
        return;
      }
      const cell1 = document.getElementById(`${i}-${j}`);
      if (!cell1.hasChildNodes()) {
        const stone = document.createElement("div");
        stone.classList.add("stone", data == "black" ? "black" : "white");
        cell1.appendChild(stone);
      }
    });
  });
});

socket.on("omok:win", (data) => {
  document.getElementById("resultText").innerText = `${
    data.winner === "black" ? "흑" : "백"
  } 승리!`;
  document.getElementById("result").style.display = "flex";
});

document.getElementById("reset").addEventListener("click", () => {
  location.reload();
});

document.getElementById("toggleButton").addEventListener("click", () => {
  TEST_MODE = !TEST_MODE;
});
