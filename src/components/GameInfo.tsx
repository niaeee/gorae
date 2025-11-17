import React from 'react';
import { GameStats } from '../types';
import { formatScore, getLinesUntilNextLevel } from '../utils/scoring';

interface GameInfoProps {
  stats: GameStats;
}

/**
 * 게임 정보 패널 컴포넌트
 * 점수, 레벨, 라인 수, 최고 점수를 표시합니다.
 */
export const GameInfo: React.FC<GameInfoProps> = ({ stats }) => {
  const linesUntilNext = getLinesUntilNextLevel(stats.lines);

  return (
    <div className="space-y-4">
      {/* 점수 */}
      <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-purple-500/30 backdrop-blur-sm">
        <div className="text-purple-300 text-sm font-bold mb-2">SCORE</div>
        <div className="text-3xl font-bold text-white tracking-wider">
          {formatScore(stats.score)}
        </div>
      </div>

      {/* 최고 점수 */}
      <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-yellow-500/30 backdrop-blur-sm">
        <div className="text-yellow-300 text-sm font-bold mb-2">HIGH SCORE</div>
        <div className="text-2xl font-bold text-yellow-100 tracking-wider">
          {formatScore(stats.highScore)}
        </div>
      </div>

      {/* 레벨 */}
      <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-green-500/30 backdrop-blur-sm">
        <div className="text-green-300 text-sm font-bold mb-2">LEVEL</div>
        <div className="flex items-baseline justify-between">
          <div className="text-4xl font-bold text-white">{stats.level}</div>
          <div className="text-xs text-gray-400">
            {linesUntilNext} lines to next
          </div>
        </div>
      </div>

      {/* 라인 수 */}
      <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-blue-500/30 backdrop-blur-sm">
        <div className="text-blue-300 text-sm font-bold mb-2">LINES</div>
        <div className="text-3xl font-bold text-white">{stats.lines}</div>
      </div>
    </div>
  );
};

interface GameControlsProps {
  onStart: () => void;
  onPause: () => void;
  isPaused: boolean;
  isGameOver: boolean;
}

/**
 * 게임 컨트롤 버튼 컴포넌트
 */
export const GameControls: React.FC<GameControlsProps> = ({
  onStart,
  onPause,
  isPaused,
  isGameOver,
}) => {
  return (
    <div className="space-y-3">
      {/* 시작/재시작 버튼 */}
      <button
        onClick={onStart}
        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        {isGameOver ? '🎮 RESTART' : '🚀 NEW GAME'}
      </button>

      {/* 일시정지 버튼 */}
      {!isGameOver && (
        <button
          onClick={onPause}
          className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          {isPaused ? '▶️ RESUME' : '⏸️ PAUSE'}
        </button>
      )}
    </div>
  );
};

interface KeyboardHintsProps {}

/**
 * 키보드 조작법 힌트 컴포넌트
 */
export const KeyboardHints: React.FC<KeyboardHintsProps> = () => {
  const hints = [
    { keys: '←/→', action: 'Move' },
    { keys: '↓', action: 'Soft Drop' },
    { keys: 'Space', action: 'Hard Drop' },
    { keys: '↑/X', action: 'Rotate CW' },
    { keys: 'Z', action: 'Rotate CCW' },
    { keys: 'C', action: 'Hold' },
    { keys: 'P/Esc', action: 'Pause' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border-2 border-purple-500/30 backdrop-blur-sm">
      <div className="text-purple-300 text-sm font-bold mb-3 text-center">CONTROLS</div>
      <div className="space-y-2">
        {hints.map((hint, index) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className="text-gray-400">{hint.action}</span>
            <kbd className="px-2 py-1 bg-slate-700 text-purple-300 rounded font-mono">
              {hint.keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};
