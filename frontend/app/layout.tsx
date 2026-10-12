// layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "3LM Solutions ",
  description: "Studio tech basé à Ariana, Tunisie. Nous concevons et déployons des plateformes web, applications mobiles, agents IA et infrastructures cloud pour des entreprises qui veulent avancer vite, sans sacrifier la fiabilité.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
