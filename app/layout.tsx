import './globals.css';
export const metadata = {
  title: '2048 Game',
  description: 'A classic 2048 puzzle game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf8ef] text-[#776e65] antialiased">{children}</body>
    </html>
  );
}