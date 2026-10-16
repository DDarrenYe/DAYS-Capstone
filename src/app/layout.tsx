import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Newsreader } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description:
    "Students log and critique every AI answer they use. Graders see the thinking behind the work, and where a critique ran thin.",
  title: {
    default: "Pentimento · AI-Interaction Analytics",
    template: "%s · Pentimento",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f4f0",
};

const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html
    lang="en"
    className={`${inter.variable} ${newsreader.variable} ${geistMono.variable} h-full`}
  >
    <body className="min-h-full">{children}</body>
  </html>
);

export default RootLayout;
