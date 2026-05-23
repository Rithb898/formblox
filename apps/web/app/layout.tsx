import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { cn } from "~/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Formblox",
  description: "Build and share forms in minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("dark", inter.variable, interHeading.variable, geistMono.variable)}
    >
      <body className={cn(geistSans.variable, geistMono.variable)}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
