import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { cn } from "~/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});
const geistHeading = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-heading",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Formblox",
  description: "Build and share forms in minutes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("dark", geistSans.variable, geistHeading.variable, geistMono.variable)}
    >
      <body>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
