import './globals.css';
export const metadata = {
  title: '2048 Game',
  description: 'Classic 2048 puzzle game',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 antialiased">{children}</body>
    </html>
  );
}