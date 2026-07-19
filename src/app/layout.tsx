import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import AppProviders from "@/components/AppProviders";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

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
    <html lang="en" className={`${archivo.variable} ${hanken.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
