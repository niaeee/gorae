import { SCORE_CONFIG, GAME_CONFIG } from '../constants/tetrominos';

/**
 * 라인 제거에 따른 점수 계산
 * @param linesCleared 제거된 라인 수
 * @param level 현재 레벨
 * @returns 획득 점수
 */
export function calculateLineScore(linesCleared: number, level: number): number {
  let baseScore = 0;

  switch (linesCleared) {
    case 1:
      baseScore = SCORE_CONFIG.SINGLE;
      break;
    case 2:
      baseScore = SCORE_CONFIG.DOUBLE;
      break;
    case 3:
      baseScore = SCORE_CONFIG.TRIPLE;
      break;
    case 4:
      baseScore = SCORE_CONFIG.TETRIS;
      break;
    default:
      baseScore = 0;
  }

  // 레벨에 따라 점수 배율 적용
  return baseScore * level;
}

/**
 * 소프트 드롭 점수 계산
 * @param distance 이동한 칸 수
 * @returns 획득 점수
 */
export function calculateSoftDropScore(distance: number): number {
  return distance * SCORE_CONFIG.SOFT_DROP;
}

/**
 * 하드 드롭 점수 계산
 * @param distance 이동한 칸 수
 * @returns 획득 점수
 */
export function calculateHardDropScore(distance: number): number {
  return distance * SCORE_CONFIG.HARD_DROP;
}

/**
 * 레벨 계산
 * @param totalLines 총 제거한 라인 수
 * @returns 현재 레벨
 */
export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / GAME_CONFIG.LINES_PER_LEVEL) + GAME_CONFIG.INITIAL_LEVEL;
}

/**
 * 레벨에 따른 블록 낙하 속도 계산
 * @param level 현재 레벨
 * @returns 낙하 간격 (밀리초)
 */
export function calculateDropInterval(level: number): number {
  // 레벨이 높아질수록 빨라짐 (지수 감소)
  // 레벨 1: 1000ms, 레벨 10: 약 200ms, 레벨 20: 약 50ms
  const interval = GAME_CONFIG.MAX_DROP_INTERVAL * Math.pow(0.8, level - 1);

  // 최소값 제한
  return Math.max(interval, GAME_CONFIG.MIN_DROP_INTERVAL);
}

/**
 * 다음 레벨까지 남은 라인 수 계산
 * @param totalLines 총 제거한 라인 수
 * @returns 다음 레벨까지 필요한 라인 수
 */
export function getLinesUntilNextLevel(totalLines: number): number {
  const currentLevelLines = totalLines % GAME_CONFIG.LINES_PER_LEVEL;
  return GAME_CONFIG.LINES_PER_LEVEL - currentLevelLines;
}

/**
 * 게임 통계 업데이트
 * @param currentStats 현재 통계
 * @param linesCleared 제거된 라인 수
 * @param dropScore 드롭으로 얻은 점수
 * @returns 업데이트된 통계
 */
export function updateGameStats(
  currentStats: { score: number; level: number; lines: number; highScore: number },
  linesCleared: number,
  dropScore: number = 0
): { score: number; level: number; lines: number; highScore: number } {
  const newLines = currentStats.lines + linesCleared;
  const newLevel = calculateLevel(newLines);
  const lineScore = calculateLineScore(linesCleared, currentStats.level);
  const newScore = currentStats.score + lineScore + dropScore;
  const newHighScore = Math.max(newScore, currentStats.highScore);

  return {
    score: newScore,
    level: newLevel,
    lines: newLines,
    highScore: newHighScore,
  };
}

/**
 * LocalStorage에서 최고 점수 불러오기
 * @returns 저장된 최고 점수
 */
export function loadHighScore(): number {
  try {
    const stored = localStorage.getItem('tetris_high_score');
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Failed to load high score:', error);
    return 0;
  }
}

/**
 * LocalStorage에 최고 점수 저장
 * @param score 저장할 점수
 */
export function saveHighScore(score: number): void {
  try {
    localStorage.setItem('tetris_high_score', score.toString());
  } catch (error) {
    console.error('Failed to save high score:', error);
  }
}

/**
 * 점수를 3자리마다 콤마로 구분하여 표시
 * @param score 점수
 * @returns 포맷된 점수 문자열
 */
export function formatScore(score: number): string {
  return score.toLocaleString();
}
