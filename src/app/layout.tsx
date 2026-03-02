import type { Metadata } from "next";
import "./globals.css";
import { LazyPrivyWrapper } from "@/components/LazyPrivyWrapper";

export const metadata: Metadata = {
  title: "SozuPay Dashboard",
  description: "Merchant dashboard – EMPRENDE / MUJERES 2000.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <LazyPrivyWrapper>{children}</LazyPrivyWrapper>
      </body>
    </html>
  );
}
