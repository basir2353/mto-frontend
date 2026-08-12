import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "@/lib/theme/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoveThisOut",
  description: "Move anything, right now.",
  icons: {
    icon: "/mto-icon.png",
    apple: "/mto-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
