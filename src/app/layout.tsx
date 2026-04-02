import type { Metadata } from "next";
import { Providers } from "./providers";
import { ToastContainer } from "@/components/ui/ToastContainer";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentimentPerps — Trade the Mood",
  description:
    "Real-time social sentiment trading on Pacifica perpetual futures. Spot viral tokens before the crowd, trade with conviction, climb the leaderboard.",
  keywords: ["sentiment", "trading", "perpetuals", "crypto", "defi", "pacifica"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary selection:text-foreground">
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
