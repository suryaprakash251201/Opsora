import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { THEMES, THEME_COLORS } from "@/lib/theme-config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Opsora",
    template: "%s · Opsora",
  },
  description: "Personal command center — what needs your attention now.",
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.opsora,
  colorScheme: "dark light",
};

/**
 * Inline pre-hydration script — reads the persisted theme from localStorage
 * (if any) and applies it before React mounts, preventing a flash of the
 * wrong theme. Theme IDs and colors are injected from the shared theme
 * catalog (src/lib/theme-config.ts), so adding a theme never means editing
 * this script by hand. Also fixes color-scheme and the theme-color meta so
 * light themes boot correctly.
 */
const themeBootstrapScript = `
(function () {
  try {
    var raw = localStorage.getItem("opsora.theme");
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var theme = parsed && parsed.state && parsed.state.theme;
    var modes = ${JSON.stringify(
      Object.fromEntries(THEMES.map((t) => [t.id, t.mode])),
    )};
    var colors = ${JSON.stringify(THEME_COLORS)};
    if (!(theme in modes)) return;
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = modes[theme];
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && colors[theme]) meta.setAttribute("content", colors[theme]);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="bg-background text-foreground min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
