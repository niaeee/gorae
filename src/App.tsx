import { useEffect } from 'react';
import { GameStatus } from './types';
import { useGameState } from './hooks/useGameState';
import { useKeyboard } from './hooks/useKeyboard';
import { GameBoard } from './components/GameBoard';
import { NextPieces, HoldPiece } from './components/PreviewBlock';
import { GameInfo, GameControls, KeyboardHints } from './components/GameInfo';

/**
 * 메인 테트리스 게임 애플리케이션
 */
function App() {
  const { gameState, actions } = useGameState();

  // 키보드 입력 처리
  useKeyboard({
    actions: {
      moveLeft: actions.moveLeft,
      moveRight: actions.moveRight,
      softDrop: actions.softDrop,
      hardDrop: actions.hardDrop,
      rotateClockwise: actions.rotateClockwise,
      rotateCounterclockwise: actions.rotateCounterclockwise,
      hold: actions.hold,
      pause: actions.togglePause,
    },
    gameStatus: gameState.status,
    enabled: true,
  });

  // 페이지 타이틀 업데이트
  useEffect(() => {
    document.title = `Tetris - Score: ${gameState.stats.score}`;
  }, [gameState.stats.score]);

  const isPaused = gameState.status === GameStatus.PAUSED;
  const isGameOver = gameState.status === GameStatus.GAME_OVER;
  const isReady = gameState.status === GameStatus.READY;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 no-select">
      {/* 메인 컨테이너 */}
      <div className="max-w-7xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
            TETRIS
          </h1>
          <p className="text-gray-400 text-sm">
            상업용 퀄리티 테트리스 게임 by AI
          </p>
        </div>

        {/* 게임 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 왼쪽 패널: Hold & 정보 */}
          <div className="lg:col-span-3 space-y-4">
            <HoldPiece holdPiece={gameState.holdPiece} canHold={gameState.canHold} />
            <GameInfo stats={gameState.stats} />
          </div>

          {/* 중앙: 게임 보드 */}
          <div className="lg:col-span-6 relative">
            <GameBoard
              board={gameState.board}
              currentPiece={gameState.currentPiece}
              showGhost={true}
            />

            {/* 오버레이 메시지 */}
            {(isReady || isPaused || isGameOver) && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="text-center p-8">
                  {isReady && (
                    <>
                      <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Play?
                      </h2>
                      <p className="text-gray-300 mb-6">
                        Press "NEW GAME" to start
                      </p>
                    </>
                  )}

                  {isPaused && (
                    <>
                      <h2 className="text-4xl font-bold text-yellow-400 mb-4">
                        ⏸️ PAUSED
                      </h2>
                      <p className="text-gray-300 mb-6">
                        Press P or ESC to resume
                      </p>
                    </>
                  )}

                  {isGameOver && (
                    <>
                      <h2 className="text-4xl font-bold text-red-400 mb-4">
                        💀 GAME OVER
                      </h2>
                      <p className="text-gray-300 mb-2">
                        Final Score: <span className="text-white font-bold">{gameState.stats.score}</span>
                      </p>
                      {gameState.stats.score === gameState.stats.highScore && gameState.stats.score > 0 && (
                        <p className="text-yellow-400 mb-6">
                          🎉 NEW HIGH SCORE!
                        </p>
                      )}
                      <button
                        onClick={actions.startGame}
                        className="mt-6 py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        🔄 PLAY AGAIN
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 패널: Next & 컨트롤 */}
          <div className="lg:col-span-3 space-y-4">
            <NextPieces nextPieces={gameState.nextPieces} count={5} />
            <GameControls
              onStart={actions.startGame}
              onPause={actions.togglePause}
              isPaused={isPaused}
              isGameOver={isGameOver}
            />
            <KeyboardHints />
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            Made with ❤️ using React, TypeScript & Tailwind CSS
          </p>
          <p className="mt-1">
            © 2025 - SRS Rotation System with Wall Kicks
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
