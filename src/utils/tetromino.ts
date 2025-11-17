import { Tetromino, TetrominoType, Board, Position } from '../types';
import {
  TETROMINO_SHAPES,
  ALL_TETROMINOS,
  GAME_CONFIG,
} from '../constants/tetrominos';
import { getWallKickData } from '../constants/wallKicks';
import { checkCollision } from './board';

/**
 * 랜덤 테트로미노 타입 생성
 * @returns 랜덤한 테트로미노 타입
 */
export function getRandomTetrominoType(): TetrominoType {
  const randomIndex = Math.floor(Math.random() * ALL_TETROMINOS.length);
  return ALL_TETROMINOS[randomIndex];
}

/**
 * 7-bag 랜덤 알고리즘
 * 7개의 블록을 섞어서 순서대로 제공 (더 공정한 랜덤)
 * @returns 7개의 테트로미노 타입 배열
 */
export function generate7Bag(): TetrominoType[] {
  const bag = [...ALL_TETROMINOS];

  // Fisher-Yates 셔플 알고리즘
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  return bag;
}

/**
 * 새 테트로미노 생성
 * @param type 테트로미노 타입
 * @returns 생성된 테트로미노 객체
 */
export function createTetromino(type: TetrominoType): Tetromino {
  const shapes = TETROMINO_SHAPES[type];
  const shape = shapes[0]; // 초기 회전 상태

  // 시작 위치: 보드 상단 중앙
  const startX = Math.floor((GAME_CONFIG.BOARD_WIDTH - 4) / 2);
  const startY = -2; // 보드 위쪽에서 시작 (일부가 보이지 않음)

  return {
    type,
    shape,
    position: { x: startX, y: startY },
    rotation: 0,
  };
}

/**
 * 테트로미노 이동
 * @param piece 테트로미노
 * @param offset 이동 오프셋
 * @returns 이동된 테트로미노
 */
export function moveTetromino(piece: Tetromino, offset: Position): Tetromino {
  return {
    ...piece,
    position: {
      x: piece.position.x + offset.x,
      y: piece.position.y + offset.y,
    },
  };
}

/**
 * 테트로미노 회전 (SRS 시스템 적용)
 * @param board 게임 보드
 * @param piece 회전할 테트로미노
 * @param direction 회전 방향 (1: 시계방향, -1: 반시계방향)
 * @returns 회전된 테트로미노 또는 null (회전 불가능)
 */
export function rotateTetromino(
  board: Board,
  piece: Tetromino,
  direction: 1 | -1
): Tetromino | null {
  const { type, rotation } = piece;

  // 새 회전 상태 계산 (0, 1, 2, 3)
  const newRotation = (rotation + direction + 4) % 4;

  // 새 도형 가져오기
  const newShape = TETROMINO_SHAPES[type][newRotation];

  // 회전된 테트로미노
  const rotatedPiece: Tetromino = {
    ...piece,
    shape: newShape,
    rotation: newRotation,
  };

  // 벽 킥 데이터 가져오기
  const wallKickData = getWallKickData(type);
  const rotationKey = `${rotation}->${newRotation}`;
  const offsets = wallKickData[rotationKey] || [{ x: 0, y: 0 }];

  // 각 오프셋을 시도하여 유효한 위치 찾기
  for (const offset of offsets) {
    const testPiece: Tetromino = {
      ...rotatedPiece,
      position: {
        x: piece.position.x + offset.x,
        y: piece.position.y + offset.y,
      },
    };

    // 충돌이 없으면 이 위치로 회전 성공
    if (!checkCollision(board, testPiece)) {
      return testPiece;
    }
  }

  // 모든 오프셋을 시도했지만 회전 불가능
  return null;
}

/**
 * 테트로미노를 특정 위치로 이동 (절대 좌표)
 * @param piece 테트로미노
 * @param position 새 위치
 * @returns 이동된 테트로미노
 */
export function setTetrominoPosition(piece: Tetromino, position: Position): Tetromino {
  return {
    ...piece,
    position: { ...position },
  };
}

/**
 * 테트로미노 복사
 * @param piece 복사할 테트로미노
 * @returns 복사된 테트로미노
 */
export function cloneTetromino(piece: Tetromino): Tetromino {
  return {
    ...piece,
    position: { ...piece.position },
    shape: piece.shape.map(row => [...row]),
  };
}

/**
 * 테트로미노의 실제 크기 계산 (빈 공간 제외)
 * @param shape 테트로미노 도형
 * @returns {width, height, offsetX, offsetY}
 */
export function getTetrominoSize(shape: number[][]) {
  let minX = shape[0].length;
  let maxX = -1;
  let minY = shape.length;
  let maxY = -1;

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    offsetX: minX,
    offsetY: minY,
  };
}

/**
 * 다음 블록들 생성 (7-bag 시스템 사용)
 * @param count 생성할 블록 개수
 * @returns 테트로미노 타입 배열
 */
export function generateNextPieces(count: number): TetrominoType[] {
  const pieces: TetrominoType[] = [];

  while (pieces.length < count) {
    const bag = generate7Bag();
    pieces.push(...bag);
  }

  return pieces.slice(0, count);
}

/**
 * 다음 블록 가져오기 및 새 블록 추가
 * @param nextPieces 현재 다음 블록들
 * @returns {next: 다음 블록 타입, remaining: 남은 블록들}
 */
export function getNextPiece(nextPieces: TetrominoType[]): {
  next: TetrominoType;
  remaining: TetrominoType[];
} {
  const [next, ...remaining] = nextPieces;

  // 남은 블록이 적으면 새 bag 추가
  if (remaining.length < GAME_CONFIG.NEXT_PIECES_COUNT) {
    const newBag = generate7Bag();
    remaining.push(...newBag);
  }

  return { next, remaining };
}
