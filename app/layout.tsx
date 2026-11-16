import type { Metadata } from "next";
import { Anuphan, Geist_Mono } from "next/font/google";
import AgentationDevTools from "./agentation";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ฟังเพลงในแบบของคุณ",
  description: "เครื่องเล่นเพลงที่เล่นไฟล์เสียงจากอุปกรณ์ของคุณ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AgentationDevTools />
      </body>
    </html>
  );
}
