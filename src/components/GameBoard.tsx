import React from 'react';
import { Board, Tetromino } from '../types';
import { TETROMINO_COLORS, TETROMINO_TO_NUMBER } from '../constants/tetrominos';
import { calculateGhostPosition } from '../utils/board';

interface GameBoardProps {
  board: Board;
  currentPiece: Tetromino | null;
  showGhost?: boolean;
}

/**
 * 게임 보드 컴포넌트
 * 20x10 그리드에 블록들을 렌더링합니다.
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentPiece,
  showGhost = true,
}) => {
  /**
   * 블록 타입에 따른 색상 가져오기
   */
  const getCellColor = (cellValue: number): string => {
    if (cellValue === 0) return 'transparent';

    const typeMapping: Record<number, keyof typeof TETROMINO_COLORS> = {
      1: 'I',
      2: 'O',
      3: 'T',
      4: 'S',
      5: 'Z',
      6: 'J',
      7: 'L',
    };

    const type = typeMapping[cellValue];
    return type ? TETROMINO_COLORS[type] : 'transparent';
  };

  /**
   * 현재 블록과 고스트를 포함한 전체 보드 생성
   */
  const getDisplayBoard = (): (number | 'ghost')[][] => {
    // 보드 복사
    const displayBoard: (number | 'ghost')[][] = board.map(row => [...row]);

    // 고스트 피스 추가
    if (showGhost && currentPiece) {
      const ghostPos = calculateGhostPosition(board, currentPiece);
      const { shape } = currentPiece;

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardY = ghostPos.y + y;
            const boardX = ghostPos.x + x;

            if (
              boardY >= 0 &&
              boardY < board.length &&
              boardX >= 0 &&
              boardX < board[0].length &&
              displayBoard[boardY][boardX] === 0
            ) {
              displayBoard[boardY][boardX] = 'ghost';
            }
          }
        }
      }
    }

    // 현재 블록 추가
    if (currentPiece) {
      const { shape, position } = currentPiece;
      const cellValue = TETROMINO_TO_NUMBER[currentPiece.type];

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardY = position.y + y;
            const boardX = position.x + x;

            if (
              boardY >= 0 &&
              boardY < board.length &&
              boardX >= 0 &&
              boardX < board[0].length
            ) {
              displayBoard[boardY][boardX] = cellValue;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const displayBoard = getDisplayBoard();

  return (
    <div className="relative">
      {/* 보드 컨테이너 */}
      <div
        className="grid gap-[2px] bg-slate-800/50 p-2 rounded-lg backdrop-blur-sm border-2 border-purple-500/30 shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(10, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(20, minmax(0, 1fr))`,
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => {
            const isGhost = cell === 'ghost';
            const cellValue = typeof cell === 'number' ? cell : 0;
            const color = getCellColor(cellValue);
            const isEmpty = cellValue === 0 && !isGhost;

            return (
              <div
                key={`${y}-${x}`}
                className={`
                  aspect-square rounded-sm transition-all duration-100
                  ${isEmpty ? 'bg-slate-900/30' : ''}
                  ${isGhost ? 'border-2 border-gray-400 bg-gray-400/20' : ''}
                  ${!isEmpty && !isGhost ? 'shadow-lg' : ''}
                `}
                style={{
                  backgroundColor: isGhost ? 'transparent' : isEmpty ? undefined : color,
                  boxShadow: !isEmpty && !isGhost
                    ? `inset 0 0 0 2px rgba(255,255,255,0.3),
                       0 0 10px ${color}40`
                    : undefined,
                }}
              />
            );
          })
        )}
      </div>

      {/* 그리드 라인 (선택사항) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="grid h-full w-full opacity-10"
          style={{
            gridTemplateColumns: `repeat(10, 1fr)`,
            gridTemplateRows: `repeat(20, 1fr)`,
          }}
        >
          {Array.from({ length: 200 }).map((_, i) => (
            <div key={i} className="border border-purple-300/20" />
          ))}
        </div>
      </div>
    </div>
  );
};
