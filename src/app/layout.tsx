import type { Metadata } from "next";
import "./globals.css";
import { AudioProvider } from "@/components/audio/AudioContext";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hip-hop-hub-vki9.vercel.app"),
  title: "Hip Hop Hub | Uganda's Strictly Hip-Hop Marketplace & Virtual Cypher",
  description:
    "Discover and buy original Ugandan Hip-Hop music directly from artists with MTN MoMo and Airtel Money at Hip Hop Hub. Stream 10-second rotating video reels, explore virtual DJ booth zones, and book emcees for weddings and events.",
  openGraph: {
    title: "Hip-Hop-Hub",
    description: "Uganda's hip-hop marketplace and virtual cypher.",
    images: [{ url: "/brand/hip-hop-hub-social.png", width: 1200, height: 630, alt: "Hip-Hop-Hub logo" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/hip-hop-hub-social.png"],
  },
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
