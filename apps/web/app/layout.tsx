import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "tsucast - Turn Any Article Into a Podcast",
  description:
    "Convert any web article into a podcast using AI text-to-speech. Paste a URL, select a voice, and listen in under 10 seconds.",
  keywords: [
    "podcast",
    "text-to-speech",
    "article to audio",
    "TTS",
    "AI voice",
    "listen to articles",
  ],
  authors: [{ name: "tsucast" }],
  openGraph: {
    title: "tsucast - Turn Any Article Into a Podcast",
    description:
      "Convert any web article into a podcast using AI text-to-speech. Paste a URL, select a voice, and listen in under 10 seconds.",
    url: "https://tsucast.app",
    siteName: "tsucast",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "tsucast - Turn Any Article Into a Podcast",
    description:
      "Convert any web article into a podcast using AI text-to-speech.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
