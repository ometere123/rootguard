import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RootGuard | Consensus Upgrade Control",
  description: "A GenLayer control plane for auditable intelligent-contract upgrades.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
