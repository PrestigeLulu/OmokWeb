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
const boards = {}; // 각 클라이언트에 대한 보드 상태를 저장

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
  // 새로운 클라이언트가 접속할 때 보드 초기화
  boards[socket.id] = Array.from({ length: boardSize }, () =>
    Array(boardSize).fill(null)
  );

  socket.on("placeStoneWithoutAi", (data) => {
    const board = boards[socket.id];
    board[data.row][data.col] = data.color;
    io.to(socket.id).emit("omok:update", board);
  });

  socket.on("placeStone", (data) => {
    const board = boards[socket.id];
    const testmode = data.testmode;
    board[data.row][data.col] = data.color;
    io.to(socket.id).emit("omok:update", board);

    if (checkWin(board, data.row, data.col, data.color)) {
      io.to(socket.id).emit("omok:win", { winner: data.color });
      return;
    }

    const aiColor = data.playerTeam === "black" ? "white" : "black";

    if (data.playerTeam === data.color) {
      const bestMove = findBestMove(board, aiColor);
      console.log("bestMove", [bestMove.row, bestMove.col]);
      io.to(socket.id).emit("omok:update", board);

      if (!testmode) {
        io.to(socket.id).emit(`set_pos_${data.channel}`, [
          bestMove.row,
          bestMove.col,
        ]);
      } else {
        board[bestMove.row][bestMove.col] = aiColor;
        io.to(socket.id).emit("omok:update", board);
      }

      if (checkWin(board, bestMove.row, bestMove.col, aiColor)) {
        io.to(socket.id).emit("omok:win", { winner: aiColor });
      }
    }
  });

  socket.on("omok:reset", () => {
    const board = boards[socket.id];
    board.forEach((row) => row.fill(null));
    io.to(socket.id).emit("omok:update", board);
  });

  socket.on("disconnect", () => {
    delete boards[socket.id]; // 클라이언트가 연결을 끊을 때 보드 삭제
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
