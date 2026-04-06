'use client';

import { useState, useEffect, useCallback } from 'react';
import Tile from './Tile';

type Cell = number | null;
type Board = Cell[][];

interface TileData {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

const GRID_SIZE = 4;

function createEmptyBoard(): Board {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

function getRandomEmptyCell(board: Board): [number, number] | null {
  const emptyCells: [number, number][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === null) {
        emptyCells.push([row, col]);
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function addRandomTile(board: Board): Board {
  const newBoard = board.map(row => [...row]);
  const cell = getRandomEmptyCell(newBoard);
  if (cell) {
    const [row, col] = cell;
    newBoard[row][col] = Math.random() < 0.9 ? 2 : 4;
  }
  return newBoard;
}

function initializeBoard(): Board {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
}

function slideRowLeft(row: Cell[]): { row: Cell[]; score: number; merged: boolean } {
  let score = 0;
  let merged = false;
  const filtered = row.filter(cell => cell !== null) as number[];
  const newRow: Cell[] = [];
  
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      newRow.push(mergedValue);
      score += mergedValue;
      merged = true;
      i++;
    } else {
      newRow.push(filtered[i]);
    }
  }
  
  while (newRow.length < GRID_SIZE) {
    newRow.push(null);
  }
  
  return { row: newRow, score, merged };
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newBoard: Board = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const result = slideRowLeft(board[row]);
    newBoard.push(result.row);
    totalScore += result.score;
    if (JSON.stringify(result.row) !== JSON.stringify(board[row])) {
      moved = true;
    }
  }
  
  return { board: newBoard, score: totalScore, moved };
}

function rotateBoard(board: Board): Board {
  const newBoard = createEmptyBoard();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newBoard[col][GRID_SIZE - 1 - row] = board[row][col];
    }
  }
  return newBoard;
}

function move(board: Board, direction: 'up' | 'down' | 'left' | 'right'): { board: Board; score: number; moved: boolean } {
  let currentBoard = board;
  let rotations = 0;
  
  if (direction === 'up') rotations = 3;
  else if (direction === 'right') rotations = 2;
  else if (direction === 'down') rotations = 1;
  
  for (let i = 0; i < rotations; i++) {
    currentBoard = rotateBoard(currentBoard);
  }
  
  const result = moveLeft(currentBoard);
  currentBoard = result.board;
  
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    currentBoard = rotateBoard(currentBoard);
  }
  
  return { board: currentBoard, score: result.score, moved: result.moved };
}

function hasWon(board: Board): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === 2048) {
        return true;
      }
    }
  }
  return false;
}

function hasMovesLeft(board: Board): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === null) {
        return true;
      }
      if (col < GRID_SIZE - 1 && board[row][col] === board[row][col + 1]) {
        return true;
      }
      if (row < GRID_SIZE - 1 && board[row][col] === board[row + 1][col]) {
        return true;
      }
    }
  }
  return false;
}

export default function GameBoard() {
  const [board, setBoard] = useState<Board>(initializeBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [tileIdCounter, setTileIdCounter] = useState(0);
  const [tiles, setTiles] = useState<TileData[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('2048-best-score');
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  useEffect(() => {
    const newTiles: TileData[] = [];
    let id = tileIdCounter;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (board[row][col] !== null) {
          newTiles.push({
            id: id++,
            value: board[row][col]!,
            row,
            col,
          });
        }
      }
    }
    setTiles(newTiles);
    setTileIdCounter(id);
  }, [board]);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (won || gameOver) return;
    
    const result = move(board, direction);
    
    if (result.moved) {
      const newBoard = addRandomTile(result.board);
      setBoard(newBoard);
      
      const newScore = score + result.score;
      setScore(newScore);
      
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('2048-best-score', newScore.toString());
      }
      
      if (!won && hasWon(newBoard)) {
        setWon(true);
      }
      
      if (!hasMovesLeft(newBoard)) {
        setGameOver(true);
      }
    }
  }, [board, score, bestScore, won, gameOver]);

  const restart = () => {
    setBoard(initializeBoard());
    setScore(0);
    setWon(false);
    setGameOver(false);
  };

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

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex gap-3 sm:gap-4 w-full justify-center">
        <div className="bg-amber-200 rounded-lg px-4 py-3 text-center min-w-[90px] shadow-sm border border-amber-300">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Score</div>
          <div className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{score}</div>
        </div>
        <div className="bg-amber-300 rounded-lg px-4 py-3 text-center min-w-[90px] shadow-sm border border-amber-400">
          <div className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-1">Best</div>
          <div className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{bestScore}</div>
        </div>
      </div>

      <div 
        className="relative bg-amber-700 rounded-xl p-2 shadow-2xl border-4 border-amber-800"
        style={{
          ['--tile-size' as string]: '64px',
          ['--gap' as string]: '8px',
          width: 'calc(var(--tile-size) * 4 + var(--gap) * 5)',
          height: 'calc(var(--tile-size) * 4 + var(--gap) * 5)',
        }}
      >
        <div className="grid grid-cols-4 gap-2 w-full h-full">
          {Array(16).fill(null).map((_, i) => (
            <div key={i} className="bg-amber-800/60 rounded-md w-full h-full" />
          ))}
        </div>
        
        <div className="absolute inset-2">
          {tiles.map((tile) => (
            <Tile
              key={tile.id}
              value={tile.value}
              row={tile.row}
              col={tile.col}
              isNew={tile.isNew}
              isMerged={tile.isMerged}
            />
          ))}
        </div>

        {won && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl mx-4 max-w-[280px]">
              <h2 className="text-4xl font-extrabold text-amber-600 mb-2">You Win!</h2>
              <p className="text-gray-600 mb-6 font-medium">You reached 2048!</p>
              <button
                onClick={() => setWon(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg min-h-[48px] flex items-center justify-center"
              >
                Continue Playing
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl mx-4 max-w-[280px]">
              <h2 className="text-4xl font-extrabold text-gray-800 mb-2">Game Over!</h2>
              <p className="text-gray-600 mb-6 font-medium">No more moves available.</p>
              <button
                onClick={restart}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg min-h-[48px] flex items-center justify-center"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={restart}
        className="bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg min-h-[48px] min-w-[140px] text-lg"
      >
        New Game
      </button>

      <div className="text-center text-gray-600 text-sm max-w-xs leading-relaxed px-4">
        <p className="mb-1"><strong className="text-gray-800">HOW TO PLAY:</strong> Use <strong className="text-gray-800">arrow keys</strong> to move tiles.</p>
        <p>Merge identical numbers to reach <strong className="text-gray-800">2048</strong>!</p>
      </div>

      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes merge {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 0.2s ease-out forwards;
        }
        .animate-merge {
          animation: merge 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}