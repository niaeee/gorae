import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameStatus, TetrominoType } from '../types';
import { GAME_CONFIG } from '../constants/tetrominos';
import {
  createEmptyBoard,
  checkCollision,
  mergePieceToBoard,
  findCompletedLines,
  clearLines,
  isGameOver,
  calculateHardDropPosition,
} from '../utils/board';
import {
  createTetromino,
  generateNextPieces,
  getNextPiece,
  rotateTetromino,
  moveTetromino,
} from '../utils/tetromino';
import {
  calculateDropInterval,
  updateGameStats,
  calculateHardDropScore,
  calculateSoftDropScore,
  loadHighScore,
  saveHighScore,
} from '../utils/scoring';

/**
 * 게임 상태 관리 커스텀 훅
 * 모든 게임 로직과 상태를 관리합니다.
 */
export function useGameState() {
  // 게임 상태
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialNextPieces = generateNextPieces(GAME_CONFIG.NEXT_PIECES_COUNT + 1);
    const { next, remaining } = getNextPiece(initialNextPieces);

    return {
      board: createEmptyBoard(),
      currentPiece: createTetromino(next),
      nextPieces: remaining.slice(0, GAME_CONFIG.NEXT_PIECES_COUNT),
      holdPiece: null,
      canHold: true,
      status: GameStatus.READY,
      stats: {
        score: 0,
        level: 1,
        lines: 0,
        highScore: loadHighScore(),
      },
    };
  });

  // 게임 루프 관련
  const dropIntervalRef = useRef<number | null>(null);
  const lastDropTimeRef = useRef<number>(0);

  /**
   * 게임 시작
   */
  const startGame = useCallback(() => {
    const initialNextPieces = generateNextPieces(GAME_CONFIG.NEXT_PIECES_COUNT + 1);
    const { next, remaining } = getNextPiece(initialNextPieces);

    setGameState({
      board: createEmptyBoard(),
      currentPiece: createTetromino(next),
      nextPieces: remaining.slice(0, GAME_CONFIG.NEXT_PIECES_COUNT),
      holdPiece: null,
      canHold: true,
      status: GameStatus.PLAYING,
      stats: {
        score: 0,
        level: 1,
        lines: 0,
        highScore: loadHighScore(),
      },
    });
  }, []);

  /**
   * 게임 일시정지/재개
   */
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: prev.status === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING,
    }));
  }, []);

  /**
   * 새 블록 생성
   */
  const spawnNewPiece = useCallback((state: GameState): GameState => {
    const { next, remaining } = getNextPiece([...state.nextPieces, ...generateNextPieces(7)]);
    const newPiece = createTetromino(next);

    // 게임 오버 확인
    if (isGameOver(state.board, newPiece)) {
      // 최고 점수 저장
      if (state.stats.score > state.stats.highScore) {
        saveHighScore(state.stats.score);
      }

      return {
        ...state,
        status: GameStatus.GAME_OVER,
        stats: {
          ...state.stats,
          highScore: Math.max(state.stats.score, state.stats.highScore),
        },
      };
    }

    return {
      ...state,
      currentPiece: newPiece,
      nextPieces: remaining.slice(0, GAME_CONFIG.NEXT_PIECES_COUNT),
      canHold: true,
    };
  }, []);

  /**
   * 블록을 한 칸 아래로 이동
   */
  const moveDown = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const movedPiece = moveTetromino(prev.currentPiece, { x: 0, y: 1 });

      // 충돌 확인
      if (checkCollision(prev.board, movedPiece)) {
        // 블록을 보드에 고정
        const mergedBoard = mergePieceToBoard(prev.board, prev.currentPiece);
        const completedLines = findCompletedLines(mergedBoard);

        // 라인 클리어
        const { board: clearedBoard, linesCleared } = clearLines(mergedBoard, completedLines);

        // 점수 업데이트
        const newStats = updateGameStats(prev.stats, linesCleared);

        // 새 블록 생성
        return spawnNewPiece({
          ...prev,
          board: clearedBoard,
          stats: newStats,
        });
      }

      return {
        ...prev,
        currentPiece: movedPiece,
      };
    });
  }, [spawnNewPiece]);

  /**
   * 왼쪽으로 이동
   */
  const moveLeft = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const movedPiece = moveTetromino(prev.currentPiece, { x: -1, y: 0 });

      if (!checkCollision(prev.board, movedPiece)) {
        return { ...prev, currentPiece: movedPiece };
      }

      return prev;
    });
  }, []);

  /**
   * 오른쪽으로 이동
   */
  const moveRight = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const movedPiece = moveTetromino(prev.currentPiece, { x: 1, y: 0 });

      if (!checkCollision(prev.board, movedPiece)) {
        return { ...prev, currentPiece: movedPiece };
      }

      return prev;
    });
  }, []);

  /**
   * 소프트 드롭 (빠르게 내리기)
   */
  const softDrop = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const movedPiece = moveTetromino(prev.currentPiece, { x: 0, y: 1 });

      if (!checkCollision(prev.board, movedPiece)) {
        const softDropScore = calculateSoftDropScore(1);
        return {
          ...prev,
          currentPiece: movedPiece,
          stats: {
            ...prev.stats,
            score: prev.stats.score + softDropScore,
          },
        };
      }

      return prev;
    });
  }, []);

  /**
   * 하드 드롭 (즉시 내리기)
   */
  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const { y, distance } = calculateHardDropPosition(prev.board, prev.currentPiece);
      const droppedPiece = { ...prev.currentPiece, position: { ...prev.currentPiece.position, y } };

      // 블록을 보드에 고정
      const mergedBoard = mergePieceToBoard(prev.board, droppedPiece);
      const completedLines = findCompletedLines(mergedBoard);

      // 라인 클리어
      const { board: clearedBoard, linesCleared } = clearLines(mergedBoard, completedLines);

      // 점수 업데이트 (하드 드롭 보너스 포함)
      const hardDropScore = calculateHardDropScore(distance);
      const newStats = updateGameStats(prev.stats, linesCleared, hardDropScore);

      // 새 블록 생성
      return spawnNewPiece({
        ...prev,
        board: clearedBoard,
        stats: newStats,
      });
    });
  }, [spawnNewPiece]);

  /**
   * 시계방향 회전
   */
  const rotateClockwise = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const rotatedPiece = rotateTetromino(prev.board, prev.currentPiece, 1);

      if (rotatedPiece) {
        return { ...prev, currentPiece: rotatedPiece };
      }

      return prev;
    });
  }, []);

  /**
   * 반시계방향 회전
   */
  const rotateCounterclockwise = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece) {
        return prev;
      }

      const rotatedPiece = rotateTetromino(prev.board, prev.currentPiece, -1);

      if (rotatedPiece) {
        return { ...prev, currentPiece: rotatedPiece };
      }

      return prev;
    });
  }, []);

  /**
   * Hold 기능
   */
  const hold = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== GameStatus.PLAYING || !prev.currentPiece || !prev.canHold) {
        return prev;
      }

      const currentType = prev.currentPiece.type;

      if (prev.holdPiece === null) {
        // Hold 슬롯이 비어있으면 다음 블록 가져오기
        const { next, remaining } = getNextPiece([...prev.nextPieces, ...generateNextPieces(7)]);
        const newPiece = createTetromino(next);

        return {
          ...prev,
          currentPiece: newPiece,
          holdPiece: currentType,
          nextPieces: remaining.slice(0, GAME_CONFIG.NEXT_PIECES_COUNT),
          canHold: false,
        };
      } else {
        // Hold 슬롯에 블록이 있으면 교체
        const newPiece = createTetromino(prev.holdPiece);

        return {
          ...prev,
          currentPiece: newPiece,
          holdPiece: currentType,
          canHold: false,
        };
      }
    });
  }, []);

  /**
   * 게임 루프 (자동 낙하)
   */
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) {
      return;
    }

    const dropInterval = calculateDropInterval(gameState.stats.level);
    const now = Date.now();

    if (now - lastDropTimeRef.current >= dropInterval) {
      moveDown();
      lastDropTimeRef.current = now;
    }

    dropIntervalRef.current = window.requestAnimationFrame(() => {});

    return () => {
      if (dropIntervalRef.current) {
        cancelAnimationFrame(dropIntervalRef.current);
      }
    };
  }, [gameState.status, gameState.stats.level, moveDown]);

  /**
   * 자동 낙하 타이머
   */
  useEffect(() => {
    if (gameState.status !== GameStatus.PLAYING) {
      return;
    }

    const dropInterval = calculateDropInterval(gameState.stats.level);
    const timer = setInterval(() => {
      moveDown();
    }, dropInterval);

    return () => clearInterval(timer);
  }, [gameState.status, gameState.stats.level, moveDown]);

  return {
    gameState,
    actions: {
      startGame,
      togglePause,
      moveLeft,
      moveRight,
      moveDown,
      softDrop,
      hardDrop,
      rotateClockwise,
      rotateCounterclockwise,
      hold,
    },
  };
}
