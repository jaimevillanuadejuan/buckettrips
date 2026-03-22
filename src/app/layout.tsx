import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header/Header";
import SessionProvider from "../components/SessionProvider";
import BackendWakeUp from "../components/BackendWakeUp/BackendWakeUp";

export const metadata: Metadata = {
  title: "BucketTrips",
  description: "AI-powered travel planner with OpenAI integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <BackendWakeUp />
          <Header />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
