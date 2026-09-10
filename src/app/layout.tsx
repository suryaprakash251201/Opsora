import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
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
  themeColor: "#09090b",
  colorScheme: "dark",
};

/**
 * Inline pre-hydration script — reads the persisted theme from localStorage
 * (if any) and applies it before React mounts, preventing a flash of the
 * default dark theme when the user has chosen a different one.
 */
const themeBootstrapScript = `
(function () {
  try {
    var raw = localStorage.getItem("opsora.theme");
    if (!raw) return;
    var parsed = JSON.parse(raw);
    var theme = parsed && parsed.state && parsed.state.theme;
    if (theme && /^(opsora|aurora|abyss|forest|solar)$/.test(theme)) {
      document.documentElement.dataset.theme = theme;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
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
