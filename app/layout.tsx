import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SocketProvider from "@/providers/SocketProviders";
import Navbar from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: "Video Chat",
  description: "Video call",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <SocketProvider>
            <main className="flex flex-col min-h-screen bg-secondary">
              <Navbar />
              {children}
            </main>
          </SocketProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
