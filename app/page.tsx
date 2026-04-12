'use client';

import { useState, useEffect, useCallback } from 'react';

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 4;

const TILE_COLORS: Record<number, string> = {
  2: 'bg-[#eee4da] text-[#776e65]',
  4: 'bg-[#ede0c8] text-[#776e65]',
  8: 'bg-[#f2b179] text-white',
  16: 'bg-[#f59563] text-white',
  32: 'bg-[#f67c5f] text-white',
  64: 'bg-[#f65e3b] text-white',
  128: 'bg-[#edcf72] text-white',
  256: 'bg-[#edcc61] text-white',
  512: 'bg-[#edc850] text-white',
  1024: 'bg-[#edc53f] text-white',
  2048: 'bg-[#edc22e] text-white',
};

function getTileColor(value: number): string {
  return TILE_COLORS[value] || 'bg-[#3c3a32] text-white';
}

function generateId(): number {
  return Date.now() + Math.random();
}

function createEmptyGrid(): (Tile | null)[][] {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

function getEmptyCells(grid: (Tile | null)[][]): { row: number; col: number }[] {
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[row][col]) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

function addRandomTile(grid: (Tile | null)[][]): (Tile | null)[][] {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return grid;

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = {
    id: generateId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row,
    col,
    isNew: true,
  };
  return newGrid;
}

function initializeGame(): { grid: (Tile | null)[][]; score: number } {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return { grid, score: 0 };
}

function slideRowLeft(row: (Tile | null)[]): { row: (Tile | null)[]; score: number; moved: boolean } {
  const filtered = row.filter((tile): tile is Tile => tile !== null);
  const newRow: (Tile | null)[] = Array(GRID_SIZE).fill(null);
  let score = 0;
  let moved = false;
  let writeIndex = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
      const mergedValue = filtered[i].value * 2;
      newRow[writeIndex] = {
        id: generateId(),
        value: mergedValue,
        row: filtered[i].row,
        col: writeIndex,
        isMerged: true,
      };
      score += mergedValue;
      i++;
      moved = true;
    } else {
      newRow[writeIndex] = {
        ...filtered[i],
        col: writeIndex,
      };
      if (filtered[i].col !== writeIndex) {
        moved = true;
      }
    }
    writeIndex++;
  }

  return { row: newRow, score, moved };
}

function moveGrid(
  grid: (Tile | null)[][],
  direction: Direction
): { newGrid: (Tile | null)[][]; scoreGained: number; moved: boolean } {
  let scoreGained = 0;
  let moved = false;
  const newGrid = createEmptyGrid();

  if (direction === 'left') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const result = slideRowLeft(grid[row]);
      newGrid[row] = result.row.map((tile, col) => tile ? { ...tile, row, col } : null);
      scoreGained += result.score;
      if (result.moved) moved = true;
    }
  } else if (direction === 'right') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const reversed = [...grid[row]].reverse();
      const result = slideRowLeft(reversed);
      newGrid[row] = result.row.reverse().map((tile, col) => tile ? { ...tile, row, col: GRID_SIZE - 1 - col } : null);
      scoreGained += result.score;
      if (result.moved) moved = true;
    }
  } else if (direction === 'up') {
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = Array(GRID_SIZE).fill(null).map((_, row) => grid[row][col]);
      const result = slideRowLeft(column);
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = result.row[row] ? { ...result.row[row], row, col } : null;
      }
      scoreGained += result.score;
      if (result.moved) moved = true;
    }
  } else if (direction === 'down') {
    for (let col = 0; col < GRID_SIZE; col++) {
      const column = Array(GRID_SIZE).fill(null).map((_, row) => grid[row][col]).reverse();
      const result = slideRowLeft(column);
      for (let row = 0; row < GRID_SIZE; row++) {
        newGrid[row][col] = result.row[GRID_SIZE - 1 - row] 
          ? { ...result.row[GRID_SIZE - 1 - row], row, col } 
          : null;
      }
      scoreGained += result.score;
      if (result.moved) moved = true;
    }
  }

  return { newGrid, scoreGained, moved };
}

function hasWon(grid: (Tile | null)[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col]?.value === 2048) {
        return true;
      }
    }
  }
  return false;
}

function hasValidMoves(grid: (Tile | null)[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[row][col]) return true;
      const currentValue = grid[row][col]!.value;
      if (row < GRID_SIZE - 1 && grid[row + 1][col]?.value === currentValue) return true;
      if (col < GRID_SIZE - 1 && grid[row][col + 1]?.value === currentValue) return true;
    }
  }
  return false;
}

export default function Page() {
  const [grid, setGrid] = useState<(Tile | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  useEffect(() => {
    const { grid: initialGrid, score: initialScore } = initializeGame();
    setGrid(initialGrid);
    setScore(initialScore);
    const saved = localStorage.getItem('2048-best-score');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('2048-best-score', score.toString());
    }
  }, [score, bestScore]);

  const handleMove = useCallback((direction: Direction) => {
    if (gameOver || (won && !keepPlaying)) return;

    setGrid(currentGrid => {
      const { newGrid, scoreGained, moved } = moveGrid(currentGrid, direction);
      
      if (moved) {
        const gridWithNewTile = addRandomTile(newGrid);
        const newScore = score + scoreGained;
        setScore(newScore);
        
        if (!keepPlaying && hasWon(gridWithNewTile)) {
          setWon(true);
        }
        
        if (!hasValidMoves(gridWithNewTile)) {
          setGameOver(true);
        }
        
        return gridWithNewTile;
      }
      
      return currentGrid;
    });
  }, [score, gameOver, won, keepPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const restartGame = () => {
    const { grid: initialGrid, score: initialScore } = initializeGame();
    setGrid(initialGrid);
    setScore(initialScore);
    setWon(false);
    setGameOver(false);
    setKeepPlaying(false);
  };

  const continueGame = () => {
    setKeepPlaying(true);
  };

  if (grid.length === 0) {
    return (
      <main className="min-h-screen bg-[#faf8ef] flex items-center justify-center px-4">
        <div className="text-2xl font-bold text-[#776e65]">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8ef] px-4 py-6 sm:py-8 md:py-12">
      <div className="mx-auto max-w-lg">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-5xl font-bold text-[#776e65] sm:text-6xl">2048</h1>
            <p className="mt-1 text-sm font-medium text-[#776e65]/80 sm:text-base">
              Join the tiles, get to 2048!
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex min-w-[5rem] flex-col items-center rounded-md bg-[#bbada0] px-3 py-2 sm:min-w-[6rem] sm:px-4 sm:py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#eee4da] sm:text-xs">
                Score
              </span>
              <span className="text-lg font-bold text-white sm:text-xl">{score}</span>
            </div>
            <div className="flex min-w-[5rem] flex-col items-center rounded-md bg-[#bbada0] px-3 py-2 sm:min-w-[6rem] sm:px-4 sm:py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#eee4da] sm:text-xs">
                Best
              </span>
              <span className="text-lg font-bold text-white sm:text-xl">{bestScore}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <p className="text-sm font-medium text-[#776e65]/90 sm:text-base">
            Use arrow keys to move
          </p>
          <button
            onClick={restartGame}
            className="rounded-md bg-[#8f7a66] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#7f6a56] focus:outline-none focus:ring-2 focus:ring-[#8f7a66] focus:ring-offset-2 active:bg-[#6f5a46] sm:px-6 sm:py-3 sm:text-base"
            aria-label="Start a new game"
          >
            New Game
          </button>
        </div>

        {/* Game Grid Container */}
        <div className="relative rounded-lg bg-[#bbada0] p-2 sm:p-3">
          {/* Background Grid Cells */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-md bg-[#cdc1b4]"
              />
            ))}
          </div>

          {/* Tiles Layer */}
          <div className="absolute inset-2 sm:inset-3">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {grid.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                  <div key={`${rowIndex}-${colIndex}`} className="relative aspect-square">
                    {tile && (
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-md text-xl font-bold transition-all duration-150 sm:text-2xl md:text-3xl ${getTileColor(tile.value)} ${tile.isNew ? 'animate-pop-in' : ''} ${tile.isMerged ? 'animate-pop' : ''}`}
                      >
                        {tile.value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Win Overlay */}
          {won && !keepPlaying && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-[#edc22e]/85 p-4 backdrop-blur-sm">
              <h2 className="mb-2 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                You Win!
              </h2>
              <p className="mb-6 text-base font-medium text-white/90 sm:text-lg">
                You reached 2048
              </p>
              <div className="flex gap-3">
                <button
                  onClick={continueGame}
                  className="min-h-[44px] rounded-md bg-white px-4 py-2 text-sm font-bold text-[#776e65] transition-colors hover:bg-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 sm:px-6 sm:text-base"
                >
                  Keep Playing
                </button>
                <button
                  onClick={restartGame}
                  className="min-h-[44px] rounded-md bg-[#8f7a66] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#7f6a56] focus:outline-none focus:ring-2 focus:ring-[#8f7a66] focus:ring-offset-2 sm:px-6 sm:text-base"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-[#776e65]/85 p-4 backdrop-blur-sm">
              <h2 className="mb-2 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                Game Over!
              </h2>
              <p className="mb-6 text-base font-medium text-white/90 sm:text-lg">
                No more moves available
              </p>
              <button
                onClick={restartGame}
                className="min-h-[44px] rounded-md bg-[#8f7a66] px-6 py-2 text-base font-bold text-white transition-colors hover:bg-[#7f6a56] focus:outline-none focus:ring-2 focus:ring-[#8f7a66] focus:ring-offset-2 sm:px-8 sm:py-3 sm:text-lg"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center sm:mt-8">
          <p className="text-sm leading-relaxed text-[#776e65]/80 sm:text-base">
            <strong className="text-[#776e65]">How to play:</strong> Use your{' '}
            <strong className="text-[#776e65]">arrow keys</strong> to move the tiles. 
            When two tiles with the same number touch, they{' '}
            <strong className="text-[#776e65]">merge into one!</strong>
          </p>
        </div>
      </div>
    </main>
  );
}