const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const { findBestMove } = require("./omok");
const app = express();

app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const io = socketIo(server);

const boardSize = 19;
const board = Array.from({ length: boardSize }, () =>
  Array(boardSize).fill(null)
);

// 오목 승리 조건을 확인하는 함수
function checkWin(board, row, col, color) {
  const directions = [
    { dr: 0, dc: 1 }, // 수평
    { dr: 1, dc: 0 }, // 수직
    { dr: 1, dc: 1 }, // 대각선 \
    { dr: 1, dc: -1 }, // 대각선 /
  ];

  for (const { dr, dc } of directions) {
    let count = 1;

    // 한 방향으로 체크
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
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

    // 반대 방향으로 체크
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
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

    if (count >= 5) {
      return true;
    }
  }

  return false;
}

io.on("connection", (socket) => {
  socket.on("placeStoneWithoutAi", (data) => {
    board[data.row][data.col] = data.color;
    io.emit("omok:update", board);
  });
  socket.on("placeStone", (data) => {
    const testmode = data.testmode;
    board[data.row][data.col] = data.color;
    io.emit("omok:update", board);

    if (checkWin(board, data.row, data.col, data.color)) {
      io.emit("omok:win", { winner: data.color });
      return;
    }

    // AI가 두는 돌의 색깔을 결정
    const aiColor = data.playerTeam === "black" ? "white" : "black";

    if (data.playerTeam === data.color) {
      // AI의 다음 수 계산 및 두기
      const bestMove = findBestMove(board, aiColor);
      // board[bestMove.row][bestMove.col] = aiColor;
      console.log("bestMove", [bestMove.row, bestMove.col]);
      io.emit("omok:update", board);

      // AI가 돌을 놓을 때 도봇에게 신호를 보냄
      if (!testmode) {
        io.emit("set_pos", [bestMove.row, bestMove.col]);
      } else {
        board[bestMove.row][bestMove.col] = aiColor;
        io.emit("omok:update", board);
      }

      if (checkWin(board, bestMove.row, bestMove.col, aiColor)) {
        io.emit("omok:win", { winner: aiColor });
      }
    }
  });

  socket.on("omok:reset", () => {
    board.forEach((row) => row.fill(null));
    io.emit("omok:update", board);
  });

  socket.on("disconnect", () => {
    board.forEach((row) => row.fill(null));
    io.emit("omok:update", board);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
