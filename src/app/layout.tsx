import type { Metadata } from "next";
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
    "Lane 2 grading dashboard: students log and critique their AI use, graders see the process at a glance",
  title: "Pentimento · AI-Interaction Analytics",
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
