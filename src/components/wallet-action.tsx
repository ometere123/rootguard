"use client";

import { useState } from "react";
import { CONTRACT_ADDRESS, waitFinalized, writeContract, writeRootGuard } from "@/lib/rootguard";
import type { CalldataEncodable } from "genlayer-js/types";
import type { Tx } from "@/components/transaction-list";

export function useWalletAction(onFinalized?: () => Promise<void> | void) {
  const [wallet, setWallet] = useState<`0x${string}`>();
  const [error, setError] = useState<string>();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  async function connect() {
    if (!window.ethereum) throw new Error("No injected GenLayer-compatible wallet was found.");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as `0x${string}`[];
    if (!accounts[0]) throw new Error("Wallet returned no account.");
    setWallet(accounts[0]); return accounts[0];
  }
  async function send(label: string, functionName: string, args: CalldataEncodable[], address?: `0x${string}`) {
    try {
      setError(undefined);
      const account = wallet ?? await connect();
      const destination = address ?? CONTRACT_ADDRESS;
      if (!destination) throw new Error("RootGuard contract not configured.");
      const hash = address ? await writeContract(address, account, functionName, args) : await writeRootGuard(account, functionName, args);
      setTransactions((items) => [{ hash, label, status: "SUBMITTED", triggered: [] }, ...items]);
      const result = await waitFinalized(account, hash);
      setTransactions((items) => items.map((item) => item.hash === hash ? { ...item, status: "FINALIZED", triggered: result.triggered } : item));
      await onFinalized?.();
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Transaction failed.";
      setError(detail);
      setTransactions((items) => items.map((item) => item.status === "SUBMITTED" ? { ...item, status: "FAILED" } : item));
    }
  }
  return { wallet, error, transactions, send };
}
