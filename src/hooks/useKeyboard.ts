import { useEffect, useCallback, useRef } from 'react';
import { KEY_MAPPING } from '../constants/tetrominos';
import { GameStatus } from '../types';

interface KeyboardActions {
  moveLeft: () => void;
  moveRight: () => void;
  softDrop: () => void;
  hardDrop: () => void;
  rotateClockwise: () => void;
  rotateCounterclockwise: () => void;
  hold: () => void;
  pause: () => void;
}

interface UseKeyboardProps {
  actions: KeyboardActions;
  gameStatus: GameStatus;
  enabled?: boolean;
}

/**
 * 키보드 입력 처리 커스텀 훅
 * DAS (Delayed Auto Shift) 및 키 반복 지원
 */
export function useKeyboard({ actions, gameStatus, enabled = true }: UseKeyboardProps) {
  // 현재 눌린 키 추적
  const pressedKeysRef = useRef<Set<string>>(new Set());

  // DAS 타이머 (키를 누르고 있을 때 연속 이동)
  const dasTimerRef = useRef<number | null>(null);
  const repeatTimerRef = useRef<number | null>(null);

  // DAS 설정
  const DAS_DELAY = 170; // 초기 지연 (ms)
  const DAS_INTERVAL = 50; // 반복 간격 (ms)

  /**
   * 키가 특정 액션에 매핑되는지 확인
   */
  const isKeyForAction = useCallback(
    (key: string, actionKeys: string[]): boolean => {
      return actionKeys.includes(key);
    },
    []
  );

  /**
   * 키 누름 핸들러
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const key = event.key;

      // 이미 눌린 키는 무시 (키 반복 방지)
      if (pressedKeysRef.current.has(key)) {
        return;
      }

      pressedKeysRef.current.add(key);

      // 게임이 플레이 중일 때만 게임 조작 허용
      if (gameStatus === GameStatus.PLAYING) {
        // 즉시 실행되는 액션
        if (isKeyForAction(key, KEY_MAPPING.hardDrop)) {
          event.preventDefault();
          actions.hardDrop();
        } else if (isKeyForAction(key, KEY_MAPPING.rotateClockwise)) {
          event.preventDefault();
          actions.rotateClockwise();
        } else if (isKeyForAction(key, KEY_MAPPING.rotateCounterclockwise)) {
          event.preventDefault();
          actions.rotateCounterclockwise();
        } else if (isKeyForAction(key, KEY_MAPPING.hold)) {
          event.preventDefault();
          actions.hold();
        }

        // DAS를 사용하는 액션 (왼쪽/오른쪽/소프트 드롭)
        if (isKeyForAction(key, KEY_MAPPING.moveLeft)) {
          event.preventDefault();
          actions.moveLeft(); // 즉시 한 번 이동

          // DAS 타이머 시작
          dasTimerRef.current = setTimeout(() => {
            repeatTimerRef.current = setInterval(() => {
              if (pressedKeysRef.current.has(key)) {
                actions.moveLeft();
              }
            }, DAS_INTERVAL);
          }, DAS_DELAY);
        } else if (isKeyForAction(key, KEY_MAPPING.moveRight)) {
          event.preventDefault();
          actions.moveRight();

          dasTimerRef.current = setTimeout(() => {
            repeatTimerRef.current = setInterval(() => {
              if (pressedKeysRef.current.has(key)) {
                actions.moveRight();
              }
            }, DAS_INTERVAL);
          }, DAS_DELAY);
        } else if (isKeyForAction(key, KEY_MAPPING.softDrop)) {
          event.preventDefault();
          actions.softDrop();

          dasTimerRef.current = setTimeout(() => {
            repeatTimerRef.current = setInterval(() => {
              if (pressedKeysRef.current.has(key)) {
                actions.softDrop();
              }
            }, DAS_INTERVAL);
          }, DAS_DELAY);
        }
      }

      // 일시정지는 게임 중이거나 일시정지 상태일 때 허용
      if (
        (gameStatus === GameStatus.PLAYING || gameStatus === GameStatus.PAUSED) &&
        isKeyForAction(key, KEY_MAPPING.pause)
      ) {
        event.preventDefault();
        actions.pause();
      }
    },
    [
      enabled,
      gameStatus,
      actions,
      isKeyForAction,
      DAS_DELAY,
      DAS_INTERVAL,
    ]
  );

  /**
   * 키 떼기 핸들러
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key;
    pressedKeysRef.current.delete(key);

    // DAS 타이머 정리
    if (dasTimerRef.current) {
      clearTimeout(dasTimerRef.current);
      dasTimerRef.current = null;
    }

    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }, []);

  /**
   * 키보드 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      // 타이머 정리
      if (dasTimerRef.current) {
        clearTimeout(dasTimerRef.current);
      }
      if (repeatTimerRef.current) {
        clearInterval(repeatTimerRef.current);
      }

      // 눌린 키 초기화
      pressedKeysRef.current.clear();
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  /**
   * 게임 상태가 변경되면 타이머 정리
   */
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING) {
      if (dasTimerRef.current) {
        clearTimeout(dasTimerRef.current);
        dasTimerRef.current = null;
      }
      if (repeatTimerRef.current) {
        clearInterval(repeatTimerRef.current);
        repeatTimerRef.current = null;
      }
      pressedKeysRef.current.clear();
    }
  }, [gameStatus]);
}
