import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { BasketProvider } from "@/contexts/BasketContext";
import { CreatePostProvider } from "@/contexts/CreatePostContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repacked - Modern Marketplace",
  description: "A beautiful frosted glass resale marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SearchProvider>
            <BasketProvider>
              <CreatePostProvider>
                {children}
              </CreatePostProvider>
            </BasketProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
