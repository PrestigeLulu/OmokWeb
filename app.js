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
      console.log("bestMove", [bestMove.row, bestMove.col]);
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
  if (depth === 0 || isGameOver(board)) {
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

function evaluateBoard(board) {
  let score = 0;
  const winner = isGameOver(board);
  if (winner !== null) {
    if (winner === "black") {
      return isMaximizingPlayer ? 1000000 : -1000000;
    } else if (winner === "white") {
      return isMaximizingPlayer ? -1000000 : 1000000;
    }
  }

  const directions = [
    { dr: 0, dc: 1 }, // 수평
    { dr: 1, dc: 0 }, // 수직
    { dr: 1, dc: 1 }, // 대각선 \
    { dr: 1, dc: -1 }, // 대각선 /
  ];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] !== null) {
        const color = board[row][col];

        directions.forEach(({ dr, dc }) => {
          const lineScore = evaluateLine(board, row, col, dr, dc, color);
          score += lineScore;
        });
      }
    }
  }

  return score;
}

function evaluateLine(board, row, col, dr, dc, color) {
  let count = 1;
  let openEnds = 0;

  // 앞으로 탐색
  let i = 1;
  while (true) {
    const r = row + i * dr;
    const c = col + i * dc;
    if (
      r >= 0 &&
      r < boardSize &&
      c >= 0 &&
      c < boardSize &&
      board[r][c] === color
    ) {
      count++;
      i++;
    } else {
      if (
        r >= 0 &&
        r < boardSize &&
        c >= 0 &&
        c < boardSize &&
        board[r][c] === null
      ) {
        openEnds++;
      }
      break;
    }
  }

  // 반대로 탐색
  i = 1;
  while (true) {
    const r = row - i * dr;
    const c = col - i * dc;
    if (
      r >= 0 &&
      r < boardSize &&
      c >= 0 &&
      c < boardSize &&
      board[r][c] === color
    ) {
      count++;
      i++;
    } else {
      if (
        r >= 0 &&
        r < boardSize &&
        c >= 0 &&
        c < boardSize &&
        board[r][c] === null
      ) {
        openEnds++;
      }
      break;
    }
  }

  // 점수 계산
  const isBlack = color === "black";
  const lineScore = getLineScore(count, openEnds, isBlack);
  return lineScore;
}

function getLineScore(count, openEnds, isBlack) {
  if (openEnds === 0 && count < 5) {
    return 0;
  }

  let score = 0;

  switch (count) {
    case 5:
      score = 100000;
      break;
    case 4:
      if (openEnds === 2) {
        score = 10000; // 열린 사
      } else if (openEnds === 1) {
        score = 1000; // 막힌 사
      }
      break;
    case 3:
      if (openEnds === 2) {
        score = 1000; // 열린 삼
      } else if (openEnds === 1) {
        score = 100; // 막힌 삼
      }
      break;
    case 2:
      if (openEnds === 2) {
        score = 100; // 열린 이
      } else if (openEnds === 1) {
        score = 10; // 막힌 이
      }
      break;
    case 1:
      if (openEnds === 2) {
        score = 10; // 열린 일
      }
      break;
  }

  // 공격과 방어의 가중치 조정
  return isBlack ? score : -score * 0.8; // 상대방의 점수에 가중치 적용
}

function isGameOver(board) {
  // 방향 벡터
  const directions = [
    { dr: 0, dc: 1 }, // 수평
    { dr: 1, dc: 0 }, // 수직
    { dr: 1, dc: 1 }, // 대각선 \
    { dr: 1, dc: -1 }, // 대각선 /
  ];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const player = board[row][col];
      if (player !== null) {
        for (const { dr, dc } of directions) {
          let count = 1;
          let r = row + dr;
          let c = col + dc;
          while (
            r >= 0 &&
            r < boardSize &&
            c >= 0 &&
            c < boardSize &&
            board[r][c] === player
          ) {
            count++;
            if (count === 5) {
              return player; // 승리한 플레이어의 색상을 반환
            }
            r += dr;
            c += dc;
          }
        }
      }
    }
  }
  return null; // 아직 승자가 없음
}

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
