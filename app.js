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
    io.emit("omok:update", board);
    if (data.color === "black") {
      const bestMove = getBestMove();
      io.emit("set_pos", [bestMove.row, bestMove.col]);
    }
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
  const depth = 3; // 탐색 깊이를 늘립니다.
  const isMaximizingPlayer = true; // AI는 최대화 플레이어
  console.log("getting best move");
  const bestMove = minimax(
    board,
    depth,
    isMaximizingPlayer,
    -Infinity,
    Infinity
  );
  console.log("best move", bestMove);
  return bestMove.move;
}

function minimax(board, depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0) {
    return { score: evaluateBoard(board) };
  }

  let bestMove = { score: isMaximizingPlayer ? -Infinity : Infinity };

  const possibleMoves = getPossibleMoves(board);

  for (const { row, col } of possibleMoves) {
    board[row][col] = isMaximizingPlayer ? "black" : "white";
    const result = minimax(board, depth - 1, !isMaximizingPlayer, alpha, beta);
    board[row][col] = null;

    if (isMaximizingPlayer) {
      if (result.score > bestMove.score) {
        bestMove = { score: result.score, move: { row, col } };
      }
      alpha = Math.max(alpha, bestMove.score);
    } else {
      if (result.score < bestMove.score) {
        bestMove = { score: result.score, move: { row, col } };
      }
      beta = Math.min(beta, bestMove.score);
    }

    // 알파-베타 가지치기
    if (beta <= alpha) {
      break;
    }
  }

  return bestMove;
}

function getPossibleMoves(board) {
  const moves = [];
  const visited = new Set();

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] !== null) {
        // 주변 위치 탐색
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (
              r >= 0 &&
              r < boardSize &&
              c >= 0 &&
              c < boardSize &&
              board[r][c] === null
            ) {
              const key = r * boardSize + c;
              if (!visited.has(key)) {
                visited.add(key);
                moves.push({ row: r, col: c });
              }
            }
          }
        }
      }
    }
  }

  // 만약 첫 수라면 보드 중앙을 반환
  if (moves.length === 0) {
    const center = Math.floor(boardSize / 2);
    moves.push({ row: center, col: center });
  }

  return moves;
}

// 평가 함수는 이전 코드와 동일하게 유지하거나 개선할 수 있습니다.

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
