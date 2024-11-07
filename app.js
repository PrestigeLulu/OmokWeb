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
    if (data.color === "black") {
      const bestMove = getBestMove();
      console.log(bestMove);
      io.emit("set_pos", [bestMove.row, bestMove.col]);
    }
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
  const depth = 3; // Depth of the search tree
  const maximizingPlayer = "black";

  function minimax(board, depth, isMaximizing) {
    if (depth === 0 || isGameOver(board)) {
      return evaluateBoard(board);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          if (board[row][col] === null) {
            board[row][col] = maximizingPlayer;
            const eval = minimax(board, depth - 1, false);
            board[row][col] = null;
            maxEval = Math.max(maxEval, eval);
          }
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          if (board[row][col] === null) {
            board[row][col] = "white";
            const eval = minimax(board, depth - 1, true);
            board[row][col] = null;
            minEval = Math.min(minEval, eval);
          }
        }
      }
      return minEval;
    }
  }

  function evaluateBoard(board) {
    // Implement a heuristic evaluation function
    // This function should return a score based on the board state
    return 0; // Placeholder
  }

  function isGameOver(board) {
    // Implement a function to check if the game is over
    return false; // Placeholder
  }

  let bestMove = { row: 0, col: 0 };
  let bestValue = -Infinity;
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === null) {
        board[row][col] = maximizingPlayer;
        const moveValue = minimax(board, depth - 1, false);
        board[row][col] = null;
        if (moveValue > bestValue) {
          bestValue = moveValue;
          bestMove = { row, col };
        }
      }
    }
  }

  return bestMove;
}

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
