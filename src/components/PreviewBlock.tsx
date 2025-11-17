import React from 'react';
import { TetrominoType } from '../types';
import { TETROMINO_SHAPES, TETROMINO_COLORS } from '../constants/tetrominos';
import { getTetrominoSize } from '../utils/tetromino';

interface PreviewBlockProps {
  type: TetrominoType | null;
  label: string;
  size?: 'small' | 'normal';
}

/**
 * 블록 미리보기 컴포넌트
 * Next 또는 Hold 블록을 표시합니다.
 */
export const PreviewBlock: React.FC<PreviewBlockProps> = ({
  type,
  label,
  size = 'normal',
}) => {
  if (!type) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-purple-500/30 backdrop-blur-sm">
        <div className="text-purple-300 text-sm font-bold mb-2 text-center">{label}</div>
        <div
          className={`bg-slate-900/30 rounded ${size === 'small' ? 'h-12 w-12' : 'h-16 w-16'} flex items-center justify-center`}
        >
          <span className="text-gray-600 text-xs">Empty</span>
        </div>
      </div>
    );
  }

  const shape = TETROMINO_SHAPES[type][0]; // 첫 번째 회전 상태
  const color = TETROMINO_COLORS[type];
  const { width, height, offsetX, offsetY } = getTetrominoSize(shape);

  const cellSize = size === 'small' ? 'w-2.5 h-2.5' : 'w-4 h-4';

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-purple-500/30 backdrop-blur-sm">
      <div className="text-purple-300 text-sm font-bold mb-3 text-center">{label}</div>
      <div className="flex items-center justify-center">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: height }).map((_, y) =>
            Array.from({ length: width }).map((_, x) => {
              const shapeY = offsetY + y;
              const shapeX = offsetX + x;
              const hasBlock = shape[shapeY]?.[shapeX] === 1;

              return (
                <div
                  key={`${y}-${x}`}
                  className={`${cellSize} rounded-sm ${hasBlock ? 'shadow-md' : 'bg-transparent'}`}
                  style={{
                    backgroundColor: hasBlock ? color : 'transparent',
                    boxShadow: hasBlock
                      ? `inset 0 0 0 1px rgba(255,255,255,0.3), 0 0 6px ${color}60`
                      : undefined,
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

interface NextPiecesProps {
  nextPieces: TetrominoType[];
  count?: number;
}

/**
 * 다음 블록 목록 컴포넌트
 */
export const NextPieces: React.FC<NextPiecesProps> = ({ nextPieces, count = 5 }) => {
  return (
    <div className="space-y-3">
      <div className="text-purple-300 text-lg font-bold text-center">NEXT</div>
      {nextPieces.slice(0, count).map((type, index) => (
        <PreviewBlock
          key={`next-${index}`}
          type={type}
          label={`${index + 1}`}
          size={index === 0 ? 'normal' : 'small'}
        />
      ))}
    </div>
  );
};

interface HoldPieceProps {
  holdPiece: TetrominoType | null;
  canHold: boolean;
}

/**
 * Hold 블록 컴포넌트
 */
export const HoldPiece: React.FC<HoldPieceProps> = ({ holdPiece, canHold }) => {
  return (
    <div className={`${!canHold ? 'opacity-50' : ''}`}>
      <PreviewBlock type={holdPiece} label="HOLD" size="normal" />
      {!canHold && (
        <div className="text-xs text-red-400 text-center mt-2">
          Cannot hold
        </div>
      )}
    </div>
  );
};
