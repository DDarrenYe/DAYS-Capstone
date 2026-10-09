import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  description:
    "Lane 2 grading dashboard: log AI iterations, visualise the process",
  title: "AI-Interaction Analytics",
};

const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html
    lang="en"
    className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
  >
    <body className="flex min-h-full flex-col">{children}</body>
  </html>
);

export default RootLayout;
