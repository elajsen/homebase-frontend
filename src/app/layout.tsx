// src/app/layout.tsx

import './globals.css'; // You can create this file for global styles

export const metadata = {
  title: 'My Next.js App',
  description: 'A simple Next.js application.',
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
