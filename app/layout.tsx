import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WooSox Walk Tracker",
  description: "Worcester Red Sox pitcher walks by category — 2026 season.",
};

const themeBootstrap = `
(function(){
  try {
    var t = localStorage.getItem('woosox.theme.v1');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
