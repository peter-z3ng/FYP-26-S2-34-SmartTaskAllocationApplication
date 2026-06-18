import "./globals.css";
import { AppearanceProvider } from "@/components/appearance/AppearanceContext";

/* eslint-disable @next/next/google-font-display, @next/next/no-page-custom-font */

const appearanceInitScript = `
  (function () {
    try {
      var raw = window.localStorage.getItem("optima-appearance");
      var appearance = raw ? JSON.parse(raw) : null;
      var theme = appearance && appearance.theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch (error) {
      document.documentElement.dataset.theme = "light";
      document.documentElement.classList.remove("dark");
    }
  })();
`;

export const metadata = {
  title: "Optima",
  description: "Smart task allocation application",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=left_panel_close%2Cleft_panel_open%2Cperson_add%2Cproductivity&display=block"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
