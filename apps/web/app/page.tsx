import type { Metadata } from "next";
import { LandingPage } from "./_components/landing/landing-page";

export const metadata: Metadata = {
  title: "FormBlox | Forms that ask back",
  description: "Build conversational forms that feel like a chat.",
};

export default function Home() {
  return <LandingPage />;
}
