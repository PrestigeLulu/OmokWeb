const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = socketIo(server);

const boardSize = 19;
const board = Array.from({ length: boardSize }, () =>
  Array(boardSize).fill(null)
);

io.on("connection", (socket) => {
  socket.on("placeStone", (data) => {
    board[data.row][data.col] = data.color;
    const bestMove = getBestMove();
    // board[bestMove.row][bestMove.col] = "white";
    io.emit("set_pos", [bestMove.row, bestMove.col]);
    io.emit("omok:update", board);
  });
  socket.on("omok:reset", () => {
    board.forEach((row) => row.fill(null));
    io.emit("omok:update", board);
  });

  // 나갈떄 초기화
  socket.on("disconnect", () => {
    board.forEach((row) => row.fill(null));
    io.emit("omok:update", board);
  });
});

function getBestMove() {
  const weights = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(0)
  );

  // Calculate weights based on existing stones
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === "black") {
        adjustWeights(weights, row, col, -1);
        checkForThreeInARow(weights, row, col, "black");
      } else if (board[row][col] === "white") {
        adjustWeights(weights, row, col, 1);
        checkForThreeInARow(weights, row, col, "white");
      }
    }
  }

  // Find the best move considering both blocking and winning
  let bestMove = { row: 0, col: 0 };
  let minWeight = Infinity;
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === null) {
        if (weights[row][col] === -50) {
          // Prioritize blocking moves
          return { row, col };
        } else if (weights[row][col] < minWeight) {
          minWeight = weights[row][col];
          bestMove = { row, col };
        }
      }
    }
  }

  return bestMove;
}

function adjustWeights(weights, row, col, value) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newRow = row + i;
      const newCol = col + j;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        weights[newRow][newCol] += value;
      }
    }
  }
}

function checkForThreeInARow(weights, row, col, color) {
  const directions = [
    { dr: 0, dc: 1 }, // Horizontal
    { dr: 1, dc: 0 }, // Vertical
    { dr: 1, dc: 1 }, // Diagonal \
    { dr: 1, dc: -1 }, // Diagonal /
  ];

  directions.forEach(({ dr, dc }) => {
    let count = 0;
    let startRow = row;
    let startCol = col;

    // Check in one direction
    for (let i = 0; i < 3; i++) {
      const r = startRow + i * dr;
      const c = startCol + i * dc;
      if (
        r >= 0 &&
        r < boardSize &&
        c >= 0 &&
        c < boardSize &&
        board[r][c] === color
      ) {
        count++;
      } else {
        break;
      }
    }

    // If three in a row, adjust weights at both ends
    if (count === 3) {
      const beforeRow = startRow - dr;
      const beforeCol = startCol - dc;
      const afterRow = startRow + 3 * dr;
      const afterCol = startCol + 3 * dc;

      if (
        beforeRow >= 0 &&
        beforeRow < boardSize &&
        beforeCol >= 0 &&
        beforeCol < boardSize &&
        board[beforeRow][beforeCol] === null
      ) {
        weights[beforeRow][beforeCol] = -50;
      }
      if (
        afterRow >= 0 &&
        afterRow < boardSize &&
        afterCol >= 0 &&
        afterCol < boardSize &&
        board[afterRow][afterCol] === null
      ) {
        weights[afterRow][afterCol] = -50;
      }
    }
  });
}

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
