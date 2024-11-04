const socket = io();
const boardSize = 19;

const board = document.getElementById("board");
let isBlackTurn = true; // 흑돌과 백돌 교차로 놓기 위한 변수

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
    // const stone = document.createElement("div");
    // stone.classList.add("stone");
    // stone.classList.add(isBlackTurn ? "black" : "white");
    // cell.appendChild(stone);
    if (!isBlackTurn) {
      return;
    }
    console.log(row, col);
    socket.emit("placeStone", {
      row,
      col,
    });
    // isBlackTurn = !isBlackTurn; // 턴 변경
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
      const stone = document.createElement("div");
      stone.classList.add("stone", data == "black" ? "black" : "white");
      cell1.appendChild(stone);
    });
  });
});
