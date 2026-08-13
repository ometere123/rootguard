"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { readContract } from "@/lib/rootguard";

type Profile = Record<string, string[]>;
type WalletContextValue = { address?: `0x${string}`; connected: boolean; connect: () => Promise<`0x${string}`>; disconnect: () => void; error?: string; profile?: Profile };
const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}`>(); const [error, setError] = useState<string>(); const [profile, setProfile] = useState<Profile>();
  async function connect() { try { if (!window.ethereum) throw new Error("No injected GenLayer-compatible wallet was found."); const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as `0x${string}`[]; if (!accounts[0]) throw new Error("Wallet returned no account."); setAddress(accounts[0]); setError(undefined); return accounts[0]; } catch (cause) { const message = cause instanceof Error ? cause.message : "Wallet connection failed."; setError(message); throw new Error(message); } }
  function disconnect() { setAddress(undefined); setProfile(undefined); setError(undefined); }
  useEffect(() => { if (!address) return; void readContract<Profile>("get_profile", [address]).then(setProfile).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load wallet profile.")); }, [address]);
  return <WalletContext.Provider value={{ address, connected: Boolean(address), connect, disconnect, error, profile }}>{children}</WalletContext.Provider>;
}
export function useWallet() { const context = useContext(WalletContext); if (!context) throw new Error("WalletProvider is missing."); return context; }
