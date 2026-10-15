import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Юнитка — калькулятор юнит-экономики",
  description: "Расчёт ключевых показателей юнит-экономики, окупаемости рекламы и точки безубыточности.",
  icons: {
    icon: "/supplied-logo.webp",
    shortcut: "/supplied-logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
