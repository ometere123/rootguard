"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";

export function AppHeader() {
  const { address, connect: connectWallet, disconnect, error, profile } = useWallet(); const path = usePathname();
  async function handleConnect() {
    try {
      await connectWallet();
    } catch { /* Shared provider exposes the connection error. */ }
  }
  const active = (href: string) => href === "/" ? path === "/" : path.startsWith(href);
  const roles = profile ? [...(profile.stewarded_targets ?? []).map((id) => `STEWARD · ${id}`), ...(profile.maintained_targets ?? []).map((id) => `MAINTAINER · ${id}`), ...(profile.submitted_proposals ?? []).map((id) => `SUBMITTED · ${id}`)] : [];
  return <><header className="rg-header"><Link className="rg-mark" href="/"><ShieldCheck size={24}/><span>ROOTGUARD</span></Link><nav><Link className={active("/") ? "active-nav" : ""} href="/">Dashboard</Link><Link className={active("/targets") ? "active-nav" : ""} href="/targets">Targets</Link><Link className={active("/proposals") ? "active-nav" : ""} href="/proposals">Proposals</Link></nav><div className="rg-wallet">{address ? <><code>{address.slice(0, 8)}...{address.slice(-6)}</code>{roles.length ? <span className="role-hint">{roles[0]}</span> : null}<button onClick={disconnect}>Disconnect</button></> : <button onClick={handleConnect}>Connect wallet</button>}</div></header>{error && <div className="rg-alert">{error}</div>}</>;
}
