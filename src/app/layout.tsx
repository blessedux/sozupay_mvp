import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SozuPay Dashboard",
  description: "Merchant dashboard – one wallet, one source of truth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
