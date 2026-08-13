"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const [wallet, setWallet] = useState<`0x${string}`>();
  const [error, setError] = useState<string>();
  async function connect() {
    try {
      if (!window.ethereum) throw new Error("No injected GenLayer-compatible wallet was found.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as `0x${string}`[];
      if (!accounts[0]) throw new Error("Wallet returned no account.");
      setWallet(accounts[0]);
      setError(undefined);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Wallet connection failed."); }
  }
  return <><header className="rg-header"><Link className="rg-mark" href="/"><ShieldCheck size={24}/><span>ROOTGUARD</span></Link><nav><Link href="/">Dashboard</Link><Link href="/targets">Targets</Link><Link href="/proposals">Proposals</Link></nav><div className="rg-wallet">{wallet ? <><code>{wallet.slice(0, 8)}...{wallet.slice(-6)}</code><button onClick={() => setWallet(undefined)}>Disconnect</button></> : <button onClick={connect}>Connect wallet</button>}</div></header>{error && <div className="rg-alert">{error}</div>}</>;
}
