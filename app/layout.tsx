import Navbar from "@/components/Navbar";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import IdleTimerComponent from "@/components/IdleTimer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily Sales Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        <IdleTimerComponent />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
