import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { OddsStoreProvider } from "@/providers/OddsStoreProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Fortuna - Real-Time Odds Intelligence",
  description: "Professional sports betting decision support system with real-time odds, edge calculations, and sharp consensus.",
  keywords: ["sports betting", "odds", "edge", "sharp", "NBA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary`}>
        <OddsStoreProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </OddsStoreProvider>
      </body>
    </html>
  );
}





