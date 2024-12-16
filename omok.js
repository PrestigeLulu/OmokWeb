// omokAi.js
const BOARD_SIZE = 19;

const SCORE_TABLE = {
  FIVE: 100000,
  FOUR: 10000,
  THREE: 1000,
  TWO: 100,
  ONE: 10,
};

const BLACK = "black";
const WHITE = "white";
const EMPTY = null;

function findBestMove(board, aiColor) {
  const opponentColor = aiColor === BLACK ? WHITE : BLACK;

  let bestScore = -Infinity;
  let bestMove = null;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === EMPTY) {
        // 1) 먼저 AI 돌을 놓았을 때 바로 5목이 되는지 체크
        board[r][c] = aiColor;
        const attackScore = evaluateBoard(board, aiColor, opponentColor);

        // 만약 점수가 5목 기준 이상이면(=SCORE_TABLE.FIVE 이상이면) 즉시 승리 수
        if (attackScore >= SCORE_TABLE.FIVE) {
          // 원복하고 바로 return
          board[r][c] = EMPTY;
          return { row: r, col: c };
        }

        // 2) 즉시 승리가 아니면 수비 점수도 계산
        board[r][c] = opponentColor;
        const defendScore = evaluateBoard(board, opponentColor, aiColor);

        // 복원
        board[r][c] = EMPTY;

        // 3) 공격 + 수비 점수 합산
        const combinedScore = attackScore + defendScore;

        // 최대 점수 갱신
        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestMove = { row: r, col: c };
        }
      }
    }
  }

  return bestMove;
}

function evaluateBoard(board, myColor, oppColor) {
  let score = 0;

  // 가로줄 평가
  for (let r = 0; r < BOARD_SIZE; r++) {
    score += evaluateLine(board[r], myColor);
  }

  // 세로줄 평가
  for (let c = 0; c < BOARD_SIZE; c++) {
    let colArray = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      colArray.push(board[r][c]);
    }
    score += evaluateLine(colArray, myColor);
  }

  // 대각선 평가 (↘)
  for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
    let diag = [];
    let r = 0,
      c = startCol;
    while (r < BOARD_SIZE && c < BOARD_SIZE) {
      diag.push(board[r][c]);
      r++;
      c++;
    }
    score += evaluateLine(diag, myColor);
  }
  for (let startRow = 1; startRow < BOARD_SIZE; startRow++) {
    let diag = [];
    let r = startRow,
      c = 0;
    while (r < BOARD_SIZE && c < BOARD_SIZE) {
      diag.push(board[r][c]);
      r++;
      c++;
    }
    score += evaluateLine(diag, myColor);
  }

  // 대각선 평가 (↙)
  for (let startCol = 0; startCol < BOARD_SIZE; startCol++) {
    let diag = [];
    let r = 0,
      c = startCol;
    while (r < BOARD_SIZE && c >= 0) {
      diag.push(board[r][c]);
      r++;
      c--;
    }
    score += evaluateLine(diag, myColor);
  }
  for (let startRow = 1; startRow < BOARD_SIZE; startRow++) {
    let diag = [];
    let r = startRow,
      c = BOARD_SIZE - 1;
    while (r < BOARD_SIZE && c >= 0) {
      diag.push(board[r][c]);
      r++;
      c--;
    }
    score += evaluateLine(diag, myColor);
  }

  return score;
}

function evaluateLine(line, myColor) {
  let lineScore = 0;
  let count = 0;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === myColor) {
      count++;
    } else {
      if (count > 0) {
        lineScore += getScoreByCount(count);
        count = 0;
      }
    }
  }
  // 마지막에 남아있는 연속 개수 처리
  if (count > 0) {
    lineScore += getScoreByCount(count);
  }

  return lineScore;
}

function getScoreByCount(count) {
  switch (count) {
    case 5:
      return SCORE_TABLE.FIVE;
    case 4:
      return SCORE_TABLE.FOUR;
    case 3:
      return SCORE_TABLE.THREE;
    case 2:
      return SCORE_TABLE.TWO;
    case 1:
      return SCORE_TABLE.ONE;
    default:
      return 0;
  }
}

module.exports = {
  findBestMove,
};
