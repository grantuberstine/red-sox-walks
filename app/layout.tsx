import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WooSox Walk Tracker",
  description: "Worcester Red Sox pitcher walks, strikeouts & velocity — 2026 season.",
  applicationName: "WooSox",
  appleWebApp: {
    capable: true,
    title: "WooSox",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
  ],
};

const themeBootstrap = `
(function(){
  // Default to dark on first visit; user can toggle to light explicitly.
  try {
    var t = localStorage.getItem('woosox.theme.v1');
    if (t !== 'light') document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
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
