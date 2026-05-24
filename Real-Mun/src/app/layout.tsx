import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import DiasAI from "@/components/DiasAI";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://real-mun.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Real-MUN — Train for Model UN with AI",
    template: "%s · Real-MUN",
  },
  description:
    "Walk into your next MUN already knowing how it'll feel. AI-graded position papers, 1-on-1 coaching, and full 30-minute mock conferences with AI delegates. Free during launch.",
  metadataBase: new URL(SITE_URL),
  keywords: [
    "Model UN",
    "MUN training",
    "position paper feedback",
    "mock conference",
    "AI delegates",
    "parliamentary procedure",
    "MUN coaching",
    "Real-MUN",
  ],
  authors: [{ name: "Ayaan Dhuria" }],
  openGraph: {
    title: "Real-MUN — Train for Model UN with AI",
    description:
      "Walk into your next MUN already knowing how it'll feel. AI-graded position papers, 1-on-1 coaching, and full 30-minute mock conferences with AI delegates.",
    url: SITE_URL,
    siteName: "Real-MUN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real-MUN — Train for Model UN with AI",
    description:
      "Walk into your next MUN already knowing how it'll feel. Free during launch.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f17" },
  ],
};

const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('realmun_theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        <DiasAI />
      </body>
    </html>
  );
}
