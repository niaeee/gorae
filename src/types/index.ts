/**
 * 테트로미노 타입 정의
 * I, O, T, S, Z, J, L 7가지 블록 타입
 */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/**
 * 셀(Cell) 타입
 * 0: 빈 칸
 * 1-7: 각 테트로미노 타입에 해당하는 숫자
 */
export type CellType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * 보드 타입
 * 2차원 배열로 게임 보드를 표현 (기본: 20행 x 10열)
 */
export type Board = CellType[][];

/**
 * 좌표 타입
 * x: 가로 위치, y: 세로 위치
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 테트로미노 도형 정의
 * 4x4 그리드에서 블록의 모양을 정의
 */
export type Shape = number[][];

/**
 * 테트로미노 객체
 * type: 블록 타입
 * shape: 현재 회전 상태의 도형
 * position: 보드에서의 위치
 * rotation: 현재 회전 상태 (0, 1, 2, 3)
 */
export interface Tetromino {
  type: TetrominoType;
  shape: Shape;
  position: Position;
  rotation: number;
}

/**
 * 게임 상태
 */
export const GameStatus = {
  READY: 'READY',           // 게임 시작 전
  PLAYING: 'PLAYING',       // 게임 진행 중
  PAUSED: 'PAUSED',         // 일시 정지
  GAME_OVER: 'GAME_OVER',   // 게임 오버
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

/**
 * 게임 통계 정보
 */
export interface GameStats {
  score: number;           // 현재 점수
  level: number;           // 현재 레벨
  lines: number;           // 제거한 라인 수
  highScore: number;       // 최고 점수
}

/**
 * 게임 상태 인터페이스
 */
export interface GameState {
  board: Board;                    // 게임 보드
  currentPiece: Tetromino | null;  // 현재 조작 중인 블록
  nextPieces: TetrominoType[];     // 다음에 나올 블록들 (5개)
  holdPiece: TetrominoType | null; // Hold 중인 블록
  canHold: boolean;                // Hold 사용 가능 여부
  status: GameStatus;              // 게임 상태
  stats: GameStats;                // 게임 통계
}

/**
 * SRS 회전 시스템의 벽 킥 오프셋
 * 각 회전 상태에 대한 테스트 위치들
 */
export interface WallKickOffset {
  x: number;
  y: number;
}

/**
 * 사운드 타입
 */
export const SoundType = {
  MOVE: 'MOVE',           // 블록 이동
  ROTATE: 'ROTATE',       // 블록 회전
  DROP: 'DROP',           // 블록 착지
  LINE_CLEAR: 'LINE_CLEAR', // 라인 클리어
  TETRIS: 'TETRIS',       // 테트리스 (4줄 동시 제거)
  LEVEL_UP: 'LEVEL_UP',   // 레벨 업
  GAME_OVER: 'GAME_OVER', // 게임 오버
  BGM: 'BGM',             // 배경 음악
} as const;

export type SoundType = typeof SoundType[keyof typeof SoundType];

/**
 * 키 매핑
 */
export interface KeyMapping {
  moveLeft: string[];      // 왼쪽 이동
  moveRight: string[];     // 오른쪽 이동
  softDrop: string[];      // 소프트 드롭
  hardDrop: string[];      // 하드 드롭
  rotateClockwise: string[];    // 시계방향 회전
  rotateCounterclockwise: string[]; // 반시계방향 회전
  hold: string[];          // Hold
  pause: string[];         // 일시정지
}

/**
 * 점수 계산 상수
 */
export interface ScoreMultiplier {
  SINGLE: number;   // 1줄 제거
  DOUBLE: number;   // 2줄 제거
  TRIPLE: number;   // 3줄 제거
  TETRIS: number;   // 4줄 제거
  SOFT_DROP: number; // 소프트 드롭 1칸당
  HARD_DROP: number; // 하드 드롭 1칸당
}
