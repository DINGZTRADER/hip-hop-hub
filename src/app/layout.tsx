import type { Metadata } from "next";
import "./globals.css";
import { AudioProvider } from "@/components/audio/AudioContext";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  title: "Hip Hop Hub | Uganda's Strictly Hip-Hop Marketplace & Virtual Cypher",
  description:
    "Discover and buy original Ugandan Hip-Hop music directly from artists with MTN MoMo and Airtel Money at Hip Hop Hub. Stream 10-second rotating video reels, explore virtual DJ booth zones, and book emcees for weddings and events.",
  keywords: [
    "Uganda Hip Hop",
    "Luga Flow",
    "Navio",
    "GNL Zamba",
    "Feffe Bussi",
    "Judas Rapknowledge",
    "Uganda music download",
    "MTN Mobile Money music",
    "Airtel Money music",
    "Kampala hip hop",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col selection:bg-ug-gold selection:text-black">
        <AudioProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <GlobalAudioPlayer />
          <CheckoutModal />
        </AudioProvider>
      </body>
    </html>
  );
}
