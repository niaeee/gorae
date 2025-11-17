/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 테트리스 블록 색상
        'tetris-i': '#00f0f0', // 하늘색 (I)
        'tetris-o': '#f0f000', // 노란색 (O)
        'tetris-t': '#a000f0', // 보라색 (T)
        'tetris-s': '#00f000', // 초록색 (S)
        'tetris-z': '#f00000', // 빨간색 (Z)
        'tetris-j': '#0000f0', // 파란색 (J)
        'tetris-l': '#f0a000', // 주황색 (L)
        'tetris-ghost': '#888888', // 고스트 블록
      },
      animation: {
        'line-clear': 'lineClear 0.3s ease-in-out',
        'block-drop': 'blockDrop 0.1s ease-out',
      },
      keyframes: {
        lineClear: {
          '0%': { opacity: '1', transform: 'scaleY(1)' },
          '50%': { opacity: '0.5', transform: 'scaleY(0.8)' },
          '100%': { opacity: '0', transform: 'scaleY(0)' },
        },
        blockDrop: {
          '0%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
