import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Anchor — AI Employee for Your Business",
  description:
    "Anchor is your AI-powered employee that handles customer conversations, captures leads, and provides business insights — 24/7.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-[#0a0a0f] text-slate-100">
        {children}
      </body>
    </html>
  );
}
