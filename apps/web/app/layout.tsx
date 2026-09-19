import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";

import "./globals.css";

export const metadata: Metadata = {
  title: "MILO_COMM",
  description: "کانال گفت‌وگوی پروژه مایلو",
  icons: { icon: "/milo-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
