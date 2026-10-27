// layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { ToastProvider } from "@/components/ToastProvider";
import { LangProvider } from "@/components/site/LangProvider";
import { getLang } from "@/lib/i18n-server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // Base for absolute URLs in metadata (canonical, social previews)
  metadataBase: new URL(SITE_URL),
  title: "3LM Solutions",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // French by default; English when the visitor picked it with the FR | EN switch (cookie)
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
      </head>
      <body>
        <LangProvider lang={lang}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </LangProvider>
      </body>
    </html>
  );
}
