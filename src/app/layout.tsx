/**
 * Root Layout Component
 * 
 * The root layout wraps all pages in the application.
 * Sets up fonts, global context providers, and HTML structure.
 * 
 * Context Providers:
 * - ThemeProvider: Manages light/dark theme
 * - SearchProvider: Manages global search state
 * - BasketProvider: Manages shopping cart state
 * - CreatePostProvider: Manages create post modal state
 * - MessagingProvider: Manages messaging popup state and unread counts
 * 
 * Note: This is a server component - all state management providers
 * are client components defined in their respective files.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { BasketProvider } from "@/contexts/BasketContext";
import { CreatePostProvider } from "@/contexts/CreatePostContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import FloatingMessageButton from "@/components/messages/FloatingMessageButton";

// Configure Geist font family for sans-serif text
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Configure Geist Mono font family for monospace text
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata for SEO and browser display
export const metadata: Metadata = {
  title: "Repacked",
  description: "Second Hand Marketplace",
};

/**
 * RootLayout Component
 * 
 * Provides global context providers and sets up application fonts.
 * 
 * @param children - Child pages/components to render
 */
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
        {/* Context providers are nested - inner providers have access to outer ones */}
        <ThemeProvider>
          <SearchProvider>
            <BasketProvider>
              <CreatePostProvider>
                <MessagingProvider>
                  {children}
                  {/* Floating message button - bottom right */}
                  <FloatingMessageButton />
                </MessagingProvider>
              </CreatePostProvider>
            </BasketProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
