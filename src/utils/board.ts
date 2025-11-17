import { Board, CellType, Tetromino, Position } from '../types';
import { GAME_CONFIG, TETROMINO_TO_NUMBER } from '../constants/tetrominos';

/**
 * 빈 게임 보드 생성
 * @returns 0으로 채워진 20x10 보드
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: GAME_CONFIG.BOARD_HEIGHT }, () =>
    Array(GAME_CONFIG.BOARD_WIDTH).fill(0)
  );
}

/**
 * 보드 복사 (깊은 복사)
 * @param board 복사할 보드
 * @returns 복사된 새 보드
 */
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/**
 * 충돌 감지 함수
 * 테트로미노가 보드의 경계나 다른 블록과 충돌하는지 확인
 * @param board 게임 보드
 * @param piece 테트로미노
 * @param offset 추가 오프셋 (벽 킥 테스트용)
 * @returns 충돌 여부 (true: 충돌, false: 안전)
 */
export function checkCollision(
  board: Board,
  piece: Tetromino,
  offset: Position = { x: 0, y: 0 }
): boolean {
  const { shape, position } = piece;
  const testX = position.x + offset.x;
  const testY = position.y + offset.y;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      // 블록이 있는 위치만 확인
      if (shape[y][x] !== 0) {
        const boardX = testX + x;
        const boardY = testY + y;

        // 보드 경계를 벗어났는지 확인
        if (
          boardX < 0 ||
          boardX >= GAME_CONFIG.BOARD_WIDTH ||
          boardY >= GAME_CONFIG.BOARD_HEIGHT
        ) {
          return true; // 충돌
        }

        // 상단 경계는 음수 허용 (블록이 처음 생성될 때)
        if (boardY < 0) {
          continue;
        }

        // 보드의 해당 위치에 이미 블록이 있는지 확인
        if (board[boardY][boardX] !== 0) {
          return true; // 충돌
        }
      }
    }
  }

  return false; // 충돌 없음
}

/**
 * 테트로미노를 보드에 병합
 * @param board 게임 보드
 * @param piece 병합할 테트로미노
 * @returns 병합된 새 보드
 */
export function mergePieceToBoard(board: Board, piece: Tetromino): Board {
  const newBoard = cloneBoard(board);
  const { shape, position, type } = piece;
  const cellValue = TETROMINO_TO_NUMBER[type];

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardY = position.y + y;
        const boardX = position.x + x;

        // 보드 범위 내에 있을 때만 병합
        if (
          boardY >= 0 &&
          boardY < GAME_CONFIG.BOARD_HEIGHT &&
          boardX >= 0 &&
          boardX < GAME_CONFIG.BOARD_WIDTH
        ) {
          newBoard[boardY][boardX] = cellValue as CellType;
        }
      }
    }
  }

  return newBoard;
}

/**
 * 완성된 라인 찾기
 * @param board 게임 보드
 * @returns 완성된 라인의 인덱스 배열
 */
export function findCompletedLines(board: Board): number[] {
  const completedLines: number[] = [];

  for (let y = 0; y < board.length; y++) {
    // 모든 셀이 0이 아니면 완성된 라인
    if (board[y].every(cell => cell !== 0)) {
      completedLines.push(y);
    }
  }

  return completedLines;
}

/**
 * 완성된 라인 제거 및 위에 있는 블록들 내리기
 * @param board 게임 보드
 * @param lines 제거할 라인 인덱스 배열
 * @returns {board: 새 보드, linesCleared: 제거된 라인 수}
 */
export function clearLines(board: Board, lines: number[]): { board: Board; linesCleared: number } {
  if (lines.length === 0) {
    return { board, linesCleared: 0 };
  }

  let newBoard = cloneBoard(board);

  // 라인을 높은 인덱스부터 제거 (아래부터)
  const sortedLines = [...lines].sort((a, b) => b - a);

  for (const lineIndex of sortedLines) {
    // 해당 라인 제거
    newBoard.splice(lineIndex, 1);
    // 맨 위에 빈 라인 추가
    newBoard.unshift(Array(GAME_CONFIG.BOARD_WIDTH).fill(0));
  }

  return {
    board: newBoard,
    linesCleared: lines.length,
  };
}

/**
 * 게임 오버 확인
 * 새 블록이 시작 위치에서 충돌하면 게임 오버
 * @param board 게임 보드
 * @param piece 새로 생성된 테트로미노
 * @returns 게임 오버 여부
 */
export function isGameOver(board: Board, piece: Tetromino): boolean {
  return checkCollision(board, piece);
}

/**
 * 하드 드롭 위치 계산
 * 현재 블록이 떨어질 수 있는 최하단 위치를 찾습니다.
 * @param board 게임 보드
 * @param piece 테트로미노
 * @returns 하드 드롭 후의 Y 좌표와 이동 거리
 */
export function calculateHardDropPosition(
  board: Board,
  piece: Tetromino
): { y: number; distance: number } {
  let dropY = piece.position.y;
  let distance = 0;

  // 충돌할 때까지 Y 좌표를 증가
  while (!checkCollision(board, { ...piece, position: { ...piece.position, y: dropY + 1 } })) {
    dropY++;
    distance++;
  }

  return { y: dropY, distance };
}

/**
 * 고스트 피스(그림자) 위치 계산
 * @param board 게임 보드
 * @param piece 현재 테트로미노
 * @returns 고스트 피스의 위치
 */
export function calculateGhostPosition(board: Board, piece: Tetromino): Position {
  const { y } = calculateHardDropPosition(board, piece);
  return { x: piece.position.x, y };
}

/**
 * 보드를 문자열로 변환 (디버깅용)
 * @param board 게임 보드
 * @returns 보드의 문자열 표현
 */
export function boardToString(board: Board): string {
  return board.map(row => row.map(cell => (cell === 0 ? '.' : cell)).join(' ')).join('\n');
}

/**
 * 특정 위치가 보드 범위 내에 있는지 확인
 * @param x X 좌표
 * @param y Y 좌표
 * @returns 범위 내 여부
 */
export function isWithinBounds(x: number, y: number): boolean {
  return (
    x >= 0 &&
    x < GAME_CONFIG.BOARD_WIDTH &&
    y >= 0 &&
    y < GAME_CONFIG.BOARD_HEIGHT
  );
}
