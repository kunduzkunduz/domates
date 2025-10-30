import type { Metadata } from "next";
import "./globals.css";
import { ProjectSelector } from "@/components/ProjectSelector";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Domates",
  description: "A client-side tool for Behavior-Driven Development.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <html lang="en" className="light">
          <body className="bg-gray-50 min-h-screen">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-2xl">🍅</span>
                      </div>
                  <h1 className="text-xl font-semibold text-[#11235]">Domates</h1>
                </Link>
                <ProjectSelector />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}