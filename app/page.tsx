export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 bg-neutral-100">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 sm:mb-8 tracking-tight drop-shadow-sm">
          2048
        </h1>
        <div className="w-full flex justify-center">
          {/* GameBoard will handle its own responsive sizing */}
          <GameBoard />
        </div>
      </div>
    </main>
  );
}

import GameBoard from './components/GameBoard';