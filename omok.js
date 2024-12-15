// omokAi.js (또는 서버에서 AI 로직을 담당하는 파일)

const BOARD_SIZE = 19;

// 간단한 가중치(점수) 표: 내 돌 연속 갯수, 상대 돌 연속 갯수 등
// 실제로는 훨씬 세분화(예: 열린4, 3+3 등)하면 더 정교해집니다.
const SCORE_TABLE = {
  FIVE: 100000, // 이미 5목이면 최우선 (승리)
  FOUR: 10000, // 4목
  THREE: 1000, // 3목
  TWO: 100, // 2목
  ONE: 10, // 1목
};

// 보드에서 돌 색깔을 나타내기 위한 상수
const BLACK = "black";
const WHITE = "white";
const EMPTY = null;

/**
 * 현재 보드 state를 바탕으로 AI가 둘 최적 수를 찾는 함수
 * (공격 및 수비를 동시에 고려)
 */
function findBestMove(board, aiColor) {
  const opponentColor = aiColor === BLACK ? WHITE : BLACK;

  let bestScore = -Infinity;
  let bestMove = null;

  // 모든 빈 칸에 대해 스코어를 계산해보고, 가장 높은 점수를 가진 칸을 선택
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === EMPTY) {
        // 가상으로 AI 돌을 놓아본 뒤 점수를 평가
        board[r][c] = aiColor;
        const attackScore = evaluateBoard(board, aiColor, opponentColor);

        // 다시 빈 칸으로 복원 후, 상대 돌을 놓아봤을 때(수비 관점) 점수를 평가
        board[r][c] = opponentColor;
        const defendScore = evaluateBoard(board, opponentColor, aiColor);

        // 복원
        board[r][c] = EMPTY;

        const combinedScore = attackScore + defendScore;
        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestMove = { row: r, col: c };
        }
      }
    }
  }

  return bestMove;
}

/**
 * board 상태를 평가(evaluation)하여 점수를 반환
 * - 내 돌이 연속되는 형태에 따라 점수를 부여
 * - 5목이 만들어질 수 있거나 이미 5목인 경우 점수가 매우 큼
 * - 이 함수가 제대로 동작하려면 가로/세로/대각선 체크를 모두 해야 함
 */
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

  // 대각선 평가 (두 방향)
  // 1) ↘ 방향 대각선
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

  // 2) ↙ 방향 대각선
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

/**
 * 일차원 배열(line)에서 연속된 돌의 개수를 세어 점수를 계산하는 함수
 * ex) line = [black, black, null, black, white, ...]
 */
function evaluateLine(line, myColor) {
  let lineScore = 0;
  let count = 0; // 내 돌 연속 개수

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
  // line 끝났을 때 마지막에 연속개수가 있으면 추가
  if (count > 0) {
    lineScore += getScoreByCount(count);
  }

  return lineScore;
}

/**
 * 연속 돌 개수에 따른 점수 환산
 */
function getScoreByCount(count) {
  switch (count) {
    case 5: // 이미 오목
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
