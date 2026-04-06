'use client';

interface TileProps {
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

const tileColors: Record<number, string> = {
  2: 'bg-amber-100 text-gray-900',
  4: 'bg-amber-200 text-gray-900',
  8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white',
  32: 'bg-orange-600 text-white',
  64: 'bg-orange-700 text-white',
  128: 'bg-yellow-400 text-white',
  256: 'bg-yellow-500 text-white',
  512: 'bg-yellow-600 text-white',
  1024: 'bg-amber-500 text-white',
  2048: 'bg-amber-600 text-white',
};

export default function Tile({ value, row, col, isNew, isMerged }: TileProps) {
  const colorClass = tileColors[value] || 'bg-gray-800 text-white';
  const fontSize = value >= 1000 ? 'text-lg sm:text-xl' : value >= 100 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl';

  // Calculate position based on CSS variables from parent
  const translateX = `calc(${col} * (var(--tile-size) + var(--gap)))`;
  const translateY = `calc(${row} * (var(--tile-size) + var(--gap)))`;

  return (
    <div
      className={`
        absolute rounded-md flex items-center justify-center
        font-bold ${colorClass} ${fontSize}
        transition-all duration-150 ease-in-out shadow-sm
        ${isNew ? 'animate-pop' : ''}
        ${isMerged ? 'animate-merge' : ''}
      `}
      style={{
        width: 'var(--tile-size)',
        height: 'var(--tile-size)',
        transform: `translate(${translateX}, ${translateY})`,
      }}
    >
      {value}
    </div>
  );
}